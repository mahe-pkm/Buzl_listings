import Link from "next/link";
import { listManagedUsers } from "./actions";

export default async function AdminUsersPage() {
  const users = await listManagedUsers();
  return <main className="p-5 md:p-8 max-w-7xl w-full mx-auto">
    <div className="flex items-center justify-between gap-4 mb-6"><div><h1 className="text-2xl font-bold text-[#2A3547]">User management</h1><p className="text-sm text-[#5D6776]">Roles, Buzl Member access and account lifecycle.</p></div><Link href="/admin/users/new" className="rounded-lg bg-[#004AAD] px-4 py-2 text-sm font-semibold text-white">Invite user</Link></div>
    <div className="overflow-x-auto rounded-xl border border-[#DCE2E8] bg-white"><table className="min-w-full text-left text-sm"><thead className="bg-[#F2F5FA] text-[#5D6776]"><tr><th className="p-3">User</th><th className="p-3">Role</th><th className="p-3">Member ID</th><th className="p-3">Status</th><th className="p-3">Last sign-in</th><th className="p-3" /></tr></thead><tbody>{users.map((user) => <tr key={user.id} className="border-t border-[#DCE2E8]"><td className="p-3"><div className="font-medium text-[#2A3547]">{user.fullName || "—"}</div><div className="text-xs text-[#5D6776]">{user.email}</div></td><td className="p-3">{user.role}</td><td className="p-3">{user.memberId || "—"}</td><td className="p-3">{user.accountStatus}</td><td className="p-3">{user.lastSignInAt ? new Date(user.lastSignInAt).toLocaleString() : "Never"}</td><td className="p-3"><Link className="text-[#004AAD] font-semibold" href={`/admin/users/${user.id}`}>Manage</Link></td></tr>)}</tbody></table></div>
  </main>;
}
