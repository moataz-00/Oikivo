'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, X, Shield, Sparkles, Zap, AlertTriangle } from 'lucide-react';
import { adminApi } from '@/lib/api';
import toast from 'react-hot-toast';

interface Amenity {
  id: number;
  name: string;
  nameAr: string;
  icon: string;
  category: 'essential' | 'standout' | 'safety';
  sortOrder: number;
}

const CATEGORY_CONFIG = {
  essential: { label: 'Essential', color: 'bg-blue-900/40 text-blue-400', Icon: Zap },
  standout: { label: 'Standout', color: 'bg-violet-900/40 text-violet-400', Icon: Sparkles },
  safety: { label: 'Safety', color: 'bg-emerald-900/40 text-emerald-400', Icon: Shield },
};

export default function AmenitiesPage() {
  const qc = useQueryClient();
  const { data: amenities = [], isLoading } = useQuery<Amenity[]>({
    queryKey: ['admin-amenities'],
    queryFn: adminApi.getAmenities,
  });

  const [modal, setModal] = useState<{ mode: 'create' | 'edit'; amenity?: Amenity } | null>(null);
  const [form, setForm] = useState({ name: '', nameAr: '', icon: '', category: 'essential' as Amenity['category'], sortOrder: 0 });
  const [filterCat, setFilterCat] = useState<string>('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const createMut = useMutation({
    mutationFn: (data: typeof form) => adminApi.createAmenity(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-amenities'] }); setModal(null); toast.success('Amenity created'); },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to create amenity'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: typeof form }) => adminApi.updateAmenity(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-amenities'] }); setModal(null); toast.success('Amenity updated'); },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to update amenity'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => adminApi.deleteAmenity(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-amenities'] }); setDeleteConfirmId(null); toast.success('Amenity deleted'); },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to delete amenity'),
  });

  const openCreate = () => {
    const maxOrder = amenities.length > 0 ? Math.max(...amenities.map((a) => a.sortOrder)) + 1 : 0;
    setForm({ name: '', nameAr: '', icon: '', category: 'essential', sortOrder: maxOrder });
    setModal({ mode: 'create' });
  };

  const openEdit = (a: Amenity) => {
    setForm({ name: a.name, nameAr: a.nameAr || '', icon: a.icon || '', category: a.category, sortOrder: a.sortOrder ?? 0 });
    setModal({ mode: 'edit', amenity: a });
  };

  const handleSave = () => {
    if (modal?.mode === 'create') createMut.mutate(form);
    else if (modal?.mode === 'edit' && modal.amenity) updateMut.mutate({ id: modal.amenity.id, data: form });
  };

  const filtered = filterCat === 'all' ? amenities : amenities.filter(a => a.category === filterCat);
  const grouped = ['essential', 'standout', 'safety'].map(cat => ({
    cat: cat as keyof typeof CATEGORY_CONFIG,
    items: filtered.filter(a => a.category === cat).sort((a, b) => a.sortOrder - b.sortOrder),
  })).filter(g => g.items.length > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Amenities</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{amenities.length} amenities across 3 categories</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors">
          <Plus className="h-4 w-4" />Add Amenity
        </button>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2">
        {[{ key: 'all', label: 'All' }, ...Object.entries(CATEGORY_CONFIG).map(([key, { label }]) => ({ key, label }))].map(f => (
          <button key={f.key} onClick={() => setFilterCat(f.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterCat === f.key ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-200'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48"><div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-500 border-t-transparent" /></div>
      ) : grouped.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">No amenities found</p>
          <button onClick={openCreate} className="mt-3 text-sm text-indigo-400 hover:text-indigo-300">Add your first amenity</button>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(({ cat, items }) => {
            const { label, color, Icon } = CATEGORY_CONFIG[cat];
            return (
              <div key={cat}>
                <div className="flex items-center gap-2 mb-3">
                  <Icon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>{label}</span>
                  <span className="text-xs text-gray-500">({items.length})</span>
                </div>
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-800">
                        <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase w-16">Icon</th>
                        <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase">Name (AR)</th>
                        <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase w-20">Order</th>
                        <th className="text-right p-3 text-xs font-medium text-gray-500 uppercase w-24">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map(a => (
                        <tr key={a.id} className="border-b border-gray-200/50 dark:border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                          <td className="p-3 text-xl">{a.icon || '✨'}</td>
                          <td className="p-3 text-gray-900 dark:text-white font-medium">{a.name}</td>
                          <td className="p-3 text-gray-600 dark:text-gray-300" dir="rtl">{a.nameAr || '—'}</td>
                          <td className="p-3 text-gray-500 dark:text-gray-400">{a.sortOrder}</td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => openEdit(a)} className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button onClick={() => setDeleteConfirmId(a.id)} className="p-1.5 rounded-lg hover:bg-red-900/30 text-gray-500 dark:text-gray-400 hover:text-red-400 transition-colors">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteConfirmId !== null && (() => {
        const amenity = amenities.find((a) => a.id === deleteConfirmId);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-900/40">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">Delete Amenity</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">This action cannot be undone.</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-5">Are you sure you want to delete <span className="font-medium text-gray-900 dark:text-white">"{amenity?.name}"</span>?</p>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setDeleteConfirmId(null)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white text-sm rounded-lg transition-colors">Cancel</button>
                <button
                  onClick={() => deleteMut.mutate(deleteConfirmId)}
                  disabled={deleteMut.isPending}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg disabled:opacity-50 transition-colors"
                >
                  {deleteMut.isPending ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Create/Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{modal.mode === 'create' ? 'New Amenity' : 'Edit Amenity'}</h3>
              <button onClick={() => setModal(null)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="text-xs text-gray-500">Icon</label>
                  <input value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} placeholder="🛁" className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-3 py-2 text-gray-900 dark:text-white mt-1 text-center text-xl" />                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {['\uD83D\uDEC1','\uD83D\uDEBF','\uD83D\uDEBE','\u2744\uFE0F','\uD83D\uDD25','\uD83D\uDCFA','\uD83D\uDCF6','\uD83D\uDE97','\uD83D\uDC36','\uD83C\uDFCA','\uD83C\uDFCB\uFE0F','\uD83C\uDFB8','\u2615','\uD83D\uDD11','\uD83D\uDEB0','\uD83E\uDDF9','\uD83D\uDCA1','\uD83E\uDD37','\uD83C\uDF33','\uD83D\uDCBB'].map((e) => (
                      <button key={e} type="button" onClick={() => setForm(f => ({ ...f, icon: e }))} className="text-base leading-none hover:bg-gray-200 dark:hover:bg-gray-700 rounded p-0.5 transition-colors" title={e}>{e}</button>
                    ))}
                  </div>                </div>
                <div className="col-span-3">
                  <label className="text-xs text-gray-500">Name (EN)</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Amenity name" className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-3 py-2 text-gray-900 dark:text-white text-sm mt-1" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500">Name (AR)</label>
                <input value={form.nameAr} onChange={e => setForm(f => ({ ...f, nameAr: e.target.value }))} placeholder="اسم المرفق" dir="rtl" className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-3 py-2 text-gray-900 dark:text-white text-sm mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500">Category</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as Amenity['category'] }))} className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-3 py-2 text-gray-900 dark:text-white text-sm mt-1">
                    <option value="essential">Essential</option>
                    <option value="standout">Standout</option>
                    <option value="safety">Safety</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Sort Order</label>
                  <input type="number" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))} className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-3 py-2 text-gray-900 dark:text-white text-sm mt-1" />
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-6">
              <button onClick={() => setModal(null)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white text-sm rounded-lg">Cancel</button>
              <button onClick={handleSave} disabled={!form.name.trim() || createMut.isPending || updateMut.isPending} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg disabled:opacity-50">
                {modal.mode === 'create' ? 'Create' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
