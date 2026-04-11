'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Trash2, MapPin, Bed, Bath, Users, Star, CalendarCheck, DollarSign, Eye, Sparkles, Percent, MessageSquare } from 'lucide-react';
import { adminApi, getUploadUrl } from '@/lib/api';
import toast from 'react-hot-toast';

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const propertyId = parseInt(id);

  const { data: property, isLoading } = useQuery({
    queryKey: ['admin-property', propertyId],
    queryFn: () => adminApi.getPropertyDetail(propertyId),
  });

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});

  const updateMut = useMutation({
    mutationFn: (data: Record<string, unknown>) => adminApi.updateProperty(propertyId, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-property', propertyId] }); setEditing(false); },
  });

  const deleteMut = useMutation({
    mutationFn: () => adminApi.deleteProperty(propertyId),
    onSuccess: () => router.push('/properties'),
  });

  const statusMut = useMutation({
    mutationFn: (status: string) => adminApi.updatePropertyStatus(propertyId, status as any),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-property', propertyId] }),
  });

  const featuredMut = useMutation({
    mutationFn: () => adminApi.toggleFeatured(propertyId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-property', propertyId] }),
  });

  const [commissionEdit, setCommissionEdit] = useState(false);
  const [commissionVal, setCommissionVal] = useState('');
  const commissionMut = useMutation({
    mutationFn: (percent: number) => adminApi.updateCommission(propertyId, percent),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-property', propertyId] }); setCommissionEdit(false); },
  });

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-500 border-t-transparent" /></div>;
  if (!property) return <div className="text-gray-400 text-center py-20">Property not found</div>;

  const startEdit = () => {
    setForm({
      title: property.title ?? '',
      description: property.description ?? '',
      pricePerNight: property.pricePerNight ?? '',
      cleaningFee: property.cleaningFee ?? 0,
      maxGuests: property.maxGuests ?? 1,
      bedrooms: property.bedrooms ?? 0,
      bathrooms: property.bathrooms ?? 1,
      beds: property.beds ?? 1,
      minNights: property.minNights ?? 1,
      maxNights: property.maxNights ?? 365,
      city: property.city ?? '',
      country: property.country ?? '',
      cancellationPolicy: property.cancellationPolicy ?? 'flexible',
    });
    setEditing(true);
  };

  const saveEdit = () => updateMut.mutate({
    ...form,
    pricePerNight: parseFloat(form.pricePerNight) || null,
    cleaningFee: parseFloat(form.cleaningFee) || 0,
    maxGuests: parseInt(form.maxGuests) || 1,
    bedrooms: parseInt(form.bedrooms) || 0,
    bathrooms: parseFloat(form.bathrooms) || 1,
    beds: parseInt(form.beds) || 1,
    minNights: parseInt(form.minNights) || 1,
    maxNights: parseInt(form.maxNights) || 365,
  });

  const statusColor = (s: string) => s === 'published' ? 'bg-emerald-900/40 text-emerald-400' : s === 'draft' ? 'bg-yellow-900/40 text-yellow-400' : s === 'archived' ? 'bg-gray-700 text-gray-400' : 'bg-blue-900/40 text-blue-400';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.push('/properties')} className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-white truncate">{property.title}</h1>
          <p className="text-sm text-gray-400 flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5" />{property.city}, {property.country} · <span className={`px-2 py-0.5 rounded-full text-xs ${statusColor(property.status)}`}>{property.status}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!editing && <button onClick={startEdit} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors">Edit</button>}
          {editing && <button onClick={saveEdit} disabled={updateMut.isPending} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"><Save className="h-4 w-4" />Save</button>}
          {editing && <button onClick={() => setEditing(false)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm">Cancel</button>}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Bookings', value: property.stats?.bookingCount ?? 0, icon: CalendarCheck, color: 'text-blue-400' },
          { label: 'Revenue', value: `${(property.stats?.totalRevenue ?? 0).toLocaleString()} EGP`, icon: DollarSign, color: 'text-emerald-400' },
          { label: 'Avg Rating', value: Number(property.avgRating || 0).toFixed(1), icon: Star, color: 'text-yellow-400' },
          { label: 'Reviews', value: property.reviewCount ?? 0, icon: Star, color: 'text-violet-400' },
          { label: 'Views', value: property.viewCount ?? 0, icon: Eye, color: 'text-gray-400' },
        ].map(s => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1"><s.icon className={`h-4 w-4 ${s.color}`} /><span className="text-xs text-gray-500 uppercase tracking-wide">{s.label}</span></div>
            <p className="text-xl font-bold text-white">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Photos */}
      {property.photos?.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-3">Photos ({property.photos.length})</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {property.photos.map((p: any, i: number) => (
              <img key={p.id ?? i} src={getUploadUrl(p.url)} alt="" className="w-full h-28 object-cover rounded-lg border border-gray-700" />
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Details */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">Property Details</h2>

          {editing ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 uppercase">Title</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm mt-1" />
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={4} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm mt-1" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  ['pricePerNight', 'Price/Night (EGP)'],
                  ['cleaningFee', 'Cleaning Fee'],
                  ['maxGuests', 'Max Guests'],
                  ['bedrooms', 'Bedrooms'],
                  ['bathrooms', 'Bathrooms'],
                  ['beds', 'Beds'],
                  ['minNights', 'Min Nights'],
                  ['maxNights', 'Max Nights'],
                  ['city', 'City'],
                  ['country', 'Country'],
                ].map(([key, label]) => (
                  <div key={key}>
                    <label className="text-xs text-gray-500">{label}</label>
                    <input value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm mt-1" />
                  </div>
                ))}
                <div>
                  <label className="text-xs text-gray-500">Cancellation Policy</label>
                  <select value={form.cancellationPolicy} onChange={e => setForm(f => ({ ...f, cancellationPolicy: e.target.value }))} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm mt-1">
                    <option value="flexible">Flexible</option>
                    <option value="moderate">Moderate</option>
                    <option value="strict">Strict</option>
                  </select>
                </div>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-300">{property.description || '—'}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                {[
                  ['Space Type', property.spaceType?.replace(/_/g, ' ')],
                  ['Property Kind', property.propertyKind],
                  ['Price/Night', property.pricePerNight ? `${Number(property.pricePerNight).toLocaleString()} ${property.currency}` : '—'],
                  ['Cleaning Fee', `${Number(property.cleaningFee || 0).toLocaleString()} ${property.currency}`],
                  ['Security Deposit', `${Number(property.securityDeposit || 0).toLocaleString()} ${property.currency}`],
                  ['Cancellation', property.cancellationPolicy],
                  ['Booking Mode', property.bookingMode?.replace(/_/g, ' ')],
                ].map(([label, value]) => (
                  <div key={label}>
                    <label className="text-xs text-gray-500 uppercase">{label}</label>
                    <p className="text-sm text-white mt-0.5 capitalize">{value}</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-4 pt-2 text-sm text-gray-300">
                <span className="flex items-center gap-1"><Bed className="h-4 w-4 text-gray-500" />{property.bedrooms} bed · {property.beds} beds</span>
                <span className="flex items-center gap-1"><Bath className="h-4 w-4 text-gray-500" />{property.bathrooms} bath</span>
                <span className="flex items-center gap-1"><Users className="h-4 w-4 text-gray-500" />Max {property.maxGuests} guests</span>
              </div>
            </>
          )}

          {/* Amenities */}
          {property.amenities?.length > 0 && (
            <div className="pt-3">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Amenities</h3>
              <div className="flex flex-wrap gap-2">
                {property.amenities.map((a: any) => (
                  <span key={a.id} className="px-2.5 py-1 text-xs bg-gray-800 text-gray-300 rounded-full">{a.icon} {a.name}</span>
                ))}
              </div>
            </div>
          )}

          {/* House Rules */}
          {property.houseRules?.length > 0 && (
            <div className="pt-3">
              <h3 className="text-sm font-medium text-gray-400 mb-2">House Rules</h3>
              <ul className="space-y-1">
                {property.houseRules.map((r: any, i: number) => (
                  <li key={i} className="text-sm text-gray-300">• {r.rule || r.ruleEn || r.text}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Actions + Host + Meta */}
        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-3">
            <h2 className="text-lg font-semibold text-white mb-2">Status Actions</h2>
            {['published', 'draft', 'archived'].map(s => (
              <button key={s} onClick={() => statusMut.mutate(s)} disabled={property.status === s || statusMut.isPending}
                className={`w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-colors capitalize disabled:opacity-30 ${property.status === s ? 'bg-indigo-600 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'}`}>
                {s === 'published' ? '✅ Publish' : s === 'draft' ? '📝 Draft' : '📦 Archive'}
              </button>
            ))}
            <button onClick={() => { if (confirm('Delete this property permanently?')) deleteMut.mutate(); }} disabled={deleteMut.isPending} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-900/20 hover:bg-red-900/40 rounded-lg text-sm text-red-400 transition-colors disabled:opacity-50">
              <Trash2 className="h-4 w-4" />Delete Property
            </button>
          </div>

          {/* Featured & Commission */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-3">
            <h2 className="text-lg font-semibold text-white mb-2">Promotion</h2>
            <button onClick={() => featuredMut.mutate()} disabled={featuredMut.isPending} className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${(property as any).isFeatured ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'}`}>
              <Sparkles className="h-4 w-4" />{(property as any).isFeatured ? '★ Featured' : 'Mark as Featured'}
            </button>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500 uppercase flex items-center gap-1"><Percent className="h-3 w-3" />Commission</span>
                {!commissionEdit && <button onClick={() => { setCommissionVal(String(property.serviceFeePercent ?? 14)); setCommissionEdit(true); }} className="text-xs text-indigo-400 hover:text-indigo-300">Edit</button>}
              </div>
              {commissionEdit ? (
                <div className="flex gap-2">
                  <input type="number" step="0.5" min="0" max="100" value={commissionVal} onChange={e => setCommissionVal(e.target.value)} className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-white text-sm" />
                  <button onClick={() => commissionMut.mutate(parseFloat(commissionVal))} disabled={commissionMut.isPending} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded disabled:opacity-50">Save</button>
                  <button onClick={() => setCommissionEdit(false)} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded">×</button>
                </div>
              ) : (
                <p className="text-sm text-white font-medium">{Number(property.serviceFeePercent ?? 14).toFixed(1)}%</p>
              )}
            </div>
          </div>

          {/* Host */}
          {property.host && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-3">Host</h2>
              <div onClick={() => router.push(`/users/${property.host.id}`)} className="flex items-center gap-3 cursor-pointer hover:bg-gray-800/50 rounded-lg p-2 -m-2 transition-colors">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center text-sm font-bold text-white">
                  {property.host.firstName?.[0]}{property.host.lastName?.[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{property.host.firstName} {property.host.lastName}</p>
                  <p className="text-xs text-gray-500">{property.host.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-2">
            <h2 className="text-lg font-semibold text-white mb-2">Metadata</h2>
            {[
              ['ID', `#${property.id}`],
              ['UUID', property.uuid],
              ['Category', property.category?.name || '—'],
              ['Check-in', property.checkInAfter],
              ['Check-out', property.checkOutBefore],
              ['Min/Max Nights', `${property.minNights} – ${property.maxNights}`],
              ['Pets', property.allowsPets ? 'Yes' : 'No'],
              ['Smoking', property.allowsSmoking ? 'Yes' : 'No'],
              ['Parties', property.allowsParties ? 'Yes' : 'No'],
              ['Created', new Date(property.createdAt).toLocaleString()],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-gray-500">{label}</span>
                <span className="text-white text-right truncate ml-2 max-w-[180px]">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Admin Notes / Change Requests */}
      <AdminNotesSection propertyId={propertyId} currentNote={(property as any).adminNote} onSaved={() => qc.invalidateQueries({ queryKey: ['admin-property', propertyId] })} />

      {/* Reviews */}
      {property.reviews?.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Reviews ({property.reviews.length})</h2>
          <div className="space-y-3">
            {property.reviews.slice(0, 10).map((r: any) => (
              <div key={r.id} className="border-b border-gray-800/50 pb-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-yellow-400 text-sm">{'★'.repeat(r.overallRating || r.rating || 0)}</span>
                  <span className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-gray-300">{r.comment || '—'}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AdminNotesSection({ propertyId, currentNote, onSaved }: { propertyId: number; currentNote?: string; onSaved: () => void }) {
  const [note, setNote] = useState(currentNote ?? '');
  const [editing, setEditing] = useState(false);

  const saveMut = useMutation({
    mutationFn: () => adminApi.updateProperty(propertyId, { adminNote: note } as any),
    onSuccess: () => { onSaved(); setEditing(false); toast.success('Note saved'); },
    onError: () => toast.error('Failed to save note'),
  });

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-amber-400" />
          <h2 className="text-lg font-semibold text-white">Admin Notes / Change Requests</h2>
        </div>
        {!editing && (
          <button onClick={() => { setNote(currentNote ?? ''); setEditing(true); }} className="text-xs text-indigo-400 hover:text-indigo-300">
            {currentNote ? 'Edit' : 'Add Note'}
          </button>
        )}
      </div>
      {editing ? (
        <div className="space-y-2">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            placeholder="Add admin notes, change request details, or internal flags…"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <div className="flex gap-2">
            <button onClick={() => saveMut.mutate()} disabled={saveMut.isPending} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded-lg transition-colors disabled:opacity-50">
              <Save className="h-3.5 w-3.5" /> Save
            </button>
            <button onClick={() => setEditing(false)} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded-lg">Cancel</button>
          </div>
        </div>
      ) : currentNote ? (
        <p className="text-sm text-gray-300 whitespace-pre-wrap">{currentNote}</p>
      ) : (
        <p className="text-sm text-gray-500 italic">No admin notes yet</p>
      )}
    </div>
  );
}
