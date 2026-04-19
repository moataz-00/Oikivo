import createMiddleware from 'next-intl/middleware';
import { defineRouting } from 'next-intl/routing';
import { NextRequest, NextResponse } from 'next/server';

export const routing = defineRouting({
  locales: ['en', 'ar'],
  defaultLocale: 'en',
});

const intlMiddleware = createMiddleware(routing);

// W9: Routes that require authentication (checked via access_token cookie/header)
const PROTECTED_PREFIXES = ['/hosting', '/account'];

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Strip locale prefix to check the route
  const strippedPath = pathname.replace(/^\/(en|ar)/, '') || '/';

  // Check if the route is protected
  const isProtected = PROTECTED_PREFIXES.some((prefix) => strippedPath.startsWith(prefix));

  if (isProtected) {
    // Check for access_token in cookies (set by client-side auth)
    const token = request.cookies.get('access_token')?.value;
    if (!token) {
      // Also check localStorage-sourced header (set by client)
      // If no token at all, redirect to login
      const locale = pathname.match(/^\/(en|ar)/)?.[1] ?? 'en';
      const loginUrl = new URL(`/${locale}/login`, request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next|.*\..*).*)'],
};
