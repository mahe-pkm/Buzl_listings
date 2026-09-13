/**
 * Server-side Supabase calls can use a Docker-reachable endpoint without
 * changing the public browser endpoint compiled into the client bundle.
 */
export function getServerSupabaseUrl(): string {
  return process.env.SUPABASE_INTERNAL_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
}
