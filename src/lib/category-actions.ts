"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/supabase/server";
import type {
  CategoryWithDetails,
  CategorySummaryMetrics,
  CreateCategoryInput,
  UpdateCategoryInput,
} from "@/types/category";

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const createCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Category name is required.")
    .max(100, "Category name must be 100 characters or fewer."),
  slug: z
    .string()
    .trim()
    .max(100)
    .optional(),
  parent_id: z.string().uuid("Invalid parent category ID.").nullable().optional(),
  sort_order: z.number().int().min(0, "Sort order must be 0 or greater.").default(0),
  active: z.boolean().default(true),
});

const updateCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Category name cannot be empty.")
    .max(100, "Category name must be 100 characters or fewer.")
    .optional(),
  slug: z
    .string()
    .trim()
    .max(100)
    .optional(),
  parent_id: z.string().uuid("Invalid parent category ID.").nullable().optional(),
  sort_order: z.number().int().min(0, "Sort order must be 0 or greater.").optional(),
  active: z.boolean().optional(),
});

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function requireInternalUser() {
  const user = await getSessionUser();
  if (!user || (!user.isAdmin && !user.isBuzlMember) || user.accountStatus !== "active") {
    throw new Error("Internal authorization required to access categories.");
  }
  return user;
}

async function requireAdmin() {
  const user = await getSessionUser();
  if (!user?.isAdmin || user.accountStatus !== "active") {
    throw new Error("Administrator access is required to manage categories.");
  }
  return user;
}

function revalidateCategoryPaths() {
  revalidatePath("/admin/categories");
  revalidatePath("/dashboard/businesses/new");
  revalidatePath("/admin/businesses");
  revalidatePath("/admin/businesses/import");
  revalidatePath("/review/businesses");
}

/**
 * List all categories with detailed metrics (usage count, parent name, child count)
 * Accessible by Admins and Buzl Members (Listing Managers and Onboarding Members).
 */
export async function listCategories(): Promise<{
  categories: CategoryWithDetails[];
  metrics: CategorySummaryMetrics;
}> {
  await requireInternalUser();

  const adminClient = createAdminClient();

  // Fetch all categories
  const { data: rawCategories, error: catError } = await adminClient
    .from("categories")
    .select("id, name, slug, parent_id, active, sort_order, created_at, updated_at")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (catError || !rawCategories) {
    throw new Error(`Unable to load categories: ${catError?.message || "Unknown error"}`);
  }

  // Fetch business usage statistics
  const { data: rawBusinesses, error: bizError } = await adminClient
    .from("businesses")
    .select("primary_category_id, publication_status");

  if (bizError) {
    throw new Error(`Unable to calculate category usage: ${bizError.message}`);
  }

  // Aggregate usage counts by primary_category_id
  const usageMap = new Map<string, { total: number; published: number }>();
  for (const b of rawBusinesses || []) {
    if (!b.primary_category_id) continue;
    const current = usageMap.get(b.primary_category_id) || { total: 0, published: 0 };
    current.total += 1;
    if (b.publication_status === "published") {
      current.published += 1;
    }
    usageMap.set(b.primary_category_id, current);
  }

  // Map category lookup for parent names and child counts
  const catLookup = new Map<string, (typeof rawCategories)[0]>();
  const childCountMap = new Map<string, number>();

  for (const cat of rawCategories) {
    catLookup.set(cat.id, cat);
    if (cat.parent_id) {
      childCountMap.set(cat.parent_id, (childCountMap.get(cat.parent_id) || 0) + 1);
    }
  }

  let activeCount = 0;
  let inactiveCount = 0;
  let topLevelCount = 0;
  let inUseCount = 0;

  const categories: CategoryWithDetails[] = rawCategories.map((cat) => {
    const usage = usageMap.get(cat.id) || { total: 0, published: 0 };
    const parentName = cat.parent_id ? catLookup.get(cat.parent_id)?.name || null : null;
    const childCount = childCountMap.get(cat.id) || 0;

    if (cat.active) {
      activeCount += 1;
    } else {
      inactiveCount += 1;
    }

    if (!cat.parent_id) {
      topLevelCount += 1;
    }

    if (usage.total > 0) {
      inUseCount += 1;
    }

    return {
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      parent_id: cat.parent_id,
      parent_name: parentName,
      active: cat.active,
      sort_order: cat.sort_order,
      total_listings: usage.total,
      published_listings: usage.published,
      child_count: childCount,
      created_at: cat.created_at,
      updated_at: cat.updated_at,
    };
  });

  const metrics: CategorySummaryMetrics = {
    total: categories.length,
    active: activeCount,
    inactive: inactiveCount,
    topLevel: topLevelCount,
    inUse: inUseCount,
  };

  return { categories, metrics };
}

/**
 * Create a new category in the directory taxonomy.
 * Administrator access required.
 */
export async function createCategory(
  input: CreateCategoryInput
): Promise<{ success: boolean; error?: string; category?: CategoryWithDetails }> {
  try {
    await requireAdmin();

    const parsed = createCategorySchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Invalid input." };
    }

    const { name, parent_id, sort_order, active } = parsed.data;
    const slug = (parsed.data.slug && parsed.data.slug.trim().length > 0)
      ? slugify(parsed.data.slug)
      : slugify(name);

    if (!SLUG_REGEX.test(slug)) {
      return {
        success: false,
        error: "Category slug must contain only lowercase letters, numbers, and hyphens (e.g. medical-services).",
      };
    }

    const adminClient = createAdminClient();

    // Check slug uniqueness
    const { data: existingSlug } = await adminClient
      .from("categories")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existingSlug) {
      return {
        success: false,
        error: `A category with the slug '${slug}' already exists. Please choose a unique slug.`,
      };
    }

    // Verify parent exists if specified
    if (parent_id) {
      const { data: parentCat } = await adminClient
        .from("categories")
        .select("id, active")
        .eq("id", parent_id)
        .maybeSingle();

      if (!parentCat) {
        return { success: false, error: "The specified parent category does not exist." };
      }
      if (!parentCat.active) {
        return { success: false, error: "Cannot assign an inactive category as a parent." };
      }
    }

    const { data: inserted, error: insertError } = await adminClient
      .from("categories")
      .insert({
        name,
        slug,
        parent_id: parent_id || null,
        sort_order: sort_order ?? 0,
        active: active ?? true,
      })
      .select()
      .single();

    if (insertError || !inserted) {
      return { success: false, error: insertError?.message || "Failed to create category." };
    }

    revalidateCategoryPaths();

    return {
      success: true,
      category: {
        ...inserted,
        parent_name: null,
        total_listings: 0,
        published_listings: 0,
        child_count: 0,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred.";
    return { success: false, error: message };
  }
}

/**
 * Update an existing category.
 * Administrator access required.
 */
export async function updateCategory(
  id: string,
  input: UpdateCategoryInput
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();

    if (!id || typeof id !== "string") {
      return { success: false, error: "Invalid category ID." };
    }

    const parsed = updateCategorySchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Invalid input." };
    }

    const adminClient = createAdminClient();

    // Fetch existing category
    const { data: existing, error: fetchError } = await adminClient
      .from("categories")
      .select("id, name, slug, parent_id, active, sort_order")
      .eq("id", id)
      .maybeSingle();

    if (fetchError || !existing) {
      return { success: false, error: "Category not found." };
    }

    const updates: {
      name?: string;
      slug?: string;
      parent_id?: string | null;
      sort_order?: number;
      active?: boolean;
    } = {};

    // Validate Name
    if (parsed.data.name !== undefined) {
      updates.name = parsed.data.name;
    }

    // Validate Slug
    if (parsed.data.slug !== undefined) {
      const newSlug = slugify(parsed.data.slug);
      if (!SLUG_REGEX.test(newSlug)) {
        return {
          success: false,
          error: "Category slug must contain only lowercase letters, numbers, and hyphens.",
        };
      }

      if (newSlug !== existing.slug) {
        const { data: duplicate } = await adminClient
          .from("categories")
          .select("id")
          .eq("slug", newSlug)
          .neq("id", id)
          .maybeSingle();

        if (duplicate) {
          return {
            success: false,
            error: `A category with the slug '${newSlug}' already exists. Please choose a unique slug.`,
          };
        }
        updates.slug = newSlug;
      }
    }

    // Validate Sort Order
    if (parsed.data.sort_order !== undefined) {
      updates.sort_order = parsed.data.sort_order;
    }

    // Validate Parent and Circular Hierarchy
    if (parsed.data.parent_id !== undefined) {
      const targetParentId = parsed.data.parent_id;

      if (targetParentId === id) {
        return { success: false, error: "A category cannot be its own parent." };
      }

      if (targetParentId) {
        // Fetch all categories to traverse ancestor chain
        const { data: allCats } = await adminClient
          .from("categories")
          .select("id, parent_id, active");

        const catMap = new Map<string, { id: string; parent_id: string | null; active: boolean }>();
        for (const c of allCats || []) {
          catMap.set(c.id, c);
        }

        const targetParent = catMap.get(targetParentId);
        if (!targetParent) {
          return { success: false, error: "The specified parent category does not exist." };
        }
        if (!targetParent.active) {
          return { success: false, error: "Cannot assign an inactive category as a parent." };
        }

        // Circular hierarchy check: ensure `id` is not an ancestor of `targetParentId`
        let curr: string | null = targetParentId;
        const visited = new Set<string>();
        while (curr) {
          if (curr === id) {
            return {
              success: false,
              error: "Circular hierarchy detected: a category cannot have one of its descendants as its parent.",
            };
          }
          if (visited.has(curr)) break;
          visited.add(curr);
          curr = catMap.get(curr)?.parent_id || null;
        }

        updates.parent_id = targetParentId;
      } else {
        updates.parent_id = null;
      }
    }

    // Validate Deactivation (active = false)
    if (parsed.data.active !== undefined) {
      if (existing.active && !parsed.data.active) {
        // Check if referenced by published businesses
        const { data: publishedBiz } = await adminClient
          .from("businesses")
          .select("id")
          .eq("primary_category_id", id)
          .eq("publication_status", "published")
          .limit(1);

        if (publishedBiz && publishedBiz.length > 0) {
          return {
            success: false,
            error: "This category is currently used by published listings and cannot be deactivated until those listings are reassigned.",
          };
        }
      }
      updates.active = parsed.data.active;
    }

    if (Object.keys(updates).length === 0) {
      return { success: true };
    }

    const { error: updateError } = await adminClient
      .from("categories")
      .update(updates)
      .eq("id", id);

    if (updateError) {
      if (updateError.message.includes("cannot deactivate a category used by a published business")) {
        return {
          success: false,
          error: "This category is currently used by published listings and cannot be deactivated until those listings are reassigned.",
        };
      }
      return { success: false, error: updateError.message };
    }

    revalidateCategoryPaths();
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred.";
    return { success: false, error: message };
  }
}

/**
 * Toggle category active status.
 * Administrator access required.
 */
export async function toggleCategoryActive(
  id: string,
  active: boolean
): Promise<{ success: boolean; error?: string }> {
  return updateCategory(id, { active });
}
