import createMiddleware from 'next-intl/middleware';
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'ar'],
  defaultLocale: 'en',
});

export default createMiddleware(routing);

export const config = {
  matcher: ['/((?!api|_next|.*\..*).*)'],
};
