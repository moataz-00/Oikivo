'use client';

import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/Motion';
import { useTranslations } from 'next-intl';
import {
  Shield, Users, CreditCard, CheckCircle2, AlertTriangle, Phone,
} from 'lucide-react';

export default function SafetyPage() {
  const t = useTranslations('safety');

  const features = [
    {
      id: 'community',
      icon: Users,
      iconBg: 'bg-indigo-50 text-indigo-600',
      title: t('feature1Title'),
      desc: t('feature1Desc'),
    },
    {
      id: 'verification',
      icon: Shield,
      iconBg: 'bg-violet-50 text-violet-600',
      title: t('feature2Title'),
      desc: t('feature2Desc'),
    },
    {
      id: 'payments',
      icon: CreditCard,
      iconBg: 'bg-emerald-50 text-emerald-600',
      title: t('feature3Title'),
      desc: t('feature3Desc'),
    },
    {
      id: 'reporting',
      icon: AlertTriangle,
      iconBg: 'bg-red-50 text-red-600',
      title: t('feature4Title'),
      desc: t('feature4Desc'),
    },
    {
      id: 'support',
      icon: Phone,
      iconBg: 'bg-indigo-50 text-indigo-600',
      title: t('feature5Title'),
      desc: t('feature5Desc'),
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <FadeIn>
        <section className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 px-4 py-16">
          <div className="mx-auto max-w-5xl flex items-start gap-5">
            <div className="hidden sm:flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15">
              <Shield className="h-7 w-7 text-white" />
            </div>
            <div>
              <span className="inline-block text-xs font-semibold text-indigo-200 uppercase tracking-widest mb-3">{t('supportLabel')}</span>
              <h1 className="font-display font-bold text-4xl text-white mb-3">{t('heroTitle')}</h1>
              <p className="text-indigo-100 text-sm max-w-xl leading-relaxed">
                {t('heroDesc')}
              </p>
              <div className="flex flex-wrap gap-2 mt-5">
                {[t('chip1'), t('chip2'), t('chip3'), t('chip4')].map((chip) => (
                  <span key={chip} className="rounded-full bg-white/15 px-3 py-1 text-xs text-white border border-white/20">{chip}</span>
                ))}
              </div>
            </div>
          </div>
        </section>
      </FadeIn>

      {/* Feature cards */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12 space-y-10">

        {/* Main feature grid */}
        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {features.map((feature) => (
            <StaggerItem key={feature.id}>
              <div id={feature.id} className="rounded-2xl border border-neutral-100 bg-white shadow-sm p-5 flex gap-4 scroll-mt-28 h-full">
                <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${feature.iconBg}`}>
                  <feature.icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-semibold text-neutral-900 text-sm mb-1">{feature.title}</h3>
                  <p className="text-sm text-neutral-600 leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* Safe Stays Checklist */}
        <section id="stays" className="scroll-mt-28">
          <div className="flex items-center gap-3 mb-5">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-teal-50 text-teal-600 shrink-0">
              <CheckCircle2 className="h-4 w-4" />
            </span>
            <h2 className="font-display font-bold text-xl text-neutral-900">{t('checklistTitle')}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[t('check1'), t('check2'), t('check3'), t('check4'), t('check5')].map((item, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl bg-teal-50 border border-teal-100 px-4 py-3">
                <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
                <p className="text-sm text-teal-800 leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
