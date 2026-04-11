'use client';

import { useState, useRef } from 'react';
import { useLocale } from 'next-intl';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap, Upload, CheckCircle, Briefcase, Globe, DollarSign,
  ChevronRight, ChevronLeft, User, FileText, Camera, Shield,
  X, AlertCircle, Loader2, Calendar,
} from 'lucide-react';
import { consultationsApi } from '@/lib/api';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

const SPECIALIZATION_OPTIONS = [
  { value: 'listing_optimization', en: 'Listing Optimization', ar: 'تحسين الإعلانات' },
  { value: 'pricing_strategy', en: 'Pricing Strategy', ar: 'استراتيجية التسعير' },
  { value: 'interior_design', en: 'Interior Design', ar: 'التصميم الداخلي' },
  { value: 'guest_experience', en: 'Guest Experience', ar: 'تجربة الضيوف' },
  { value: 'photography', en: 'Photography', ar: 'التصوير' },
  { value: 'superhost_coaching', en: 'Superhost Coaching', ar: 'تدريب المضيف المتميز' },
  { value: 'property_management', en: 'Property Management', ar: 'إدارة العقارات' },
  { value: 'legal_compliance', en: 'Legal Compliance', ar: 'الامتثال القانوني' },
  { value: 'marketing', en: 'Marketing', ar: 'التسويق' },
  { value: 'revenue_management', en: 'Revenue Management', ar: 'إدارة الإيرادات' },
];

const LANGUAGE_OPTIONS = [
  { code: 'ar', label: 'العربية', flag: '🇪🇬' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
];

const DOCUMENT_TYPES = [
  { type: 'national_id', en: 'National ID / Passport', ar: 'بطاقة الهوية / جواز السفر', required: true, desc_en: 'For identity verification', desc_ar: 'للتحقق من الهوية' },
  { type: 'profile_photo', en: 'Professional Photo', ar: 'صورة شخصية احترافية', required: true, desc_en: 'Clear face photo for your profile', desc_ar: 'صورة وجه واضحة لملفك' },
  { type: 'hospitality_certificate', en: 'Hospitality Certificate', ar: 'شهادة ضيافة', required: false, desc_en: 'Any hospitality/tourism certification', desc_ar: 'أي شهادة ضيافة أو سياحة' },
  { type: 'superhost_proof', en: 'Superhost / Top Host Proof', ar: 'إثبات المضيف المتميز', required: false, desc_en: 'Screenshot from Airbnb, Booking.com, etc.', desc_ar: 'لقطة شاشة من Airbnb أو Booking.com وغيرها' },
  { type: 'business_license', en: 'Business License', ar: 'رخصة تجارية', required: false, desc_en: 'If you have a registered business', desc_ar: 'إذا كان لديك عمل مسجل' },
  { type: 'portfolio', en: 'Portfolio / Work Samples', ar: 'نماذج أعمال', required: false, desc_en: 'Photos of properties you managed, before/after, etc.', desc_ar: 'صور عقارات أدرتها، قبل/بعد، وغيرها' },
];

const DAYS_CONFIG = [
  { value: 0, en: 'Sunday',    ar: 'الأحد' },
  { value: 1, en: 'Monday',    ar: 'الاثنين' },
  { value: 2, en: 'Tuesday',   ar: 'الثلاثاء' },
  { value: 3, en: 'Wednesday', ar: 'الأربعاء' },
  { value: 4, en: 'Thursday',  ar: 'الخميس' },
  { value: 5, en: 'Friday',    ar: 'الجمعة' },
  { value: 6, en: 'Saturday',  ar: 'السبت' },
];

const YEARS_EXPERIENCE_OPTIONS = [
  { value: 1, en: '1 year', ar: 'سنة واحدة' },
  { value: 2, en: '2 years', ar: 'سنتان' },
  { value: 3, en: '3 years', ar: '3 سنوات' },
  { value: 4, en: '4 years', ar: '4 سنوات' },
  { value: 5, en: '5 years', ar: '5 سنوات' },
  { value: 7, en: '6-7 years', ar: '6-7 سنوات' },
  { value: 10, en: '8-10 years', ar: '8-10 سنوات' },
  { value: 15, en: '10-15 years', ar: '10-15 سنة' },
  { value: 20, en: '15+ years', ar: 'أكثر من 15' },
];

const PROPERTIES_OPTIONS = [
  { value: '1', en: '1', ar: '1' },
  { value: '2-5', en: '2-5', ar: '2-5' },
  { value: '6-10', en: '6-10', ar: '6-10' },
  { value: '11-20', en: '11-20', ar: '11-20' },
  { value: '20+', en: '20+', ar: 'أكثر من 20' },
];

const PLATFORM_OPTIONS = [
  { value: 'Airbnb', en: 'Airbnb', ar: 'Airbnb', icon: '🏠' },
  { value: 'Booking.com', en: 'Booking.com', ar: 'Booking.com', icon: '🏨' },
  { value: 'VRBO', en: 'VRBO', ar: 'VRBO', icon: '🏡' },
  { value: 'Agoda', en: 'Agoda', ar: 'Agoda', icon: '🌴' },
  { value: 'Expedia', en: 'Expedia', ar: 'Expedia', icon: '✈️' },
  { value: 'Homes & Villas', en: 'Homes & Villas', ar: 'بيوت وفلل', icon: '🏘️' },
  { value: 'Other', en: 'Other', ar: 'أخرى', icon: '➕' },
];

const HOSTING_SINCE_OPTIONS = Array.from({ length: 2026 - 2010 + 1 }, (_, i) => (2026 - i).toString());

type DayConfig = { enabled: boolean; startTime: string; endTime: string };

const STEPS = [
  { icon: User,        en: 'Personal Info', ar: 'معلومات شخصية' },
  { icon: Briefcase,   en: 'Experience',    ar: 'الخبرة' },
  { icon: DollarSign,  en: 'Pricing',       ar: 'التسعير' },
  { icon: FileText,    en: 'Documents',     ar: 'المستندات' },
  { icon: Calendar,    en: 'Availability',  ar: 'أوقات التوفر' },
  { icon: CheckCircle, en: 'Review',        ar: 'المراجعة' },
];

interface DocFile {
  file: File;
  type: string;
  preview?: string;
}

export default function ApplyAsConsultantPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const router = useRouter();
  const { user, isLoggedIn, hasHydrated } = useAuth();

  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeDocType, setActiveDocType] = useState('');

  const [form, setForm] = useState({
    displayName: '',
    bio: '',
    specializations: [] as string[],
    yearsExperience: 0,
    languages: ['ar'] as string[],
    hourlyRate: 0,
    currency: 'EGP',
    propertiesManaged: '',
    hostingPlatforms: [] as string[],
    hostingSince: '',
    whyConsultant: '',
  });

  const [documents, setDocuments] = useState<DocFile[]>([]);

  const [availability, setAvailability] = useState<Record<number, DayConfig>>(
    Object.fromEntries(DAYS_CONFIG.map((d) => [d.value, { enabled: false, startTime: '09:00', endTime: '17:00' }]))
  );

  const applyMutation = useMutation({
    mutationFn: async () => {
      // Step 1: Submit application
      const res = await apiClient.post('/consultations/apply', {
        displayName: form.displayName,
        bio: form.bio,
        specializations: form.specializations,
        yearsExperience: form.yearsExperience,
        languages: form.languages,
        hourlyRate: form.hourlyRate,
        currency: form.currency,
      });

      // Step 2: Upload documents if any
      if (documents.length > 0) {
        await consultationsApi.uploadDocuments(
          documents.map((d) => d.file),
          documents.map((d) => d.type),
        );
      }

      // Step 3: Set availability (optional – can be updated later from dashboard)
      try {
        const slots = DAYS_CONFIG
          .filter((d) => availability[d.value].enabled)
          .map((d) => ({
            dayOfWeek: d.value,
            startTime: availability[d.value].startTime,
            endTime: availability[d.value].endTime,
          }));
        if (slots.length > 0) {
          await consultationsApi.setAvailability(slots);
        }
      } catch {
        // Non-blocking – consultant can set availability from dashboard
      }

      return res.data;
    },
    onSuccess: () => setSubmitted(true),
  });

  const toggleSpec = (s: string) => {
    setForm((f) => ({
      ...f,
      specializations: f.specializations.includes(s)
        ? f.specializations.filter((x) => x !== s)
        : [...f.specializations, s],
    }));
  };

  const toggleLang = (l: string) => {
    setForm((f) => ({
      ...f,
      languages: f.languages.includes(l)
        ? f.languages.filter((x) => x !== l)
        : [...f.languages, l],
    }));
  };

  const togglePlatform = (p: string) => {
    setForm((f) => ({
      ...f,
      hostingPlatforms: f.hostingPlatforms.includes(p)
        ? f.hostingPlatforms.filter((x) => x !== p)
        : [...f.hostingPlatforms, p],
    }));
  };

  const addDocument = (file: File, type: string) => {
    const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined;
    setDocuments((prev) => [...prev.filter((d) => d.type !== type), { file, type, preview }]);
  };

  const removeDocument = (type: string) => {
    setDocuments((prev) => {
      const doc = prev.find((d) => d.type === type);
      if (doc?.preview) URL.revokeObjectURL(doc.preview);
      return prev.filter((d) => d.type !== type);
    });
  };

  const validateStep = (s: number): boolean => {
    const err: Record<string, string> = {};
    if (s === 0) {
      if (!form.displayName.trim()) err.displayName = isAr ? 'مطلوب' : 'Required';
      if (!form.bio.trim() || form.bio.length < 50) err.bio = isAr ? 'على الأقل 50 حرف' : 'At least 50 characters';
    }
    if (s === 1) {
      if (form.specializations.length === 0) err.specializations = isAr ? 'اختر تخصص واحد على الأقل' : 'Select at least one';
      if (form.yearsExperience < 1) err.yearsExperience = isAr ? 'سنة واحدة على الأقل' : 'At least 1 year';
      if (form.languages.length === 0) err.languages = isAr ? 'اختر لغة واحدة على الأقل' : 'Select at least one';
    }
    if (s === 2) {
      if (form.hourlyRate < 50) err.hourlyRate = isAr ? 'الحد الأدنى 50 جنيه' : 'Minimum EGP 50';
    }
    if (s === 3) {
      const hasId = documents.some((d) => d.type === 'national_id');
      const hasPhoto = documents.some((d) => d.type === 'profile_photo');
      if (!hasId) err.national_id = isAr ? 'مطلوب للتحقق' : 'Required for verification';
      if (!hasPhoto) err.profile_photo = isAr ? 'مطلوب لملفك' : 'Required for your profile';
    }
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const nextStep = () => {
    if (validateStep(step)) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const prevStep = () => setStep((s) => Math.max(s - 1, 0));

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeDocType) {
      addDocument(file, activeDocType);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Pre-flight gate ──
  const isEgyptianPhone = (phone: string | null | undefined) => {
    if (!phone) return false;
    const cleaned = phone.replace(/\s+/g, '');
    return /^(\+20|0020|01)[0-9]{9,10}$/.test(cleaned);
  };

  if (!hasHydrated) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-indigo-50">
          <Shield className="h-10 w-10 text-indigo-500" />
        </div>
        <h2 className="mb-3 text-2xl font-bold text-gray-900">
          {isAr ? 'يجب تسجيل الدخول أولاً' : 'Sign in to continue'}
        </h2>
        <p className="mb-6 max-w-sm text-gray-500">
          {isAr
            ? 'تحتاج لحساب ورقم هاتف مصري محقق لتقديم طلب مستشار.'
            : 'You need an account with a verified Egyptian phone number to apply as a consultant.'}
        </p>
        <button
          onClick={() => router.push(`/${locale}/login?redirect=/${locale}/consultations/apply`)}
          className="rounded-xl bg-indigo-500 px-8 py-3 text-sm font-semibold text-white hover:bg-indigo-600 transition"
        >
          {isAr ? 'تسجيل الدخول' : 'Sign In'}
        </button>
      </div>
    );
  }

  if (!user?.isEmailVerified) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-50">
          <AlertCircle className="h-10 w-10 text-amber-500" />
        </div>
        <h2 className="mb-3 text-2xl font-bold text-gray-900">
          {isAr ? 'يجب تأكيد البريد الإلكتروني' : 'Email verification required'}
        </h2>
        <p className="mb-6 max-w-sm text-gray-500">
          {isAr
            ? 'تحتاج لتأكيد بريدك الإلكتروني قبل التقديم كمستشار.'
            : 'You need to verify your email address before applying as a consultant.'}
        </p>
        <button
          onClick={() => router.push(`/${locale}/account/verification`)}
          className="rounded-xl bg-amber-500 px-8 py-3 text-sm font-semibold text-white hover:bg-amber-600 transition"
        >
          {isAr ? 'تأكيد البريد الإلكتروني' : 'Verify Email'}
        </button>
      </div>
    );
  }

  if (!user?.isPhoneVerified || !isEgyptianPhone(user?.phone)) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-rose-50">
          <span className="text-4xl">🇪🇬</span>
        </div>
        <h2 className="mb-3 text-2xl font-bold text-gray-900">
          {isAr ? 'رقم هاتف مصري محقق مطلوب' : 'Verified Egyptian phone number required'}
        </h2>
        <p className="mb-2 max-w-sm text-gray-500">
          {isAr
            ? 'المنصة متاحة حالياً للمقيمين في مصر فقط. يجب إضافة رقم هاتف مصري (+20) محقق لحسابك.'
            : 'The consultant marketplace is currently available for Egypt residents only. Add and verify an Egyptian phone number (+20) to your account to proceed.'}
        </p>
        {user?.phone && !isEgyptianPhone(user?.phone) && (
          <p className="mb-4 text-sm text-rose-500">
            {isAr
              ? `الرقم الحالي (${user.phone}) ليس رقماً مصرياً.`
              : `Current number (${user.phone}) is not an Egyptian number.`}
          </p>
        )}
        <button
          onClick={() => router.push(`/${locale}/account/verification`)}
          className="rounded-xl bg-rose-500 px-8 py-3 text-sm font-semibold text-white hover:bg-rose-600 transition"
        >
          {isAr ? 'إضافة وتأكيد رقم مصري' : 'Add & Verify Egyptian Number'}
        </button>
      </div>
    );
  }

  // ── Success Screen ──
  if (submitted) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-10 w-10 text-green-500" />
          </div>
        </motion.div>
        <h1 className="mb-3 text-3xl font-bold text-gray-900">
          {isAr ? 'تم تقديم طلبك بنجاح!' : 'Application Submitted Successfully!'}
        </h1>
        <p className="mb-3 max-w-md text-gray-500">
          {isAr
            ? 'سيقوم فريقنا بمراجعة طلبك ومستنداتك والرد خلال ٢-٣ أيام عمل.'
            : 'Our team will review your application and documents within 2-3 business days.'}
        </p>
        <div className="mb-8 rounded-xl bg-amber-50 border border-amber-200 p-4 max-w-md">
          <div className="flex items-start gap-2">
            <Shield className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              {isAr
                ? 'سنراجع هويتك ومستنداتك للتأكد من سلامة وأمان المنصة لجميع المستخدمين.'
                : 'We\'ll verify your identity and documents to ensure safety and trust for all users on the platform.'}
            </p>
          </div>
        </div>
        <button
          onClick={() => router.push(`/${locale}/consultations/dashboard`)}
          className="rounded-xl bg-rose-500 px-8 py-3 text-sm font-semibold text-white hover:bg-rose-600 transition"
        >
          {isAr ? 'الذهاب للوحة التحكم' : 'Go to Dashboard'}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 md:py-12">
      <div className="mx-auto max-w-3xl px-4">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-50">
            <GraduationCap className="h-8 w-8 text-rose-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isAr ? 'طلب الانضمام كمستشار ضيافة' : 'Apply as Hospitality Consultant'}
          </h1>
          <p className="mt-2 text-gray-500">
            {isAr
              ? 'أكمل جميع الخطوات — فريقنا سيراجع طلبك ومستنداتك لضمان جودة الخدمة'
              : 'Complete all steps — our team will review your application & documents to ensure quality'}
          </p>
        </div>

        {/* Step Indicator */}
        <div className="mb-8 flex items-center justify-center gap-1">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === step;
            const isDone = i < step;
            return (
              <div key={i} className="flex items-center">
                <button
                  onClick={() => { if (i < step) setStep(i); }}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    isActive ? 'bg-rose-500 text-white' :
                    isDone ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-400'
                  }`}
                >
                  {isDone ? <CheckCircle className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                  <span className="hidden sm:inline">{isAr ? s.ar : s.en}</span>
                </button>
                {i < STEPS.length - 1 && (
                  <ChevronRight className={`mx-1 h-4 w-4 ${isDone ? 'text-green-400' : 'text-gray-300'}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Form Card */}
        <div className="rounded-2xl bg-white p-6 md:p-8 shadow-sm border border-gray-100">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={handleFileInput}
          />

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* ── Step 0: Personal Info ── */}
              {step === 0 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">
                      {isAr ? 'المعلومات الشخصية' : 'Personal Information'}
                    </h2>
                    <p className="text-sm text-gray-500 mb-6">
                      {isAr ? 'هذه المعلومات ستظهر في ملفك للعملاء' : 'This information will be visible on your public profile'}
                    </p>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      {isAr ? 'الاسم المعروض *' : 'Display Name *'}
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={120}
                      value={form.displayName}
                      onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                      className={`w-full rounded-xl border px-4 py-3 text-sm transition focus:outline-none focus:ring-2 focus:ring-rose-500/20 ${errors.displayName ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-rose-500'}`}
                      placeholder={isAr ? 'مثال: أحمد - خبير ضيافة' : 'e.g. Ahmed - Hospitality Expert'}
                    />
                    {errors.displayName && <p className="mt-1 text-xs text-red-500">{errors.displayName}</p>}
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      {isAr ? 'نبذة عنك *' : 'About You *'}
                      <span className="text-gray-400 font-normal"> ({form.bio.length}/2000)</span>
                    </label>
                    <textarea
                      rows={5}
                      maxLength={2000}
                      value={form.bio}
                      onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                      className={`w-full rounded-xl border px-4 py-3 text-sm transition focus:outline-none focus:ring-2 focus:ring-rose-500/20 ${errors.bio ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-rose-500'}`}
                      placeholder={isAr
                        ? 'أخبرنا عن خبرتك في مجال الضيافة، إنجازاتك، ولماذا ستكون مستشاراً ممتازاً. (50 حرف على الأقل)'
                        : 'Tell us about your hospitality experience, achievements, and why you\'d be a great consultant. (min 50 characters)'}
                    />
                    {errors.bio && <p className="mt-1 text-xs text-red-500">{errors.bio}</p>}
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      {isAr ? 'لماذا تريد أن تصبح مستشاراً؟' : 'Why do you want to become a consultant?'}
                    </label>
                    <textarea
                      rows={3}
                      maxLength={1000}
                      value={form.whyConsultant}
                      onChange={(e) => setForm((f) => ({ ...f, whyConsultant: e.target.value }))}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm transition focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                      placeholder={isAr
                        ? 'ما الذي يدفعك لمساعدة المضيفين الآخرين؟'
                        : 'What drives you to help other hosts succeed?'}
                    />
                  </div>
                </div>
              )}

              {/* ── Step 1: Experience ── */}
              {step === 1 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">
                      {isAr ? 'الخبرة والتخصصات' : 'Experience & Expertise'}
                    </h2>
                    <p className="text-sm text-gray-500 mb-6">
                      {isAr ? 'ساعدنا نفهم خبرتك في مجال الضيافة' : 'Help us understand your hospitality background'}
                    </p>
                  </div>

                  {/* Specializations */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      {isAr ? 'التخصصات * (اختر كل ما ينطبق)' : 'Specializations * (select all that apply)'}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {SPECIALIZATION_OPTIONS.map((s) => (
                        <button
                          key={s.value}
                          type="button"
                          onClick={() => toggleSpec(s.value)}
                          className={`rounded-full px-4 py-2 text-xs font-medium transition ${
                            form.specializations.includes(s.value)
                              ? 'bg-rose-500 text-white shadow-sm'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {isAr ? s.ar : s.en}
                        </button>
                      ))}
                    </div>
                    {errors.specializations && <p className="mt-1 text-xs text-red-500">{errors.specializations}</p>}
                  </div>

                  {/* Years of Experience */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      {isAr ? 'سنوات الخبرة في الضيافة *' : 'Years of Hospitality Experience *'}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {YEARS_EXPERIENCE_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, yearsExperience: opt.value }))}
                          className={`rounded-full px-4 py-2 text-xs font-medium transition ${
                            form.yearsExperience === opt.value
                              ? 'bg-rose-500 text-white shadow-sm'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {isAr ? opt.ar : opt.en}
                        </button>
                      ))}
                    </div>
                    {errors.yearsExperience && <p className="mt-1 text-xs text-red-500">{errors.yearsExperience}</p>}
                  </div>

                  {/* Properties Managed */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      {isAr ? 'عدد العقارات التي أدرتها/تديرها' : 'Number of Properties Managed'}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {PROPERTIES_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, propertiesManaged: f.propertiesManaged === opt.value ? '' : opt.value }))}
                          className={`rounded-full px-4 py-2 text-xs font-medium transition ${
                            form.propertiesManaged === opt.value
                              ? 'bg-rose-500 text-white shadow-sm'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {isAr ? opt.ar : opt.en}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Hosting Platforms */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      {isAr ? 'منصات الاستضافة المستخدمة' : 'Hosting Platforms Used'}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {PLATFORM_OPTIONS.map((p) => (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() => togglePlatform(p.value)}
                          className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium transition ${
                            form.hostingPlatforms.includes(p.value)
                              ? 'bg-rose-500 text-white shadow-sm'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          <span>{p.icon}</span>
                          {isAr ? p.ar : p.en}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Hosting Since */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      {isAr ? 'بدأت الاستضافة منذ' : 'Hosting Since'}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {HOSTING_SINCE_OPTIONS.map((year) => (
                        <button
                          key={year}
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, hostingSince: f.hostingSince === year ? '' : year }))}
                          className={`rounded-full px-3.5 py-2 text-xs font-medium transition ${
                            form.hostingSince === year
                              ? 'bg-rose-500 text-white shadow-sm'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {year}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Languages */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      <Globe className="mr-1 inline h-4 w-4" />
                      {isAr ? 'اللغات التي تقدم بها الاستشارة *' : 'Languages You Consult In *'}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {LANGUAGE_OPTIONS.map((l) => (
                        <button
                          key={l.code}
                          type="button"
                          onClick={() => toggleLang(l.code)}
                          className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition ${
                            form.languages.includes(l.code)
                              ? 'bg-rose-500 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          <span>{l.flag}</span> {l.label}
                        </button>
                      ))}
                    </div>
                    {errors.languages && <p className="mt-1 text-xs text-red-500">{errors.languages}</p>}
                  </div>
                </div>
              )}

              {/* ── Step 2: Pricing ── */}
              {step === 2 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">
                      {isAr ? 'التسعير' : 'Pricing'}
                    </h2>
                    <p className="text-sm text-gray-500 mb-6">
                      {isAr ? 'حدد سعر الساعة — يمكنك تغييره لاحقاً' : 'Set your hourly rate — you can change it later'}
                    </p>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      <DollarSign className="mr-1 inline h-4 w-4" />
                      {isAr ? 'سعر الساعة (ج.م) *' : 'Hourly Rate (EGP) *'}
                    </label>
                    <input
                      type="number"
                      min={50}
                      step={10}
                      value={form.hourlyRate || ''}
                      onChange={(e) => setForm((f) => ({ ...f, hourlyRate: Number(e.target.value) }))}
                      className={`w-full rounded-xl border px-4 py-3 text-sm transition focus:outline-none focus:ring-2 focus:ring-rose-500/20 ${errors.hourlyRate ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-rose-500'}`}
                      placeholder="500"
                    />
                    {errors.hourlyRate && <p className="mt-1 text-xs text-red-500">{errors.hourlyRate}</p>}
                  </div>

                  {/* Earnings Preview */}
                  {form.hourlyRate >= 50 && (
                    <div className="rounded-xl bg-gray-50 border border-gray-200 p-5">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">
                        {isAr ? 'معاينة أرباحك' : 'Your Earnings Preview'}
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500">{isAr ? 'سعر الجلسة' : 'Session Price'}</p>
                          <p className="text-lg font-bold text-gray-900">{isAr ? 'ج.م' : 'EGP'} {form.hourlyRate}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">{isAr ? 'رسوم المنصة (10%)' : 'Platform Fee (10%)'}</p>
                          <p className="text-lg font-bold text-red-500">-{isAr ? 'ج.م' : 'EGP'} {Math.round(form.hourlyRate * 0.1)}</p>
                        </div>
                        <div className="col-span-2 border-t pt-3">
                          <p className="text-xs text-gray-500">{isAr ? 'أنت تحصل على' : 'You Receive'}</p>
                          <p className="text-2xl font-bold text-green-600">{isAr ? 'ج.م' : 'EGP'} {Math.round(form.hourlyRate * 0.9)}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {isAr
                              ? `≈ ${isAr ? 'ج.م' : 'EGP'} ${(Math.round(form.hourlyRate * 0.9) * 16).toLocaleString()} /شهر (4 جلسات/أسبوع)`
                              : `≈ EGP ${(Math.round(form.hourlyRate * 0.9) * 16).toLocaleString()} /month (4 sessions/week)`}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
                    <p className="text-sm text-blue-800">
                      {isAr
                        ? '💡 نصيحة: المستشارون الأكثر نجاحاً في مصر يحددون أسعاراً بين 300-1000 جنيه/ساعة حسب تخصصهم.'
                        : '💡 Tip: Most successful consultants in Egypt charge EGP 300-1,000/hour depending on their specialization.'}
                    </p>
                  </div>
                </div>
              )}

              {/* ── Step 3: Documents ── */}
              {step === 3 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">
                      {isAr ? 'المستندات والتحقق' : 'Documents & Verification'}
                    </h2>
                    <p className="text-sm text-gray-500 mb-2">
                      {isAr
                        ? 'نحتاج هذه المستندات للتحقق من هويتك وخبرتك — لضمان أمان وثقة جميع المستخدمين'
                        : 'We need these documents to verify your identity and experience — ensuring safety and trust for all users'}
                    </p>
                    <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3 mb-4">
                      <Shield className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-800">
                        {isAr
                          ? 'مستنداتك محمية وتُستخدم فقط لأغراض التحقق من قبل فريق المراجعة. لن تُشارك مع أي طرف آخر.'
                          : 'Your documents are secure and only used for verification by our review team. They are never shared with anyone else.'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {DOCUMENT_TYPES.map((doc) => {
                      const uploaded = documents.find((d) => d.type === doc.type);
                      return (
                        <div
                          key={doc.type}
                          className={`rounded-xl border p-4 transition ${
                            uploaded ? 'border-green-300 bg-green-50' :
                            errors[doc.type] ? 'border-red-300 bg-red-50' :
                            'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-gray-900">
                                  {isAr ? doc.ar : doc.en}
                                  {doc.required && <span className="text-red-500 ml-1">*</span>}
                                </p>
                                {uploaded && <CheckCircle className="h-4 w-4 text-green-500" />}
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {isAr ? doc.desc_ar : doc.desc_en}
                              </p>
                              {uploaded && (
                                <p className="text-xs text-green-700 mt-1 flex items-center gap-1">
                                  <FileText className="h-3 w-3" />
                                  {uploaded.file.name}
                                </p>
                              )}
                              {errors[doc.type] && <p className="mt-1 text-xs text-red-500">{errors[doc.type]}</p>}
                            </div>
                            <div className="flex items-center gap-2">
                              {uploaded && (
                                <button
                                  type="button"
                                  onClick={() => removeDocument(doc.type)}
                                  className="rounded-lg p-1.5 text-red-400 hover:bg-red-100 transition"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveDocType(doc.type);
                                  fileInputRef.current?.click();
                                }}
                                className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                                  uploaded
                                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                    : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                                }`}
                              >
                                <Upload className="h-3.5 w-3.5 inline mr-1" />
                                {uploaded
                                  ? (isAr ? 'تغيير' : 'Change')
                                  : (isAr ? 'رفع' : 'Upload')}
                              </button>
                            </div>
                          </div>
                          {/* Image preview */}
                          {uploaded?.preview && (
                            <div className="mt-3">
                              <img
                                src={uploaded.preview}
                                alt={isAr ? doc.ar : doc.en}
                                className="h-20 w-20 rounded-lg object-cover border border-gray-200"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <p className="text-xs text-gray-400 text-center">
                    {isAr
                      ? 'الصيغ المدعومة: JPG, PNG, WebP, PDF — الحجم الأقصى: 10 ميجابايت'
                      : 'Supported formats: JPG, PNG, WebP, PDF — Max size: 10MB'}
                  </p>
                </div>
              )}

              {/* ── Step 4: Availability ── */}
              {step === 4 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">
                      {isAr ? 'أوقات التوفر الأسبوعية' : 'Weekly Availability'}
                    </h2>
                    <p className="text-sm text-gray-500 mb-6">
                      {isAr
                        ? 'حدد الأيام والأوقات التي تكون فيها متاحاً للجلسات — يمكنك تغييرها لاحقاً'
                        : "Set the days and times you're available for sessions — you can change these anytime"}
                    </p>
                  </div>

                  <div className="space-y-3">
                    {DAYS_CONFIG.map((day) => {
                      const cfg = availability[day.value];
                      return (
                        <div
                          key={day.value}
                          className={`rounded-xl border p-4 transition ${
                            cfg.enabled ? 'border-rose-200 bg-rose-50/40' : 'border-gray-200 bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() =>
                                setAvailability((prev) => ({
                                  ...prev,
                                  [day.value]: { ...prev[day.value], enabled: !prev[day.value].enabled },
                                }))
                              }
                              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition ${
                                cfg.enabled
                                  ? 'bg-rose-500 text-white'
                                  : 'bg-gray-100 text-gray-300 hover:bg-gray-200'
                              }`}
                            >
                              {cfg.enabled && '✓'}
                            </button>
                            <span
                              className={`flex-1 text-sm font-medium ${
                                cfg.enabled ? 'text-gray-900' : 'text-gray-400'
                              }`}
                            >
                              {isAr ? day.ar : day.en}
                            </span>
                            {cfg.enabled && (
                              <div className="flex items-center gap-2">
                                <input
                                  type="time"
                                  value={cfg.startTime}
                                  onChange={(e) =>
                                    setAvailability((prev) => ({
                                      ...prev,
                                      [day.value]: { ...prev[day.value], startTime: e.target.value },
                                    }))
                                  }
                                  className="rounded-lg border border-gray-200 px-2 py-1 text-xs focus:border-rose-400 focus:outline-none"
                                />
                                <span className="text-gray-400 text-xs">–</span>
                                <input
                                  type="time"
                                  value={cfg.endTime}
                                  onChange={(e) =>
                                    setAvailability((prev) => ({
                                      ...prev,
                                      [day.value]: { ...prev[day.value], endTime: e.target.value },
                                    }))
                                  }
                                  className="rounded-lg border border-gray-200 px-2 py-1 text-xs focus:border-rose-400 focus:outline-none"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="rounded-xl bg-blue-50 border border-blue-200 p-3">
                    <p className="text-xs text-blue-800">
                      {isAr
                        ? '💡 هذه الخطوة اختيارية — يمكنك ضبط توفرك لاحقاً من لوحة التحكم بعد الموافقة على طلبك.'
                        : '💡 This step is optional — you can set your availability later from the dashboard once your application is approved.'}
                    </p>
                  </div>
                </div>
              )}

              {/* ── Step 5: Review ── */}
              {step === 5 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">
                      {isAr ? 'مراجعة طلبك' : 'Review Your Application'}
                    </h2>
                    <p className="text-sm text-gray-500 mb-6">
                      {isAr ? 'تأكد من صحة جميع المعلومات قبل الإرسال' : 'Make sure everything looks correct before submitting'}
                    </p>
                  </div>

                  {/* Summary Cards */}
                  <div className="space-y-4">
                    {/* Personal Info */}
                    <div className="rounded-xl border border-gray-200 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {isAr ? 'المعلومات الشخصية' : 'Personal Info'}
                        </h3>
                        <button onClick={() => setStep(0)} className="text-xs text-rose-500 hover:underline">
                          {isAr ? 'تعديل' : 'Edit'}
                        </button>
                      </div>
                      <div className="space-y-1.5 text-sm">
                        <p><span className="text-gray-500">{isAr ? 'الاسم:' : 'Name:'}</span> <span className="font-medium">{form.displayName}</span></p>
                        <p className="text-gray-600 line-clamp-2">{form.bio}</p>
                      </div>
                    </div>

                    {/* Experience */}
                    <div className="rounded-xl border border-gray-200 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <Briefcase className="h-4 w-4" />
                          {isAr ? 'الخبرة' : 'Experience'}
                        </h3>
                        <button onClick={() => setStep(1)} className="text-xs text-rose-500 hover:underline">
                          {isAr ? 'تعديل' : 'Edit'}
                        </button>
                      </div>
                      <div className="space-y-1.5 text-sm">
                        <p>
                          <span className="text-gray-500">{isAr ? 'التخصصات:' : 'Specializations:'}</span>{' '}
                          <span className="font-medium">{form.specializations.map((s) => {
                            const opt = SPECIALIZATION_OPTIONS.find((o) => o.value === s);
                            return isAr ? opt?.ar : opt?.en;
                          }).join(', ')}</span>
                        </p>
                        <p><span className="text-gray-500">{isAr ? 'سنوات الخبرة:' : 'Years:'}</span> <span className="font-medium">{form.yearsExperience}</span></p>
                        <p><span className="text-gray-500">{isAr ? 'اللغات:' : 'Languages:'}</span> <span className="font-medium">{form.languages.map((l) => LANGUAGE_OPTIONS.find((o) => o.code === l)?.label).join(', ')}</span></p>
                        {form.propertiesManaged && <p><span className="text-gray-500">{isAr ? 'العقارات:' : 'Properties:'}</span> <span className="font-medium">{form.propertiesManaged}</span></p>}
                        {form.hostingPlatforms.length > 0 && <p><span className="text-gray-500">{isAr ? 'المنصات:' : 'Platforms:'}</span> <span className="font-medium">{form.hostingPlatforms.join(', ')}</span></p>}
                      </div>
                    </div>

                    {/* Pricing */}
                    <div className="rounded-xl border border-gray-200 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          {isAr ? 'التسعير' : 'Pricing'}
                        </h3>
                        <button onClick={() => setStep(2)} className="text-xs text-rose-500 hover:underline">
                          {isAr ? 'تعديل' : 'Edit'}
                        </button>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">{isAr ? 'سعر الساعة' : 'Hourly Rate'}</p>
                          <p className="text-lg font-bold">{isAr ? 'ج.م' : 'EGP'} {form.hourlyRate}</p>
                        </div>
                        <div className="text-gray-300">→</div>
                        <div>
                          <p className="text-gray-500">{isAr ? 'تحصل على' : 'You Receive'}</p>
                          <p className="text-lg font-bold text-green-600">{isAr ? 'ج.م' : 'EGP'} {Math.round(form.hourlyRate * 0.9)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Documents */}
                    <div className="rounded-xl border border-gray-200 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          {isAr ? 'المستندات' : 'Documents'}
                        </h3>
                        <button onClick={() => setStep(3)} className="text-xs text-rose-500 hover:underline">
                          {isAr ? 'تعديل' : 'Edit'}
                        </button>
                      </div>
                      <div className="space-y-1 text-sm">
                        {documents.map((d) => {
                          const docDef = DOCUMENT_TYPES.find((t) => t.type === d.type);
                          return (
                            <div key={d.type} className="flex items-center gap-2">
                              <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                              <span className="text-gray-700">{isAr ? docDef?.ar : docDef?.en}</span>
                              <span className="text-gray-400">— {d.file.name}</span>
                            </div>
                          );
                        })}
                        {documents.length === 0 && (
                          <p className="text-gray-400 text-xs">{isAr ? 'لم يتم رفع مستندات' : 'No documents uploaded'}</p>
                        )}
                      </div>
                    </div>

                    {/* Availability */}
                    <div className="rounded-xl border border-gray-200 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {isAr ? 'أوقات التوفر' : 'Availability'}
                        </h3>
                        <button onClick={() => setStep(4)} className="text-xs text-rose-500 hover:underline">
                          {isAr ? 'تعديل' : 'Edit'}
                        </button>
                      </div>
                      <div className="space-y-1 text-sm">
                        {DAYS_CONFIG.filter((d) => availability[d.value].enabled).length === 0 ? (
                          <p className="text-xs text-gray-400">
                            {isAr ? 'لم يتم تحديد أوقات (اختياري)' : 'No schedule set (optional)'}
                          </p>
                        ) : (
                          DAYS_CONFIG.filter((d) => availability[d.value].enabled).map((d) => (
                            <div key={d.value} className="flex items-center gap-2">
                              <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                              <span className="text-gray-700">{isAr ? d.ar : d.en}</span>
                              <span className="text-gray-400">
                                {availability[d.value].startTime} – {availability[d.value].endTime}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Terms */}
                  <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {isAr
                        ? 'بتقديم هذا الطلب، أنت توافق على أن المعلومات المقدمة صحيحة وأنك تفهم أن المنصة تأخذ 10% رسوم من كل جلسة استشارية. فريقنا سيراجع طلبك ومستنداتك خلال ٢-٣ أيام عمل.'
                        : 'By submitting this application, you confirm that all information provided is accurate and that you understand the platform charges a 10% fee from each consultation session. Our team will review your application and documents within 2-3 business days.'}
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="mt-8 flex items-center justify-between">
            <button
              type="button"
              onClick={prevStep}
              className={`flex items-center gap-1 rounded-xl px-5 py-2.5 text-sm font-medium transition ${
                step === 0 ? 'invisible' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <ChevronLeft className="h-4 w-4" />
              {isAr ? 'السابق' : 'Back'}
            </button>

            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex items-center gap-1 rounded-xl bg-rose-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-rose-600 transition"
              >
                {isAr ? 'التالي' : 'Next'}
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => applyMutation.mutate()}
                disabled={applyMutation.isPending}
                className="flex items-center gap-2 rounded-xl bg-rose-500 px-8 py-3 text-sm font-bold text-white hover:bg-rose-600 transition disabled:opacity-50"
              >
                {applyMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {isAr ? 'جاري الإرسال...' : 'Submitting...'}
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4" />
                    {isAr ? 'قدّم الطلب' : 'Submit Application'}
                  </>
                )}
              </button>
            )}
          </div>

          {applyMutation.isError && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 p-3">
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
              <p className="text-sm text-red-600">
                {(applyMutation.error as any)?.response?.data?.message ?? (isAr ? 'حدث خطأ. حاول مرة أخرى.' : 'Something went wrong. Please try again.')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
