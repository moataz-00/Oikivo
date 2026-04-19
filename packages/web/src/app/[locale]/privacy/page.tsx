'use client';

import { FadeIn } from '@/components/ui/Motion';
import {
  Lock, Database, CheckCircle2, Share, Settings,
  Shield, UserCog, Mail,
} from 'lucide-react';

const sections = [
  { id: 'collect', label: 'Data We Collect', icon: Database, iconBg: 'bg-blue-50 text-blue-600' },
  { id: 'use', label: 'How We Use It', icon: CheckCircle2, iconBg: 'bg-emerald-50 text-emerald-600' },
  { id: 'share', label: 'Sharing Your Data', icon: Share, iconBg: 'bg-violet-50 text-violet-600' },
  { id: 'cookies', label: 'Cookies', icon: Settings, iconBg: 'bg-amber-50 text-amber-600' },
  { id: 'security', label: 'Security', icon: Shield, iconBg: 'bg-teal-50 text-teal-600' },
  { id: 'rights', label: 'Your Rights', icon: UserCog, iconBg: 'bg-orange-50 text-orange-600' },
  { id: 'contact', label: 'Contact Us', icon: Mail, iconBg: 'bg-sky-50 text-sky-600' },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <FadeIn>
        <section className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 px-4 py-16">
          <div className="mx-auto max-w-5xl flex items-start gap-5">
            <div className="hidden sm:flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15">
              <Lock className="h-7 w-7 text-white" />
            </div>
            <div>
              <span className="inline-block text-xs font-semibold text-indigo-200 uppercase tracking-widest mb-3">Legal</span>
              <h1 className="font-display font-bold text-4xl text-white mb-3">Privacy Policy</h1>
              <p className="text-indigo-100 text-sm max-w-xl leading-relaxed">
                How Oikivo collects, uses, and protects your personal information.
              </p>
              <div className="flex flex-wrap gap-2 mt-5">
                {['We never sell your data', 'Encrypted storage', 'Last updated Mar 2026'].map((chip) => (
                  <span key={chip} className="rounded-full bg-white/15 px-3 py-1 text-xs text-white border border-white/20">{chip}</span>
                ))}
              </div>
            </div>
          </div>
        </section>
      </FadeIn>

      {/* Content */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex gap-12">
          {/* Sticky TOC */}
          <aside className="hidden lg:block w-60 shrink-0">
            <div className="sticky top-28">
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-4">Contents</p>
              <nav className="space-y-0.5">
                {sections.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-neutral-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors group"
                  >
                    <span className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md ${item.iconBg}`}>
                      <item.icon className="h-3 w-3" />
                    </span>
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main content */}
          <FadeIn className="flex-1 min-w-0">
            {/* Callout */}
            <div className="mb-10 rounded-xl bg-indigo-50 border border-indigo-100 px-5 py-4 flex items-start gap-3">
              <Shield className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-indigo-900">Your data stays with Oikivo</p>
                <p className="text-sm text-indigo-700 mt-0.5">We do not and will never sell your personal data to third parties.</p>
              </div>
            </div>

            <div className="space-y-10 text-neutral-600 text-sm leading-relaxed">
              <p>
                At Oikivo, privacy is foundational. This policy explains how we collect, use, share, and protect your information when you use our platform.
              </p>

              <section id="collect" className="scroll-mt-28">
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shrink-0">
                    <Database className="h-4 w-4" />
                  </span>
                  <h2 className="font-display font-bold text-xl text-neutral-900">Data We Collect</h2>
                </div>
                <p className="mb-3">We collect information you provide directly and information generated through your use of our platform:</p>
                <ul className="space-y-2">
                  {[
                    'Account information (name, email, phone, profile photo)',
                    'Identity verification documents (when required)',
                    'Payment information (processed securely via Stripe or InstaPay)',
                    'Communications with hosts, guests, or our support team',
                    'Reviews and ratings you submit',
                    'Search queries and browsing history on our platform',
                    'Device and usage information (IP address, browser type, OS)',
                    'Location data (when permitted by your device settings)',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </section>

              <section id="use" className="scroll-mt-28">
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
                    <CheckCircle2 className="h-4 w-4" />
                  </span>
                  <h2 className="font-display font-bold text-xl text-neutral-900">How We Use Your Information</h2>
                </div>
                <p className="mb-3">We use your information to provide, maintain, and improve our services:</p>
                <ul className="space-y-2">
                  {[
                    'Process bookings and payments',
                    'Verify your identity and prevent fraud',
                    'Communicate about your reservations and account',
                    'Personalize your search results and recommendations',
                    'Send transactional emails and service updates',
                    'Comply with legal obligations',
                    'Improve our products and develop new features',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </section>

              <section id="share" className="scroll-mt-28">
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-violet-50 text-violet-600 shrink-0">
                    <Share className="h-4 w-4" />
                  </span>
                  <h2 className="font-display font-bold text-xl text-neutral-900">Sharing Your Data</h2>
                </div>
                <p>
                  We never sell your data. We may share your information with hosts or guests to facilitate bookings, with payment processors (Stripe, InstaPay) to complete transactions, and with service providers who assist our operations under strict data-protection agreements. We may also share data to comply with legal requirements or to protect rights and safety.
                </p>
              </section>

              <section id="cookies" className="scroll-mt-28">
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600 shrink-0">
                    <Settings className="h-4 w-4" />
                  </span>
                  <h2 className="font-display font-bold text-xl text-neutral-900">Cookies</h2>
                </div>
                <p>
                  We use cookies and similar tracking technologies to operate our platform, remember your preferences, analyze usage, and enhance security. You can control cookies through your browser settings, though disabling certain cookies may affect functionality. We use three types: essential (required for the platform), functional (for personalization), and analytics (to improve our service).
                </p>
              </section>

              <section id="security" className="scroll-mt-28">
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-teal-50 text-teal-600 shrink-0">
                    <Shield className="h-4 w-4" />
                  </span>
                  <h2 className="font-display font-bold text-xl text-neutral-900">Security</h2>
                </div>
                <p>
                  We implement industry-standard security measures including TLS/SSL encryption in transit, encrypted storage for sensitive data, multi-factor authentication options, and regular security audits. No method of transmission or storage is 100% secure, and we cannot guarantee absolute security.
                </p>
              </section>

              <section id="rights" className="scroll-mt-28">
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-orange-50 text-orange-600 shrink-0">
                    <UserCog className="h-4 w-4" />
                  </span>
                  <h2 className="font-display font-bold text-xl text-neutral-900">Your Rights</h2>
                </div>
                <p className="mb-3">Depending on your location, you may have the following rights:</p>
                <ul className="space-y-2">
                  {[
                    'Access a copy of your personal data',
                    'Correct inaccurate information',
                    'Request deletion of your account and data',
                    'Opt out of marketing communications',
                    'Data portability — receive your data in a structured format',
                    'Lodge a complaint with a data protection authority',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-orange-400 mt-1.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </section>

              <section id="contact" className="scroll-mt-28">
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-sky-600 shrink-0">
                    <Mail className="h-4 w-4" />
                  </span>
                  <h2 className="font-display font-bold text-xl text-neutral-900">Contact Us</h2>
                </div>
                <p>
                  For privacy questions or to exercise your rights, contact our Data Protection Officer at{' '}
                  <a href="mailto:privacy@journeystay.com" className="text-brand hover:underline">privacy@journeystay.com</a>.
                  We will respond within 30 days of receiving your request.
                </p>
              </section>

            </div>
          </FadeIn>
        </div>
      </div>
    </div>
  );
}
