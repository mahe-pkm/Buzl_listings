import InviteUserForm from "@/components/admin/InviteUserForm";

export const dynamic = "force-dynamic";

export default function NewAdminUserPage() {
  return (
    <main className="p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
      <InviteUserForm />
    </main>
  );
}
