'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  Building2,
  CalendarCheck,
  Star,
  MessageSquare,
  Wallet,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/properties', label: 'Properties', icon: Building2 },
  { href: '/admin/bookings', label: 'Bookings', icon: CalendarCheck },
  { href: '/admin/reviews', label: 'Reviews', icon: Star },
  { href: '/admin/consultations/reviews', label: 'Consult. Reviews', icon: MessageSquare },
  { href: '/admin/consultations/payouts', label: 'Consult. Payouts', icon: Wallet },
];

export default function AdminLayout({ children, params }: { children: React.ReactNode; params: { locale: string } }) {
  const { user, _hasHydrated, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const locale = params.locale;

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!user || !user.isAdmin) {
      router.replace(`/${locale}/`);
    }
  }, [_hasHydrated, user, router, locale]);

  if (!_hasHydrated || !user?.isAdmin) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-500 border-t-transparent" />
      </div>
    );
  }

  const isActive = (item: (typeof NAV_ITEMS)[0]) => {
    const localePath = `/${locale}${item.href}`;
    if (item.exact) return pathname === localePath;
    return pathname.startsWith(localePath);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-950 text-white">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-gray-900 border-r border-gray-800 transition-transform duration-300',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:relative lg:translate-x-0',
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 px-6 border-b border-gray-800">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold">S</div>
          <div>
            <p className="text-sm font-semibold text-white">Sakan Admin</p>
            <p className="text-xs text-gray-400">Control Panel</p>
          </div>
          <button className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={`/${locale}${item.href}`}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive(item)
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white',
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User footer */}
        <div className="border-t border-gray-800 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold uppercase">
              {user.firstName?.[0]}{user.lastName?.[0]}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">{user.firstName} {user.lastName}</p>
              <p className="truncate text-xs text-gray-400">{user.email}</p>
            </div>
          </div>
          <button
            onClick={() => { logout(); router.push(`/${locale}/`); }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-16 items-center gap-4 border-b border-gray-800 bg-gray-900 px-4 lg:px-6">
          <button
            className="lg:hidden text-gray-400 hover:text-white"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1" />
          <div className="text-sm text-gray-400">
            Logged in as <span className="text-gray-300 font-medium">{user.email}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
