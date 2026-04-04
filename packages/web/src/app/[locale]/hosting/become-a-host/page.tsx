'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import { Home, Images, DollarSign, ChevronRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { getImageUrl } from '@/lib/utils';

const STEPS = [
  {
    number: 1,
    title: 'Tell us about your place',
    description: 'Share some basic info, like where it is and how many guests can stay.',
    icon: Home,
  },
  {
    number: 2,
    title: 'Make it stand out',
    description: "Add 5 or more photos plus a title and description-we'll help you out.",
    icon: Images,
  },
  {
    number: 3,
    title: 'Finish up and publish',
    description: 'Choose a starting price, verify a few details, then publish your listing.',
    icon: DollarSign,
  },
];

const FEATURES = [
  {
    title: "You're in control",
    description: 'Set your own prices, availability, and house rules. You decide who can book.',
    icon: '🎮',
  },
  {
    title: "We've got your back",
    description: 'Host Guarantee program, secure deposits, and 24/7 dedicated support for hosts. Host with confidence.',
    icon: '🛡️',
  },
  {
    title: '0% commission — always',
    description: 'We charge hosts absolutely zero commission. Every penny of your nightly rate goes directly to you.',
    icon: '💸',
  },
];

const FAQS = [
  {
    q: 'How much does it cost to list my place?',
    a: "Listing your place is completely free. And unlike other platforms, Journey Stay charges hosts 0% commission — you keep 100% of your nightly rate. Guests pay a small service fee instead.",
  },
  {
    q: 'How do I get paid?',
    a: 'Payments are released 24 hours after guest check-in and deposited directly to your bank or PayPal.',
  },
  {
    q: 'What if something gets damaged?',
    a: 'Our Host Guarantee Program supports you in damage disputes. You can require a security deposit from guests (collected and held securely by Journey Stay), and our support team mediates any claims with photos and documentation.',
  },
  {
    q: 'Can I host if I rent my place?',
    a: 'It depends on your lease and local laws. Check with your landlord and local regulations first.',
  },
];

export default function BecomeAHostPage() {
  const locale = useLocale();
  const router = useRouter();
  const { isLoggedIn, isHost } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleGetStarted = () => {
    if (!isLoggedIn) {
      router.push(`/${locale}/login?redirect=/${locale}/hosting/activation`);
      return;
    }

    if (isHost) {
      router.push(`/${locale}/hosting/listings/new/structure`);
      return;
    }

    router.push(`/${locale}/hosting/activation`);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <div className="relative min-h-[90vh] flex flex-col lg:flex-row">
        <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-20 py-16 lg:py-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-xl"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-brand/10 border border-brand/20 px-4 py-1.5 text-sm font-bold text-brand mb-5">
              🎉 0% Commission for hosts — keep everything you earn
            </div>

            {/* Egypt-only notice */}
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 mb-5 text-sm text-amber-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://flagcdn.com/eg.svg" alt="Egypt" className="h-4 w-6 mt-0.5 shrink-0" />
              <div>
                <span className="font-semibold">Currently available for Egyptian hosts only.</span>
                {' '}International hosting support is coming soon — stay tuned!
              </div>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-neutral-900 leading-tight">
              It’s easy to get started on{' '}
              <span className="text-brand">
                Journey Stay
              </span>
            </h1>

            <p className="mt-6 text-lg text-neutral-600">
              Open your door to hosting and start earning. We take{' '}
              <strong className="text-neutral-900">0% commission</strong> — every penny is yours.
            </p>

            <div className="mt-10 space-y-6">
              {STEPS.map((step, idx) => (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 + idx * 0.1 }}
                  className="flex gap-4"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700">
                    <step.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-900">{step.title}</h3>
                    <p className="text-sm text-neutral-500 mt-0.5">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="mt-10"
            >
              <button
                onClick={handleGetStarted}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-4 text-lg font-semibold text-white shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                Get started
                <ChevronRight className="h-5 w-5" />
              </button>

              {!isLoggedIn && (
                <p className="mt-3 text-sm text-neutral-500">
                  Already have an account?{' '}
                  <Link
                    href={`/${locale}/login?redirect=/${locale}/hosting/become-a-host`}
                    className="text-neutral-700 font-medium hover:underline"
                  >
                    Log in
                  </Link>
                </p>
              )}
            </motion.div>
          </motion.div>
        </div>

        <div className="flex-1 relative bg-neutral-100 min-h-[400px] lg:min-h-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-white via-transparent to-transparent z-10 lg:block hidden" />

          <div className="absolute inset-0">
            {[
              getImageUrl('/uploads/samples/cairo-nile-1.jpg'),
              getImageUrl('/uploads/samples/gouna-1.jpg'),
              getImageUrl('/uploads/samples/zamalek-1.jpg'),
            ].map((src, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0 }}
                animate={{ opacity: currentSlide === idx ? 1 : 0 }}
                transition={{ duration: 0.8 }}
                className="absolute inset-0"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${src})`,
                    backgroundColor: idx === 0 ? '#E0E7FF' : idx === 1 ? '#DDD6FE' : '#C7D2FE',
                  }}
                />
              </motion.div>
            ))}
          </div>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {[0, 1, 2].map((idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-2 rounded-full transition-all ${
                  currentSlide === idx ? 'w-8 bg-white' : 'w-2 bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <section className="py-20 bg-neutral-50">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900">Why host on Sakan?</h2>
            <p className="mt-4 text-lg text-neutral-600 max-w-2xl mx-auto">
              Join thousands of hosts who earn extra income while sharing their unique spaces with travelers from around the world.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {FEATURES.map((feature, idx) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-2xl p-8 shadow-sm border border-neutral-200"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-neutral-900 mb-2">{feature.title}</h3>
                <p className="text-neutral-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 0% Commission Banner ── */}
      <section className="py-16 bg-gradient-to-r from-brand-dark via-brand to-brand-light text-white overflow-hidden relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-10 left-0 w-72 h-72 rounded-full bg-white/5 blur-3xl" />
        </div>
        <div className="relative max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col lg:flex-row items-center justify-between gap-10"
          >
            <div className="text-center lg:text-left">
              <p className="text-indigo-200 text-sm font-semibold uppercase tracking-widest mb-3">Our promise to every host</p>
              <div className="text-7xl sm:text-8xl font-display font-black leading-none mb-3">0%</div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-3">Commission. Zero. Nothing. Ever.</h2>
              <p className="text-indigo-100 text-lg max-w-lg leading-relaxed">
                Most platforms take a cut of your earnings. Journey Stay charges hosts{' '}
                <strong className="text-white">absolutely nothing</strong>. Your full nightly rate lands in your pocket.
              </p>
            </div>
            <div className="shrink-0 rounded-3xl bg-white/10 border border-white/20 p-8 backdrop-blur-sm w-full max-w-xs">
              <p className="text-sm font-semibold text-indigo-200 mb-5 text-center">Host earnings comparison</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-xl bg-white/10 px-4 py-3">
                  <span className="text-sm text-indigo-100">Other platforms</span>
                  <span className="font-bold text-red-300">− 3% to 15%</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-white px-4 py-3">
                  <span className="text-sm font-semibold text-neutral-900">Journey Stay</span>
                  <span className="font-black text-brand text-lg">0%</span>
                </div>
              </div>
              <button
                onClick={handleGetStarted}
                className="mt-5 w-full rounded-xl bg-white px-6 py-3 text-sm font-bold text-brand hover:bg-neutral-50 transition shadow-lg"
              >
                Start earning for free →
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex-1"
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-6">See how much you could earn</h2>
              <p className="text-lg text-neutral-600 mb-8">
                Hosts in your area typically earn{' '}
                <span className="font-semibold text-neutral-900">$2,500 - $4,500</span>
                {' '}per month. Your earnings depend on your location, listing type, and how often you host.
              </p>
              <div className="flex flex-wrap gap-4">
                <div className="rounded-xl bg-green-50 border border-green-200 px-6 py-4">
                  <p className="text-sm text-green-700 font-medium">Average nightly rate</p>
                  <p className="text-2xl font-bold text-green-800">$150</p>
                </div>
                <div className="rounded-xl bg-neutral-100 border border-neutral-200 px-6 py-4">
                  <p className="text-sm text-neutral-700 font-medium">Avg. occupancy</p>
                  <p className="text-2xl font-bold text-neutral-900">75%</p>
                </div>
                <div className="rounded-xl bg-neutral-100 border border-neutral-200 px-6 py-4">
                  <p className="text-sm text-neutral-700 font-medium">Monthly potential</p>
                  <p className="text-2xl font-bold text-neutral-900">$3,375</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex-1 w-full"
            >
              <div className="rounded-3xl bg-neutral-900 p-8 text-white">
                <h3 className="text-2xl font-bold mb-4">Ready to start earning?</h3>
                <p className="text-white/80 mb-6">
                  It only takes 10 minutes to set up your listing. We'll guide you through every step.
                </p>
                <button
                  onClick={handleGetStarted}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-base font-semibold text-neutral-900 shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-70"
                >
                  Start hosting
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-neutral-50">
        <div className="max-w-3xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-neutral-900">Common questions</h2>
          </motion.div>

          <div className="space-y-4">
            {FAQS.map((faq, idx) => (
              <motion.details
                key={faq.q}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                className="group rounded-xl bg-white border border-neutral-200 overflow-hidden"
              >
                <summary className="flex items-center justify-between cursor-pointer p-6 font-semibold text-neutral-900">
                  {faq.q}
                  <ChevronRight className="h-5 w-5 text-neutral-400 transition-transform group-open:rotate-90" />
                </summary>
                <div className="px-6 pb-6 text-neutral-600">{faq.a}</div>
              </motion.details>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-neutral-900 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">Start your hosting journey today</h2>
            <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
              Join our community of hosts and start earning from your extra space. Setup takes less than 10 minutes.
            </p>
            <button
              onClick={handleGetStarted}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-lg font-semibold text-neutral-900 shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-70"
            >
              Get started
              <ChevronRight className="h-5 w-5" />
            </button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
