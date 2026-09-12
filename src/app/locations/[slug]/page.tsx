import { permanentRedirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function LocationsRedirectPage({ params }: PageProps) {
  const { slug } = await params;
  permanentRedirect(`/location/${slug}`);
}
