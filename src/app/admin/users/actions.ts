"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/supabase/server";

const roleSchema = z.enum(["admin", "buzl_member", "business_owner"]);
const statusSchema = z.enum(["invited", "active", "inactive", "suspended"]);
const presetSchema = z.enum(["onboarding_member", "listing_manager"]).nullable();

export type ManagedUser = {
  id: string;
  email: string | undefined;
  phone: string | null;
  fullName: string | null;
  role: "admin" | "buzl_member" | "business_owner";
  memberId: string | null;
  accountStatus: "invited" | "active" | "inactive" | "suspended";
  permissionPreset: "onboarding_member" | "listing_manager" | null;
  providers: string[];
  lastSignInAt: string | null;
  createdAt: string;
};

export type UserAssociatedBusiness = {
  id: string;
  listing_code: string;
  canonical_name: string;
  slug: string;
  city: string;
  state: string;
  publication_status: string;
  verification_status: string;
  managerRole: string;
};

async function requireAdmin() {
  const user = await getSessionUser();
  if (!user?.isAdmin || user.accountStatus !== "active") {
    throw new Error("Administrator access is required.");
  }
  return user;
}

function text(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function revalidateUsers() {
  revalidatePath("/admin/users");
}

export async function listManagedUsers(): Promise<ManagedUser[]> {
  await requireAdmin();
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw new Error("Unable to load users.");

  const ids = data.users.map((user) => user.id);
  const { data: profiles, error: profileError } = ids.length
    ? await admin.from("profiles").select("id, full_name, member_id, account_status, permission_preset").in("id", ids)
    : { data: [], error: null };
  if (profileError) throw new Error("Unable to load user profiles.");
  const byId = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

  return data.users.map((user) => {
    const profile = byId.get(user.id);
    const role = roleSchema.safeParse(user.app_metadata?.role).data ?? "business_owner";
    return {
      id: user.id,
      email: user.email,
      phone: user.phone ?? null,
      fullName: profile?.full_name ?? null,
      role,
      memberId: profile?.member_id ?? null,
      accountStatus: statusSchema.safeParse(profile?.account_status).data ?? "active",
      permissionPreset: presetSchema.safeParse(profile?.permission_preset ?? null).data ?? null,
      providers: Array.isArray(user.app_metadata?.providers) ? user.app_metadata.providers.filter((value): value is string => typeof value === "string") : [],
      lastSignInAt: user.last_sign_in_at ?? null,
      createdAt: user.created_at,
    };
  }).sort((a, b) => (a.email ?? "").localeCompare(b.email ?? ""));
}

export async function inviteManagedUser(formData: FormData) {
  await requireAdmin();
  const email = z.string().email().parse(text(formData, "email"));
  const fullName = z.string().min(1).max(120).parse(text(formData, "fullName"));
  const role = roleSchema.parse(text(formData, "role"));
  const preset = role === "buzl_member" ? presetSchema.parse(text(formData, "permissionPreset") || null) : null;
  const memberId = role === "buzl_member" ? z.string().max(80).parse(text(formData, "memberId")) || null : null;
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, { data: { full_name: fullName } });
  if (error || !data.user) throw new Error(error?.message ?? "Unable to invite user.");
  const { error: roleError } = await admin.auth.admin.updateUserById(data.user.id, {
    app_metadata: { ...data.user.app_metadata, role },
  });
  if (roleError) throw new Error("Invite was created but its role could not be assigned.");
  const { error: profileError } = await admin.from("profiles").upsert({
    id: data.user.id, full_name: fullName, member_id: memberId, account_status: "invited", permission_preset: preset,
  });
  if (profileError) throw new Error("Invite was created but its profile could not be prepared.");
  revalidateUsers();
}

export async function updateManagedUser(formData: FormData) {
  const currentUser = await requireAdmin();
  const id = z.string().uuid().parse(text(formData, "id"));
  const role = roleSchema.parse(text(formData, "role"));
  const status = statusSchema.parse(text(formData, "accountStatus"));
  const preset = role === "buzl_member" ? presetSchema.parse(text(formData, "permissionPreset") || null) : null;
  const memberId = role === "buzl_member" ? z.string().max(80).parse(text(formData, "memberId")) || null : null;
  const fullName = z.string().min(1).max(120).parse(text(formData, "fullName"));

  // 1. Admin Self-Protection: Administrators cannot demote or deactivate their own active account
  if (id === currentUser.id && (role !== "admin" || status !== "active")) {
    throw new Error("Administrators cannot demote or deactivate their own active account.");
  }

  const admin = createAdminClient();
  const { data: existing, error: existingError } = await admin.auth.admin.getUserById(id);
  if (existingError || !existing.user) throw new Error("User not found.");

  // 2. Last Active Admin Protection: Ensure platform never has 0 active admins
  const isTargetAdmin = existing.user.app_metadata?.role === "admin";
  if (isTargetAdmin && (role !== "admin" || status !== "active")) {
    const { data: allUsers } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const otherAdminIds = (allUsers?.users || [])
      .filter((u) => u.id !== id && u.app_metadata?.role === "admin")
      .map((u) => u.id);

    const { data: otherActiveAdminProfiles } = otherAdminIds.length
      ? await admin.from("profiles").select("id").in("id", otherAdminIds).eq("account_status", "active")
      : { data: [] };

    if (!otherActiveAdminProfiles || otherActiveAdminProfiles.length === 0) {
      throw new Error("Cannot demote or deactivate the last active administrator.");
    }
  }

  const { error: roleError } = await admin.auth.admin.updateUserById(id, {
    app_metadata: { ...existing.user.app_metadata, role },
    ban_duration: status === "suspended" ? "876000h" : "none",
  });
  if (roleError) throw new Error("Unable to update account authentication settings.");
  const { error: profileError } = await admin.from("profiles").upsert({
    id, full_name: fullName, member_id: memberId, account_status: status, permission_preset: preset,
  });
  if (profileError) throw new Error("Unable to update account profile.");
  if (status !== "active") {
    const { error } = await admin.auth.admin.signOut(id, "global");
    if (error) throw new Error("Account saved but existing sessions could not be revoked.");
  }
  revalidateUsers();
}

type BusinessManagerQueryResult = {
  role: string | null;
  business: {
    id: string;
    listing_code: string | null;
    canonical_name: string;
    slug: string;
    city: string | null;
    state: string | null;
    publication_status: string;
    verification_status: string;
  } | null;
};

export async function getUserBusinesses(userId: string): Promise<UserAssociatedBusiness[]> {
  await requireAdmin();
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("business_managers")
    .select("role, business:businesses(id, listing_code, canonical_name, slug, city, state, publication_status, verification_status)")
    .eq("user_id", userId);

  if (error || !data) return [];
  const rows = data as unknown as BusinessManagerQueryResult[];
  return rows
    .filter((row): row is BusinessManagerQueryResult & { business: NonNullable<BusinessManagerQueryResult["business"]> } => Boolean(row.business))
    .map((row) => ({
      id: row.business.id,
      listing_code: row.business.listing_code ?? "",
      canonical_name: row.business.canonical_name,
      slug: row.business.slug,
      city: row.business.city ?? "",
      state: row.business.state ?? "",
      publication_status: row.business.publication_status,
      verification_status: row.business.verification_status,
      managerRole: row.role || "owner",
    }));
}

export async function resetManagedUserPassword(formData: FormData) {
  await requireAdmin();
  const email = z.string().email().parse(text(formData, "email"));
  const admin = createAdminClient();
  const { error } = await admin.auth.resetPasswordForEmail(email);
  if (error) throw new Error("Unable to send password reset.");
}

export async function revokeManagedUserSessions(formData: FormData) {
  await requireAdmin();
  const id = z.string().uuid().parse(text(formData, "id"));
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.signOut(id, "global");
  if (error) throw new Error("Unable to revoke sessions.");
}
