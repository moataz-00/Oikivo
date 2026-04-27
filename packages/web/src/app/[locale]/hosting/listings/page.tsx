'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, BadgeCheck, Archive, Home, Compass, Edit, Globe, CheckSquare, Square, X, CheckCheck, Trash2, AlertTriangle, AlertCircle } from 'lucide-react';
import { propertiesApi, experiencesApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { ListingCard } from '@/components/hosting/ListingCard';
import { Spinner, FullPageSpinner } from '@/components/ui/Spinner';
import { toast } from '@/components/ui/Toast';
import type { Experience, Property } from '@/types';

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
  const [bulkPublishModal, setBulkPublishModal] = useState<{
    ready: Property[];
    notReady: Array<{ property: Property; issues: string[] }>;
  } | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    blocked: { id: number; title: string; bookingCount: number }[];
    safeIds: number[];
  } | null>(null);
  const [isCheckingBookings, setIsCheckingBookings] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
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
      const verb = action === 'publish' ? 'submitted for review' : action === 'archive' ? 'archived' : 'deleted';
      if (res.succeeded.length > 0) {
        toast.success(`${res.succeeded.length} listing${res.succeeded.length !== 1 ? 's' : ''} ${verb}.`);
      }
      if (res.failed.length > 0) {
        toast.error(`${res.failed.length} listing${res.failed.length !== 1 ? 's' : ''} could not be processed.`);
      }
      clearSelection();
    },
    onError: () => toast.error('Bulk action failed. Please try again.'),
  });

  // Pre-delete check: detect properties with active bookings before attempting deletion
  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    setIsCheckingBookings(true);
    try {
      const blocked = await propertiesApi.bulkCheckBookings(ids);
      const blockedIds = new Set(blocked.map((b) => b.id));
      const safeIds = ids.filter((id) => !blockedIds.has(id));
      if (blocked.length > 0) {
        // Show modal warning about blocked properties
        setDeleteModal({ blocked, safeIds });
      } else {
        // All safe — proceed directly
        runBulkAction({ ids, action: 'delete' });
      }
    } catch {
      toast.error('Could not check booking status. Please try again.');
    } finally {
      setIsCheckingBookings(false);
    }
  };

  const confirmDeleteSafe = () => {
    if (!deleteModal) return;
    setDeleteModal(null);
    if (deleteModal.safeIds.length > 0) {
      runBulkAction({ ids: deleteModal.safeIds, action: 'delete' });
    }
  };

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

  const handleBulkPublish = async () => {
    const ids = Array.from(selectedIds);
    const selected = (listings ?? []).filter((l) => ids.includes(l.id));
    setIsVerifying(true);
    try {
      const results = await Promise.all(
        selected.map(async (listing) => {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const verify = await propertiesApi.verifyListing(listing.uuid);
            return { listing, canPublish: verify.canPublish, checks: verify.checks };
          } catch {
            return { listing, canPublish: false, checks: [] as any[] };
          }
        }),
      );
      const ready = results.filter((r) => r.canPublish).map((r) => r.listing);
      const notReady = results
        .filter((r) => !r.canPublish)
        .map((r) => ({
          property: r.listing,
          issues: r.checks
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .filter((c: any) => c.status === 'fail' && c.message)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .map((c: any) => c.message as string),
        }));
      setBulkPublishModal({ ready, notReady });
    } finally {
      setIsVerifying(false);
    }
  };

  const confirmBulkPublish = () => {
    if (!bulkPublishModal || bulkPublishModal.ready.length === 0) return;
    runBulkAction({ ids: bulkPublishModal.ready.map((p) => p.id), action: 'publish' });
    setBulkPublishModal(null);
  };

  const { data: listings, isLoading } = useQuery({
    queryKey: ['host-listings'],
    queryFn: propertiesApi.getHostListings,
    enabled: isLoggedIn && isHost,
    staleTime: 5 * 60 * 1000,
  });

  // Derived: are any selected listings already live (published / pending_review)?
  const selectedLiveCount = (listings ?? []).filter(
    (l) => selectedIds.has(l.id) && (l.status === 'published' || l.status === 'pending_review'),
  ).length;

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
    <>
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
                  href={activeTab === 'properties' ? `/${locale}/hosting/listings/new?fresh=1` : `/${locale}/hosting/experiences/new`}
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
                <Link href={`/${locale}/hosting/listings/new?fresh=1`}
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
                  <motion.div key={listing.id} variants={fadeUp} className="group relative">
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
                    <div className={`transition-all rounded-2xl ${
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
                    <div className="relative group/submit">
                      <button
                        disabled={isBulking || isVerifying || selectedLiveCount > 0}
                        onClick={handleBulkPublish}
                        className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1.5 text-xs font-semibold transition-colors">
                        {isVerifying ? <Spinner size="sm" /> : <Globe className="h-3.5 w-3.5" />}
                        {isVerifying ? 'Checking...' : 'Submit all'}
                      </button>
                      {selectedLiveCount > 0 && (
                        <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 rounded-xl bg-neutral-800 px-3 py-2 text-xs text-neutral-200 shadow-lg opacity-0 group-hover/submit:opacity-100 transition-opacity text-center">
                          {selectedLiveCount} selected listing{selectedLiveCount !== 1 ? 's are' : ' is'} already live or under review
                        </div>
                      )}
                    </div>
                    <button
                      disabled={isBulking}
                      onClick={() => runBulkAction({ ids: Array.from(selectedIds), action: 'archive' })}
                      className="flex items-center gap-1.5 rounded-lg bg-neutral-700 hover:bg-neutral-600 disabled:opacity-50 px-3 py-1.5 text-xs font-semibold transition-colors">
                      <Archive className="h-3.5 w-3.5" /> Archive all
                    </button>
                    <button
                      disabled={isBulking || isCheckingBookings}
                      onClick={handleBulkDelete}
                      className="flex items-center gap-1.5 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50 px-3 py-1.5 text-xs font-semibold transition-colors">
                      {isCheckingBookings ? <Spinner size="sm" /> : <Trash2 className="h-3.5 w-3.5" />}
                      {isCheckingBookings ? 'Checking...' : 'Delete'}
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

    {/* ── Bulk Publish Readiness Modal ── */}
    <AnimatePresence>
      {bulkPublishModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setBulkPublishModal(null)}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl max-h-[80vh] flex flex-col"
          >
            <h2 className="text-lg font-bold text-neutral-900 mb-1">Submit for Review</h2>
            <p className="text-sm text-neutral-500 mb-5">
              {bulkPublishModal.ready.length > 0
                ? `${bulkPublishModal.ready.length} listing${bulkPublishModal.ready.length !== 1 ? 's' : ''} ready to submit.`
                : 'None of the selected listings are ready to submit.'}
              {bulkPublishModal.notReady.length > 0 &&
                ` ${bulkPublishModal.notReady.length} need${bulkPublishModal.notReady.length === 1 ? 's' : ''} attention.`}
            </p>

            <div className="overflow-y-auto flex-1 space-y-4">
              {bulkPublishModal.ready.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                    Ready ({bulkPublishModal.ready.length})
                  </p>
                  <ul className="space-y-1.5">
                    {bulkPublishModal.ready.map((p) => (
                      <li key={p.id} className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800 font-medium">
                        <CheckSquare className="h-4 w-4 shrink-0 text-emerald-500" />
                        {p.title}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {bulkPublishModal.notReady.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
                    Needs attention ({bulkPublishModal.notReady.length})
                  </p>
                  <ul className="space-y-2">
                    {bulkPublishModal.notReady.map(({ property: p, issues }) => (
                      <li key={p.id} className="rounded-xl bg-amber-50 px-3 py-2.5">
                        <p className="text-sm font-semibold text-amber-900 mb-1">{p.title}</p>
                        <ul className="space-y-0.5">
                          {issues.slice(0, 4).map((issue, i) => (
                            <li key={i} className="text-xs text-amber-700 flex items-start gap-1.5">
                              <span className="mt-0.5 shrink-0">•</span>{issue}
                            </li>
                          ))}
                          {issues.length > 4 && (
                            <li className="text-xs text-amber-500">+{issues.length - 4} more issues</li>
                          )}
                        </ul>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setBulkPublishModal(null)}
                className="flex-1 rounded-xl border border-neutral-200 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                Cancel
              </button>
              {bulkPublishModal.ready.length > 0 && (
                <button
                  onClick={confirmBulkPublish}
                  disabled={isBulking}
                  className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 py-2.5 text-sm font-semibold text-white transition-colors"
                >
                  {isBulking
                    ? 'Submitting...'
                    : `Submit ${bulkPublishModal.ready.length} listing${bulkPublishModal.ready.length !== 1 ? 's' : ''}`}
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* ── Bulk Delete Warning Modal ── */}
    <AnimatePresence>
      {deleteModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setDeleteModal(null)}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-neutral-900">Cannot delete all listings</h2>
                <p className="text-sm text-neutral-500">Some listings have active guest bookings</p>
              </div>
            </div>

            {/* Blocked listings */}
            <div className="mb-4 rounded-2xl border border-red-100 bg-red-50 p-4">
              <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5" />
                Cannot delete ({deleteModal.blocked.length})
              </p>
              <ul className="space-y-1.5">
                {deleteModal.blocked.map((item) => (
                  <li key={item.id} className="flex items-center justify-between rounded-xl bg-white border border-red-100 px-3 py-2">
                    <span className="text-sm font-medium text-neutral-900 truncate">{item.title}</span>
                    <span className="ml-3 shrink-0 text-xs text-red-600 font-semibold">
                      {item.bookingCount} active booking{item.bookingCount !== 1 ? 's' : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Safe listings */}
            {deleteModal.safeIds.length > 0 ? (
              <div className="mb-5 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                <p className="text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Trash2 className="h-3.5 w-3.5" />
                  Will be deleted ({deleteModal.safeIds.length})
                </p>
                <ul className="space-y-1.5">
                  {(listings ?? [])
                    .filter((l) => deleteModal.safeIds.includes(l.id))
                    .map((l) => (
                      <li key={l.id} className="flex items-center gap-2 rounded-xl bg-white border border-neutral-200 px-3 py-2 text-sm text-neutral-700">
                        <X className="h-3.5 w-3.5 text-red-400 shrink-0" />
                        {l.title}
                      </li>
                    ))}
                </ul>
              </div>
            ) : (
              <p className="mb-5 text-sm text-neutral-500 text-center">No listings can be deleted at this time.</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal(null)}
                className="flex-1 rounded-xl border border-neutral-200 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                Cancel
              </button>
              {deleteModal.safeIds.length > 0 && (
                <button
                  onClick={confirmDeleteSafe}
                  disabled={isBulking}
                  className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 py-2.5 text-sm font-semibold text-white transition-colors"
                >
                  {isBulking
                    ? 'Deleting...'
                    : `Delete ${deleteModal.safeIds.length} listing${deleteModal.safeIds.length !== 1 ? 's' : ''}`}
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}
