import { createClient, getSessionUser } from '@/lib/supabase/server';
import Topbar from '@/components/dashboard/Topbar';
import StatusBadge from '@/components/ui/StatusBadge';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect('/login');
  }

  const supabase = await createClient();

  // Fetch businesses managed by current user or all if admin
  const { data: businesses } = await supabase
    .from('businesses')
    .select('id, canonical_name, slug, location_mode, city, state, publication_status, verification_status, updated_at, primary_category_id, categories(name)')
    .order('updated_at', { ascending: false });

  const list = businesses || [];
  const totalCount = list.length;
  const publishedCount = list.filter((b) => b.publication_status === 'published').length;
  const pendingCount = list.filter((b) => b.publication_status === 'pending').length;
  const draftCount = list.filter((b) => b.publication_status === 'draft').length;

  return (
    <>
      <Topbar
        title="Dashboard Overview"
        subtitle={`Signed in as ${user.email}`}
        userEmail={user.email}
        isAdmin={user.isAdmin}
        action={{
          label: 'Add Business',
          href: '/dashboard/businesses/new',
        }}
      />

      <main className="p-6 space-y-6 flex-1">
        {/* KPI / Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-[8px] border border-[#DCE2E8] shadow-xs">
            <span className="text-xs font-semibold text-[#7D8795] uppercase tracking-wider">
              Total Businesses
            </span>
            <div className="text-2xl font-bold text-[#2A3547] mt-1">{totalCount}</div>
            <span className="text-[11px] text-[#5D6776] mt-0.5 block">Managed listings</span>
          </div>

          <div className="bg-white p-5 rounded-[8px] border border-[#DCE2E8] shadow-xs">
            <span className="text-xs font-semibold text-[#087C3C] uppercase tracking-wider">
              Published
            </span>
            <div className="text-2xl font-bold text-[#087C3C] mt-1">{publishedCount}</div>
            <span className="text-[11px] text-[#5D6776] mt-0.5 block">Live & public</span>
          </div>

          <div className="bg-white p-5 rounded-[8px] border border-[#DCE2E8] shadow-xs">
            <span className="text-xs font-semibold text-[#D99B18] uppercase tracking-wider">
              Pending Review
            </span>
            <div className="text-2xl font-bold text-[#D99B18] mt-1">{pendingCount}</div>
            <span className="text-[11px] text-[#5D6776] mt-0.5 block">Submitted for approval</span>
          </div>

          <div className="bg-white p-5 rounded-[8px] border border-[#DCE2E8] shadow-xs">
            <span className="text-xs font-semibold text-[#5D6776] uppercase tracking-wider">
              Drafts
            </span>
            <div className="text-2xl font-bold text-[#2A3547] mt-1">{draftCount}</div>
            <span className="text-[11px] text-[#5D6776] mt-0.5 block">Work in progress</span>
          </div>
        </div>

        {/* Recent Businesses Section */}
        <div className="bg-white rounded-[8px] border border-[#DCE2E8] shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-[#DCE2E8] flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#2A3547]">Recent Listings</h2>
            <Link
              href="/dashboard/businesses"
              className="text-xs font-semibold text-[#004AAD] hover:underline"
            >
              View all →
            </Link>
          </div>

          {list.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 rounded-full bg-[#ECF4FF] text-[#004AAD] flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-[#2A3547]">No business listings yet</h3>
              <p className="text-xs text-[#5D6776] mt-1 max-w-sm mx-auto">
                Create your first storefront or service-area listing to get started with Buzl Listing.
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
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F2F5FA] border-b border-[#DCE2E8] text-[11px] font-bold text-[#7D8795] uppercase tracking-wider">
                    <th className="py-3 px-6">Business Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Mode</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCE2E8] text-xs text-[#2A3547]">
                  {list.slice(0, 5).map((b) => {
                    const catName = Array.isArray(b.categories)
                      ? b.categories[0]?.name
                      : (b.categories as { name?: string })?.name;

                    return (
                      <tr key={b.id} className="hover:bg-[#F2F5FA]/50 transition-colors">
                        <td className="py-3.5 px-6 font-semibold text-[#2A3547]">
                          <Link href={`/dashboard/businesses/${b.id}/edit`} className="hover:text-[#004AAD]">
                            {b.canonical_name}
                          </Link>
                        </td>
                        <td className="py-3.5 px-4 text-[#5D6776]">{catName || '—'}</td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={b.location_mode} type="mode" />
                        </td>
                        <td className="py-3.5 px-4 text-[#5D6776]">
                          {b.city}, {b.state}
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={b.publication_status} type="publication" />
                        </td>
                        <td className="py-3.5 px-6 text-right">
                          <Link
                            href={`/dashboard/businesses/${b.id}/edit`}
                            className="text-xs font-semibold text-[#004AAD] hover:underline"
                          >
                            Manage →
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
