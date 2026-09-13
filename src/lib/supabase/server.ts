import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getPublicSupabaseAuthCookieName, getServerSupabaseUrl } from "./url";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    getServerSupabaseUrl(),
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: { name: getPublicSupabaseAuthCookieName() },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Can be ignored if handled by middleware
          }
        },
      },
    }
  );
}

export async function getSessionUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const role = (user.app_metadata?.role as string) || "business_owner";
  const isAdmin = role === "admin";
  const isBuzlMember = role === "buzl_member";
  const isInternal = isAdmin || isBuzlMember;

  let memberId: string | null = null;
  let profileName: string | null = null;

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('member_id, full_name')
      .eq('id', user.id)
      .maybeSingle();

    if (profile) {
      memberId = profile.member_id || null;
      profileName = profile.full_name || null;
    }
  } catch {
    // If profile lookup fails, continue with auth user defaults
  }

  return {
    ...user,
    role,
    isAdmin,
    isBuzlMember,
    isInternal,
    memberId,
    profileName,
  };
}
