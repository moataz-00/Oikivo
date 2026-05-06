'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { authApi } from '@/lib/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function ForgotPasswordPage() {
  const locale = useLocale();
  const t = useTranslations('auth');
  const [submitted, setSubmitted] = useState(false);

  const schema = z.object({
    email: z.string().email(t('invalidEmail')),
  });

  type FormData = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: (data: FormData) => authApi.forgotPassword(data.email),
    onSuccess: () => setSubmitted(true),
  });

  const onSubmit = (data: FormData) => mutation.mutate(data);

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href={`/${locale}`} className="flex items-center gap-2">
            <Image src="/logo.png" alt="Oikivo" width={120} height={40} className="h-10 w-auto" />
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-8">
          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-4"
            >
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 rounded-full bg-emerald-50 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                </div>
              </div>
              <h2 className="text-xl font-semibold text-neutral-900">{t('checkInboxTitle')}</h2>
              <p className="mt-2 text-sm text-neutral-500">
                {t('checkInboxDesc')}
              </p>
              <Link
                href={`/${locale}/login`}
                className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-neutral-700 hover:text-neutral-900"
              >
                <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
                {t('backToLoginText')}
              </Link>
            </motion.div>
          ) : (
            <>
              <div className="mb-6 border-b border-neutral-200 pb-5">
                <h1 className="text-xl font-semibold text-neutral-900">{t('resetYourPassword')}</h1>
                <p className="text-sm text-neutral-500 mt-1">
                  {t('resetPasswordSubtitle')}
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
                <Input
                  type="email"
                  label={t('email')}
                  placeholder={t('emailPlaceholder')}
                  autoComplete="email"
                  error={errors.email?.message}
                  {...register('email')}
                />

                <Button
                  type="submit"
                  fullWidth
                  size="lg"
                  isLoading={mutation.isPending}
                >
                  {t('sendResetLink')}
                </Button>
              </form>

              <div className="mt-5 text-center">
                <Link
                  href={`/${locale}/login`}
                  className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900"
                >
                  <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
                  {t('backToLoginText')}
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

