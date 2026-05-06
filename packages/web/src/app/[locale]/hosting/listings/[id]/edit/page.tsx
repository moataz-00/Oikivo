'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ChevronLeft, Plus, Trash2, Save, Upload, ImageIcon, Check, Star,
  ArrowRightLeft, X, Home, FileText, MapPin, DollarSign, CalendarDays,
  ShieldCheck, BookOpen, Settings, Wifi, KeyRound, AlertTriangle, Eye,
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
import { toast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';
import type { Category, Amenity, SpaceType, PropertyKind } from '@/types';

const SPACE_TYPES: { value: SpaceType; label: string; desc: string; icon: string }[] = [
  { value: 'entire_place', label: 'Entire place', desc: 'Guests have the whole place', icon: '🏠' },
  { value: 'private_room', label: 'Private room', desc: 'Guests have their own room', icon: '🛏️' },
  { value: 'shared_room', label: 'Shared room', desc: 'Guests share a room', icon: '👥' },
];

const HOTEL_SPACE_TYPES: { value: SpaceType; label: string; desc: string; icon: string }[] = [
  { value: 'hotel_room', label: 'Hotel Room', desc: 'Standard hotel-style room', icon: '🛎️' },
  { value: 'hotel_suite', label: 'Hotel Suite', desc: 'Premium suite with extra amenities', icon: '👑' },
];

const STANDOUT_OPTIONS = [
  { label: 'Panoramic views', emoji: '🌅' },
  { label: 'Private pool', emoji: '🏊' },
  { label: 'Rooftop terrace', emoji: '🏙️' },
  { label: 'Garden & outdoor space', emoji: '🌳' },
  { label: 'Waterfront / beach access', emoji: '🏖️' },
  { label: 'Smart home features', emoji: '🏠' },
  { label: 'Luxury furnishings', emoji: '✨' },
  { label: 'Private parking', emoji: '🅿️' },
  { label: 'Pet-friendly', emoji: '🐕' },
  { label: 'EV charger', emoji: '🔌' },
  { label: 'Home cinema / projector', emoji: '🎬' },
  { label: 'Game room', emoji: '🎮' },
  { label: 'Hot tub / jacuzzi', emoji: '🛁' },
  { label: 'Fireplace', emoji: '🔥' },
  { label: '24/7 concierge', emoji: '🛎️' },
  { label: 'Self check-in', emoji: '🔑' },
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
  { value: 'bungalow', label: '🌴 Bungalow' },
  { value: 'cottage', label: '🌿 Cottage' },
  { value: 'townhouse', label: '🏘️ Townhouse' },
];

const CANCELLATION_POLICIES = [
  { value: 'flexible', icon: '🟢', color: 'emerald' as const },
  { value: 'moderate', icon: '🟡', color: 'amber' as const },
  { value: 'strict',   icon: '🔴', color: 'rose' as const },
];

const CHECK_TIMES = [
  '07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00',
  '15:00','16:00','17:00','18:00','19:00','20:00','21:00','22:00','23:00',
];

const SECTIONS = [
  { id: 'photos',     labelKey: 'editSecPhotos',     icon: ImageIcon },
  { id: 'basics',     labelKey: 'editSecBasics',     icon: FileText },
  { id: 'type',       labelKey: 'editSecType',       icon: Home },
  { id: 'floorplan',  labelKey: 'editSecFloorplan',  icon: Home },
  { id: 'amenities',  labelKey: 'editSecAmenities',  icon: Settings },
  { id: 'location',   labelKey: 'editSecLocation',   icon: MapPin },
  { id: 'pricing',    labelKey: 'editSecPricing',    icon: DollarSign },
  { id: 'rules',      labelKey: 'editSecRules',      icon: CalendarDays },
  { id: 'policies',   labelKey: 'editSecPolicies',   icon: ShieldCheck },
  { id: 'checkin',    labelKey: 'editSecCheckin',    icon: KeyRound },
  { id: 'houserules', labelKey: 'editSecHouserules', icon: BookOpen },
  { id: 'cancel',     labelKey: 'editSecCancel',     icon: CalendarDays },
  { id: 'danger',     labelKey: 'editSecDanger',     icon: AlertTriangle },
] as const;
type SectionId = typeof SECTIONS[number]['id'];

function SectionCard({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20 bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-neutral-100 bg-neutral-50/60">
        <h3 className="text-base font-semibold text-neutral-900">{title}</h3>
      </div>
      <div className="px-6 py-5">{children}</div>
    </section>
  );
}

function CounterField({ label, desc, value, onChange, min = 0, max = 100 }: {
  label: string; desc?: string; value: number; onChange: (v: number) => void; min?: number; max?: number;
}) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-neutral-100 last:border-0">
      <div>
        <p className="text-sm font-medium text-neutral-900">{label}</p>
        {desc && <p className="text-xs text-neutral-400 mt-0.5">{desc}</p>}
      </div>
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-300 text-neutral-600 hover:border-indigo-600 hover:text-indigo-600 disabled:opacity-30 transition-colors font-medium">−</button>
        <span className="w-8 text-center font-semibold text-neutral-900 tabular-nums">{value}</span>
        <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-300 text-neutral-600 hover:border-indigo-600 hover:text-indigo-600 disabled:opacity-30 transition-colors font-medium">+</button>
      </div>
    </div>
  );
}

function ToggleRow({ label, desc, value, onChange }: {
  label: string; desc?: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-neutral-100 last:border-0">
      <div>
        <p className="text-sm font-medium text-neutral-900">{label}</p>
        {desc && <p className="text-xs text-neutral-400 mt-0.5">{desc}</p>}
      </div>
      <button type="button" onClick={() => onChange(!value)}
        className={cn('inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-transparent transition-colors',
          value ? 'bg-indigo-600' : 'bg-neutral-200')}>
        <span className={cn('h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200',
          value ? 'translate-x-5' : 'translate-x-0')} />
      </button>
    </div>
  );
}

function PriceSlider({ label, desc, value, onChange, min = 0, max, step = 100, suffix = 'EGP', zeroLabel }: {
  label: string; desc?: string; value: number; onChange: (v: number) => void;
  min?: number; max: number; step?: number; suffix?: string; zeroLabel?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-900">{label}</p>
          {desc && <p className="text-xs text-neutral-400 mt-0.5">{desc}</p>}
        </div>
        <span className="rounded-xl bg-indigo-50 border border-indigo-100 px-3 py-1 text-sm font-bold text-indigo-700 min-w-[90px] text-right">
          {value === 0 && zeroLabel ? zeroLabel : `${suffix} ${value.toLocaleString()}`}
        </span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-indigo-600 bg-neutral-200" />
      <div className="flex justify-between text-xs text-neutral-400">
        <span>{min === 0 && zeroLabel ? zeroLabel : `${suffix} ${min.toLocaleString()}`}</span>
        <span>{suffix} {max.toLocaleString()}</span>
      </div>
    </div>
  );
}

function PercentChips({ value, onChange, options }: { value: number; onChange: (v: number) => void; options: number[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((v) => (
        <button key={v} type="button" onClick={() => onChange(v)}
          className={cn('rounded-full border px-4 py-1.5 text-sm font-medium transition-all',
            value === v ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-neutral-300 text-neutral-700 hover:border-indigo-400')}>
          {v === 0 ? 'None' : `${v}%`}
        </button>
      ))}
    </div>
  );
}

export default function EditListingPage() {
  const params = useParams();
  const locale = useLocale();
  const isRTL = locale === 'ar';
  const t = useTranslations('hosting');
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isLoggedIn, isHost, hasHydrated } = useAuth();
  const uuid = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const kindInitRef = useRef(true);
  const [activeSection, setActiveSection] = useState<SectionId>('photos');

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
  const [securityDeposit, setSecurityDeposit] = useState(0);
  const [bookingMode, setBookingMode] = useState<'instant_book' | 'approve_first_three' | 'always_approve'>('approve_first_three');
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
  const [standoutNote, setStandoutNote] = useState('');
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
  const [wifiName, setWifiName] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [doorCode, setDoorCode] = useState('');
  const [checkInInstructions, setCheckInInstructions] = useState('');
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferEmail, setTransferEmail] = useState('');

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isLoggedIn) router.push(`/${locale}/login`);
    else if (!isHost) router.push(`/${locale}`);
  }, [hasHydrated, isLoggedIn, isHost, locale, router]);

  const { data: property, isLoading } = useQuery({
    queryKey: ['property', uuid],
    queryFn: () => propertiesApi.getPropertyByUuid(uuid),
    enabled: !!uuid && isLoggedIn && isHost,
  });
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: categoriesApi.getCategories, staleTime: Infinity });
  const { data: amenities } = useQuery({ queryKey: ['amenities'], queryFn: amenitiesApi.getAmenities, staleTime: Infinity });

  useEffect(() => {
    if (!property) return;
    setCategoryId(property.category?.id ?? 0);
    setTitle(property.title ?? '');
    const fullDesc = property.description ?? '';
    const standoutMarker = '\n\nWhat makes this place unique:\n';
    const markerIdx = fullDesc.indexOf(standoutMarker);
    if (markerIdx !== -1) {
      setDescription(fullDesc.slice(0, markerIdx));
      setStandoutNote(fullDesc.slice(markerIdx + standoutMarker.length));
    } else {
      setDescription(fullDesc);
    }
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
    setBookingMode((property.bookingMode ?? 'approve_first_three') as 'instant_book' | 'approve_first_three' | 'always_approve');
    setCleaningFee(property.cleaningFee ?? 0);
    setSecurityDeposit(property.securityDeposit ?? 0);
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
    setWifiName((property as any).wifiName ?? '');
    setWifiPassword((property as any).wifiPassword ?? '');
    setDoorCode((property as any).doorCode ?? '');
    setCheckInInstructions((property as any).checkInInstructions ?? '');
  }, [property]);

  useEffect(() => {
    if (kindInitRef.current) { kindInitRef.current = false; return; }
    if (kind === 'hotel') {
      if (spaceType !== 'hotel_room' && spaceType !== 'hotel_suite') setSpaceType('hotel_room');
    } else if (spaceType === 'hotel_room' || spaceType === 'hotel_suite') {
      setSpaceType('entire_place');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);

  const updateMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      propertiesApi.updateListing(property!.id, payload as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property', uuid] });
      queryClient.invalidateQueries({ queryKey: ['host-listings'] });
      toast.success('Listing saved');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to save listing'),
  });

  const handleSave = () => {
    const mergedDescription = standoutNote.trim()
      ? `${description}${description ? '\n\n' : ''}What makes this place unique:\n${standoutNote}`
      : description;
    updateMutation.mutate({
      title,
      description: mergedDescription,
      categoryId: categoryId || undefined,
      spaceType,
      kind,
      price,
      weekendPrice: weekendPrice ?? undefined,
      weeklyDiscount,
      monthlyDiscount,
      newListingPromotionEnabled: newListingPromoEnabled,
      lastMinuteDiscountPercent,
      bookingMode,
      cleaningFee,
      securityDeposit,
      minNights,
      maxNights,
      maxGuests,
      bedrooms,
      beds,
      bathrooms,
      address,
      city,
      country,
      lat: lat ?? undefined,
      lng: lng ?? undefined,
      amenityIds: selectedAmenityIds,
      checkInTime,
      checkOutTime,
      instantBook,
      allowPets,
      allowsSmoking,
      allowsParties,
      allowsChildren,
      cancellationPolicy,
      wifiName: wifiName || undefined,
      wifiPassword: wifiPassword || undefined,
      doorCode: doorCode || undefined,
      checkInInstructions: checkInInstructions || undefined,
    } as any);
    if (property?.id) {
      propertiesApi.updateHouseRules(property.id, houseRules).catch(() => {
        toast.error('Failed to save house rules');
      });
    }
  };

  const toggleAmenity = (id: number) =>
    setSelectedAmenityIds((prev) => prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]);

  const transferMutation = useMutation({
    mutationFn: () => propertiesApi.transferProperty(property!.id, transferEmail.trim()),
    onSuccess: (data) => {
      toast.success(data.message);
      setShowTransferModal(false);
      router.push(`/${locale}/hosting/listings`);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Transfer failed'),
  });

  useEffect(() => {
    const handler = () => {
      for (const sec of [...SECTIONS].reverse()) {
        const el = document.getElementById(sec.id);
        if (el && el.getBoundingClientRect().top <= 120) {
          setActiveSection(sec.id);
          break;
        }
      }
    };
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  if (!hasHydrated || !isLoggedIn || !isHost) return <FullPageSpinner />;
  if (isLoading) return <FullPageSpinner />;
  if (!property) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-neutral-500">{t('editNotFound' as any)}</p>
      </div>
    );
  }

  const images = property.images ?? [];
  const photoCount = images.length + newPhotos.length;
  const photosMissing = Math.max(0, 5 - photoCount);

  return (
    <div className="min-h-screen bg-neutral-50" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Top bar */}
      <div className="sticky top-0 z-40 bg-white border-b border-neutral-200 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link href={`/${locale}/hosting/listings`}
              className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900 shrink-0 transition-colors">
              <ChevronLeft className="h-4 w-4 rtl:rotate-180" /> {t('editNavListings' as any)}
            </Link>
            <span className="text-neutral-300 hidden sm:block">/</span>
            <h1 className="text-sm font-semibold text-neutral-900 truncate hidden sm:block">{property.title || 'Edit listing'}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/${locale}/rooms/${property.uuid}`} target="_blank"
              className="hidden sm:flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-50 transition-colors">
              <Eye className="h-3.5 w-3.5" /> {t('editNavPreview' as any)}
            </Link>
            <button type="button" onClick={handleSave} disabled={updateMutation.isPending}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition shadow-sm">
              {updateMutation.isPending ? <Spinner size="sm" /> : <Save className="h-4 w-4" />} {t('editNavSave' as any)}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar nav */}
          <nav className="hidden lg:block w-52 shrink-0">
            <div className="sticky top-20 bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
              {SECTIONS.map((sec) => {
                const Icon = sec.icon;
                const active = activeSection === sec.id;
                return (
                  <a key={sec.id} href={`#${sec.id}`}
                    onClick={(e) => { e.preventDefault(); document.getElementById(sec.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); setActiveSection(sec.id); }}
                    className={cn(
                      'flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors border-s-2',
                      active ? 'bg-indigo-50 text-indigo-700 border-indigo-600 font-semibold' : 'text-neutral-600 border-transparent hover:bg-neutral-50 hover:text-neutral-900'
                    )}>
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    {t(sec.labelKey as any)}
                    {sec.id === 'photos' && photosMissing > 0 && (
                      <span className="ms-auto rounded-full bg-amber-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center">{photosMissing}</span>
                    )}
                  </a>
                );
              })}
            </div>
          </nav>

          {/* Main content */}
          <div className="flex-1 min-w-0 space-y-6">

            {/* Photos */}
            <SectionCard id="photos" title={t('editTitlePhotos' as any)}>
              {photosMissing > 0 && (
                <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
                  <p><strong>{t('editPhotosMissing' as any, { missing: photosMissing })}</strong></p>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
                onChange={(e) => {
                  if (!e.target.files) return;
                  const existing = images.length + newPhotos.length;
                  const remaining = Math.max(0, 20 - existing);
                  const files = Array.from(e.target.files).slice(0, remaining);
                  if (files.length === 0) { toast.error('Maximum 20 photos reached'); return; }
                  setNewPhotos((p) => [...p, ...files]);
                  setNewPhotoPreviews((p) => [...p, ...files.map((f) => URL.createObjectURL(f))]);
                  e.target.value = '';
                }}
              />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {images.map((photo: any, idx: number) => (
                  <div key={photo.id} className="relative rounded-xl overflow-hidden border border-neutral-200 aspect-[4/3] group bg-neutral-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={getImageUrl(photo.url)} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                    {photo.isCover && (
                      <span className="absolute top-2 start-2 bg-indigo-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Star className="h-2.5 w-2.5 fill-white" /> {t('editPhotoCoverBadge' as any)}
                      </span>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                      {!photo.isCover && (
                        <button type="button"
                          onClick={async () => {
                            try { await propertiesApi.setCoverPhoto(photo.id); queryClient.invalidateQueries({ queryKey: ['property', uuid] }); toast.success('Cover photo updated'); }
                            catch { toast.error('Failed to set cover'); }
                          }}
                          className="rounded-full bg-white/90 backdrop-blur-sm p-2 text-indigo-600 hover:bg-white shadow transition" title="Set as cover">
                          <Star className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button type="button"
                        onClick={async () => {
                          if (images.length <= 5) { toast.error('Cannot delete — minimum 5 photos required'); return; }
                          try { await propertiesApi.deletePhoto(photo.id); queryClient.invalidateQueries({ queryKey: ['property', uuid] }); toast.success('Photo deleted'); }
                          catch { toast.error('Failed to delete photo'); }
                        }}
                        className="rounded-full bg-white/90 backdrop-blur-sm p-2 text-red-500 hover:bg-white shadow transition" title="Delete">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <span className="absolute bottom-2 end-2 bg-black/50 text-white text-[10px] rounded-md px-1.5 py-0.5">{idx + 1}</span>
                  </div>
                ))}
                {newPhotoPreviews.map((src, idx) => (
                  <div key={`new-${idx}`} className="relative rounded-xl overflow-hidden border-2 border-amber-400 aspect-[4/3] group bg-neutral-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`New photo ${idx + 1}`} className="w-full h-full object-cover" />
                    <span className="absolute top-2 start-2 bg-amber-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">{t('editPhotoUnsavedBadge' as any)}</span>
                    <button type="button"
                      onClick={() => { setNewPhotos((p) => p.filter((_, i) => i !== idx)); setNewPhotoPreviews((p) => p.filter((_, i) => i !== idx)); }}
                      className="absolute top-2 end-2 bg-black/70 text-white rounded-full h-6 w-6 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                  </div>
                ))}
                {photoCount < 20 && (
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="rounded-xl border-2 border-dashed border-neutral-300 aspect-[4/3] flex flex-col items-center justify-center gap-2 text-neutral-400 hover:border-indigo-500 hover:text-indigo-500 transition-colors group">
                    <div className="h-10 w-10 rounded-xl bg-neutral-100 group-hover:bg-indigo-50 flex items-center justify-center transition-colors">
                      <Plus className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-medium">{t('editPhotoAddBtn' as any)}</span>
                    <span className="text-[10px] text-neutral-400">{photoCount}/20</span>
                  </button>
                )}
              </div>
              {newPhotos.length > 0 && (
                <div className="mt-4 flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <p className="text-sm text-amber-800 font-medium">{t('editPhotoUploadReady' as any, { count: newPhotos.length })}</p>
                  <button type="button"
                    onClick={async () => {
                      if (!newPhotos.length || !property?.id) return;
                      try {
                        await propertiesApi.uploadImages(property.id, newPhotos);
                        toast.success(`${newPhotos.length} photo${newPhotos.length > 1 ? 's' : ''} uploaded`);
                        setNewPhotos([]); setNewPhotoPreviews([]);
                        queryClient.invalidateQueries({ queryKey: ['property', uuid] });
                      } catch (err: any) { toast.error(err?.response?.data?.message ?? 'Upload failed'); }
                    }}
                    className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-amber-700 transition">
                    <Upload className="h-3.5 w-3.5" /> {t('editPhotoUploadNow' as any)}
                  </button>
                </div>
              )}
              <p className="mt-3 text-xs text-neutral-400">{t('editPhotoHint' as any)}</p>
            </SectionCard>

            {/* Basics */}
            <SectionCard id="basics" title={t('editTitleBasics' as any)}>
              <div className="space-y-5">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-medium text-neutral-700">{t('editFieldListingTitle' as any)}</label>
                    <span className="text-xs text-neutral-400">{title.length}/100</span>
                  </div>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} placeholder={t('editFieldListingTitlePlaceholder' as any)} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-medium text-neutral-700">{t('editFieldDescription' as any)}</label>
                    <span className="text-xs text-neutral-400">{description.length}/2000</span>
                  </div>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5}
                    placeholder={t('editFieldDescPlaceholder' as any)} maxLength={2000} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">{t('editFieldCategory' as any)}</label>
                  <div className="flex flex-wrap gap-2">
                    {(categories ?? []).map((cat: Category) => (
                      <button key={cat.id} type="button" onClick={() => setCategoryId(cat.id)}
                        className={cn('rounded-full border px-4 py-1.5 text-sm font-medium transition-all',
                          categoryId === cat.id ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-neutral-300 text-neutral-700 hover:border-indigo-400')}>
                        {cat.icon ?? '🏠'} {isRTL ? (cat.nameAr || cat.name) : cat.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-700 mb-1">{t('editFieldStandout' as any)} <span className="text-neutral-400 font-normal">{t('editFieldStandoutOptional' as any)}</span></p>
                  <p className="text-xs text-neutral-400 mb-3">{t('editFieldStandoutHint' as any)}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {STANDOUT_OPTIONS.map(({ label, emoji }) => {
                      const selectedSet = new Set(standoutNote ? standoutNote.split('\n').filter(Boolean) : []);
                      const selected = selectedSet.has(label);
                      const toggle = () => {
                        const next = new Set(selectedSet);
                        next.has(label) ? next.delete(label) : next.add(label);
                        setStandoutNote(Array.from(next).join('\n'));
                      };
                      return (
                        <button key={label} type="button" onClick={toggle}
                          className={cn('flex items-center gap-2 rounded-xl border-2 p-2.5 text-start transition-all text-sm',
                            selected ? 'border-indigo-600 bg-indigo-50 text-indigo-800' : 'border-neutral-200 text-neutral-700 hover:border-neutral-300')}>
                          <span className="text-base leading-none shrink-0">{emoji}</span>
                          <span className="flex-1 font-medium leading-tight">{label}</span>
                          {selected && <Check className="h-3.5 w-3.5 text-indigo-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* Property Type */}
            <SectionCard id="type" title={t('editTitleType' as any)}>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">{t('editFieldPropertyKind' as any)}</label>
                  <div className="flex flex-wrap gap-2">
                    {PROPERTY_KINDS.map((pk) => (
                      <button key={pk.value} type="button" onClick={() => setKind(pk.value)}
                        className={cn('rounded-full border px-4 py-1.5 text-sm font-medium transition-all',
                          kind === pk.value ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-neutral-300 text-neutral-700 hover:border-indigo-400')}>
                        {pk.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">{t('editFieldSpaceType' as any)}</label>
                  {kind === 'hotel' && (
                    <div className="mb-3 flex items-center gap-2 rounded-xl bg-indigo-50 border border-indigo-200 px-4 py-2.5 text-xs text-indigo-700">
                      <span>🏨</span> {t('editHotelModeNotice' as any)}
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {(kind === 'hotel' ? HOTEL_SPACE_TYPES : SPACE_TYPES).map((st) => {
                      const checked = spaceType === st.value;
                      return (
                        <button key={st.value} type="button" onClick={() => setSpaceType(st.value)}
                          className={cn('relative rounded-xl border-2 p-4 text-start transition-all',
                            checked ? 'border-indigo-600 bg-indigo-50' : 'border-neutral-200 hover:border-indigo-300')}>
                          <span className="text-2xl block mb-2">{st.icon}</span>
                          <p className={cn('text-sm font-semibold', checked ? 'text-indigo-800' : 'text-neutral-900')}>{t(`editSpace${st.value.replace(/_./g, m => m[1].toUpperCase()).replace(/^./, c => c.toUpperCase())}` as any)}</p>
                          <p className="text-xs text-neutral-500 mt-0.5">{t(`editSpace${st.value.replace(/_./g, m => m[1].toUpperCase()).replace(/^./, c => c.toUpperCase())}Desc` as any)}</p>
                          {checked && <Check className="absolute top-3 end-3 h-4 w-4 text-indigo-600" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* Floor Plan */}
            <SectionCard id="floorplan" title={t('editTitleFloorplan' as any)}>
              <div className="divide-y divide-neutral-100">
                <CounterField label={t('editFieldMaxGuests' as any)} desc={t('editFieldMaxGuestsDesc' as any)} value={maxGuests} onChange={setMaxGuests} min={1} max={50} />
                <CounterField label={t('editFieldBedrooms' as any)} value={bedrooms} onChange={setBedrooms} min={0} max={30} />
                <CounterField label={t('editFieldBeds' as any)} value={beds} onChange={setBeds} min={1} max={50} />
                <CounterField label={t('editFieldBathrooms' as any)} value={bathrooms} onChange={setBathrooms} min={0} max={20} />
              </div>
            </SectionCard>

            {/* Amenities */}
            <SectionCard id="amenities" title={t('editTitleAmenities' as any)}>
              {selectedAmenityIds.length > 0 && (
                <div className="mb-3 flex items-center gap-2 text-sm text-indigo-700 font-medium">
                  <Check className="h-4 w-4 text-indigo-600" /> {selectedAmenityIds.length} selected
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {(amenities ?? []).map((amenity: Amenity) => {
                  const active = selectedAmenityIds.includes(amenity.id);
                  return (
                    <button key={amenity.id} type="button" onClick={() => toggleAmenity(amenity.id)}
                      className={cn('rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all flex items-center gap-1.5',
                        active ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-neutral-300 text-neutral-600 hover:border-indigo-300')}>
                      {active && <Check className="h-3 w-3 text-indigo-600 shrink-0" />}
                      {amenity.icon} {isRTL ? (amenity.nameAr || amenity.name) : amenity.name}
                    </button>
                  );
                })}
              </div>
            </SectionCard>

            {/* Location */}
            <SectionCard id="location" title={t('editTitleLocation' as any)}>
              <div className="space-y-4">
                <LocationMapPicker initialLat={lat} initialLng={lng}
                  onLocationSelect={(d) => { setCity(d.city); setCountry(d.country); setAddress(d.address); setLat(d.lat); setLng(d.lng); }} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <Input label={t('editAddressLabel' as any)} placeholder="123 Nile Corniche" value={address} onChange={(e) => setAddress(e.target.value)} />
                  <Input label={t('editCityLabel' as any)} placeholder="Cairo" value={city} onChange={(e) => setCity(e.target.value)} />
                </div>
                <Input label={t('editCountryLabel' as any)} placeholder="Egypt" value={country} onChange={(e) => setCountry(e.target.value)} />
              </div>
            </SectionCard>

            {/* Pricing */}
            <SectionCard id="pricing" title={t('editTitlePricing' as any)}>
              <div className="space-y-7">
                <PriceSlider label={t('editFieldPricePerNight' as any)} value={price} onChange={setPrice} min={100} max={500000} step={100} />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-neutral-900">{t('editFieldWeekendPrice' as any)}</p>
                      <p className="text-xs text-neutral-400 mt-0.5">{t('editFieldWeekendPriceDesc' as any)}</p>
                    </div>
                    <button type="button" onClick={() => setWeekendPrice(weekendPrice == null ? price : null)}
                      className={cn('inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-transparent transition-colors', weekendPrice != null ? 'bg-indigo-600' : 'bg-neutral-200')}>
                      <span className={cn('h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200', weekendPrice != null ? 'translate-x-5' : 'translate-x-0')} />
                    </button>
                  </div>
                  {weekendPrice != null && (
                    <PriceSlider label="" value={weekendPrice} onChange={setWeekendPrice} min={100} max={500000} step={100} />
                  )}
                </div>
                <PriceSlider label={t('editFieldCleaningFee' as any)} value={cleaningFee} onChange={setCleaningFee} min={0} max={20000} step={100} zeroLabel={t('editNoneLabel' as any)} />
                <PriceSlider label={t('editFieldSecurityDeposit' as any)} desc={t('editFieldSecurityDepositDesc' as any)} value={securityDeposit} onChange={setSecurityDeposit} min={0} max={50000} step={500} zeroLabel={t('editNoneLabel' as any)} />
                <div className="rounded-xl bg-neutral-50 border border-neutral-200 p-4 space-y-5">
                  <h4 className="text-sm font-semibold text-neutral-800">{t('editDiscountsPromos' as any)}</h4>
                  <div className="space-y-1.5">
                    <p className="text-sm font-medium text-neutral-700">{t('editWeeklyDiscount' as any)} <span className="text-xs text-neutral-400">{t('editWeeklyDiscountSuffix' as any)}</span></p>
                    <PercentChips value={weeklyDiscount} onChange={setWeeklyDiscount} options={[0, 5, 10, 15, 20, 25, 30]} />
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-sm font-medium text-neutral-700">{t('editMonthlyDiscount' as any)} <span className="text-xs text-neutral-400">{t('editMonthlyDiscountSuffix' as any)}</span></p>
                    <PercentChips value={monthlyDiscount} onChange={setMonthlyDiscount} options={[0, 10, 15, 20, 25, 30, 40, 50]} />
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-sm font-medium text-neutral-700">{t('editLastMinuteDiscount' as any)} <span className="text-xs text-neutral-400">{t('editLastMinuteDiscountSuffix' as any)}</span></p>
                    <PercentChips value={lastMinuteDiscountPercent} onChange={setLastMinuteDiscountPercent} options={[0, 5, 10, 15, 20]} />
                  </div>
                  <ToggleRow label={t('editNewListingPromo' as any)} desc={t('editNewListingPromoDesc' as any)} value={newListingPromoEnabled} onChange={setNewListingPromoEnabled} />
                </div>
              </div>
            </SectionCard>

            {/* Booking Rules */}
            <SectionCard id="rules" title={t('editTitleRules' as any)}>
              <div className="space-y-5">
                <div className="divide-y divide-neutral-100">
                  <CounterField label={t('editMinStay' as any)} desc={t('editMinStayDesc' as any)} value={minNights} onChange={setMinNights} min={1} max={maxNights} />
                  <CounterField label={t('editMaxStay' as any)} desc={t('editMaxStayDesc' as any)} value={maxNights} onChange={setMaxNights} min={minNights} max={365} />
                </div>
                <div className="grid grid-cols-2 gap-4 pt-1">
                  <Select label={t('editCheckInAfter' as any)} value={checkInTime} onChange={(v) => setCheckInTime(v)}
                    options={CHECK_TIMES.map((t) => ({ value: t, label: t }))} />
                  <Select label={t('editCheckOutBefore' as any)} value={checkOutTime} onChange={(v) => setCheckOutTime(v)}
                    options={CHECK_TIMES.map((t) => ({ value: t, label: t }))} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-800 mb-3">{t('editBookingStyle' as any)}</p>
                  <div className="space-y-2.5">
                    {[
                      { id: 'approve_first_three', icon: '📅', labelKey: 'editBmApproveFirst', badgeKey: 'editBmApproveFirstBadge' as any, descKey: 'editBmApproveFirstDesc' },
                      { id: 'always_approve', icon: '🔍', labelKey: 'editBmAlwaysApprove', badgeKey: null, descKey: 'editBmAlwaysApproveDesc' },
                      { id: 'instant_book', icon: '⚡', labelKey: 'editBmInstantBook', badgeKey: null, descKey: 'editBmInstantBookDesc' },
                    ].map((bm) => {
                      const checked = bookingMode === bm.id;
                      return (
                        <button key={bm.id} type="button"
                          onClick={() => { setBookingMode(bm.id as any); setInstantBook(bm.id === 'instant_book'); }}
                          className={cn('w-full text-start rounded-xl border-2 px-4 py-3.5 transition-all flex items-start gap-3',
                            checked ? 'border-indigo-600 bg-indigo-50' : 'border-neutral-200 hover:border-neutral-300 bg-white')}>
                          <span className="text-xl mt-0.5">{bm.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className={cn('text-sm font-semibold', checked ? 'text-indigo-800' : 'text-neutral-900')}>{t(bm.labelKey as any)}</p>
                              {bm.badgeKey && <span className="rounded-full bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5">{t(bm.badgeKey)}</span>}
                            </div>
                            <p className="text-xs text-neutral-500 mt-0.5">{t(bm.descKey as any)}</p>
                          </div>
                          {checked && <Check className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* Guest Policies */}
            <SectionCard id="policies" title={t('editTitlePolicies' as any)}>
              <div className="divide-y divide-neutral-100">
                <ToggleRow label={t('editPetsAllowed' as any)} desc={t('editPetsDesc' as any)} value={allowPets} onChange={setAllowPets} />
                <ToggleRow label={t('editSmokingAllowed' as any)} desc={t('editSmokingDesc' as any)} value={allowsSmoking} onChange={setAllowsSmoking} />
                <ToggleRow label={t('editPartiesAllowed' as any)} value={allowsParties} onChange={setAllowsParties} />
                <ToggleRow label={t('editChildrenAllowed' as any)} desc={t('editChildrenDesc' as any)} value={allowsChildren} onChange={setAllowsChildren} />
              </div>
            </SectionCard>

            {/* Check-in Info */}
            <SectionCard id="checkin" title={t('editTitleCheckin' as any)}>
              <div className="space-y-4">
                <div className="flex items-start gap-2.5 rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 text-xs text-blue-700">
                  <KeyRound className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  {t('editCheckinNotice' as any)}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5 flex items-center gap-1.5">
                      <Wifi className="h-3.5 w-3.5 text-neutral-500" /> {t('editWifiName' as any)}
                    </label>
                    <Input value={wifiName} onChange={(e) => setWifiName(e.target.value)} placeholder={t('editWifiNamePlaceholder' as any)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">{t('editWifiPassword' as any)}</label>
                    <Input value={wifiPassword} onChange={(e) => setWifiPassword(e.target.value)} placeholder={t('editWifiPasswordPlaceholder' as any)} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5 flex items-center gap-1.5">
                    <KeyRound className="h-3.5 w-3.5 text-neutral-500" /> {t('editDoorCode' as any)}
                  </label>
                  <Input value={doorCode} onChange={(e) => setDoorCode(e.target.value)} placeholder={t('editDoorCodePlaceholder' as any)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">{t('editCheckinInstructions' as any)}</label>
                  <Textarea value={checkInInstructions} onChange={(e) => setCheckInInstructions(e.target.value)} rows={4}
                    placeholder={t('editCheckinInstructionsPlaceholder' as any)} />
                </div>
              </div>
            </SectionCard>

            {/* House Rules */}
            <SectionCard id="houserules" title={t('editTitleHouserules' as any)}>
              <p className="text-xs text-neutral-500 mb-3">{t('editHouseRulesHint' as any)}</p>
              <Textarea value={houseRules} onChange={(e) => setHouseRules(e.target.value)}
                placeholder={"No shoes inside\nQuiet hours after 10 pm\nNo parties or events\nNo smoking indoors"} rows={5} />
            </SectionCard>

            {/* Cancellation Policy */}
            <SectionCard id="cancel" title={t('editTitleCancel' as any)}>
              <div className="space-y-3">
                {CANCELLATION_POLICIES.map((pol) => {
                  const checked = cancellationPolicy === pol.value;
                  const vc = pol.value.charAt(0).toUpperCase() + pol.value.slice(1);
                  return (
                    <button key={pol.value} type="button" onClick={() => setCancellationPolicy(pol.value)}
                      className={cn('w-full text-start rounded-2xl border-2 p-5 transition-all',
                        checked ? 'border-indigo-600 bg-indigo-50' : 'border-neutral-200 hover:border-neutral-300 bg-white')}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{pol.icon}</span>
                          <p className="font-semibold text-neutral-900">{t(`editCancel${vc}` as any)}</p>
                          <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium',
                            pol.color === 'emerald' && 'bg-emerald-100 text-emerald-700',
                            pol.color === 'amber' && 'bg-amber-100 text-amber-700',
                            pol.color === 'rose' && 'bg-rose-100 text-rose-700')}>
                            {t(`editCancel${vc}Badge` as any)}
                          </span>
                        </div>
                        {checked && <Check className="h-5 w-5 text-indigo-600 shrink-0" />}
                      </div>
                      <ul className="space-y-1.5 text-sm">
                        <li className="flex items-start gap-2 text-neutral-700"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />{t(`editCancel${vc}FreeWindow` as any)}</li>
                        <li className="flex items-start gap-2 text-neutral-700"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />{t(`editCancel${vc}PartialWindow` as any)}</li>
                        <li className="flex items-start gap-2 text-neutral-700"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />{t(`editCancel${vc}NoRefund` as any)}</li>
                      </ul>
                      <p className="mt-2.5 text-xs text-neutral-400 italic">{t(`editCancel${vc}BestFor` as any)}</p>
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-xs text-neutral-400">{t('editCancelDisclaimer' as any)}</p>
            </SectionCard>

            {/* Danger Zone */}
            <SectionCard id="danger" title={t('editTitleDanger' as any)}>
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-5">
                <p className="text-sm text-rose-700 mb-4">{t('editDangerWarning' as any)}</p>
                <button type="button" onClick={() => setShowTransferModal(true)}
                  className="flex items-center gap-2 rounded-xl border border-rose-300 bg-white px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-100 transition-colors">
                  <ArrowRightLeft className="h-4 w-4" /> {t('editDangerTransferBtn' as any)}
                </button>
              </div>
            </SectionCard>

            <div className="h-20 lg:h-4" />
          </div>
        </div>
      </div>

      {/* Transfer modal */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowTransferModal(false); }}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-neutral-900">{t('editTransferTitle' as any)}</h2>
              <button onClick={() => setShowTransferModal(false)} className="rounded-full p-1.5 hover:bg-neutral-100 transition-colors">
                <X className="h-4 w-4 text-neutral-500" />
              </button>
            </div>
            <p className="text-sm text-neutral-600 mb-4">{t('editTransferDesc' as any)}</p>
            <input type="email" value={transferEmail} onChange={(e) => setTransferEmail(e.target.value)} placeholder="host@example.com"
              className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 mb-4" />
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700 mb-5">
              {t('editTransferWarning' as any)}
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowTransferModal(false)}
                className="flex-1 rounded-xl border border-neutral-200 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors">{t('editTransferCancelBtn' as any)}</button>
              <button type="button" disabled={!transferEmail.trim() || transferMutation.isPending} onClick={() => transferMutation.mutate()}
                className="flex-1 rounded-xl bg-rose-600 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50 transition-colors">
                {transferMutation.isPending ? t('editTransferringLabel' as any) : t('editTransferConfirmBtn' as any)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile bottom save bar */}
      <div className="fixed bottom-0 inset-x-0 z-30 lg:hidden bg-white border-t border-neutral-200 shadow-[0_-2px_12px_rgba(0,0,0,0.06)]">
        <div className="mx-auto max-w-3xl px-4 py-3 flex items-center justify-between gap-3">
          <p className="text-xs text-neutral-500 truncate">{property.title || t('editMobileSaveTitle' as any)}</p>
          <button type="button" onClick={handleSave} disabled={updateMutation.isPending}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition shrink-0">
            {updateMutation.isPending ? <Spinner size="sm" /> : <Save className="h-4 w-4" />} {t('editNavSave' as any)}
          </button>
        </div>
      </div>
    </div>
  );
}
