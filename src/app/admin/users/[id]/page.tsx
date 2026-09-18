import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/supabase/server";
import { listManagedUsers, getUserBusinesses } from "../actions";
import ManageUserForm from "@/components/admin/ManageUserForm";

export const dynamic = "force-dynamic";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const users = await listManagedUsers();
  const user = users.find((item) => item.id === id);
  if (!user) notFound();

  const currentUser = await getSessionUser();
  const isSelf = currentUser?.id === user.id;

  const associatedBusinesses = await getUserBusinesses(user.id);

  return (
    <main className="p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
      <ManageUserForm
        user={user}
        isSelf={isSelf}
        associatedBusinesses={associatedBusinesses}
      />
    </main>
  );
}
