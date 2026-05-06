'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Home, Star, Users, MapPin } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/lib/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

const schema = z
  .object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(PASSWORD_REGEX, 'Must include uppercase, lowercase, number & special character'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const t = useTranslations('auth');
  const locale = useLocale();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: () => {
      toast.success(t('registerSuccess'));
      router.push(`/${locale}/login?registered=1`);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message;
      const display = Array.isArray(msg) ? msg[0] : (msg ?? t('registerError'));
      toast.error(display);
    },
  });

  const onSubmit = (data: FormData) => {
    const { confirmPassword, ...payload } = data;
    registerMutation.mutate(payload);
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left brand panel ─────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-2/5 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #7c3aed 100%)' }}>
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-violet-900/30 blur-3xl" />

        {/* Logo */}
        <Link href={`/${locale}`} className="relative flex items-center gap-2.5 z-10">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
            <Home className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">Oikivo</span>
        </Link>

        {/* Content */}
        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-4xl font-bold text-white leading-tight">
              {t('registerPanelHeadline')}
            </h2>
            <p className="mt-4 text-indigo-200 text-lg leading-relaxed">
              {t('registerPanelSubtitle')}
            </p>
          </div>

          <div className="space-y-3">
            {[
              { icon: Home, text: t('registerFeature1') },
              { icon: Users, text: t('registerFeature2') },
              { icon: Star, text: t('registerFeature3') },
              { icon: MapPin, text: t('registerFeature4') },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 rounded-xl bg-white/10 backdrop-blur-sm px-4 py-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/20">
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <p className="text-sm font-medium text-white/90">{text}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl bg-white/10 backdrop-blur-sm px-5 py-4 border border-white/20">
            <p className="text-white/90 text-sm italic leading-relaxed">
              &ldquo;{t('registerTestimonial')}&rdquo;
            </p>
            <p className="mt-2 text-indigo-300 text-xs font-medium">— {t('registerTestimonialAuthor')}</p>
          </div>
        </div>

        <p className="relative z-10 text-sm text-indigo-300">
          © {new Date().getFullYear()} {t('panelCopyright')}
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
            <h1 className="text-2xl font-bold text-neutral-900">{t('registerTitle')}</h1>
            <p className="mt-1.5 text-sm text-neutral-500">{t('registerSubtitle')}</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="grid grid-cols-2 gap-3">
              <Input label={t('firstName')} placeholder="John" autoComplete="given-name"
                error={errors.firstName?.message} {...register('firstName')} />
              <Input label={t('lastName')} placeholder="Doe" autoComplete="family-name"
                error={errors.lastName?.message} {...register('lastName')} />
            </div>

            <Input type="email" label={t('email')} placeholder="you@example.com" autoComplete="email"
              error={errors.email?.message} {...register('email')} />

            <Input
              type={showPassword ? 'text' : 'password'}
              label={t('password')} placeholder="••••••••" autoComplete="new-password"
              error={errors.password?.message}
              rightIcon={
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="text-neutral-400 hover:text-neutral-700 transition-colors">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              {...register('password')}
            />

            <Input
              type={showPassword ? 'text' : 'password'}
              label={t('confirmPassword')} placeholder="••••••••" autoComplete="new-password"
              error={errors.confirmPassword?.message} {...register('confirmPassword')} />

            <p className="text-xs text-neutral-500 leading-relaxed">
              {t('agreeIntro')}{' '}
              <Link href={`/${locale}/terms`} className="text-indigo-600 hover:text-indigo-800 underline">{t('termsOfService')}</Link>
              {locale === 'ar' ? '، و' : ', '}
              <Link href={`/${locale}/payment-terms`} className="text-indigo-600 hover:text-indigo-800 underline">{t('paymentsTerms')}</Link>
              {locale === 'ar' ? '، و' : ', and '}
              <Link href={`/${locale}/privacy`} className="text-indigo-600 hover:text-indigo-800 underline">{t('privacyPolicy')}</Link>.
            </p>

            <Button type="submit" fullWidth size="lg" isLoading={registerMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500">
              {t('agreeAndContinue')}
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
            {t('signUpWithGoogle')}
          </a>

          <p className="mt-6 text-center text-sm text-neutral-500">
            {t('haveAccount')}{' '}
            <Link href={`/${locale}/login`}
              className="font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
              {t('logIn')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

