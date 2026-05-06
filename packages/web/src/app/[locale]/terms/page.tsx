'use client';

import { FadeIn } from '@/components/ui/Motion';
import { useTranslations } from 'next-intl';
import {
  Scale, FileText, UserCheck, CreditCard, XCircle,
  AlertTriangle, Shield, RefreshCw, CheckCircle2,
  Home, CalendarDays, Wallet, ShieldCheck, Star,
} from 'lucide-react';

export default function TermsPage() {
  const t = useTranslations('terms');

  const sections = [
    { id: 'acceptance', label: t('sec1Label'), icon: CheckCircle2, iconBg: 'bg-emerald-50 text-emerald-600' },
    { id: 'platform', label: t('sec2Label'), icon: FileText, iconBg: 'bg-blue-50 text-blue-600' },
    { id: 'account', label: t('sec3Label'), icon: UserCheck, iconBg: 'bg-violet-50 text-violet-600' },
    { id: 'bookings', label: t('sec4Label'), icon: CreditCard, iconBg: 'bg-amber-50 text-amber-600' },
    { id: 'cancellation', label: t('sec5Label'), icon: XCircle, iconBg: 'bg-orange-50 text-orange-600' },
    { id: 'prohibited', label: t('sec6Label'), icon: AlertTriangle, iconBg: 'bg-red-50 text-red-600' },
    { id: 'liability', label: t('sec7Label'), icon: Shield, iconBg: 'bg-neutral-100 text-neutral-600' },
    { id: 'changes', label: t('sec8Label'), icon: RefreshCw, iconBg: 'bg-sky-50 text-sky-600' },
  ];

  const hostSections = [
    { id: 'host-overview', label: t('host1Label'), icon: Home, iconBg: 'bg-indigo-50 text-indigo-600' },
    { id: 'host-listings', label: t('host2Label'), icon: FileText, iconBg: 'bg-teal-50 text-teal-600' },
    { id: 'host-commission', label: t('host3Label'), icon: Wallet, iconBg: 'bg-emerald-50 text-emerald-600' },
    { id: 'host-calendar', label: t('host4Label'), icon: CalendarDays, iconBg: 'bg-blue-50 text-blue-600' },
    { id: 'host-deposit', label: t('host5Label'), icon: ShieldCheck, iconBg: 'bg-amber-50 text-amber-600' },
    { id: 'host-conduct', label: t('host6Label'), icon: Star, iconBg: 'bg-violet-50 text-violet-600' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <FadeIn>
        <section className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 px-4 py-16">
          <div className="mx-auto max-w-5xl flex items-start gap-5">
            <div className="hidden sm:flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15">
              <Scale className="h-7 w-7 text-white" />
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
          {/* Sticky TOC */}
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
                <div className="pt-3 pb-1">
                  <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest px-2">{t('tocForHosts')}</p>
                </div>
                {hostSections.map((item) => (
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

              <section id="acceptance" className="scroll-mt-28">
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
                    <CheckCircle2 className="h-4 w-4" />
                  </span>
                  <h2 className="font-display font-bold text-xl text-neutral-900">{t('sec1Title')}</h2>
                </div>
                <p>
                  {t('sec1Desc')}
                </p>
              </section>

              <section id="platform" className="scroll-mt-28">
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shrink-0">
                    <FileText className="h-4 w-4" />
                  </span>
                  <h2 className="font-display font-bold text-xl text-neutral-900">{t('sec2Title')}</h2>
                </div>
                <p className="mb-3">
                  {t('sec2Desc1')}
                </p>
                <p>
                  {t('sec2Desc2')}
                </p>
              </section>

              <section id="account" className="scroll-mt-28">
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-violet-50 text-violet-600 shrink-0">
                    <UserCheck className="h-4 w-4" />
                  </span>
                  <h2 className="font-display font-bold text-xl text-neutral-900">{t('sec3Title')}</h2>
                </div>
                <p className="mb-3">{t('sec3Intro')}</p>
                <ul className="space-y-2">
                  {[
                    t('sec3Item1'),
                    t('sec3Item2'),
                    t('sec3Item3'),
                    t('sec3Item4'),
                    t('sec3Item5'),
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-violet-400 mt-1.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </section>

              <section id="bookings" className="scroll-mt-28">
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600 shrink-0">
                    <CreditCard className="h-4 w-4" />
                  </span>
                  <h2 className="font-display font-bold text-xl text-neutral-900">{t('sec4Title')}</h2>
                </div>
                <p className="mb-3">
                  {t('sec4Desc1')}
                </p>
                <p>
                  {t('sec4Desc2')}
                </p>
              </section>

              <section id="cancellation" className="scroll-mt-28">
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-orange-50 text-orange-600 shrink-0">
                    <XCircle className="h-4 w-4" />
                  </span>
                  <h2 className="font-display font-bold text-xl text-neutral-900">{t('sec5Title')}</h2>
                </div>
                <p className="mb-3">
                  {t('sec5Desc1')}
                </p>
                <p>
                  {t('sec5Desc2')}
                </p>
              </section>

              <section id="prohibited" className="scroll-mt-28">
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-red-50 text-red-600 shrink-0">
                    <AlertTriangle className="h-4 w-4" />
                  </span>
                  <h2 className="font-display font-bold text-xl text-neutral-900">{t('sec6Title')}</h2>
                </div>
                <p className="mb-3">{t('sec6Intro')}</p>
                <div className="rounded-xl bg-red-50 border border-red-100 px-5 py-4">
                  <ul className="space-y-2">
                    {[
                      t('sec6Item1'),
                      t('sec6Item2'),
                      t('sec6Item3'),
                      t('sec6Item4'),
                      t('sec6Item5'),
                      t('sec6Item6'),
                      t('sec6Item7'),
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2 text-red-800">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </section>

              <section id="liability" className="scroll-mt-28">
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600 shrink-0">
                    <Shield className="h-4 w-4" />
                  </span>
                  <h2 className="font-display font-bold text-xl text-neutral-900">{t('sec7Title')}</h2>
                </div>
                <p className="mb-3">
                  {t('sec7Desc1')}
                </p>
                <p>
                  {t('sec7Desc2')}
                </p>
              </section>

              <section id="changes" className="scroll-mt-28">
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-sky-600 shrink-0">
                    <RefreshCw className="h-4 w-4" />
                  </span>
                  <h2 className="font-display font-bold text-xl text-neutral-900">{t('sec8Title')}</h2>
                </div>
                <p>
                  {t('sec8Desc')}{' '}
                  <a href="mailto:oikivo.support@gmail.com" className="text-brand hover:underline">oikivo.support@gmail.com</a>
                </p>
              </section>

              {/* ── Host Policies divider ── */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-neutral-200" /></div>
                <div className="relative flex justify-center">
                  <span className="inline-flex items-center gap-2 bg-white px-4 py-1.5 rounded-full border border-indigo-100 text-xs font-semibold text-indigo-600 uppercase tracking-widest shadow-sm">
                    <Home className="h-3.5 w-3.5" /> {t('hostDividerLabel')}
                  </span>
                </div>
              </div>
              <p className="text-sm text-neutral-500 -mt-2 mb-2">
                {t('hostDividerDesc')}
              </p>

              <section id="host-overview" className="scroll-mt-28">
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
                    <Home className="h-4 w-4" />
                  </span>
                  <h2 className="font-display font-bold text-xl text-neutral-900">{t('sec9Title')}</h2>
                </div>
                <p className="mb-3">
                  {t('sec9Desc1')}
                </p>
                <p>
                  {t('sec9Desc2')}
                </p>
              </section>

              <section id="host-listings" className="scroll-mt-28">
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-teal-50 text-teal-600 shrink-0">
                    <FileText className="h-4 w-4" />
                  </span>
                  <h2 className="font-display font-bold text-xl text-neutral-900">{t('sec10Title')}</h2>
                </div>
                <p className="mb-3">{t('sec10Intro')}</p>
                <ul className="space-y-2 mb-4">
                  {[
                    t('sec10Item1'),
                    t('sec10Item2'),
                    t('sec10Item3'),
                    t('sec10Item4'),
                    t('sec10Item5'),
                    t('sec10Item6'),
                    t('sec10Item7'),
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-teal-400 mt-1.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-sm text-amber-800">
                  {t('sec10Warning')}
                </div>
              </section>

              <section id="host-commission" className="scroll-mt-28">
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
                    <Wallet className="h-4 w-4" />
                  </span>
                  <h2 className="font-display font-bold text-xl text-neutral-900">{t('sec11Title')}</h2>
                </div>
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-5 py-4 mb-4">
                  <p className="font-semibold text-emerald-800 text-sm mb-1">{t('sec11BoxTitle')}</p>
                  <p className="text-emerald-700 text-sm">{t('sec11BoxDesc')}</p>
                </div>
                <p className="mb-3">{t('sec11PayoutIntro')}</p>
                <ul className="space-y-2">
                  {[
                    t('sec11PayoutItem1'),
                    t('sec11PayoutItem2'),
                    t('sec11PayoutItem3'),
                    t('sec11PayoutItem4'),
                    t('sec11PayoutItem5'),
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </section>

              <section id="host-calendar" className="scroll-mt-28">
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shrink-0">
                    <CalendarDays className="h-4 w-4" />
                  </span>
                  <h2 className="font-display font-bold text-xl text-neutral-900">{t('sec12Title')}</h2>
                </div>
                <p className="mb-3">
                  {t('sec12Desc1')}
                </p>
                <div className="rounded-xl border border-blue-100 bg-blue-50 px-5 py-4 space-y-2 text-sm text-blue-900 mb-4">
                  <p className="font-semibold">{t('sec12BoxTitle')}</p>
                  <ul className="space-y-1.5">
                    {[
                      t('sec12BoxItem1'),
                      t('sec12BoxItem2'),
                      t('sec12BoxItem3'),
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <p>
                  {t('sec12Desc2')}
                </p>
              </section>

              <section id="host-deposit" className="scroll-mt-28">
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600 shrink-0">
                    <ShieldCheck className="h-4 w-4" />
                  </span>
                  <h2 className="font-display font-bold text-xl text-neutral-900">{t('sec13Title')}</h2>
                </div>
                <p className="mb-3">
                  {t('sec13Desc1')} <strong>{t('sec13DescBold')}</strong> {t('sec13Desc2')}
                </p>
                <ul className="space-y-2 mb-4">
                  {[
                    t('sec13Item1'),
                    t('sec13Item2'),
                    t('sec13Item3'),
                    t('sec13Item4'),
                    t('sec13Item5'),
                    t('sec13Item6'),
                    t('sec13Item7'),
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-800">
                  {t('sec13Warning')}
                </div>
              </section>

              <section id="host-conduct" className="scroll-mt-28">
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-violet-50 text-violet-600 shrink-0">
                    <Star className="h-4 w-4" />
                  </span>
                  <h2 className="font-display font-bold text-xl text-neutral-900">{t('sec14Title')}</h2>
                </div>
                <p className="mb-3">{t('sec14Intro')}</p>
                <ul className="space-y-2 mb-4">
                  {[
                    t('sec14Item1'),
                    t('sec14Item2'),
                    t('sec14Item3'),
                    t('sec14Item4'),
                    t('sec14Item5'),
                    t('sec14Item6'),
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-violet-400 mt-1.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <p>
                  {t('sec14Desc')}{' '}
                  <a href="mailto:oikivo.support@gmail.com" className="text-brand hover:underline">oikivo.support@gmail.com</a>
                </p>
              </section>

            </div>
          </FadeIn>
        </div>
      </div>
    </div>
  );
}
