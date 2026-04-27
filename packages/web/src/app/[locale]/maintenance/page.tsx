import { Wrench } from 'lucide-react';

interface Props {
  searchParams: { message?: string };
}

export const metadata = {
  title: 'Under Maintenance — Oikivo',
  description: 'Oikivo is currently undergoing scheduled maintenance.',
};

export default function MaintenancePage({ searchParams }: Props) {
  const message =
    searchParams?.message ||
    'Platform is under maintenance. Please try again later.';

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4 text-center">
      {/* Animated pulse ring */}
      <div className="relative mb-8">
        <span className="absolute inset-0 animate-ping rounded-full bg-amber-400/30" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-amber-50 border-2 border-amber-200">
          <Wrench className="h-9 w-9 text-amber-500" />
        </div>
      </div>

      {/* Brand */}
      <p className="font-brand text-3xl text-indigo-600 tracking-wide mb-4">Oikivo</p>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">We&apos;ll be right back</h1>
      <p className="text-gray-500 text-sm max-w-sm leading-relaxed">{message}</p>

      <div className="mt-8 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-700 font-medium">
        <span className="inline-block h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
        Scheduled maintenance in progress
      </div>

      <p className="mt-6 text-xs text-gray-400">
        Questions? Contact us at{' '}
        <a href="mailto:support@oikivo.com" className="text-indigo-500 hover:text-indigo-600 transition-colors">
          support@oikivo.com
        </a>
      </p>
    </div>
  );
}

