'use client';

import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/Motion';
import {
  Shield, Users, CreditCard, CheckCircle2, AlertTriangle, Phone,
} from 'lucide-react';

const features = [
  {
    id: 'community',
    icon: Users,
    iconBg: 'bg-indigo-50 text-indigo-600',
    title: '1. Community Standards',
    desc: 'All users must follow our community rules. We do not tolerate harassment, discrimination, fraud, violence, or unsafe property conditions. Accounts may be suspended for violations.',
  },
  {
    id: 'verification',
    icon: Shield,
    iconBg: 'bg-violet-50 text-violet-600',
    title: '2. Identity Verification',
    desc: 'We use verified email, verified phone, and optional government ID checks. Hosts can require additional verification before accepting bookings. Always communicate and pay within Journey Stay.',
  },
  {
    id: 'payments',
    icon: CreditCard,
    iconBg: 'bg-emerald-50 text-emerald-600',
    title: '3. Secure Payments',
    desc: 'Payments are processed through encrypted channels. Never send money outside Journey Stay — not via cash, direct bank transfers, or external payment links shared in messages.',
  },
  {
    id: 'reporting',
    icon: AlertTriangle,
    iconBg: 'bg-red-50 text-red-600',
    title: '5. Incident Reporting',
    desc: 'For emergencies, contact local emergency services first. For non-emergency incidents, report in-app with photos, timestamps, and details. Our team investigates all reports.',
  },
  {
    id: 'support',
    icon: Phone,
    iconBg: 'bg-indigo-50 text-indigo-600',
    title: '6. 24/7 Support',
    desc: "Need help during a trip? Contact support from the Help Center or Contact page. We prioritize urgent safety cases and can coordinate next-step guidance quickly.",
  },
];

export default function SafetyPage() {
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
              <span className="inline-block text-xs font-semibold text-indigo-200 uppercase tracking-widest mb-3">Support</span>
              <h1 className="font-display font-bold text-4xl text-white mb-3">Safety Information</h1>
              <p className="text-indigo-100 text-sm max-w-xl leading-relaxed">
                How Journey Stay helps guests and hosts stay safe before, during, and after every trip.
              </p>
              <div className="flex flex-wrap gap-2 mt-5">
                {['Verified users', 'Secure payments', 'Incident support', '24/7 help'].map((chip) => (
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
            <h2 className="font-display font-bold text-xl text-neutral-900">4. Safe Stays Checklist</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              'Review listing photos, amenities, and house rules before booking.',
              'Check host reviews and response rate.',
              'Message the host in-app if anything is unclear before arrival.',
              'At check-in, confirm emergency exits and safety equipment.',
              'Report any hazards immediately through the in-app support channel.',
            ].map((item, i) => (
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
