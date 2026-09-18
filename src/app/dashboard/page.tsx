import { getSessionUser } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import {
  getAdminDashboardData,
  getListingManagerDashboardData,
  getOnboardingMemberDashboardData,
  getOwnerDashboardData,
} from '@/lib/dashboard-data';
import AdminDashboardView from '@/components/dashboard/AdminDashboardView';
import ListingManagerDashboardView from '@/components/dashboard/ListingManagerDashboardView';
import OnboardingMemberDashboardView from '@/components/dashboard/OnboardingMemberDashboardView';
import OwnerDashboardView from '@/components/dashboard/OwnerDashboardView';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect('/login');
  }

  // 1. Platform Admin
  if (user.isAdmin || user.role === 'admin') {
    const adminData = await getAdminDashboardData();
    return <AdminDashboardView data={adminData} userEmail={user.email} />;
  }

  // 2. Buzl Member: Listing Manager preset
  if (user.isBuzlMember && user.permissionPreset === 'listing_manager') {
    const managerData = await getListingManagerDashboardData();
    return <ListingManagerDashboardView data={managerData} userEmail={user.email} />;
  }

  // 3. Buzl Member: Onboarding Member preset (or default member)
  if (user.isBuzlMember) {
    const onboardingData = await getOnboardingMemberDashboardData();
    return <OnboardingMemberDashboardView data={onboardingData} userEmail={user.email} />;
  }

  // 4. Business Owner (default fallback)
  const ownerData = await getOwnerDashboardData();
  return <OwnerDashboardView data={ownerData} userEmail={user.email} />;
}
