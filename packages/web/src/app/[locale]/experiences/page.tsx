'use client';

import { useTranslations } from 'next-intl';
import { ComingSoon } from '@/components/ui/ComingSoon';

export default function ExperiencesPage() {
  const t = useTranslations('comingSoon');
  return (
    <ComingSoon
      title={t('experiencesTitle')}
      description={t('experiencesDescription')}
      backLabel={t('backToHome')}
    />
  );
}