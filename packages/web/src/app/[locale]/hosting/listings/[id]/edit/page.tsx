'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ChevronLeft, Plus, Trash2, Save, Upload, ImageIcon, Check, Star, ArrowRightLeft, X,
} from 'lucide-react';
import Link from 'next/link';
import { propertiesApi, categoriesApi, amenitiesApi } from '@/lib/api';
import { getImageUrl } from '@/lib/utils';
import { LocationMapPicker } from '@/components/hosting/LocationMapPicker';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Spinner, FullPageSpinner } from '@/components/ui/Spinner';
import { Separator } from '@/components/ui/Separator';
import { toast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';
import type { Category, Amenity, SpaceType, PropertyKind } from '@/types';

const SPACE_TYPES: { value: SpaceType; label: string; desc: string }[] = [
  { value: 'entire_place', label: 'Entire place', desc: 'Guests have the whole place' },
  { value: 'private_room', label: 'Private room', desc: 'Guests have their own room' },
  { value: 'shared_room', label: 'Shared room', desc: 'Guests share a room' },
];

const PROPERTY_KINDS: { value: PropertyKind; label: string }[] = [
  { value: 'apartment', label: '🏢 Apartment' },
  { value: 'house', label: '🏠 House' },
  { value: 'villa', label: '🏡 Villa' },
  { value: 'cabin', label: '🏕️ Cabin' },
  { value: 'hotel', label: '🏨 Hotel' },
  { value: 'chalet', label: '🏔️ Chalet' },
  { value: 'studio', label: '🎨 Studio' },
  { value: 'loft', label: '🏗️ Loft' },
  { value: 'hotel_room', label: '🛏️ Hotel Room' },
  { value: 'bungalow', label: '🌴 Bungalow' },
  { value: 'cottage', label: '🌿 Cottage' },
  { value: 'townhouse', label: '🏘️ Townhouse' },
];

const CANCELLATION_POLICIES = [
  {
    value: 'flexible',
    label: 'Flexible',
    icon: '🟢',
    badge: 'Guest-friendly',
    color: 'emerald' as const,
    freeWindow: 'Full refund up to 24 hours before check-in',
    partialWindow: 'After that: first night non-refundable, 50% of remaining nights refunded',
    noRefund: 'No refund after check-in begins',
    bestFor: 'Best for attracting more bookings and guests who may need flexibility',
  },
  {
    value: 'moderate',
    label: 'Moderate',
    icon: '🟡',
    badge: 'Balanced',
    color: 'amber' as const,
    freeWindow: 'Full refund up to 5 days before check-in',
    partialWindow: '1–4 days before: first night non-refundable, 50% of remaining nights refunded',
    noRefund: 'No refund on check-in day or after',
    bestFor: 'Balanced protection — good for most hosts',
  },
  {
    value: 'strict',
    label: 'Strict',
    icon: '🔴',
    badge: 'Host-protective',
    color: 'rose' as const,
    freeWindow: 'Full refund up to 14 days before check-in',
    partialWindow: '7–13 days before: first night non-refundable, 50% of remaining nights refunded',
    noRefund: 'No refund within 7 days of check-in',
    bestFor: 'Best for high-demand listings or non-refundable preparation costs',
  },
];

const CHECK_TIMES = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00',
  '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00',
];

function CounterField({ label, desc, value, onChange, min = 0, max = 100 }: {
  label: string; desc?: string; value: number; onChange: (v: number) => void; min?: number; max?: number;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-neutral-100 last:border-0">
      <div>
        <p className="text-sm font-medium text-neutral-900">{label}</p>
        {desc && <p className="text-xs text-neutral-500 mt-0.5">{desc}</p>}
      </div>
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-300 text-neutral-600 hover:border-indigo-600 disabled:opacity-30 transition-colors text-sm">–</button>
        <span className="w-7 text-center font-medium text-neutral-900">{value}</span>
        <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-300 text-neutral-600 hover:border-indigo-600 disabled:opacity-30 transition-colors text-sm">+</button>
      </div>
    </div>
  );
}

function ToggleRow({ label, desc, value, onChange }: {
  label: string; desc?: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-neutral-100 last:border-0">
      <div>
        <p className="text-sm font-medium text-neutral-900">{label}</p>
        {desc && <p className="text-xs text-neutral-500 mt-0.5">{desc}</p>}
      </div>
      <button type="button" onClick={() => onChange(!value)}
        className={cn('inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-transparent transition-colors rtl:scale-x-[-1]',
          value ? 'bg-indigo-600' : 'bg-neutral-300')}>
        <span className={cn('h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200',
          value ? 'translate-x-5' : 'translate-x-0')} />
      </button>
    </div>
  );
}

export default function EditListingPage() {
  const params = useParams();
  const locale = useLocale();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isLoggedIn, isHost, hasHydrated } = useAuth();
  const uuid = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [categoryId, setCategoryId] = useState<number>(0);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [spaceType, setSpaceType] = useState<SpaceType>('entire_place');
  const [kind, setKind] = useState<PropertyKind>('apartment');
  const [maxGuests, setMaxGuests] = useState(4);
  const [bedrooms, setBedrooms] = useState(1);
  const [beds, setBeds] = useState(1);
  const [bathrooms, setBathrooms] = useState(1);
  const [price, setPrice] = useState(100);
  const [weekendPrice, setWeekendPrice] = useState<number | null>(null);
  const [weeklyDiscount, setWeeklyDiscount] = useState(0);
  const [monthlyDiscount, setMonthlyDiscount] = useState(0);
  const [newListingPromoEnabled, setNewListingPromoEnabled] = useState(false);
  const [lastMinuteDiscountPercent, setLastMinuteDiscountPercent] = useState(0);
  const [bookingMode, setBookingMode] = useState<'instant_book' | 'approve_first_three'>('approve_first_three');
  const [cleaningFee, setCleaningFee] = useState(0);
  const [minNights, setMinNights] = useState(1);
  const [maxNights, setMaxNights] = useState(365);
  const [checkInTime, setCheckInTime] = useState('14:00');
  const [checkOutTime, setCheckOutTime] = useState('11:00');
  const [instantBook, setInstantBook] = useState(false);
  const [allowPets, setAllowPets] = useState(false);
  const [allowsSmoking, setAllowsSmoking] = useState(false);
  const [allowsParties, setAllowsParties] = useState(false);
  const [allowsChildren, setAllowsChildren] = useState(true);
  const [houseRules, setHouseRules] = useState('');
  const [cancellationPolicy, setCancellationPolicy] = useState('flexible');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [selectedAmenityIds, setSelectedAmenityIds] = useState<number[]>([]);
  const [newPhotos, setNewPhotos] = useState<File[]>([]);
  const [newPhotoPreviews, setNewPhotoPreviews] = useState<string[]>([]);

  // Auth
  useEffect(() => {
    if (!hasHydrated) return;
    if (!isLoggedIn) router.push(`/${locale}/login`);
    else if (!isHost) router.push(`/${locale}`);
  }, [hasHydrated, isLoggedIn, isHost, locale, router]);

  // Fetch property
  const { data: property, isLoading } = useQuery({
    queryKey: ['property', uuid],
    queryFn: () => propertiesApi.getPropertyByUuid(uuid),
    enabled: !!uuid && isLoggedIn && isHost,
  });

  // Fetch categories & amenities
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: categoriesApi.getCategories, staleTime: Infinity, gcTime: 24 * 60 * 60 * 1000 });
  const { data: amenities } = useQuery({ queryKey: ['amenities'], queryFn: amenitiesApi.getAmenities, staleTime: Infinity, gcTime: 24 * 60 * 60 * 1000 });

  // Populate form from fetched data
  useEffect(() => {
    if (!property) return;
    setCategoryId(property.category?.id ?? 0);
    setTitle(property.title ?? '');
    setDescription(property.description ?? '');
    setSpaceType(property.spaceType ?? 'entire_place');
    setKind(property.kind ?? 'apartment');
    setMaxGuests(property.maxGuests ?? 4);
    setBedrooms(property.bedrooms ?? 1);
    setBeds(property.beds ?? 1);
    setBathrooms(property.bathrooms ?? 1);
    setPrice(property.price ?? 100);
    setWeekendPrice(property.weekendPrice ?? null);
    setWeeklyDiscount(property.weeklyDiscount ?? 0);
    setMonthlyDiscount(property.monthlyDiscount ?? 0);
    setNewListingPromoEnabled(property.newListingPromotionEnabled ?? false);
    setLastMinuteDiscountPercent(property.lastMinuteDiscountPercent ?? 0);
    setBookingMode((property.bookingMode ?? 'approve_first_three') as 'instant_book' | 'approve_first_three');
    setCleaningFee(property.cleaningFee ?? 0);
    setMinNights(property.minNights ?? 1);
    setMaxNights(property.maxNights ?? 365);
    setCheckInTime(property.checkInTime ?? '14:00');
    setCheckOutTime(property.checkOutTime ?? '11:00');
    setInstantBook(property.instantBook ?? false);
    setAllowPets(property.allowPets ?? false);
    setAllowsSmoking(property.allowsSmoking ?? false);
    setAllowsParties(property.allowsParties ?? false);
    setAllowsChildren(property.allowsChildren ?? true);
    setHouseRules(property.houseRules ?? '');
    setCancellationPolicy(property.cancellationPolicy ?? 'flexible');
    setAddress(property.address ?? '');
    setCity(property.city ?? '');
    setCountry(property.country ?? '');
    setLat(property.lat || null);
    setLng(property.lng || null);
    setSelectedAmenityIds((property.amenities ?? []).map((a: Amenity) => a.id));
  }, [property]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      propertiesApi.updateListing(property!.id, payload as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property', uuid] });
      queryClient.invalidateQueries({ queryKey: ['host-listings'] });
      toast.success('Listing updated');
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? 'Failed to update listing'),
  });

  const handleSave = () => {
    updateMutation.mutate({
      title,
      description,
      categoryId: categoryId || undefined,
      spaceType,
      propertyKind: kind,
      pricePerNight: price,
      weekendPrice: weekendPrice ?? undefined,
      weeklyDiscount,
      monthlyDiscount,
      newListingPromotionEnabled: newListingPromoEnabled,
      lastMinuteDiscountPercent,
      bookingMode,
      cleaningFee,
      minNights,
      maxNights,
      maxGuests,
      bedrooms,
      beds,
      bathrooms,
      address,
      city,
      country,
      latitude: lat ?? undefined,
      longitude: lng ?? undefined,
      amenityIds: selectedAmenityIds,
      checkInAfter: checkInTime,
      checkOutBefore: checkOutTime,
      instantBook,
      allowsPets: allowPets,
      allowsSmoking,
      allowsParties,
      allowsChildren,
      cancellationPolicy,
    });
  };

  const toggleAmenity = (id: number) => {
    setSelectedAmenityIds((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  // Transfer ownership state
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferEmail, setTransferEmail] = useState('');
  const transferMutation = useMutation({
    mutationFn: () => propertiesApi.transferProperty(property!.id, transferEmail.trim()),
    onSuccess: (data) => {
      toast.success(data.message);
      setShowTransferModal(false);
      router.push(`/${locale}/hosting/listings`);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Transfer failed'),
  });

  if (!hasHydrated || !isLoggedIn || !isHost) return <FullPageSpinner />;
  if (isLoading) return <FullPageSpinner />;
  if (!property) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-neutral-500">Listing not found.</p>
      </div>
    );
  }

  const images = property.images ?? [];

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-neutral-200">
        <div className="mx-auto max-w-3xl px-4 py-3 flex items-center justify-between">
          <Link href={`/${locale}/hosting/listings`} className="flex items-center gap-1 text-sm text-neutral-600 hover:text-neutral-900">
            <ChevronLeft className="h-4 w-4" /> My Listings
          </Link>
          <button
            type="button"
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            {updateMutation.isPending ? <Spinner size="sm" /> : <Save className="h-4 w-4" />}
            Save
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8 space-y-10 pb-20">
        {/* ── Photos ── */}
        <section>
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">
            Photos <span className="text-sm font-normal text-neutral-400">(up to 10)</span>
          </h3>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (!e.target.files) return;
              const existing = images.length + newPhotos.length;
              const remaining = Math.max(0, 10 - existing);
              const files = Array.from(e.target.files).slice(0, remaining);
              if (files.length === 0) { toast.error('Maximum 10 photos allowed'); return; }
              setNewPhotos((p) => [...p, ...files]);
              setNewPhotoPreviews((p) => [...p, ...files.map((f) => URL.createObjectURL(f))]);
            }}
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* Saved photos */}
            {images.map((photo, idx) => (
              <div key={photo.id} className="relative rounded-xl overflow-hidden border border-neutral-200 aspect-[4/3] group bg-neutral-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={getImageUrl(photo.url)} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                {photo.isCover && (
                  <span className="absolute top-2 left-2 bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Star className="h-3 w-3 fill-white" /> Cover
                  </span>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  {!photo.isCover && (
                    <button type="button"
                      onClick={async () => {
                        try {
                          await propertiesApi.setCoverPhoto(photo.id);
                          queryClient.invalidateQueries({ queryKey: ['property', uuid] });
                          toast.success('Cover photo updated');
                        } catch { toast.error('Failed to set cover'); }
                      }}
                      className="rounded-full bg-white/90 p-2 text-indigo-600 hover:bg-white transition" title="Set as cover">
                      <Star className="h-4 w-4" />
                    </button>
                  )}
                  <button type="button"
                    onClick={async () => {
                      try {
                        await propertiesApi.deletePhoto(photo.id);
                        queryClient.invalidateQueries({ queryKey: ['property', uuid] });
                        toast.success('Photo deleted');
                      } catch { toast.error('Failed to delete photo'); }
                    }}
                    className="rounded-full bg-white/90 p-2 text-red-500 hover:bg-white transition" title="Delete">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            {/* New staged photos */}
            {newPhotoPreviews.map((src, idx) => (
              <div key={`new-${idx}`} className="relative rounded-xl overflow-hidden border border-neutral-200 aspect-[4/3] group bg-neutral-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`New photo ${idx + 1}`} className="w-full h-full object-cover" />
                <span className="absolute top-2 left-2 bg-amber-600/90 text-white text-xs px-2 py-0.5 rounded-full">Unsaved</span>
                <button type="button"
                  onClick={() => { setNewPhotos((p) => p.filter((_, i) => i !== idx)); setNewPhotoPreviews((p) => p.filter((_, i) => i !== idx)); }}
                  className="absolute top-2 right-2 bg-black/70 text-white rounded-full h-6 w-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs">
                  ×
                </button>
              </div>
            ))}
            {/* Add slot */}
            {(images.length + newPhotos.length) < 10 && (
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="rounded-xl border-2 border-dashed border-neutral-300 aspect-[4/3] flex flex-col items-center justify-center gap-2 text-neutral-400 hover:border-indigo-600 hover:text-indigo-600 transition">
                <ImageIcon className="h-7 w-7" />
                <span className="text-xs font-medium">Add photo</span>
              </button>
            )}
          </div>
          {newPhotos.length > 0 && (
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={async () => {
                  if (!newPhotos.length || !property?.id) return;
                  try {
                    await propertiesApi.uploadImages(property.id, newPhotos);
                    toast.success(`${newPhotos.length} photo${newPhotos.length > 1 ? 's' : ''} uploaded`);
                    setNewPhotos([]);
                    setNewPhotoPreviews([]);
                    queryClient.invalidateQueries({ queryKey: ['property', uuid] });
                  } catch {
                    toast.error('Failed to upload photos');
                  }
                }}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition"
              >
                <Upload className="h-4 w-4" /> Save {newPhotos.length} photo{newPhotos.length > 1 ? 's' : ''}
              </button>
            </div>
          )}
        </section>

        <Separator />

        {/* ── Category ── */}
        <section>
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Category</h3>
          <div className="flex flex-wrap gap-2">
            {(categories ?? []).map((cat: Category) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryId(cat.id)}
                className={cn(
                  'rounded-full border px-4 py-2 text-sm font-medium transition-all',
                  categoryId === cat.id
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                    : 'border-neutral-300 text-neutral-700 hover:border-indigo-600'
                )}
              >
                {cat.icon ?? '🏠'} {cat.name}
              </button>
            ))}
          </div>
        </section>

        <Separator />

        {/* ── Title & Description ── */}
        <section>
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Title & Description</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Title</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Description</label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
            </div>
          </div>
        </section>

        <Separator />

        {/* ── Property Type ── */}
        <section>
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Property Type</h3>
          <div className="space-y-6">
            {/* Space type */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Space type</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {SPACE_TYPES.map((st) => {
                  const checked = spaceType === st.value;
                  return (
                    <button key={st.value} type="button" onClick={() => setSpaceType(st.value)}
                      className={cn('rounded-xl border-2 p-4 text-left transition-all',
                        checked ? 'border-indigo-600 bg-indigo-50' : 'border-neutral-200 hover:border-indigo-600')}>
                      <p className={cn('text-sm font-semibold', checked ? 'text-indigo-700' : 'text-neutral-900')}>{st.label}</p>
                      <p className="text-xs text-neutral-500 mt-0.5">{st.desc}</p>
                      {checked && <Check className="h-4 w-4 text-indigo-600 mt-2" />}
                    </button>
                  );
                })}
              </div>
            </div>
            {/* Property kind */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Kind</label>
              <div className="flex flex-wrap gap-2">
                {PROPERTY_KINDS.map((pk) => (
                  <button key={pk.value} type="button" onClick={() => setKind(pk.value)}
                    className={cn('rounded-full border px-4 py-2 text-sm font-medium transition-all',
                      kind === pk.value
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-neutral-300 text-neutral-700 hover:border-indigo-600')}>
                    {pk.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <Separator />

        {/* ── Floor Plan ── */}
        <section>
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Floor Plan</h3>
          <CounterField label="Max guests" value={maxGuests} onChange={setMaxGuests} min={1} max={50} />
          <CounterField label="Bedrooms" value={bedrooms} onChange={setBedrooms} min={0} max={30} />
          <CounterField label="Beds" value={beds} onChange={setBeds} min={1} max={50} />
          <CounterField label="Bathrooms" value={bathrooms} onChange={setBathrooms} min={0} max={20} />
        </section>

        <Separator />

        {/* ── Amenities ── */}
        <section>
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Amenities</h3>
          <div className="flex flex-wrap gap-2">
            {(amenities ?? []).map((amenity: Amenity) => {
              const active = selectedAmenityIds.includes(amenity.id);
              return (
                <button key={amenity.id} type="button" onClick={() => toggleAmenity(amenity.id)}
                  className={cn('rounded-full border px-4 py-2 text-sm font-medium transition-all flex items-center gap-1.5',
                    active
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                      : 'border-neutral-300 text-neutral-700 hover:border-indigo-600')}>
                  {active && <Check className="h-3.5 w-3.5 text-indigo-600" />}
                  {amenity.icon} {amenity.name}
                </button>
              );
            })}
          </div>
          {selectedAmenityIds.length > 0 && (
            <p className="mt-2 text-xs text-neutral-500">{selectedAmenityIds.length} amenities selected</p>
          )}
        </section>

        <Separator />

        {/* ── Location ── */}
        <section>
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Location</h3>
          <div className="space-y-4">
            <LocationMapPicker
              initialLat={lat}
              initialLng={lng}
              onLocationSelect={(d) => {
                setCity(d.city);
                setCountry(d.country);
                setAddress(d.address);
                setLat(d.lat);
                setLng(d.lng);
              }}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="Address" placeholder="123 Main St" value={address} onChange={(e) => setAddress(e.target.value)} />
              <Input label="City *" placeholder="Cairo" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <Input label="Country *" placeholder="Egypt" value={country} onChange={(e) => setCountry(e.target.value)} />
          </div>
        </section>

        <Separator />

        {/* ── Pricing ── */}
        <section>
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Pricing</h3>
          <div className="space-y-6">
            {/* Price per night */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Price per night (EGP)</label>
              <div className="flex items-center gap-4">
                <input type="range" min={100} max={500000} step={100} value={price}
                  onChange={(e) => setPrice(Number(e.target.value))} className="flex-1 accent-indigo-600" />
                <span className="text-lg font-bold w-24 text-right">EGP {price}</span>
              </div>
            </div>

            {/* Weekend price */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-neutral-700">Weekend price</label>
                <button type="button" onClick={() => setWeekendPrice(weekendPrice == null ? price : null)}
                  className={cn('rounded-full border px-3 py-1 text-xs font-medium transition-all',
                    weekendPrice != null ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-neutral-300 text-neutral-600 hover:border-indigo-600')}>
                  {weekendPrice != null ? 'Enabled' : 'Off'}
                </button>
              </div>
              {weekendPrice != null && (
                <div className="flex items-center gap-4">
                  <input type="range" min={100} max={500000} step={100} value={weekendPrice}
                    onChange={(e) => setWeekendPrice(Number(e.target.value))} className="flex-1 accent-indigo-600" />
                  <span className="text-lg font-bold w-24 text-right">EGP {weekendPrice}</span>
                </div>
              )}
            </div>

            {/* Cleaning fee */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Cleaning fee</label>
              <div className="flex items-center gap-4">
                <input type="range" min={0} max={10000} step={100} value={cleaningFee}
                  onChange={(e) => setCleaningFee(Number(e.target.value))} className="flex-1 accent-indigo-600" />
                <span className="text-lg font-bold w-24 text-right">EGP {cleaningFee}</span>
              </div>
            </div>

            {/* New listing promotion */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <label className="text-sm font-medium text-neutral-700">New listing promotion</label>
                  <p className="text-xs text-neutral-500 mt-0.5">20% off your first 3 bookings</p>
                </div>
                <button type="button" onClick={() => setNewListingPromoEnabled((v) => !v)}
                  className={cn('rounded-full border px-3 py-1 text-xs font-medium transition-all',
                    newListingPromoEnabled ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-neutral-300 text-neutral-600 hover:border-indigo-600')}>
                  {newListingPromoEnabled ? 'Enabled' : 'Off'}
                </button>
              </div>
            </div>

            {/* Last-minute discount */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <label className="block text-sm font-medium text-neutral-700">Last-minute discount</label>
                  <p className="text-xs text-neutral-500 mt-0.5">For bookings made 14 days or less before arrival</p>
                </div>
                {lastMinuteDiscountPercent > 0 && (
                  <span className="rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-xs font-medium">
                    {lastMinuteDiscountPercent}% off
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {[0, 5, 10, 15, 20].map((v) => (
                  <button key={v} type="button" onClick={() => setLastMinuteDiscountPercent(v)}
                    className={cn('rounded-full border px-4 py-2 text-sm font-medium transition-all',
                      lastMinuteDiscountPercent === v ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-neutral-300 text-neutral-700 hover:border-indigo-600')}>
                    {v === 0 ? 'None' : `${v}%`}
                  </button>
                ))}
              </div>
            </div>

            {/* Weekly discount */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Weekly discount</label>
              <div className="flex flex-wrap gap-2">
                {[0, 5, 10, 15, 20, 25, 30].map((v) => (
                  <button key={v} type="button" onClick={() => setWeeklyDiscount(v)}
                    className={cn('rounded-full border px-4 py-2 text-sm font-medium transition-all',
                      weeklyDiscount === v ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-neutral-300 text-neutral-700 hover:border-indigo-600')}>
                    {v === 0 ? 'None' : `${v}%`}
                  </button>
                ))}
              </div>
            </div>

            {/* Monthly discount */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="text-sm font-medium text-neutral-700">Monthly discount</label>
                {monthlyDiscount > 0 && (
                  <span className="rounded-full bg-indigo-50 text-indigo-700 px-2 py-0.5 text-xs font-medium">
                    {monthlyDiscount}% off
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {[0, 10, 15, 20, 25, 30, 40, 50].map((v) => (
                  <button key={v} type="button" onClick={() => setMonthlyDiscount(v)}
                    className={cn('rounded-full border px-4 py-2 text-sm font-medium transition-all',
                      monthlyDiscount === v ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-neutral-300 text-neutral-700 hover:border-indigo-600')}>
                    {v === 0 ? 'None' : `${v}%`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <Separator />

        {/* ── Booking Rules ── */}
        <section>
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Booking Rules</h3>
          <div className="space-y-4">
            <CounterField label="Min nights" value={minNights} onChange={setMinNights} min={1} max={maxNights} />
            <CounterField label="Max nights" value={maxNights} onChange={setMaxNights} min={minNights} max={365} />

            {/* Check-in / check-out */}
            <div className="grid grid-cols-2 gap-4 py-3">
              <Select
                label="Check-in after"
                value={checkInTime}
                onChange={(v) => setCheckInTime(v)}
                options={CHECK_TIMES.map((t) => ({ value: t, label: t }))}
              />
              <Select
                label="Check-out before"
                value={checkOutTime}
                onChange={(v) => setCheckOutTime(v)}
                options={CHECK_TIMES.map((t) => ({ value: t, label: t }))}
              />
            </div>

            {/* Booking mode */}
            <div>
              <p className="text-sm font-medium text-neutral-700 mb-3">Booking style</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button type="button" onClick={() => setBookingMode('approve_first_three')}
                  className={cn('relative rounded-xl border-2 p-4 text-left transition-all', bookingMode === 'approve_first_three' ? 'border-indigo-600 bg-indigo-50' : 'border-neutral-200 hover:border-neutral-300')}>
                  {bookingMode === 'approve_first_three' && (
                    <span className="absolute top-3 right-3 text-indigo-600">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                    </span>
                  )}
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">📅</span>
                    <div>
                      <p className="font-semibold text-sm text-neutral-900">Approve your first 3 bookings</p>
                      <span className="inline-block mt-1 mb-2 rounded-full bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5">Recommended</span>
                      <p className="text-xs text-neutral-500">Review and approve guests until you feel comfortable, then switch to Instant Book.</p>
                    </div>
                  </div>
                </button>
                <button type="button" onClick={() => setBookingMode('instant_book')}
                  className={cn('relative rounded-xl border-2 p-4 text-left transition-all', bookingMode === 'instant_book' ? 'border-indigo-600 bg-indigo-50' : 'border-neutral-200 hover:border-neutral-300')}>
                  {bookingMode === 'instant_book' && (
                    <span className="absolute top-3 right-3 text-indigo-600">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                    </span>
                  )}
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">⚡</span>
                    <div>
                      <p className="font-semibold text-sm text-neutral-900">Use Instant Book</p>
                      <p className="text-xs text-neutral-500 mt-1">Guests can book without waiting for approval. Great for maximizing occupancy.</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </section>

        <Separator />

        {/* ── Guest Policies ── */}
        <section>
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Guest Policies</h3>
          <ToggleRow label="Pets allowed" desc="Guests can bring pets" value={allowPets} onChange={setAllowPets} />
          <ToggleRow label="Smoking allowed" value={allowsSmoking} onChange={setAllowsSmoking} />
          <ToggleRow label="Parties allowed" value={allowsParties} onChange={setAllowsParties} />
          <ToggleRow label="Children allowed" value={allowsChildren} onChange={setAllowsChildren} />
        </section>

        <Separator />

        {/* ── House Rules ── */}
        <section>
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">House Rules</h3>
          <Textarea
            value={houseRules}
            onChange={(e) => setHouseRules(e.target.value)}
            placeholder={"One rule per line, e.g.\nNo shoes inside\nQuiet hours after 10pm\nNo loud music"}
            rows={4}
          />
        </section>

        <Separator />

        {/* ── Cancellation Policy ── */}
        <section>
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Cancellation Policy</h3>
          <div className="space-y-3">
            {CANCELLATION_POLICIES.map((pol) => {
              const checked = cancellationPolicy === pol.value;
              return (
                <button key={pol.value} type="button" onClick={() => setCancellationPolicy(pol.value)}
                  className={cn('w-full text-left rounded-2xl border-2 p-5 transition-all',
                    checked ? 'border-indigo-600 bg-indigo-50' : 'border-neutral-200 hover:border-neutral-400')}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{pol.icon}</span>
                      <p className="font-semibold text-neutral-900 text-base">{pol.label}</p>
                      <span className={cn(
                        'rounded-full px-2.5 py-0.5 text-xs font-medium',
                        pol.color === 'emerald' && 'bg-emerald-100 text-emerald-700',
                        pol.color === 'amber' && 'bg-amber-100 text-amber-700',
                        pol.color === 'rose' && 'bg-rose-100 text-rose-700',
                      )}>
                        {pol.badge}
                      </span>
                    </div>
                    {checked && <Check className="h-5 w-5 text-indigo-600 shrink-0" />}
                  </div>
                  <ul className="space-y-1.5 text-sm">
                    <li className="flex items-start gap-2 text-neutral-700">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                      {pol.freeWindow}
                    </li>
                    <li className="flex items-start gap-2 text-neutral-700">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                      {pol.partialWindow}
                    </li>
                    <li className="flex items-start gap-2 text-neutral-700">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                      {pol.noRefund}
                    </li>
                  </ul>
                  <p className="mt-2.5 text-xs text-neutral-500 italic">{pol.bestFor}</p>
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-neutral-400">
            ℹ️ Service fee and cleaning fee are never refundable regardless of the policy.
          </p>
        </section>

        <Separator />

        {/* ── Danger Zone ── */}
        <section className="rounded-2xl border border-rose-200 bg-rose-50 p-6">
          <h3 className="text-base font-semibold text-rose-700 mb-1">Danger Zone</h3>
          <p className="text-sm text-rose-600 mb-4">Actions here are permanent or transfer control away from you.</p>
          <button
            type="button"
            onClick={() => setShowTransferModal(true)}
            className="flex items-center gap-2 rounded-xl border border-rose-300 bg-white px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-100 transition-colors"
          >
            <ArrowRightLeft className="h-4 w-4" />
            Transfer Ownership
          </button>
        </section>
      </div>

      {/* Transfer Ownership Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-neutral-900">Transfer Ownership</h2>
              <button onClick={() => setShowTransferModal(false)} className="rounded-full p-1 hover:bg-neutral-100 transition-colors">
                <X className="h-5 w-5 text-neutral-500" />
              </button>
            </div>
            <p className="text-sm text-neutral-600 mb-4">
              Enter the email address of the host you want to transfer this listing to. They must already be registered as a host on Oikivo.
            </p>
            <input
              type="email"
              value={transferEmail}
              onChange={(e) => setTransferEmail(e.target.value)}
              placeholder="host@example.com"
              className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 mb-4"
            />
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700 mb-5">
              ⚠️ This action is irreversible. You will lose all host controls for this listing.
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowTransferModal(false)}
                className="flex-1 rounded-xl border border-neutral-200 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!transferEmail.trim() || transferMutation.isPending}
                onClick={() => transferMutation.mutate()}
                className="flex-1 rounded-xl bg-rose-600 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50 transition-colors"
              >
                {transferMutation.isPending ? 'Transferring…' : 'Confirm Transfer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom save bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 z-30 lg:hidden">
        <div className="mx-auto max-w-3xl px-4 py-3 flex justify-end">
          <button type="button" onClick={handleSave} disabled={updateMutation.isPending}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition">
            {updateMutation.isPending ? <Spinner size="sm" /> : <Save className="h-4 w-4" />} Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
