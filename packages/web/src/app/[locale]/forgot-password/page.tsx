'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Home, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { authApi } from '@/lib/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const locale = useLocale();
  const [submitted, setSubmitted] = useState(false);

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
            <Home className="h-8 w-8 text-neutral-900" strokeWidth={2.5} />
            <span className="text-2xl font-bold text-neutral-900">sakan</span>
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
              <h2 className="text-xl font-semibold text-neutral-900">Check your inbox</h2>
              <p className="mt-2 text-sm text-neutral-500">
                If that email address is registered, we&apos;ve sent a password reset link. It expires in 1 hour.
              </p>
              <Link
                href={`/${locale}/login`}
                className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-neutral-700 hover:text-neutral-900"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to login
              </Link>
            </motion.div>
          ) : (
            <>
              <div className="mb-6 border-b border-neutral-200 pb-5">
                <h1 className="text-xl font-semibold text-neutral-900">Reset your password</h1>
                <p className="text-sm text-neutral-500 mt-1">
                  Enter your account email and we&apos;ll send a reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
                <Input
                  type="email"
                  label="Email address"
                  placeholder="you@example.com"
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
                  Send reset link
                </Button>
              </form>

              <div className="mt-5 text-center">
                <Link
                  href={`/${locale}/login`}
                  className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
