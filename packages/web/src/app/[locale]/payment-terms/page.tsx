'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { FadeIn } from '@/components/ui/Motion';
import {
  CreditCard, Wallet, Percent, DollarSign, RefreshCw,
  AlertCircle, Globe, FileText, Shield, Mail,
} from 'lucide-react';

const sections = [
  { id: 'overview', label: 'Payment Overview', icon: CreditCard, iconBg: 'bg-blue-50 text-blue-600' },
  { id: 'methods', label: 'Payment Methods', icon: Wallet, iconBg: 'bg-emerald-50 text-emerald-600' },
  { id: 'fees', label: 'Fees & Charges', icon: Percent, iconBg: 'bg-amber-50 text-amber-600' },
  { id: 'payouts', label: 'Host Payouts', icon: DollarSign, iconBg: 'bg-violet-50 text-violet-600' },
  { id: 'refunds', label: 'Refunds', icon: RefreshCw, iconBg: 'bg-teal-50 text-teal-600' },
  { id: 'disputes', label: 'Payment Disputes', icon: AlertCircle, iconBg: 'bg-red-50 text-red-600' },
  { id: 'currency', label: 'Currency', icon: Globe, iconBg: 'bg-orange-50 text-orange-600' },
  { id: 'taxes', label: 'Taxes', icon: FileText, iconBg: 'bg-neutral-100 text-neutral-600' },
  { id: 'security', label: 'Security', icon: Shield, iconBg: 'bg-sky-50 text-sky-600' },
];

export default function PaymentTermsPage() {
  const locale = useLocale();

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <FadeIn>
        <section className="bg-neutral-900 px-4 py-16">
          <div className="mx-auto max-w-5xl flex items-start gap-5">
            <div className="hidden sm:flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10">
              <CreditCard className="h-7 w-7 text-white" />
            </div>
            <div>
              <span className="inline-block text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-3">Legal</span>
              <h1 className="font-display font-bold text-4xl text-white mb-3">Payments Terms of Service</h1>
              <p className="text-neutral-400 text-sm max-w-xl leading-relaxed">
                These terms govern all payment transactions on Oikivo, including booking charges, host payouts, and refunds.
              </p>
              <div className="flex flex-wrap gap-2 mt-5">
                {['EGP base currency', '5% guest service fee', '5% host commission', '1-day host payout', 'Last updated Apr 2026'].map((chip) => (
                  <span key={chip} className="rounded-full bg-white/10 px-3 py-1 text-xs text-neutral-300">{chip}</span>
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
                    className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-neutral-500 hover:text-brand hover:bg-neutral-50 transition-colors group"
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

          {/* Body */}
          <FadeIn className="flex-1 min-w-0">
            <div className="space-y-10 text-neutral-600 text-sm leading-relaxed">

              <section id="overview" className="scroll-mt-28">
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shrink-0">
                    <CreditCard className="h-4 w-4" />
                  </span>
                  <h2 className="font-display font-bold text-xl text-neutral-900">1. Payment Overview</h2>
                </div>
                <p>
                  Oikivo operates as a payment intermediary between guests and hosts. When you make a booking, your payment is collected by Oikivo and held securely until the stay begins, at which point funds are released to the host minus applicable service fees.
                </p>
              </section>

              <section id="methods" className="scroll-mt-28">
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
                    <Wallet className="h-4 w-4" />
                  </span>
                  <h2 className="font-display font-bold text-xl text-neutral-900">2. Payment Methods</h2>
                </div>
                <p className="mb-4">Oikivo supports the following payment methods:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  {[
                    { name: 'Visa / Mastercard / Meeza', note: 'Processed securely via Stripe', emoji: '💳' },
                    { name: 'Apple Pay', note: 'Available on Safari & iOS devices', emoji: '🍎' },
                    { name: 'Google Pay', note: 'Available on Chrome & Android', emoji: '🔵' },
                    { name: 'InstaPay', note: 'Egypt only — instant bank transfer', emoji: '⚡' },
                  ].map((method) => (
                    <div key={method.name} className="flex items-start gap-3 rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3">
                      <span className="text-xl leading-none mt-0.5">{method.emoji}</span>
                      <div>
                        <p className="text-sm font-semibold text-neutral-900">{method.name}</p>
                        <p className="text-xs text-neutral-500 mt-0.5">{method.note}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p>By submitting a payment, you authorize Oikivo to charge the full booking amount using your selected payment method.</p>
              </section>

              <section id="fees" className="scroll-mt-28">
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600 shrink-0">
                    <Percent className="h-4 w-4" />
                  </span>
                  <h2 className="font-display font-bold text-xl text-neutral-900">3. Fees & Charges</h2>
                </div>
                <p className="mb-3">The total booking cost includes:</p>
                <ul className="space-y-2">
                  {[
                    { label: 'Nightly rate', desc: 'Set by the host' },
                    { label: 'Cleaning fee', desc: 'Set by the host (if applicable)' },
                    { label: 'Guest service fee', desc: 'Charged by Oikivo (5% of subtotal, added to your total)' },
                    { label: 'Host commission', desc: 'Deducted from host payout by Oikivo (5% of subtotal)' },
                    { label: 'Taxes', desc: 'Applicable government taxes based on property location' },
                  ].map((fee) => (
                    <li key={fee.label} className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                      <span><strong className="text-neutral-800">{fee.label}</strong> — {fee.desc}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section id="payouts" className="scroll-mt-28">
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-violet-50 text-violet-600 shrink-0">
                    <DollarSign className="h-4 w-4" />
                  </span>
                  <h2 className="font-display font-bold text-xl text-neutral-900">4. Host Payouts</h2>
                </div>
                <div className="rounded-xl bg-violet-50 border border-violet-100 px-4 py-3 mb-3">
                  <p className="text-sm font-semibold text-violet-900">Payouts become available 1 day after guest checkout.</p>
                </div>
                <p className="mb-3">
                  Hosts may request payouts via InstaPay, bank transfer, or cash. Oikivo deducts a platform fee from each completed booking before releasing funds.
                </p>
                <p>All payout requests are reviewed before processing. Typical processing time is 1–5 business days depending on the method selected.</p>
              </section>

              <section id="refunds" className="scroll-mt-28">
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-teal-50 text-teal-600 shrink-0">
                    <RefreshCw className="h-4 w-4" />
                  </span>
                  <h2 className="font-display font-bold text-xl text-neutral-900">5. Refunds</h2>
                </div>
                <p className="mb-4">Refund eligibility depends on the host&apos;s cancellation policy at time of booking:</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                  {[
                    {
                      label: 'Flexible',
                      labelColor: 'text-emerald-700 bg-emerald-100',
                      cardColor: 'border-emerald-200 bg-emerald-50',
                      rows: [
                        { when: '24h+ before check-in', result: '100% refund' },
                        { when: 'Within 24 hours', result: '50% refund' },
                      ],
                    },
                    {
                      label: 'Moderate',
                      labelColor: 'text-amber-700 bg-amber-100',
                      cardColor: 'border-amber-200 bg-amber-50',
                      rows: [
                        { when: '5+ days before', result: '100% refund' },
                        { when: '2–5 days before', result: '50% refund' },
                        { when: 'Less than 2 days', result: 'No refund' },
                      ],
                    },
                    {
                      label: 'Strict',
                      labelColor: 'text-red-700 bg-red-100',
                      cardColor: 'border-red-200 bg-red-50',
                      rows: [
                        { when: '7+ days before', result: '100% refund' },
                        { when: '2–7 days before', result: '50% refund' },
                        { when: 'Less than 2 days', result: 'No refund' },
                      ],
                    },
                  ].map((tier) => (
                    <div key={tier.label} className={`rounded-xl border ${tier.cardColor} p-4`}>
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold mb-3 ${tier.labelColor}`}>{tier.label}</span>
                      <ul className="space-y-2">
                        {tier.rows.map((row) => (
                          <li key={row.when} className="text-xs">
                            <div className="text-neutral-500">{row.when}</div>
                            <div className="font-semibold text-neutral-800">{row.result}</div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                <p>Refunds are credited back via the original payment method within 5–10 business days.</p>
              </section>

              <section id="disputes" className="scroll-mt-28">
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-red-50 text-red-600 shrink-0">
                    <AlertCircle className="h-4 w-4" />
                  </span>
                  <h2 className="font-display font-bold text-xl text-neutral-900">6. Payment Disputes</h2>
                </div>
                <p className="mb-3">
                  If you believe a charge is incorrect or unauthorized, open a dispute through Oikivo within 30 days of the charge. Our resolution team will investigate and respond within 5 business days.
                </p>
                <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3">
                  <p className="text-sm text-amber-800">
                    <strong>Important:</strong> Do not initiate chargebacks with your bank before contacting Oikivo support — doing so may result in account suspension.
                  </p>
                </div>
              </section>

              <section id="currency" className="scroll-mt-28">
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-orange-50 text-orange-600 shrink-0">
                    <Globe className="h-4 w-4" />
                  </span>
                  <h2 className="font-display font-bold text-xl text-neutral-900">7. Currency</h2>
                </div>
                <p>
                  All transactions on Oikivo are processed in Egyptian Pounds (EGP) by default. Hosts set prices in EGP. Currency conversion, if applicable, is handled by your payment provider — Oikivo is not responsible for exchange rate fluctuations.
                </p>
              </section>

              <section id="taxes" className="scroll-mt-28">
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600 shrink-0">
                    <FileText className="h-4 w-4" />
                  </span>
                  <h2 className="font-display font-bold text-xl text-neutral-900">8. Taxes</h2>
                </div>
                <p>
                  Guests may be charged applicable taxes (e.g., VAT, tourism levies) based on property location. Hosts are responsible for reporting and remitting taxes on rental income as required by local law. Oikivo does not provide tax advice.
                </p>
              </section>

              <section id="security" className="scroll-mt-28">
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-sky-600 shrink-0">
                    <Shield className="h-4 w-4" />
                  </span>
                  <h2 className="font-display font-bold text-xl text-neutral-900">9. Security</h2>
                </div>
                <p className="mb-3">
                  Oikivo employs industry-standard security measures including encryption of payment data in transit and at rest.
                </p>
                <div className="rounded-xl bg-neutral-50 border border-neutral-200 px-4 py-3">
                  <p className="text-sm text-neutral-700">
                    <strong>Reminder:</strong> Never share payment credentials with anyone claiming to represent Oikivo. We will never ask for card details via message or email.
                  </p>
                </div>
              </section>

              <section className="scroll-mt-28">
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600 shrink-0">
                    <Mail className="h-4 w-4" />
                  </span>
                  <h2 className="font-display font-bold text-xl text-neutral-900">10. Contact</h2>
                </div>
                <p>
                  For payment-related inquiries, contact{' '}
                  <a href="mailto:payments@journeystay.com" className="text-brand hover:underline">payments@journeystay.com</a>.
                </p>
              </section>

            </div>
          </FadeIn>
        </div>
      </div>

      {/* Footer links */}
      <div className="border-t border-neutral-100 py-6 px-4">
        <div className="mx-auto max-w-5xl flex flex-wrap gap-4 text-xs text-neutral-400">
          <Link href={`/${locale}/terms`} className="hover:text-neutral-700 underline">Terms of Service</Link>
          <Link href={`/${locale}/privacy`} className="hover:text-neutral-700 underline">Privacy Policy</Link>
          <Link href={`/${locale}`} className="hover:text-neutral-700 underline">Home</Link>
        </div>
      </div>
    </div>
  );
}
