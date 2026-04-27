'use client';

import { FadeIn } from '@/components/ui/Motion';
import {
  Scale, FileText, UserCheck, CreditCard, XCircle,
  AlertTriangle, Shield, RefreshCw, CheckCircle2,
} from 'lucide-react';

const sections = [
  { id: 'acceptance', label: 'Acceptance of Terms', icon: CheckCircle2, iconBg: 'bg-emerald-50 text-emerald-600' },
  { id: 'platform', label: 'Using Our Platform', icon: FileText, iconBg: 'bg-blue-50 text-blue-600' },
  { id: 'account', label: 'Account Responsibilities', icon: UserCheck, iconBg: 'bg-violet-50 text-violet-600' },
  { id: 'bookings', label: 'Bookings & Payments', icon: CreditCard, iconBg: 'bg-amber-50 text-amber-600' },
  { id: 'cancellation', label: 'Cancellation Policy', icon: XCircle, iconBg: 'bg-orange-50 text-orange-600' },
  { id: 'prohibited', label: 'Prohibited Uses', icon: AlertTriangle, iconBg: 'bg-red-50 text-red-600' },
  { id: 'liability', label: 'Limitation of Liability', icon: Shield, iconBg: 'bg-neutral-100 text-neutral-600' },
  { id: 'changes', label: 'Changes to Terms', icon: RefreshCw, iconBg: 'bg-sky-50 text-sky-600' },
];

export default function TermsPage() {
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
              <span className="inline-block text-xs font-semibold text-indigo-200 uppercase tracking-widest mb-3">Legal</span>
              <h1 className="font-display font-bold text-4xl text-white mb-3">Terms of Service</h1>
              <p className="text-indigo-100 text-sm max-w-xl leading-relaxed">
                These terms form a binding agreement between you and Oikivo. Please read them carefully before using our platform.
              </p>
              <div className="flex flex-wrap gap-2 mt-5">
                {['8 sections', 'Last updated Mar 2026', 'Governing law: Egypt'].map((chip) => (
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

              <section id="acceptance" className="scroll-mt-28">
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
                    <CheckCircle2 className="h-4 w-4" />
                  </span>
                  <h2 className="font-display font-bold text-xl text-neutral-900">1. Acceptance of Terms</h2>
                </div>
                <p>
                  By accessing or using Oikivo's website, mobile application, or any of our services, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree, you may not use our services. These terms constitute a legally binding agreement between you and Oikivo.
                </p>
              </section>

              <section id="platform" className="scroll-mt-28">
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shrink-0">
                    <FileText className="h-4 w-4" />
                  </span>
                  <h2 className="font-display font-bold text-xl text-neutral-900">2. Using Our Platform</h2>
                </div>
                <p className="mb-3">
                  Oikivo is an online marketplace connecting travelers with hosts offering accommodations and experiences across Egypt and the MENA region. We facilitate transactions but are not a party to any rental or service agreement between hosts and guests.
                </p>
                <p>
                  You must be at least 18 years old to use our platform. You agree to provide accurate, current, and complete information during registration and to keep your account updated at all times.
                </p>
              </section>

              <section id="account" className="scroll-mt-28">
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-violet-50 text-violet-600 shrink-0">
                    <UserCheck className="h-4 w-4" />
                  </span>
                  <h2 className="font-display font-bold text-xl text-neutral-900">3. Account Responsibilities</h2>
                </div>
                <p className="mb-3">You are responsible for:</p>
                <ul className="space-y-2">
                  {[
                    'Maintaining the confidentiality of your account credentials',
                    'All activities that occur under your account',
                    'Notifying us immediately of any unauthorized use',
                    'Ensuring your account information is accurate and up to date',
                    'Using strong, unique passwords for your account',
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
                  <h2 className="font-display font-bold text-xl text-neutral-900">4. Bookings & Payments</h2>
                </div>
                <p className="mb-3">
                  When you book through Oikivo, you agree to pay all fees associated with your booking — including accommodation fees, cleaning fees, service fees, and applicable taxes. Payment is processed securely at the time of booking.
                </p>
                <p>
                  Hosts set their own pricing. Oikivo charges a service fee on each booking to cover platform costs, customer support, and payment processing. All fees are displayed before you confirm.
                </p>
              </section>

              <section id="cancellation" className="scroll-mt-28">
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-orange-50 text-orange-600 shrink-0">
                    <XCircle className="h-4 w-4" />
                  </span>
                  <h2 className="font-display font-bold text-xl text-neutral-900">5. Cancellation Policy</h2>
                </div>
                <p className="mb-3">
                  Cancellation policies vary by listing and are set by individual hosts. The applicable policy is displayed on each listing page and during checkout.
                </p>
                <p>
                  If you cancel a booking, any refund will be processed according to the cancellation policy in effect at the time of booking. Oikivo may offer resolution support in cases of disputes.
                </p>
              </section>

              <section id="prohibited" className="scroll-mt-28">
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-red-50 text-red-600 shrink-0">
                    <AlertTriangle className="h-4 w-4" />
                  </span>
                  <h2 className="font-display font-bold text-xl text-neutral-900">6. Prohibited Uses</h2>
                </div>
                <p className="mb-3">You agree not to:</p>
                <div className="rounded-xl bg-red-50 border border-red-100 px-5 py-4">
                  <ul className="space-y-2">
                    {[
                      'Use our platform for any illegal purpose',
                      'Circumvent our payment system or pay outside Oikivo',
                      'Post false, misleading, or fraudulent listings or reviews',
                      'Harass, threaten, or harm other users',
                      'Use automated tools to scrape or abuse our platform',
                      'Impersonate any person or organization',
                      'Discriminate based on race, religion, nationality, gender, or other protected characteristics',
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
                  <h2 className="font-display font-bold text-xl text-neutral-900">7. Limitation of Liability</h2>
                </div>
                <p className="mb-3">
                  To the maximum extent permitted by law, Oikivo is not liable for indirect, incidental, special, consequential, or punitive damages — including loss of profits, data, or goodwill.
                </p>
                <p>
                  Our liability to you for any cause shall be limited to the amount you paid Oikivo in the 12 months preceding the incident.
                </p>
              </section>

              <section id="changes" className="scroll-mt-28">
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-sky-600 shrink-0">
                    <RefreshCw className="h-4 w-4" />
                  </span>
                  <h2 className="font-display font-bold text-xl text-neutral-900">8. Changes to Terms</h2>
                </div>
                <p>
                  We may update these Terms at any time. We will notify you of significant changes via email or a notice on our platform. Continued use after the effective date constitutes acceptance. Questions?{' '}
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
