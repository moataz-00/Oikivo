import { ComingSoon } from '@/components/ui/ComingSoon';

export default function ConsultationsLayout({
  children: _children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ComingSoon
      title="Consultations - Coming Soon"
      description="Consultations are coming soon on the Oikivo website."
      backLabel="Back to Home"
    />
  );
}