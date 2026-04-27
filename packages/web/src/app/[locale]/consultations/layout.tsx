import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Consultations — Oikivo',
  description: 'Book a consultation with expert consultants on Oikivo.',
};

export default function ConsultationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}