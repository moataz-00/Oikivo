import React from 'react';
import { WebsiteComingSoonScreen } from '@/components/ui/WebsiteComingSoonScreen';

export default function ConsultationBookScreen() {
  return (
    <WebsiteComingSoonScreen
      title="Book Consultation"
      heading="Consultation booking is coming soon"
      message="Consultation booking is currently handled on the Oikivo website. The mobile flow will be added in a later release."
      websiteUrl="https://oikivo.com/consultations"
      websiteLabel="Open Website"
    />
  );
}
