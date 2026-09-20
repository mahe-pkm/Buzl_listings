import { redirect } from 'next/navigation';
import BusinessForm from '@/components/business/BusinessForm';
import { createClient, getSessionUser } from '@/lib/supabase/server';
import type { Category } from '@/types/business';

export default async function OnboardingPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (user.accountStatus !== 'active') redirect('/login?error=account_inactive');
  if (user.role !== 'business_owner') redirect('/dashboard');

  const supabase = await createClient();
  const [{ data: profile }, { data: categoriesData }] = await Promise.all([
    supabase
      .from('profiles')
      .select('onboarding_completed_at')
      .eq('id', user.id)
      .single(),
    supabase
      .from('categories')
      .select('id, name, slug, active, sort_order')
      .eq('active', true)
      .order('sort_order', { ascending: true }),
  ]);

  if (profile?.onboarding_completed_at) redirect('/dashboard');

  const categories: Category[] = (categoriesData ?? []).map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    active: category.active,
    sort_order: category.sort_order,
  }));

  return (
    <main className="min-h-screen bg-[#F2F5FA] px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 rounded-[12px] border border-[#DCE2E8] bg-white p-5 shadow-sm sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#087C3C]">Business Registration</p>
          <h1 className="mt-2 text-2xl font-bold text-[#2A3547]">Register Your Business</h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#5D6776]">
            Complete your business information step by step. Add your business basics, category, location or service area, contact details, services, products, and media. Your login phone stays private and is never copied into this listing.
          </p>
        </div>
        <BusinessForm categories={categories} onboardingMode />
      </div>
    </main>
  );
}
