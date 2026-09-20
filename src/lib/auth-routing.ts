import type { SupabaseClient, User } from '@supabase/supabase-js';

export type TrustedAppRole = 'admin' | 'buzl_member' | 'business_owner';

type ProfileAuthState = {
  account_status: string | null;
  onboarding_completed_at: string | null;
};

export function routeForAuthenticatedUser(
  role: TrustedAppRole,
  onboardingCompletedAt: string | null,
  requestedPath = '/dashboard'
): string {
  if (role === 'admin') {
    return requestedPath === '/dashboard' || requestedPath === '/onboarding'
      ? '/admin/businesses'
      : requestedPath;
  }

  if (role === 'buzl_member') {
    return requestedPath === '/dashboard' || requestedPath === '/onboarding'
      ? '/admin/businesses/import'
      : requestedPath;
  }

  if (!onboardingCompletedAt) return '/onboarding';
  return requestedPath === '/onboarding' ? '/dashboard' : requestedPath;
}

export async function resolveAuthenticatedRoute(
  supabase: SupabaseClient,
  user: User,
  requestedPath = '/dashboard'
): Promise<string> {
  const role = (user.app_metadata?.role ?? 'business_owner') as TrustedAppRole;
  const { data, error } = await supabase
    .from('profiles')
    .select('account_status, onboarding_completed_at')
    .eq('id', user.id)
    .single<ProfileAuthState>();

  if (error || !data) {
    throw new Error('PROFILE_UNAVAILABLE');
  }

  if (data.account_status !== 'active') {
    throw new Error('ACCOUNT_INACTIVE');
  }

  return routeForAuthenticatedUser(role, data.onboarding_completed_at, requestedPath);
}
