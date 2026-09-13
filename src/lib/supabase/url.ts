/**
 * Server-side Supabase calls can use a Docker-reachable endpoint without
 * changing the public browser endpoint compiled into the client bundle.
 */
export function getServerSupabaseUrl(): string {
  return process.env.SUPABASE_INTERNAL_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
}

/**
 * Supabase derives its default auth cookie name from the URL hostname. Server
 * requests may use a Docker-only URL, but browser sessions are always created
 * from the public URL. Keep server-side cookie lookup tied to that public URL.
 */
export function getPublicSupabaseAuthCookieName(): string {
  const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!publicUrl) throw new Error("NEXT_PUBLIC_SUPABASE_URL is required");

  return `sb-${new URL(publicUrl).hostname.split(".")[0]}-auth-token`;
}
