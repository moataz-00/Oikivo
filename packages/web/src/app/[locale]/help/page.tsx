'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import {
  Search, ChevronDown, Home, CreditCard, Calendar,
  MessageCircle, Shield, Star, HelpCircle,
} from 'lucide-react';

const categories = [
  {
    icon: Home,
    title: 'Listings & Properties',
    color: 'bg-indigo-50 text-indigo-600',
    faqs: [
      { q: 'How do I create a listing?', a: 'Go to Dashboard → Hosting → Create Listing. Fill in your property details, add photos, set pricing and availability.' },
      { q: 'Can I edit my listing after publishing?', a: 'Yes. From your hosting dashboard, go to Listings, click your property, then "Edit listing". Changes are live immediately.' },
      { q: 'How do I add or remove photos?', a: 'From the edit listing page, scroll to the Photos section. You can upload new photos, remove existing ones, or set a cover image.' },
    ],
  },
  {
    icon: CreditCard,
    title: 'Payments & Payouts',
    color: 'bg-emerald-50 text-emerald-600',
    faqs: [
      { q: 'When do I receive my payout?', a: 'Payouts are processed after a guest checks in. Funds are typically available within 1–3 business days depending on your bank.' },
      { q: 'What is the service fee?', a: 'Journey Stay charges a small service fee to cover platform costs. This is displayed transparently on each booking before confirmation.' },
      { q: 'How do I request a manual payout?', a: 'From Hosting → Earnings, click "Request Payout". The minimum payout amount is EGP 100.' },
    ],
  },
  {
    icon: Calendar,
    title: 'Bookings & Reservations',
    color: 'bg-blue-50 text-blue-600',
    faqs: [
      { q: 'How do I confirm or decline a reservation?', a: 'Go to Hosting → Reservations. Click on any pending booking to review guest details, then confirm or decline.' },
      { q: 'Can guests cancel their booking?', a: 'Yes. Guests can cancel according to your cancellation policy. Check the booking details page for the applicable policy.' },
      { q: 'How do I block dates on my calendar?', a: 'From Hosting → Listings → your property → Calendar, click any date to block or unblock it.' },
    ],
  },
  {
    icon: MessageCircle,
    title: 'Messaging & Communication',
    color: 'bg-violet-50 text-violet-600',
    faqs: [
      { q: 'How do I message a guest?', a: 'From Hosting → Inbox, or from the reservation detail page, use the message thread to communicate with your guest.' },
      { q: 'Are messages private?', a: 'Yes. Messages are only visible to you and the guest (or host) involved in the booking.' },
    ],
  },
  {
    icon: Shield,
    title: 'Safety & Trust',
    color: 'bg-indigo-50 text-indigo-700',
    faqs: [
      { q: 'How does Journey Stay verify guests?', a: 'All users must verify their email. We also encourage hosts to require ID verification before accepting bookings.' },
      { q: 'What if a guest damages my property?', a: 'Contact our support team within 48 hours of checkout with photos and a description. We will guide you through the resolution process.' },
    ],
  },
  {
    icon: Star,
    title: 'Reviews',
    color: 'bg-orange-50 text-orange-600',
    faqs: [
      { q: 'When can I leave a review?', a: 'You can leave a review for a guest within 14 days after checkout. Guests can also review their stay during this period.' },
      { q: 'Can I respond to a review?', a: 'Yes. From your listing page, find the review and click "Respond". Your response is public and visible to all future guests.' },
    ],
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-neutral-100 last:border-0">
      <button
        className="flex w-full items-center justify-between gap-3 py-4 text-left"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="text-sm font-medium text-neutral-900">{q}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-neutral-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <p className="pb-4 text-sm text-neutral-600 leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function HelpPage() {
  const locale = useLocale();
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = categories
    .map((cat) => ({
      ...cat,
      faqs: cat.faqs.filter(
        ({ q, a }) =>
          !query ||
          q.toLowerCase().includes(query.toLowerCase()) ||
          a.toLowerCase().includes(query.toLowerCase()),
      ),
    }))
    .filter((cat) =>
      !activeCategory
        ? cat.faqs.length > 0
        : cat.title === activeCategory && cat.faqs.length > 0,
    );

  const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
  const fadeUp = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

  return (
    <div className="min-h-screen bg-white">
      {/* Indigo Hero */}
      <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mx-auto max-w-4xl text-center"
        >
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 mb-5">
            <HelpCircle className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">How can we help?</h1>
          <p className="text-indigo-100 max-w-lg mx-auto">Find answers to common questions about Journey Stay.</p>

          {/* Search */}
          <div className="relative mt-7 max-w-lg mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search help articles..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-2xl border-0 bg-white py-3.5 pl-11 pr-4 text-sm text-neutral-900 shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>
        </motion.div>
      </div>

      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-12">

      {/* Category filter pills */}
      {!query && (
        <div className="flex flex-wrap items-center gap-2 mb-8 justify-center">
          <button
            onClick={() => setActiveCategory(null)}
            className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-colors ${!activeCategory ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-neutral-200 bg-white text-neutral-600 hover:border-indigo-300 hover:text-indigo-600'}`}
          >
            All topics
          </button>
          {categories.map(({ title, icon: Icon }) => (
            <button
              key={title}
              onClick={() => setActiveCategory(activeCategory === title ? null : title)}
              className={`flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-medium transition-colors ${activeCategory === title ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-neutral-200 bg-white text-neutral-600 hover:border-indigo-300 hover:text-indigo-600'}`}
            >
              <Icon className="h-3.5 w-3.5" />
              {title}
            </button>
          ))}
        </div>
      )}

      {/* FAQ sections */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-neutral-400">No results for &ldquo;{query}&rdquo;.</p>
        </div>
      ) : (
        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
          {filtered.map(({ title, icon: Icon, color, faqs }) => (
            <motion.div key={title} variants={fadeUp} className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-neutral-100">
                <span className={`inline-flex h-8 w-8 items-center justify-center rounded-xl ${color}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <h2 className="font-semibold text-neutral-900 text-sm">{title}</h2>
              </div>
              <div className="px-5">
                {faqs.map((faq) => <FaqItem key={faq.q} {...faq} />)}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Still need help */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.35 }}
        className="mt-12 rounded-2xl border border-indigo-100 bg-indigo-50 p-6 text-center"
      >
        <p className="text-sm font-medium text-neutral-900">Still have questions?</p>
        <p className="text-sm text-neutral-500 mt-1">Our support team is ready to help.</p>
        <Link
          href={`/${locale}/contact`}
          className="mt-4 inline-block rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
        >
          Contact support →
        </Link>
      </motion.div>
      </div>
    </div>
  );
}
