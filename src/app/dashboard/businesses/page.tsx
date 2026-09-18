import { createClient, getSessionUser } from '@/lib/supabase/server';
import Topbar from '@/components/dashboard/Topbar';
import BusinessTableView, { BusinessTableRow } from '@/components/dashboard/BusinessTableView';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function BusinessesListPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect('/login');
  }

  const supabase = await createClient();

  // Fetch businesses
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
        title="My Businesses"
        subtitle={`Managing ${formattedRows.length} listing${formattedRows.length === 1 ? '' : 's'}`}
        userEmail={user.email}
        isAdmin={user.isAdmin}
        action={{
          label: 'Add Business',
          href: '/dashboard/businesses/new',
        }}
      />

      <main className="p-6 space-y-6 flex-1">
        {formattedRows.length === 0 ? (
          <div className="bg-white rounded-[8px] border border-[#DCE2E8] shadow-xs p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-[#ECF4FF] text-[#004AAD] flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-[#2A3547]">No businesses listed yet</h3>
            <p className="text-xs text-[#5D6776] mt-1 max-w-sm mx-auto">
              Add your business to begin managing citations, hours, and service locations.
            </p>
            <div className="mt-4">
              <Link
                href="/dashboard/businesses/new"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[8px] bg-[#004AAD] text-white text-xs font-semibold hover:bg-[#003E91] transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Listing
              </Link>
            </div>
          </div>
        ) : (
          <BusinessTableView businesses={formattedRows} isAdmin={false} />
        )}
      </main>
    </>
  );
}
