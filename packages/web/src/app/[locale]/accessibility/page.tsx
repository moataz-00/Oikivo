'use client';

import { FadeIn } from '@/components/ui/Motion';

const TOC = [
  { id: 'commitment', label: 'Our Commitment' },
  { id: 'features', label: 'Current Accessibility Features' },
  { id: 'hosts', label: 'Accessibility Details in Listings' },
  { id: 'limitations', label: 'Known Limitations' },
  { id: 'feedback', label: 'Feedback and Requests' },
  { id: 'updates', label: 'Ongoing Improvements' },
];

export default function AccessibilityPage() {
  return (
    <div className="min-h-screen bg-white">
      <FadeIn>
        <section className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 py-14 px-4">
          <div className="mx-auto max-w-5xl">
            <span className="inline-block text-xs font-semibold text-indigo-200 uppercase tracking-widest mb-3">Company</span>
            <h1 className="font-display font-bold text-4xl text-white mb-3">Accessibility Statement</h1>
            <p className="text-indigo-100 text-sm">Journey Stay is committed to making our website and booking experience usable for everyone.</p>
          </div>
        </section>
      </FadeIn>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex gap-12">
          <aside className="hidden lg:block w-56 shrink-0">
            <div className="sticky top-28">
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-4">Contents</p>
              <nav className="space-y-1">
                {TOC.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="block text-sm text-neutral-500 hover:text-indigo-600 py-1 transition-colors"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          <FadeIn className="flex-1 max-w-2xl">
            <div className="space-y-10 text-neutral-600 text-sm leading-relaxed">
              <section id="commitment" className="scroll-mt-28">
                <h2 className="font-display font-bold text-xl text-neutral-900 mb-3">1. Our Commitment</h2>
                <p>
                  We are working toward conformance with WCAG 2.1 level AA principles: perceivable, operable,
                  understandable, and robust experiences across web and mobile platforms.
                </p>
              </section>

              <section id="features" className="scroll-mt-28">
                <h2 className="font-display font-bold text-xl text-neutral-900 mb-3">2. Current Accessibility Features</h2>
                <ul className="space-y-2">
                  {[
                    'Keyboard-friendly navigation for core flows such as search and booking.',
                    'Semantic page structure with headings and landmarks.',
                    'Readable text contrast in primary interface components.',
                    'Visible focus indicators for interactive controls.',
                    'Support for RTL layout in Arabic locale.',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </section>

              <section id="hosts" className="scroll-mt-28">
                <h2 className="font-display font-bold text-xl text-neutral-900 mb-3">3. Accessibility Details in Listings</h2>
                <p>
                  Hosts are encouraged to provide accessibility information such as step-free entry,
                  elevator access, doorway widths, and bathroom accessibility features to help guests make informed decisions.
                </p>
              </section>

              <section id="limitations" className="scroll-mt-28">
                <h2 className="font-display font-bold text-xl text-neutral-900 mb-3">4. Known Limitations</h2>
                <p>
                  Some third-party integrations and user-generated content may not yet provide full accessibility support.
                  We continuously review these areas and prioritize fixes based on impact.
                </p>
              </section>

              <section id="feedback" className="scroll-mt-28">
                <h2 className="font-display font-bold text-xl text-neutral-900 mb-3">5. Feedback and Requests</h2>
                <p>
                  If you encounter any accessibility barriers, contact us through the Contact page and include the page URL,
                  issue description, and your preferred contact method.
                </p>
              </section>

              <section id="updates" className="scroll-mt-28">
                <h2 className="font-display font-bold text-xl text-neutral-900 mb-3">6. Ongoing Improvements</h2>
                <p>
                  We run recurring audits, improve component accessibility, and address critical issues as part of our regular release cycle.
                </p>
              </section>
            </div>
          </FadeIn>
        </div>
      </div>
    </div>
  );
}
