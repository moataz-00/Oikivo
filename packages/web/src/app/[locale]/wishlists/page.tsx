'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { Plus, Heart, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWishlists, useCreateWishlist, useDeleteWishlist } from '@/hooks/useWishlist';
import { useAuth } from '@/hooks/useAuth';
import { Spinner, FullPageSpinner } from '@/components/ui/Spinner';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from '@/components/ui/Toast';
import { getImageUrl } from '@/lib/utils';
import type { Wishlist } from '@/types';

export default function WishlistsPage() {
  const t = useTranslations('wishlists');
  const locale = useLocale();
  const router = useRouter();
  const { isLoggedIn, hasHydrated } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const [listName, setListName] = useState('');
  const [wishlistToDelete, setWishlistToDelete] = useState<Wishlist | null>(null);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isLoggedIn) router.push(`/${locale}/login`);
  }, [hasHydrated, isLoggedIn, locale, router]);

  const { data: wishlists, isLoading } = useWishlists();
  const createWishlist = useCreateWishlist();
  const deleteWishlist = useDeleteWishlist();

  const handleCreate = async () => {
    if (!listName.trim()) return;
    await createWishlist.mutateAsync(listName.trim());
    setListName('');
    setCreateOpen(false);
    toast.success(t('wishlistCreated'));
  };

  const handleConfirmDelete = () => {
    if (!wishlistToDelete) return;
    deleteWishlist.mutate(wishlistToDelete.id, {
      onSuccess: () => {
        toast.success(t('wishlistDeleted'));
        setWishlistToDelete(null);
      },
      onError: () => {
        toast.error(t('deleteFailed'));
        setWishlistToDelete(null);
      },
    });
  };

  if (!hasHydrated || !isLoggedIn) return <FullPageSpinner />;

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-semibold text-neutral-900">{t('myWishlists')}</h1>
        <Button
          onClick={() => setCreateOpen(true)}
          variant="outline"
          size="md"
          className="gap-1.5"
        >
          <Plus className="h-4 w-4" />
          {t('createWishlist')}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : !wishlists || wishlists.length === 0 ? (
        <motion.div
          className="flex flex-col items-center py-20 gap-5 text-center"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
          >
            <Heart className="h-16 w-16 text-neutral-300" />
          </motion.div>
          <h2 className="text-xl font-semibold text-neutral-900">{t('noWishlists')}</h2>
          <p className="text-neutral-500 max-w-sm">{t('noWishlistsDesc')}</p>
          <Link
            href={`/${locale}/s`}
            className="btn-brand rounded-xl px-6 py-3 text-sm"
          >
            {t('startExploring')}
          </Link>
        </motion.div>
      ) : (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
        >
          <AnimatePresence>
            {wishlists.map((wishlist) => (
              <motion.div
                key={wishlist.id}
                layout
                className="group relative"
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } } }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                whileHover={{ y: -4 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              >
                <Link href={`/${locale}/wishlists/${wishlist.uuid}`}>
                  {/* Cover image grid */}
                  <div className="relative overflow-hidden rounded-2xl aspect-square bg-neutral-200">
                    {wishlist.count === 0 ? (
                      <div className="h-full w-full flex items-center justify-center bg-neutral-100">
                        <Heart className="h-10 w-10 text-neutral-300" />
                      </div>
                    ) : wishlist.coverImage ? (
                      <Image
                        src={getImageUrl(wishlist.coverImage)}
                        alt={wishlist.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="h-full w-full grid grid-cols-2 gap-0.5">
                        {wishlist.properties?.slice(0, 4).map((p, idx) => {
                          const img = p.images?.[0]?.url;
                          return (
                            <div key={idx} className="relative overflow-hidden bg-neutral-200">
                              {img && (
                                <Image
                                  src={getImageUrl(img)}
                                  alt=""
                                  fill
                                  className="object-cover"
                                />
                              )}
                            </div>
                          );
                        })}
                        {Array.from({ length: Math.max(0, 4 - (wishlist.properties?.length ?? 0)) }).map(
                          (_, i) => (
                            <div key={`empty-${i}`} className="bg-neutral-200" />
                          )
                        )}
                      </div>
                    )}
                  </div>
                </Link>

                {/* Info */}
                <div className="mt-3 flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-neutral-900">{wishlist.name}</h3>
                    <p className="text-sm text-neutral-500">
                      {wishlist.count} {wishlist.count === 1 ? t('property') : t('properties')}
                    </p>
                  </div>
                  <button
                    onClick={() => setWishlistToDelete(wishlist)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Create modal */}
      <Modal
        open={createOpen}
        onOpenChange={setCreateOpen}
        title={t('createWishlist')}
        variant="centered"
      >
        <div className="space-y-4">
          <Input
            label={t('listName')}
            placeholder={t('namePlaceholder')}
            value={listName}
            onChange={(e) => setListName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          <Button
            onClick={handleCreate}
            isLoading={createWishlist.isPending}
            disabled={!listName.trim()}
            fullWidth
          >
            {t('create')}
          </Button>
        </div>
      </Modal>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {wishlistToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setWishlistToDelete(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
            >
              <div className="flex flex-col items-center gap-3 mb-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
                  <Trash2 className="h-5 w-5 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 text-center">
                  {t('deleteWishlist')}
                </h3>
                <p className="text-sm text-neutral-500 text-center">
                  {t('deleteWishlistConfirm', { name: wishlistToDelete.name })}
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => setWishlistToDelete(null)}
                >
                  {t('cancel')}
                </Button>
                <Button
                  fullWidth
                  className="bg-red-500 hover:bg-red-600 text-white border-red-500 hover:border-red-600"
                  isLoading={deleteWishlist.isPending}
                  onClick={handleConfirmDelete}
                >
                  {t('delete')}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}