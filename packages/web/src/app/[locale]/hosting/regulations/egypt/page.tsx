'use client';

import Link from 'next/link';
import { ChevronLeft, AlertTriangle, CheckCircle, FileText, Building2, Shield, ExternalLink } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

export default function EgyptRegulationsPage() {
  const locale = useLocale();
  const t = useTranslations('egyptRegulations');
  const isRTL = locale === 'ar';

  const STEPS = [
    { number: 1, title: t('step1Title'), description: t('step1Desc') },
    { number: 2, title: t('step2Title'), description: t('step2Desc') },
    { number: 3, title: t('step3Title'), description: t('step3Desc') },
    { number: 4, title: t('step4Title'), description: t('step4Desc') },
    { number: 5, title: t('step5Title'), description: t('step5Desc') },
  ];

  const REQUIREMENTS = [
    t('req1'), t('req2'), t('req3'), t('req4'), t('req5'), t('req6'), t('req7'),
  ];

  const PENALTIES = [
    { label: t('penalty1Label'), penalty: t('penalty1') },
    { label: t('penalty2Label'), penalty: t('penalty2') },
    { label: t('penalty3Label'), penalty: t('penalty3') },
    { label: t('penalty4Label'), penalty: t('penalty4') },
    { label: t('penalty5Label'), penalty: t('penalty5') },
  ];

  const WHY_POINTS = [
    t('whyPoint1'), t('whyPoint2'), t('whyPoint3'), t('whyPoint4'), t('whyPoint5'),
  ];

  return (
    <div className="min-h-screen bg-white" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* ── Header ── */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 text-white">
        <div className="max-w-4xl mx-auto px-6 py-10">
          <Link
            href={`/${locale}/hosting`}
            className="inline-flex items-center gap-1.5 text-indigo-200 hover:text-white text-sm mb-6 transition-colors"
          >
            <ChevronLeft className={cn('w-4 h-4', isRTL && 'rotate-180')} />
            {t('backToHosting')}
          </Link>

          <div className="flex items-center gap-3 mb-4">
            <img src="https://flagcdn.com/w80/eg.png" width={80} alt="Egypt" className="rounded-md shadow-md" />
            <div>
              <p className="text-indigo-300 text-sm font-medium uppercase tracking-wider">{t('regulationGuide')}</p>
              <h1 className="text-3xl font-bold">{t('pageTitle')}</h1>
            </div>
          </div>
          <p className="text-indigo-200 text-base max-w-2xl">
            {t('pageIntro')}
          </p>

          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-sm font-medium px-4 py-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {t('complianceAlert')}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-12">

        {/* ── Overview ── */}
        <section>
          <h2 className="text-xl font-bold text-neutral-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            {t('overviewTitle')}
          </h2>
          <div className="prose prose-neutral max-w-none text-neutral-700 text-sm leading-relaxed space-y-3">
            <p>{t('overview1')}</p>
            <p>{t('overview2')}</p>
            <p>{t('overview3')}</p>
          </div>
        </section>

        {/* ── Who must apply ── */}
        <section>
          <h2 className="text-xl font-bold text-neutral-900 mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" />
            {t('whoMustApplyTitle')}
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { emoji: '🏠', title: t('card1Title'), desc: t('card1Desc') },
              { emoji: '🏡', title: t('card2Title'), desc: t('card2Desc') },
              { emoji: '📋', title: t('card3Title'), desc: t('card3Desc') },
            ].map((item) => (
              <div key={item.title} className="rounded-xl border border-neutral-200 p-5">
                <div className="text-3xl mb-3">{item.emoji}</div>
                <h3 className="font-semibold text-neutral-900 text-sm mb-1">{item.title}</h3>
                <p className="text-xs text-neutral-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Requirements ── */}
        <section>
          <h2 className="text-xl font-bold text-neutral-900 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-indigo-600" />
            {t('requirementsTitle')}
          </h2>
          <ul className="space-y-3">
            {REQUIREMENTS.map((req) => (
              <li key={req} className="flex items-start gap-3 text-sm text-neutral-700">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                {req}
              </li>
            ))}
          </ul>
        </section>

        {/* ── How to apply ── */}
        <section>
          <h2 className="text-xl font-bold text-neutral-900 mb-6 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            {t('howToApplyTitle')}
          </h2>
          <div className="relative">
            <div className={cn('absolute top-0 bottom-0 w-0.5 bg-indigo-100', isRTL ? 'right-5' : 'left-5')} />
            <div className="space-y-6">
              {STEPS.map((step) => (
                <div key={step.number} className="flex gap-5">
                  <div className="relative z-10 flex-shrink-0 w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold shadow">
                    {step.number}
                  </div>
                  <div className="pt-1.5">
                    <h3 className="font-semibold text-neutral-900 text-sm mb-1">{step.title}</h3>
                    <p className="text-xs text-neutral-500 leading-relaxed">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Penalties ── */}
        <section>
          <h2 className="text-xl font-bold text-neutral-900 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-red-500" />
            {t('penaltiesTitle')}
          </h2>
          <div className="rounded-xl border border-red-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-red-50">
                  <th className={cn('px-5 py-3 font-semibold text-neutral-700', isRTL ? 'text-right' : 'text-left')}>{t('penaltyViolation')}</th>
                  <th className={cn('px-5 py-3 font-semibold text-neutral-700', isRTL ? 'text-right' : 'text-left')}>{t('penaltyLabel')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-50">
                {PENALTIES.map((row) => (
                  <tr key={row.label} className="hover:bg-red-50/50 transition-colors">
                    <td className="px-5 py-3 text-neutral-700">{row.label}</td>
                    <td className="px-5 py-3 text-red-700 font-medium">{row.penalty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Why it protects you ── */}
        <section className="rounded-2xl bg-indigo-50 border border-indigo-100 p-6">
          <h2 className="text-lg font-bold text-indigo-900 mb-3">{t('whyLicenseTitle')}</h2>
          <ul className="space-y-2 text-sm text-indigo-800">
            {WHY_POINTS.map((point) => (
              <li key={point} className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                {point}
              </li>
            ))}
          </ul>
        </section>

        {/* ── Official resources ── */}
        <section>
          <h2 className="text-xl font-bold text-neutral-900 mb-4">{t('officialResourcesTitle')}</h2>
          <div className="space-y-3">
            <a
              href="https://www.mota.gov.eg"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-xl border border-neutral-200 px-5 py-4 hover:border-indigo-400 hover:bg-indigo-50 transition-all group"
            >
              <div>
                <p className="font-medium text-neutral-900 text-sm group-hover:text-indigo-700">{t('motaPortalTitle')}</p>
                <p className="text-xs text-neutral-500">{t('motaPortalDesc')}</p>
              </div>
              <ExternalLink className="w-4 h-4 text-neutral-400 group-hover:text-indigo-600 flex-shrink-0" />
            </a>
            <a
              href="https://amereller.com/publication/new-holiday-homes-regulation-in-egypt-a-structured-regime-for-short-term-rentals-ministry-of-tourism-decrees-no-209-2025-and-no-801-2025/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-xl border border-neutral-200 px-5 py-4 hover:border-indigo-400 hover:bg-indigo-50 transition-all group"
            >
              <div>
                <p className="font-medium text-neutral-900 text-sm group-hover:text-indigo-700">{t('amerellerTitle')}</p>
                <p className="text-xs text-neutral-500">{t('amerellerDesc')}</p>
              </div>
              <ExternalLink className="w-4 h-4 text-neutral-400 group-hover:text-indigo-600 flex-shrink-0" />
            </a>
          </div>
        </section>

        {/* ── Disclaimer ── */}
        <p className="text-xs text-neutral-400 leading-relaxed border-t border-neutral-100 pt-6">
          {t('disclaimer')}
        </p>

      </div>
    </div>
  );
}
