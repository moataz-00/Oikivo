import createMiddleware from 'next-intl/middleware';
import { defineRouting } from 'next-intl/routing';
import { NextRequest, NextResponse } from 'next/server';

export const routing = defineRouting({
  locales: ['en', 'ar'],
  defaultLocale: 'en',
  localeDetection: false,
});

const intlMiddleware = createMiddleware(routing);

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

// Routes that require authentication — redirect to login if no token
const PROTECTED_PREFIXES = [
  '/hosting',
  '/account',
  '/trips',
  '/inbox',
  '/wishlists',
  '/notifications',
];

// Routes that are not yet launched — return 404 for everyone
const NOT_FOUND_PREFIXES = [
  
  // '/experiences',
  '/consultations',
  '/cohost',
  '/account/invites',
];

// Admin paths belong on the admin panel (port 3001), not the web app
const ADMIN_PREFIXES = ['/admin'];

// Paths that are ALWAYS accessible even during maintenance
const MAINTENANCE_EXEMPT = ['/maintenance', '/login', '/register', '/_next', '/api', '/favicon'];

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const locale = pathname.match(/^\/(en|ar)/)?.[1] ?? 'en';

  // Strip locale prefix to get the clean route path
  const strippedPath = pathname.replace(/^\/(en|ar)/, '') || '/';

  // 1. Admin paths on the web → always 404
  if (ADMIN_PREFIXES.some((prefix) => strippedPath.startsWith(prefix))) {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/404`;
    return NextResponse.rewrite(url);
  }

  // 2. Coming-soon / unreleased routes → 404 for everyone
  if (NOT_FOUND_PREFIXES.some((prefix) => strippedPath.startsWith(prefix))) {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/404`;
    return NextResponse.rewrite(url);
  }

  // 3. Maintenance mode check — skip for exempt paths
  const isExempt = MAINTENANCE_EXEMPT.some((p) => strippedPath.startsWith(p));
  if (!isExempt) {
    try {
      const res = await fetch(`${BACKEND_URL}/public/maintenance-status`, {
        next: { revalidate: 30 }, // cache for 30 s to avoid hammering the DB
      });
      if (res.ok) {
        const data = (await res.json()) as { maintenance: boolean; message: string };
        if (data.maintenance) {
          const url = request.nextUrl.clone();
          url.pathname = `/${locale}/maintenance`;
          url.searchParams.set('message', data.message);
          return NextResponse.rewrite(url);
        }
      }
    } catch {
      // Backend unreachable — let the request through rather than hard-blocking
    }
  }

  // 4. Protected routes → redirect to login if not authenticated
  //    Exempt /hosting/activate — activation link must work without prior login
  const isHostActivatePath = strippedPath === '/hosting/activate' || strippedPath.startsWith('/hosting/activate?');
  if (!isHostActivatePath && PROTECTED_PREFIXES.some((prefix) => strippedPath.startsWith(prefix))) {
    const token = request.cookies.get('access_token')?.value;
    if (!token) {
      const loginUrl = new URL(`/${locale}/login`, request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
