'use client';

import { FadeIn } from '@/components/ui/Motion';
import {
  Calendar, XCircle, AlertTriangle, Clock, HelpCircle, Shield,
} from 'lucide-react';

const sections = [
  { id: 'overview', label: 'Policy Overview', icon: Calendar, iconBg: 'bg-blue-50 text-blue-600' },
  { id: 'guest', label: 'Guest Cancellations', icon: XCircle, iconBg: 'bg-orange-50 text-orange-600' },
  { id: 'host', label: 'Host Cancellations', icon: AlertTriangle, iconBg: 'bg-red-50 text-red-600' },
  { id: 'refunds', label: 'Refund Timing', icon: Clock, iconBg: 'bg-teal-50 text-teal-600' },
  { id: 'exceptions', label: 'Special Circumstances', icon: Shield, iconBg: 'bg-violet-50 text-violet-600' },
  { id: 'support', label: 'Need Help?', icon: HelpCircle, iconBg: 'bg-sky-50 text-sky-600' },
];

export default function CancellationPage() {
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
              <span className="inline-block text-xs font-semibold text-indigo-200 uppercase tracking-widest mb-3">Support</span>
              <h1 className="font-display font-bold text-4xl text-white mb-3">Cancellation Policy</h1>
              <p className="text-indigo-100 text-sm max-w-xl leading-relaxed">
                How cancellations, refunds, and exceptions are handled on Journey Stay.
              </p>
              <div className="flex flex-wrap gap-2 mt-5">
                {['3 policy tiers', 'Flexible · Moderate · Strict', '5–10 day refunds'].map((chip) => (
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
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-4">Contents</p>
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
                  <h2 className="font-display font-bold text-xl text-neutral-900">1. Policy Overview</h2>
                </div>
                <p>
                  Hosts choose a cancellation policy for each listing. The active policy is shown on the listing page and in the checkout summary before a guest confirms payment.
                </p>
              </section>

              <section id="guest" className="scroll-mt-28">
                <div className="flex items-center gap-3 mb-4">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-orange-50 text-orange-600 shrink-0">
                    <XCircle className="h-4 w-4" />
                  </span>
                  <h2 className="font-display font-bold text-xl text-neutral-900">2. Guest Cancellations</h2>
                </div>
                <p className="mb-4">Guests can cancel from the Trips page. Refund eligibility depends on timing and the listing&apos;s policy tier:</p>
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
                  <h2 className="font-display font-bold text-xl text-neutral-900">3. Host Cancellations</h2>
                </div>
                <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 mb-3">
                  <p className="text-sm text-red-800">Host cancellations may trigger penalties, impact listing ranking, and reduce trust with future guests.</p>
                </div>
                <p>
                  When a host cancels a confirmed booking, the guest is eligible for a full refund and will receive assistance finding an alternative stay.
                </p>
              </section>

              <section id="refunds" className="scroll-mt-28">
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-teal-50 text-teal-600 shrink-0">
                    <Clock className="h-4 w-4" />
                  </span>
                  <h2 className="font-display font-bold text-xl text-neutral-900">4. Refund Timing</h2>
                </div>
                <p>
                  Approved refunds are usually issued to the original payment method within 5–10 business days. Bank processing times may vary depending on your payment provider and card issuer.
                </p>
              </section>

              <section id="exceptions" className="scroll-mt-28">
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-violet-50 text-violet-600 shrink-0">
                    <Shield className="h-4 w-4" />
                  </span>
                  <h2 className="font-display font-bold text-xl text-neutral-900">5. Special Circumstances</h2>
                </div>
                <p>
                  In certain verified cases — major travel disruptions, government travel restrictions, or serious safety issues — Journey Stay may apply special handling beyond the standard policy. Supporting documentation is required to qualify.
                </p>
              </section>

              <section id="support" className="scroll-mt-28">
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-sky-600 shrink-0">
                    <HelpCircle className="h-4 w-4" />
                  </span>
                  <h2 className="font-display font-bold text-xl text-neutral-900">6. Need Help?</h2>
                </div>
                <p>
                  For cancellation support, visit the Help Center or Contact Us page. Include your booking ID, the timeline of events, and any supporting evidence for faster resolution.
                </p>
              </section>

            </div>
          </FadeIn>
        </div>
      </div>
    </div>
  );
}
