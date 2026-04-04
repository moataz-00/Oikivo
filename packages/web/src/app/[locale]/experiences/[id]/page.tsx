'use client';

import { ComingSoon } from '@/components/ui/ComingSoon';
import { useTranslations } from 'next-intl';

export default function ExperienceDetailPage() {
  const t = useTranslations('experiences');
  return (
    <ComingSoon
      title={t('detailComingSoonTitle')}
      description={t('detailComingSoonDesc')}
      backHref="/../experiences"
      backLabel={t('browseExperiences')}
    />
  );
}
