import { getSessionUser } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import { getPendingReviewCount } from '@/lib/business-actions';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) {
    redirect('/login');
  }

  if (!user.isAdmin && !user.isBuzlMember) {
    redirect('/dashboard');
  }

  const canModerate = user.isAdmin || user.permissions.includes('listing.publish');
  const pendingReviewCount = canModerate ? await getPendingReviewCount() : 0;

  return (
    <div className="flex min-h-screen bg-[#F2F5FA]">
      <Sidebar
        userEmail={user.email}
        role={user.role}
        isAdmin={user.isAdmin}
        isBuzlMember={user.isBuzlMember}
        memberId={user.memberId}
        canModerate={canModerate}
        permissionPreset={user.permissionPreset}
        pendingReviewCount={pendingReviewCount}
      />
      <div className="flex-1 flex flex-col min-w-0 pt-14 md:pt-0">
        {children}
      </div>
    </div>
  );
}
