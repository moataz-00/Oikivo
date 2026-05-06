'use client';

import { ComingSoon } from '@/components/ui/ComingSoon';
import { useTranslations } from 'next-intl';

export default function TravelPage() {
  const t = useTranslations('comingSoon');
  return (
    <ComingSoon
      title={t('travelTitle')}
      description={t('travelDescription')}
      backLabel={t('backToHome')}
    />
  );
}
