import { getSessionUser } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) {
    redirect('/login');
  }

  if (!user.isAdmin) {
    redirect('/dashboard');
  }

  return (
    <div className="flex min-h-screen bg-[#F2F5FA]">
      <Sidebar
        userEmail={user.email}
        role={user.role}
        isAdmin={true}
      />
      <div className="flex-1 flex flex-col min-w-0 pt-14 md:pt-0">
        {children}
      </div>
    </div>
  );
}
