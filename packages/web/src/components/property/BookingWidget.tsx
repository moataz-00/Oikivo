'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, differenceInDays, subDays } from 'date-fns';
import { Star, Minus, Plus, ChevronDown, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Separator } from '@/components/ui/Separator';
import { Spinner } from '@/components/ui/Spinner';
import { toast } from '@/components/ui/Toast';
import { DateRangePicker } from './DateRangePicker';
import { propertiesApi, bookingsApi } from '@/lib/api';
import { nightsBetween, formatRating } from '@/lib/utils';
import { getBookingErrorMessage } from '@/lib/booking-errors';
import { useAuth } from '@/hooks/useAuth';
import { useCurrency } from '@/hooks/useCurrency';
import { PaymentMethodModal } from '@/components/payment/PaymentMethodModal';
import type { Property } from '@/types';
import { cn } from '@/lib/utils';

interface BookingWidgetProps {
  property: Property;
  /** Optional controlled check-in — lifted from parent page */
  checkIn?: Date;
  /** Optional controlled check-out — lifted from parent page */
  checkOut?: Date;
  /** Called whenever dates change so parent state stays in sync */
  onDatesChange?: (from: Date | undefined, to: Date | undefined) => void;
}

export function BookingWidget({ property, checkIn: extCheckIn, checkOut: extCheckOut, onDatesChange }: BookingWidgetProps) {
  const t = useTranslations('booking');
  const tProp = useTranslations('property');
  const router = useRouter();
  const locale = useLocale();
  const { isLoggedIn } = useAuth();
  const { formatPrice } = useCurrency();
  const queryClient = useQueryClient();

  const [localCheckIn, setLocalCheckIn] = useState<Date | undefined>();
  const [localCheckOut, setLocalCheckOut] = useState<Date | undefined>();

  // Sync from external controlled props when parent lifts state
  useEffect(() => { if (extCheckIn !== undefined) setLocalCheckIn(extCheckIn); }, [extCheckIn]);
  useEffect(() => { if (extCheckOut !== undefined) setLocalCheckOut(extCheckOut); }, [extCheckOut]);

  const checkIn = extCheckIn ?? localCheckIn;
  const checkOut = extCheckOut ?? localCheckOut;
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGuestPicker, setShowGuestPicker] = useState(false);
  const [pendingBooking, setPendingBooking] = useState<{ id: number; total: number } | null>(null);

  const totalGuests = adults + children;
  const nights = checkIn && checkOut ? differenceInDays(checkOut, checkIn) : 0;
  const avgRatingText = formatRating(property.avgRating);

  const { data: pricePreview, isLoading: priceLoading } = useQuery({
    queryKey: ['price-preview', property.id, checkIn, checkOut, totalGuests],
    queryFn: () =>
      propertiesApi.getPricePreview(
        property.id,
        format(checkIn!, 'yyyy-MM-dd'),
        format(checkOut!, 'yyyy-MM-dd'),
        totalGuests
      ),
    enabled: !!checkIn && !!checkOut && nights > 0,
  });

  const createBooking = useMutation({
    mutationFn: bookingsApi.createBooking,
    onSuccess: (booking) => {
      // Invalidate availability so the booked dates immediately show as taken
      queryClient.invalidateQueries({ queryKey: ['property', property.uuid] });
      queryClient.invalidateQueries({ queryKey: ['availability', property.id] });
      queryClient.invalidateQueries({ queryKey: ['price-preview', property.id] });
      if (booking.status === 'confirmed' || property.instantBook) {
        // Instant Book — payment modal opens immediately
        setPendingBooking({ id: booking.id, total: booking.total });
      } else {
        // Request to Book — host must confirm first; redirect to trips
        toast.success(t('bookingRequestSent'));
        router.push(`/${locale}/trips`);
      }
    },
    onError: (error) => {
      toast.error(getBookingErrorMessage(error, t('bookingFailed')));
    },
  });

  const handleReserve = () => {
    if (!isLoggedIn) {
      router.push(`/${locale}/login`);
      return;
    }
    if (!checkIn || !checkOut) {
      setShowDatePicker(true);
      return;
    }
    createBooking.mutate({
      propertyId: property.id,
      checkIn: format(checkIn, 'yyyy-MM-dd'),
      checkOut: format(checkOut, 'yyyy-MM-dd'),
      guests: totalGuests,
    });
  };

  const handleDateSelect = (range: { from?: Date; to?: Date }) => {
    setLocalCheckIn(range.from);
    setLocalCheckOut(range.to);
    onDatesChange?.(range.from, range.to);
    if (range.from && range.to) setShowDatePicker(false);
  };

  const baseTotal = pricePreview?.baseAmount ?? (nights * property.price);
  const discountAmount = pricePreview?.discountAmount ?? 0;
  const discountPercent = pricePreview?.discountPercent ?? 0;
  const discountedBase = pricePreview?.discountedBase ?? baseTotal;
  const cleaningFee = pricePreview?.cleaningFee ?? property.cleaningFee ?? 0;
  const serviceFee = pricePreview?.serviceFee ?? Math.round(discountedBase * (property.serviceFeePercent ?? 14) / 100);
  const taxes = pricePreview?.taxes ?? 0;
  const total = pricePreview?.total ?? (nights > 0 ? discountedBase + cleaningFee + serviceFee + taxes : 0);

  return (
    <>
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-lg sticky top-24">
      {/* Price header */}
      <div className="flex items-end justify-between mb-5">
        <div>
          <span className="text-xl font-semibold text-neutral-900">{formatPrice(property.price, property.currency ?? 'EGP')}</span>
          <span className="text-neutral-500 text-base"> / {tProp('night')}</span>
        </div>
        {avgRatingText !== null && (
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-neutral-900 text-neutral-900" />
            <span className="text-sm font-medium">{avgRatingText}</span>
            <span className="text-sm text-neutral-500">({property.reviewCount} {tProp('reviews')})</span>
          </div>
        )}
      </div>

      <>
      <div className={cn(
        'rounded-xl border overflow-hidden mb-3 transition-colors',
        showDatePicker ? 'border-neutral-900 ring-1 ring-neutral-900' : 'border-neutral-300',
      )}>
        {/* Dates row */}
        <button
          onClick={() => { setShowDatePicker(!showDatePicker); setShowGuestPicker(false); }}
          className="w-full grid grid-cols-2 border-b border-neutral-200"
        >
          <div className={cn(
            'p-3 text-left border-r border-neutral-200 transition-colors',
            showDatePicker && !checkIn && 'bg-neutral-50',
          )}>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">{t('dates')}</p>
            <p className={cn('text-sm mt-0.5 font-medium', checkIn ? 'text-neutral-900' : 'text-neutral-400')}>
              {checkIn ? format(checkIn, 'MMM d') : t('selectDates')}
            </p>
          </div>
          <div className={cn(
            'p-3 text-left transition-colors',
            showDatePicker && checkIn && !checkOut && 'bg-neutral-50',
          )}>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">{t('checkoutLabel')}</p>
            <p className={cn('text-sm mt-0.5 font-medium', checkOut ? 'text-neutral-900' : 'text-neutral-400')}>
              {checkOut ? format(checkOut, 'MMM d') : t('selectCheckout')}
            </p>
          </div>
        </button>

        {/* Night count row — shown when both dates selected */}
        {checkIn && checkOut && nights > 0 && (
          <div className="px-3 py-1.5 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between">
            <p className="text-xs font-medium text-indigo-700">
              {t('nightCount', { count: nights })}
            </p>
            <button
              onClick={(e) => { e.stopPropagation(); handleDateSelect({}); }}
              className="text-xs text-indigo-500 hover:text-indigo-700 transition-colors"
            >
              {t('clearDates')}
            </button>
          </div>
        )}

        {/* Guests */}
        <button
          onClick={() => { setShowGuestPicker(!showGuestPicker); setShowDatePicker(false); }}
          className="w-full p-3 text-left flex items-center justify-between"
        >
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">{t('guests')}</p>
            <p className="text-sm mt-0.5 font-medium text-neutral-900">
              {totalGuests > 0
                ? t('guestCount', { count: totalGuests })
                : t('addGuests')}
            </p>
          </div>
          <ChevronDown className={cn('h-4 w-4 text-neutral-400 transition-transform duration-200', showGuestPicker && 'rotate-180')} />
        </button>
      </div>

      {/* Date picker popup */}
      {showDatePicker && (
        <div className="mb-3 overflow-hidden">
          <DateRangePicker
            propertyId={property.id}
            checkIn={checkIn}
            checkOut={checkOut}
            onSelect={handleDateSelect}
            minNights={property.minNights}
            maxNights={property.maxNights ?? undefined}
            numberOfMonths={1}
          />
        </div>
      )}

      {/* Guest picker */}
      {showGuestPicker && (
        <div className="mb-3 rounded-xl border border-neutral-200 p-4 space-y-4">
          {[
            { label: t('adults'), desc: t('ages13Plus'), value: adults, onChange: setAdults, min: 1 },
            { label: t('children'), desc: t('ages2to12'), value: children, onChange: setChildren, min: 0 },
          ].map(({ label, desc, value, onChange, min }) => (
            <div key={label} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-900">{label}</p>
                <p className="text-xs text-neutral-500">{desc}</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onChange(Math.max(min, value - 1))}
                  disabled={value <= min}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-300 disabled:opacity-30 hover:border-neutral-900 transition-colors"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="w-4 text-center text-sm font-medium">{value}</span>
                <button
                  onClick={() => onChange(Math.min(property.maxGuests, value + 1))}
                  disabled={totalGuests >= property.maxGuests}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-300 disabled:opacity-30 hover:border-neutral-900 transition-colors"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
          <p className="text-xs text-neutral-500">
            {t('maxGuests', { count: property.maxGuests })}
          </p>
        </div>
      )}
      </>

      {/* Reserve button */}
      <Button
        onClick={handleReserve}
        isLoading={createBooking.isPending}
        fullWidth
        size="lg"
        className="mt-1"
      >
        {property.instantBook ? tProp('instantBook') : tProp('requestToBook')}
      </Button>

      <p className="mt-3 text-center text-sm text-neutral-500">{t('youWontBeChargedYet')}</p>

      {/* Cancellation policy note */}
      {(() => {
          const policy = property.cancellationPolicy ?? 'flexible';
          const policyLabel = policy.charAt(0).toUpperCase() + policy.slice(1);
          const freeDays = policy === 'strict' ? 14 : policy === 'moderate' ? 5 : 1;
          const freeDate = checkIn ? subDays(checkIn, freeDays) : null;
          const showDate = freeDate && freeDate > new Date();
          return (
            <div className="mt-3 flex items-start gap-2 rounded-lg bg-emerald-50 px-3 py-2.5">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <div className="text-xs leading-relaxed text-emerald-800">
                {showDate ? (
                  <p className="font-medium">
                    {t('freeCancellationBefore', { date: format(freeDate, 'MMM d') })}
                  </p>
                ) : (
                  <p className="font-medium">
                    {t('policyLabel', { policy: policyLabel })}
                  </p>
                )}
                <p className="text-emerald-600 mt-0.5">
                  {policy === 'flexible'
                    ? t('flexPolicyDesc')
                    : policy === 'moderate'
                    ? t('modPolicyDesc')
                    : t('strictPolicyDesc')}
                </p>
              </div>
            </div>
          );
        })()
      }

      {/* Nightly price breakdown */}
      {nights > 0 && (
        <div className="mt-5 space-y-3">
          <Separator />
          {priceLoading ? (
            <div className="flex justify-center py-4">
              <Spinner size="sm" />
            </div>
          ) : (
            <>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-600 underline decoration-dotted cursor-help">
                    {property.weekendPrice && property.weekendPrice !== property.price
                      ? t('weekendRate', { count: nights })
                      : `${formatPrice(property.price, property.currency ?? 'EGP')} × ${t('nightCount', { count: nights })}`}
                  </span>
                  <span className="text-neutral-900">{formatPrice(baseTotal, property.currency ?? 'EGP')}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>{t('discountLabel', { pct: discountPercent, type: nights >= 28 ? 'monthly' : 'weekly' })}</span>
                    <span>−{formatPrice(discountAmount, property.currency ?? 'EGP')}</span>
                  </div>
                )}
                {cleaningFee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-neutral-600 underline decoration-dotted cursor-help">{tProp('cleaningFee')}</span>
                    <span className="text-neutral-900">{formatPrice(cleaningFee, property.currency ?? 'EGP')}</span>
                  </div>
                )}
                {(property.securityDeposit ?? 0) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-neutral-600 flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                      Security deposit <span className="text-xs text-neutral-400 ml-0.5">(refundable)</span>
                    </span>
                    <span className="text-neutral-900">{formatPrice(property.securityDeposit!, property.currency ?? 'EGP')}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-neutral-600 underline decoration-dotted cursor-help">{tProp('serviceFee')}</span>
                  <span className="text-neutral-900">{formatPrice(serviceFee, property.currency ?? 'EGP')}</span>
                </div>
                {taxes > 0 && (
                  <div className="flex justify-between">
                    <span className="text-neutral-600">{tProp('taxes')}</span>
                    <span className="text-neutral-900">{formatPrice(taxes, property.currency ?? 'EGP')}</span>
                  </div>
                )}
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-neutral-900">
                <span>{tProp('total')}</span>
                <span>{formatPrice(total, property.currency ?? 'EGP')}</span>
              </div>
              {(property.securityDeposit ?? 0) > 0 && (
                <p className="text-xs text-neutral-400 flex items-start gap-1.5 mt-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                  Security deposit of {formatPrice(property.securityDeposit!, property.currency ?? 'EGP')} is returned within 48 h of checkout if no damage is reported.
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>

    {pendingBooking && (
      <PaymentMethodModal
        bookingId={pendingBooking.id}
        totalAmount={pendingBooking.total}
        currency={property.currency ?? 'EGP'}
        onSuccess={(_method) => {
          setPendingBooking(null);
          router.push(`/${locale}/trips`);
        }}
        onClose={() => {
          setPendingBooking(null);
          router.push(`/${locale}/trips`);
        }}
      />
    )}
    </>
  );
}
