import { listManagedUsers } from "./actions";
import UserListClient from "@/components/admin/UserListClient";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const users = await listManagedUsers();

  return (
    <main className="p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
      <UserListClient initialUsers={users} />
    </main>
  );
}
