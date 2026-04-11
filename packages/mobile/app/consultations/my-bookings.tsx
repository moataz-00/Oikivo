import React from 'react';
import { WebsiteComingSoonScreen } from '@/components/ui/WebsiteComingSoonScreen';

export default function MyConsultationBookingsScreen() {
  return (
    <WebsiteComingSoonScreen
      title="My Consultation Bookings"
      heading="Consultation bookings are coming soon"
      message="Consultation booking management is currently available on the Oikivo website only."
      websiteUrl="https://oikivo.com/consultations/my-bookings"
      websiteLabel="Open Website"
    />
  );
}
