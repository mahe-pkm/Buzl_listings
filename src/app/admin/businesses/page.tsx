import { createClient, getSessionUser } from '@/lib/supabase/server';
import Topbar from '@/components/dashboard/Topbar';
import BusinessTableView, { BusinessTableRow } from '@/components/dashboard/BusinessTableView';
import { redirect } from 'next/navigation';

export default async function AdminBusinessesPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect('/login');
  }
  if (!user.isAdmin) {
    if (user.isBuzlMember) {
      redirect('/admin/businesses/import');
    }
    redirect('/dashboard');
  }

  const supabase = await createClient();

  // Admin query fetches all businesses in system
  const { data: businesses } = await supabase
    .from('businesses')
    .select('id, listing_code, canonical_name, slug, location_mode, city, state, publication_status, verification_status, updated_at, primary_category_id, categories(name)')
    .order('updated_at', { ascending: false });

  const rawList = businesses || [];

  const formattedRows: BusinessTableRow[] = rawList.map((b) => {
    const catName = Array.isArray(b.categories)
      ? b.categories[0]?.name
      : (b.categories as { name?: string })?.name;

    return {
      id: b.id,
      listing_code: b.listing_code,
      canonical_name: b.canonical_name,
      slug: b.slug,
      location_mode: b.location_mode,
      city: b.city,
      state: b.state,
      publication_status: b.publication_status,
      verification_status: b.verification_status,
      updated_at: b.updated_at,
      primary_category_id: b.primary_category_id,
      categoryName: catName,
    };
  });

  return (
    <>
      <Topbar
        title="Admin: All Platform Listings"
        subtitle={`System-wide control for ${formattedRows.length} total citation record${formattedRows.length === 1 ? '' : 's'}`}
        userEmail={user.email}
        isAdmin={true}
        action={{
          label: 'Import Buzl Profile',
          href: '/admin/businesses/import',
        }}
      />

      <main className="p-6 space-y-6 flex-1">
        {formattedRows.length === 0 ? (
          <div className="bg-white rounded-[8px] border border-[#DCE2E8] shadow-xs p-12 text-center">
            <h3 className="text-sm font-bold text-[#2A3547]">No businesses in platform yet</h3>
            <p className="text-xs text-[#5D6776] mt-1">
              No listings have been submitted by owners or created by administrators.
            </p>
          </div>
        ) : (
          <BusinessTableView businesses={formattedRows} isAdmin={true} />
        )}
      </main>
    </>
  );
}
