'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArchiveRestore, Trash2, Clock, AlertTriangle, CheckSquare, Square, Minus, Home, Compass } from 'lucide-react';
import { propertiesApi, experiencesApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { getImageUrl } from '@/lib/utils';
import { toast } from '@/components/ui/Toast';
import { Spinner, FullPageSpinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/utils';
import type { Property, Experience } from '@/types';

function daysRemaining(archivedAt: string | Date): number {
  const archived = typeof archivedAt === 'string' ? new Date(archivedAt) : archivedAt;
  const elapsed = Math.floor((Date.now() - archived.getTime()) / 86_400_000);
  return Math.max(0, 30 - elapsed);
}

function ArchivedCard({
  property,
  selected,
  onToggle,
  onRestore,
  onDelete,
}: {
  property: Property;
  selected: boolean;
  onToggle: () => void;
  onRestore: () => void;
  onDelete: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const images = property.images ?? [];
  const cover = images.find((i) => i.isCover) ?? images[0];
  const days = property.archivedAt ? daysRemaining(property.archivedAt) : 30;
  const urgent = days <= 7;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        'bg-white rounded-2xl border overflow-hidden flex flex-col transition-colors',
        selected ? 'border-indigo-600 ring-2 ring-indigo-200' : 'border-neutral-200'
      )}
    >
      {/* Image */}
      <div className="relative h-44 bg-neutral-100 shrink-0">
        {cover ? (
          <Image src={getImageUrl(cover.url)} alt={property.title} fill className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl select-none">🏠</div>
        )}

        {/* Checkbox overlay — top-left */}
        <button
          type="button"
          onClick={onToggle}
          className="absolute top-2.5 left-2.5 z-10 flex h-7 w-7 items-center justify-center rounded-lg bg-white/90 shadow-sm backdrop-blur-sm hover:bg-white transition-colors"
        >
          {selected
            ? <CheckSquare className="h-4.5 w-4.5 text-indigo-600" strokeWidth={2.2} />
            : <Square className="h-4.5 w-4.5 text-neutral-400" strokeWidth={2} />
          }
        </button>

        {/* Days counter — top-right */}
        <div className={cn(
          'absolute top-2.5 right-2.5 flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1',
          urgent ? 'bg-red-50 text-red-700 ring-red-200' : 'bg-neutral-100 text-neutral-600 ring-neutral-200'
        )}>
          <Clock className="h-3 w-3" />
          {days}d left
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        <div>
          <h3 className="font-semibold text-neutral-900 line-clamp-1 text-[15px]">{property.title}</h3>
          <p className="mt-0.5 text-xs text-neutral-500">📍 {property.city}, {property.country}</p>
        </div>

        {urgent && (
          <p className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 rounded-lg px-2.5 py-1.5">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            Deletes permanently in {days} day{days !== 1 ? 's' : ''}!
          </p>
        )}

        {property.archivedAt && (
          <p className="text-xs text-neutral-400">
            Archived {new Date(property.archivedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        )}

        {/* Per-card actions — hidden in bulk mode to keep it clean */}
        <div className="mt-auto flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={onRestore}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
          >
            <ArchiveRestore className="h-3.5 w-3.5" />
            Restore
          </button>

          {confirmDelete ? (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => { setConfirmDelete(false); onDelete(); }}
                className="rounded-xl bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 transition-colors"
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="rounded-xl border border-neutral-200 px-3 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-1.5 rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ── Bulk action bar ── */
function BulkBar({
  total,
  selectedCount,
  onSelectAll,
  onClearAll,
  onDeleteSelected,
  isDeleting,
}: {
  total: number;
  selectedCount: number;
  onSelectAll: () => void;
  onClearAll: () => void;
  onDeleteSelected: () => void;
  isDeleting: boolean;
}) {
  const allSelected = selectedCount === total && total > 0;
  const someSelected = selectedCount > 0 && !allSelected;

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3 mb-6">
      {/* Select-all toggle */}
      <button
        type="button"
        onClick={allSelected ? onClearAll : onSelectAll}
        className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 transition-colors"
      >
        {allSelected
          ? <CheckSquare className="h-4 w-4 text-indigo-600" />
          : someSelected
          ? <Minus className="h-4 w-4 text-neutral-500" />
          : <Square className="h-4 w-4 text-neutral-400" />
        }
        {allSelected ? 'Deselect all' : 'Select all'}
      </button>

      {selectedCount > 0 && (
        <>
          <span className="text-sm text-neutral-500">{selectedCount} selected</span>

          <button
            type="button"
            onClick={onClearAll}
            className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            Clear
          </button>

          <div className="ml-auto">
            <button
              type="button"
              onClick={onDeleteSelected}
              disabled={isDeleting}
              className={cn(
                'flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors',
                isDeleting && 'opacity-60 cursor-not-allowed'
              )}
            >
              <Trash2 className="h-4 w-4" />
              {isDeleting ? 'Deleting…' : `Delete ${selectedCount} listing${selectedCount !== 1 ? 's' : ''} forever`}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function ArchivedExperienceCard({
  experience,
  onRestore,
  onDelete,
}: {
  experience: Experience;
  onRestore: () => void;
  onDelete: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const coverPhoto = experience.photos?.find((p) => p.isCover) ?? experience.photos?.[0];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white rounded-2xl border border-neutral-200 overflow-hidden flex flex-col"
    >
      <div className="relative h-44 bg-neutral-100 shrink-0">
        {coverPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverPhoto.url} alt={experience.title} className="w-full h-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl select-none">🎭</div>
        )}
      </div>
      <div className="p-4 flex flex-col gap-3 flex-1">
        <div>
          <h3 className="font-semibold text-neutral-900 line-clamp-1 text-[15px]">{experience.title}</h3>
          <p className="mt-0.5 text-xs text-neutral-500">📍 {experience.city}, {experience.country}</p>
        </div>
        <div className="mt-auto flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={onRestore}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
          >
            <ArchiveRestore className="h-3.5 w-3.5" />
            Restore
          </button>
          {confirmDelete ? (
            <div className="flex items-center gap-1.5">
              <button type="button" onClick={() => { setConfirmDelete(false); onDelete(); }}
                className="rounded-xl bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 transition-colors">
                Confirm
              </button>
              <button type="button" onClick={() => setConfirmDelete(false)}
                className="rounded-xl border border-neutral-200 px-3 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-50 transition-colors">
                Cancel
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-1.5 rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors">
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function ArchivePage() {
  const locale = useLocale();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isLoggedIn, isHost, hasHydrated } = useAuth();
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<'properties' | 'experiences'>('properties');

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isLoggedIn) router.push(`/${locale}/login`);
    else if (!isHost) router.push(`/${locale}`);
  }, [hasHydrated, isLoggedIn, isHost, locale, router]);

  const { data: archived, isLoading } = useQuery({
    queryKey: ['archived-listings'],
    queryFn: propertiesApi.getArchivedListings,
    enabled: isLoggedIn && isHost,
    staleTime: 2 * 60 * 1000,
  });

  const { data: allExperiences, isLoading: expLoading } = useQuery({
    queryKey: ['host-experiences'],
    queryFn: experiencesApi.getHostListings,
    enabled: isLoggedIn && isHost,
    staleTime: 2 * 60 * 1000,
  });
  const archivedExperiences = (allExperiences ?? []).filter((e) => e.status === 'archived');

  const { mutate: restore } = useMutation({
    mutationFn: (id: number) => propertiesApi.restoreListing(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['archived-listings'] });
      queryClient.invalidateQueries({ queryKey: ['host-listings'] });
      toast.success('Listing restored to drafts!');
    },
    onError: () => toast.error('Failed to restore listing'),
  });

  const { mutate: permanentDelete } = useMutation({
    mutationFn: (id: number) => propertiesApi.permanentDeleteListing(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['archived-listings'] });
    },
    onError: () => toast.error('Failed to delete listing'),
  });

  const { mutate: restoreExp } = useMutation({
    mutationFn: (id: number) => experiencesApi.restore(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['host-experiences'] });
      toast.success('Experience restored to drafts!');
    },
    onError: () => toast.error('Failed to restore experience'),
  });

  const { mutate: deleteExp } = useMutation({
    mutationFn: (id: number) => experiencesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['host-experiences'] });
    },
    onError: () => toast.error('Failed to delete experience'),
  });

  function toggleSelect(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function selectAll() {
    if (activeTab === 'properties') {
      setSelected(new Set((archived ?? []).map((p) => p.id)));
    } else {
      setSelected(new Set(archivedExperiences.map((e) => e.id)));
    }
  }

  function clearAll() {
    setSelected(new Set());
  }

  async function deleteSelected() {
    if (selected.size === 0) return;
    setBulkDeleting(true);
    const ids = Array.from(selected);
    let failed = 0;
    for (const id of ids) {
      try {
        await propertiesApi.permanentDeleteListing(id);
      } catch {
        failed++;
      }
    }
    setBulkDeleting(false);
    setSelected(new Set());
    queryClient.invalidateQueries({ queryKey: ['archived-listings'] });
    if (failed === 0) {
      toast.success(`${ids.length} listing${ids.length !== 1 ? 's' : ''} permanently deleted`);
    } else {
      toast.error(`${failed} listing${failed !== 1 ? 's' : ''} could not be deleted`);
    }
  }

  if (!hasHydrated || !isLoggedIn || !isHost) return <FullPageSpinner />;

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Link
          href={`/${locale}/hosting/listings`}
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-800 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to listings
        </Link>

        <div className="rounded-3xl border border-neutral-200 bg-white p-6 sm:p-8 mb-8">
          <h1 className="text-2xl font-semibold text-neutral-900">🗂️ Archive</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Archived listings are hidden from guests. They are permanently deleted after 30 days.
          </p>
          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-semibold">Auto-deletion notice</p>
              <p className="mt-0.5 text-amber-700">Listings are permanently deleted 30 days after archiving. Restore them before the deadline.</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tab switcher */}
      <div className="mb-6 flex border-b border-neutral-200 bg-white rounded-t-2xl overflow-hidden">
        {([
          { id: 'properties' as const, label: 'Homes', icon: Home, count: archived?.length ?? 0 },
          { id: 'experiences' as const, label: 'Experiences', icon: Compass, count: archivedExperiences.length },
        ] as const).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSelected(new Set()); }}
              className={`flex items-center gap-2 px-6 py-3.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                isActive ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-neutral-500 hover:text-neutral-700'
              }`}>
              <Icon className="h-4 w-4" />
              {tab.label}
              {tab.count > 0 && (
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${isActive ? 'bg-indigo-100 text-indigo-700' : 'bg-neutral-100 text-neutral-600'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {activeTab === 'properties' ? (
        isLoading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : !archived || archived.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center rounded-3xl border border-dashed border-neutral-300 bg-white py-24 gap-4 text-center"
          >
            <span className="text-5xl">🗂️</span>
            <h2 className="text-xl font-semibold text-neutral-900">Nothing archived</h2>
            <p className="text-neutral-500 max-w-xs text-sm">When you archive a listing it will appear here.</p>
            <Link
              href={`/${locale}/hosting/listings`}
              className="mt-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
            >
              Back to listings
            </Link>
          </motion.div>
        ) : (
          <>
            <BulkBar
              total={archived.length}
              selectedCount={selected.size}
              onSelectAll={selectAll}
              onClearAll={clearAll}
              onDeleteSelected={deleteSelected}
              isDeleting={bulkDeleting}
            />
            <AnimatePresence mode="popLayout">
              <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {archived.map((property) => (
                  <ArchivedCard
                    key={property.id}
                    property={property}
                    selected={selected.has(property.id)}
                    onToggle={() => toggleSelect(property.id)}
                    onRestore={() => restore(property.id)}
                    onDelete={() => permanentDelete(property.id)}
                  />
                ))}
              </motion.div>
            </AnimatePresence>
          </>
        )
      ) : (
        expLoading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : archivedExperiences.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center rounded-3xl border border-dashed border-neutral-300 bg-white py-24 gap-4 text-center"
          >
            <span className="text-5xl">🎭</span>
            <h2 className="text-xl font-semibold text-neutral-900">No archived experiences</h2>
            <p className="text-neutral-500 max-w-xs text-sm">Archived experiences will appear here.</p>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {archivedExperiences.map((exp) => (
                <ArchivedExperienceCard
                  key={exp.id}
                  experience={exp}
                  onRestore={() => restoreExp(exp.id)}
                  onDelete={() => deleteExp(exp.id)}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        )
      )}
    </div>
  );
}

