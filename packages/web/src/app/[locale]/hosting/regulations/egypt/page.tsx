'use client';

import Link from 'next/link';
import { ChevronLeft, AlertTriangle, CheckCircle, FileText, Building2, Shield, ExternalLink } from 'lucide-react';
import { useLocale } from 'next-intl';
import { cn } from '@/lib/utils';

const STEPS = [
  {
    number: 1,
    title: 'Register on the MoTA Portal',
    description:
      'Create an account on the Ministry of Tourism & Antiquities (MoTA) official portal (mota.gov.eg) and navigate to the Holiday Home License section.',
  },
  {
    number: 2,
    title: 'Prepare required documents',
    description:
      'National ID (or passport for non-Egyptians), property title deed or notarised lease agreement, engineering survey certificate, building permit, property insurance certificate, and a recent utility bill.',
  },
  {
    number: 3,
    title: 'Submit & pay the fee',
    description:
      'Upload all documents through the portal and pay the registration fee. Fees vary by unit type and number of rooms; currently set by MoTA at administrative cost.',
  },
  {
    number: 4,
    title: 'Inspection & approval',
    description:
      'A MoTA inspector may visit the property to verify compliance with safety and furnishing standards. Approval is typically issued within 30 working days.',
  },
  {
    number: 5,
    title: 'Display your license number',
    description:
      'Once approved, display the license number on all advertisements and booking platforms — including your listing on this platform.',
  },
];

const REQUIREMENTS = [
  'Unit must meet minimum furnishing and safety standards defined by MoTA',
  'Fire extinguisher and smoke detector must be installed',
  'First-aid kit must be available on the premises',
  'Host must keep a guest register for each stay',
  'Occupancy may not exceed the approved capacity stated in the license',
  'License must be renewed annually',
  'Tourism Tax (if applicable) must be collected and remitted to the Tax Authority',
];

const PENALTIES = [
  { label: 'Operating without a license', penalty: 'Fine of EGP 10,000–100,000 + potential unit seizure' },
  { label: 'Failure to display license number', penalty: 'Warning + fine of EGP 5,000' },
  { label: 'Exceeding approved capacity', penalty: 'Fine of EGP 5,000–20,000 + suspension of license' },
  { label: 'Not keeping a guest register', penalty: 'Fine of EGP 2,000–10,000' },
  { label: 'Repeated violations', penalty: 'Permanent license revocation & referral to prosecution' },
];

export default function EgyptRegulationsPage() {
  const locale = useLocale();

  return (
    <div className="min-h-screen bg-white">
      {/* ── Header ── */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 text-white">
        <div className="max-w-4xl mx-auto px-6 py-10">
          <Link
            href={`/${locale}/hosting`}
            className="inline-flex items-center gap-1.5 text-indigo-200 hover:text-white text-sm mb-6 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to hosting
          </Link>

          <div className="flex items-center gap-3 mb-4">
            <img src="https://flagcdn.com/w80/eg.png" width={80} alt="Egypt" className="rounded-md shadow-md" />
            <div>
              <p className="text-indigo-300 text-sm font-medium uppercase tracking-wider">Regulation Guide</p>
              <h1 className="text-3xl font-bold">Short-Term Rental Regulations in Egypt</h1>
            </div>
          </div>
          <p className="text-indigo-200 text-base max-w-2xl">
            Everything you need to know about the Holiday Home License introduced by the Ministry of Tourism &amp;
            Antiquities (MoTA) under Decrees No.&nbsp;209/2025 and No.&nbsp;801/2025.
          </p>

          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-sm font-medium px-4 py-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            Compliance required as of the effective date of Decree No.&nbsp;209/2025
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-12">

        {/* ── Overview ── */}
        <section>
          <h2 className="text-xl font-bold text-neutral-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            Overview
          </h2>
          <div className="prose prose-neutral max-w-none text-neutral-700 text-sm leading-relaxed space-y-3">
            <p>
              Egypt's Ministry of Tourism &amp; Antiquities issued <strong>Decree No.&nbsp;209 of 2025</strong> and
              supplementary <strong>Decree No.&nbsp;801 of 2025</strong>, establishing a formal licensing framework
              for <em>Holiday Homes</em> — privately owned or rented residential units offered to tourists for
              short-term stays.
            </p>
            <p>
              Prior to these decrees, short-term rental activity in Egypt operated in a legal grey area. The new
              framework brings Egypt in line with international best practice and gives both hosts and guests clear
              rights and responsibilities.
            </p>
            <p>
              Any host listing a property for short-term rental use in Egypt <strong>must obtain a Holiday Home
              License</strong> from MoTA before accepting bookings. Failure to comply may result in significant
              fines and administrative action.
            </p>
          </div>
        </section>

        {/* ── Who must apply ── */}
        <section>
          <h2 className="text-xl font-bold text-neutral-900 mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" />
            Who Must Apply?
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { emoji: '🏠', title: 'Apartment owners', desc: 'Renting out your own apartment for stays of fewer than 90 consecutive days' },
              { emoji: '🏡', title: 'Villa & chalet owners', desc: 'North Coast, Red Sea, or Nile-facing properties offered on a nightly or weekly basis' },
              { emoji: '📋', title: 'Tenants sub-letting', desc: 'If your lease permits, you must still obtain a Holiday Home License in your name' },
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
            Key Requirements
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
            How to Apply — Step by Step
          </h2>
          <div className="relative">
            <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-indigo-100" />
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
            Penalties for Non-Compliance
          </h2>
          <div className="rounded-xl border border-red-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-red-50">
                  <th className="text-left px-5 py-3 font-semibold text-neutral-700">Violation</th>
                  <th className="text-left px-5 py-3 font-semibold text-neutral-700">Penalty</th>
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
          <h2 className="text-lg font-bold text-indigo-900 mb-3">Why Licensing Protects You as a Host</h2>
          <ul className="space-y-2 text-sm text-indigo-800">
            {[
              'Gives you legal standing in case of disputes with guests or neighbours',
              'Enables you to collect Tourism Tax and issue official receipts',
              'Qualifies your listing for premium visibility on booking platforms',
              'Demonstrates credibility to guests and increases booking conversion',
              'Protects against administrative closure or seizure of your property',
            ].map((point) => (
              <li key={point} className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                {point}
              </li>
            ))}
          </ul>
        </section>

        {/* ── Official resources ── */}
        <section>
          <h2 className="text-xl font-bold text-neutral-900 mb-4">Official Resources</h2>
          <div className="space-y-3">
            <a
              href="https://www.mota.gov.eg"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-xl border border-neutral-200 px-5 py-4 hover:border-indigo-400 hover:bg-indigo-50 transition-all group"
            >
              <div>
                <p className="font-medium text-neutral-900 text-sm group-hover:text-indigo-700">MoTA Official Portal</p>
                <p className="text-xs text-neutral-500">mota.gov.eg — Ministry of Tourism & Antiquities</p>
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
                <p className="font-medium text-neutral-900 text-sm group-hover:text-indigo-700">Legal Analysis — Amereller</p>
                <p className="text-xs text-neutral-500">In-depth analysis of Decrees 209/2025 &amp; 801/2025</p>
              </div>
              <ExternalLink className="w-4 h-4 text-neutral-400 group-hover:text-indigo-600 flex-shrink-0" />
            </a>
          </div>
        </section>

        {/* ── Disclaimer ── */}
        <p className="text-xs text-neutral-400 leading-relaxed border-t border-neutral-100 pt-6">
          <strong>Disclaimer:</strong> This page is provided for informational purposes only and does not
          constitute legal advice. Regulations may change; always consult the official MoTA portal or a qualified
          Egyptian lawyer for up-to-date guidance specific to your situation.
        </p>

      </div>
    </div>
  );
}
