'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, ChevronLeft, Clock, Video, Phone, MessageSquare, Users } from 'lucide-react';
import { consultationsApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/Toast';
import { Spinner, FullPageSpinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  'listing_optimization', 'pricing_strategy', 'interior_design', 'guest_experience',
  'photography', 'superhost_coaching', 'property_management', 'legal_compliance',
  'marketing', 'revenue_management', 'general',
] as const;

const DELIVERY_MODES = ['video_call', 'in_person', 'phone', 'chat'] as const;
const DELIVERY_ICONS: Record<string, React.ElementType> = {
  video_call: Video, in_person: Users, phone: Phone, chat: MessageSquare,
};

const EMPTY_FORM = {
  title: '', titleAr: '', description: '', descriptionAr: '',
  category: 'general', durationMinutes: 60, price: 500,
  currency: 'EGP', deliveryMode: 'video_call', maxBookingsPerDay: 5,
};

export default function ConsultationServicesPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const { isLoggedIn, hasHydrated } = useAuth();
  const qc = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['my-consultation-services'],
    queryFn: () => consultationsApi.getMyServices(),
    enabled: isLoggedIn,
  });

  const createMutation = useMutation({
    mutationFn: () => consultationsApi.createService({ ...form }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-consultation-services'] });
      toast.success('Service created');
      setShowForm(false);
      setForm({ ...EMPTY_FORM });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to create service'),
  });

  const updateMutation = useMutation({
    mutationFn: () => consultationsApi.updateService(editingId!, { ...form }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-consultation-services'] });
      toast.success('Service updated');
      setEditingId(null);
      setShowForm(false);
      setForm({ ...EMPTY_FORM });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to update service'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => consultationsApi.deleteService(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-consultation-services'] });
      toast.success('Service deactivated');
    },
    onError: () => toast.error('Failed to deactivate service'),
  });

  const openEdit = (svc: any) => {
    setForm({
      title: svc.title ?? '',
      titleAr: svc.titleAr ?? '',
      description: svc.description ?? '',
      descriptionAr: svc.descriptionAr ?? '',
      category: svc.category ?? 'general',
      durationMinutes: svc.durationMinutes ?? 60,
      price: svc.price ?? 500,
      currency: svc.currency ?? 'EGP',
      deliveryMode: svc.deliveryMode ?? 'video_call',
      maxBookingsPerDay: svc.maxBookingsPerDay ?? 5,
    });
    setEditingId(svc.id);
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    if (editingId) updateMutation.mutate();
    else createMutation.mutate();
  };

  if (!hasHydrated || !isLoggedIn) return <FullPageSpinner />;

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className={cn('min-h-screen bg-gray-50', isAr && 'direction-rtl')}>
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href={`/${locale}/consultations/dashboard`}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 hover:bg-gray-50 transition-colors">
                <ChevronLeft className="h-4 w-4 text-gray-500" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {isAr ? 'خدماتي الاستشارية' : 'My Consultation Services'}
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  {isAr ? 'أنشئ وأدر حزم الاستشارات المقدمة للعملاء' : 'Create and manage the consultation packages you offer to clients'}
                </p>
              </div>
            </div>
            {!showForm && (
              <button
                onClick={() => { setForm({ ...EMPTY_FORM }); setEditingId(null); setShowForm(true); }}
                className="flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-600 transition-colors"
              >
                <Plus className="h-4 w-4" />
                {isAr ? 'خدمة جديدة' : 'New Service'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 space-y-6">
        {/* Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="rounded-2xl border border-rose-200 bg-white p-6 shadow-sm"
            >
              <h2 className="text-base font-semibold text-gray-900 mb-4">
                {editingId ? (isAr ? 'تعديل الخدمة' : 'Edit Service') : (isAr ? 'إضافة خدمة جديدة' : 'Add New Service')}
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Title (EN) *</label>
                  <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. Listing Optimization Session"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-100" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">العنوان بالعربي</label>
                  <input value={form.titleAr} onChange={(e) => setForm((f) => ({ ...f, titleAr: e.target.value }))}
                    placeholder="مثال: جلسة تحسين الإعلان"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-100 text-right" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                  <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    rows={3} placeholder="What does this service include?"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-100 resize-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                  <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-rose-400 focus:outline-none">
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Delivery Mode</label>
                  <select value={form.deliveryMode} onChange={(e) => setForm((f) => ({ ...f, deliveryMode: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-rose-400 focus:outline-none">
                    {DELIVERY_MODES.map((m) => (
                      <option key={m} value={m}>{m.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Duration (minutes)</label>
                  <input type="number" value={form.durationMinutes} min={15} max={480}
                    onChange={(e) => setForm((f) => ({ ...f, durationMinutes: Number(e.target.value) }))}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-100" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Price (EGP)</label>
                  <input type="number" value={form.price} min={0}
                    onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-100" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Max bookings/day</label>
                  <input type="number" value={form.maxBookingsPerDay} min={1} max={20}
                    onChange={(e) => setForm((f) => ({ ...f, maxBookingsPerDay: Number(e.target.value) }))}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-100" />
                </div>
              </div>
              <div className="flex gap-3 mt-5 justify-end">
                <button onClick={() => { setShowForm(false); setEditingId(null); setForm({ ...EMPTY_FORM }); }}
                  className="rounded-xl border border-gray-200 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button onClick={handleSubmit} disabled={isPending}
                  className="rounded-xl bg-rose-500 px-5 py-2 text-sm font-semibold text-white hover:bg-rose-600 disabled:opacity-50 transition-colors flex items-center gap-2">
                  {isPending && <Spinner size="sm" />}
                  {editingId ? (isAr ? 'حفظ التعديلات' : 'Save Changes') : (isAr ? 'إضافة الخدمة' : 'Add Service')}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Services list */}
        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : services.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white py-16 text-center">
            <p className="text-gray-500 text-sm mb-4">
              {isAr ? 'لا توجد خدمات بعد. أضف أول خدمة استشارية.' : 'No services yet. Add your first consultation offering.'}
            </p>
            <button onClick={() => { setForm({ ...EMPTY_FORM }); setEditingId(null); setShowForm(true); }}
              className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-600 transition-colors">
              <Plus className="h-4 w-4" />{isAr ? 'إضافة خدمة' : 'Add Service'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {services.map((svc: any) => {
              const DeliveryIcon = DELIVERY_ICONS[svc.deliveryMode] ?? Video;
              return (
                <motion.div key={svc.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className={cn('rounded-2xl border bg-white p-5 shadow-sm', !svc.isActive && 'opacity-60')}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900 text-sm">{svc.title}</h3>
                        {svc.titleAr && <span className="text-xs text-gray-400 font-medium">({svc.titleAr})</span>}
                        {!svc.isActive && (
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">Inactive</span>
                        )}
                      </div>
                      {svc.description && <p className="mt-1 text-xs text-gray-500 line-clamp-2">{svc.description}</p>}
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{svc.durationMinutes} min</span>
                        <span className="flex items-center gap-1"><DeliveryIcon className="h-3.5 w-3.5" />{(svc.deliveryMode ?? '').replace(/_/g, ' ')}</span>
                        <span className="rounded-full bg-rose-50 px-2 py-0.5 font-medium text-rose-700">
                          {svc.currency} {Number(svc.price).toLocaleString()}
                        </span>
                        <span className="rounded-full bg-gray-100 px-2 py-0.5">
                          {(svc.category ?? '').replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => openEdit(svc)}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 hover:bg-gray-50 transition-colors">
                        <Pencil className="h-3.5 w-3.5 text-gray-500" />
                      </button>
                      {svc.isActive && (
                        <button onClick={() => deleteMutation.mutate(svc.id)} disabled={deleteMutation.isPending}
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-rose-200 hover:bg-rose-50 transition-colors">
                          <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

