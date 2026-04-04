'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { User, ArrowLeft, Save, CheckCircle, Plus, X } from 'lucide-react';
import { consultationsApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const SPECIALIZATIONS = [
  { value: 'listing_optimization', en: 'Listing Optimization', ar: 'تحسين الإعلان' },
  { value: 'pricing_strategy',     en: 'Pricing Strategy',     ar: 'استراتيجية التسعير' },
  { value: 'interior_design',      en: 'Interior Design',      ar: 'التصميم الداخلي' },
  { value: 'guest_experience',     en: 'Guest Experience',     ar: 'تجربة الضيوف' },
  { value: 'photography',          en: 'Photography',          ar: 'التصوير' },
  { value: 'superhost_coaching',   en: 'Superhost Coaching',   ar: 'تدريب المضيف المتميز' },
  { value: 'property_management',  en: 'Property Management',  ar: 'إدارة العقارات' },
  { value: 'legal_compliance',     en: 'Legal Compliance',     ar: 'الامتثال القانوني' },
  { value: 'marketing',            en: 'Marketing',            ar: 'التسويق' },
  { value: 'revenue_management',   en: 'Revenue Management',   ar: 'إدارة الإيرادات' },
];

const COMMON_LANGUAGES = ['Arabic', 'English', 'French', 'German', 'Spanish', 'Italian', 'Turkish', 'Russian'];

type ProfileForm = {
  displayName: string;
  bio: string;
  specializations: string[];
  yearsExperience: number;
  languages: string[];
  hourlyRate: number;
};

export default function MyProfilePage() {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const { isLoggedIn, isConsultant, hasHydrated } = useAuth();
  const qc = useQueryClient();

  const [form, setForm] = useState<ProfileForm>({
    displayName: '',
    bio: '',
    specializations: [],
    yearsExperience: 1,
    languages: [],
    hourlyRate: 0,
  });
  const [customLang, setCustomLang] = useState('');
  const [saved, setSaved] = useState(false);

  const profileQuery = useQuery({
    queryKey: ['my-consultant-profile'],
    queryFn: () => consultationsApi.getMyProfile(),
    enabled: hasHydrated && isLoggedIn && isConsultant,
  });

  useEffect(() => {
    const c = profileQuery.data;
    if (!c) return;
    setForm({
      displayName: c.displayName ?? '',
      bio: c.bio ?? '',
      specializations: c.specializations ?? [],
      yearsExperience: c.yearsExperience ?? 1,
      languages: c.languages ?? [],
      hourlyRate: Number(c.hourlyRate ?? 0),
    });
  }, [profileQuery.data]);

  const updateMutation = useMutation({
    mutationFn: (payload: ProfileForm) => consultationsApi.updateMyProfile(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-consultant-profile'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const toggleSpecialization = (value: string) => {
    setForm((prev) => ({
      ...prev,
      specializations: prev.specializations.includes(value)
        ? prev.specializations.filter((s) => s !== value)
        : [...prev.specializations, value],
    }));
  };

  const addLanguage = (lang: string) => {
    const trimmed = lang.trim();
    if (!trimmed || form.languages.includes(trimmed)) return;
    setForm((prev) => ({ ...prev, languages: [...prev.languages, trimmed] }));
  };

  const removeLanguage = (lang: string) => {
    setForm((prev) => ({ ...prev, languages: prev.languages.filter((l) => l !== lang) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(form);
  };

  if (hasHydrated && (!isLoggedIn || !isConsultant)) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-sm rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-lg">
          <h2 className="mb-4 text-xl font-bold text-gray-900">
            {isAr ? 'غير مصرح' : 'Unauthorized'}
          </h2>
          <Link
            href={`/${locale}/consultations/dashboard`}
            className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-rose-600 transition"
          >
            {isAr ? 'العودة للوحة التحكم' : 'Back to Dashboard'}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('min-h-screen bg-gray-50', isAr && 'direction-rtl')}>
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
          <div className="flex items-center gap-4">
            <Link
              href={`/${locale}/consultations/dashboard`}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              {isAr ? 'العودة' : 'Back'}
            </Link>
            <div className="h-5 w-px bg-gray-200" />
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-rose-500" />
              <h1 className="text-xl font-bold text-gray-900">
                {isAr ? 'تعديل الملف الشخصي' : 'Edit Profile'}
              </h1>
            </div>
          </div>
          <p className="mt-1 text-sm text-gray-500 ml-16">
            {isAr
              ? 'حدّث بياناتك الشخصية وتخصصاتك لتظهر بشكل أفضل في نتائج البحث'
              : 'Update your details and specializations to appear better in search results'}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {profileQuery.isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-gray-100" />
            ))}
          </div>
        ) : (
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Display Name */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold text-gray-700">
                {isAr ? 'المعلومات الأساسية' : 'Basic Information'}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-gray-500">
                    {isAr ? 'الاسم المعروض *' : 'Display Name *'}
                  </label>
                  <input
                    required
                    maxLength={120}
                    value={form.displayName}
                    onChange={(e) => setForm((p) => ({ ...p, displayName: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-700 focus:border-rose-300 focus:outline-none focus:ring-1 focus:ring-rose-200 transition"
                    placeholder={isAr ? 'الاسم الذي يراه العملاء' : 'Name clients will see'}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">
                    {isAr ? 'سنوات الخبرة' : 'Years of Experience'}
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={form.yearsExperience}
                    onChange={(e) => setForm((p) => ({ ...p, yearsExperience: Number(e.target.value) }))}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-700 focus:border-rose-300 focus:outline-none focus:ring-1 focus:ring-rose-200 transition"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">
                    {isAr ? 'السعر بالساعة (جنيه)' : 'Hourly Rate (EGP)'}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.hourlyRate}
                    onChange={(e) => setForm((p) => ({ ...p, hourlyRate: Number(e.target.value) }))}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-700 focus:border-rose-300 focus:outline-none focus:ring-1 focus:ring-rose-200 transition"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-gray-500">
                    {isAr ? 'نبذة تعريفية' : 'Bio'}
                  </label>
                  <textarea
                    rows={4}
                    maxLength={2000}
                    value={form.bio}
                    onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                    className="w-full resize-none rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-700 focus:border-rose-300 focus:outline-none focus:ring-1 focus:ring-rose-200 transition"
                    placeholder={
                      isAr
                        ? 'اكتب نبذة مختصرة عن خبرتك وما تقدمه...'
                        : 'Write a short bio about your experience and what you offer…'
                    }
                  />
                  <p className="mt-1 text-right text-xs text-gray-400">{form.bio.length}/2000</p>
                </div>
              </div>
            </div>

            {/* Specializations */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold text-gray-700">
                {isAr ? 'التخصصات' : 'Specializations'}
              </h2>
              <div className="flex flex-wrap gap-2">
                {SPECIALIZATIONS.map((s) => {
                  const active = form.specializations.includes(s.value);
                  return (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => toggleSpecialization(s.value)}
                      className={cn(
                        'rounded-full px-4 py-1.5 text-xs font-medium transition',
                        active
                          ? 'bg-rose-500 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                      )}
                    >
                      {isAr ? s.ar : s.en}
                    </button>
                  );
                })}
              </div>
              {form.specializations.length === 0 && (
                <p className="mt-2 text-xs text-amber-500">
                  {isAr ? 'اختر تخصصاً واحداً على الأقل' : 'Please select at least one specialization'}
                </p>
              )}
            </div>

            {/* Languages */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold text-gray-700">
                {isAr ? 'اللغات' : 'Languages'}
              </h2>

              {/* Quick add common languages */}
              <div className="mb-3 flex flex-wrap gap-2">
                {COMMON_LANGUAGES.map((lang) => {
                  const active = form.languages.includes(lang);
                  return (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => (active ? removeLanguage(lang) : addLanguage(lang))}
                      className={cn(
                        'rounded-full px-3.5 py-1 text-xs font-medium transition',
                        active
                          ? 'bg-rose-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                      )}
                    >
                      {lang}
                    </button>
                  );
                })}
              </div>

              {/* Custom language input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customLang}
                  onChange={(e) => setCustomLang(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addLanguage(customLang);
                      setCustomLang('');
                    }
                  }}
                  placeholder={isAr ? 'أضف لغة أخرى...' : 'Add another language…'}
                  className="flex-1 rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-700 focus:border-rose-300 focus:outline-none focus:ring-1 focus:ring-rose-200 transition"
                />
                <button
                  type="button"
                  onClick={() => { addLanguage(customLang); setCustomLang(''); }}
                  className="flex items-center gap-1 rounded-xl bg-gray-100 px-3 py-2 text-sm text-gray-600 hover:bg-gray-200 transition"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {/* Selected languages */}
              {form.languages.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {form.languages.map((lang) => (
                    <span
                      key={lang}
                      className="flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700"
                    >
                      {lang}
                      <button
                        type="button"
                        onClick={() => removeLanguage(lang)}
                        className="text-rose-400 hover:text-rose-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Save */}
            <div className="flex items-center justify-end gap-3">
              {saved && (
                <span className="flex items-center gap-1.5 text-sm font-medium text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  {isAr ? 'تم الحفظ!' : 'Saved!'}
                </span>
              )}
              {updateMutation.isError && (
                <span className="text-sm text-red-500">
                  {isAr ? 'حدث خطأ، حاول مجدداً' : 'Error saving — please try again'}
                </span>
              )}
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="flex items-center gap-2 rounded-xl bg-rose-500 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-rose-600 disabled:opacity-60 transition"
              >
                <Save className="h-4 w-4" />
                {updateMutation.isPending
                  ? (isAr ? 'جاري الحفظ...' : 'Saving…')
                  : (isAr ? 'حفظ التغييرات' : 'Save Changes')}
              </button>
            </div>
          </motion.form>
        )}
      </div>
    </div>
  );
}
