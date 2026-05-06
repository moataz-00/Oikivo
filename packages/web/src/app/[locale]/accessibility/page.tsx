'use client';

import { FadeIn } from '@/components/ui/Motion';
import { useTranslations } from 'next-intl';

export default function AccessibilityPage() {
  const t = useTranslations('accessibility');

  const TOC = [
    { id: 'commitment', label: t('toc1Label') },
    { id: 'features', label: t('toc2Label') },
    { id: 'hosts', label: t('toc3Label') },
    { id: 'limitations', label: t('toc4Label') },
    { id: 'feedback', label: t('toc5Label') },
    { id: 'updates', label: t('toc6Label') },
  ];

  return (
    <div className="min-h-screen bg-white">
      <FadeIn>
        <section className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 py-14 px-4">
          <div className="mx-auto max-w-5xl">
            <span className="inline-block text-xs font-semibold text-indigo-200 uppercase tracking-widest mb-3">{t('supportLabel')}</span>
            <h1 className="font-display font-bold text-4xl text-white mb-3">{t('heroTitle')}</h1>
            <p className="text-indigo-100 text-sm">{t('heroDesc')}</p>
          </div>
        </section>
      </FadeIn>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex gap-12">
          <aside className="hidden lg:block w-56 shrink-0">
            <div className="sticky top-28">
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-4">{t('tocTitle')}</p>
              <nav className="space-y-1">
                {TOC.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="block text-sm text-neutral-500 hover:text-indigo-600 py-1 transition-colors"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          <FadeIn className="flex-1 max-w-2xl">
            <div className="space-y-10 text-neutral-600 text-sm leading-relaxed">
              <section id="commitment" className="scroll-mt-28">
                <h2 className="font-display font-bold text-xl text-neutral-900 mb-3">{t('sec1Title')}</h2>
                <p>
                  {t('sec1Desc')}
                </p>
              </section>

              <section id="features" className="scroll-mt-28">
                <h2 className="font-display font-bold text-xl text-neutral-900 mb-3">{t('sec2Title')}</h2>
                <ul className="space-y-2">
                  {[
                    t('sec2Item1'),
                    t('sec2Item2'),
                    t('sec2Item3'),
                    t('sec2Item4'),
                    t('sec2Item5'),
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </section>

              <section id="hosts" className="scroll-mt-28">
                <h2 className="font-display font-bold text-xl text-neutral-900 mb-3">{t('sec3Title')}</h2>
                <p>
                  {t('sec3Desc')}
                </p>
              </section>

              <section id="limitations" className="scroll-mt-28">
                <h2 className="font-display font-bold text-xl text-neutral-900 mb-3">{t('sec4Title')}</h2>
                <p>
                  {t('sec4Desc')}
                </p>
              </section>

              <section id="feedback" className="scroll-mt-28">
                <h2 className="font-display font-bold text-xl text-neutral-900 mb-3">{t('sec5Title')}</h2>
                <p>
                  {t('sec5Desc')}
                </p>
              </section>

              <section id="updates" className="scroll-mt-28">
                <h2 className="font-display font-bold text-xl text-neutral-900 mb-3">{t('sec6Title')}</h2>
                <p>
                  {t('sec6Desc')}
                </p>
              </section>
            </div>
          </FadeIn>
        </div>
      </div>
    </div>
  );
}
