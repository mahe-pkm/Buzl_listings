'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { ManagedUser, UserAssociatedBusiness } from '@/app/admin/users/actions';
import {
  updateManagedUser,
  resetManagedUserPassword,
  revokeManagedUserSessions,
} from '@/app/admin/users/actions';

interface ManageUserFormProps {
  user: ManagedUser;
  isSelf: boolean;
  associatedBusinesses: UserAssociatedBusiness[];
}

export default function ManageUserForm({
  user,
  isSelf,
  associatedBusinesses,
}: ManageUserFormProps) {
  const router = useRouter();

  // Form states
  const [fullName, setFullName] = useState(user.fullName || '');
  const [role, setRole] = useState<ManagedUser['role']>(user.role);
  const [accountStatus, setAccountStatus] = useState<ManagedUser['accountStatus']>(user.accountStatus);
  const [permissionPreset, setPermissionPreset] = useState<string>(user.permissionPreset || '');
  const [memberId, setMemberId] = useState<string>(user.memberId || '');

  // Action status states
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Security action states
  const [resetPending, setResetPending] = useState(false);
  const [resetFeedback, setResetFeedback] = useState<string | null>(null);

  const [revokePending, setRevokePending] = useState(false);
  const [revokeFeedback, setRevokeFeedback] = useState<string | null>(null);

  // Modal confirmation states
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(false);

  // Handlers
  const handleProfileSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // If changing to suspended and not yet confirmed, trigger modal
    if (accountStatus === 'suspended' && user.accountStatus !== 'suspended' && !showSuspendModal) {
      setShowSuspendModal(true);
      return;
    }

    executeSave();
  };

  const executeSave = () => {
    setShowSuspendModal(false);
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append('id', user.id);
        formData.append('fullName', fullName);
        formData.append('role', role);
        formData.append('accountStatus', accountStatus);
        formData.append('permissionPreset', role === 'buzl_member' ? permissionPreset : '');
        formData.append('memberId', role === 'buzl_member' ? memberId : '');

        await updateManagedUser(formData);
        setSuccessMessage('User account updated successfully.');
        router.refresh();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to update user account.';
        setErrorMessage(message);
      }
    });
  };

  const handlePasswordReset = async () => {
    if (!user.email) return;
    setResetPending(true);
    setResetFeedback(null);
    try {
      const formData = new FormData();
      formData.append('email', user.email);
      await resetManagedUserPassword(formData);
      setResetFeedback('Password reset email dispatched successfully.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to dispatch reset email.';
      setResetFeedback(`Error: ${message}`);
    } finally {
      setResetPending(false);
    }
  };

  const handleRevokeSessions = async () => {
    setShowRevokeModal(false);
    setRevokePending(true);
    setRevokeFeedback(null);
    try {
      const formData = new FormData();
      formData.append('id', user.id);
      await revokeManagedUserSessions(formData);
      setRevokeFeedback('All active sessions revoked successfully.');
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to revoke sessions.';
      setRevokeFeedback(`Error: ${message}`);
    } finally {
      setRevokePending(false);
    }
  };

  const getInitials = (name: string | null, email?: string) => {
    if (name && name.trim()) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return parts[0].slice(0, 2).toUpperCase();
    }
    if (email) return email.slice(0, 2).toUpperCase();
    return 'U';
  };

  const getRoleBadge = (r: ManagedUser['role']) => {
    switch (r) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E3F2EA] text-[#087C3C] border border-[#BCE5CF]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#087C3C]" />
            Admin
          </span>
        );
      case 'buzl_member':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F0EBFF] text-[#6929C4] border border-[#D9C4FF]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#6929C4]" />
            Buzl Member
          </span>
        );
      case 'business_owner':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#ECF4FF] text-[#004AAD] border border-[#BEDBFE]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#004AAD]" />
            Business Owner
          </span>
        );
    }
  };

  const getStatusBadge = (s: ManagedUser['accountStatus']) => {
    switch (s) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E3F2EA] text-[#087C3C] border border-[#BCE5CF]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#087C3C] animate-pulse" />
            Active
          </span>
        );
      case 'invited':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FFF6DF] text-[#9A6700] border border-[#FFE7A8]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#9A6700]" />
            Invited
          </span>
        );
      case 'suspended':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FDECEE] text-[#C93B2B] border border-[#F9C6CB]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C93B2B]" />
            Suspended
          </span>
        );
      case 'inactive':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F2F5FA] text-[#5D6776] border border-[#DCE2E8]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#5D6776]" />
            Inactive
          </span>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Navigation Breadcrumb */}
      <nav>
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#5D6776] hover:text-[#004AAD] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Users
        </Link>
      </nav>

      {/* User Overview Header Card */}
      <div className="rounded-xl border border-[#DCE2E8] bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#ECF4FF] text-[#004AAD] font-bold text-lg flex items-center justify-center flex-shrink-0 border border-[#BEDBFE]">
              {getInitials(user.fullName, user.email)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-[#2A3547]">
                  {user.fullName || <span className="text-[#A0AEC0] italic font-normal">No name configured</span>}
                </h1>
                {isSelf && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#FFF6DF] text-[#9A6700] border border-[#FFE7A8]">
                    Current Admin (You)
                  </span>
                )}
              </div>
              <p className="text-sm font-mono text-[#5D6776] mt-0.5">{user.email}</p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {getRoleBadge(user.role)}
                {getStatusBadge(user.accountStatus)}
                {user.memberId && (
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#F2F5FA] text-[#2A3547] border border-[#DCE2E8]">
                    ID: {user.memberId}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="text-xs text-[#5D6776] sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-[#F2F5FA]">
            <div>
              Created:{' '}
              <span className="font-medium text-[#2A3547]">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
              </span>
            </div>
            <div className="mt-1">
              Last sign-in:{' '}
              <span className="font-medium text-[#2A3547]">
                {user.lastSignInAt ? new Date(user.lastSignInAt).toLocaleString() : 'Never'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Self-Protection Notice */}
      {isSelf && (
        <div className="rounded-xl border border-[#BEDBFE] bg-[#ECF4FF] p-4 text-xs text-[#004AAD] flex items-start gap-3">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-[#004AAD]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <div>
            <strong className="block font-bold text-sm text-[#004AAD] mb-1">
              Self-Account Protection Active
            </strong>
            You are managing your own signed-in administrator account. To prevent accidental lockout, your role is locked to Admin and your account status is locked to Active.
          </div>
        </div>
      )}

      {/* Messages */}
      {errorMessage && (
        <div className="rounded-xl border border-[#F9C6CB] bg-[#FDECEE] p-4 text-sm text-[#C93B2B] flex items-start gap-3">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-[#C93B2B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="font-medium">{errorMessage}</div>
        </div>
      )}

      {successMessage && (
        <div className="rounded-xl border border-[#BCE5CF] bg-[#E3F2EA] p-4 text-sm text-[#087C3C] flex items-start gap-3">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-[#087C3C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <div className="font-medium">{successMessage}</div>
        </div>
      )}

      {/* Main Edit Form */}
      <form onSubmit={handleProfileSubmit} className="rounded-xl border border-[#DCE2E8] bg-white p-6 shadow-sm space-y-6">
        <div className="border-b border-[#DCE2E8] pb-4">
          <h2 className="text-base font-bold text-[#2A3547]">Profile & Role Settings</h2>
          <p className="text-xs text-[#5D6776] mt-0.5">
            Configure identity, platform access tier, member presets, and account lifecycle state.
          </p>
        </div>

        {/* Full Name */}
        <div>
          <label htmlFor="editFullName" className="block text-sm font-semibold text-[#2A3547]">
            Full Name <span className="text-[#C93B2B]">*</span>
          </label>
          <input
            id="editFullName"
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-[#DCE2E8] px-3.5 py-2.5 text-sm text-[#2A3547] focus:outline-none focus:ring-2 focus:ring-[#004AAD] focus:border-transparent"
          />
        </div>

        {/* Role & Status Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Role */}
          <div>
            <label htmlFor="editRole" className="block text-sm font-semibold text-[#2A3547]">
              Platform Role
            </label>
            <select
              id="editRole"
              value={role}
              disabled={isSelf}
              onChange={(e) => setRole(e.target.value as ManagedUser['role'])}
              className={`mt-1.5 w-full rounded-lg border border-[#DCE2E8] px-3.5 py-2.5 text-sm text-[#2A3547] bg-white focus:outline-none focus:ring-2 focus:ring-[#004AAD] focus:border-transparent font-medium ${
                isSelf ? 'opacity-60 cursor-not-allowed bg-[#F8FAFC]' : ''
              }`}
            >
              <option value="business_owner">Business Owner</option>
              <option value="buzl_member">Buzl Member</option>
              <option value="admin">Platform Admin</option>
            </select>
            {isSelf && (
              <p className="mt-1 text-[11px] text-[#5D6776]">
                Locked because this is your active session.
              </p>
            )}
          </div>

          {/* Account Status */}
          <div>
            <label htmlFor="editAccountStatus" className="block text-sm font-semibold text-[#2A3547]">
              Account Status
            </label>
            <select
              id="editAccountStatus"
              value={accountStatus}
              disabled={isSelf}
              onChange={(e) => setAccountStatus(e.target.value as ManagedUser['accountStatus'])}
              className={`mt-1.5 w-full rounded-lg border border-[#DCE2E8] px-3.5 py-2.5 text-sm text-[#2A3547] bg-white focus:outline-none focus:ring-2 focus:ring-[#004AAD] focus:border-transparent font-medium ${
                isSelf ? 'opacity-60 cursor-not-allowed bg-[#F8FAFC]' : ''
              }`}
            >
              <option value="active">Active</option>
              <option value="invited">Invited</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
            {isSelf && (
              <p className="mt-1 text-[11px] text-[#5D6776]">
                Cannot suspend or deactivate your own active account.
              </p>
            )}
          </div>
        </div>

        {/* Warning if deactivating or suspending */}
        {!isSelf && (accountStatus === 'inactive' || accountStatus === 'suspended') && (
          <div className="rounded-lg border border-[#FFE7A8] bg-[#FFF6DF] p-3 text-xs text-[#9A6700] flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0 text-[#9A6700]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>
              <strong>Note:</strong> Setting status to {accountStatus} will immediately terminate all active sessions and revoke refresh tokens for this user.
            </span>
          </div>
        )}

        {/* Buzl Member Conditional Fields */}
        {role === 'buzl_member' && (
          <div className="rounded-xl border border-[#D9C4FF] bg-[#FAF8FF] p-4.5 space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-[#6929C4]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Buzl Member Details & Presets
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Member ID */}
              <div>
                <label htmlFor="editMemberId" className="block text-xs font-semibold text-[#2A3547]">
                  Buzl Member ID
                </label>
                <input
                  id="editMemberId"
                  type="text"
                  value={memberId}
                  onChange={(e) => setMemberId(e.target.value)}
                  placeholder="e.g. BUZL-M-1024"
                  className="mt-1 w-full rounded-lg border border-[#DCE2E8] px-3.5 py-2 text-sm font-mono text-[#2A3547] placeholder-[#A0AEC0] bg-white focus:outline-none focus:ring-2 focus:ring-[#6929C4] focus:border-transparent"
                />
              </div>

              {/* Preset */}
              <div>
                <label htmlFor="editPreset" className="block text-xs font-semibold text-[#2A3547]">
                  Permission Preset
                </label>
                <select
                  id="editPreset"
                  value={permissionPreset}
                  onChange={(e) => setPermissionPreset(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#DCE2E8] px-3 py-2 text-sm text-[#2A3547] bg-white focus:outline-none focus:ring-2 focus:ring-[#6929C4] focus:border-transparent font-medium"
                >
                  <option value="onboarding_member">Onboarding Member</option>
                  <option value="listing_manager">Listing Manager</option>
                  <option value="">None / Custom</option>
                </select>
              </div>
            </div>

            <div className="text-[11px] text-[#5D6776] bg-white p-2.5 rounded-lg border border-[#E9E4F5]">
              {permissionPreset === 'onboarding_member' ? (
                <span>
                  <strong>Onboarding Member:</strong> Can create, import, and edit business listings and submit for review.
                </span>
              ) : permissionPreset === 'listing_manager' ? (
                <span>
                  <strong>Listing Manager:</strong> Can manage listing content and update publication statuses where permitted.
                </span>
              ) : (
                <span>Standard baseline permissions.</span>
              )}
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#DCE2E8]">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#004AAD] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#003C8A] transition-colors disabled:opacity-50"
          >
            {isPending ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Saving Changes...
              </>
            ) : (
              'Save Account Changes'
            )}
          </button>
        </div>
      </form>

      {/* Authentication & Security Metadata Card */}
      <div className="rounded-xl border border-[#DCE2E8] bg-white p-6 shadow-sm space-y-4">
        <div className="border-b border-[#DCE2E8] pb-3">
          <h2 className="text-base font-bold text-[#2A3547]">Authentication & Identity Details</h2>
          <p className="text-xs text-[#5D6776] mt-0.5">
            System identifiers and authentication providers from Supabase Auth.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-xs font-semibold text-[#5D6776]">User ID (UUID)</div>
            <div className="mt-1 font-mono text-xs text-[#2A3547] bg-[#F8FAFC] p-2 rounded border border-[#E2E8F0] select-all break-all">
              {user.id}
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-[#5D6776]">Auth Email</div>
            <div className="mt-1 font-mono text-xs text-[#2A3547] bg-[#F8FAFC] p-2 rounded border border-[#E2E8F0] select-all">
              {user.email || '—'}
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-[#5D6776]">Auth Phone</div>
            <div className="mt-1 text-xs text-[#2A3547]">
              {user.phone ? <span className="font-mono">{user.phone}</span> : <span className="text-[#A0AEC0] italic">Not registered</span>}
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-[#5D6776]">Auth Providers</div>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {user.providers.length > 0 ? (
                user.providers.map((p) => (
                  <span key={p} className="px-2 py-0.5 rounded text-xs font-mono font-medium bg-[#F2F5FA] text-[#2A3547] border border-[#DCE2E8]">
                    {p}
                  </span>
                ))
              ) : (
                <span className="px-2 py-0.5 rounded text-xs font-mono font-medium bg-[#F2F5FA] text-[#2A3547] border border-[#DCE2E8]">
                  email
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Associated Businesses Card */}
      <div className="rounded-xl border border-[#DCE2E8] bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#DCE2E8] pb-3">
          <div>
            <h2 className="text-base font-bold text-[#2A3547]">Associated Businesses</h2>
            <p className="text-xs text-[#5D6776] mt-0.5">
              Listings where this user is linked as a manager or owner.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#F2F5FA] text-[#2A3547] border border-[#DCE2E8]">
            {associatedBusinesses.length} {associatedBusinesses.length === 1 ? 'Business' : 'Businesses'}
          </span>
        </div>

        {associatedBusinesses.length > 0 ? (
          <div className="divide-y divide-[#DCE2E8]">
            {associatedBusinesses.map((b) => (
              <div key={b.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="font-semibold text-sm text-[#2A3547] flex items-center gap-2">
                    <span>{b.canonical_name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-mono font-medium bg-[#ECF4FF] text-[#004AAD] uppercase">
                      {b.managerRole}
                    </span>
                  </div>
                  <div className="text-xs text-[#5D6776] mt-0.5">
                    {b.city && b.state ? `${b.city}, ${b.state}` : b.city || b.state || 'Location not specified'}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border uppercase ${
                    b.publication_status === 'published'
                      ? 'bg-[#E3F2EA] text-[#087C3C] border-[#BCE5CF]'
                      : 'bg-[#F2F5FA] text-[#5D6776] border-[#DCE2E8]'
                  }`}>
                    {b.publication_status}
                  </span>
                  <Link
                    href={`/dashboard/businesses/${b.id}`}
                    className="text-xs font-semibold text-[#004AAD] hover:underline"
                  >
                    View Listing →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-[#5D6776]">
            No business listings currently associated with this account.
          </div>
        )}
      </div>

      {/* Danger Zone Card: Reset Password & Revoke Sessions */}
      <div className="rounded-xl border border-[#F9C6CB] bg-white p-6 shadow-sm space-y-4">
        <div className="border-b border-[#F9C6CB] pb-3">
          <h2 className="text-base font-bold text-[#C93B2B]">Administrative Actions</h2>
          <p className="text-xs text-[#5D6776] mt-0.5">
            Security operations, session terminations, and authentication resets.
          </p>
        </div>

        {/* Feedback notices */}
        {resetFeedback && (
          <div className={`p-3 rounded-lg text-xs font-medium ${
            resetFeedback.startsWith('Error')
              ? 'bg-[#FDECEE] text-[#C93B2B] border border-[#F9C6CB]'
              : 'bg-[#E3F2EA] text-[#087C3C] border border-[#BCE5CF]'
          }`}>
            {resetFeedback}
          </div>
        )}

        {revokeFeedback && (
          <div className={`p-3 rounded-lg text-xs font-medium ${
            revokeFeedback.startsWith('Error')
              ? 'bg-[#FDECEE] text-[#C93B2B] border border-[#F9C6CB]'
              : 'bg-[#E3F2EA] text-[#087C3C] border border-[#BCE5CF]'
          }`}>
            {revokeFeedback}
          </div>
        )}

        <div className="space-y-4 pt-1">
          {/* Send Password Reset */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg border border-[#DCE2E8] bg-[#F8FAFC]">
            <div>
              <div className="text-sm font-semibold text-[#2A3547]">Password Reset Email</div>
              <div className="text-xs text-[#5D6776] mt-0.5">
                Sends a secure password recovery link to <span className="font-mono font-medium">{user.email}</span>.
              </div>
            </div>
            <button
              type="button"
              disabled={resetPending}
              onClick={handlePasswordReset}
              className="px-3.5 py-2 rounded-lg border border-[#004AAD] text-xs font-semibold text-[#004AAD] hover:bg-[#ECF4FF] transition-colors disabled:opacity-50 whitespace-nowrap self-start sm:self-center"
            >
              {resetPending ? 'Dispatching...' : 'Send Password Reset'}
            </button>
          </div>

          {/* Revoke Sessions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg border border-[#F9C6CB] bg-[#FFFBFB]">
            <div>
              <div className="text-sm font-semibold text-[#C93B2B]">Revoke Active Sessions</div>
              <div className="text-xs text-[#5D6776] mt-0.5">
                Immediately invalidates all refresh tokens and signs this user out across all devices.
              </div>
            </div>
            <button
              type="button"
              disabled={revokePending}
              onClick={() => setShowRevokeModal(true)}
              className="px-3.5 py-2 rounded-lg border border-[#C93B2B] text-xs font-semibold text-[#C93B2B] hover:bg-[#FDECEE] transition-colors disabled:opacity-50 whitespace-nowrap self-start sm:self-center"
            >
              {revokePending ? 'Revoking...' : 'Revoke All Sessions'}
            </button>
          </div>
        </div>
      </div>

      {/* Suspend Confirmation Modal */}
      {showSuspendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#DCE2E8] space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#FDECEE] text-[#C93B2B] flex items-center justify-center mx-auto">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-[#2A3547]">Suspend User Account?</h3>
              <p className="text-xs text-[#5D6776] mt-1">
                Suspending <strong>{user.fullName || user.email}</strong> will block all platform access and immediately terminate all active sessions.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowSuspendModal(false);
                  setAccountStatus(user.accountStatus);
                }}
                className="px-4 py-2 rounded-lg border border-[#DCE2E8] text-xs font-semibold text-[#5D6776] hover:bg-[#F2F5FA]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeSave}
                className="px-4 py-2 rounded-lg bg-[#C93B2B] text-xs font-semibold text-white hover:bg-[#A82B1C]"
              >
                Confirm Suspension
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revoke Sessions Confirmation Modal */}
      {showRevokeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#DCE2E8] space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#FDECEE] text-[#C93B2B] flex items-center justify-center mx-auto">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-[#2A3547]">Revoke All Sessions?</h3>
              <p className="text-xs text-[#5D6776] mt-1">
                This will terminate all active sign-ins for <strong>{user.fullName || user.email}</strong>. The user will be required to authenticate again.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowRevokeModal(false)}
                className="px-4 py-2 rounded-lg border border-[#DCE2E8] text-xs font-semibold text-[#5D6776] hover:bg-[#F2F5FA]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRevokeSessions}
                className="px-4 py-2 rounded-lg bg-[#C93B2B] text-xs font-semibold text-white hover:bg-[#A82B1C]"
              >
                Confirm Revocation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
