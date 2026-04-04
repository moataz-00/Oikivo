'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  Globe,
  Menu,
  Home,
  User,
  Heart,
  MapPin,
  MessageSquare,
  LogOut,
  Settings,
  ChevronRight,
  Search,
  X,
  Plane,
  Bell,
  GraduationCap,
  LayoutDashboard,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import { useAuth } from '@/hooks/useAuth';
import { SearchBar } from '@/components/search/SearchBar';
import { notificationsApi } from '@/lib/api';
import { LanguageCurrencyModal } from '@/components/layout/LanguageCurrencyModal';

export function Navbar() {
  const t = useTranslations('nav');
  const tHosting = useTranslations('hosting');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoggedIn, isHost, isHostMode, toggleHostMode, logout, isConsultant } = useAuth();
  const searchParams = useSearchParams();
  const [scrolled, setScrolled] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);

  const { data: unreadData } = useQuery({
    queryKey: ['unread-count'],
    queryFn: () => notificationsApi.getUnreadCount(),
    enabled: isLoggedIn,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
  const unreadCount = (unreadData as any)?.count ?? 0;

  const isHomePage = pathname === `/${locale}` || pathname === '/';
  const isHostingPage = pathname.includes('/hosting');
  const isConsultationsTab = isHomePage && searchParams.get('tab') === 'consultations';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => { setSearchExpanded(false); }, [pathname]);

  const handleLogout = () => {
    logout();
    router.push(`/${locale}`);
  };

  const hostingHref = `/${locale}/hosting`;
  const beHostHref = `/${locale}/hosting/become-a-host`;

  const showCompactSearch = scrolled && isHomePage && !searchExpanded;
  const showExpandedSearch = isHomePage && searchExpanded;

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-40 bg-white transition-all duration-300',
          scrolled || !isHomePage ? 'border-b border-neutral-200 shadow-sm' : 'border-b border-transparent'
        )}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className={cn(
            'flex items-center justify-between gap-4 transition-all duration-300',
            isHostingPage ? 'h-16' : 'h-20'
          )}>
            {/* Logo */}
            <Link href={`/${locale}`} className="flex items-center gap-2 shrink-0" aria-label="Oikivo home">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex h-9 w-9 items-center justify-center rounded-xl gradient-brand shadow-md shadow-indigo-500/30"
              >
                <span className="text-white text-lg font-bold leading-none">O</span>
              </motion.div>
              <span className="font-brand text-2xl gradient-brand-text hidden sm:block">Oikivo</span>
            </Link>

            {/* Center: compact pill or expanded search */}
            {!isHostingPage && (
              <div className="flex-1 flex items-center justify-center max-w-xl mx-4">
                <AnimatePresence mode="wait">
                  {showCompactSearch ? (
                    <motion.button
                      key="compact"
                      initial={{ opacity: 0, scale: 0.95, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -4 }}
                      transition={{ duration: 0.2 }}
                      onClick={() => setSearchExpanded(true)}
                      className="flex items-center gap-3 rounded-full border border-neutral-300 bg-white px-4 py-2.5 text-sm shadow-sm hover:shadow-md transition-shadow w-full max-w-sm"
                    >
                      <Search className="h-4 w-4 text-neutral-500 shrink-0" />
                      <span className="flex-1 text-start text-neutral-400 font-medium">{t('searchPlaceholder')}</span>
                      <span className="h-5 w-px bg-neutral-200" />
                      <span className="text-neutral-400 text-xs whitespace-nowrap">{t('anyweek')}</span>
                    </motion.button>
                  ) : showExpandedSearch ? (
                    <motion.div
                      key="expanded"
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      transition={{ duration: 0.2 }}
                      className="w-full flex items-center gap-2"
                    >
                      <div className="flex-1"><SearchBar /></div>
                      {searchExpanded && (
                        <button
                          onClick={() => setSearchExpanded(false)}
                          className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            )}

            {/* Right side */}
            <div className="flex items-center gap-1 shrink-0">
              {!isHostMode && !isHostingPage && (
                isConsultationsTab ? (
                  /* ── Consultations tab: show consultant action ── */
                  isConsultant ? (
                    <Link href={`/${locale}/consultations/dashboard`} className="hidden lg:flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors whitespace-nowrap">
                      <GraduationCap className="h-4 w-4" />
                      {locale === 'ar' ? 'التحويل إلى مستشار' : 'Switch to Consultant'}
                    </Link>
                  ) : (
                    <Link href={`/${locale}/consultations/become-a-consultant`} className="hidden lg:flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors whitespace-nowrap">
                      <GraduationCap className="h-4 w-4" />
                      {locale === 'ar' ? 'كن مستشاراً' : 'Become a Consultant'}
                    </Link>
                  )
                ) : (
                  /* ── Homes tab or any other page: show host action ── */
                  <Link href={isHost ? hostingHref : beHostHref} className="hidden lg:block rounded-full px-4 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-100 transition-colors whitespace-nowrap">
                    {isHost ? t('switchToHosting') : t('becomeHost')}
                  </Link>
                )
              )}
              {(isHostMode || isHostingPage) && (
                <Link href={`/${locale}`} className="hidden lg:block rounded-full px-4 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-100 transition-colors">
                  {locale === 'ar' ? 'التحويل إلى مسافر' : 'Switch to Travelling'}
                </Link>
              )}

              {/* Bell / Notifications */}
              {isLoggedIn && (
                <Link
                  href={`/${locale}/notifications`}
                  className="relative rounded-full p-2.5 text-neutral-600 hover:bg-neutral-100 transition-colors"
                  aria-label="Notifications"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 rtl:right-auto rtl:-left-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white ring-2 ring-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
              )}

              {/* Language & Currency */}
              <button
                onClick={() => setLangOpen(true)}
                className="rounded-full p-2.5 text-neutral-600 hover:bg-neutral-100 transition-colors focus:outline-none"
                aria-label="Language and currency"
              >
                <Globe className="h-5 w-5" />
              </button>
              <LanguageCurrencyModal isOpen={langOpen} onClose={() => setLangOpen(false)} />

              {/* User menu */}
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button className="flex items-center gap-2.5 rounded-full border border-neutral-200 bg-white px-3 py-2 hover:shadow-md transition-shadow focus:outline-none">
                    <Menu className="h-4 w-4 text-neutral-600" />
                    {isLoggedIn && <Avatar src={user?.avatar ?? user?.avatarUrl} firstName={user?.firstName} lastName={user?.lastName} size="sm" />}
                    {isLoggedIn && <span className="hidden sm:block w-2 h-2 rounded-full bg-emerald-500 shrink-0" />}
                  </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content align="end" sideOffset={8} className="z-50 min-w-[240px] rounded-2xl border border-neutral-200 bg-white py-2 shadow-xl animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-150">
                    {isLoggedIn ? (
                      <>
                        <div className="px-4 py-3 border-b border-neutral-100 mb-1">
                          <div className="flex items-center gap-3">
                            <Avatar src={user?.avatar ?? user?.avatarUrl} firstName={user?.firstName} lastName={user?.lastName} size="md" />
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-neutral-900 truncate">{user?.firstName} {user?.lastName}</p>
                              <p className="text-xs text-neutral-500 truncate">{user?.email}</p>
                            </div>
                          </div>
                        </div>
                        <MenuLink href={`/${locale}/trips`} icon={<MapPin className="h-4 w-4" />}>{t('trips')}</MenuLink>
                        <MenuLink href={`/${locale}/wishlists`} icon={<Heart className="h-4 w-4" />}>{t('wishlists')}</MenuLink>
                        <MenuLink href={`/${locale}/consultations/become-a-consultant`} icon={<GraduationCap className="h-4 w-4" />}>{t('consultations')}</MenuLink>
                        <MenuLink href={`/${locale}/notifications`} icon={<Bell className="h-4 w-4" />}>
                          <span className="flex items-center gap-2">
                            {t('notifications')}
                            {unreadCount > 0 && (
                              <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white leading-none">{unreadCount > 9 ? '9+' : unreadCount}</span>
                            )}
                          </span>
                        </MenuLink>
                        <MenuLink href={`/${locale}/travel`} icon={<Plane className="h-4 w-4" />}>
                          <span className="flex items-center gap-2">
                            {t('travel')}
                            <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold text-rose-600 leading-none">{t('soon')}</span>
                          </span>
                        </MenuLink>
                        <MenuLink href={`/${locale}/inbox`} icon={<MessageSquare className="h-4 w-4" />}>{t('inbox')}</MenuLink>
                        <DropdownMenu.Separator className="my-1.5 h-px bg-neutral-100" />
                        {!isHost && (
                          <MenuLink href={beHostHref} icon={<Home className="h-4 w-4" />}>{t('becomeHost')}</MenuLink>
                        )}

                        <MenuLink href={`/${locale}/account`} icon={<Settings className="h-4 w-4" />}>{t('account')}</MenuLink>
                        <DropdownMenu.Separator className="my-1.5 h-px bg-neutral-100" />
                        <DropdownMenu.Item
                          onClick={handleLogout}
                          className="flex items-center gap-2 mx-1 px-3 py-2.5 text-sm text-red-600 cursor-pointer hover:bg-red-50 outline-none rounded-xl transition-colors"
                        >
                          <LogOut className="h-4 w-4" />
                          {t('logout')}
                        </DropdownMenu.Item>
                      </>
                    ) : (
                      <>
                        <MenuLink href={`/${locale}/register`} icon={<User className="h-4 w-4" />}>
                          <span className="font-semibold">{t('signup')}</span>
                        </MenuLink>
                        <MenuLink href={`/${locale}/login`} icon={<User className="h-4 w-4" />}>{t('login')}</MenuLink>
                        <DropdownMenu.Separator className="my-1 h-px bg-neutral-100" />
                        <MenuLink href={beHostHref} icon={<Home className="h-4 w-4" />}>{t('becomeHost')}</MenuLink>
                      </>
                    )}
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            </div>
          </div>
        </div>

        {/* Hosting sub-nav */}
        {isHostingPage && (
          <div className="border-t border-neutral-100 bg-neutral-50/80">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <nav className="flex items-center gap-1 py-1.5 overflow-x-auto scrollbar-hide">
                {[
                  { label: tHosting('dashboard'), href: `/${locale}/hosting` },
                  ...(isHost ? [
                    { label: tHosting('listings'), href: `/${locale}/hosting/listings` },
                    { label: tHosting('archive'), href: `/${locale}/hosting/listings/archive` },
                    { label: tHosting('reservations'), href: `/${locale}/hosting/reservations` },
                    { label: tHosting('inbox'), href: `/${locale}/hosting/inbox` },
                  ] : []),
                ].map(({ label, href }) => (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                      pathname === href
                        ? 'text-neutral-900 bg-white shadow-sm border border-neutral-200'
                        : 'text-neutral-500 hover:text-neutral-900 hover:bg-white/60'
                    )}
                  >
                    {label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        )}
      </header>

      {/* Backdrop when expanded search on homepage */}
      <AnimatePresence>
        {searchExpanded && isHomePage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-30 bg-black/10 backdrop-blur-sm"
            onClick={() => setSearchExpanded(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function MenuLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <DropdownMenu.Item asChild>
      <Link href={href} className="flex items-center gap-2 px-4 py-2.5 text-sm text-neutral-700 cursor-pointer hover:bg-neutral-50 outline-none transition-colors">
        <span className="text-neutral-400">{icon}</span>
        {children}
      </Link>
    </DropdownMenu.Item>
  );
}
