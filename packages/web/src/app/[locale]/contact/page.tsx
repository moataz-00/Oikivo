'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, MessageSquare, Clock } from 'lucide-react';
import { toast } from '@/components/ui/Toast';

export default function ContactPage() {
  const locale = useLocale();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast.error('Please fill in all required fields.');
      return;
    }
    setSending(true);
    // Simulate sending (replace with real API call if needed)
    await new Promise((r) => setTimeout(r, 1000));
    setSending(false);
    toast.success("Message sent! We'll get back to you within 24 hours.");
    setForm({ name: '', email: '', subject: '', message: '' });
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const } },
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 px-4 py-16">
        <motion.div
          initial="hidden" animate="show" variants={fadeUp}
          className="mx-auto max-w-6xl text-center"
        >
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 mb-5">
            <Mail className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">Get in touch</h1>
          <p className="text-indigo-100 text-lg max-w-xl mx-auto">
            Have a question or need help? Our team is here for you — we typically respond within 24 hours.
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-xs text-indigo-200 font-medium">Usually online · 9am – 6pm EGT</span>
          </div>
        </motion.div>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-14">

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        {/* Left info panel */}
        <motion.div
          initial="hidden" animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.09 } } }}
          className="lg:col-span-2 space-y-5"
        >
          {[
            { icon: Mail, title: 'Email us', value: 'oikivo.support@gmail.com', sub: 'Mon–Fri, 9am–6pm' },
            { icon: Phone, title: 'Call us', value: '+20 100 000 0000', sub: 'Mon–Fri, 9am–6pm' },
            { icon: MapPin, title: 'Visit us', value: 'Cairo, Egypt', sub: 'By appointment only' },
            { icon: Clock, title: 'Response time', value: 'Within 24 hours', sub: 'For general inquiries' },
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

          {/* Live chat note */}
          <motion.div
            variants={fadeUp}
            className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5 flex items-start gap-4"
          >
            <MessageSquare className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-neutral-900 text-sm">Live chat</p>
              <p className="text-xs text-neutral-600 mt-0.5 leading-relaxed">
                Need immediate help? Use the chat widget at the bottom-right corner of the screen.
              </p>
            </div>
          </motion.div>
        </motion.div>

        {/* Right form */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="lg:col-span-3"
        >
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-neutral-200 bg-white p-7 sm:p-9 space-y-5"
          >
            <h2 className="text-xl font-semibold text-neutral-900">Send a message</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Your name"
                  required
                  className="w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="you@example.com"
                  required
                  className="w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Subject</label>
              <input
                type="text"
                value={form.subject}
                onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                placeholder="What is this about?"
                className="w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                placeholder="Describe your question or issue in detail…"
                rows={6}
                required
                className="w-full resize-none rounded-xl border border-neutral-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors"
            >
              {sending ? (
                <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {sending ? 'Sending…' : 'Send message'}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
    </div>
  );
}
