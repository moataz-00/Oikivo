'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import {
  ArrowLeft, MessageSquareWarning, ChevronRight, ChevronDown, Loader2,
  CalendarDays, Users, DollarSign, FileImage, User, Tag,
} from 'lucide-react';
import { disputesApi } from '@/lib/api';
import { FadeIn } from '@/components/ui/Motion';
import { Avatar } from '@/components/ui/Avatar';
import { getImageUrl } from '@/lib/utils';

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string }> = {
  open:         { bg: 'bg-amber-100',  text: 'text-amber-800',  dot: 'bg-amber-500'  },
  under_review: { bg: 'bg-blue-100',   text: 'text-blue-800',   dot: 'bg-blue-500'   },
  resolved:     { bg: 'bg-green-100',  text: 'text-green-800',  dot: 'bg-green-500'  },
  closed:       { bg: 'bg-gray-100',   text: 'text-gray-600',   dot: 'bg-gray-400'   },
};

const CATEGORY_KEYS: Record<string, string> = {
  property_damage:    'catPropertyDamage',
  cleanliness:        'catCleanliness',
  noise_complaint:    'catNoiseComplaint',
  unauthorized_guest: 'catUnauthorizedGuest',
  early_checkout:     'catEarlyCheckout',
  host_issues:        'catHostIssues',
  payment_dispute:    'catPaymentDispute',
  other:              'catOther',
};

const STATUS_LABEL_KEYS: Record<string, string> = {
  open:         'statusOpen',
  under_review: 'statusUnderReview',
  resolved:     'statusResolved',
  closed:       'statusClosed',
};

export default function HostDisputesPage() {
  const t = useTranslations('hosting');
  const locale = useLocale();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const statusLabel = (status: string) =>
    t((STATUS_LABEL_KEYS[status] ?? 'statusOpen') as any);

  const categoryLabel = (cat: string) =>
    t((CATEGORY_KEYS[cat] ?? 'catOther') as any);

  const { data: disputes, isLoading, isError } = useQuery({
    queryKey: ['host-disputes'],
    queryFn: () => disputesApi.getHostDisputes(),
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <FadeIn>
          <Link
            href={`/${locale}/hosting`}
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            {t('backToHosting')}
          </Link>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <MessageSquareWarning className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{t('disputesTitle')}</h1>
                <p className="text-sm text-gray-500">{t('disputesDesc')}</p>
              </div>
            </div>
            {(disputes?.length ?? 0) > 0 && (
              <span className="text-sm text-gray-500 font-medium">{t('disputeCount', { count: disputes!.length })}</span>
            )}
          </div>
        </FadeIn>

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="text-center py-20 text-gray-500">
            {t('failedLoadDisputes')}
          </div>
        )}

        {/* Empty */}
        {disputes && disputes.length === 0 && (
          <FadeIn>
            <div className="text-center py-20">
              <MessageSquareWarning className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <h3 className="font-semibold text-gray-700 mb-1">{t('noDisputesTitle')}</h3>
              <p className="text-sm text-gray-500">
                {t('noDisputesDesc')}
              </p>
            </div>
          </FadeIn>
        )}

        {/* Disputes list */}
        {disputes && disputes.length > 0 && (
          <FadeIn className="space-y-3">
            {disputes.map((d: any) => {
              const cfg     = STATUS_CONFIG[d.status] ?? STATUS_CONFIG.open;
              const isOpen  = expandedId === d.id;
              const date    = new Date(d.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
              const guest   = d.raisedBy ?? d.booking?.guest;
              const booking = d.booking;
              const property = booking?.property;
              const coverPhoto = property?.photos?.find((p: any) => p.isCover) ?? property?.photos?.[0];
              const evidenceCount = (d.evidence ?? []).length;

              return (
                <div
                  key={d.id}
                  className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Card header — always visible */}
                  <button
                    className="w-full text-left p-4 flex items-start gap-4"
                    onClick={() => setExpandedId(isOpen ? null : d.id)}
                  >
                    {/* Property thumbnail */}
                    <div className="w-16 h-14 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                      {coverPhoto ? (
                        <img
                          src={getImageUrl(coverPhoto.url)}
                          alt={property?.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FileImage className="w-5 h-5 text-gray-300" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{d.title}</p>
                          <p className="text-sm text-gray-500 truncate">{property?.title ?? `Booking #${d.bookingId}`}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
                            {statusLabel(d.status)}
                          </span>
                          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        {/* Guest */}
                        {guest && (
                          <div className="flex items-center gap-1.5">
                            <Avatar
                              src={guest.avatarUrl ?? undefined}
                              firstName={guest.firstName}
                              lastName={guest.lastName}
                              size="xs"
                            />
                            <span className="text-xs text-gray-600">{guest.firstName} {guest.lastName}</span>
                          </div>
                        )}
                        {/* Category */}
                        {d.category && (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Tag className="w-3 h-3" />
                            {CATEGORY_KEYS[d.category] ? categoryLabel(d.category) : d.category.replace(/_/g, ' ')}
                          </span>
                        )}
                        {/* Date */}
                        <span className="text-xs text-gray-400">{date}</span>
                        {/* Evidence count */}
                        {evidenceCount > 0 && (
                          <span className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                            <FileImage className="w-3 h-3" />
                            {t('photoCountLabel', { count: evidenceCount })}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Expanded details */}
                  {isOpen && (
                    <div className="border-t border-gray-100 px-4 pb-5 pt-4 space-y-4">
                      {/* Booking info row */}
                      {booking && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {(booking.checkIn || booking.checkOut) && (
                            <div className="flex items-start gap-2">
                              <CalendarDays className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                              <div>
                                <p className="text-xs text-gray-400">{t('datesLabel')}</p>
                                <p className="text-sm text-gray-700 font-medium">
                                  {new Date(booking.checkIn).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                  {' → '}
                                  {new Date(booking.checkOut).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </p>
                              </div>
                            </div>
                          )}
                          {booking.guestsCount && (
                            <div className="flex items-start gap-2">
                              <Users className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                              <div>
                                <p className="text-xs text-gray-400">{t('guestsLabel')}</p>
                                <p className="text-sm text-gray-700 font-medium">{booking.guestsCount}</p>
                              </div>
                            </div>
                          )}
                          {booking.totalAmount && (
                            <div className="flex items-start gap-2">
                              <DollarSign className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                              <div>
                                <p className="text-xs text-gray-400">{t('amountLabel')}</p>
                                <p className="text-sm text-gray-700 font-medium">
                                  {Number(booking.totalAmount).toLocaleString()} {booking.currency ?? 'EGP'}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Guest profile */}
                      {guest && (
                        <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                          <Avatar
                            src={guest.avatarUrl ?? undefined}
                            firstName={guest.firstName}
                            lastName={guest.lastName}
                            size="md"
                          />
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{guest.firstName} {guest.lastName}</p>
                            {guest.email && <p className="text-xs text-gray-500">{guest.email}</p>}
                          </div>
                        </div>
                      )}

                      {/* Dispute description */}
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">{t('disputeDescription')}</p>
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{d.description}</p>
                      </div>

                      {/* Evidence photos */}
                      {evidenceCount > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{t('evidencePhotosCount', { count: evidenceCount })}</p>
                          <div className="flex flex-wrap gap-2">
                            {(d.evidence as string[]).map((path: string, i: number) => {
                              const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';
                              const filename = path.split('/').pop() ?? '';
                              const url = `${apiBase}/disputes/${d.id}/evidence/${encodeURIComponent(filename)}`;
                              return (
                                <a
                                  key={i}
                                  href={url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="w-20 h-20 rounded-xl overflow-hidden border border-gray-200 hover:border-blue-400 transition-colors"
                                >
                                  <img src={url} alt={`Evidence ${i + 1}`} className="w-full h-full object-cover" />
                                </a>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Resolution / admin note */}
                      {d.adminNote && (
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                          <p className="text-xs font-semibold text-blue-600 mb-1">{t('adminNote')}</p>
                          <p className="text-sm text-blue-800">{d.adminNote}</p>
                        </div>
                      )}
                      {d.resolution && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">{t('resolutionLabel')}</span>
                          <span className="text-xs font-medium text-gray-700 capitalize">{d.resolution.replace(/_/g, ' ')}</span>
                        </div>
                      )}

                      {/* View full details link */}
                      <Link
                        href={`/${locale}/hosting/disputes/${d.uuid ?? d.id}`}
                        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        {t('viewFullDetails')}
                        <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </FadeIn>
        )}
      </div>
    </div>
  );
}

