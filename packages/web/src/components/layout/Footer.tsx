'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import {
  Globe,
  Twitter,
  Instagram,
  Facebook,
  Youtube,
  ArrowUp,
  Send,
  MapPin,
  Mail,
  Heart,
} from 'lucide-react';
import { useCurrencyStore } from '@/store/currency.store';

const FOOTER_LINKS = {
  discover: [
    { labelKey: 'findHome', href: '' },
    { labelKey: 'search', href: '/s' },
    { labelKey: 'travel', href: '/travel', soon: true },
    { labelKey: 'wishlists', href: '/wishlists' },
    { labelKey: 'myTrips', href: '/trips' },
  ],
  hosting: [
    { labelKey: 'becomeHost', href: '/hosting/become-a-host' },
    { labelKey: 'hostDashboard', href: '/hosting' },
    { labelKey: 'manageListings', href: '/hosting/listings' },
    { labelKey: 'reservations', href: '/hosting/reservations' },
  ],
  support: [
    { labelKey: 'helpCenter', href: '/help' },
    { labelKey: 'contactUs', href: '/contact' },
    { labelKey: 'safetyInfo', href: '/safety' },
    { labelKey: 'cancellationPolicy', href: '/cancellation' },
  ],
  company: [
    { labelKey: 'privacyPolicy', href: '/privacy' },
    { labelKey: 'termsOfService', href: '/terms' },
    { labelKey: 'siteMap', href: '/sitemap' },
    { labelKey: 'accessibility', href: '/accessibility' },
  ],
};

const SOCIAL_LINKS = [
  { icon: Instagram, href: '#', label: 'Instagram' },
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: Facebook, href: '#', label: 'Facebook' },
  { icon: Youtube, href: '#', label: 'YouTube' },
];

const DESTINATIONS = [
  'Cairo', 'Alexandria', 'Hurghada', 'Sharm El-Sheikh', 'Luxor', 'Dahab',
];

export function Footer() {
  const locale = useLocale();
  const t = useTranslations('footer');
  const year = new Date().getFullYear();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const { selectedCurrency, hydrate } = useCurrencyStore();
  const displayCurrency = selectedCurrency ?? 'EGP';
  const displayLocale = locale === 'ar' ? 'العربية' : 'English (EG)';

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative bg-neutral-950 text-neutral-400 mt-auto overflow-hidden">
      {/* Subtle background decoration */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-indigo-500/[0.04] blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-64 w-64 rounded-full bg-violet-500/[0.04] blur-3xl" />
      </div>

      {/* Top gradient line */}
      <div className="h-0.5 gradient-brand" />

      {/* Newsletter banner */}
      <div className="relative border-b border-neutral-800/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="max-w-md">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Mail className="h-5 w-5 text-indigo-400" />
                {t('newsletterTitle')}
              </h3>
              <p className="mt-1 text-sm text-neutral-500">
                {t('newsletterDesc')}
              </p>
            </div>
            {subscribed ? (
              <div className="flex items-center gap-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 px-5 py-3">
                <Heart className="h-4 w-4 text-indigo-400" />
                <span className="text-sm text-indigo-300">{t('subscribed')}</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex w-full sm:w-auto">
                <div className="relative flex-1 sm:w-72">
                  <input
                    type="email"
                    required
                    placeholder={t('emailPlaceholder')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-l-xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-r-xl gradient-brand px-5 py-3 text-sm font-semibold text-white hover:brightness-110 transition-all"
                >
                  <Send className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('subscribe')}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main content */}
        <div className="pt-14 pb-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10 lg:gap-8">
          {/* Brand column — takes 2 cols */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden shadow-lg shadow-indigo-500/30">
                  <img src="/favicon-96x96.png" alt="Oikivo" width={40} height={40} className="h-full w-full object-cover" />
                </div>
                <span className="font-brand text-3xl text-indigo-400 tracking-wide">
                  Oikivo
                </span>
              </div>
              <p className="text-sm leading-relaxed text-neutral-500 max-w-xs">
                {t('tagline')}
              </p>
            </div>

            {/* Popular destinations */}
            <div>
              <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <MapPin className="h-3 w-3" />
                {t('popularDestinations')}
              </p>
              <div className="flex flex-wrap gap-2">
                {DESTINATIONS.map((city) => (
                  <Link
                    key={city}
                    href={`/${locale}/s?location=${city}`}
                    className="rounded-lg border border-neutral-800 bg-neutral-900/50 px-3 py-1.5 text-xs text-neutral-400 hover:border-indigo-500/50 hover:text-white transition-all duration-200"
                  >
                    {city}
                  </Link>
                ))}
              </div>
            </div>

            {/* Social links */}
            <div className="flex items-center gap-2.5">
              {SOCIAL_LINKS.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="group flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-800 bg-neutral-900/50 text-neutral-500 hover:border-indigo-500/50 hover:bg-indigo-500/10 hover:text-white transition-all duration-200"
                >
                  <Icon className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          <FooterColumn title={t('discoverTitle')} links={FOOTER_LINKS.discover} locale={locale} t={t} />
          <FooterColumn title={t('hostingTitle')} links={FOOTER_LINKS.hosting} locale={locale} t={t} />
          <FooterColumn title={t('supportTitle')} links={FOOTER_LINKS.support} locale={locale} t={t} />
          <FooterColumn title={t('companyTitle')} links={FOOTER_LINKS.company} locale={locale} t={t} />
        </div>

        {/* Divider with brand mark */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-neutral-800/60" />
          </div>
          <div className="relative flex justify-center">
            <div className="bg-neutral-950 px-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg overflow-hidden">
                <img src="/favicon-96x96.png" alt="Oikivo" width={28} height={28} className="h-full w-full object-cover" />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-neutral-600">
            {t('copyright', { year })}
          </p>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-xs text-neutral-600">
              <Globe className="h-3.5 w-3.5" />
              <span>{displayLocale}</span>
              <span className="mx-1 text-neutral-700">·</span>
              <span>{displayCurrency}</span>
            </div>

            {/* Back to top */}
            <button
              onClick={scrollToTop}
              aria-label={t('backToTop')}
              className="group flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900/50 px-3 py-1.5 text-xs text-neutral-500 hover:border-indigo-500/50 hover:text-white transition-all duration-200"
            >
              <ArrowUp className="h-3 w-3 transition-transform duration-200 group-hover:-translate-y-0.5" />
              {t('backToTop')}
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
  locale,
  t,
}: {
  title: string;
  links: { labelKey: string; href: string; soon?: boolean }[];
  locale: string;
  t: (key: string) => string;
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-4">
        {title}
      </h3>
      <ul className="space-y-2.5">
        {links.map((link) => (
          <li key={link.labelKey}>
            <Link
              href={`/${locale}${link.href}`}
              className="group inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-white transition-colors duration-200"
            >
              <span className="h-px w-0 bg-indigo-400 transition-all duration-200 group-hover:w-3" />
              {t(link.labelKey)}
              {link.soon && (
                <span className="rounded-full bg-rose-900/50 px-1.5 py-0.5 text-[10px] font-semibold text-rose-400 leading-none">
                  {t('soon')}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
