'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams, useParams, usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useMutation, useQuery } from '@tanstack/react-query';
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
  { slug: 'structure',           title: '🏠 What kind of place is it?',        description: 'Choose the structure type for your listing.' },
  { slug: 'privacy-type',        title: '🔑 What type of place will guests have?', description: 'Set privacy level and space sharing details.' },
  { slug: 'location',            title: '📍 Where is your place located?',      description: 'Add address and map coordinates for guests.' },
  { slug: 'floor-plan',          title: '🛏️ Share your floor plan basics',      description: 'Tell guests about rooms and minimum stay.' },
  { slug: 'stand-out',           title: '🏷️ Category & highlights',             description: 'Choose a category and highlight what makes your place special.' },
  { slug: 'amenities',           title: '🎁 Select amenities',                  description: 'Choose what guests can use during their stay.' },
  { slug: 'photos',              title: '📸 Add photos',                        description: 'Great photos increase conversion and trust.' },
  { slug: 'title',               title: '✍️ Create your listing title',         description: 'Keep it clear, specific, and memorable.' },
  { slug: 'description',         title: '📝 Write your listing description',    description: 'Describe the vibe, layout, and location benefits.' },
  { slug: 'finish-setup',        title: '⚙️ Finish setup details',              description: 'Rules, check-in, and cancellation settings.' },
  { slug: 'instant-book',        title: 'Pick your booking settings',           description: 'You can change this at any time.' },
  { slug: 'price',               title: '💰 Set your price',                    description: 'Configure your rental rate and fees.' },
  { slug: 'weekend-price',       title: '🎉 Set weekend pricing',               description: 'Adjust Friday/Saturday rates if needed.' },
  { slug: 'discount',            title: 'Add discounts',                        description: 'Help your place stand out to get booked faster and earn your first reviews.' },
  { slug: 'legal',               title: '📋 Review legal information',          description: 'Confirm hosting terms and local compliance.' },
  { slug: 'know-your-customer',  title: '🎯 Almost there!',                     description: 'Confirm identity and publishing readiness.' },
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

const PROPERTY_KINDS: { value: PropertyKind; label: string; icon: string }[] = [
  { value: 'house', label: 'House', icon: '🏡' },
  { value: 'villa', label: 'Villa', icon: '🏖️' },
  { value: 'apartment', label: 'Apartment', icon: '🏢' },
  { value: 'hotel', label: 'Hotel', icon: '🏨' },
  { value: 'chalet', label: 'Chalet', icon: '🏔️' },
  { value: 'studio', label: 'Studio', icon: '🎨' },
  { value: 'townhouse', label: 'Townhouse', icon: '🏘️' },
  { value: 'cabin', label: 'Cabin', icon: '🌲' },
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

  // Warn browser on tab close / refresh when wizard is active
  useEffect(() => {
    if (step < 2) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
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
      return;
    }
    try {
      const raw = sessionStorage.getItem(WIZARD_KEY);
      if (!raw) return;
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const publishListing = useMutation({
    mutationFn: (id: number) => propertiesApi.publishListing(String(id)),
    onSuccess: () => {
      clearWizardState();
      toast.success('Submitted for review! Our team will approve your listing shortly. 🎯');
      router.push(`/${locale}/hosting/listings`);
    },
    onError: (error: any) => toast.error(error?.response?.data?.message ?? 'Failed to submit for review'),
  });

  const uploadImages = useMutation({
    mutationFn: ({ id, files }: { id: number; files: File[] }) =>
      propertiesApi.uploadImages(id, files),
    onError: () => toast.error('Failed to upload photos. Please try again.'),
  });

  if (!hasHydrated || !isLoggedIn) return <FullPageSpinner />;

  if (!isHost) {
    return (
      <div className="min-h-[calc(100vh-140px)] flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-2xl rounded-3xl border border-neutral-200 bg-white p-8 sm:p-10">
          <p className="inline-flex rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700">
            Host setup
          </p>
          <h1 className="mt-4 text-3xl font-semibold text-neutral-900">
            Start hosting and create your first listing
          </h1>
          <p className="mt-3 text-neutral-600">
            To publish a home, we need to activate hosting on your account first. This takes one click.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => router.push(`/${locale}/hosting/activation`)}
              className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              Go to activation page
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
      title: 'Email address verified',
      desc: 'Check your inbox for a verification link after signing up.',
      done: emailVerified,
      pending: false,
      ctaLabel: 'Verify email',
      ctaHref: `/${locale}/account/verification`,
    },
    {
      key: 'phone',
      icon: '📱',
      title: 'Phone number verified',
      desc: !phoneAdded
        ? 'Add a phone number in your account settings, then verify it.'
        : 'Enter the code sent to your email to confirm your phone number.',
      done: phoneVerified,
      pending: false,
      ctaLabel: phoneAdded ? 'Verify phone' : 'Add phone number',
      ctaHref: phoneAdded ? `/${locale}/account/verification` : `/${locale}/account`,
    },
    {
      key: 'avatar',
      icon: '📷',
      title: 'Profile photo uploaded',
      desc: 'A clear, well-lit face photo helps guests recognise and trust their host.',
      done: hasAvatar,
      pending: false,
      ctaLabel: 'Add profile photo',
      ctaHref: `/${locale}/account`,
    },
    {
      key: 'id',
      icon: '🪪',
      title: 'Government ID verified by admin',
      desc:
        idStatus === 'pending'
          ? 'Your ID has been submitted and is under review. You will be notified once approved (1–2 business days).'
          : idStatus === 'rejected'
          ? 'Your previous submission was rejected. Please upload a clearer document.'
          : "Upload your passport, national ID, or driver's licence. Admin approval is required before your first listing can go live.",
      done: idStatus === 'approved',
      pending: idStatus === 'pending',
      rejected: idStatus === 'rejected',
      ctaLabel: idStatus === 'rejected' ? 'Re-upload ID' : 'Upload ID',
      ctaHref: `/${locale}/account/verification`,
    },
  ];

  const allDone = gateItems.every((item) => item.done);

  if (!allDone) {
    return (
      <div className="min-h-[calc(100vh-140px)] flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-2xl rounded-3xl border border-brand/20 bg-white p-8 sm:p-10 shadow-lg shadow-brand/5">
          <p className="inline-flex rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
            Required before listing
          </p>
          <h1 className="mt-4 text-2xl font-semibold text-neutral-900">
            Verify your account to start hosting
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            Complete all steps below. Refresh this page once you've finished each one to see your progress.
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
                      {item.pending ? 'View status' : item.ctaLabel}
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
              {gateItems.filter((i) => i.done).length} / {gateItems.length} complete
            </span>
          </div>

          <div className="mt-5">
            <Link
              href={`/${locale}/hosting`}
              className="text-sm font-medium text-brand/70 hover:text-brand transition"
            >
              ← Back to hosting dashboard
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
          if (photos.length < 3) return 'Please upload at least 3 photos';
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
        if (pid) {
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
            } catch { /* upload error already toasted */ }
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
          className="absolute top-2 left-2 flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-neutral-700 shadow hover:bg-white cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <GripVertical className="h-4 w-4" />
        </div>

        {/* Remove Button */}
        <button
          onClick={() => removePhoto(photo.id)}
          className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-neutral-700 shadow hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Cover Badge */}
        {index === 0 && (
          <div className="absolute bottom-2 left-2 rounded-md bg-white/90 px-2 py-1 text-xs font-medium text-neutral-700">
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
            {PROPERTY_KINDS.map(({ value, label, icon }) => (
              <HoverCard key={value}>
                <button
                  onClick={() => setKind(value)}
                  className={cn(
                    'flex flex-col items-center justify-center gap-2 rounded-2xl border-2 p-5 text-center transition-all hover:border-neutral-400 w-full h-28',
                    kind === value ? 'border-indigo-600 bg-indigo-50' : 'border-neutral-200'
                  )}
                >
                  <span className="text-3xl">{icon}</span>
                  <p className="text-sm font-medium text-neutral-900">{label}</p>
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
                    'w-full flex items-start gap-4 rounded-2xl border-2 p-5 text-left transition-all hover:border-neutral-400',
                    spaceType === value ? 'border-indigo-600 bg-indigo-50' : 'border-neutral-200'
                  )}
                >
                  <span className="text-3xl">{icon}</span>
                  <div>
                    <p className="font-semibold text-neutral-900">{t(labelKey as any)}</p>
                    <p className="text-sm text-neutral-500 mt-0.5">{t(descKey as any)}</p>
                  </div>
                  {spaceType === value && (
                    <Check className="ml-auto h-5 w-5 text-indigo-600 shrink-0" />
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
            <CounterField label="Guests" value={maxGuests} onChange={setMaxGuests} min={1} />
            <CounterField label="Bedrooms" value={bedrooms} onChange={setBedrooms} min={0} />
            <CounterField label="Beds" value={beds} onChange={setBeds} min={1} />
            <CounterField label="Bathrooms" value={bathrooms} onChange={setBathrooms} min={1} />
            <CounterField label="Minimum nights" value={minNights} onChange={setMinNights} min={1} max={30} />
          </div>
        );

      case 5: {
        const STANDOUT_OPTIONS = [
          // category selection is shown above
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
                Select a category <span className="text-rose-500">*</span>
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
                        <span className="text-xs font-medium text-neutral-900 leading-tight">{cat.name}</span>
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
              <p className="text-sm font-semibold text-neutral-900 mb-3">Highlight what makes it special (optional)</p>
              <div className="grid grid-cols-2 gap-3">
                {STANDOUT_OPTIONS.map(({ label, emoji }) => {
                  const selected = selectedStandouts.has(label);
                  return (
                    <HoverCard key={label}>
                      <button
                        type="button"
                        onClick={() => toggleStandout(label)}
                        className={cn(
                          'flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all hover:border-neutral-400 w-full',
                          selected ? 'border-indigo-600 bg-indigo-50' : 'border-neutral-200'
                        )}
                      >
                        <span className="text-xl">{emoji}</span>
                        <span className="text-sm font-medium text-neutral-900 flex-1">{label}</span>
                        {selected && <Check className="ml-auto h-4 w-4 text-indigo-600 shrink-0" />}
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
                    <HoverCard key={amenity.id}>
                      <button
                        onClick={() =>
                          setSelectedAmenities((prev) =>
                            selected
                              ? prev.filter((id) => id !== amenity.id)
                              : [...prev, amenity.id]
                          )
                        }
                        className={cn(
                          'flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all hover:border-neutral-400',
                          selected ? 'border-indigo-600 bg-indigo-50' : 'border-neutral-200'
                        )}
                      >
                        <span className="text-xl">{AMENITY_ICON_MAP[amenity.icon] ?? amenity.icon ?? '✨'}</span>
                        <span className="text-sm font-medium text-neutral-900">{amenity.name}</span>
                        {selected && <Check className="ml-auto h-4 w-4 text-indigo-600 shrink-0" />}
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
                <p className="text-base font-medium text-neutral-700">Upload photos</p>
                <p className="text-sm text-neutral-400 mt-1">Drag & drop or click to browse</p>
                <p className="text-xs text-neutral-400 mt-2">Minimum 5 photos required</p>
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
                        <span className="text-xs text-neutral-400">Add more</span>
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
                    Add {5 - photos.length} more photo{5 - photos.length > 1 ? 's' : ''} to continue
                  </p>
                )}
                <p className="text-xs text-neutral-500 mt-3">
                  💡 Tip: Drag photos to reorder. The first photo will be your cover image.
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
              label="Description"
              placeholder="Share what makes your place special. Guests will see this on your listing page."
              rows={8}
              value={description}
              onChange={(e) => handleFieldChange('description', e.target.value, setDescription)}
              onBlur={(e) => handleFieldBlur('description', e.target.value)}
              error={touched.description ? errors.description : ''}
              hint={`${description.length} characters ${
                description.length >= 50 ? '✓' : `(${50 - description.length} more needed)`
              }`}
            />

            {/* Description Helper */}
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 space-y-3">
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Need help? Tap to add to your description</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { emoji: '🌊', text: 'Our place offers a stunning view that guests love.' },
                  { emoji: '🏠', text: 'A cozy and well-furnished space perfect for families.' },
                  { emoji: '📍', text: 'Located in a prime area, close to restaurants and shops.' },
                  { emoji: '🅿️', text: 'Free private parking is available on site.' },
                  { emoji: '🌿', text: 'Enjoy a peaceful and quiet neighborhood.' },
                  { emoji: '🏖️', text: 'Just a short walk to the beach.' },
                  { emoji: '🛏️', text: 'Freshly cleaned linens and towels are provided.' },
                  { emoji: '📶', text: 'High-speed Wi-Fi available throughout the property.' },
                  { emoji: '❄️', text: 'Fully air-conditioned for your comfort.' },
                  { emoji: '🍳', text: 'A fully equipped kitchen for preparing your own meals.' },
                ].map((item) => (
                  <button
                    key={item.text}
                    type="button"
                    onClick={() => {
                      const separator = description && !description.endsWith(' ') && !description.endsWith('\n') ? ' ' : '';
                      handleFieldChange('description', description + separator + item.text, setDescription);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-700 hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-700 transition-colors shadow-sm"
                  >
                    <span>{item.emoji}</span>
                    <span>{item.text.slice(0, 40)}{item.text.length > 40 ? '…' : ''}</span>
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-neutral-400">Tip: Combine several suggestions and edit them to match your property.</p>
            </div>
          </div>
        );

      case 10: {
        const HOUSE_RULES = [
          { key: 'no_smoking', label: 'No smoking', emoji: '🚭', stateKey: 'allowsSmoking' as const, inverted: true },
          { key: 'no_parties', label: 'No parties or events', emoji: '🎉', stateKey: 'allowsParties' as const, inverted: true },
          { key: 'no_pets', label: 'No pets', emoji: '🐾', stateKey: null, inverted: true },
          { key: 'children_allowed', label: 'Suitable for children (2-12)', emoji: '👶', stateKey: 'allowsChildren' as const, inverted: false },
          { key: 'quiet_hours', label: 'Quiet hours (10 PM – 8 AM)', emoji: '🤫' },
          { key: 'no_shoes', label: 'No shoes inside', emoji: '👟' },
          { key: 'no_unregistered', label: 'No unregistered guests', emoji: '🚷' },
          { key: 'id_required', label: 'Government ID required at check-in', emoji: '🪪' },
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
              <p className="text-sm font-medium text-neutral-700 mb-3">House rules</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {HOUSE_RULES.map(({ key, label, emoji, stateKey, inverted }) => {
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
                          'flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all hover:border-neutral-400 w-full',
                          checked ? 'border-indigo-600 bg-indigo-50' : 'border-neutral-200'
                        )}
                      >
                        <span className="text-xl">{emoji}</span>
                        <span className="text-sm font-medium text-neutral-900 flex-1">{label}</span>
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
                  {
                    value: 'flexible',
                    label: 'Flexible',
                    icon: '🟢',
                    color: 'emerald',
                    badge: 'Guest-friendly',
                    freeWindow: 'Full refund up to 24 hours before check-in',
                    partialWindow: 'After that: first night non-refundable, 50% of remaining nights refunded',
                    noRefund: 'No refund after check-in begins',
                    bestFor: 'Best for attracting more bookings and guests who may need flexibility',
                  },
                  {
                    value: 'moderate',
                    label: 'Moderate',
                    icon: '🟡',
                    color: 'amber',
                    badge: 'Balanced',
                    freeWindow: 'Full refund up to 5 days before check-in',
                    partialWindow: '1–4 days before: first night non-refundable, 50% of remaining nights refunded',
                    noRefund: 'No refund on check-in day or after',
                    bestFor: 'Balanced protection — good for most hosts',
                  },
                  {
                    value: 'strict',
                    label: 'Strict',
                    icon: '🔴',
                    color: 'rose',
                    badge: 'Host-protective',
                    freeWindow: 'Full refund up to 14 days before check-in',
                    partialWindow: '7–13 days before: first night non-refundable, 50% of remaining nights refunded',
                    noRefund: 'No refund within 7 days of check-in',
                    bestFor: 'Best for high-demand listings or non-refundable preparation costs',
                  },
                ] as const).map((policy) => {
                  const isSelected = cancellationPolicy === policy.value;
                  return (
                    <button
                      key={policy.value}
                      type="button"
                      onClick={() => setCancellationPolicy(policy.value)}
                      className={cn(
                        'w-full text-left rounded-2xl border-2 p-5 transition-all',
                        isSelected ? 'border-indigo-600 bg-indigo-50' : 'border-neutral-200 hover:border-neutral-400'
                      )}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{policy.icon}</span>
                          <p className="font-semibold text-neutral-900 text-base">{policy.label}</p>
                          <span className={cn(
                            'rounded-full px-2.5 py-0.5 text-xs font-medium',
                            policy.color === 'emerald' && 'bg-emerald-100 text-emerald-700',
                            policy.color === 'amber' && 'bg-amber-100 text-amber-700',
                            policy.color === 'rose' && 'bg-rose-100 text-rose-700',
                          )}>
                            {policy.badge}
                          </span>
                        </div>
                        {isSelected && <Check className="h-5 w-5 text-indigo-600 shrink-0" />}
                      </div>
                      <ul className="space-y-1.5 text-sm">
                        <li className="flex items-start gap-2 text-neutral-700">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                          {policy.freeWindow}
                        </li>
                        <li className="flex items-start gap-2 text-neutral-700">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                          {policy.partialWindow}
                        </li>
                        <li className="flex items-start gap-2 text-neutral-700">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                          {policy.noRefund}
                        </li>
                      </ul>
                      <p className="mt-2.5 text-xs text-neutral-500 italic">{policy.bestFor}</p>
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-xs text-neutral-400">
                ℹ️ Service fee and cleaning fee are never refundable regardless of the policy.
              </p>
            </div>
          </div>
        );
      }

      case 11:
        return (
          <div className="space-y-4">
            <p className="text-sm text-neutral-500">You can change this at any time.</p>

            {/* Approve first 3 bookings — Recommended */}
            <button
              type="button"
              onClick={() => { setBookingMode('approve_first_three'); setInstantBook(false); }}
              className={cn(
                'w-full text-left rounded-2xl border-2 p-5 transition-all',
                bookingMode === 'approve_first_three'
                  ? 'border-indigo-600 bg-indigo-50'
                  : 'border-neutral-200 hover:border-neutral-400'
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">📅</span>
                    <p className="font-semibold text-neutral-900">Approve your first 3 bookings</p>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                      Recommended
                    </span>
                  </div>
                  <p className="text-sm text-neutral-500">
                    Start by reviewing reservation requests, then switch to Instant Book, so guests can book automatically.
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
                'w-full text-left rounded-2xl border-2 p-5 transition-all',
                bookingMode === 'always_approve'
                  ? 'border-indigo-600 bg-indigo-50'
                  : 'border-neutral-200 hover:border-neutral-400'
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">✅</span>
                    <p className="font-semibold text-neutral-900">Always approve manually</p>
                  </div>
                  <p className="text-sm text-neutral-500">
                    Review and approve every reservation request yourself. You&apos;ll have 24 hours to respond to each request.
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
                'w-full text-left rounded-2xl border-2 p-5 transition-all',
                bookingMode === 'instant_book'
                  ? 'border-indigo-600 bg-indigo-50'
                  : 'border-neutral-200 hover:border-neutral-400'
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">⚡</span>
                    <p className="font-semibold text-neutral-900">Use Instant Book</p>
                  </div>
                  <p className="text-sm text-neutral-500">Let guests book automatically without waiting for your approval.</p>
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
              <p className="text-sm text-neutral-500">per night</p>
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
              <p className="text-sm font-semibold text-neutral-900 mb-3">Earnings estimate</p>
              <div className="flex justify-between text-sm py-1.5">
                <span className="text-neutral-500">{price} × 5 nights</span>
                <span className="text-neutral-700">EGP {(price * 5).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm py-1.5 text-red-500">
                <span>Platform commission (5%)</span>
                <span>− EGP {(price * 5 * 0.05).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm py-1.5 border-t border-neutral-200 mt-1 pt-2.5 font-semibold">
                <span className="text-neutral-900">Your estimated earnings</span>
                <span className="text-neutral-900">EGP {(price * 5 * 0.95).toLocaleString()}</span>
              </div>
              <p className="text-xs text-neutral-400 mt-2">A 5% service fee is added to the guest&apos;s total. A 5% commission is deducted from your payout.</p>
            </div>
          </div>
        );

      case 13: {
        const weekendMultipliers = [
          { label: 'Same as base', pct: 0 },
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
              <p className="text-sm font-medium text-neutral-500 uppercase tracking-widest">Fri & Sat price</p>
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
                <p className="text-sm text-emerald-600 font-medium">+{Math.round(((weekendPrice - price) / price) * 100)}% above base price</p>
              )}
              {weekendPrice === price && (
                <p className="text-sm text-neutral-400">Same as your base price</p>
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
              {weekendMultipliers.map(({ label, pct }) => {
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
                    <p className={cn('text-sm font-semibold', isActive ? 'text-white' : 'text-neutral-900')}>{label}</p>
                    <p className={cn('text-xs mt-0.5', isActive ? 'text-neutral-300' : 'text-neutral-500')}>EGP {targetPrice}</p>
                  </button>
                );
              })}
            </div>

          {/* Fee breakdown note for weekend price */}
          <div className="rounded-2xl bg-neutral-50 border border-neutral-100 p-4">
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-2">Fee breakdown (per weekend night)</p>
            <div className="flex justify-between text-sm py-1">
              <span className="text-neutral-500">Your weekend price</span>
              <span className="text-neutral-700">EGP {weekendPrice}</span>
            </div>
            <div className="flex justify-between text-sm py-1 text-red-500">
              <span>Platform commission (5%)</span>
              <span>− EGP {Math.round(weekendPrice * 0.05)}</span>
            </div>
            <div className="flex justify-between text-sm py-1 border-t border-neutral-200 mt-1 pt-2 font-semibold">
              <span className="text-neutral-900">You receive per night</span>
              <span className="text-neutral-900">EGP {Math.round(weekendPrice * 0.95)}</span>
            </div>
            <div className="flex justify-between text-sm py-1 border-t border-neutral-200 mt-1 pt-2">
              <span className="text-neutral-500">Guest pays (incl. 5% service fee)</span>
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
                Help your place stand out to get booked faster and earn your first reviews.
              </p>
              <button
                type="button"
                onClick={() => setNewListingPromoEnabled((v) => !v)}
                className={cn(
                  'w-full flex items-center gap-4 rounded-2xl border-2 p-5 text-left transition-all',
                  newListingPromoEnabled
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-neutral-200 hover:border-neutral-400'
                )}
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-neutral-300 bg-white">
                  <span className="text-lg font-bold text-neutral-900">20%</span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-neutral-900">New listing promotion</p>
                  <p className="text-sm text-neutral-500 mt-0.5">Offer 20% off your first 3 bookings</p>
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
                  <p className="text-base font-semibold text-neutral-900">Last-minute discount</p>
                  <p className="text-xs text-neutral-500 mt-0.5">For stays booked 14 days or less before arrival</p>
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
                    {pct === 0 ? 'None' : `${pct}%`}
                  </button>
                ))}
              </div>
              {lastMinuteDiscountPercent > 0 && (
                <p className="mt-2 text-xs text-neutral-500">
                  Guests who book within 14 days of arrival pay EGP {Math.round(price * (1 - lastMinuteDiscountPercent / 100))} per night
                </p>
              )}
            </div>

            {/* Weekly discount */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-base font-semibold text-neutral-900">Weekly discount</p>
                  <p className="text-xs text-neutral-500 mt-0.5">For stays of 7 nights or more</p>
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
                    {pct === 0 ? 'None' : `${pct}%`}
                  </button>
                ))}
              </div>
              {weeklyDiscount > 0 && (
                <p className="mt-2 text-xs text-neutral-500">
                  Guests pay EGP {Math.round(price * 7 * (1 - weeklyDiscount / 100))} for a week instead of EGP {price * 7}
                </p>
              )}
            </div>

            {/* Monthly discount */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-base font-semibold text-neutral-900">Monthly discount</p>
                  <p className="text-xs text-neutral-500 mt-0.5">For stays of 28 nights or more</p>
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
                    {pct === 0 ? 'None' : `${pct}%`}
                  </button>
                ))}
              </div>
              {monthlyDiscount > 0 && (
                <p className="mt-2 text-xs text-neutral-500">
                  Guests pay EGP {Math.round(price * 28 * (1 - monthlyDiscount / 100))} for a month instead of EGP {price * 28}
                </p>
              )}
            </div>

            <p className="text-xs text-neutral-400">Discounts help increase occupancy and attract more bookings.</p>

            {/* Fee reminder */}
            <div className="rounded-2xl bg-indigo-50 border border-indigo-100 p-4">
              <p className="text-xs font-semibold text-indigo-700 uppercase tracking-widest mb-1">Pricing reminder</p>
              <p className="text-xs text-indigo-600 leading-relaxed">
                Oikivo takes a <strong>5% commission</strong> from your payout per booking. Guests are also charged a <strong>5% service fee</strong> on top of your listed price. For example, at your base price of <strong>EGP {price}/night</strong>, you receive <strong>EGP {Math.round(price * 0.95)}</strong> and the guest pays <strong>EGP {Math.round(price * 1.05)}</strong>.
              </p>
            </div>

            {/* Security deposit */}
            <div className="rounded-2xl border border-neutral-100 bg-neutral-50 p-5">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <p className="text-sm font-semibold text-neutral-900">Security deposit</p>
                  <p className="text-xs text-neutral-500 mt-1">
                    Held during the stay. Returned within 48 h of checkout if no damage is reported.
                  </p>
                </div>
                <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold',
                  securityDeposit > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-200 text-neutral-500')}>
                  {securityDeposit > 0 ? `EGP ${securityDeposit.toLocaleString()}` : 'None'}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {[0, 250, 500, 1000, 2000, 3000, 5000].map((amt) => (
                  <button key={amt} type="button" onClick={() => setSecurityDeposit(amt)}
                    className={cn('rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
                      securityDeposit === amt
                        ? 'border-indigo-600 bg-indigo-600 text-white'
                        : 'border-neutral-300 text-neutral-600 hover:border-neutral-600')}>
                    {amt === 0 ? 'None' : `EGP ${amt.toLocaleString()}`}
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
              By publishing, you confirm this listing follows local laws, building rules, and hosting regulations.
            </div>
            <label className="flex items-start gap-3 cursor-pointer rounded-xl border border-neutral-200 p-4">
              <input
                type="checkbox"
                checked={legalAccepted}
                onChange={(e) => setLegalAccepted(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-neutral-300 text-indigo-600"
              />
              <span className="text-sm text-neutral-800">I confirm that my listing complies with legal and regulatory requirements.</span>
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
                    <div className="absolute top-2 left-2 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white">
                      Cover
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
              <h3 className="text-lg font-semibold text-neutral-900 mb-3">Review your listing details</h3>
              <div className="space-y-3">
                <StepSummaryCard
                  icon="🏠"
                  label="Property Type"
                  value={`${PROPERTY_KINDS.find((k) => k.value === kind)?.label || kind} • ${[...SPACE_TYPES, ...HOTEL_SPACE_TYPES].find((s) => s.value === spaceType)?.labelKey || spaceType}`}
                  onEdit={() => handleStepClick(1)}
                />

                <StepSummaryCard
                  icon="📍"
                  label="Location"
                  value={`${address}, ${city}, ${country}`}
                  onEdit={() => handleStepClick(3)}
                />

                <StepSummaryCard
                  icon="📐"
                  label="Floor Plan"
                  value={`${maxGuests} guests • ${bedrooms} bedroom${bedrooms !== 1 ? 's' : ''} • ${beds} bed${beds !== 1 ? 's' : ''} • ${bathrooms} bath${bathrooms !== 1 ? 's' : ''}`}
                  onEdit={() => handleStepClick(4)}
                />

                {categoryId && categories && (
                  <StepSummaryCard
                    icon="🏷️"
                    label="Category"
                    value={categories.find((c) => c.id === categoryId)?.name ?? '—'}
                    onEdit={() => handleStepClick(5)}
                  />
                )}

                {selectedAmenities.length > 0 && (
                  <StepSummaryCard
                    icon="🎯"
                    label="Amenities"
                    value={`${selectedAmenities.length} amenity${selectedAmenities.length !== 1 ? 'ies' : ''} selected`}
                    onEdit={() => handleStepClick(6)}
                  />
                )}

                <StepSummaryCard
                  icon="📸"
                  label="Photos"
                  value={`${photos.length} photo${photos.length !== 1 ? 's' : ''}`}
                  photos={photos.map((p) => p.preview)}
                  onEdit={() => handleStepClick(7)}
                />

                <StepSummaryCard
                  icon="💰"
                  label="Pricing"
                  value={`EGP ${price}/night • EGP ${weekendPrice} weekends${weeklyDiscount ? ` • ${weeklyDiscount}% weekly` : ''}${monthlyDiscount ? ` • ${monthlyDiscount}% monthly` : ''}`}
                  onEdit={() => handleStepClick(12)}
                />

                {(weeklyDiscount > 0 || monthlyDiscount > 0) && (
                    <StepSummaryCard
                      icon="🎁"
                      label="Discounts"
                      value={`${weeklyDiscount}% weekly • ${monthlyDiscount}% monthly`}
                      onEdit={() => handleStepClick(14)}
                    />
                  )}

                <StepSummaryCard
                  icon="⚙️"
                  label="House Rules & Policies"
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
                    I confirm my listing is ready to publish
                  </p>
                  <p className="text-xs text-neutral-600 mt-1">
                    I confirm identity verification, payout profile setup, and that all guest-facing information is accurate and complies with local laws.
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

  const currentStepMeta = STEP_FLOW[step - 1] ?? STEP_FLOW[0];
  const direction: 'forward' | 'backward' = step > prevStep ? 'forward' : 'backward';

  return (
    <div className="flex min-h-screen flex-col">
      {/* ── Wizard top bar ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 shrink-0 flex items-center justify-between border-b border-neutral-100 bg-white px-4 py-3 sm:px-6">
        <span className="text-sm font-bold text-neutral-800 tracking-tight">Oikivo</span>
        <button
          onClick={handleExitAttempt}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-neutral-600 hover:bg-neutral-100 transition-colors"
        >
          <X className="h-4 w-4" />
          Exit
        </button>
      </header>

      {/* ── Main layout ─────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0">
        {/* Progress Tracker - Desktop Sidebar (in-flow, not fixed) */}
        <ProgressTracker
          steps={STEP_FLOW}
          currentStep={step}
          completedSteps={completedSteps}
          onStepClick={handleStepClick}
          className="hidden lg:block"
        />

        {/* Main content area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile Progress Bar */}
          <MobileProgressBar
            steps={STEP_FLOW}
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
            nextLabel={step === TOTAL_STEPS ? '🎯 Submit for Review' : undefined}
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
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-semibold text-neutral-900">Leave without saving?</h2>
            <p className="mt-2 text-sm text-neutral-500 leading-relaxed">
              Your progress won&apos;t be lost — save as draft to continue later from your listings page.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <button
                onClick={async () => {
                  await saveDraft();
                  releaseGuardAndLeave(`/${locale}/hosting/listings`);
                }}
                className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
              >
                Save as draft &amp; leave
              </button>
              <button
                onClick={() => releaseGuardAndLeave(`/${locale}/hosting/listings`)}
                className="w-full rounded-xl border border-neutral-200 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                Discard &amp; leave
              </button>
              <button
                onClick={() => setShowExitModal(false)}
                className="text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
              >
                Cancel — keep editing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
