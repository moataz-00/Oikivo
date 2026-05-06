'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, BellOff, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { toast } from '@/components/ui/Toast';
import { priceAlertsApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useCurrency } from '@/hooks/useCurrency';
import { cn } from '@/lib/utils';

interface PriceAlertButtonProps {
  propertyId: number;
  currentPrice: number | null;
  className?: string;
}

export function PriceAlertButton({ propertyId, currentPrice, className }: PriceAlertButtonProps) {
  const t = useTranslations('priceAlert');
  const { isLoggedIn } = useAuth();
  const { formatPrice } = useCurrency();
  const queryClient = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [targetPrice, setTargetPrice] = useState<string>(
    currentPrice ? String(Math.floor(currentPrice * 0.9)) : '',
  );

  // Fetch user's alerts to check if one already exists for this property
  const { data: alerts = [] } = useQuery<any[]>({
    queryKey: ['price-alerts'],
    queryFn: priceAlertsApi.getMyAlerts,
    enabled: isLoggedIn,
  });

  const existingAlert = alerts.find((a: any) => Number(a.propertyId) === Number(propertyId));

  const createMutation = useMutation({
    mutationFn: ({ price }: { price: number }) =>
      priceAlertsApi.create(propertyId, price),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-alerts'] });
      setShowModal(false);
      toast.success(t('created'));
    },
    onError: () => toast.error(t('createError')),
  });

  const deleteMutation = useMutation({
    mutationFn: () => priceAlertsApi.deleteByProperty(propertyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-alerts'] });
      toast.success(t('removed'));
    },
    onError: () => toast.error(t('removeError')),
  });

  const handleSubmit = () => {
    const price = parseFloat(targetPrice);
    if (!price || price <= 0) {
      toast.error(t('invalidPrice'));
      return;
    }
    createMutation.mutate({ price });
  };

  if (!isLoggedIn) return null;

  if (existingAlert) {
    return (
      <button
        onClick={() => deleteMutation.mutate()}
        disabled={deleteMutation.isPending}
        title={t('removeTitle')}
        className={cn(
          'flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-red-500 transition-colors',
          className,
        )}
      >
        <BellOff className="w-4 h-4" />
        <span>{t('active', { price: formatPrice(Number(existingAlert.targetPrice)) })}</span>
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        title={t('setTitle')}
        className={cn(
          'flex items-center gap-1.5 text-sm font-medium text-neutral-600 hover:text-primary-600 transition-colors',
          className,
        )}
      >
        <Bell className="w-4 h-4" />
        <span>{t('set')}</span>
      </button>

      <Modal open={showModal} onOpenChange={setShowModal} title={t('modalTitle')}>
        <div className="space-y-4">
          <p className="text-sm text-neutral-600">{t('modalDescription')}</p>

          {currentPrice && (
            <p className="text-sm text-neutral-500">
              {t('currentPrice')}: <span className="font-semibold">{formatPrice(currentPrice)}</span>
            </p>
          )}

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              {t('targetPriceLabel')}
            </label>
            <input
              type="number"
              min={1}
              step={1}
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder={t('targetPricePlaceholder')}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setShowModal(false)}
              className="flex-1"
            >
              {t('cancel')}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending}
              className="flex-1"
            >
              {createMutation.isPending ? t('saving') : t('save')}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
