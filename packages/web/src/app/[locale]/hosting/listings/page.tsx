'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, BadgeCheck, Archive, Home, Compass, Edit, Globe, CheckSquare, Square, X, CheckCheck, Trash2 } from 'lucide-react';
import { propertiesApi, experiencesApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { ListingCard } from '@/components/hosting/ListingCard';
import { Spinner, FullPageSpinner } from '@/components/ui/Spinner';
import { toast } from '@/components/ui/Toast';
import type { Experience } from '@/types';

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] as const } },
};

function ExperienceCard({ exp, locale }: { exp: Experience; locale: string }) {
  const coverPhoto = exp.photos?.find((p) => p.isCover) ?? exp.photos?.[0];
  const statusColor =
    exp.status === 'published' ? 'bg-emerald-100 text-emerald-700' :
    exp.status === 'draft' ? 'bg-amber-100 text-amber-700' :
    'bg-neutral-100 text-neutral-600';

  return (
    <div className="group rounded-2xl border border-neutral-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="relative h-44 bg-neutral-100 overflow-hidden">
        {coverPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverPhoto.url} alt={exp.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Compass className="h-10 w-10 text-neutral-300" />
          </div>
        )}
        <span className={`absolute top-2 right-2 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusColor}`}>
          {exp.status}
        </span>
      </div>
      <div className="p-4">
        <p className="font-semibold text-neutral-900 truncate">{exp.title}</p>
        <p className="text-xs text-neutral-500 mt-0.5 truncate">{exp.city}, {exp.country}</p>
        <div className="flex items-center justify-between mt-3">
          <p className="text-sm font-semibold text-neutral-800">${exp.pricePerPerson}<span className="font-normal text-neutral-400 text-xs"> / person</span></p>
          <div className="flex gap-2">
            {exp.status === 'draft' && (
              <Link href={`/${locale}/hosting/experiences/${exp.id}/edit`}
                className="flex items-center gap-1 text-xs rounded-lg border border-neutral-200 px-2.5 py-1.5 text-neutral-600 hover:bg-neutral-50 transition-colors">
                <Globe className="h-3.5 w-3.5" /> Publish
              </Link>
            )}
            <Link href={`/${locale}/hosting/experiences/${exp.id}/edit`}
              className="flex items-center gap-1 text-xs rounded-lg border border-neutral-200 px-2.5 py-1.5 text-neutral-600 hover:bg-neutral-50 transition-colors">
              <Edit className="h-3.5 w-3.5" /> Edit
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HostListingsPage() {
  const t = useTranslations('hosting');
  const locale = useLocale();
  const router = useRouter();
  const { isLoggedIn, isHost, hasHydrated } = useAuth();
  const [activeTab, setActiveTab] = useState<'properties' | 'experiences'>('properties');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const queryClient = useQueryClient();

  const toggleSelect = (id: number) =>
    setSelectedIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });

  const selectAll = () => setSelectedIds(new Set((listings ?? []).map((l) => l.id)));
  const clearSelection = () => setSelectedIds(new Set());

  const { mutate: runBulkAction, isPending: isBulking } = useMutation({
    mutationFn: ({ ids, action }: { ids: number[]; action: 'publish' | 'archive' | 'delete' }) =>
      propertiesApi.bulkAction(ids, action),
    onSuccess: (res, { action }) => {
      queryClient.invalidateQueries({ queryKey: ['host-listings'] });
      queryClient.invalidateQueries({ queryKey: ['archived-listings'] });
      const verb = action === 'publish' ? 'published' : action === 'archive' ? 'archived' : 'deleted';
      toast.success(`${res.succeeded.length} listing${res.succeeded.length !== 1 ? 's' : ''} ${verb}${res.failed.length > 0 ? ` (${res.failed.length} failed)` : ''}`);
      clearSelection();
    },
    onError: () => toast.error('Bulk action failed. Please try again.'),
  });

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isLoggedIn) router.push(`/${locale}/login`);
    else if (!isHost) router.push(`/${locale}`);
  }, [hasHydrated, isLoggedIn, isHost, locale, router]);

  const { data: archivedListings } = useQuery({
    queryKey: ['archived-listings'],
    queryFn: propertiesApi.getArchivedListings,
    enabled: isLoggedIn && isHost,
    staleTime: 5 * 60 * 1000,
  });

  const { data: listings, isLoading } = useQuery({
    queryKey: ['host-listings'],
    queryFn: propertiesApi.getHostListings,
    enabled: isLoggedIn && isHost,
    staleTime: 5 * 60 * 1000,
  });

  const { data: experiences, isLoading: expLoading } = useQuery({
    queryKey: ['host-experiences'],
    queryFn: experiencesApi.getHostListings,
    enabled: isLoggedIn && isHost,
    staleTime: 5 * 60 * 1000,
  });

  if (!hasHydrated || !isLoggedIn || !isHost) return <FullPageSpinner />;

  const publishedCount = (listings ?? []).filter((l) => l.status === 'published').length;
  const draftCount = (listings ?? []).filter((l) => l.status === 'draft').length;
  const publishedExpCount = (experiences ?? []).filter((e) => e.status === 'published').length;
  const draftExpCount = (experiences ?? []).filter((e) => e.status === 'draft').length;

  const tabs = [
    { id: 'properties' as const, label: 'Homes', icon: Home, count: listings?.length ?? 0 },
    { id: 'experiences' as const, label: 'Experiences', icon: Compass, count: experiences?.length ?? 0 },
  ];

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_5%,rgba(79,70,229,0.09),transparent_35%),radial-gradient(circle_at_90%_0%,rgba(14,116,144,0.07),transparent_32%)]" />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 py-10">

        {/* Header card */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.38 }}
          className="mb-8 rounded-3xl border border-neutral-200 bg-white p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700">
                🏘️ Portfolio control room
              </p>
              <h1 className="mt-3 text-3xl font-semibold text-neutral-900">{t('listings')}</h1>
              <p className="mt-1 text-sm text-neutral-500">Manage quality, publish status, and guest readiness for every listing.</p>
            </div>
            <div className="flex items-center gap-3">
              <Link href={`/${locale}/hosting/listings/archive`}
                className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors shadow-sm">
                <Archive className="h-4 w-4 text-neutral-500" />
                Archive{(archivedListings?.length ?? 0) > 0 && (
                  <span className="ml-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-xs font-semibold text-amber-700">
                    {archivedListings!.length}
                  </span>
                )}
              </Link>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link
                  href={activeTab === 'properties' ? `/${locale}/hosting/listings/new` : `/${locale}/hosting/experiences/new`}
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors shadow-sm">
                  <Plus className="h-4 w-4" />
                  {activeTab === 'properties' ? t('newListing') : 'New Experience'}
                </Link>
              </motion.div>
            </div>
          </div>

          {/* Stats row */}
          {activeTab === 'properties' ? (
            <motion.div variants={stagger} initial="hidden" animate="show" className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { emoji: '🏠', label: 'Total listings', value: listings?.length ?? 0, cls: 'bg-neutral-50', href: undefined },
                { emoji: '✅', label: 'Published', value: publishedCount, cls: 'bg-emerald-50', href: undefined },
                { emoji: '📝', label: 'Drafts', value: draftCount, cls: 'bg-amber-50', href: undefined },
                { emoji: '🗂️', label: 'Archived', value: archivedListings?.length ?? 0, cls: 'bg-neutral-100', href: `/${locale}/hosting/listings/archive` },
              ].map(({ emoji, label, value, cls, href }) => {
                const inner = (
                  <motion.div key={label} variants={fadeUp} whileHover={{ y: -2, transition: { duration: 0.15 } }}
                    className={`rounded-2xl p-4 ${cls} ${href ? 'cursor-pointer hover:ring-1 hover:ring-neutral-300 transition-shadow' : ''}`}>
                    <p className="text-xs text-neutral-500">{emoji} {label}</p>
                    <p className="mt-1 text-2xl font-semibold text-neutral-900 tabular-nums">{value}</p>
                  </motion.div>
                );
                return href ? <Link key={label} href={href}>{inner}</Link> : inner;
              })}
            </motion.div>
          ) : (
            <motion.div variants={stagger} initial="hidden" animate="show" className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                { emoji: '🎭', label: 'Total experiences', value: experiences?.length ?? 0, cls: 'bg-neutral-50' },
                { emoji: '✅', label: 'Published', value: publishedExpCount, cls: 'bg-emerald-50' },
                { emoji: '📝', label: 'Drafts', value: draftExpCount, cls: 'bg-amber-50' },
              ].map(({ emoji, label, value, cls }) => (
                <motion.div key={label} variants={fadeUp}
                  className={`rounded-2xl p-4 ${cls}`}>
                  <p className="text-xs text-neutral-500">{emoji} {label}</p>
                  <p className="mt-1 text-2xl font-semibold text-neutral-900 tabular-nums">{value}</p>
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>

        {/* Tab switcher */}
        <div className="mb-6 flex border-b border-neutral-200 bg-white rounded-t-2xl overflow-hidden">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  isActive
                    ? 'border-indigo-600 text-neutral-900'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700'
                }`}>
                <Icon className="h-4 w-4" />
                {tab.label}
                {tab.count > 0 && (
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${isActive ? 'bg-indigo-50 text-indigo-700' : 'bg-neutral-100 text-neutral-600'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content area */}
        {activeTab === 'properties' ? (
          isLoading ? (
            <div className="flex justify-center py-20"><Spinner size="lg" /></div>
          ) : !listings || listings.length === 0 ? (
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}
              className="flex flex-col items-center rounded-3xl border border-dashed border-neutral-300 bg-white py-24 gap-4 text-center">
              <motion.p className="text-5xl" animate={{ y: [0, -8, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}>🏡</motion.p>
              <h2 className="text-xl font-semibold text-neutral-900">{t('noListings')}</h2>
              <p className="text-neutral-500 max-w-xs text-sm">{t('noListingsDesc')}</p>
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                <Link href={`/${locale}/hosting/listings/new`}
                  className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">
                  ✨ {t('getStarted')}
                </Link>
              </motion.div>
            </motion.div>
          ) : (
            <>
              <div className="mb-6 rounded-2xl border border-neutral-200 bg-neutral-50/60 p-4 text-sm">
                <p className="flex items-center gap-2 font-medium text-neutral-900">
                  <BadgeCheck className="h-4 w-4 text-neutral-600" />
                  💡 Boost booking conversion
                </p>
                <p className="mt-1 text-neutral-600 text-xs">
                  Complete photos, updated calendar availability, and clear house rules drive faster guest decisions.
                </p>
              </div>
              {/* Bulk select toolbar */}
              <div className="mb-4 flex items-center justify-between gap-3">
                <button
                  onClick={selectedIds.size === listings.length ? clearSelection : selectAll}
                  className="flex items-center gap-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 transition-colors">
                  {selectedIds.size === listings.length
                    ? <CheckCheck className="h-3.5 w-3.5 text-indigo-600" />
                    : <Square className="h-3.5 w-3.5" />}
                  {selectedIds.size === listings.length ? 'Deselect all' : 'Select all'}
                </button>
                {selectedIds.size > 0 && (
                  <button onClick={clearSelection} className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-700">
                    <X className="h-3 w-3" /> Clear
                  </button>
                )}
              </div>
              <motion.div variants={stagger} initial="hidden" animate="show"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map((listing) => (
                  <motion.div key={listing.id} variants={fadeUp} className="relative">
                    {/* Checkbox overlay */}
                    <button
                      onClick={() => toggleSelect(listing.id)}
                      className={`absolute top-3 left-3 z-10 rounded-lg p-1 transition-all ${
                        selectedIds.has(listing.id)
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-white/80 text-neutral-400 opacity-0 group-hover:opacity-100 backdrop-blur-sm'
                      }`}>
                      {selectedIds.has(listing.id)
                        ? <CheckSquare className="h-4 w-4" />
                        : <Square className="h-4 w-4" />}
                    </button>
                    <div className={`group transition-all rounded-2xl ${
                      selectedIds.has(listing.id) ? 'ring-2 ring-indigo-500 ring-offset-1' : ''
                    }`}>
                      <ListingCard property={listing} />
                    </div>
                  </motion.div>
                ))}
              </motion.div>
              {/* Floating bulk action bar */}
              <AnimatePresence>
                {selectedIds.size > 0 && (
                  <motion.div
                    initial={{ y: 80, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 80, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                    className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-2xl bg-neutral-900 px-5 py-3 text-white shadow-2xl border border-neutral-700">
                    <span className="text-sm font-medium text-neutral-300">
                      {selectedIds.size} selected
                    </span>
                    <div className="w-px h-4 bg-neutral-700" />
                    <button
                      disabled={isBulking}
                      onClick={() => runBulkAction({ ids: Array.from(selectedIds), action: 'publish' })}
                      className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-3 py-1.5 text-xs font-semibold transition-colors">
                      <Globe className="h-3.5 w-3.5" /> Publish all
                    </button>
                    <button
                      disabled={isBulking}
                      onClick={() => runBulkAction({ ids: Array.from(selectedIds), action: 'archive' })}
                      className="flex items-center gap-1.5 rounded-lg bg-neutral-700 hover:bg-neutral-600 disabled:opacity-50 px-3 py-1.5 text-xs font-semibold transition-colors">
                      <Archive className="h-3.5 w-3.5" /> Archive all
                    </button>
                    <button
                      disabled={isBulking}
                      onClick={() => {
                        if (window.confirm(`Delete ${selectedIds.size} listing${selectedIds.size !== 1 ? 's' : ''}? This cannot be undone.`)) {
                          runBulkAction({ ids: Array.from(selectedIds), action: 'delete' });
                        }
                      }}
                      className="flex items-center gap-1.5 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50 px-3 py-1.5 text-xs font-semibold transition-colors">
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                    <button onClick={clearSelection} className="ml-1 rounded-lg p-1.5 hover:bg-neutral-700 transition-colors">
                      <X className="h-4 w-4 text-neutral-400" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )
        ) : (
          expLoading ? (
            <div className="flex justify-center py-20"><Spinner size="lg" /></div>
          ) : !experiences || experiences.length === 0 ? (
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}
              className="flex flex-col items-center rounded-3xl border border-dashed border-neutral-300 bg-white py-24 gap-4 text-center">
              <motion.p className="text-5xl" animate={{ y: [0, -8, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}>🎭</motion.p>
              <h2 className="text-xl font-semibold text-neutral-900">No experiences yet</h2>
              <p className="text-neutral-500 max-w-xs text-sm">Create your first experience to share your passion with guests.</p>
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                <Link href={`/${locale}/hosting/experiences/new`}
                  className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">
                  ✨ Create Experience
                </Link>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div variants={stagger} initial="hidden" animate="show"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {experiences.map((exp) => (
                <motion.div key={exp.id} variants={fadeUp}>
                  <ExperienceCard exp={exp} locale={locale} />
                </motion.div>
              ))}
            </motion.div>
          )
        )}
      </div>
    </div>
  );
}
