import React from 'react';
import { WebsiteComingSoonScreen } from '@/components/ui/WebsiteComingSoonScreen';

export default function ConsultantDetailScreen() {
  return (
    <WebsiteComingSoonScreen
      title="Consultant"
      heading="Consultant profiles are coming soon"
      message="For now, consultant profiles and consultant booking details are available on the Oikivo website only."
      websiteUrl="https://oikivo.com/consultations"
      websiteLabel="Open Website"
    />
  );
}
