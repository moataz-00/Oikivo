// Root layout — must contain <html> and <body> per Next.js App Router requirements.
// Locale-specific attributes (lang, dir, font classes) are applied in [locale]/layout.tsx.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
