'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Star,
  ShieldCheck,
  Award,
  MessageSquare,
  Calendar,
  Sparkles,
  CircleCheck,
  AlertCircle,
} from 'lucide-react';
import { usersApi } from '@/lib/api';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { Separator } from '@/components/ui/Separator';
import { ContactHostModal } from '@/components/ui/ContactHostModal';
import { formatRating } from '@/lib/utils';

export default function PublicProfilePage() {
  const params = useParams();
  const locale = useLocale();
  const t = useTranslations('profile');
  const profileUuid = params.uuid as string;

  const [contactOpen, setContactOpen] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile-uuid', profileUuid],
    queryFn: () => usersApi.getProfileByUuid(profileUuid),
    enabled: !!profileUuid,
  });

  if (isLoading) return <FullPageSpinner />;

  if (!profile) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <AlertCircle className="h-10 w-10 text-neutral-300 mx-auto mb-4" />
        <p className="text-neutral-500">User not found</p>
        <Link href={`/${locale}`} className="text-brand underline mt-4 inline-block">
          Go home
        </Link>
      </div>
    );
  }

  const avgRatingText = formatRating(profile.avgRating ?? null);
  const joinedYear = new Date(profile.joinedAt ?? profile.createdAt ?? Date.now()).getFullYear();
  const avatarSrc = profile.avatarUrl ?? profile.avatar ?? null;

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(15,118,110,0.13),transparent_35%),radial-gradient(circle_at_85%_0%,rgba(14,116,144,0.1),transparent_34%)]" />
      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 py-10">

        {/* Hero banner */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-8 rounded-3xl border border-neutral-200 bg-white p-6 sm:p-8"
        >
          <p className="inline-flex items-center gap-2 rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700">
            <Sparkles className="h-3.5 w-3.5" />
            Host profile
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-neutral-900">
            Meet {profile.firstName}
          </h1>
          <p className="mt-1 text-sm text-neutral-600">
            Get to know the host behind the stays, standards, and guest experience.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">

          {/* ── Left: profile card ── */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-5 sticky top-24"
            >
              {/* Avatar + name */}
              <div className="text-center">
                <div className="flex justify-center mb-3">
                  <Avatar
                    src={avatarSrc}
                    firstName={profile.firstName}
                    lastName={profile.lastName}
                    size="xl"
                  />
                </div>
                <h2 className="text-xl font-semibold text-neutral-900">
                  {profile.firstName} {profile.lastName}
                </h2>
                {profile.isSuperhost && (
                  <Badge variant="superhost" className="mt-2">
                    <Award className="h-3 w-3 mr-1" />
                    {t('superhost')}
                  </Badge>
                )}
              </div>

              <Separator />

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-xl font-semibold text-neutral-900">
                    {profile.reviewCount ?? 0}
                  </p>
                  <p className="text-xs text-neutral-500">{t('reviews')}</p>
                </div>
                {avgRatingText !== null ? (
                  <div>
                    <p className="text-xl font-semibold text-neutral-900 flex items-center justify-center gap-1">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      {avgRatingText}
                    </p>
                    <p className="text-xs text-neutral-500">Rating</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xl font-semibold text-neutral-900">New</p>
                    <p className="text-xs text-neutral-500">Rating</p>
                  </div>
                )}
              </div>

              <Separator />

              {/* Verifications */}
              <div className="space-y-2">
                <p className="text-sm font-semibold text-neutral-900">{t('verifications')}</p>
                {profile.isIdentityVerified && (
                  <div className="flex items-center gap-2 text-sm text-neutral-700">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    {t('identityVerified')}
                  </div>
                )}
                {profile.isEmailVerified && (
                  <div className="flex items-center gap-2 text-sm text-neutral-700">
                    <ShieldCheck className="h-4 w-4 text-neutral-400" />
                    {t('emailVerified')}
                  </div>
                )}
              </div>

              <Separator />

              {/* Join date */}
              <div className="flex items-center gap-2 text-sm text-neutral-600">
                <Calendar className="h-4 w-4" />
                {t('joinedIn', { year: joinedYear })}
              </div>

              {/* Contact button */}
              <button
                onClick={() => setContactOpen(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 px-5 py-3 text-sm font-semibold text-white hover:bg-neutral-700 transition-colors"
              >
                <MessageSquare className="h-4 w-4" />
                {t('contactHost', { name: profile.firstName })}
              </button>
            </motion.div>
          </div>

          {/* ── Right: about + trust stats + superhost ── */}
          <div className="md:col-span-2 space-y-8">

            {/* About */}
            {profile.bio && (
              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-xl font-semibold text-neutral-900 mb-3">{t('about')}</h2>
                <p className="text-neutral-700 font-light leading-relaxed whitespace-pre-line">
                  {profile.bio}
                </p>
              </motion.section>
            )}

            {/* Trust highlights */}
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05 }}
              className="rounded-2xl border border-neutral-200 bg-white p-5"
            >
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                Guest trust highlights
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {/* Average rating */}
                <div className="rounded-xl bg-neutral-50 p-4">
                  <p className="text-xs text-neutral-500 mb-1">Average rating</p>
                  <p className="flex items-center gap-1.5 text-xl font-semibold text-neutral-900">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
                    {avgRatingText ?? 'New host'}
                  </p>
                </div>

                {/* Reviews received */}
                <div className="rounded-xl bg-neutral-50 p-4">
                  <p className="text-xs text-neutral-500 mb-1">Reviews received</p>
                  <p className="text-xl font-semibold text-neutral-900">
                    {profile.reviewCount ?? 0}
                  </p>
                </div>

                {/* Identity status */}
                <div className="rounded-xl bg-neutral-50 p-4">
                  <p className="text-xs text-neutral-500 mb-1">Identity status</p>
                  <p className="flex items-center gap-1.5 text-sm font-semibold">
                    {profile.isIdentityVerified ? (
                      <>
                        <CircleCheck className="h-4 w-4 text-emerald-500" />
                        <span className="text-emerald-700">Verified</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                        <span className="text-amber-700">Pending</span>
                      </>
                    )}
                  </p>
                </div>

                {/* Hosting since */}
                <div className="rounded-xl bg-neutral-50 p-4">
                  <p className="text-xs text-neutral-500 mb-1">Hosting since</p>
                  <p className="text-xl font-semibold text-neutral-900">{joinedYear}</p>
                </div>
              </div>
            </motion.section>

            {/* Superhost badge */}
            {profile.isSuperhost && (
              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Award className="h-7 w-7 text-brand" />
                  <h3 className="font-semibold text-neutral-900">
                    {profile.firstName} is a Superhost
                  </h3>
                </div>
                <p className="text-sm text-neutral-500">{t('superhostDesc')}</p>
              </motion.section>
            )}
          </div>
        </div>

        {/* Contact Host Modal */}
        <ContactHostModal
          open={contactOpen}
          onOpenChange={setContactOpen}
          host={{
            id: profile.id,
            firstName: profile.firstName,
            lastName: profile.lastName,
            avatar: avatarSrc,
            avatarUrl: avatarSrc,
          }}
        />
      </div>
    </div>
  );
}
