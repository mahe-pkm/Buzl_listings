import { redirect } from 'next/navigation';

interface BusinessDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function BusinessDetailsPage({ params }: BusinessDetailsPageProps) {
  const { id } = await params;
  redirect(`/dashboard/businesses/${id}/edit`);
}
