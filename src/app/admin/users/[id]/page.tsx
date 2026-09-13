import Link from "next/link";
import { notFound } from "next/navigation";
import { listManagedUsers, resetManagedUserPassword, revokeManagedUserSessions, updateManagedUser } from "../actions";

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = (await listManagedUsers()).find((item) => item.id === id);
  if (!user) notFound();

  return <main className="p-5 md:p-8 max-w-2xl w-full mx-auto">
    <Link href="/admin/users" className="text-sm text-[#004AAD]">← Users</Link>
    <h1 className="mt-4 text-2xl font-bold text-[#2A3547]">Manage user</h1>
    <p className="mt-1 text-sm text-[#5D6776]">{user.email} · Providers: {user.providers.join(", ") || "email"} · Last sign-in: {user.lastSignInAt ? new Date(user.lastSignInAt).toLocaleString() : "Never"}</p>
    <form action={updateManagedUser} className="mt-6 space-y-4 rounded-xl border border-[#DCE2E8] bg-white p-6">
      <input type="hidden" name="id" value={user.id} />
      <label className="block text-sm font-semibold">Full name<input required name="fullName" defaultValue={user.fullName ?? ""} className="mt-1 w-full rounded border border-[#DCE2E8] p-2" /></label>
      <label className="block text-sm font-semibold">Role<select name="role" defaultValue={user.role} className="mt-1 w-full rounded border border-[#DCE2E8] p-2"><option value="business_owner">Business owner</option><option value="buzl_member">Buzl Member</option><option value="admin">Admin</option></select></label>
      <label className="block text-sm font-semibold">Member permission preset<select name="permissionPreset" defaultValue={user.permissionPreset ?? ""} className="mt-1 w-full rounded border border-[#DCE2E8] p-2"><option value="">None</option><option value="onboarding_member">Onboarding Member</option><option value="listing_manager">Listing Manager</option></select></label>
      <label className="block text-sm font-semibold">Buzl Member ID<input name="memberId" defaultValue={user.memberId ?? ""} className="mt-1 w-full rounded border border-[#DCE2E8] p-2" /></label>
      <label className="block text-sm font-semibold">Account status<select name="accountStatus" defaultValue={user.accountStatus} className="mt-1 w-full rounded border border-[#DCE2E8] p-2"><option value="active">Active</option><option value="invited">Invited</option><option value="inactive">Inactive</option><option value="suspended">Suspended</option></select></label>
      <button className="rounded-lg bg-[#004AAD] px-4 py-2 text-sm font-semibold text-white">Save account</button>
    </form>
    <div className="mt-4 flex flex-wrap gap-3">
      <form action={resetManagedUserPassword}><input type="hidden" name="email" value={user.email ?? ""}/><button className="rounded border border-[#004AAD] px-3 py-2 text-sm text-[#004AAD]">Send password reset</button></form>
      <form action={revokeManagedUserSessions}><input type="hidden" name="id" value={user.id}/><button className="rounded border border-[#C52707] px-3 py-2 text-sm text-[#C52707]">Revoke sessions</button></form>
    </div>
  </main>;
}
