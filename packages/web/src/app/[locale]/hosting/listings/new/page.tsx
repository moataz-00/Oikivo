'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter, useSearchParams, useParams, usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import { X, Upload, Check, GripVertical } from 'lucide-react';
import { DndContext, closestCenter, DragEndEvent, DragOverlay } from '@dnd-kit/core';
import { SortableContext, useSortable, arrayMove, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { WizardStep } from '@/components/hosting/WizardStep';
import { LocationMapPicker } from '@/components/hosting/LocationMapPicker';
import { ProgressTracker } from '@/components/hosting/ProgressTracker';
import { MobileProgressBar } from '@/components/hosting/MobileProgressBar';
import { StepSummaryCard } from '@/components/hosting/StepSummaryCard';
import { HoverCard } from '@/components/ui/Motion';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { useAuth } from '@/hooks/useAuth';
import { propertiesApi, amenitiesApi, categoriesApi } from '@/lib/api';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { toast } from '@/components/ui/Toast';
import { getImageUrl, cn } from '@/lib/utils';
import type { SpaceType, PropertyKind, CreateListingPayload } from '@/types';
import Link from 'next/link';

const TOTAL_STEPS = 16;

const CHECK_TIMES = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00',
  '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00',
];

interface Photo {
  id: string;
  file: File;
  preview: string;
}

const STEP_FLOW = [
  { slug: 'structure',           titleKey: 'wizardStructureTitle',    descKey: 'wizardStructureDesc' },
  { slug: 'privacy-type',        titleKey: 'wizardPrivacyTitle',      descKey: 'wizardPrivacyDesc' },
  { slug: 'location',            titleKey: 'wizardLocationTitle',     descKey: 'wizardLocationDesc' },
  { slug: 'floor-plan',          titleKey: 'wizardFloorPlanTitle',    descKey: 'wizardFloorPlanDesc' },
  { slug: 'stand-out',           titleKey: 'wizardStandoutTitle',     descKey: 'wizardStandoutDesc' },
  { slug: 'amenities',           titleKey: 'wizardAmenitiesTitle',    descKey: 'wizardAmenitiesDesc' },
  { slug: 'photos',              titleKey: 'wizardPhotosTitle',       descKey: 'wizardPhotosDesc' },
  { slug: 'title',               titleKey: 'wizardTitleTitle',        descKey: 'wizardTitleDesc' },
  { slug: 'description',         titleKey: 'wizardDescTitle',         descKey: 'wizardDescDesc' },
  { slug: 'finish-setup',        titleKey: 'wizardFinishSetupTitle',  descKey: 'wizardFinishSetupDesc' },
  { slug: 'instant-book',        titleKey: 'wizardInstantBookTitle',  descKey: 'wizardInstantBookDesc' },
  { slug: 'price',               titleKey: 'wizardPriceTitle',        descKey: 'wizardPriceDesc' },
  { slug: 'weekend-price',       titleKey: 'wizardWeekendPriceTitle', descKey: 'wizardWeekendPriceDesc' },
  { slug: 'discount',            titleKey: 'wizardDiscountTitle',     descKey: 'wizardDiscountDesc' },
  { slug: 'legal',               titleKey: 'wizardLegalTitle',        descKey: 'wizardLegalDesc' },
  { slug: 'know-your-customer',  titleKey: 'wizardKycTitle',          descKey: 'wizardKycDesc' },
] as const;

type StepSlug = (typeof STEP_FLOW)[number]['slug'];

function getStepFromSlug(slug: string | null): number {
  if (!slug) return 1;
  const idx = STEP_FLOW.findIndex((s) => s.slug === slug);
  return idx === -1 ? 1 : idx + 1;
}

const AMENITY_ICON_MAP: Record<string, string> = {
  'wifi': '📶', 'cooking-pot': '🍳', 'square-parking': '🅿️', 'air-vent': '❄️',
  'flame': '🔥', 'washing-machine': '🫧', 'wind': '💨', 'briefcase': '💼',
  'tv': '📺', 'zap': '⚡', 'waves': '🏊', 'thermometer': '🌡️', 'dumbbell': '🏋️',
  'anchor': '⚓', 'mountain': '⛷️', 'music': '🎹', 'shower-head': '🚿',
  'bike': '🚴', 'sailboat': '⛵', 'bell-ring': '🔔', 'alert-triangle': '⚠️',
  'fire-extinguisher': '🧯', 'cross': '🏥', 'camera': '📷', 'lock': '🔒',
  'bbq-grill': '🍖',
};

const SPACE_TYPES: { value: SpaceType; labelKey: string; descKey: string; icon: string }[] = [
  { value: 'entire_place', labelKey: 'entirePlace', descKey: 'entirePlaceDesc', icon: '🏠' },
  { value: 'private_room', labelKey: 'privateRoom', descKey: 'privateRoomDesc', icon: '🛏️' },
  { value: 'shared_room', labelKey: 'sharedRoom', descKey: 'sharedRoomDesc', icon: '🪴' },
];

const HOTEL_SPACE_TYPES: { value: SpaceType; labelKey: string; descKey: string; icon: string }[] = [
  { value: 'hotel_room', labelKey: 'hotelRoom', descKey: 'hotelRoomDesc', icon: '🛎️' },
  { value: 'hotel_suite', labelKey: 'hotelSuite', descKey: 'hotelSuiteDesc', icon: '👑' },
];

const PROPERTY_KINDS: { value: PropertyKind; labelKey: string; icon: string }[] = [
  { value: 'house', labelKey: 'kindHouse', icon: '🏡' },
  { value: 'villa', labelKey: 'kindVilla', icon: '🏖️' },
  { value: 'apartment', labelKey: 'kindApartment', icon: '🏢' },
  { value: 'hotel', labelKey: 'kindHotel', icon: '🏨' },
  { value: 'chalet', labelKey: 'kindChalet', icon: '🏔️' },
  { value: 'studio', labelKey: 'kindStudio', icon: '🎨' },
  { value: 'townhouse', labelKey: 'kindTownhouse', icon: '🏘️' },
  { value: 'cabin', labelKey: 'kindCabin', icon: '🌲' },
];

const WIZARD_KEY = 'listing_wizard';

function saveWizardState(data: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  try { sessionStorage.setItem(WIZARD_KEY, JSON.stringify(data)); } catch { /* noop */ }
}

function clearWizardState() {
  if (typeof window !== 'undefined') sessionStorage.removeItem(WIZARD_KEY);
}

export default function NewListingPage() {
  const t = useTranslations('hosting');
  const locale = useLocale();
  const isRTL = locale === 'ar';

  const translatedSteps = useMemo(() => STEP_FLOW.map((s) => ({
    slug: s.slug,
    title: t(s.titleKey as any),
    description: t(s.descKey as any),
  })), [locale]); // eslint-disable-line react-hooks/exhaustive-deps
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = useParams<{ step?: string | string[] }>();
  const { isLoggedIn, isHost, hasHydrated, user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const propertyIdRef = useRef<number | null>(null);

  const pathStepRaw = params?.step;
  const pathStep = Array.isArray(pathStepRaw) ? pathStepRaw[0] : pathStepRaw;

  const [step, setStep] = useState(() => getStepFromSlug(pathStep ?? searchParams.get('step')));
  const [prevStep, setPrevStep] = useState(step);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [propertyId, setPropertyId] = useState<number | null>(null);

  // Step data
  const [spaceType, setSpaceType] = useState<SpaceType>('entire_place');
  const [kind, setKind] = useState<PropertyKind>('apartment');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [lat, setLat] = useState(0);
  const [lng, setLng] = useState(0);
  const [maxGuests, setMaxGuests] = useState(2);
  const [bedrooms, setBedrooms] = useState(1);
  const [beds, setBeds] = useState(1);
  const [bathrooms, setBathrooms] = useState(1);
  const [minNights, setMinNights] = useState(1);
  const [selectedAmenities, setSelectedAmenities] = useState<number[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [photosDirty, setPhotosDirty] = useState(false);
  const [activePhotoId, setActivePhotoId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [standoutNote, setStandoutNote] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [price, setPrice] = useState(500);
  const [weekendPrice, setWeekendPrice] = useState(600);
  const [weeklyDiscount, setWeeklyDiscount] = useState(0);
  const [monthlyDiscount, setMonthlyDiscount] = useState(0);
  const [newListingPromoEnabled, setNewListingPromoEnabled] = useState(true);
  const [lastMinuteDiscountPercent, setLastMinuteDiscountPercent] = useState(0);
  const [cleaningFee] = useState(0);
  const [securityDeposit, setSecurityDeposit] = useState(0);
  const [houseRules, setHouseRules] = useState('');
  const [checkInTime, setCheckInTime] = useState('15:00');
  const [checkOutTime, setCheckOutTime] = useState('11:00');
  const [cancellationPolicy, setCancellationPolicy] = useState('flexible');
  const [bookingMode, setBookingMode] = useState<'instant_book' | 'approve_first_three' | 'always_approve'>('approve_first_three');
  const [instantBook, setInstantBook] = useState(false);
  const [allowsSmoking, setAllowsSmoking] = useState(false);
  const [allowsParties, setAllowsParties] = useState(false);
  const [allowsChildren, setAllowsChildren] = useState(true);
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [kycAccepted, setKycAccepted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showExitModal, setShowExitModal] = useState(false);
  // Tracks whether the initial sessionStorage hydration has completed
  const [isHydrated, setIsHydrated] = useState(false);
  // True once we push the history sentinel (step >= 2); cleared on intentional exit
  const wizardGuardRef = useRef(false);

  // Push a history sentinel when the user moves past step 1 so the browser
  // back button fires a popstate event instead of navigating away silently.
  useEffect(() => {
    if (step < 2 || wizardGuardRef.current) return;
    wizardGuardRef.current = true;
    window.history.pushState({ oikivoWizard: true }, '', window.location.href);
  }, [step]);

  // Intercept the browser back button (popstate) while the wizard guard is active.
  useEffect(() => {
    const handlePopState = () => {
      if (!wizardGuardRef.current) return;
      // Re-push the sentinel to keep us on the same URL
      window.history.pushState({ oikivoWizard: true }, '', window.location.href);
      setShowExitModal(true);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Warn browser on tab close / refresh when wizard is active.
  // Skip the dialog when the user is just switching locale (flag set by LanguageCurrencyModal).
  useEffect(() => {
    if (step < 2) return;
    const handler = (e: BeforeUnloadEvent) => {
      if (sessionStorage.getItem('oikivo_locale_switch')) {
        sessionStorage.removeItem('oikivo_locale_switch');
        return; // allow the locale-switch navigation without a dialog
      }
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [step]);

  const handleExitAttempt = () => {
    if (step < 2 && !propertyIdRef.current && !propertyId) {
      clearWizardState();
      router.push(`/${locale}/hosting/listings`);
      return;
    }
    setShowExitModal(true);
  };

  // Called by both modal buttons so navigation never re-triggers the guard
  const releaseGuardAndLeave = (destination: string) => {
    wizardGuardRef.current = false;
    setShowExitModal(false);
    clearWizardState();
    router.push(destination);
  };

  // Hydrate from sessionStorage on mount (survives route-param changes)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    // ?fresh=1 → always start blank (user clicked "Create new listing")
    if (searchParams.get('fresh') === '1') {
      clearWizardState();
      const url = new URL(window.location.href);
      url.searchParams.delete('fresh');
      window.history.replaceState(null, '', url.toString());
      setIsHydrated(true);
      return;
    }
    try {
      const raw = sessionStorage.getItem(WIZARD_KEY);
      if (!raw) { setIsHydrated(true); return; }
      const d = JSON.parse(raw);
      if (d.spaceType) setSpaceType(d.spaceType);
      if (d.kind) setKind(d.kind);
      if (d.address) setAddress(d.address);
      if (d.city) setCity(d.city);
      if (d.country) setCountry(d.country);
      if (d.lat) setLat(d.lat);
      if (d.lng) setLng(d.lng);
      if (d.maxGuests) setMaxGuests(d.maxGuests);
      if (d.bedrooms !== undefined) setBedrooms(d.bedrooms);
      if (d.beds !== undefined) setBeds(d.beds);
      if (d.bathrooms !== undefined) setBathrooms(d.bathrooms);
      if (d.minNights !== undefined) setMinNights(d.minNights);
      if (Array.isArray(d.selectedAmenities)) setSelectedAmenities(d.selectedAmenities);
      if (d.title) setTitle(d.title);
      if (d.description) setDescription(d.description);
      if (d.standoutNote) setStandoutNote(d.standoutNote);
      if (d.categoryId) setCategoryId(d.categoryId);
      if (d.price) setPrice(d.price);
      if (d.weekendPrice) setWeekendPrice(d.weekendPrice);
      if (d.weeklyDiscount !== undefined) setWeeklyDiscount(d.weeklyDiscount);
      if (d.monthlyDiscount !== undefined) setMonthlyDiscount(d.monthlyDiscount);
      // cleaningFee removed from wizard
      if (d.securityDeposit !== undefined) setSecurityDeposit(d.securityDeposit);
      if (d.houseRules) setHouseRules(d.houseRules);
      if (d.checkInTime) setCheckInTime(d.checkInTime);
      if (d.checkOutTime) setCheckOutTime(d.checkOutTime);
      if (d.cancellationPolicy) setCancellationPolicy(d.cancellationPolicy);
      if (d.bookingMode) setBookingMode(d.bookingMode);
      if (d.instantBook !== undefined) setInstantBook(d.instantBook);
      if (d.newListingPromoEnabled !== undefined) setNewListingPromoEnabled(d.newListingPromoEnabled);
      if (d.lastMinuteDiscountPercent !== undefined) setLastMinuteDiscountPercent(d.lastMinuteDiscountPercent);
      if (d.allowsSmoking !== undefined) setAllowsSmoking(d.allowsSmoking);
      if (d.allowsParties !== undefined) setAllowsParties(d.allowsParties);
      if (d.allowsChildren !== undefined) setAllowsChildren(d.allowsChildren);
      if (d.propertyId) { setPropertyId(d.propertyId); propertyIdRef.current = d.propertyId; }
      if (Array.isArray(d.completedSteps)) setCompletedSteps(new Set<number>(d.completedSteps));
    } catch { /* ignore corrupt storage */ }
    setIsHydrated(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-save all wizard form state to sessionStorage on every change so that
  // switching locale (which triggers a hard reload) never loses unsaved data.
  useEffect(() => {
    if (!isHydrated) return;
    saveWizardState({
      spaceType, kind, address, city, country, lat, lng,
      maxGuests, bedrooms, beds, bathrooms, selectedAmenities,
      title, description, standoutNote, categoryId,
      price, weekendPrice, weeklyDiscount, monthlyDiscount, securityDeposit,
      newListingPromoEnabled, lastMinuteDiscountPercent,
      minNights,
      houseRules, checkInTime, checkOutTime, cancellationPolicy, bookingMode, instantBook,
      allowsSmoking, allowsParties, allowsChildren,
      propertyId: propertyIdRef.current ?? propertyId,
      completedSteps: Array.from(completedSteps),
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isHydrated,
    spaceType, kind, address, city, country, lat, lng,
    maxGuests, bedrooms, beds, bathrooms, selectedAmenities,
    title, description, standoutNote, categoryId,
    price, weekendPrice, weeklyDiscount, monthlyDiscount, securityDeposit,
    newListingPromoEnabled, lastMinuteDiscountPercent,
    minNights,
    houseRules, checkInTime, checkOutTime, cancellationPolicy, bookingMode, instantBook,
    allowsSmoking, allowsParties, allowsChildren,
    propertyId, completedSteps,
  ]);

  // Restore photos from server when entering step 7 or step 16 with an empty photos list
  useEffect(() => {
    const pid = propertyIdRef.current ?? propertyId;
    if ((step !== 7 && step !== 16) || photos.length > 0 || !pid) return;
    propertiesApi.getProperty(pid).then((prop) => {
      if (prop.images?.length) {
        setPhotos(
          prop.images.map((img: any) => ({
            id: String(img.id),
            file: null as unknown as File,
            preview: getImageUrl(img.url),
          }))
        );
      }
    }).catch(() => { /* silent */ });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, propertyId]);

  const { data: amenities } = useQuery({
    queryKey: ['amenities'],
    queryFn: amenitiesApi.getAmenities,
    staleTime: Infinity,
    gcTime: 24 * 60 * 60 * 1000,
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.getCategories,
    staleTime: Infinity,
    gcTime: 24 * 60 * 60 * 1000,
  });

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isLoggedIn) router.push(`/${locale}/login`);
  }, [hasHydrated, isLoggedIn, isHost, locale, router]);

  useEffect(() => {
    const urlStep = getStepFromSlug(pathStep ?? searchParams.get('step'));
    if (urlStep !== step) {
      setStep(urlStep);
    }
  }, [pathStep, searchParams]);

  useEffect(() => {
    const currentSlug = STEP_FLOW[step - 1]?.slug;
    if (!currentSlug) return;

    const expectedPath = `/${locale}/hosting/listings/new/${currentSlug}`;
    if (pathname !== expectedPath) {
      router.replace(expectedPath);
    }
  }, [step, locale, pathname, router]);

  // Auto-reset spaceType to the correct default when kind changes
  useEffect(() => {
    if (kind === 'hotel') {
      setSpaceType('hotel_room');
    } else if (spaceType === 'hotel_room' || spaceType === 'hotel_suite') {
      setSpaceType('entire_place');
    }
  }, [kind]);

  const createListing = useMutation({
    mutationFn: propertiesApi.createListing,
    onSuccess: (data) => {
      setPropertyId(data.id);
    },
    onError: (error: any) => toast.error(error?.response?.data?.message ?? 'Failed to save listing'),
  });

  const updateListing = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<CreateListingPayload> }) =>
      propertiesApi.updateListing(id, payload),
    onError: (error: any) => toast.error(error?.response?.data?.message ?? 'Failed to save'),
  });

  const queryClient = useQueryClient();

  const publishListing = useMutation({
    mutationFn: (id: number) => propertiesApi.publishListing(String(id)),
    onSuccess: () => {
      clearWizardState();
      queryClient.invalidateQueries({ queryKey: ['host-listings'] });
      queryClient.invalidateQueries({ queryKey: ['archived-listings'] });
      toast.success('Submitted for review! Our team will approve your listing shortly. 🎯');
      router.push(`/${locale}/hosting/listings`);
    },
    onError: (error: any) => toast.error(error?.response?.data?.message ?? 'Failed to submit for review'),
  });

  const uploadImages = useMutation({
    mutationFn: ({ id, files }: { id: number; files: File[] }) =>
      propertiesApi.uploadImages(id, files),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Please try again.';
      toast.error(`Failed to upload photos: ${msg}`);
    },
  });

  if (!hasHydrated || !isLoggedIn) return <FullPageSpinner />;

  if (!isHost) {
    return (
      <div className="min-h-[calc(100vh-140px)] flex items-center justify-center px-4 py-10" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="w-full max-w-2xl rounded-3xl border border-neutral-200 bg-white p-8 sm:p-10">
          <p className="inline-flex rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700">
            {t('hostSetupBadge' as any)}
          </p>
          <h1 className="mt-4 text-3xl font-semibold text-neutral-900">
            {t('hostSetupTitle' as any)}
          </h1>
          <p className="mt-3 text-neutral-600">
            {t('hostSetupDesc' as any)}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => router.push(`/${locale}/hosting/activation`)}
              className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              {t('goToActivation' as any)}
            </button>
            <Link
              href={`/${locale}/hosting`}
              className="rounded-xl border border-neutral-300 px-5 py-3 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
            >
              Back
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Verification gate — ALL 4 must pass before listing ──────────────────
  const emailVerified  = !!(user as any)?.isEmailVerified;
  const phoneAdded     = !!(user as any)?.phone;
  const phoneVerified  = !!(user as any)?.isPhoneVerified;
  const hasAvatar      = !!user?.avatarUrl;
  const idStatus: 'none' | 'pending' | 'approved' | 'rejected' =
    (user as any)?.idVerificationStatus ?? 'none';

  const gateItems: {
    key: string;
    icon: string;
    title: string;
    desc: string;
    done: boolean;
    pending: boolean;
    ctaLabel: string;
    ctaHref: string;
    rejected?: boolean;
  }[] = [
    {
      key: 'email',
      icon: '✉️',
      title: t('gateEmailTitle' as any),
      desc: t('gateEmailDesc' as any),
      done: emailVerified,
      pending: false,
      ctaLabel: t('verifyEmail' as any),
      ctaHref: `/${locale}/account/verification`,
    },
    {
      key: 'phone',
      icon: '📱',
      title: t('gatePhoneTitle' as any),
      desc: !phoneAdded
        ? t('gatePhoneDescAdd' as any)
        : t('gatePhoneDescVerify' as any),
      done: phoneVerified,
      pending: false,
      ctaLabel: phoneAdded ? t('verifyPhone' as any) : t('addPhoneNumber' as any),
      ctaHref: phoneAdded ? `/${locale}/account/verification` : `/${locale}/account`,
    },
    {
      key: 'avatar',
      icon: '📷',
      title: t('gateAvatarTitle' as any),
      desc: t('gateAvatarDesc' as any),
      done: hasAvatar,
      pending: false,
      ctaLabel: t('addProfilePhoto' as any),
      ctaHref: `/${locale}/account`,
    },
    {
      key: 'id',
      icon: '🪪',
      title: t('gateIdTitle' as any),
      desc:
        idStatus === 'pending'
          ? t('gateIdDescPending' as any)
          : idStatus === 'rejected'
          ? t('gateIdDescRejected' as any)
          : t('gateIdDescDefault' as any),
      done: idStatus === 'approved',
      pending: idStatus === 'pending',
      rejected: idStatus === 'rejected',
      ctaLabel: idStatus === 'rejected' ? t('reuploadId' as any) : t('uploadId' as any),
      ctaHref: `/${locale}/account/verification`,
    },
  ];

  // pending ID counts as "can proceed" — user submitted, awaiting admin review
  // The actual publish gate (backend verifyListing) will block publishing until approved
  const allDone = gateItems.every((item) => item.done || item.pending);

  if (!allDone) {
    return (
      <div className="min-h-[calc(100vh-140px)] flex items-center justify-center px-4 py-10" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="w-full max-w-2xl rounded-3xl border border-brand/20 bg-white p-8 sm:p-10 shadow-lg shadow-brand/5">
          <p className="inline-flex rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
            {t('requiredBeforeListing' as any)}
          </p>
          <h1 className="mt-4 text-2xl font-semibold text-neutral-900">
            {t('verifyAccountTitle' as any)}
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            {t('verifyAccountDesc' as any)}
          </p>

          <ul className="mt-6 space-y-3">
            {gateItems.map((item) => (
              <li
                key={item.key}
                className={cn(
                  'rounded-2xl border p-4',
                  item.done
                    ? 'border-emerald-200 bg-emerald-50'
                    : item.rejected
                    ? 'border-red-200 bg-red-50'
                    : item.pending
                    ? 'border-brand/20 bg-brand/5'
                    : 'border-brand/10 bg-brand/5'
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Status dot */}
                  <div className="shrink-0 mt-0.5">
                    {item.done ? (
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white text-sm font-bold">✓</span>
                    ) : item.pending ? (
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-white text-xs font-bold">⏳</span>
                    ) : item.rejected ? (
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white text-sm font-bold">✗</span>
                    ) : (
                      <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-brand/30 bg-white text-base">{item.icon}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      'text-sm font-semibold',
                      item.done ? 'text-emerald-800' : item.rejected ? 'text-red-800' : item.pending ? 'text-brand' : 'text-neutral-900'
                    )}>
                      {item.title}
                    </p>
                    <p className={cn(
                      'text-xs mt-0.5 leading-relaxed',
                      item.done ? 'text-emerald-600' : item.rejected ? 'text-red-600' : item.pending ? 'text-brand/70' : 'text-neutral-500'
                    )}>
                      {item.desc}
                    </p>
                  </div>
                  {!item.done && (
                    <Link
                      href={item.ctaHref}
                      className={cn(
                        'shrink-0 rounded-xl px-4 py-2 text-xs font-semibold transition',
                        item.rejected
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'bg-brand text-white hover:bg-brand-dark'
                      )}
                    >
                      {item.pending ? t('viewStatus' as any) : item.ctaLabel}
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>

          {/* Progress summary */}
          <div className="mt-5 flex items-center gap-3">
            <div className="h-2 flex-1 rounded-full bg-neutral-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-brand transition-all duration-500"
                style={{ width: `${(gateItems.filter((i) => i.done).length / gateItems.length) * 100}%` }}
              />
            </div>
            <span className="text-xs font-medium text-neutral-500 shrink-0">
              {gateItems.filter((i) => i.done).length} / {gateItems.length} {t('progressCompleted' as any)}
            </span>
          </div>

          <div className="mt-5">
            <Link
              href={`/${locale}/hosting`}
              className="text-sm font-medium text-brand/70 hover:text-brand transition"
            >
              {t('backToHostingDashboard' as any)}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handlePhotosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const newPhotos: Photo[] = files.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      preview: URL.createObjectURL(file),
    }));

    const updatedPhotos = [...photos, ...newPhotos].slice(0, 20);
    setPhotos(updatedPhotos);
    setPhotosDirty(true);
  };

  const removePhoto = (id: string) => {
    const photoToRemove = photos.find((p) => p.id === id);
    if (photoToRemove?.file) {
      // local blob — revoke the object URL
      URL.revokeObjectURL(photoToRemove.preview);
    }
    setPhotos((prev) => prev.filter((p) => p.id !== id));
    setPhotosDirty(true);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setPhotos((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        setPhotosDirty(true);
        return arrayMove(items, oldIndex, newIndex);
      });
    }

    setActivePhotoId(null);
  };

  const buildListingPayload = () => {
    const mergedDescription = standoutNote
      ? `${description || ''}${description ? '\n\n' : ''}What makes this place unique:\n${standoutNote}`
      : description || '';

    return {
      title: title || 'Untitled listing',
      description: mergedDescription,
      type: 'short_term_rental' as const,
      spaceType,
      kind,
      price,
      cleaningFee,
      securityDeposit,
      minNights,
      weekendPrice,
      weeklyDiscount,
      monthlyDiscount,
      newListingPromotionEnabled: newListingPromoEnabled,
      lastMinuteDiscountPercent,
      bookingMode,
      maxGuests,
      bedrooms,
      beds,
      bathrooms,
      address,
      city,
      country,
      lat: lat || 0,
      lng: lng || 0,
      amenityIds: selectedAmenities,
      categoryId: categoryId ?? undefined,
      houseRules,
      checkInTime,
      checkOutTime,
      cancellationPolicy,
      instantBook: bookingMode === 'instant_book',
      allowPets: false,
      allowsSmoking,
      allowsParties,
      allowsChildren,
      wizardLastStep: step,
    };
  };

  const upsertListing = async () => {
    const payload = buildListingPayload();

    // Always prefer the ref (synchronous) over state (async batching)
    const pid = propertyIdRef.current ?? propertyId;

    let savedId: number;
    if (pid) {
      await updateListing.mutateAsync({ id: pid, payload });
      savedId = pid;
    } else {
      const created = await createListing.mutateAsync(payload);
      propertyIdRef.current = created.id;
      savedId = created.id;
    }

    // Save house rules via dedicated endpoint (non-blocking, best-effort)
    if (houseRules) {
      propertiesApi.updateHouseRules(savedId, houseRules).catch(() => {});
    }

    return savedId;
  };

  const saveDraft = async () => {
    try {
      const pid = await upsertListing();
      if (photos.length > 0 && photosDirty) {
        const files = photos.map((p) => p.file).filter((f): f is File => f instanceof File);
        if (files.length > 0) {
          await uploadImages.mutateAsync({ id: pid, files });
          setPhotosDirty(false);
        }
      }
      toast.success('Saved as draft');
    } catch {
      // mutation onError already shows the error toast
    }
  };

  const handleNext = async () => {
    // ── Step gate: validate required fields before advancing ────────────────
    const stepError = (() => {
      switch (step) {
        case 3: // location
          if (!address.trim()) return 'Please enter the street address';
          if (!city.trim()) return 'Please enter the city';
          if (!country.trim()) return 'Please enter the country';
          if (!lat || !lng) return 'Please pin the location on the map';
          return null;
        case 5: // stand-out / category
          if (!categoryId) return 'Please choose a category for your listing';
          return null;
        case 6: // amenities
          if (selectedAmenities.length === 0) return 'Please select at least one amenity';
          return null;
        case 7: // photos
          if (photos.length < 5) return 'Please upload at least 5 photos';
          {
            const MAX = 10 * 1024 * 1024;
            const oversized = photos.filter((p) => p.file instanceof File && p.file.size > MAX);
            if (oversized.length > 0)
              return `${oversized.length} photo(s) exceed 10 MB. Remove them and upload smaller files.`;
          }
          return null;
        case 8: // title
          if (!title || title.trim().length < 3) return 'Title must be at least 3 characters';
          if (title.length > 32) return 'Title must be 32 characters or less';
          return null;
        case 9: // description
          if (!description || description.trim().length < 50) return 'Description must be at least 50 characters';
          return null;
        case 12: // price
          if (price < 100) return 'Price must be at least EGP 100';
          return null;
        case 15: // legal
          if (!legalAccepted) return 'You must accept the hosting terms to continue';
          return null;
        case 16: // know-your-customer (final publish)
          if (!kycAccepted) return 'Please confirm your identity readiness before publishing';
          return null;
        default:
          return null;
      }
    })();

    if (stepError) {
      toast.error(stepError);
      return;
    }

    // On the final publish step, require a successful API call before leaving
    if (step === TOTAL_STEPS) {
      try {
        const pid = await upsertListing();
        await publishListing.mutateAsync(pid);
      } catch {
        // error toast already shown
      }
      return;
    }

    const isFirstSave = !propertyIdRef.current && !propertyId;

    // If this is the first save (no property created yet), block until created
    // to prevent duplicate drafts from rapid Next clicks
    if (isFirstSave) {
      try {
        const pid = await upsertListing();
        // Also handle photos if on step 7
        if (step === 7 && photos.length > 0 && photosDirty) {
          const files = photos.map((p) => p.file).filter((f): f is File => f instanceof File);
          if (files.length > 0) {
            await uploadImages.mutateAsync({ id: pid, files });
            // Repopulate photos with server-backed URLs so they survive navigation
            try {
              const updated = await propertiesApi.getProperty(pid);
              if (updated.images?.length) {
                setPhotos(
                  updated.images.map((img: any) => ({
                    id: String(img.id),
                    file: null as unknown as File,
                    preview: getImageUrl(img.url),
                  }))
                );
              }
            } catch { /* non-critical */ }
            setPhotosDirty(false);
          }
        }
      } catch {
        // creation failed; don't advance
        return;
      }
    }

    // Mark current step complete and advance
    const nextCompleted = new Set(completedSteps).add(step);
    setCompletedSteps(nextCompleted);
    setPrevStep(step);
    const nextStep = Math.min(TOTAL_STEPS, step + 1);
    setStep(nextStep);

    // Persist state to sessionStorage so navigation doesn't reset it
    const currentPid = propertyIdRef.current ?? propertyId;
    saveWizardState({
      spaceType, kind, address, city, country, lat, lng,
      maxGuests, bedrooms, beds, bathrooms, selectedAmenities,
      title, description, standoutNote, categoryId,
      price, weekendPrice, weeklyDiscount, monthlyDiscount, cleaningFee, securityDeposit,
      newListingPromoEnabled, lastMinuteDiscountPercent,
      minNights,
      houseRules, checkInTime, checkOutTime, cancellationPolicy, bookingMode, instantBook,
      allowsSmoking, allowsParties, allowsChildren,
      propertyId: currentPid,
      completedSteps: Array.from(nextCompleted),
    });

    // For subsequent saves (property already exists), save in background
    if (!isFirstSave) {
      // Upload photos FIRST, independently of the listing save, so they're
      // never lost even if the metadata update fails.
      if (step === 7 && photos.length > 0 && photosDirty) {
        const pid = propertyIdRef.current ?? propertyId;
        if (!pid) {
          toast.error('Photo upload failed: property ID not found. Please try saving as draft.');
        } else {
          const files = photos.map((p) => p.file).filter((f): f is File => f instanceof File);
          if (files.length > 0) {
            try {
              await uploadImages.mutateAsync({ id: pid, files });
              // Repopulate photos with server-backed URLs so they survive navigation
              try {
                const updated = await propertiesApi.getProperty(pid);
                if (updated.images?.length) {
                  setPhotos(
                    updated.images.map((img: any) => ({
                      id: String(img.id),
                      file: null as unknown as File,
                      preview: getImageUrl(img.url),
                    }))
                  );
                }
              } catch { /* non-critical */ }
              setPhotosDirty(false);
            } catch {
              // upload error already toasted — do not advance
              return;
            }
          }
        }
      }

      // Background metadata save
      try {
        await upsertListing();
      } catch {
        // background save failed; toast already shown by mutation
      }
    }
  };

  const handleBack = () => {
    setPrevStep(step);
    const prevStep = Math.max(1, step - 1);
    setStep(prevStep);
  };

  const handleStepClick = (stepNumber: number) => {
    setPrevStep(step);
    setStep(stepNumber);
  };

  // Validation handlers
  const validateField = (field: string, value: any) => {
    let error = '';

    switch (field) {
      case 'title':
        if (!value || value.length < 3) {
          error = 'Title must be at least 3 characters';
        } else if (value.length > 32) {
          error = 'Title must be 32 characters or less';
        }
        break;

      case 'description':
        if (!value || value.length < 50) {
          error = 'Description must be at least 50 characters';
        }
        break;

      case 'address':
      case 'city':
      case 'country':
        if (!value || value.trim().length === 0) {
          error = 'This field is required';
        }
        break;

      case 'price':
        if (value < 100) {
          error = 'Price must be at least EGP 100';
        } else if (value > 500000) {
          error = 'Price cannot exceed EGP 500,000 per night';
        }
        break;

      case 'weekendPrice':
        if (value < price) {
          error = 'Weekend price should be higher than or equal to base price';
        }
        break;

      default:
        break;
    }

    setErrors((prev) => ({ ...prev, [field]: error }));
    return error === '';
  };

  const handleFieldChange = (field: string, value: any, setter: (value: any) => void) => {
    setter(value);
    if (touched[field]) {
      validateField(field, value);
    }
  };

  const handleFieldBlur = (field: string, value: any) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field, value);
  };

  const CounterField = ({
    label,
    value,
    onChange,
    min = 0,
    max = 20,
  }: {
    label: string;
    value: number;
    onChange: (v: number) => void;
    min?: number;
    max?: number;
  }) => (
    <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-3 xs:gap-0 py-4 border-b border-neutral-100 last:border-0">
      <p className="text-base text-neutral-900">{label}</p>
      <div className="flex items-center gap-4">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-300 text-neutral-600 hover:border-indigo-600 disabled:opacity-30 transition-colors"
        >
          –
        </button>
        <span className="w-8 text-center font-medium text-neutral-900">{value}</span>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-300 text-neutral-600 hover:border-indigo-600 disabled:opacity-30 transition-colors"
        >
          +
        </button>
      </div>
    </div>
  );

  const SortablePhoto = ({ photo, index }: { photo: Photo; index: number }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id: photo.id,
    });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          'relative aspect-square rounded-xl overflow-hidden bg-neutral-200 group',
          isDragging && 'z-50 shadow-2xl ring-2 ring-indigo-600'
        )}
      >
        <Image src={photo.preview} alt={`Photo ${index + 1}`} fill className="object-cover" />

        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="absolute top-2 start-2 flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-neutral-700 shadow hover:bg-white cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <GripVertical className="h-4 w-4" />
        </div>

        {/* Remove Button */}
        <button
          onClick={() => removePhoto(photo.id)}
          className="absolute top-2 end-2 flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-neutral-700 shadow hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Cover Badge */}
        {index === 0 && (
          <div className="absolute bottom-2 start-2 rounded-md bg-white/90 px-2 py-1 text-xs font-medium text-neutral-700">
            Cover
          </div>
        )}
      </div>
    );
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {PROPERTY_KINDS.map(({ value, labelKey, icon }) => (
              <HoverCard key={value}>
                <button
                  onClick={() => setKind(value)}
                  className={cn(
                    'flex flex-col items-center justify-center gap-2 rounded-2xl border-2 p-5 text-center transition-all hover:border-neutral-400 w-full h-28',
                    kind === value ? 'border-indigo-600 bg-indigo-50' : 'border-neutral-200'
                  )}
                >
                  <span className="text-3xl">{icon}</span>
                  <p className="text-sm font-medium text-neutral-900">{t(labelKey as any)}</p>
                </button>
              </HoverCard>
            ))}
          </div>
        );

      case 2: {
        const displaySpaceTypes = kind === 'hotel' ? HOTEL_SPACE_TYPES : SPACE_TYPES;
        return (
          <div className="space-y-4">
            {kind === 'hotel' && (
              <p className="text-sm text-indigo-600 font-medium bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-2">
                {t('hotelSpaceTypeNote' as any)}
              </p>
            )}
            {displaySpaceTypes.map(({ value, labelKey, descKey, icon }) => (
              <HoverCard key={value}>
                <button
                  onClick={() => setSpaceType(value)}
                  className={cn(
                    'w-full flex items-start gap-4 rounded-2xl border-2 p-5 text-start transition-all hover:border-neutral-400',
                    spaceType === value ? 'border-indigo-600 bg-indigo-50' : 'border-neutral-200'
                  )}
                >
                  <span className="text-3xl">{icon}</span>
                  <div>
                    <p className="font-semibold text-neutral-900">{t(labelKey as any)}</p>
                    <p className="text-sm text-neutral-500 mt-0.5">{t(descKey as any)}</p>
                  </div>
                  {spaceType === value && (
                    <Check className="ms-auto h-5 w-5 text-indigo-600 shrink-0" />
                  )}
                </button>
              </HoverCard>
            ))}
          </div>
        );
      }

      case 3:
        return (
          <div className="space-y-5">
            <LocationMapPicker
              initialLat={lat || null}
              initialLng={lng || null}
              onLocationSelect={(data) => {
                if (data.address) { setAddress(data.address); handleFieldChange('address', data.address, setAddress); }
                if (data.city) { setCity(data.city); handleFieldChange('city', data.city, setCity); }
                if (data.country) { setCountry(data.country); handleFieldChange('country', data.country, setCountry); }
                setLat(data.lat);
                setLng(data.lng);
              }}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={t('address')}
                placeholder="123 Main St"
                value={address}
                onChange={(e) => handleFieldChange('address', e.target.value, setAddress)}
                onBlur={(e) => handleFieldBlur('address', e.target.value)}
                error={touched.address ? errors.address : ''}
              />
              <Input
                label={t('city')}
                placeholder="Dubai"
                value={city}
                onChange={(e) => handleFieldChange('city', e.target.value, setCity)}
                onBlur={(e) => handleFieldBlur('city', e.target.value)}
                error={touched.city ? errors.city : ''}
              />
            </div>
            <Input
              label={t('country')}
              placeholder="UAE"
              value={country}
              onChange={(e) => handleFieldChange('country', e.target.value, setCountry)}
              onBlur={(e) => handleFieldBlur('country', e.target.value)}
              error={touched.country ? errors.country : ''}
            />
          </div>
        );

      case 4:
        return (
          <div className="max-w-md">
            {/* Calendar sync obligation */}
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <span className="text-xl shrink-0">📅</span>
              <div>
                <p className="text-sm font-semibold text-amber-900 mb-1">{t('calendarObligationTitle' as any)}</p>
                <p className="text-xs text-amber-800 leading-relaxed">
                  {t('calendarObligationDesc' as any)}
                </p>
              </div>
            </div>
            <CounterField label={t('counterGuests' as any)} value={maxGuests} onChange={setMaxGuests} min={1} />
            <CounterField label={t('counterBedrooms' as any)} value={bedrooms} onChange={setBedrooms} min={0} />
            <CounterField label={t('counterBeds' as any)} value={beds} onChange={setBeds} min={1} />
            <CounterField label={t('counterBathrooms' as any)} value={bathrooms} onChange={setBathrooms} min={1} />
            <CounterField label={t('counterMinNights' as any)} value={minNights} onChange={setMinNights} min={1} max={30} />
          </div>
        );

      case 5: {
        const STANDOUT_OPTIONS = [
          // category selection is shown above
          { label: 'Panoramic views', labelAr: 'إطلالات بانورامية', emoji: '🌅' },
          { label: 'Private pool', labelAr: 'مسبح خاص', emoji: '🏊' },
          { label: 'Rooftop terrace', labelAr: 'تراس علوي', emoji: '🏙️' },
          { label: 'Garden & outdoor space', labelAr: 'حديقة وفضاء خارجي', emoji: '🌳' },
          { label: 'Waterfront / beach access', labelAr: 'واجهة بحرية / وصول للشاطئ', emoji: '🏖️' },
          { label: 'Smart home features', labelAr: 'ميزات المنزل الذكي', emoji: '🏠' },
          { label: 'Luxury furnishings', labelAr: 'أثاث فاخر', emoji: '✨' },
          { label: 'Private parking', labelAr: 'موقف خاص', emoji: '🅿️' },
          { label: 'Pet-friendly', labelAr: 'مناسب للحيوانات الأليفة', emoji: '🐕' },
          { label: 'EV charger', labelAr: 'شاحن سيارات كهربائية', emoji: '🔌' },
          { label: 'Home cinema / projector', labelAr: 'سينما منزلية / بروجيكتور', emoji: '🎬' },
          { label: 'Game room', labelAr: 'غرفة ألعاب', emoji: '🎮' },
          { label: 'Hot tub / jacuzzi', labelAr: 'حوض ساخن / جاكوزي', emoji: '🛁' },
          { label: 'Fireplace', labelAr: 'مدفأة', emoji: '🔥' },
          { label: '24/7 concierge', labelAr: 'كونسيرج 24/7', emoji: '🛎️' },
          { label: 'Self check-in', labelAr: 'تسجيل وصول ذاتي', emoji: '🔑' },
        ];

        const selectedStandouts = new Set(standoutNote ? standoutNote.split('\n').filter(Boolean) : []);

        const toggleStandout = (label: string) => {
          const next = new Set(selectedStandouts);
          next.has(label) ? next.delete(label) : next.add(label);
          setStandoutNote(Array.from(next).join('\n'));
        };

        return (
          <div className="space-y-6">
            {/* Category picker */}
            <div>
              <p className="text-sm font-semibold text-neutral-900 mb-3">
                {t('selectCategoryLabel' as any)} <span className="text-rose-500">*</span>
              </p>
              {categories && categories.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {categories.map((cat) => (
                    <HoverCard key={cat.id}>
                      <button
                        type="button"
                        onClick={() => setCategoryId(cat.id)}
                        className={cn(
                          'flex flex-col items-center gap-2 rounded-2xl border-2 p-4 text-center transition-all hover:border-neutral-400 w-full',
                          categoryId === cat.id ? 'border-indigo-600 bg-indigo-50' : 'border-neutral-200'
                        )}
                      >
                        <span className="text-2xl">{cat.icon}</span>
                        <span className="text-xs font-medium text-neutral-900 leading-tight">{isRTL ? (cat.nameAr || cat.name) : cat.name}</span>
                        {categoryId === cat.id && <Check className="h-4 w-4 text-indigo-600" />}
                      </button>
                    </HoverCard>
                  ))}
                </div>
              ) : (
                <div className="h-24 animate-pulse rounded-xl bg-neutral-100" />
              )}
            </div>

            {/* Standout highlights (optional) */}
            <div>
              <p className="text-sm font-semibold text-neutral-900 mb-3">{t('highlightOptionalLabel' as any)}</p>
              <div className="grid grid-cols-2 gap-3">
                {STANDOUT_OPTIONS.map(({ label, labelAr, emoji }) => {
                  const selected = selectedStandouts.has(label);
                  return (
                    <HoverCard key={label}>
                      <button
                        type="button"
                        onClick={() => toggleStandout(label)}
                        className={cn(
                          'flex items-center gap-3 rounded-xl border-2 p-4 text-start transition-all hover:border-neutral-400 w-full',
                          selected ? 'border-indigo-600 bg-indigo-50' : 'border-neutral-200'
                        )}
                      >
                        <span className="text-xl">{emoji}</span>
                        <span className="text-sm font-medium text-neutral-900 flex-1">{isRTL ? labelAr : label}</span>
                        {selected && <Check className="ms-auto h-4 w-4 text-indigo-600 shrink-0" />}
                      </button>
                    </HoverCard>
                  );
                })}
              </div>
            </div>
          </div>
        );
      }

      case 6:
        return (
          <div>
            {amenities && amenities.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {amenities.map((amenity) => {
                  const selected = selectedAmenities.includes(amenity.id);
                  return (
                    <HoverCard key={amenity.id} className="h-full">
                      <button
                        onClick={() =>
                          setSelectedAmenities((prev) =>
                            selected
                              ? prev.filter((id) => id !== amenity.id)
                              : [...prev, amenity.id]
                          )
                        }
                        className={cn(
                          'flex flex-col items-center justify-center gap-2 rounded-xl border-2 p-3 text-center transition-all hover:border-neutral-400 w-full min-h-[5.5rem]',
                          selected ? 'border-indigo-600 bg-indigo-50' : 'border-neutral-200'
                        )}
                      >
                        <span className="text-2xl leading-none">{AMENITY_ICON_MAP[amenity.icon] ?? amenity.icon ?? '✨'}</span>
                        <span className="text-xs font-medium text-neutral-900 leading-tight line-clamp-2">{isRTL ? (amenity.nameAr || amenity.name) : amenity.name}</span>
                        {selected && <Check className="h-3.5 w-3.5 text-indigo-600 shrink-0" />}
                      </button>
                    </HoverCard>
                  );
                })}
              </div>
            ) : (
              <p className="text-neutral-500">Loading amenities...</p>
            )}
          </div>
        );

      case 7:
        return (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handlePhotosChange}
            />

            {photos.length === 0 ? (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-neutral-300 rounded-2xl hover:border-neutral-500 transition-colors"
              >
                <Upload className="h-10 w-10 text-neutral-300 mb-3" />
                <p className="text-base font-medium text-neutral-700">{t('uploadPhotosLabel' as any)}</p>
                <p className="text-sm text-neutral-400 mt-1">{t('uploadPhotosDragDrop' as any)}</p>
                <p className="text-xs text-neutral-400 mt-2">{t('uploadPhotosMinimum' as any)}</p>
              </button>
            ) : (
              <div>
                <DndContext
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                  onDragStart={(event) => setActivePhotoId(event.active.id as string)}
                >
                  <SortableContext items={photos.map((p) => p.id)} strategy={rectSortingStrategy}>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
                      {photos.map((photo, idx) => (
                        <SortablePhoto key={photo.id} photo={photo} index={idx} />
                      ))}

                      {/* Add More Button */}
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-neutral-300 rounded-xl hover:border-neutral-500 transition-colors"
                      >
                        <Upload className="h-6 w-6 text-neutral-300 mb-1" />
                        <span className="text-xs text-neutral-400">{t('uploadPhotosAddMore' as any)}</span>
                      </button>
                    </div>
                  </SortableContext>

                  <DragOverlay>
                    {activePhotoId ? (
                      <div className="aspect-square rounded-xl overflow-hidden shadow-2xl ring-2 ring-indigo-600 opacity-90">
                        <Image
                          src={photos.find((p) => p.id === activePhotoId)?.preview ?? ''}
                          alt="Dragging"
                          width={200}
                          height={200}
                          className="object-cover w-full h-full"
                        />
                      </div>
                    ) : null}
                  </DragOverlay>
                </DndContext>

                {photos.length < 5 && (
                  <p className="text-sm text-orange-500">
                    {isRTL
                      ? `أضف ${5 - photos.length} ${5 - photos.length > 1 ? t('wizardPhotoAddMoreWarningPlural' as any) : t('wizardPhotoAddMoreWarning' as any)}`
                      : `Add ${5 - photos.length} more photo${5 - photos.length > 1 ? 's' : ''} to continue`
                    }
                  </p>
                )}
                <p className="text-xs text-neutral-500 mt-3">
                  💡 {t('wizardPhotoDragTip' as any)}
                </p>
              </div>
            )}
          </div>
        );

      case 8:
        return (
          <div className="space-y-4">
            <Input
              label={t('listingTitle')}
              placeholder="e.g. Cozy beachfront villa with amazing views"
              value={title}
              onChange={(e) => handleFieldChange('title', e.target.value, setTitle)}
              onBlur={(e) => handleFieldBlur('title', e.target.value)}
              error={touched.title ? errors.title : ''}
              hint={`${title.length}/32 characters`}
              rightIcon={
                touched.title && !errors.title && title.length >= 3 ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : undefined
              }
            />
          </div>
        );

      case 9:
        return (
          <div className="space-y-4">
            <Textarea
              label={t('wizardDescriptionLabel' as any)}
              placeholder={t('wizardDescriptionPlaceholder' as any)}
              rows={8}
              value={description}
              onChange={(e) => handleFieldChange('description', e.target.value, setDescription)}
              onBlur={(e) => handleFieldBlur('description', e.target.value)}
              error={touched.description ? errors.description : ''}
              hint={isRTL
                ? `${description.length} ${t('wizardDescriptionChars' as any)} ${description.length >= 50 ? '✓' : `(${50 - description.length} ${t('wizardDescriptionMoreNeeded' as any)})`}`
                : `${description.length} characters ${description.length >= 50 ? '✓' : `(${50 - description.length} more needed)`}`
              }
            />

            {/* Description Helper */}
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 space-y-3">
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">{t('descriptionHelperTitle' as any)}</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { emoji: '🌊', text: 'Our place offers a stunning view that guests love.', textAr: 'تقدم وحدتنا إطلالة رائعة يحبها الضيوف.' },
                  { emoji: '🏠', text: 'A cozy and well-furnished space perfect for families.', textAr: 'مساحة مريحة ومؤثثة جيدًا مثالية للعائلات.' },
                  { emoji: '📍', text: 'Located in a prime area, close to restaurants and shops.', textAr: 'تقع في موقع مميز بالقرب من المطاعم والمحلات.' },
                  { emoji: '🅿️', text: 'Free private parking is available on site.', textAr: 'يتوفر موقف سيارات خاص مجاني في الموقع.' },
                  { emoji: '🌿', text: 'Enjoy a peaceful and quiet neighborhood.', textAr: 'استمتع بحي هادئ ومريح.' },
                  { emoji: '🏖️', text: 'Just a short walk to the beach.', textAr: 'على بُعد دقائق مشيًا من الشاطئ.' },
                  { emoji: '🛏️', text: 'Freshly cleaned linens and towels are provided.', textAr: 'تُوفَّر ملاءات ومناشف نظيفة.' },
                  { emoji: '📶', text: 'High-speed Wi-Fi available throughout the property.', textAr: 'إنترنت واي فاي عالي السرعة في جميع أنحاء العقار.' },
                  { emoji: '❄️', text: 'Fully air-conditioned for your comfort.', textAr: 'تكييف هواء كامل لراحتك.' },
                  { emoji: '🍳', text: 'A fully equipped kitchen for preparing your own meals.', textAr: 'مطبخ مجهز بالكامل لإعداد وجباتك.' },
                ].map((item) => {
                  const displayText = isRTL ? item.textAr : item.text;
                  const insertText = isRTL ? item.textAr : item.text;
                  return (
                    <button
                      key={item.text}
                      type="button"
                      onClick={() => {
                        const separator = description && !description.endsWith(' ') && !description.endsWith('\n') ? ' ' : '';
                        handleFieldChange('description', description + separator + insertText, setDescription);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-700 hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-700 transition-colors shadow-sm"
                    >
                      <span>{item.emoji}</span>
                      <span>{displayText.slice(0, 40)}{displayText.length > 40 ? '…' : ''}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-neutral-400">{t('descriptionHelperTip' as any)}</p>
            </div>
          </div>
        );

      case 10: {
        const HOUSE_RULES = [
          { key: 'no_smoking', label: 'No smoking', labelAr: 'ممنوع التدخين', emoji: '🚭', stateKey: 'allowsSmoking' as const, inverted: true },
          { key: 'no_parties', label: 'No parties or events', labelAr: 'ممنوع الحفلات أو الفعاليات', emoji: '🎉', stateKey: 'allowsParties' as const, inverted: true },
          { key: 'no_pets', label: 'No pets', labelAr: 'ممنوع الحيوانات الأليفة', emoji: '🐾', stateKey: null, inverted: true },
          { key: 'children_allowed', label: 'Suitable for children (2-12)', labelAr: 'مناسب للأطفال (2-12)', emoji: '👶', stateKey: 'allowsChildren' as const, inverted: false },
          { key: 'quiet_hours', label: 'Quiet hours (10 PM – 8 AM)', labelAr: 'ساعات هدوء (10 م – 8 ص)', emoji: '🤫' },
          { key: 'no_shoes', label: 'No shoes inside', labelAr: 'ممنوع الأحذية داخل المنزل', emoji: '👟' },
          { key: 'no_unregistered', label: 'No unregistered guests', labelAr: 'ممنوع الضيوف غير المسجلين', emoji: '🚷' },
          { key: 'id_required', label: 'Government ID required at check-in', labelAr: 'هوية حكومية مطلوبة عند تسجيل الوصول', emoji: '🪪' },
        ];

        const ruleSet = new Set(houseRules ? houseRules.split('\n').filter(Boolean) : []);

        const toggleRule = (label: string) => {
          const next = new Set(ruleSet);
          next.has(label) ? next.delete(label) : next.add(label);
          setHouseRules(Array.from(next).join('\n'));
        };

        return (
          <div className="space-y-6">
            {/* House rules checkboxes */}
            <div>
              <p className="text-sm font-medium text-neutral-700 mb-3">{t('houseRulesLabel' as any)}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {HOUSE_RULES.map(({ key, label, labelAr, emoji, stateKey, inverted }) => {
                  const checked = stateKey
                    ? (inverted
                      ? (stateKey === 'allowsSmoking' ? !allowsSmoking : stateKey === 'allowsParties' ? !allowsParties : false)
                      : (stateKey === 'allowsChildren' ? allowsChildren : false))
                    : ruleSet.has(label);

                  const handleToggle = () => {
                    if (stateKey === 'allowsSmoking') setAllowsSmoking((v) => !v);
                    else if (stateKey === 'allowsParties') setAllowsParties((v) => !v);
                    else if (stateKey === 'allowsChildren') setAllowsChildren((v) => !v);
                    else toggleRule(label);
                  };

                  return (
                    <HoverCard key={key}>
                      <button
                        type="button"
                        onClick={handleToggle}
                        className={cn(
                          'flex items-center gap-3 rounded-xl border-2 p-4 text-start transition-all hover:border-neutral-400 w-full',
                          checked ? 'border-indigo-600 bg-indigo-50' : 'border-neutral-200'
                        )}
                      >
                        <span className="text-xl">{emoji}</span>
                        <span className="text-sm font-medium text-neutral-900 flex-1">{isRTL ? (labelAr ?? label) : label}</span>
                        {checked && <Check className="h-4 w-4 text-indigo-600 shrink-0" />}
                      </button>
                    </HoverCard>
                  );
                })}
              </div>
            </div>

            {/* Check-in / check-out times */}
            <div className="grid grid-cols-2 gap-4">
              <Select
                label={t('checkInTime')}
                value={checkInTime}
                onChange={(v) => setCheckInTime(v)}
                options={CHECK_TIMES.map((t) => ({ value: t, label: t }))}
              />
              <Select
                label={t('checkOutTime')}
                value={checkOutTime}
                onChange={(v) => setCheckOutTime(v)}
                options={CHECK_TIMES.map((t) => ({ value: t, label: t }))}
              />
            </div>

            {/* Cancellation policy */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-3">
                {t('cancellationPolicy')}
              </label>
              <div className="space-y-3">
                {([
                  { value: 'flexible', icon: '🟢', color: 'emerald' },
                  { value: 'moderate', icon: '🟡', color: 'amber' },
                  { value: 'strict', icon: '🔴', color: 'rose' },
                ] as const).map((policy) => {
                  const vc = (policy.value.charAt(0).toUpperCase() + policy.value.slice(1)) as string;
                  const isSelected = cancellationPolicy === policy.value;
                  return (
                    <button
                      key={policy.value}
                      type="button"
                      onClick={() => setCancellationPolicy(policy.value)}
                      className={cn(
                        'w-full text-start rounded-2xl border-2 p-5 transition-all',
                        isSelected ? 'border-indigo-600 bg-indigo-50' : 'border-neutral-200 hover:border-neutral-400'
                      )}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{policy.icon}</span>
                          <p className="font-semibold text-neutral-900 text-base">{t(`editCancel${vc}` as any)}</p>
                          <span className={cn(
                            'rounded-full px-2.5 py-0.5 text-xs font-medium',
                            policy.color === 'emerald' && 'bg-emerald-100 text-emerald-700',
                            policy.color === 'amber' && 'bg-amber-100 text-amber-700',
                            policy.color === 'rose' && 'bg-rose-100 text-rose-700',
                          )}>
                            {t(`editCancel${vc}Badge` as any)}
                          </span>
                        </div>
                        {isSelected && <Check className="h-5 w-5 text-indigo-600 shrink-0" />}
                      </div>
                      <ul className="space-y-1.5 text-sm">
                        <li className="flex items-start gap-2 text-neutral-700">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                          {t(`editCancel${vc}FreeWindow` as any)}
                        </li>
                        <li className="flex items-start gap-2 text-neutral-700">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                          {t(`editCancel${vc}PartialWindow` as any)}
                        </li>
                        <li className="flex items-start gap-2 text-neutral-700">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                          {t(`editCancel${vc}NoRefund` as any)}
                        </li>
                      </ul>
                      <p className="mt-2.5 text-xs text-neutral-500 italic">{t(`editCancel${vc}BestFor` as any)}</p>
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-xs text-neutral-400">
                {t('editCancelDisclaimer' as any)}
              </p>
            </div>
          </div>
        );
      }

      case 11:
        return (
          <div className="space-y-4">
            <p className="text-sm text-neutral-500">{t('wizardBookingHint' as any)}</p>

            {/* Approve first 3 bookings — Recommended */}
            <button
              type="button"
              onClick={() => { setBookingMode('approve_first_three'); setInstantBook(false); }}
              className={cn(
                'w-full text-start rounded-2xl border-2 p-5 transition-all',
                bookingMode === 'approve_first_three'
                  ? 'border-indigo-600 bg-indigo-50'
                  : 'border-neutral-200 hover:border-neutral-400'
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">📅</span>
                    <p className="font-semibold text-neutral-900">{t('wizardApproveFirstTitle' as any)}</p>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                      {t('editBmApproveFirstBadge' as any)}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-500">
                    {t('wizardApproveFirstDesc' as any)}
                  </p>
                </div>
                {bookingMode === 'approve_first_three' && (
                  <Check className="h-5 w-5 text-indigo-600 shrink-0 mt-1" />
                )}
              </div>
            </button>

            {/* Always Approve */}
            <button
              type="button"
              onClick={() => { setBookingMode('always_approve'); setInstantBook(false); }}
              className={cn(
                'w-full text-start rounded-2xl border-2 p-5 transition-all',
                bookingMode === 'always_approve'
                  ? 'border-indigo-600 bg-indigo-50'
                  : 'border-neutral-200 hover:border-neutral-400'
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">✅</span>
                    <p className="font-semibold text-neutral-900">{t('wizardAlwaysApproveTitle' as any)}</p>
                  </div>
                  <p className="text-sm text-neutral-500">
                    {t('wizardAlwaysApproveDesc' as any)}
                  </p>
                </div>
                {bookingMode === 'always_approve' && (
                  <Check className="h-5 w-5 text-indigo-600 shrink-0 mt-1" />
                )}
              </div>
            </button>

            {/* Use Instant Book */}
            <button
              type="button"
              onClick={() => { setBookingMode('instant_book'); setInstantBook(true); }}
              className={cn(
                'w-full text-start rounded-2xl border-2 p-5 transition-all',
                bookingMode === 'instant_book'
                  ? 'border-indigo-600 bg-indigo-50'
                  : 'border-neutral-200 hover:border-neutral-400'
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">⚡</span>
                    <p className="font-semibold text-neutral-900">{t('wizardInstantBookTitle' as any)}</p>
                  </div>
                  <p className="text-sm text-neutral-500">{t('wizardInstantBookDesc' as any)}</p>
                </div>
                {bookingMode === 'instant_book' && (
                  <Check className="h-5 w-5 text-indigo-600 shrink-0 mt-1" />
                )}
              </div>
            </button>
          </div>
        );

      case 12:
        return (
          <div className="space-y-8">
            {/* Big price display */}
            <div className="flex flex-col items-center gap-5 py-4">
              <div className="flex items-center gap-4">
                <button type="button" onClick={() => handleFieldChange('price', Math.max(100, price - 50), setPrice)}
                  className="h-12 w-12 rounded-full border-2 border-neutral-300 text-2xl font-light text-neutral-600 hover:border-indigo-600 hover:text-indigo-600 transition-colors flex items-center justify-center">−</button>
                <div className="flex items-start">
                  <span className="mt-3 text-2xl font-medium text-neutral-500">EGP</span>
                  <span className="text-7xl font-semibold text-neutral-900 tabular-nums leading-none">{price}</span>
                </div>
                <button type="button" onClick={() => handleFieldChange('price', Math.min(500000, price + 50), setPrice)}
                  className="h-12 w-12 rounded-full border-2 border-neutral-300 text-2xl font-light text-neutral-600 hover:border-indigo-600 hover:text-indigo-600 transition-colors flex items-center justify-center">+</button>
              </div>
              <p className="text-sm text-neutral-500">{t('wizardPerNight' as any)}</p>
              {touched.price && errors.price && (<p className="text-xs text-red-600">{errors.price}</p>)}
            </div>

            {/* Slider */}
            <div className="px-2">
              <input type="range" min={100} max={50000} step={50} value={Math.min(price, 50000)}
                onChange={(e) => handleFieldChange('price', Number(e.target.value), setPrice)}
                className="w-full accent-indigo-600" />
              <div className="flex justify-between text-xs text-neutral-400 mt-1">
                <span>EGP 100</span><span>EGP 50,000+</span>
              </div>
            </div>

            {/* Quick preset chips */}
            <div className="flex flex-wrap gap-2 justify-center">
              {[500, 750, 1000, 1500, 2000, 3000].map((p) => (
                <button key={p} type="button" onClick={() => handleFieldChange('price', p, setPrice)}
                  className={cn('rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
                    price === p ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-neutral-300 text-neutral-600 hover:border-neutral-600')}>
                  EGP {p}
                </button>
              ))}
            </div>

            {/* Earnings estimate */}
            <div className="rounded-2xl bg-neutral-50 border border-neutral-100 p-5">
              <p className="text-sm font-semibold text-neutral-900 mb-3">{t('wizardEarningsEstimate' as any)}</p>
              <div className="flex justify-between text-sm py-1.5">
                <span className="text-neutral-500">{price} {t('wizardEarningsNightsLabel' as any)}</span>
                <span className="text-neutral-700">EGP {(price * 5).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm py-1.5 border-t border-neutral-200 mt-1 pt-2.5 font-semibold">
                <span className="text-neutral-900">{t('wizardEarningsTotal' as any)}</span>
                <span className="text-neutral-900">EGP {(price * 5).toLocaleString()}</span>
              </div>
              <p className="text-xs text-neutral-400 mt-2">{t('wizardEarningsNote' as any)}</p>
            </div>
          </div>
        );

      case 13: {
        const weekendMultipliers = [
          { label: 'Same as base', labelAr: 'مماثل للأساسي', pct: 0 },
          { label: '+10%', pct: 10 },
          { label: '+15%', pct: 15 },
          { label: '+20%', pct: 20 },
          { label: '+25%', pct: 25 },
          { label: '+30%', pct: 30 },
          { label: '+50%', pct: 50 },
        ];
        const activePct = weekendPrice === price ? 0 : Math.round(((weekendPrice - price) / price) * 100);
        return (
          <div className="space-y-8">
            {/* Big price display */}
            <div className="flex flex-col items-center gap-5 py-4">
              <p className="text-sm font-medium text-neutral-500 uppercase tracking-widest">{t('wizardWeekendFriSat' as any)}</p>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setWeekendPrice((v) => Math.max(price, v - 50))}
                  className="h-12 w-12 rounded-full border-2 border-neutral-300 text-2xl font-light text-neutral-600 hover:border-indigo-600 hover:text-indigo-600 transition-colors flex items-center justify-center"
                >
                  −
                </button>
                <div className="flex items-start">
                  <span className="mt-3 text-2xl font-medium text-neutral-500">EGP</span>
                  <span className="text-7xl font-semibold text-neutral-900 tabular-nums leading-none">{weekendPrice}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setWeekendPrice((v) => Math.min(500000, v + 50))}
                  className="h-12 w-12 rounded-full border-2 border-neutral-300 text-2xl font-light text-neutral-600 hover:border-indigo-600 hover:text-indigo-600 transition-colors flex items-center justify-center"
                >
                  +
                </button>
              </div>
              {weekendPrice > price && (
                <p className="text-sm text-emerald-600 font-medium">+{Math.round(((weekendPrice - price) / price) * 100)}% {t('wizardWeekendAboveBase' as any)}</p>
              )}
              {weekendPrice === price && (
                <p className="text-sm text-neutral-400">{t('wizardWeekendSameAsBase' as any)}</p>
              )}
            </div>

            {/* Slider */}
            <div className="px-2">
              <input
                type="range"
                min={price}
                max={Math.round(price * 2)}
                step={5}
                value={weekendPrice}
                onChange={(e) => setWeekendPrice(Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
              <div className="flex justify-between text-xs text-neutral-400 mt-1">
                <span>EGP {price} (base)</span>
                <span>EGP {Math.round(price * 2)}</span>
              </div>
            </div>

            {/* Quick multiplier chips */}
            <div className="grid grid-cols-4 gap-2">
              {weekendMultipliers.map(({ label, labelAr, pct }) => {
                const targetPrice = Math.round(price * (1 + pct / 100));
                const isActive = activePct === pct || (pct === 0 && weekendPrice === price);
                return (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setWeekendPrice(targetPrice)}
                    className={cn(
                      'rounded-xl border p-3 text-center transition-colors',
                      isActive
                        ? 'border-indigo-600 bg-indigo-600 text-white'
                        : 'border-neutral-200 hover:border-neutral-400'
                    )}
                  >
                    <p className={cn('text-sm font-semibold', isActive ? 'text-white' : 'text-neutral-900')}>{pct === 0 ? (isRTL ? (labelAr ?? label) : label) : label}</p>
                    <p className={cn('text-xs mt-0.5', isActive ? 'text-neutral-300' : 'text-neutral-500')}>EGP {targetPrice}</p>
                  </button>
                );
              })}
            </div>

          {/* Fee breakdown note for weekend price */}
          <div className="rounded-2xl bg-neutral-50 border border-neutral-100 p-4">
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-2">{t('wizardWeekendFeeTitle' as any)}</p>
            <div className="flex justify-between text-sm py-1">
              <span className="text-neutral-500">{t('wizardWeekendYourPrice' as any)}</span>
              <span className="text-neutral-700">EGP {weekendPrice}</span>
            </div>
            <div className="flex justify-between text-sm py-1 border-t border-neutral-200 mt-1 pt-2 font-semibold">
              <span className="text-neutral-900">{t('wizardWeekendYouReceive' as any)}</span>
              <span className="text-neutral-900">EGP {weekendPrice}</span>
            </div>
            <div className="flex justify-between text-sm py-1 border-t border-neutral-200 mt-1 pt-2">
              <span className="text-neutral-500">{t('wizardWeekendGuestPays' as any)}</span>
              <span className="text-neutral-700 font-medium">EGP {Math.round(weekendPrice * 1.05)}</span>
            </div>
          </div>
          </div>
        );
      }

      case 14: {
        const WEEKLY_OPTS = [0, 5, 10, 15, 20, 25];
        const MONTHLY_OPTS = [0, 10, 15, 20, 25, 30];
        const LAST_MINUTE_OPTS = [0, 5, 10, 15, 20];
        return (
          <div className="space-y-8">
            {/* New listing promotion */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600 mb-3">
                {t('wizardNewListingPromoHint' as any)}
              </p>
              <button
                type="button"
                onClick={() => setNewListingPromoEnabled((v) => !v)}
                className={cn(
                  'w-full flex items-center gap-4 rounded-2xl border-2 p-5 text-start transition-all',
                  newListingPromoEnabled
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-neutral-200 hover:border-neutral-400'
                )}
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-neutral-300 bg-white">
                  <span className="text-lg font-bold text-neutral-900">20%</span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-neutral-900">{t('wizardNewListingPromoTitle' as any)}</p>
                  <p className="text-sm text-neutral-500 mt-0.5">{t('wizardNewListingPromoOffer' as any)}</p>
                </div>
                <div className={cn(
                  'h-6 w-6 rounded-md border-2 flex items-center justify-center transition-colors',
                  newListingPromoEnabled
                    ? 'border-indigo-600 bg-indigo-600'
                    : 'border-neutral-300'
                )}>
                  {newListingPromoEnabled && <Check className="h-4 w-4 text-white" />}
                </div>
              </button>
            </div>

            {/* Last-minute discount */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-base font-semibold text-neutral-900">{t('wizardLastMinuteTitle' as any)}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">{t('wizardLastMinuteSubtitle' as any)}</p>
                </div>
                {lastMinuteDiscountPercent > 0 && (
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700">
                    {lastMinuteDiscountPercent}% off
                  </span>
                )}
              </div>
              <div className="grid grid-cols-5 gap-2">
                {LAST_MINUTE_OPTS.map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setLastMinuteDiscountPercent(pct)}
                    className={cn(
                      'rounded-xl border py-3 text-center font-semibold text-sm transition-colors',
                      lastMinuteDiscountPercent === pct
                        ? 'border-indigo-600 bg-indigo-600 text-white'
                        : 'border-neutral-200 text-neutral-700 hover:border-neutral-500'
                    )}
                  >
                    {pct === 0 ? t('wizardDiscountNone' as any) : `${pct}%`}
                  </button>
                ))}
              </div>
              {lastMinuteDiscountPercent > 0 && (
                <p className="mt-2 text-xs text-neutral-500">
                  {isRTL
                    ? `يدفع الضيوف الذين يحجزون خلال 14 يومًا من الوصول ${Math.round(price * (1 - lastMinuteDiscountPercent / 100))} جنيه لكل ليلة`
                    : `Guests who book within 14 days of arrival pay EGP ${Math.round(price * (1 - lastMinuteDiscountPercent / 100))} per night`
                  }
                </p>
              )}
            </div>

            {/* Weekly discount */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-base font-semibold text-neutral-900">{t('wizardWeeklyTitle' as any)}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">{t('wizardWeeklySubtitle' as any)}</p>
                </div>
                {weeklyDiscount > 0 && (
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
                    {weeklyDiscount}% off
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {WEEKLY_OPTS.map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setWeeklyDiscount(pct)}
                    className={cn(
                      'rounded-xl border py-3 text-center font-semibold text-sm transition-colors',
                      weeklyDiscount === pct
                        ? 'border-indigo-600 bg-indigo-600 text-white'
                        : 'border-neutral-200 text-neutral-700 hover:border-neutral-500'
                    )}
                  >
                    {pct === 0 ? t('wizardDiscountNone' as any) : `${pct}%`}
                  </button>
                ))}
              </div>
              {weeklyDiscount > 0 && (
                <p className="mt-2 text-xs text-neutral-500">
                  {isRTL
                    ? `يدفع الضيوف ${Math.round(price * 7 * (1 - weeklyDiscount / 100))} جنيه لأسبوع بدلاً من ${price * 7} جنيه`
                    : `Guests pay EGP ${Math.round(price * 7 * (1 - weeklyDiscount / 100))} for a week instead of EGP ${price * 7}`
                  }
                </p>
              )}
            </div>

            {/* Monthly discount */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-base font-semibold text-neutral-900">{t('wizardMonthlyTitle' as any)}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">{t('wizardMonthlySubtitle' as any)}</p>
                </div>
                {monthlyDiscount > 0 && (
                  <span className="rounded-full bg-neutral-100 px-3 py-1 text-sm font-semibold text-neutral-700">
                    {monthlyDiscount}% off
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {MONTHLY_OPTS.map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setMonthlyDiscount(pct)}
                    className={cn(
                      'rounded-xl border py-3 text-center font-semibold text-sm transition-colors',
                      monthlyDiscount === pct
                        ? 'border-indigo-600 bg-indigo-600 text-white'
                        : 'border-neutral-200 text-neutral-700 hover:border-neutral-500'
                    )}
                  >
                    {pct === 0 ? t('wizardDiscountNone' as any) : `${pct}%`}
                  </button>
                ))}
              </div>
              {monthlyDiscount > 0 && (
                <p className="mt-2 text-xs text-neutral-500">
                  {isRTL
                    ? `يدفع الضيوف ${Math.round(price * 28 * (1 - monthlyDiscount / 100))} جنيه لشهر بدلاً من ${price * 28} جنيه`
                    : `Guests pay EGP ${Math.round(price * 28 * (1 - monthlyDiscount / 100))} for a month instead of EGP ${price * 28}`
                  }
                </p>
              )}
            </div>

            <p className="text-xs text-neutral-400">{t('wizardDiscountsFooter' as any)}</p>

            {/* Fee reminder */}
            <div className="rounded-2xl bg-indigo-50 border border-indigo-100 p-4">
              <p className="text-xs font-semibold text-indigo-700 uppercase tracking-widest mb-1">{t('wizardPricingReminderTitle' as any)}</p>
              <p className="text-xs text-indigo-600 leading-relaxed">
                {isRTL ? (
                  <>
                    تفرض أويكيفو <strong>عمولة 0%</strong> من المضيفين — تحتفظ بـ 100% من سعرك المدرج. يُفرض على الضيوف <strong>رسوم خدمة 5%</strong> فوق سعرك المدرج. على سبيل المثال، بسعرك الأساسي <strong>{price} جنيه/ليلة</strong>، تستلم <strong>{price} جنيه</strong> ويدفع الضيف <strong>{Math.round(price * 1.05)} جنيه</strong>.
                  </>
                ) : (
                  <>
                    Oikivo charges <strong>0% commission</strong> from hosts — you keep 100% of your listed price. Guests are charged a <strong>5% service fee</strong> on top of your listed price. For example, at your base price of <strong>EGP {price}/night</strong>, you receive <strong>EGP {price}</strong> and the guest pays <strong>EGP {Math.round(price * 1.05)}</strong>.
                  </>
                )}
              </p>
            </div>

            {/* Security deposit */}
            <div className="rounded-2xl border border-neutral-100 bg-neutral-50 p-5">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <p className="text-sm font-semibold text-neutral-900">{t('wizardSecurityDepositTitle' as any)}</p>
                  <p className="text-xs text-neutral-500 mt-1">
                    {t('wizardSecurityDepositDesc' as any)}
                  </p>
                </div>
                <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold',
                  securityDeposit > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-200 text-neutral-500')}>
                  {securityDeposit > 0 ? `EGP ${securityDeposit.toLocaleString()}` : t('wizardDiscountNone' as any)}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {[0, 250, 500, 1000, 2000, 3000, 5000].map((amt) => (
                  <button key={amt} type="button" onClick={() => setSecurityDeposit(amt)}
                    className={cn('rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
                      securityDeposit === amt
                        ? 'border-indigo-600 bg-indigo-600 text-white'
                        : 'border-neutral-300 text-neutral-600 hover:border-neutral-600')}>
                    {amt === 0 ? t('wizardDiscountNone' as any) : `EGP ${amt.toLocaleString()}`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      }

      case 15:
        return (
          <div className="space-y-4">
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
              {t('legalDisclaimerText' as any)}
            </div>
            <label className="flex items-start gap-3 cursor-pointer rounded-xl border border-neutral-200 p-4">
              <input
                type="checkbox"
                checked={legalAccepted}
                onChange={(e) => setLegalAccepted(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-neutral-300 text-indigo-600"
              />
              <span className="text-sm text-neutral-800">{t('legalConfirmText' as any)}</span>
            </label>
          </div>
        );

      case 16:
        return (
          <div className="space-y-6">
            {/* Listing Preview Card */}
            <div className="rounded-2xl border border-neutral-200 overflow-hidden bg-white shadow-sm">
              {/* Photo Gallery */}
              {photos.length > 0 && (
                <div className="grid grid-cols-4 grid-rows-2 gap-1 h-64">
                  {/* Cover photo - takes left half */}
                  <div className="relative col-span-2 row-span-2 bg-neutral-200">
                    <Image src={photos[0].preview} alt="Cover" fill className="object-cover" />
                    <div className="absolute top-2 start-2 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white">
                      {t('coverPhotoLabel' as any)}
                    </div>
                  </div>
                  {/* Next 4 photos fill the right side */}
                  {photos.slice(1, 5).map((photo, idx) => (
                    <div key={idx} className="relative bg-neutral-200">
                      <Image src={photo.preview} alt={`Photo ${idx + 2}`} fill className="object-cover" />
                    </div>
                  ))}
                  {/* If fewer than 5 photos, fill empty slots */}
                  {Array.from({ length: Math.max(0, 4 - (photos.length - 1)) }).map((_, idx) => (
                    <div key={`empty-${idx}`} className="bg-neutral-100" />
                  ))}
                </div>
              )}
              {photos.length > 5 && (
                <div className="px-5 pt-2 pb-0">
                  <p className="text-xs text-neutral-500">+{photos.length - 5} more photos</p>
                </div>
              )}
              <div className="p-5 space-y-3">
                <h3 className="font-semibold text-neutral-900 text-lg">{title || 'Your listing'}</h3>
                <p className="text-neutral-500 text-sm">{city}, {country}</p>
                <p className="text-sm text-neutral-700 line-clamp-3">
                  {description?.slice(0, 150)}{description?.length > 150 ? '...' : ''}
                </p>
                <div className="flex flex-wrap gap-3 text-sm text-neutral-700">
                  <span>👤 {maxGuests} guests</span>
                  <span>🛏 {beds} beds</span>
                  <span>🚿 {bathrooms} baths</span>
                  <span>💰 EGP {price}/night</span>
                </div>
              </div>
            </div>

            {/* Review Your Listing Section */}
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-3">{t('reviewListingTitle' as any)}</h3>
              <div className="space-y-3">
                <StepSummaryCard
                  icon="🏠"
                  label={t('stepType' as any)}
                  value={`${t((PROPERTY_KINDS.find((k) => k.value === kind)?.labelKey ?? 'kindHouse') as any)} • ${[...SPACE_TYPES, ...HOTEL_SPACE_TYPES].find((s) => s.value === spaceType)?.labelKey || spaceType}`}
                  onEdit={() => handleStepClick(1)}
                />

                <StepSummaryCard
                  icon="📍"
                  label={t('stepLocation' as any)}
                  value={`${address}, ${city}, ${country}`}
                  onEdit={() => handleStepClick(3)}
                />

                <StepSummaryCard
                  icon="📐"
                  label={t('stepDetails' as any)}
                  value={`${maxGuests} guests • ${bedrooms} bedroom${bedrooms !== 1 ? 's' : ''} • ${beds} bed${beds !== 1 ? 's' : ''} • ${bathrooms} bath${bathrooms !== 1 ? 's' : ''}`}
                  onEdit={() => handleStepClick(4)}
                />

                {categoryId && categories && (
                  <StepSummaryCard
                    icon="🏷️"
                    label={t('category' as any)}
                    value={categories.find((c) => c.id === categoryId)?.name ?? '—'}
                    onEdit={() => handleStepClick(5)}
                  />
                )}

                {selectedAmenities.length > 0 && (
                  <StepSummaryCard
                    icon="🎯"
                    label={t('stepAmenities' as any)}
                    value={`${selectedAmenities.length} amenity${selectedAmenities.length !== 1 ? 'ies' : ''} selected`}
                    onEdit={() => handleStepClick(6)}
                  />
                )}

                <StepSummaryCard
                  icon="📸"
                  label={t('stepPhotos' as any)}
                  value={`${photos.length} photo${photos.length !== 1 ? 's' : ''}`}
                  photos={photos.map((p) => p.preview)}
                  onEdit={() => handleStepClick(7)}
                />

                <StepSummaryCard
                  icon="💰"
                  label={t('stepPrice' as any)}
                  value={`EGP ${price}/night • EGP ${weekendPrice} weekends${weeklyDiscount ? ` • ${weeklyDiscount}% weekly` : ''}${monthlyDiscount ? ` • ${monthlyDiscount}% monthly` : ''}`}
                  onEdit={() => handleStepClick(12)}
                />

                {(weeklyDiscount > 0 || monthlyDiscount > 0) && (
                    <StepSummaryCard
                      icon="🎁"
                      label={t('stepReview' as any)}
                      value={`${weeklyDiscount}% weekly • ${monthlyDiscount}% monthly`}
                      onEdit={() => handleStepClick(14)}
                    />
                  )}

                <StepSummaryCard
                  icon="⚙️"
                  label={t('stepRules' as any)}
                  value={`Check-in: ${checkInTime} • Check-out: ${checkOutTime} • ${cancellationPolicy} cancellation${instantBook ? ' • Instant book' : ''}`}
                  onEdit={() => handleStepClick(10)}
                />
              </div>
            </div>

            {/* Final Confirmation */}
            <div className="rounded-xl border-2 border-neutral-200 bg-neutral-50 p-5">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={kycAccepted}
                  onChange={(e) => setKycAccepted(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-neutral-300 text-indigo-600"
                />
                <div>
                  <p className="text-sm font-semibold text-neutral-900">
                    {t('confirmReadyTitle' as any)}
                  </p>
                  <p className="text-xs text-neutral-600 mt-1">
                    {t('confirmReadyDesc' as any)}
                  </p>
                </div>
              </label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const isNextDisabled = () => {
    if (step === 3 && (!address || !city || !country || errors.address || errors.city || errors.country)) return true;
    if (step === 5 && !categoryId) return true;
    if (step === 7 && photos.length < 5) return true;
    if (step === 8 && (!title || title.trim().length < 3 || errors.title)) return true;
    if (step === 9 && (!description || description.length < 50 || errors.description)) return true;
    if (step === 12 && (price < 10 || !!errors.price)) return true;
    if (step === 13 && (weekendPrice < price || !!errors.weekendPrice)) return true;
    if (step === 15 && !legalAccepted) return true;
    if (step === 16 && !kycAccepted) return true;
    return false;
  };

  const currentStepMeta = translatedSteps[step - 1] ?? translatedSteps[0];
  const direction: 'forward' | 'backward' = step > prevStep ? 'forward' : 'backward';

  return (
    <div className="flex min-h-screen flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* ── Wizard top bar ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 shrink-0 flex items-center justify-between border-b border-neutral-100 bg-white px-4 py-3 sm:px-6">
        <span className="text-sm font-bold text-neutral-800 tracking-tight">Oikivo</span>
        <button
          onClick={handleExitAttempt}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-neutral-600 hover:bg-neutral-100 transition-colors"
        >
          <X className="h-4 w-4" />
          {t('wizardExitBtn' as any)}
        </button>
      </header>

      {/* ── Main layout ─────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0">
        {/* Progress Tracker - Desktop Sidebar (in-flow, not fixed) */}
        <ProgressTracker
          steps={translatedSteps}
          currentStep={step}
          completedSteps={completedSteps}
          onStepClick={handleStepClick}
          className="hidden lg:block"
        />

        {/* Main content area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile Progress Bar */}
          <MobileProgressBar
            steps={translatedSteps}
            currentStep={step}
            completedSteps={completedSteps}
            onStepClick={handleStepClick}
          />

          {/* Main Wizard */}
          <WizardStep
            title={currentStepMeta.title}
            description={currentStepMeta.description}
            currentStep={step}
            totalSteps={TOTAL_STEPS}
            onBack={step > 1 ? handleBack : undefined}
            onNext={handleNext}
            onSaveDraft={saveDraft}
            nextLabel={step === TOTAL_STEPS ? `🎯 ${t('wizardSubmitForReview' as any)}` : undefined}
            nextDisabled={isNextDisabled()}
            isLastStep={step === TOTAL_STEPS}
            isLoading={createListing.isPending || updateListing.isPending || publishListing.isPending || uploadImages.isPending}
            direction={direction}
            showProgressSidebar={true}
          >
            {renderStep()}
          </WizardStep>
        </div>
      </div>

      {/* ── Exit confirmation modal ──────────────────────────────────── */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" dir={isRTL ? 'rtl' : 'ltr'}>
            <h2 className="text-lg font-semibold text-neutral-900">{t('wizardExitTitle' as any)}</h2>
            <p className="mt-2 text-sm text-neutral-500 leading-relaxed">
              {t('wizardExitDesc' as any)}
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <button
                onClick={async () => {
                  await saveDraft();
                  releaseGuardAndLeave(`/${locale}/hosting/listings`);
                }}
                className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
              >
                {t('wizardSaveDraftLeave' as any)}
              </button>
              <button
                onClick={async () => {
                  const pid = propertyIdRef.current ?? propertyId;
                  if (pid) {
                    try { await propertiesApi.deleteListing(pid); } catch { /* silent — draft already gone or network error */ }
                  }
                  releaseGuardAndLeave(`/${locale}/hosting/listings`);
                }}
                className="w-full rounded-xl border border-neutral-200 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                {t('wizardDiscardLeave' as any)}
              </button>
              <button
                onClick={() => setShowExitModal(false)}
                className="text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
              >
                {t('wizardCancelKeepEditing' as any)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
