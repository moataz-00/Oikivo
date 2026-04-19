'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, X, AlertTriangle, Search } from 'lucide-react';
import { adminApi } from '@/lib/api';
import toast from 'react-hot-toast';

interface Category {
  id: number;
  name: string;
  nameAr: string;
  icon: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
}

export default function CategoriesPage() {
  const qc = useQueryClient();
  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ['admin-categories'],
    queryFn: adminApi.getCategories,
  });

  const [modal, setModal] = useState<{ mode: 'create' | 'edit'; category?: Category } | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [catSearch, setCatSearch] = useState('');
  const [form, setForm] = useState({ name: '', nameAr: '', icon: '', description: '', sortOrder: 0, isActive: true });

  const createMut = useMutation({
    mutationFn: (data: typeof form) => adminApi.createCategory(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-categories'] }); setModal(null); toast.success('Category created'); },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to create category'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: typeof form }) => adminApi.updateCategory(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-categories'] }); setModal(null); toast.success('Category updated'); },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to update category'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => adminApi.deleteCategory(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-categories'] }); setDeleteConfirmId(null); toast.success('Category deleted'); },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to delete category'),
  });

  const openCreate = () => {
    const maxOrder = categories.length > 0 ? Math.max(...categories.map((c) => c.sortOrder)) + 1 : 0;
    setForm({ name: '', nameAr: '', icon: '', description: '', sortOrder: maxOrder, isActive: true });
    setModal({ mode: 'create' });
  };

  const openEdit = (cat: Category) => {
    setForm({ name: cat.name, nameAr: cat.nameAr || '', icon: cat.icon || '', description: cat.description || '', sortOrder: cat.sortOrder ?? 0, isActive: cat.isActive });
    setModal({ mode: 'edit', category: cat });
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (!form.nameAr.trim()) { toast.error('Arabic name is required'); return; }
    const { isActive, ...payload } = form;
    if (modal?.mode === 'create') createMut.mutate(payload as any);
    else if (modal?.mode === 'edit' && modal.category) updateMut.mutate({ id: modal.category.id, data: form });
  };

  return (
    <div className="space-y-6">
      {/* Delete confirmation modal */}
      {deleteConfirmId !== null && (() => {
        const cat = categories.find((c) => c.id === deleteConfirmId);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-900/40">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">Delete Category</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">This action cannot be undone.</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-5">Are you sure you want to delete <span className="font-medium text-gray-900 dark:text-white">"{cat?.name}"</span>?</p>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setDeleteConfirmId(null)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white text-sm rounded-lg transition-colors">Cancel</button>
                <button
                  onClick={() => deleteMut.mutate(deleteConfirmId)}
                  disabled={deleteMut.isPending}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg disabled:opacity-50 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        );
      })()}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Categories</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage property categories across the platform</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors">
          <Plus className="h-4 w-4" />Add Category
        </button>
      </div>

      {/* CAT-5: Search/filter */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        <input
          value={catSearch}
          onChange={(e) => setCatSearch(e.target.value)}
          placeholder="Search categories…"
          className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 pl-9 pr-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48"><div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-500 border-t-transparent" /></div>
      ) : categories.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">No categories yet</p>
          <button onClick={openCreate} className="mt-3 text-sm text-indigo-400 hover:text-indigo-300">Create your first category</button>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase">Icon</th>
                <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase">Name (AR)</th>
                <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase">Order</th>
                <th className="text-right p-4 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {[...categories]
                .filter((cat) => {
                  if (!catSearch) return true;
                  const q = catSearch.toLowerCase();
                  return cat.name.toLowerCase().includes(q) || cat.nameAr?.toLowerCase().includes(q) || cat.description?.toLowerCase().includes(q);
                })
                .sort((a, b) => a.sortOrder - b.sortOrder).map(cat => (
                <tr key={cat.id} className="border-b border-gray-200/50 dark:border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                  <td className="p-4 text-xl">{cat.icon || '🏠'}</td>
                  <td className="p-4 text-gray-900 dark:text-white font-medium">{cat.name}</td>
                  <td className="p-4 text-gray-600 dark:text-gray-300" dir="rtl">{cat.nameAr || '—'}</td>
                  <td className="p-4 text-gray-500 dark:text-gray-400 max-w-[200px] truncate">{cat.description || '—'}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cat.isActive ? 'bg-emerald-900/40 text-emerald-400' : 'bg-red-900/40 text-red-400'}`}>
                      {cat.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-4 text-gray-500 dark:text-gray-400">{cat.sortOrder}</td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(cat)} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors" title="Edit">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => setDeleteConfirmId(cat.id)} className="p-2 rounded-lg hover:bg-red-900/30 text-gray-500 dark:text-gray-400 hover:text-red-400 transition-colors" title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{modal.mode === 'create' ? 'New Category' : 'Edit Category'}</h3>
              <button onClick={() => setModal(null)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="text-xs text-gray-500">Icon</label>
                  <input value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} placeholder="🏠" className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-3 py-2 text-gray-900 dark:text-white mt-1 text-center text-xl" />
                </div>
                <div className="col-span-3">
                  <label className="text-xs text-gray-500">Name (EN)</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Category name" className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-3 py-2 text-gray-900 dark:text-white text-sm mt-1" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500">Name (AR)</label>
                <input value={form.nameAr} onChange={e => setForm(f => ({ ...f, nameAr: e.target.value }))} placeholder="اسم الفئة" dir="rtl" className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-3 py-2 text-gray-900 dark:text-white text-sm mt-1" />
              </div>
              <div>
                <label className="text-xs text-gray-500">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="Optional description..." className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-3 py-2 text-gray-900 dark:text-white text-sm mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500">Sort Order</label>
                  <input type="number" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))} className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-3 py-2 text-gray-900 dark:text-white text-sm mt-1" />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 bg-gray-200 dark:bg-gray-700 text-indigo-600 focus:ring-indigo-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">Active</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-6">
              <button onClick={() => setModal(null)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white text-sm rounded-lg">Cancel</button>
              <button onClick={handleSave} disabled={!form.name.trim() || !form.nameAr.trim() || createMut.isPending || updateMut.isPending} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg disabled:opacity-50">
                {modal.mode === 'create' ? 'Create' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
