'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import {
  Search, ChevronDown, Home, CreditCard, Calendar,
  MessageCircle, Shield, Star, HelpCircle,
} from 'lucide-react';


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
  const t = useTranslations('help');
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categories = [
    {
      icon: Home,
      title: t('cat1Title'),
      color: 'bg-indigo-50 text-indigo-600',
      faqs: [
        { q: t('cat1Q1'), a: t('cat1A1') },
        { q: t('cat1Q2'), a: t('cat1A2') },
        { q: t('cat1Q3'), a: t('cat1A3') },
      ],
    },
    {
      icon: CreditCard,
      title: t('cat2Title'),
      color: 'bg-emerald-50 text-emerald-600',
      faqs: [
        { q: t('cat2Q1'), a: t('cat2A1') },
        { q: t('cat2Q2'), a: t('cat2A2') },
        { q: t('cat2Q3'), a: t('cat2A3') },
      ],
    },
    {
      icon: Calendar,
      title: t('cat3Title'),
      color: 'bg-blue-50 text-blue-600',
      faqs: [
        { q: t('cat3Q1'), a: t('cat3A1') },
        { q: t('cat3Q2'), a: t('cat3A2') },
        { q: t('cat3Q3'), a: t('cat3A3') },
      ],
    },
    {
      icon: MessageCircle,
      title: t('cat4Title'),
      color: 'bg-violet-50 text-violet-600',
      faqs: [
        { q: t('cat4Q1'), a: t('cat4A1') },
        { q: t('cat4Q2'), a: t('cat4A2') },
      ],
    },
    {
      icon: Shield,
      title: t('cat5Title'),
      color: 'bg-indigo-50 text-indigo-700',
      faqs: [
        { q: t('cat5Q1'), a: t('cat5A1') },
        { q: t('cat5Q2'), a: t('cat5A2') },
      ],
    },
    {
      icon: Star,
      title: t('cat6Title'),
      color: 'bg-orange-50 text-orange-600',
      faqs: [
        { q: t('cat6Q1'), a: t('cat6A1') },
        { q: t('cat6Q2'), a: t('cat6A2') },
      ],
    },
  ];

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
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">{t('heroTitle')}</h1>
          <p className="text-indigo-100 max-w-lg mx-auto">{t('heroDesc')}</p>

          {/* Search */}
          <div className="relative mt-7 max-w-lg mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
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
            {t('allTopics')}
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
          <p className="text-neutral-400">{t('noResults', { query })}</p>
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
        <p className="text-sm font-medium text-neutral-900">{t('stillHaveQuestions')}</p>
        <p className="text-sm text-neutral-500 mt-1">{t('stillHaveQuestionsDesc')}</p>
        <Link
          href={`/${locale}/contact`}
          className="mt-4 inline-block rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
        >
          {t('contactSupport')}
        </Link>
      </motion.div>
      </div>
    </div>
  );
}
