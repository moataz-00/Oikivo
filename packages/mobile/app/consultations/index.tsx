import React from 'react';
import { WebsiteComingSoonScreen } from '@/components/ui/WebsiteComingSoonScreen';

export default function ConsultationsScreen() {
  return (
    <WebsiteComingSoonScreen
      title="Consultations"
      heading="Consultations are coming soon"
      message="Consultant-related features are currently available on the Oikivo website only. You can continue using the website while the mobile experience is being finalized."
      websiteUrl="https://oikivo.com/consultations"
      websiteLabel="Open Consultations Website"
    />
  );
}
