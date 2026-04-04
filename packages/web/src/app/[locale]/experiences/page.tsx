'use client';

import { ComingSoon } from '@/components/ui/ComingSoon';
import { useTranslations } from 'next-intl';

export default function ExperiencesPage() {
  const t = useTranslations('experiences');
  return (
    <ComingSoon
      title={t('comingSoonTitle')}
      description={t('comingSoonDesc')}
      backLabel={t('backToHome')}
    />
  );
}
