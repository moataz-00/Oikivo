import { getLocale } from 'next-intl/server';

// Root layout — must contain <html> and <body> per Next.js App Router requirements.
// Sets lang and dir on <html> so browsers, screen readers, and native controls get correct RTL/LTR.
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
