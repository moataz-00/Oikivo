'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import {
  Home, Compass, UserCheck, ShieldCheck, Banknote,
  Star, Zap, Globe, ChevronRight, Check,
} from 'lucide-react';

const PRODUCTS = [
  {
    icon: Home,
    color: 'bg-indigo-50 text-indigo-600',
    badge: 'Core Product',
    badgeColor: 'bg-indigo-100 text-indigo-700',
    title: 'Stays',
    subtitle: 'Short-term property rentals across Egypt',
    description:
      'List your apartment, villa, chalet, or room and start earning. Guests book directly — you set the price, rules, and availability.',
    features: [
      'Instant Book or approve-first flow',
      'Flexible, moderate & strict cancellation policies',
      'Security deposit management',
      'Smart pricing: weekly/monthly discounts, last-minute deals',
      'Guest screening & identity verification',
      'AirBnB-style calendar management',
    ],
    href: '/rooms',
    cta: 'Browse stays',
    forHost: true,
    forGuest: true,
  },
  {
    icon: Compass,
    color: 'bg-emerald-50 text-emerald-600',
    badge: 'Coming Soon',
    badgeColor: 'bg-emerald-100 text-emerald-700',
    title: 'Experiences',
    subtitle: 'Book local activities hosted by real people',
    description:
      'Hosts can offer tours, cooking classes, boat trips, desert safaris and more. Guests discover authentic local experiences beyond a hotel room.',
    features: [
      'Activity listing with group discounts',
      'Per-person pricing',
      'Host rating & review system',
      'Instant booking for activities',
      'Photo galleries & itineraries',
      'Available across Egypt',
    ],
    href: '/experiences',
    cta: 'Explore experiences',
    forHost: true,
    forGuest: true,
  },
  {
    icon: UserCheck,
    color: 'bg-violet-50 text-violet-600',
    badge: 'Coming Soon',
    badgeColor: 'bg-violet-100 text-violet-700',
    title: 'Consultations',
    subtitle: 'On-demand expert advice for hosts & investors',
    description:
      'Connect with verified real estate consultants, interior designers, and property managers. Book a paid 1:1 video or in-person session in minutes.',
    features: [
      'Verified consultant profiles',
      'Video & in-person sessions',
      'Secure payment & escrow',
      'Ratings and portfolio reviews',
      'Document sharing',
      'Earn as a consultant',
    ],
    href: '/consultations',
    cta: 'Meet consultants',
    forHost: true,
    forGuest: false,
  },
];

const PLATFORM_FEATURES = [
  {
    icon: ShieldCheck,
    title: 'Verified identities',
    desc: 'ID document upload, review, and manual admin approval for all hosts and guests.',
  },
  {
    icon: Banknote,
    title: 'Transparent pricing',
    desc: 'Guests pay a 5% service fee. Hosts pay a 5% commission on nightly revenue. Cleaning fees pass through at 100%.',
  },
  {
    icon: Star,
    title: 'Two-way reviews',
    desc: 'Guests and hosts both leave reviews after every stay, building a trust economy.',
  },
  {
    icon: Zap,
    title: 'Instant payments',
    desc: 'Cards, Apple Pay, Google Pay, InstaPay. Payouts released 24 hours after check-in.',
  },
  {
    icon: Globe,
    title: 'Multi-currency & bilingual',
    desc: 'EGP base currency with live USD/EUR conversion. Full Arabic & English UI.',
  },
  {
    icon: ShieldCheck,
    title: 'Dispute resolution',
    desc: 'Built-in dispute system with evidence submission, appeals, admin arbitration, and automatic refunds.',
  },
];

const PRICING_COMPARISON = [
  { platform: 'Airbnb', guestFee: '14–16%', hostFee: '3%', total: '17–19%' },
  { platform: 'Booking.com', guestFee: '~17%', hostFee: '15–25%', total: '~32–42%' },
  { platform: 'Vrbo', guestFee: '6–12%', hostFee: '8%', total: '14–20%' },
  { platform: 'Oikivo', guestFee: '5%', hostFee: '5%', total: '~10%', highlight: true },
];

export default function SolutionsPage() {
  const locale = useLocale();

  return (
    <div className="min-h-screen bg-white">

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-900 text-white py-24 px-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(139,92,246,0.3),_transparent_60%)]" />
        <div className="relative mx-auto max-w-5xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-indigo-200 mb-5">
              Products & Solutions
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-5">
              Everything you need to{' '}
              <span className="text-indigo-300">host, book & earn</span>
            </h1>
            <p className="text-lg text-indigo-200 max-w-2xl mx-auto mb-8">
              Oikivo is Egypt&apos;s first all-in-one short-term rental platform — stays, experiences,
              and real estate consultations in one place, with the lowest fees in the market.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                href={`/${locale}/hosting/become-a-host`}
                className="inline-flex items-center gap-2 rounded-xl bg-white text-indigo-900 px-6 py-3 text-sm font-bold shadow hover:shadow-lg transition-all hover:-translate-y-0.5"
              >
                Start hosting <ChevronRight className="h-4 w-4" />
              </Link>
              <Link
                href={`/${locale}/s`}
                className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 text-white px-6 py-3 text-sm font-semibold hover:bg-white/20 transition-colors"
              >
                Find a stay
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Products */}
      <section className="py-20 px-4">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-neutral-900">Our products</h2>
            <p className="text-neutral-500 mt-2">Three ways to discover, host, and earn on Oikivo.</p>
          </div>
          <div className="space-y-8">
            {PRODUCTS.map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="rounded-2xl border border-neutral-200 bg-white p-7 flex flex-col lg:flex-row gap-6"
              >
                {/* Left */}
                <div className="lg:w-64 shrink-0">
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${p.color} mb-3`}>
                    <p.icon className="h-6 w-6" />
                  </div>
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${p.badgeColor} mb-2`}>
                    {p.badge}
                  </span>
                  <h3 className="text-xl font-bold text-neutral-900">{p.title}</h3>
                  <p className="text-sm text-neutral-500 mt-1">{p.subtitle}</p>
                  <div className="flex gap-1.5 mt-3">
                    {p.forGuest && (
                      <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs text-neutral-600 font-medium">For guests</span>
                    )}
                    {p.forHost && (
                      <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs text-neutral-600 font-medium">For hosts</span>
                    )}
                  </div>
                </div>

                {/* Right */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-neutral-600 mb-4">{p.description}</p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-1.5 gap-x-4 mb-5">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-neutral-700">
                        <Check className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={`/${locale}${p.href}`}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:underline"
                  >
                    {p.cta} <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform features */}
      <section className="bg-neutral-50 py-20 px-4">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-neutral-900">Built-in platform features</h2>
            <p className="text-neutral-500 mt-2">Everything a modern rental marketplace needs — out of the box.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {PLATFORM_FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="rounded-2xl bg-white border border-neutral-200 p-5"
              >
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 mb-3">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-neutral-900 mb-1">{f.title}</h3>
                <p className="text-sm text-neutral-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Fee comparison */}
      <section className="py-20 px-4">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-neutral-900">The lowest fees in the market</h2>
            <p className="text-neutral-500 mt-2">We charge the guest and the host each 5% — that&apos;s it.</p>
          </div>
          <div className="rounded-2xl border border-neutral-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200">
                  <th className="text-left px-5 py-3.5 font-semibold text-neutral-700">Platform</th>
                  <th className="text-center px-4 py-3.5 font-semibold text-neutral-700">Guest fee</th>
                  <th className="text-center px-4 py-3.5 font-semibold text-neutral-700">Host fee</th>
                  <th className="text-center px-4 py-3.5 font-semibold text-neutral-700">Total taken</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {PRICING_COMPARISON.map((row) => (
                  <tr
                    key={row.platform}
                    className={row.highlight ? 'bg-indigo-50' : 'bg-white'}
                  >
                    <td className={`px-5 py-3.5 font-semibold ${row.highlight ? 'text-indigo-700' : 'text-neutral-900'}`}>
                      {row.platform}
                      {row.highlight && (
                        <span className="ml-2 rounded-full bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 align-middle">
                          US
                        </span>
                      )}
                    </td>
                    <td className={`text-center px-4 py-3.5 ${row.highlight ? 'text-indigo-700 font-bold' : 'text-neutral-600'}`}>
                      {row.guestFee}
                    </td>
                    <td className={`text-center px-4 py-3.5 ${row.highlight ? 'text-indigo-700 font-bold' : 'text-neutral-600'}`}>
                      {row.hostFee}
                    </td>
                    <td className={`text-center px-4 py-3.5 font-semibold ${row.highlight ? 'text-indigo-700' : 'text-neutral-600'}`}>
                      {row.total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-neutral-400 mt-3 text-center">
            * Guest service fee applies to (nightly subtotal + cleaning fee). Host commission applies to nightly subtotal only.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-indigo-950 to-violet-900 py-20 px-4 text-center text-white">
        <div className="mx-auto max-w-xl">
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-indigo-200 mb-8">Join hundreds of Egyptian hosts earning more with lower fees.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href={`/${locale}/hosting/become-a-host`}
              className="inline-flex items-center gap-2 rounded-xl bg-white text-indigo-900 px-7 py-3.5 text-sm font-bold shadow hover:shadow-lg transition-all hover:-translate-y-0.5"
            >
              List your property <ChevronRight className="h-4 w-4" />
            </Link>
            <Link
              href={`/${locale}/s`}
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 text-white px-7 py-3.5 text-sm font-semibold hover:bg-white/20 transition-colors"
            >
              Find a stay
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
