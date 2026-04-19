import type { Metadata } from 'next';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

type Props = {
  params: Promise<{ id: string; locale: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, locale } = await params;
  try {
    const res = await fetch(`${API_URL}/properties/${id}`, { next: { revalidate: 300 } });
    if (!res.ok) return { title: 'Property | Sakan' };
    const property = await res.json();
    const title = `${property.title} — ${property.city}, ${property.country} | Sakan`;
    const description =
      property.description?.slice(0, 160) ??
      `Book ${property.title} in ${property.city}. ${property.bedrooms ?? 0} bedrooms, ${property.bathrooms ?? 0} bathrooms.`;
    const coverImage = property.images?.find((i: any) => i.isCover)?.url ?? property.images?.[0]?.url;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'website',
        locale: locale === 'ar' ? 'ar_EG' : 'en_US',
        ...(coverImage ? { images: [{ url: coverImage, width: 1200, height: 630, alt: property.title }] } : {}),
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        ...(coverImage ? { images: [coverImage] } : {}),
      },
    };
  } catch {
    return { title: 'Property | Sakan' };
  }
}

export default function PropertyLayout({ children }: Props) {
  return children;
}
