'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import {
  Home, Search, Heart, MapPin,
  User, Settings, MessageSquare, Shield, FileText,
  Map, HelpCircle, Mail, Star, LayoutDashboard, Calendar, List,
} from 'lucide-react';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/Motion';

export default function SitemapPage() {
  const locale = useLocale();

  const sections = [
    {
      title: 'Discover',
      color: 'border-indigo-500',
      textColor: 'text-indigo-700',
      bgColor: 'bg-indigo-50',
      links: [
        { icon: Home, label: 'Home', href: '' },
        { icon: Search, label: 'Search Stays', href: '/s' },
        { icon: Star, label: 'Featured Places', href: '/s' },
      ],
    },
    {
      title: 'Travellers',
      color: 'border-violet-500',
      textColor: 'text-violet-700',
      bgColor: 'bg-violet-50',
      links: [
        { icon: MapPin, label: 'My Trips', href: '/trips' },
        { icon: Heart, label: 'Wishlists', href: '/wishlists' },
        { icon: MessageSquare, label: 'Inbox', href: '/inbox' },
        { icon: User, label: 'My Profile', href: '/profile/me' },
        { icon: Settings, label: 'Account Settings', href: '/account' },
      ],
    },
    {
      title: 'Hosting',
      color: 'border-amber-500',
      textColor: 'text-amber-700',
      bgColor: 'bg-amber-50',
      links: [
        { icon: LayoutDashboard, label: 'Host Dashboard', href: '/hosting' },
        { icon: List, label: 'My Listings', href: '/hosting/listings' },
        { icon: Calendar, label: 'Reservations', href: '/hosting/reservations' },
        { icon: Calendar, label: 'Calendar', href: '/hosting/listings' },
        { icon: MessageSquare, label: 'Host Inbox', href: '/hosting/inbox' },
      ],
    },
    {
      title: 'Account',
      color: 'border-emerald-500',
      textColor: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
      links: [
        { icon: User, label: 'Sign Up', href: '/register' },
        { icon: User, label: 'Log In', href: '/login' },
        { icon: Settings, label: 'Account', href: '/account' },
        { icon: Shield, label: 'Security', href: '/account' },
      ],
    },
    {
      title: 'Support',
      color: 'border-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      links: [
        { icon: HelpCircle, label: 'Help Center', href: '/help' },
        { icon: Mail, label: 'Contact Us', href: '/contact' },
        { icon: Shield, label: 'Safety Information', href: '/safety' },
        { icon: FileText, label: 'Cancellation Policy', href: '/cancellation' },
        { icon: Shield, label: 'Privacy Policy', href: '/privacy' },
        { icon: FileText, label: 'Terms of Service', href: '/terms' },
        { icon: User, label: 'Accessibility Statement', href: '/accessibility' },
        { icon: Map, label: 'Site Map', href: '/sitemap' },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <FadeIn>
        <section className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 px-4 py-16">
          <div className="mx-auto max-w-5xl flex items-start gap-5">
            <div className="hidden sm:flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15">
              <Map className="h-7 w-7 text-white" />
            </div>
            <div>
              <span className="inline-block text-xs font-semibold text-indigo-200 uppercase tracking-widest mb-3">Navigation</span>
              <h1 className="font-display font-bold text-4xl text-white mb-3">Site Map</h1>
              <p className="text-indigo-100 text-sm max-w-xl leading-relaxed">
                A complete guide to everything available on Journey Stay.
              </p>
              <div className="flex flex-wrap gap-2 mt-5">
                {['5 categories', 'All pages listed'].map((chip) => (
                  <span key={chip} className="rounded-full bg-white/15 px-3 py-1 text-xs text-white border border-white/20">{chip}</span>
                ))}
              </div>
            </div>
          </div>
        </section>
      </FadeIn>

      {/* Sitemap grid */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-14">
        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sections.map((section) => (
            <StaggerItem key={section.title}>
              <div className={`rounded-2xl border-t-4 ${section.color} border border-neutral-100 p-6 h-full shadow-sm hover:shadow-md transition-shadow`}>
                <div className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${section.bgColor} mb-4`}>
                  <span className={`text-xs font-bold ${section.textColor}`}>{section.title[0]}</span>
                </div>
                <h2 className={`font-display font-bold text-lg mb-4 ${section.textColor}`}>{section.title}</h2>
                <ul className="space-y-2.5">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={`/${locale}${link.href}`}
                        className="flex items-center gap-2.5 text-sm text-neutral-600 hover:text-indigo-600 transition-colors group"
                      >
                        <link.icon className="h-3.5 w-3.5 text-neutral-400 group-hover:text-indigo-500 transition-colors" />
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </section>
    </div>
  );
}
