'use client';

import { useQuery } from '@tanstack/react-query';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import { ArrowLeft, MessageSquareWarning, ChevronRight, Loader2 } from 'lucide-react';
import { disputesApi } from '@/lib/api';
import { FadeIn } from '@/components/ui/Motion';

const STATUS_CONFIG: Record<string, { label: string; labelAr: string; bg: string; text: string }> = {
  open:         { label: 'Open',         labelAr: 'مفتوح',         bg: 'bg-amber-100',  text: 'text-amber-800' },
  under_review: { label: 'Under review', labelAr: 'قيد المراجعة',  bg: 'bg-blue-100',   text: 'text-blue-800'  },
  resolved:     { label: 'Resolved',     labelAr: 'تم الحل',       bg: 'bg-green-100',  text: 'text-green-800' },
  closed:       { label: 'Closed',       labelAr: 'مغلق',          bg: 'bg-gray-100',   text: 'text-gray-600'  },
};

export default function MyDisputesPage() {
  const locale = useLocale();

  const { data: disputes, isLoading, isError } = useQuery({
    queryKey: ['my-disputes'],
    queryFn: () => disputesApi.getMyDisputes(),
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <FadeIn>
          <Link
            href={`/${locale}/trips`}
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors"
          >
            <ArrowLeft className={`w-4 h-4 ${locale === 'ar' ? 'rotate-180' : ''}`} />
            {locale === 'ar' ? 'العودة إلى رحلاتي' : 'Back to trips'}
          </Link>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <MessageSquareWarning className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {locale === 'ar' ? 'نزاعاتي' : 'My Disputes'}
              </h1>
              <p className="text-sm text-gray-500">
                {locale === 'ar' ? 'تتبع حالة قضايا النزاع الخاصة بك' : 'Track the status of your dispute cases'}
              </p>
            </div>
          </div>
        </FadeIn>

        {/* Content */}
        {isLoading && (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        )}

        {isError && (
          <div className="text-center py-20 text-gray-500">
            {locale === 'ar' ? 'فشل تحميل النزاعات. يرجى المحاولة مرة أخرى.' : 'Failed to load disputes. Please try again.'}
          </div>
        )}

        {disputes && disputes.length === 0 && (
          <FadeIn>
            <div className="text-center py-20">
              <MessageSquareWarning className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <h3 className="font-semibold text-gray-700 mb-1">
                {locale === 'ar' ? 'لا توجد نزاعات مقدمة' : 'No disputes filed'}
              </h3>
              <p className="text-sm text-gray-500">
                {locale === 'ar'
                  ? 'إذا واجهت مشكلة في إقامتك، يمكنك رفع نزاع من صفحة رحلاتك.'
                  : 'If you ever have an issue with a stay, you can raise a dispute from your trips page.'}
              </p>
            </div>
          </FadeIn>
        )}

        {disputes && disputes.length > 0 && (
          <FadeIn className="space-y-3">
            {disputes.map((d: any) => {
              const cfg = STATUS_CONFIG[d.status] ?? STATUS_CONFIG.open;
              const date = new Date(d.createdAt).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-GB', {
                day: '2-digit', month: 'short', year: 'numeric',
              });
              return (
                <Link
                  key={d.id}
                  href={`/${locale}/trips/disputes/${d.id}`}
                  className="flex items-center justify-between bg-white rounded-2xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{d.title}</p>
                    <p className="text-sm text-gray-500 truncate">
                      {d.booking?.property?.title ?? `Booking #${d.bookingId}`}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {locale === 'ar' ? `تم تقديمه ${date}` : `Filed ${date}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ms-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
                      {locale === 'ar' ? cfg.labelAr : cfg.label}
                    </span>
                    <ChevronRight className={`w-4 h-4 text-gray-400 ${locale === 'ar' ? 'rotate-180' : ''}`} />
                  </div>
                </Link>
              );
            })}
          </FadeIn>
        )}
      </div>
    </div>
  );
}
