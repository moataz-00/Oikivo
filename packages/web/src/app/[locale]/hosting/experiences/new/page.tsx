'use client';

import { ComingSoon } from '@/components/ui/ComingSoon';

export default function NewExperiencePage() {
  return (
    <ComingSoon
      title="Create Experience — Coming Soon"
      description="Experience listing creation is on its way. Soon you'll be able to share your skills and passions with travellers worldwide."
      backHref="/../hosting/experiences"
      backLabel="Back to Experiences"
    />
  );
}
