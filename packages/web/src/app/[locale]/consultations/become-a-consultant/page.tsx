'use client';

import { useLocale } from 'next-intl';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  GraduationCap, DollarSign, TrendingUp, Users, Shield, Star,
  CheckCircle, ArrowRight, Home, Camera, Sparkles, Award, Briefcase,
  Clock, Globe, Zap,
} from 'lucide-react';

const SERVICES_YOU_CAN_OFFER = [
  { icon: Home, labelEn: 'Listing Optimization', labelAr: 'تحسين الإعلان', descEn: 'Help hosts create compelling listings that attract more bookings', descAr: 'ساعد المضيفين في إنشاء إعلانات جذابة تجلب حجوزات أكثر' },
  { icon: DollarSign, labelEn: 'Pricing Strategy', labelAr: 'استراتيجية التسعير', descEn: 'Set competitive prices that maximize revenue year-round', descAr: 'حدد أسعار تنافسية تزيد الإيرادات طوال السنة' },
  { icon: Sparkles, labelEn: 'Interior Design', labelAr: 'التصميم الداخلي', descEn: 'Transform spaces into Instagram-worthy stays guests love', descAr: 'حول المساحات لإقامات مميزة يحبها الضيوف' },
  { icon: Users, labelEn: 'Guest Experience', labelAr: 'تجربة الضيوف', descEn: 'Create 5-star guest journeys from check-in to checkout', descAr: 'اصنع تجربة ضيوف 5 نجوم من الوصول للمغادرة' },
  { icon: Camera, labelEn: 'Photography', labelAr: 'التصوير', descEn: 'Shoot stunning property photos that sell', descAr: 'صور عقارات احترافية تبيع نفسها' },
  { icon: Award, labelEn: 'Superhost Coaching', labelAr: 'تدريب المضيف المتميز', descEn: 'Guide hosts to achieve and maintain Superhost status', descAr: 'وجه المضيفين لتحقيق والحفاظ على حالة المضيف المتميز' },
  { icon: Briefcase, labelEn: 'Property Management', labelAr: 'إدارة العقارات', descEn: 'Teach efficient multi-property management systems', descAr: 'علّم أنظمة إدارة عقارات متعددة بكفاءة' },
  { icon: TrendingUp, labelEn: 'Revenue Management', labelAr: 'إدارة الإيرادات', descEn: 'Maximize income with data-driven strategies', descAr: 'زيادة الدخل باستخدام استراتيجيات مبنية على البيانات' },
];

const BENEFITS = [
  { icon: DollarSign, titleEn: 'Earn on Your Terms', titleAr: 'اكسب بشروطك', descEn: 'Set your own hourly rate and work schedule. You keep 90% of every session — we only take a small 10% platform fee.', descAr: 'حدد سعر الساعة وجدول عملك. تحتفظ بـ 90% من كل جلسة — نأخذ فقط 10% رسوم منصة.' },
  { icon: Globe, titleEn: 'Reach More Clients', titleAr: 'الوصول لعملاء أكثر', descEn: 'Our marketplace connects you with hosts across Egypt who need exactly your expertise. No more hunting for clients.', descAr: 'سوقنا يوصلك بمضيفين في كل مصر يحتاجون خبرتك بالتحديد. مش هتحتاج تدور على عملاء.' },
  { icon: Shield, titleEn: 'Secure Payments', titleAr: 'مدفوعات آمنة', descEn: 'Get paid reliably after each session. We handle all payment processing — card, InstaPay, and wallet.', descAr: 'اتقاضى أجرك بعد كل جلسة. إحنا بنتعامل مع كل عمليات الدفع — بطاقة، إنستاباي، ومحفظة.' },
  { icon: Star, titleEn: 'Build Your Reputation', titleAr: 'ابنِ سمعتك', descEn: 'Collect reviews and ratings from clients. Top-rated consultants get featured placement and more bookings.', descAr: 'اجمع تقييمات ومراجعات من العملاء. المستشارون الأعلى تقييماً يحصلون على وضع مميز وحجوزات أكثر.' },
  { icon: Clock, titleEn: 'Flexible Schedule', titleAr: 'جدول مرن', descEn: 'Set your availability by day and time. Offer video calls, phone sessions, or in-person meetings — your choice.', descAr: 'حدد مواعيدك حسب اليوم والوقت. قدم مكالمات فيديو، جلسات هاتف، أو لقاءات شخصية — اختيارك.' },
  { icon: Zap, titleEn: 'Instant Visibility', titleAr: 'ظهور فوري', descEn: 'Once approved, your profile appears on the home page and marketplace. Hosts can find and book you immediately.', descAr: 'بمجرد الموافقة، ملفك يظهر في الصفحة الرئيسية والسوق. المضيفون يقدرون يلاقوك ويحجزوا فوراً.' },
];

export default function BecomeAConsultantPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';

  return (
    <div className="min-h-screen bg-white">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0c0a1e] via-indigo-950 to-[#0c0a1e] py-24 text-white">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-indigo-500/20 blur-[120px]" />
          <div className="absolute top-0 right-1/4 w-80 h-80 rounded-full bg-indigo-500/15 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-5xl px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-5 py-2 text-sm font-medium backdrop-blur-sm">
              <GraduationCap className="h-4 w-4" />
              {isAr ? 'انضم كمستشار' : 'Become a Consultant'}
            </div>
            <h1 className="mb-6 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]">
              {isAr
                ? 'حوّل خبرتك في الضيافة إلى مصدر دخل'
                : 'Turn Your Hospitality Expertise Into Income'}
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-lg text-indigo-200 leading-relaxed">
              {isAr
                ? 'ساعد المضيفين المبتدئين يحققوا دخل من عقاراتهم، واكسب 90% من كل جلسة استشارية. إحنا بنأخذ 10% بس كرسوم منصة.'
                : 'Help struggling hosts earn from their properties and keep 90% of every consultation session. We only take a small 10% platform fee.'}
            </p>
            {/* Egypt-only notice */}
            <div className="mx-auto mb-6 max-w-lg rounded-xl bg-white/10 border border-white/20 backdrop-blur-sm px-5 py-3 text-sm flex items-center justify-center gap-2">
              <span className="text-xl">🇪🇬</span>
              <span className="font-medium text-white/90">
                {isAr
                  ? 'متاح حالياً للمقيمين في مصر فقط — رقم هاتف مصري مطلوب للتسجيل'
                  : 'Currently available for Egypt residents only — Egyptian phone number required to apply'}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href={`/${locale}/consultations/apply`}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-8 py-4 text-sm font-bold text-white shadow-xl transition hover:bg-indigo-600"
              >
                {isAr ? 'قدّم طلب الآن' : 'Apply Now'}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#how-it-works"
                className="rounded-xl border border-white/25 px-8 py-4 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                {isAr ? 'اعرف أكتر' : 'Learn More'}
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Earnings Example ── */}
      <section className="py-16 bg-gray-50">
        <div className="mx-auto max-w-5xl px-4">
          <div className="rounded-3xl bg-white border border-gray-200 p-8 md:p-12 shadow-sm">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                {isAr ? 'كم ممكن تكسب؟' : 'How Much Can You Earn?'}
              </h2>
              <p className="text-gray-500 max-w-lg mx-auto">
                {isAr
                  ? 'مثال: لو سعر جلستك 500 جنيه'
                  : 'Example: If your session price is EGP 500'}
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="rounded-2xl bg-gray-50 p-6 text-center">
                <p className="text-sm font-medium text-gray-500 mb-2">{isAr ? 'سعر جلستك' : 'Your Session Price'}</p>
                <p className="text-3xl font-bold text-gray-900">EGP 500</p>
                <p className="text-xs text-gray-400 mt-1">{isAr ? 'أنت تحدد السعر' : 'You set the price'}</p>
              </div>
              <div className="rounded-2xl bg-gray-50 p-6 text-center">
                <p className="text-sm font-medium text-gray-500 mb-2">{isAr ? 'رسوم المنصة (10%)' : 'Platform Fee (10%)'}</p>
                <p className="text-3xl font-bold text-gray-900">EGP 50</p>
                <p className="text-xs text-gray-400 mt-1">{isAr ? 'رسوم بسيطة لتشغيل المنصة' : 'Small fee to keep the platform running'}</p>
              </div>
              <div className="rounded-2xl bg-green-50 p-6 text-center border-2 border-green-200">
                <p className="text-sm font-medium text-green-600 mb-2">{isAr ? 'أنت تحصل على' : 'You Receive'}</p>
                <p className="text-3xl font-bold text-green-600">EGP 450</p>
                <p className="text-xs text-green-500 mt-1">{isAr ? '90% من سعر الجلسة' : '90% of session price'}</p>
              </div>
            </div>
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500">
                {isAr
                  ? '💡 لو عملت 4 جلسات في الأسبوع بـ 500 جنيه، هتكسب ~7,200 جنيه شهرياً'
                  : '💡 4 sessions/week at EGP 500 = ~EGP 7,200/month in your pocket'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it Works ── */}
      <section id="how-it-works" className="py-20">
        <div className="mx-auto max-w-5xl px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              {isAr ? 'كيف تبدأ' : 'How It Works'}
            </h2>
            <p className="text-gray-500">{isAr ? '3 خطوات بسيطة للبدء' : '3 simple steps to get started'}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', titleEn: 'Apply', titleAr: 'قدّم', descEn: 'Fill out a short application with your experience, specializations, and hourly rate. Upload any relevant certifications.', descAr: 'املأ طلب قصير بخبرتك وتخصصاتك وسعر الساعة. ارفع أي شهادات ذات صلة.', icon: '📋' },
              { step: '02', titleEn: 'Get Approved', titleAr: 'احصل على الموافقة', descEn: 'Our team reviews your profile and verifies your credentials. Approved consultants go live on the marketplace.', descAr: 'فريقنا يراجع ملفك ويتحقق من مؤهلاتك. المستشارون المعتمدون ينشرون في السوق.', icon: '✅' },
              { step: '03', titleEn: 'Start Earning', titleAr: 'ابدأ الكسب', descEn: 'Hosts book sessions with you. Deliver consultations via video call, phone, or in-person. Get paid after each session.', descAr: 'المضيفون يحجزون جلسات معك. قدم استشارات بالفيديو أو الهاتف أو شخصياً. اتقاضى بعد كل جلسة.', icon: '💰' },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative rounded-2xl bg-white border border-gray-200 p-8 hover:shadow-lg transition-shadow"
              >
                <span className="text-4xl mb-4 block">{item.icon}</span>
                <div className="absolute -top-3 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500 text-xs font-bold text-white">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{isAr ? item.titleAr : item.titleEn}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{isAr ? item.descAr : item.descEn}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What You Can Offer ── */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              {isAr ? 'خدمات تقدر تقدمها' : 'Services You Can Offer'}
            </h2>
            <p className="text-gray-500 max-w-lg mx-auto">
              {isAr
                ? 'اختار التخصصات اللي تناسب خبرتك وساعد المضيفين ينجحوا'
                : 'Choose specializations that match your expertise and help hosts succeed'}
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {SERVICES_YOU_CAN_OFFER.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl bg-white border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
                  <s.icon className="h-5 w-5 text-indigo-500" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{isAr ? s.labelAr : s.labelEn}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{isAr ? s.descAr : s.descEn}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Benefits ── */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              {isAr ? 'ليه تنضم كمستشار؟' : 'Why Become a Consultant?'}
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {BENEFITS.map((b, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="flex gap-4"
              >
                <div className="shrink-0 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50">
                  <b.icon className="h-6 w-6 text-indigo-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{isAr ? b.titleAr : b.titleEn}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{isAr ? b.descAr : b.descEn}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Fee Transparency ── */}
      <section className="py-16 bg-gray-50">
        <div className="mx-auto max-w-3xl px-4">
          <div className="rounded-3xl bg-white border border-gray-200 p-8 md:p-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              {isAr ? 'الرسوم بكل شفافية' : 'Transparent Fees'}
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 shrink-0 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">{isAr ? '10% رسوم منصة فقط' : 'Only 10% platform fee'}</p>
                  <p className="text-sm text-gray-500">{isAr ? 'يتم خصم 10% من سعر جلستك. لو سعرك 500 جنيه، تحصل على 450 جنيه.' : '10% is deducted from your session price. If you charge EGP 500, you receive EGP 450.'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 shrink-0 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">{isAr ? 'بدون اشتراكات' : 'No subscriptions'}</p>
                  <p className="text-sm text-gray-500">{isAr ? 'بدون رسوم شهرية أو رسوم تسجيل. التسجيل مجاني تماماً.' : 'No monthly fees or signup charges. Registration is completely free.'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 shrink-0 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">{isAr ? 'ادفع فقط عندما تكسب' : 'Pay only when you earn'}</p>
                  <p className="text-sm text-gray-500">{isAr ? 'لا رسوم مخفية. الـ 10% تُخصم فقط من الجلسات المكتملة والمدفوعة.' : 'No hidden fees. The 10% is only deducted from completed, paid sessions.'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Who Can Apply ── */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              {isAr ? 'مين يقدر يقدّم؟' : 'Who Can Apply?'}
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              { titleEn: 'Superhosts & experienced hosts', titleAr: 'المضيفون المتميزون والمحترفون', descEn: 'If you manage properties and have a track record of great reviews and high occupancy.', descAr: 'لو بتدير عقارات وعندك سجل تقييمات ممتازة ونسبة إشغال عالية.' },
              { titleEn: 'Interior designers & decorators', titleAr: 'مصممو الديكور والتصميم الداخلي', descEn: 'Help hosts style their spaces for maximum guest appeal and bookability.', descAr: 'ساعد المضيفين يصمموا مساحاتهم لأقصى جذب للضيوف.' },
              { titleEn: 'Professional photographers', titleAr: 'مصورون محترفون', descEn: 'Shoot property photos that make listings stand out and convert views to bookings.', descAr: 'صور عقارات تخلي الإعلانات تبرز وتحول المشاهدات لحجوزات.' },
              { titleEn: 'Property managers & consultants', titleAr: 'مديرو عقارات ومستشارون', descEn: 'Share your expertise in revenue optimization, guest communication, and operations.', descAr: 'شارك خبرتك في تحسين الإيرادات والتواصل مع الضيوف والعمليات.' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: i % 2 === 0 ? -10 : 10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="flex items-start gap-3 rounded-2xl bg-gray-50 p-6"
              >
                <CheckCircle className="h-5 w-5 shrink-0 text-indigo-500 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900">{isAr ? item.titleAr : item.titleEn}</p>
                  <p className="text-sm text-gray-500 mt-1">{isAr ? item.descAr : item.descEn}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-20 bg-gradient-to-br from-indigo-500 via-indigo-700 to-pink-700 text-white">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <GraduationCap className="mx-auto mb-6 h-16 w-16 text-white/80" />
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              {isAr ? 'جاهز تبدأ تكسب من خبرتك؟' : 'Ready to Earn From Your Expertise?'}
            </h2>
            <p className="text-indigo-100 mb-8 max-w-xl mx-auto leading-relaxed">
              {isAr
                ? 'قدّم الآن وانضم لمستشاري الضيافة المعتمدين. التسجيل مجاني — وتبدأ تكسب فور الموافقة.'
                : 'Apply now and join our verified hospitality consultants. Signing up is free — start earning as soon as you\'re approved.'}
            </p>
            <Link
              href={`/${locale}/consultations/apply`}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-10 py-4 text-sm font-bold text-indigo-600 shadow-xl transition hover:bg-gray-50"
            >
              {isAr ? 'قدّم طلبك الآن' : 'Apply Now'}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
