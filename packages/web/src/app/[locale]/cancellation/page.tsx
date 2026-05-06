'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { FadeIn } from '@/components/ui/Motion';
import {
  Calendar, XCircle, AlertTriangle, Clock, HelpCircle, Shield, ArrowRight,
} from 'lucide-react';

export default function CancellationPage() {
  const locale = useLocale();
  const t = useTranslations('cancellation');

  const sections = [
    { id: 'overview', label: t('sec1Label'), icon: Calendar, iconBg: 'bg-blue-50 text-blue-600' },
    { id: 'guest', label: t('sec2Label'), icon: XCircle, iconBg: 'bg-orange-50 text-orange-600' },
    { id: 'host', label: t('sec3Label'), icon: AlertTriangle, iconBg: 'bg-red-50 text-red-600' },
    { id: 'refunds', label: t('sec4Label'), icon: Clock, iconBg: 'bg-teal-50 text-teal-600' },
    { id: 'exceptions', label: t('sec5Label'), icon: Shield, iconBg: 'bg-violet-50 text-violet-600' },
    { id: 'support', label: t('sec6Label'), icon: HelpCircle, iconBg: 'bg-sky-50 text-sky-600' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <FadeIn>
        <section className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 px-4 py-16">
          <div className="mx-auto max-w-5xl flex items-start gap-5">
            <div className="hidden sm:flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15">
              <Calendar className="h-7 w-7 text-white" />
            </div>
            <div>
              <span className="inline-block text-xs font-semibold text-indigo-200 uppercase tracking-widest mb-3">{t('supportLabel')}</span>
              <h1 className="font-display font-bold text-4xl text-white mb-3">{t('heroTitle')}</h1>
              <p className="text-indigo-100 text-sm max-w-xl leading-relaxed">
                {t('heroDesc')}
              </p>
              <div className="flex flex-wrap gap-2 mt-5">
                {[t('chip1'), t('chip2'), t('chip3')].map((chip) => (
                  <span key={chip} className="rounded-full bg-white/15 px-3 py-1 text-xs text-white border border-white/20">{chip}</span>
                ))}
              </div>
            </div>
          </div>
        </section>
      </FadeIn>

      {/* Content */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex gap-12">
          {/* TOC */}
          <aside className="hidden lg:block w-60 shrink-0">
            <div className="sticky top-28">
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-4">{t('tocTitle')}</p>
              <nav className="space-y-0.5">
                {sections.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-neutral-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors group"
                  >
                    <span className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md ${item.iconBg}`}>
                      <item.icon className="h-3 w-3" />
                    </span>
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main content */}
          <FadeIn className="flex-1 min-w-0">
            <div className="space-y-10 text-neutral-600 text-sm leading-relaxed">

              <section id="overview" className="scroll-mt-28">
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shrink-0">
                    <Calendar className="h-4 w-4" />
                  </span>
                  <h2 className="font-display font-bold text-xl text-neutral-900">{t('overviewTitle')}</h2>
                </div>
                <p>
                  {t('overviewDesc')}
                </p>
              </section>

              <section id="guest" className="scroll-mt-28">
                <div className="flex items-center gap-3 mb-4">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-orange-50 text-orange-600 shrink-0">
                    <XCircle className="h-4 w-4" />
                  </span>
                  <h2 className="font-display font-bold text-xl text-neutral-900">{t('guestTitle')}</h2>
                </div>
                <p className="mb-4">{t('guestDesc')}</p>
                <Link
                  href={`/${locale}/trips`}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors mb-4"
                >
                  {t('guestCta')}
                  <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </Link>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      label: 'Flexible',
                      labelColor: 'text-emerald-700 bg-emerald-100',
                      cardColor: 'border-emerald-200 bg-emerald-50',
                      rows: [
                        { when: '24h+ before check-in', result: '100% refund' },
                        { when: 'Within 24 hours', result: '50% refund' },
                      ],
                    },
                    {
                      label: 'Moderate',
                      labelColor: 'text-amber-700 bg-amber-100',
                      cardColor: 'border-amber-200 bg-amber-50',
                      rows: [
                        { when: '5+ days before', result: '100% refund' },
                        { when: '2–5 days before', result: '50% refund' },
                        { when: 'Less than 2 days', result: 'No refund' },
                      ],
                    },
                    {
                      label: 'Strict',
                      labelColor: 'text-red-700 bg-red-100',
                      cardColor: 'border-red-200 bg-red-50',
                      rows: [
                        { when: '7+ days before', result: '100% refund' },
                        { when: '2–7 days before', result: '50% refund' },
                        { when: 'Less than 2 days', result: 'No refund' },
                      ],
                    },
                  ].map((tier) => (
                    <div key={tier.label} className={`rounded-xl border-2 ${tier.cardColor} p-4`}>
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold mb-3 ${tier.labelColor}`}>{tier.label}</span>
                      <ul className="space-y-2.5">
                        {tier.rows.map((row) => (
                          <li key={row.when} className="text-xs">
                            <div className="text-neutral-500 mb-0.5">{row.when}</div>
                            <div className="font-semibold text-neutral-800">{row.result}</div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>

              <section id="host" className="scroll-mt-28">
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-red-50 text-red-600 shrink-0">
                    <AlertTriangle className="h-4 w-4" />
                  </span>
                  <h2 className="font-display font-bold text-xl text-neutral-900">{t('hostTitle')}</h2>
                </div>
                <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 mb-3">
                  <p className="text-sm text-red-800">{t('hostWarning')}</p>
                </div>
                <p>
                  {t('hostDesc')}
                </p>
              </section>

              <section id="refunds" className="scroll-mt-28">
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-teal-50 text-teal-600 shrink-0">
                    <Clock className="h-4 w-4" />
                  </span>
                  <h2 className="font-display font-bold text-xl text-neutral-900">{t('refundTitle')}</h2>
                </div>
                <p>
                  {t('refundDesc')}
                </p>
              </section>

              <section id="exceptions" className="scroll-mt-28">
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-violet-50 text-violet-600 shrink-0">
                    <Shield className="h-4 w-4" />
                  </span>
                  <h2 className="font-display font-bold text-xl text-neutral-900">{t('exceptionsTitle')}</h2>
                </div>
                <p>
                  {t('exceptionsDesc')}
                </p>
              </section>

              <section id="support" className="scroll-mt-28">
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-sky-600 shrink-0">
                    <HelpCircle className="h-4 w-4" />
                  </span>
                  <h2 className="font-display font-bold text-xl text-neutral-900">{t('supportTitle')}</h2>
                </div>
                <p className="mb-4">
                  {t('supportDesc')}
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href={`/${locale}/help`}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
                  >
                    {t('helpCenter')}
                    <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
                  </Link>
                  <Link
                    href={`/${locale}/contact`}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
                  >
                    {t('contactUs')}
                    <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
                  </Link>
                </div>
              </section>

            </div>
          </FadeIn>
        </div>
      </div>
    </div>
  );
}
