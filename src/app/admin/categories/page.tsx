import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/supabase/server";
import { listCategories } from "@/lib/category-actions";
import CategoryManagementView from "@/components/categories/CategoryManagementView";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Categories | Buzl Admin",
  description: "Directory category taxonomy and usage metrics.",
};

export default async function AdminCategoriesPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login?redirect=/admin/categories");
  }

  if (!user.isAdmin && !user.isBuzlMember) {
    redirect("/dashboard");
  }

  const { categories, metrics } = await listCategories();

  return (
    <main className="p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
      <CategoryManagementView
        initialCategories={categories}
        initialMetrics={metrics}
        canManage={user.isAdmin}
      />
    </main>
  );
}
