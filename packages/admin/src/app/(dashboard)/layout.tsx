'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard,
  Users,
  Building2,
  CalendarCheck,
  Star,
  CreditCard,
  Scale,
  Ticket,
  ClipboardList,
  Settings,
  LogOut,
  Menu,
  X,
  Banknote,
  BarChart3,
  Bell,
  FileDown,
  ShieldCheck,
  ShieldAlert,
  Activity,
  Mail,
  GraduationCap,
  Wifi,
  FolderTree,
  MessageSquare,
  Sparkles,
  Sun,
  Moon,
  FileText,
  ArrowLeftRight,
  Receipt,
  PieChart,
  BellRing,
  UserCheck,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { adminApi } from '@/lib/api';
import { QueryProvider } from '@/providers/QueryProvider';
import { cn } from '@/lib/utils';

type BadgeKey = 'pendingPayouts' | 'openDisputes' | 'pendingVerifications' | 'pendingInstapayRefunds' | 'pendingModeration';

const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
      { href: '/analytics', label: 'Analytics', icon: BarChart3 },
    ],
  },
  {
    label: 'Platform',
    items: [
      { href: '/users', label: 'Users', icon: Users },
      { href: '/user-merge', label: 'User Merge', icon: ArrowLeftRight },
      { href: '/properties', label: 'Properties', icon: Building2 },
      { href: '/bookings', label: 'Bookings', icon: CalendarCheck },
      // { href: '/experience-bookings', label: 'Experiences', icon: Ticket }, // Coming Soon
      { href: '/reviews', label: 'Reviews', icon: Star },
      { href: '/messages', label: 'Messages', icon: MessageSquare },
      { href: '/host-onboarding', label: 'Host Onboarding', icon: UserCheck },
    ],
  },
  {
    label: 'Marketplace',
    items: [
      { href: '/consultations', label: 'Consultations', icon: GraduationCap },
    ],
  },
  {
    label: 'Content',
    items: [
      { href: '/categories', label: 'Categories', icon: FolderTree },
      { href: '/amenities', label: 'Amenities', icon: Sparkles },
    ],
  },
  {
    label: 'Finance',
    items: [
      { href: '/payments/transactions', label: 'Transactions', icon: Receipt },
      { href: '/payouts', label: 'Payouts', icon: CreditCard, badge: 'pendingPayouts' as BadgeKey },
      { href: '/payments/instapay-refunds', label: 'InstaPay', icon: Banknote, badge: 'pendingInstapayRefunds' as BadgeKey },
      { href: '/reconciliation', label: 'Reconciliation', icon: PieChart },
      { href: '/reports', label: 'Reports', icon: FileDown },
    ],
  },
  {
    label: 'Moderation',
    items: [
      { href: '/disputes', label: 'Disputes', icon: Scale, badge: 'openDisputes' as BadgeKey },
      { href: '/host-verification', label: 'Host Verification', icon: ShieldCheck, badge: 'pendingVerifications' as BadgeKey },
      { href: '/content-moderation', label: 'Content Moderation', icon: ShieldAlert, badge: 'pendingModeration' as BadgeKey },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/notifications', label: 'Notifications', icon: Bell },
      { href: '/notification-templates', label: 'Notification Templates', icon: BellRing },
      { href: '/activity-log', label: 'Activity Log', icon: ClipboardList },
      { href: '/system-health', label: 'System Health', icon: Activity },      { href: '/ical-sync', label: 'iCal Feeds', icon: Wifi },      { href: '/user-communication', label: 'User Communication', icon: Mail },
      { href: '/email-templates', label: 'Email Templates', icon: FileText },
      { href: '/settings', label: 'Settings', icon: Settings },
    ],
  },
];

function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, _hasHydrated, hydrate, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // L-4: initialise from localStorage synchronously to avoid dark→light flash
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('admin_theme') !== 'light';
  });

  useEffect(() => { hydrate(); }, [hydrate]);

  // Apply the correct class on first mount
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    if (next) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('admin_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('admin_theme', 'light');
    }
  };

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!user?.isAdmin) router.replace('/login');
  }, [_hasHydrated, user, router]);

  // Lightweight badge counts — refresh every 2 minutes
  const { data: badges } = useQuery({
    queryKey: ['admin-badge-counts'],
    queryFn: () => adminApi.getBadgeCounts(),
    staleTime: 2 * 60 * 1000,
    enabled: !!user?.isAdmin,
  });

  const badgeCount: Record<BadgeKey, number> = {
    pendingPayouts: badges?.pendingPayouts ?? 0,
    openDisputes: badges?.openDisputes ?? 0,
    pendingVerifications: badges?.pendingVerifications ?? 0,
    pendingInstapayRefunds: badges?.pendingInstapayRefunds ?? 0,
    pendingModeration: badges?.pendingModeration ?? 0,
  };

  if (!_hasHydrated || !user?.isAdmin) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 dark:border-gray-500 border-t-transparent" />
      </div>
    );
  }

  const isActive = (item: { href: string; exact?: boolean }) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  async function handleLogout() {
    try { await adminApi.adminLogout(); } catch { /* best-effort */ }
    logout();
    router.push('/login');
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/30 dark:bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-transform duration-300',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:relative lg:translate-x-0',
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 px-5 border-b border-gray-200 dark:border-gray-800">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl overflow-hidden shadow-lg shadow-indigo-900/40">
            <img src="/logo.png" alt="Oikivo" className="h-full w-full object-cover" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">Oikivo</p>
            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">Admin Panel</p>
          </div>
          <button className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-600">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active = isActive(item);
                  const badgeKey = (item as { href: string; label: string; icon: React.ElementType; exact?: boolean; badge?: BadgeKey }).badge;
                  const count = badgeKey ? badgeCount[badgeKey] : 0;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900',
                        active
                          ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-900/50'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white',
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1 truncate">{item.label}</span>
                      {count > 0 && (
                        <span
                          className={cn(
                            'ml-auto min-w-[20px] rounded-full px-1.5 py-0.5 text-center text-[10px] font-bold leading-none',
                            active
                              ? 'bg-white/20 text-white'
                              : 'bg-red-500/90 text-white',
                          )}
                        >
                          {count > 99 ? '99+' : count}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div className="border-t border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center text-xs font-bold uppercase text-white">
              {user.firstName?.[0]}{user.lastName?.[0]}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                {user.firstName} {user.lastName}
              </p>
              <p className="truncate text-xs text-gray-500">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex h-16 shrink-0 items-center gap-4 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur px-4 lg:px-6">
          <button
            className="lg:hidden text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <div className={`h-2 w-2 rounded-full ${badges !== undefined ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} title={badges !== undefined ? 'Backend online' : 'Backend unreachable'} />
            <span className="text-xs text-gray-500 hidden sm:inline">{badges !== undefined ? 'API connected' : 'API offline'}</span>
            <div className="h-4 w-px bg-gray-200 dark:bg-gray-700" />
            <button
              onClick={toggleTheme}
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              className="rounded-lg p-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <div className="h-4 w-px bg-gray-200 dark:bg-gray-700" />
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center text-xs font-bold text-white uppercase">
                {user.firstName?.[0]}{user.lastName?.[0]}
              </div>
              <span className="text-sm text-gray-700 dark:text-gray-300 font-medium hidden sm:inline">{user.firstName} {user.lastName}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AdminShell>{children}</AdminShell>
    </QueryProvider>
  );
}
