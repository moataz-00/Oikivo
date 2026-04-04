'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Home, Eye, EyeOff, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { authApi } from '@/lib/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';

const schema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [done, setDone] = useState(false);
  const [tokenState, setTokenState] = useState<'checking' | 'valid' | 'expired'>('checking');

  useEffect(() => {
    if (!token) { setTokenState('expired'); return; }
    authApi.validateResetToken(token)
      .then(({ valid }) => setTokenState(valid ? 'valid' : 'expired'))
      .catch(() => setTokenState('expired'));
  }, [token]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: (data: FormData) => authApi.resetPassword(token, data.password),
    onSuccess: () => {
      setDone(true);
      setTimeout(() => router.push(`/${locale}/login`), 3000);
    },
    onError: () => {
      toast.error('This reset link is invalid or has expired. Please request a new one.');
    },
  });

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
        <div className="text-center">
          <p className="text-neutral-500 mb-4">Invalid reset link.</p>
          <Link href={`/${locale}/forgot-password`} className="text-neutral-700 underline font-medium">
            Request a new one
          </Link>
        </div>
      </div>
    );
  }

  if (tokenState === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
        <div className="h-8 w-8 rounded-full border-2 border-neutral-300 border-t-neutral-900 animate-spin" />
      </div>
    );
  }

  if (tokenState === 'expired') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <Link href={`/${locale}`} className="flex items-center gap-2">
              <Home className="h-8 w-8 text-neutral-900" strokeWidth={2.5} />
              <span className="text-2xl font-bold text-neutral-900">sakan</span>
            </Link>
          </div>
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-amber-50 flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-amber-500" />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-neutral-900 mb-2">Link expired</h2>
            <p className="text-sm text-neutral-500 mb-6">
              This password reset link is invalid or has expired. Reset links are valid for 1 hour.
            </p>
            <Link
              href={`/${locale}/forgot-password`}
              className="inline-flex items-center justify-center rounded-xl bg-neutral-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 transition-colors"
            >
              Request a new link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Link href={`/${locale}`} className="flex items-center gap-2">
            <Home className="h-8 w-8 text-neutral-900" strokeWidth={2.5} />
            <span className="text-2xl font-bold text-neutral-900">sakan</span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-8">
          {done ? (
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
              <h2 className="text-xl font-semibold text-neutral-900">Password updated!</h2>
              <p className="mt-2 text-sm text-neutral-500">Redirecting you to login...</p>
            </motion.div>
          ) : (
            <>
              <div className="mb-6 border-b border-neutral-200 pb-5">
                <h1 className="text-xl font-semibold text-neutral-900">Set new password</h1>
                <p className="text-sm text-neutral-500 mt-1">Must be at least 8 characters.</p>
              </div>

              <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-5" noValidate>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  label="New password"
                  placeholder="••••••••"
                  error={errors.password?.message}
                  rightIcon={
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-neutral-400 hover:text-neutral-700">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                  {...register('password')}
                />
                <Input
                  type={showConfirm ? 'text' : 'password'}
                  label="Confirm new password"
                  placeholder="••••••••"
                  error={errors.confirmPassword?.message}
                  rightIcon={
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="text-neutral-400 hover:text-neutral-700">
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                  {...register('confirmPassword')}
                />

                <Button type="submit" fullWidth size="lg" isLoading={mutation.isPending}>
                  Reset password
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
