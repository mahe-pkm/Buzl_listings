export type AppRole = 'admin' | 'buzl_member' | 'business_owner';
export type Permission =
  | 'listing.view' | 'listing.create' | 'listing.edit' | 'listing.import' | 'listing.submit' | 'listing.publish' | 'listing.suspend'
  | 'user.view' | 'user.create' | 'user.activate' | 'user.reset_password' | 'member.view' | 'member.manage' | 'category.manage' | 'admin.access';
export type PermissionPreset = 'onboarding_member' | 'listing_manager' | null;

const ownerPermissions: Permission[] = ['listing.view', 'listing.create', 'listing.edit', 'listing.submit'];
const onboardingPermissions: Permission[] = ['listing.view', 'listing.create', 'listing.edit', 'listing.import', 'listing.submit'];
const managerPermissions: Permission[] = [...onboardingPermissions, 'listing.publish', 'listing.suspend'];

export function permissionsFor(role: AppRole, preset: PermissionPreset): Permission[] {
  if (role === 'admin') return ['listing.view', 'listing.create', 'listing.edit', 'listing.import', 'listing.submit', 'listing.publish', 'listing.suspend', 'user.view', 'user.create', 'user.activate', 'user.reset_password', 'member.view', 'member.manage', 'category.manage', 'admin.access'];
  if (role === 'buzl_member') return preset === 'listing_manager' ? managerPermissions : onboardingPermissions;
  return ownerPermissions;
}

export function can(role: AppRole, preset: PermissionPreset, permission: Permission) {
  return permissionsFor(role, preset).includes(permission);
}
