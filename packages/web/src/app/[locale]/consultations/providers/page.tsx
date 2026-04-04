'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Search, Star, MapPin, Phone, Globe, ExternalLink, Filter,
  Wrench, Camera, Paintbrush, Home, Shield, Calculator, Scale,
} from 'lucide-react';
import { apiClient } from '@/lib/api';

const PROVIDER_CATEGORIES = [
  { value: 'cleaning', label: 'Cleaning', labelAr: 'تنظيف', icon: Wrench },
  { value: 'furnishing', label: 'Furnishing', labelAr: 'تأثيث', icon: Home },
  { value: 'photography', label: 'Photography', labelAr: 'تصوير', icon: Camera },
  { value: 'maintenance', label: 'Maintenance', labelAr: 'صيانة', icon: Wrench },
  { value: 'interior_design', label: 'Interior Design', labelAr: 'تصميم داخلي', icon: Paintbrush },
  { value: 'property_management', label: 'Property Management', labelAr: 'إدارة عقارات', icon: Home },
  { value: 'legal', label: 'Legal', labelAr: 'قانوني', icon: Scale },
  { value: 'accounting', label: 'Accounting', labelAr: 'محاسبة', icon: Calculator },
];

export default function ServiceProvidersPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const [category, setCategory] = useState('');
  const [city, setCity] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['service-providers', category, city, page],
    queryFn: () =>
      apiClient
        .get('/consultations/providers', {
          params: {
            category: category || undefined,
            city: city || undefined,
            page,
            limit: 12,
          },
        })
        .then((r) => r.data),
  });

  const providers = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-br from-indigo-600 to-purple-700 py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <h1 className="mb-4 text-4xl font-bold">
            {isAr ? 'مزودو خدمات الضيافة' : 'Hospitality Service Providers'}
          </h1>
          <p className="mx-auto max-w-xl text-indigo-100">
            {isAr
              ? 'شركات تنظيف، تأثيث، تصوير، صيانة — كل ما يحتاجه عقارك في مكان واحد'
              : 'Cleaning, furnishing, photography, maintenance — everything your property needs'}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Filters */}
        <div className="mb-8 flex flex-wrap gap-3">
          <button
            onClick={() => { setCategory(''); setPage(1); }}
            className={`rounded-full px-5 py-2 text-sm font-medium transition ${
              !category ? 'bg-indigo-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            {isAr ? 'الكل' : 'All'}
          </button>
          {PROVIDER_CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => { setCategory(c.value); setPage(1); }}
              className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition ${
                category === c.value
                  ? 'bg-indigo-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <c.icon className="h-4 w-4" />
              {isAr ? c.labelAr : c.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-2xl bg-gray-200" />
            ))}
          </div>
        ) : providers.length === 0 ? (
          <div className="py-20 text-center">
            <Wrench className="mx-auto mb-4 h-12 w-12 text-gray-300" />
            <p className="text-lg text-gray-500">
              {isAr ? 'لا يوجد مزودو خدمات حالياً' : 'No service providers found'}
            </p>
            <Link
              href={`/${locale}/consultations`}
              className="mt-4 inline-block text-sm text-indigo-500 hover:underline"
            >
              {isAr ? 'العودة للمستشارين' : 'Back to Consultants'}
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {providers.map((p: any) => (
              <div
                key={p.id}
                className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {p.logoUrl ? (
                      <img src={p.logoUrl} alt={p.name} className="h-12 w-12 rounded-lg object-cover" />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-50 text-lg font-bold text-indigo-500">
                        {p.name?.[0]}
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-gray-900">{isAr && p.nameAr ? p.nameAr : p.name}</h3>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                        {p.category?.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                  {p.isVerified && (
                    <Shield className="h-5 w-5 text-green-500" />
                  )}
                </div>

                {p.description && (
                  <p className="mb-4 line-clamp-2 text-sm text-gray-500">
                    {isAr && p.descriptionAr ? p.descriptionAr : p.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 text-xs text-gray-400">
                  {p.city && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {p.city}
                    </span>
                  )}
                  {p.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {p.phone}
                    </span>
                  )}
                  {p.website && (
                    <a href={p.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-indigo-500 hover:underline">
                      <Globe className="h-3 w-3" /> Website
                    </a>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between border-t pt-3">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span className="text-sm font-medium">{Number(p.avgRating).toFixed(1)}</span>
                    <span className="text-xs text-gray-400">({p.reviewCount})</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
