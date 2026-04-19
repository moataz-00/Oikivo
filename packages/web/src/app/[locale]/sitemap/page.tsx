'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import {
  Home, Search, Heart, MapPin,
  User, Settings, MessageSquare, Shield, FileText,
  Map, HelpCircle, Mail, Star, LayoutDashboard, Calendar, List,
  ArrowRight, Compass, Globe, UserCheck, LogIn, UserPlus, Lock,
  CreditCard, AlertTriangle, Accessibility,
} from 'lucide-react';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/Motion';
import { motion } from 'framer-motion';

// ── Section configuration ────────────────────────────────────────────────────
const SECTIONS = [
  {
    id: 'discover',
    title: 'Discover',
    description: 'Explore stays and destinations',
    icon: Compass,
    accent: 'indigo',
    gradient: 'from-indigo-500 to-indigo-700',
    iconBg: 'bg-indigo-50',
    iconColor: 'text-indigo-600',
    border: 'border-indigo-200',
    hoverBorder: 'hover:border-indigo-400',
    badgeBg: 'bg-indigo-100 text-indigo-700',
    linkHover: 'hover:text-indigo-600 hover:bg-indigo-50',
    iconHover: 'group-hover:text-indigo-500',
    dotColor: 'bg-indigo-400',
    links: [
      { icon: Home, label: 'Home', href: '', desc: 'Landing page & featured stays' },
      { icon: Search, label: 'Search Stays', href: '/s', desc: 'Find your next destination' },
      { icon: Star, label: 'Featured Places', href: '/s', desc: 'Top-rated properties' },
      { icon: Globe, label: 'Experiences', href: '/experiences', desc: 'Unique local activities' },
    ],
  },
  {
    id: 'travellers',
    title: 'Travellers',
    description: 'Manage your trips & activity',
    icon: MapPin,
    accent: 'violet',
    gradient: 'from-violet-500 to-violet-700',
    iconBg: 'bg-violet-50',
    iconColor: 'text-violet-600',
    border: 'border-violet-200',
    hoverBorder: 'hover:border-violet-400',
    badgeBg: 'bg-violet-100 text-violet-700',
    linkHover: 'hover:text-violet-600 hover:bg-violet-50',
    iconHover: 'group-hover:text-violet-500',
    dotColor: 'bg-violet-400',
    links: [
      { icon: MapPin, label: 'My Trips', href: '/trips', desc: 'Upcoming & past bookings' },
      { icon: Heart, label: 'Wishlists', href: '/wishlists', desc: 'Saved properties' },
      { icon: MessageSquare, label: 'Inbox', href: '/inbox', desc: 'Messages with hosts' },
      { icon: User, label: 'My Profile', href: '/profile/me', desc: 'Public profile page' },
      { icon: Settings, label: 'Account Settings', href: '/account', desc: 'Preferences & notifications' },
    ],
  },
  {
    id: 'hosting',
    title: 'Hosting',
    description: 'Tools for property owners',
    icon: LayoutDashboard,
    accent: 'amber',
    gradient: 'from-amber-500 to-orange-600',
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    border: 'border-amber-200',
    hoverBorder: 'hover:border-amber-400',
    badgeBg: 'bg-amber-100 text-amber-700',
    linkHover: 'hover:text-amber-700 hover:bg-amber-50',
    iconHover: 'group-hover:text-amber-500',
    dotColor: 'bg-amber-400',
    links: [
      { icon: LayoutDashboard, label: 'Host Dashboard', href: '/hosting', desc: 'Overview & analytics' },
      { icon: List, label: 'My Listings', href: '/hosting/listings', desc: 'Manage your properties' },
      { icon: Calendar, label: 'Reservations', href: '/hosting/reservations', desc: 'Pending & confirmed bookings' },
      { icon: Calendar, label: 'Calendar', href: '/hosting/listings', desc: 'Availability management' },
      { icon: MessageSquare, label: 'Host Inbox', href: '/hosting/inbox', desc: 'Guest communications' },
      { icon: CreditCard, label: 'Earnings', href: '/hosting', desc: 'Revenue & payouts' },
    ],
  },
  {
    id: 'account',
    title: 'Account',
    description: 'Sign in and manage access',
    icon: UserCheck,
    accent: 'emerald',
    gradient: 'from-emerald-500 to-teal-600',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    border: 'border-emerald-200',
    hoverBorder: 'hover:border-emerald-400',
    badgeBg: 'bg-emerald-100 text-emerald-700',
    linkHover: 'hover:text-emerald-700 hover:bg-emerald-50',
    iconHover: 'group-hover:text-emerald-500',
    dotColor: 'bg-emerald-400',
    links: [
      { icon: UserPlus, label: 'Sign Up', href: '/register', desc: 'Create a new account' },
      { icon: LogIn, label: 'Log In', href: '/login', desc: 'Access your account' },
      { icon: Settings, label: 'Account', href: '/account', desc: 'Profile & preferences' },
      { icon: Shield, label: 'Security', href: '/account', desc: 'Password & 2-factor auth' },
    ],
  },
  {
    id: 'support',
    title: 'Support',
    description: 'Help, legal & safety info',
    icon: HelpCircle,
    accent: 'blue',
    gradient: 'from-blue-500 to-indigo-600',
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    border: 'border-blue-200',
    hoverBorder: 'hover:border-blue-400',
    badgeBg: 'bg-blue-100 text-blue-700',
    linkHover: 'hover:text-blue-700 hover:bg-blue-50',
    iconHover: 'group-hover:text-blue-500',
    dotColor: 'bg-blue-400',
    links: [
      { icon: HelpCircle, label: 'Help Center', href: '/help', desc: 'FAQs & how-to guides' },
      { icon: Mail, label: 'Contact Us', href: '/contact', desc: 'Get in touch with support' },
      { icon: Shield, label: 'Safety Information', href: '/safety', desc: 'Platform safety policies' },
      { icon: AlertTriangle, label: 'Cancellation Policy', href: '/cancellation', desc: 'Refund & cancellation rules' },
      { icon: Lock, label: 'Privacy Policy', href: '/privacy', desc: 'How we handle your data' },
      { icon: FileText, label: 'Terms of Service', href: '/terms', desc: 'Platform rules & agreement' },
      { icon: Accessibility, label: 'Accessibility', href: '/accessibility', desc: 'Accessibility statement' },
      { icon: Map, label: 'Site Map', href: '/sitemap', desc: 'You are here' },
    ],
  },
];

const TOTAL_PAGES = SECTIONS.reduce((acc, s) => acc + s.links.length, 0);

// ── Component ────────────────────────────────────────────────────────────────
export default function SitemapPage() {
  const locale = useLocale();
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const visibleSections = useMemo(() =>
    activeSection ? SECTIONS.filter((s) => s.id === activeSection) : SECTIONS,
    [activeSection]
  );

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <FadeIn>
        <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 px-4 py-20">
          {/* Decorative blobs */}
          <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-violet-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-indigo-400/20 blur-3xl" />
          {/* Dot grid */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '28px 28px' }}
          />

          <div className="relative mx-auto max-w-5xl">
            <div className="flex items-start gap-5">
              <div className="hidden sm:flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20 shadow-lg">
                <Map className="h-8 w-8 text-white" />
              </div>
              <div>
                <span className="inline-block text-xs font-semibold text-indigo-200 uppercase tracking-widest mb-3">Navigation</span>
                <h1 className="font-display font-bold text-4xl sm:text-5xl text-white mb-4 leading-tight">
                  Site Map
                </h1>
                <p className="text-indigo-100 text-base max-w-xl leading-relaxed">
                  A complete overview of every page on Oikivo — find exactly what you need in seconds.
                </p>
                {/* Stats chips */}
                <div className="flex flex-wrap items-center gap-3 mt-7">
                  {[
                    { label: `${SECTIONS.length} categories` },
                    { label: `${TOTAL_PAGES} pages` },
                    { label: 'Always up to date' },
                  ].map((chip) => (
                    <span
                      key={chip.label}
                      className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-1.5 text-xs font-medium text-white border border-white/20 backdrop-blur-sm"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-300" />
                      {chip.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </FadeIn>

      {/* ── Quick-jump category filter ────────────────────────────────────── */}
      <FadeIn delay={0.1}>
        <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-neutral-100 shadow-sm">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-1 py-3 overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setActiveSection(null)}
                className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                  activeSection === null
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100'
                }`}
              >
                All
              </button>
              {SECTIONS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(activeSection === s.id ? null : s.id)}
                  className={`shrink-0 flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                    activeSection === s.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100'
                  }`}
                >
                  <s.icon className="h-3 w-3" />
                  {s.title}
                </button>
              ))}
            </div>
          </div>
        </div>
      </FadeIn>

      {/* ── Sitemap grid ──────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
        <StaggerContainer
          className={`grid gap-6 ${
            visibleSections.length === 1
              ? 'grid-cols-1 max-w-lg mx-auto'
              : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
          }`}
        >
          {visibleSections.map((section) => (
            <StaggerItem key={section.id}>
              <div
                className={`group relative rounded-2xl border bg-white p-6 h-full shadow-sm transition-all duration-300 hover:shadow-lg ${section.border} ${section.hoverBorder}`}
              >
                {/* Card header */}
                <div className="flex items-start justify-between mb-5">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${section.iconBg} shadow-sm`}>
                    <section.icon className={`h-5 w-5 ${section.iconColor}`} />
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${section.badgeBg}`}>
                    {section.links.length} pages
                  </span>
                </div>

                <h2 className={`font-display font-bold text-lg mb-1 ${section.iconColor}`}>
                  {section.title}
                </h2>
                <p className="text-xs text-neutral-400 mb-5 leading-relaxed">{section.description}</p>

                {/* Divider with gradient accent */}
                <div className={`h-px w-full bg-gradient-to-r ${section.gradient} opacity-20 mb-5`} />

                {/* Links list */}
                <ul className="space-y-1">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={`/${locale}${link.href}`}
                        className={`group/link flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm text-neutral-600 transition-all ${section.linkHover}`}
                      >
                        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${section.iconBg}`}>
                          <link.icon className={`h-3.5 w-3.5 text-neutral-400 transition-colors ${section.iconHover}`} />
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="font-medium block leading-tight">{link.label}</span>
                          {link.desc && (
                            <span className="text-xs text-neutral-400 leading-tight">{link.desc}</span>
                          )}
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 text-neutral-300 opacity-0 group-hover/link:opacity-100 transition-all -translate-x-1 group-hover/link:translate-x-0" />
                      </Link>
                    </li>
                  ))}
                </ul>

                {/* Bottom accent line */}
                <div className={`absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl bg-gradient-to-r ${section.gradient} opacity-0 group-hover:opacity-100 transition-opacity`} />
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </section>

      {/* ── Bottom CTA ────────────────────────────────────────────────────── */}
      <FadeIn delay={0.1}>
        <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pb-16">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-700 p-8 sm:p-10 text-center shadow-xl">
            <div className="pointer-events-none absolute -top-12 -right-12 h-52 w-52 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-8 -left-8 h-40 w-40 rounded-full bg-indigo-400/20 blur-2xl" />
            <div className="relative">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
                <Home className="h-6 w-6 text-white" />
              </div>
              <h2 className="font-display font-bold text-2xl sm:text-3xl text-white mb-3">
                Can&apos;t find what you need?
              </h2>
              <p className="text-indigo-100 text-sm max-w-md mx-auto mb-7">
                Our support team is always ready to help you navigate Oikivo.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link
                  href={`/${locale}/help`}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-indigo-700 shadow-sm hover:bg-indigo-50 transition-colors"
                >
                  <HelpCircle className="h-4 w-4" />
                  Visit Help Center
                </Link>
                <Link
                  href={`/${locale}/contact`}
                  className="inline-flex items-center gap-2 rounded-xl bg-white/15 border border-white/20 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/25 transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  Contact Support
                </Link>
              </div>
            </div>
          </div>
        </section>
      </FadeIn>
    </div>
  );
}
