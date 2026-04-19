'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Home, Star, Shield, Zap } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const t = useTranslations('auth');
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useAuthStore((s) => s.login);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (searchParams.get('error') === 'google_failed') {
      toast.error('Google sign-in failed. Please try again or use email & password.');
    }
  }, [searchParams]);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      login(data.user, data.accessToken, data.refreshToken);
      toast.success(t('welcomeBack'));
      router.push(`/${locale}`);
    },
    onError: () => toast.error(t('loginError')),
  });

  const onSubmit = (data: FormData) => loginMutation.mutate(data);

  return (
    <div className="min-h-screen flex">
      {/* ── Left brand panel ─────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-2/5 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #7c3aed 100%)' }}>
        {/* Background blobs */}
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-violet-900/30 blur-3xl" />

        {/* Logo */}
        <Link href={`/${locale}`} className="relative flex items-center gap-2.5 z-10">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
            <Home className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">Oikivo</span>
        </Link>

        {/* Headline */}
        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-4xl font-bold text-white leading-tight">
              Your next stay<br />begins here.
            </h2>
            <p className="mt-4 text-indigo-200 text-lg leading-relaxed">
              Thousands of verified homes, experiences, and stays across Egypt and beyond.
            </p>
          </div>

          {/* Feature cards */}
          <div className="space-y-3">
            {[
              { icon: Shield, text: 'Secure payments & verified hosts' },
              { icon: Star, text: 'Curated stays with real guest reviews' },
              { icon: Zap, text: 'Instant book — no waiting required' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 rounded-xl bg-white/10 backdrop-blur-sm px-4 py-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/20">
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <p className="text-sm font-medium text-white/90">{text}</p>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Listings', value: '12K+' },
              { label: 'Happy guests', value: '48K+' },
              { label: 'Cities', value: '27' },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl bg-white/10 backdrop-blur-sm p-3 text-center">
                <p className="text-2xl font-bold text-white">{value}</p>
                <p className="text-xs text-indigo-200 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="relative z-10 text-sm text-indigo-300">
          © {new Date().getFullYear()} Oikivo — All rights reserved
        </p>
      </div>

      {/* ── Right form panel ─────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 bg-white">
        {/* Mobile logo */}
        <Link href={`/${locale}`} className="flex items-center gap-2 mb-8 lg:hidden">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
            <Home className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-xl font-bold" style={{ color: '#4f46e5' }}>Oikivo</span>
        </Link>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-neutral-900">{t('loginTitle')}</h1>
            <p className="mt-1.5 text-sm text-neutral-500">{t('loginSubtitle')}</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <Input
              type="email"
              label={t('email')}
              placeholder="you@example.com"
              autoComplete="email"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              type={showPassword ? 'text' : 'password'}
              label={t('password')}
              placeholder="••••••••"
              autoComplete="current-password"
              error={errors.password?.message}
              rightIcon={
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="text-neutral-400 hover:text-neutral-700 transition-colors">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              {...register('password')}
            />

            <div className="flex justify-end">
              <Link href={`/${locale}/forgot-password`}
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors">
                {t('forgotPassword')}
              </Link>
            </div>

            <Button type="submit" fullWidth size="lg" isLoading={loginMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500">
              {t('logIn')}
            </Button>
          </form>

          <div className="mt-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-neutral-200" />
            <span className="text-xs text-neutral-400">{t('orContinueWith')}</span>
            <div className="h-px flex-1 bg-neutral-200" />
          </div>

          <a href={`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'}/auth/google`}
            className="mt-4 flex w-full items-center justify-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50 hover:border-neutral-300 transition-colors">
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            {t('continueWithGoogle')}
          </a>

          <p className="mt-6 text-center text-sm text-neutral-500">
            {t('noAccount')}{' '}
            <Link href={`/${locale}/register`}
              className="font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
              {t('signUp')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
