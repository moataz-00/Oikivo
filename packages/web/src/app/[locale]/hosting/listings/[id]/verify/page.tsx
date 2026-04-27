'use client';

import { useParams, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useQuery, useMutation } from '@tanstack/react-query';
import { CheckCircle2, XCircle, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { propertiesApi } from '@/lib/api';
import { toast } from '@/components/ui/Toast';
import { FadeIn } from '@/components/ui/Motion';

interface VerifyCheck {
  key: string;
  label: string;
  status: 'pass' | 'fail';
  message?: string;
}

interface VerifyResponse {
  propertyId: number;
  canPublish: boolean;
  checks: VerifyCheck[];
  passCount: number;
  totalCount: number;
}

export default function VerifyListingPage() {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('hosting');
  const uuid = params.id as string;

  const { data, isLoading, refetch } = useQuery<VerifyResponse>({
    queryKey: ['verify-listing', uuid],
    queryFn: () => propertiesApi.verifyListing(uuid),
    enabled: !!uuid,
  });

  const publishMutation = useMutation({
    mutationFn: () => propertiesApi.publishListing(uuid),
    onSuccess: () => {
      toast.success('Your listing is now live!');
      router.push(`/${locale}/hosting/listings`);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? 'Failed to publish. Please fix all issues first.';
      toast.error(msg);
      refetch();
    },
  });

  const linkForCheck = (key: string) => {
    switch (key) {
      case 'photos':
      case 'cover_photo':
        return `/${locale}/hosting/listings/${uuid}/edit#photos`;
      case 'host_photo':
      case 'host_phone':
      case 'host_email':
        return `/${locale}/profile`;
      default:
        return `/${locale}/hosting/listings/${uuid}/edit`;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <p className="text-neutral-500">Unable to load verification data.</p>
      </div>
    );
  }

  const listingChecks = data.checks.filter((c) => !c.key.startsWith('host_'));
  const hostChecks = data.checks.filter((c) => c.key.startsWith('host_'));

  return (
    <div className="min-h-screen bg-neutral-50">
      <FadeIn>
        <div className="mx-auto max-w-2xl px-4 py-10">
          {/* Header */}
          <Link
            href={`/${locale}/hosting/listings/${uuid}/edit`}
            className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to edit
          </Link>

          <h1 className="text-2xl font-bold text-neutral-900 mb-2">Verify your listing</h1>
          <p className="text-neutral-500 mb-8">
            Complete all checks below to publish your listing and start accepting guests.
          </p>

          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-neutral-700">
                {data.passCount} of {data.totalCount} checks passed
              </span>
              <span className="text-sm text-neutral-400">
                {Math.round((data.passCount / data.totalCount) * 100)}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-neutral-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                style={{ width: `${(data.passCount / data.totalCount) * 100}%` }}
              />
            </div>
          </div>

          {/* Listing checks */}
          <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden mb-6">
            <div className="px-5 py-4 border-b border-neutral-100 bg-neutral-50/50">
              <h2 className="text-sm font-semibold text-neutral-700 uppercase tracking-wide">Listing details</h2>
            </div>
            <div className="divide-y divide-neutral-100">
              {listingChecks.map((check) => (
                <div key={check.key} className="px-5 py-3.5 flex items-start gap-3">
                  {check.status === 'pass' ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                  ) : (
                    <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${check.status === 'pass' ? 'text-neutral-700' : 'text-neutral-900'}`}>
                      {check.label}
                    </p>
                    {check.message && (
                      <p className="text-xs text-neutral-400 mt-0.5">{check.message}</p>
                    )}
                  </div>
                  {check.status === 'fail' && (
                    <Link
                      href={linkForCheck(check.key)}
                      className="shrink-0 text-xs font-medium text-indigo-600 hover:text-indigo-700"
                    >
                      Fix →
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Host checks */}
          <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden mb-8">
            <div className="px-5 py-4 border-b border-neutral-100 bg-neutral-50/50">
              <h2 className="text-sm font-semibold text-neutral-700 uppercase tracking-wide">Host profile</h2>
            </div>
            <div className="divide-y divide-neutral-100">
              {hostChecks.map((check) => (
                <div key={check.key} className="px-5 py-3.5 flex items-start gap-3">
                  {check.status === 'pass' ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                  ) : (
                    <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${check.status === 'pass' ? 'text-neutral-700' : 'text-neutral-900'}`}>
                      {check.label}
                    </p>
                    {check.message && (
                      <p className="text-xs text-neutral-400 mt-0.5">{check.message}</p>
                    )}
                  </div>
                  {check.status === 'fail' && (
                    <Link
                      href={linkForCheck(check.key)}
                      className="shrink-0 text-xs font-medium text-indigo-600 hover:text-indigo-700"
                    >
                      Fix →
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Publish button */}
          <button
            onClick={() => publishMutation.mutate()}
            disabled={!data.canPublish || publishMutation.isPending}
            className="w-full rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {publishMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Publishing...
              </>
            ) : data.canPublish ? (
              'Publish your listing'
            ) : (
              'Fix all issues to publish'
            )}
          </button>

          {!data.canPublish && (
            <p className="text-center text-xs text-neutral-400 mt-3">
              Complete all {data.totalCount - data.passCount} remaining check{data.totalCount - data.passCount > 1 ? 's' : ''} to enable publishing.
            </p>
          )}
        </div>
      </FadeIn>
    </div>
  );
}
