import { redirect } from 'next/navigation';
import { createClient, getSessionUser } from '@/lib/supabase/server';
import Topbar from '@/components/dashboard/Topbar';
import BusinessTableView, { type BusinessTableRow } from '@/components/dashboard/BusinessTableView';

export default async function ReviewBusinessesPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login?redirect=/review/businesses');
  if (!user.isAdmin && !user.permissions.includes('listing.publish')) redirect('/dashboard');

  const supabase = await createClient();
  const { data } = await supabase
    .from('businesses')
    .select('id, canonical_name, slug, location_mode, city, state, publication_status, verification_status, updated_at, primary_category_id, categories(name)')
    .in('publication_status', ['pending', 'published', 'suspended'])
    .order('updated_at', { ascending: false });
  const rows: BusinessTableRow[] = (data ?? []).map((business) => ({
    id: business.id,
    canonical_name: business.canonical_name,
    slug: business.slug,
    location_mode: business.location_mode,
    city: business.city,
    state: business.state,
    publication_status: business.publication_status,
    verification_status: business.verification_status,
    updated_at: business.updated_at,
    primary_category_id: business.primary_category_id,
    categoryName: Array.isArray(business.categories) ? (business.categories[0] as { name?: string } | undefined)?.name : (business.categories as { name?: string } | null)?.name,
  }));

  return <>
    <Topbar title="Listing review" subtitle="Permission-based moderation queue" userEmail={user.email} isAdmin={user.isAdmin} />
    <main className="p-6 space-y-6 flex-1">
      <p className="text-sm text-[#5D6776]">Publish and suspend actions are enforced again by the database RPC.</p>
      <BusinessTableView businesses={rows} isAdmin moderationPermissions={user.isAdmin ? { publish: true, suspend: true, verify: true, delete: true } : { publish: true, suspend: user.permissions.includes('listing.suspend'), verify: false, delete: false }} />
    </main>
  </>;
}
