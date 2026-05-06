'use client';

import { FadeIn } from '@/components/ui/Motion';
import { useTranslations } from 'next-intl';
import {
  Lock, Database, CheckCircle2, Share, Settings,
  Shield, UserCog, Mail,
} from 'lucide-react';

export default function PrivacyPage() {
  const t = useTranslations('privacy');

  const sections = [
    { id: 'collect', label: t('sec1Label'), icon: Database, iconBg: 'bg-blue-50 text-blue-600' },
    { id: 'use', label: t('sec2Label'), icon: CheckCircle2, iconBg: 'bg-emerald-50 text-emerald-600' },
    { id: 'share', label: t('sec3Label'), icon: Share, iconBg: 'bg-violet-50 text-violet-600' },
    { id: 'cookies', label: t('sec4Label'), icon: Settings, iconBg: 'bg-amber-50 text-amber-600' },
    { id: 'security', label: t('sec5Label'), icon: Shield, iconBg: 'bg-teal-50 text-teal-600' },
    { id: 'rights', label: t('sec6Label'), icon: UserCog, iconBg: 'bg-orange-50 text-orange-600' },
    { id: 'contact', label: t('sec7Label'), icon: Mail, iconBg: 'bg-sky-50 text-sky-600' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <FadeIn>
        <section className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 px-4 py-16">
          <div className="mx-auto max-w-5xl flex items-start gap-5">
            <div className="hidden sm:flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15">
              <Lock className="h-7 w-7 text-white" />
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
              </nav>
            </div>
          </aside>

          {/* Main content */}
          <FadeIn className="flex-1 min-w-0">
            {/* Callout */}
            <div className="mb-10 rounded-xl bg-indigo-50 border border-indigo-100 px-5 py-4 flex items-start gap-3">
              <Shield className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-indigo-900">{t('calloutTitle')}</p>
                <p className="text-sm text-indigo-700 mt-0.5">{t('calloutDesc')}</p>
              </div>
            </div>

            <div className="space-y-10 text-neutral-600 text-sm leading-relaxed">
              <p>
                {t('introDesc')}
              </p>

              <section id="collect" className="scroll-mt-28">
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shrink-0">
                    <Database className="h-4 w-4" />
                  </span>
                  <h2 className="font-display font-bold text-xl text-neutral-900">{t('collectTitle')}</h2>
                </div>
                <p className="mb-3">{t('collectIntro')}</p>
                <ul className="space-y-2">
                  {[
                    t('collectItem1'),
                    t('collectItem2'),
                    t('collectItem3'),
                    t('collectItem4'),
                    t('collectItem5'),
                    t('collectItem6'),
                    t('collectItem7'),
                    t('collectItem8'),
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </section>

              <section id="use" className="scroll-mt-28">
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
                    <CheckCircle2 className="h-4 w-4" />
                  </span>
                  <h2 className="font-display font-bold text-xl text-neutral-900">{t('useTitle')}</h2>
                </div>
                <p className="mb-3">{t('useIntro')}</p>
                <ul className="space-y-2">
                  {[
                    t('useItem1'),
                    t('useItem2'),
                    t('useItem3'),
                    t('useItem4'),
                    t('useItem5'),
                    t('useItem6'),
                    t('useItem7'),
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </section>

              <section id="share" className="scroll-mt-28">
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-violet-50 text-violet-600 shrink-0">
                    <Share className="h-4 w-4" />
                  </span>
                  <h2 className="font-display font-bold text-xl text-neutral-900">{t('shareTitle')}</h2>
                </div>
                <p>
                  {t('shareDesc')}
                </p>
              </section>

              <section id="cookies" className="scroll-mt-28">
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600 shrink-0">
                    <Settings className="h-4 w-4" />
                  </span>
                  <h2 className="font-display font-bold text-xl text-neutral-900">{t('cookiesTitle')}</h2>
                </div>
                <p>
                  {t('cookiesDesc')}
                </p>
              </section>

              <section id="security" className="scroll-mt-28">
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-teal-50 text-teal-600 shrink-0">
                    <Shield className="h-4 w-4" />
                  </span>
                  <h2 className="font-display font-bold text-xl text-neutral-900">{t('securityTitle')}</h2>
                </div>
                <p>
                  {t('securityDesc')}
                </p>
              </section>

              <section id="rights" className="scroll-mt-28">
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-orange-50 text-orange-600 shrink-0">
                    <UserCog className="h-4 w-4" />
                  </span>
                  <h2 className="font-display font-bold text-xl text-neutral-900">{t('rightsTitle')}</h2>
                </div>
                <p className="mb-3">{t('rightsIntro')}</p>
                <ul className="space-y-2">
                  {[
                    t('rightsItem1'),
                    t('rightsItem2'),
                    t('rightsItem3'),
                    t('rightsItem4'),
                    t('rightsItem5'),
                    t('rightsItem6'),
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-orange-400 mt-1.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </section>

              <section id="contact" className="scroll-mt-28">
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-sky-600 shrink-0">
                    <Mail className="h-4 w-4" />
                  </span>
                  <h2 className="font-display font-bold text-xl text-neutral-900">{t('contactTitle')}</h2>
                </div>
                <p>
                  {t('contactDesc')}{' '}
                  <a href="mailto:oikivo.support@gmail.com" className="text-brand hover:underline">oikivo.support@gmail.com</a>.
                  {' '}{t('contactAfterEmail')}
                </p>
              </section>

            </div>
          </FadeIn>
        </div>
      </div>
    </div>
  );
}
