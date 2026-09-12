import { createClient, getSessionUser } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import BuzlProfileImporter from '@/components/import/BuzlProfileImporter';

export const metadata = {
  title: 'Import Buzl Profile | Buzl Listing',
  description: 'Internal import tool for existing Buzl profiles',
};

export default async function AdminBusinessImportPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect('/login?redirect=/admin/businesses/import');
  }

  // Only admin and buzl_member can access
  if (!user.isAdmin && !user.isBuzlMember) {
    redirect('/dashboard');
  }

  const supabase = await createClient();

  // Fetch all active categories
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug, sort_order')
    .eq('active', true)
    .order('sort_order', { ascending: true });

  return (
    <main className="p-6 flex-1 max-w-7xl mx-auto w-full">
      <BuzlProfileImporter
        user={user}
        activeCategories={categories || []}
      />
    </main>
  );
}
