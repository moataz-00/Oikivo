'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { FileText, Eye, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmailTemplate {
  slug: string;
  name: string;
  category: string;
  description: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  Auth: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  Bookings: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
  Payments: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  Payouts: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  Messaging: 'bg-violet-500/10 text-violet-400 border-violet-500/30',
  Host: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
  Consultations: 'bg-pink-500/10 text-pink-400 border-pink-500/30',
};

export default function EmailTemplatesPage() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [previewSlug, setPreviewSlug] = useState<string | null>(null);

  const { data: templates, isLoading } = useQuery<EmailTemplate[]>({
    queryKey: ['admin-email-templates'],
    queryFn: () => adminApi.getEmailTemplates(),
  });

  const { data: preview, isLoading: previewLoading } = useQuery({
    queryKey: ['admin-email-template-preview', previewSlug],
    queryFn: () => adminApi.previewEmailTemplate(previewSlug!),
    enabled: !!previewSlug,
  });

  const categories = [...new Set((templates ?? []).map((t) => t.category))];

  const filtered = (templates ?? []).filter((t) => {
    if (selectedCategory && t.category !== selectedCategory) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase()) && !t.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const grouped = categories
    .filter((cat) => !selectedCategory || cat === selectedCategory)
    .map((cat) => ({
      category: cat,
      items: filtered.filter((t) => t.category === cat),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="h-6 w-6 text-indigo-400" />
            Email Templates
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Preview all {templates?.length ?? '–'} system email templates
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates…"
            className="w-full rounded-lg border border-gray-700 bg-gray-800 pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setSelectedCategory(null)}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium border transition-colors',
              !selectedCategory ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white',
            )}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium border transition-colors',
                selectedCategory === cat
                  ? CATEGORY_COLORS[cat] ?? 'bg-gray-600 text-white border-gray-500'
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white',
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Template list */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-800 bg-gray-900 p-4">
              <div className="h-4 bg-gray-800 rounded w-48 animate-pulse mb-2" />
              <div className="h-3 bg-gray-800 rounded w-80 animate-pulse" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => (
            <div key={group.category}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">{group.category}</h3>
              <div className="grid gap-2">
                {group.items.map((tpl) => (
                  <div
                    key={tpl.slug}
                    className={cn(
                      'flex items-center justify-between gap-4 rounded-xl border bg-gray-900 px-5 py-3.5 transition-colors group',
                      previewSlug === tpl.slug ? 'border-indigo-500 bg-indigo-950/20' : 'border-gray-800 hover:border-gray-700',
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-white text-sm">{tpl.name}</p>
                        <span className={cn('text-[10px] px-1.5 py-0.5 rounded border', CATEGORY_COLORS[tpl.category] ?? 'bg-gray-700 text-gray-300 border-gray-600')}>
                          {tpl.category}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{tpl.description}</p>
                    </div>
                    <button
                      onClick={() => setPreviewSlug(previewSlug === tpl.slug ? null : tpl.slug)}
                      className={cn(
                        'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors shrink-0',
                        previewSlug === tpl.slug
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white',
                      )}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      {previewSlug === tpl.slug ? 'Close' : 'Preview'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {grouped.length === 0 && (
            <div className="text-center py-12 text-gray-500 text-sm">No templates match your search.</div>
          )}
        </div>
      )}

      {/* Preview panel */}
      {previewSlug && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-indigo-400" />
                <span className="text-sm font-semibold text-white">{preview?.name ?? 'Loading…'}</span>
                {preview?.category && (
                  <span className={cn('text-[10px] px-1.5 py-0.5 rounded border', CATEGORY_COLORS[preview.category] ?? 'bg-gray-700 text-gray-300 border-gray-600')}>
                    {preview.category}
                  </span>
                )}
              </div>
              <button onClick={() => setPreviewSlug(null)} className="text-gray-400 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto bg-white">
              {previewLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="h-8 w-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : preview?.html ? (
                <iframe
                  srcDoc={preview.html}
                  title="Email Preview"
                  className="w-full h-full min-h-[500px] border-0"
                  sandbox="allow-same-origin"
                />
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500 text-sm">
                  Failed to load preview
                </div>
              )}
            </div>
            <div className="px-5 py-2.5 border-t border-gray-800 flex items-center justify-between text-xs text-gray-500">
              <span>Template: <code className="text-gray-400">{previewSlug}</code></span>
              <span>Rendered with sample data</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
