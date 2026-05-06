'use client';

import { useForm, Controller } from 'react-hook-form';
import { useTranslations, useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import { Mail, Clock, Send } from 'lucide-react';
import { toast } from '@/components/ui/Toast';
import { Select } from '@/components/ui/Select';
import { cn } from '@/lib/utils';

// ── Google Form Configuration ────────────────────────────────────────────────
const GOOGLE_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLScscXPX-P-pEds42YofU9mtw22QZus9v_W4-F0vVorVwGLwPg/formResponse';
const FORM_ENTRIES = {
  name:    'entry.1789046655',
  email:   'entry.1889180519',
  subject: 'entry.998798940',
  message: 'entry.421630164',
};
// ─────────────────────────────────────────────────────────────────────────────

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export default function ContactPage() {
  const locale = useLocale();
  const t = useTranslations('contact');

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    mode: 'onTouched',
    defaultValues: { name: '', email: '', subject: '', message: '' },
  });

  const onSubmit = async (data: FormData) => {
    const body = new URLSearchParams({
      [FORM_ENTRIES.name]:    data.name,
      [FORM_ENTRIES.email]:   data.email,
      [FORM_ENTRIES.subject]: data.subject,
      [FORM_ENTRIES.message]: data.message,
    });
    try {
      await fetch(GOOGLE_FORM_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });
      toast.success(t('toastSuccess'));
      reset();
    } catch {
      toast.error(t('toastError'));
    }
  };

  const subjectOptions = [
    { value: 'general',     label: t('subjectOptionGeneral') },
    { value: 'booking',     label: t('subjectOptionBooking') },
    { value: 'payment',     label: t('subjectOptionPayment') },
    { value: 'hosting',     label: t('subjectOptionHosting') },
    { value: 'account',     label: t('subjectOptionAccount') },
    { value: 'report',      label: t('subjectOptionReport') },
    { value: 'other',       label: t('subjectOptionOther') },
  ];

  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const } },
  };

  const inputCls = (hasError: boolean) =>
    cn(
      'w-full rounded-xl border px-3.5 py-2.5 text-sm transition focus:outline-none focus:ring-2',
      hasError
        ? 'border-red-400 bg-red-50/30 focus:ring-red-200 focus:border-red-500'
        : 'border-neutral-300 focus:ring-indigo-200 focus:border-indigo-400'
    );

  return (
    <div className="min-h-screen bg-white" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      {/* Hero */}
      <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 px-4 py-16">
        <motion.div
          initial="hidden" animate="show" variants={fadeUp}
          className="mx-auto max-w-6xl text-center"
        >
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 mb-5">
            <Mail className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">{t('heroTitle')}</h1>
          <p className="text-indigo-100 text-lg max-w-xl mx-auto">{t('heroDesc')}</p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-xs text-indigo-200 font-medium">{t('onlineStatus')}</span>
          </div>
        </motion.div>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-14">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">

          {/* Left info panel — Email + Response time only */}
          <motion.div
            initial="hidden" animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.09 } } }}
            className="lg:col-span-2 space-y-5"
          >
            {[
              { icon: Mail,  title: t('emailTitle'),    value: 'oikivo.support@gmail.com', sub: t('emailSub') },
              { icon: Clock, title: t('responseTitle'), value: t('responseValue'),         sub: t('responseSub') },
            ].map(({ icon: Icon, title, value, sub }) => (
              <motion.div
                key={title}
                variants={fadeUp}
                className="flex items-start gap-4 rounded-2xl border border-neutral-200 bg-white p-5"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
                  <Icon className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <p className="font-semibold text-neutral-900">{title}</p>
                  <p className="text-sm text-neutral-700 mt-0.5">{value}</p>
                  <p className="text-xs text-neutral-400 mt-0.5">{sub}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Right form */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="lg:col-span-3"
          >
            <form
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              className="rounded-2xl border border-neutral-200 bg-white p-7 sm:p-9 space-y-5"
            >
              <h2 className="text-xl font-semibold text-neutral-900">{t('formTitle')}</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    {t('nameLabel')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder={t('namePlaceholder')}
                    className={inputCls(!!errors.name)}
                    {...register('name', { required: t('errorNameRequired') })}
                  />
                  {errors.name && (
                    <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    {t('emailLabel')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    placeholder={t('emailPlaceholder')}
                    className={inputCls(!!errors.email)}
                    {...register('email', {
                      required: t('errorEmailRequired'),
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: t('errorEmailInvalid'),
                      },
                    })}
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
                  )}
                </div>
              </div>

              {/* Subject — dropdown */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  {t('subjectLabel')} <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="subject"
                  control={control}
                  rules={{ required: t('errorSubjectRequired') }}
                  render={({ field }) => (
                    <Select
                      options={subjectOptions}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder={t('subjectPlaceholder')}
                      error={errors.subject?.message}
                    />
                  )}
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  {t('messageLabel')} <span className="text-red-500">*</span>
                </label>
                <textarea
                  placeholder={t('messagePlaceholder')}
                  rows={6}
                  className={cn(inputCls(!!errors.message), 'resize-none')}
                  {...register('message', {
                    required: t('errorMessageRequired'),
                    minLength: { value: 10, message: t('errorMessageTooShort') },
                  })}
                />
                {errors.message && (
                  <p className="mt-1 text-xs text-red-600">{errors.message.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors"
              >
                {isSubmitting ? (
                  <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : (
                  <Send className="h-4 w-4 rtl:rotate-180" />
                )}
                {isSubmitting ? t('sending') : t('sendButton')}
              </button>
            </form>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
