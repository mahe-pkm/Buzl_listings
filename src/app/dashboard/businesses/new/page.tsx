import { createClient, getSessionUser } from '@/lib/supabase/server';
import Topbar from '@/components/dashboard/Topbar';
import BusinessForm from '@/components/business/BusinessForm';
import { redirect } from 'next/navigation';
import { Category } from '@/types/business';

export default async function NewBusinessPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect('/login');
  }

  const supabase = await createClient();

  // Fetch active categories
  const { data: categoriesData } = await supabase
    .from('categories')
    .select('id, name, slug, active, sort_order')
    .eq('active', true)
    .order('sort_order', { ascending: true });

  const categories: Category[] = (categoriesData || []).map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    active: c.active,
    sort_order: c.sort_order,
  }));

  return (
    <>
      <Topbar
        title="Add New Business Listing"
        subtitle="Complete the guided 6-step form to create your citation record."
      />

      <main className="p-6 max-w-5xl">
        <BusinessForm
          categories={categories}
          isAdmin={user.isAdmin}
        />
      </main>
    </>
  );
}
