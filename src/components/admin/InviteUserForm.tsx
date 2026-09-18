'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { inviteManagedUser } from '@/app/admin/users/actions';

export default function InviteUserForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<'business_owner' | 'buzl_member' | 'admin'>('business_owner');
  const [permissionPreset, setPermissionPreset] = useState<string>('onboarding_member');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        await inviteManagedUser(formData);
        router.push('/admin/users');
        router.refresh();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unable to send invitation. Please check the details and try again.';
        setError(message);
      }
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Breadcrumb navigation */}
      <nav className="mb-6">
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

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#2A3547]">Invite New User</h1>
        <p className="text-sm text-[#5D6776] mt-1">
          Send an invitation email with role assignment and permission presets.
        </p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-6 rounded-xl border border-[#F9C6CB] bg-[#FDECEE] p-4 text-sm text-[#C93B2B] flex items-start gap-3">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-[#C93B2B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1 font-medium">{error}</div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="rounded-xl border border-[#DCE2E8] bg-white p-6 shadow-sm space-y-6">
        {/* Full Name */}
        <div>
          <label htmlFor="fullName" className="block text-sm font-semibold text-[#2A3547]">
            Full Name <span className="text-[#C93B2B]">*</span>
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            required
            placeholder="e.g. Ramesh Kumar"
            className="mt-1.5 w-full rounded-lg border border-[#DCE2E8] px-3.5 py-2.5 text-sm text-[#2A3547] placeholder-[#A0AEC0] focus:outline-none focus:ring-2 focus:ring-[#004AAD] focus:border-transparent"
          />
          <p className="mt-1 text-xs text-[#5D6776]">Primary contact name for the account profile.</p>
        </div>

        {/* Email Address */}
        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-[#2A3547]">
            Email Address <span className="text-[#C93B2B]">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="e.g. user@buzl.in"
            className="mt-1.5 w-full rounded-lg border border-[#DCE2E8] px-3.5 py-2.5 text-sm text-[#2A3547] placeholder-[#A0AEC0] focus:outline-none focus:ring-2 focus:ring-[#004AAD] focus:border-transparent"
          />
          <p className="mt-1 text-xs text-[#5D6776]">
            Authentication email. The user will receive an invite confirmation at this address.
          </p>
        </div>

        {/* Role Selection */}
        <div>
          <label className="block text-sm font-semibold text-[#2A3547] mb-2">
            Platform Role <span className="text-[#C93B2B]">*</span>
          </label>
          <input type="hidden" name="role" value={role} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Business Owner */}
            <div
              onClick={() => setRole('business_owner')}
              className={`cursor-pointer rounded-xl border p-4 transition-all ${
                role === 'business_owner'
                  ? 'border-[#004AAD] bg-[#ECF4FF] shadow-sm ring-1 ring-[#004AAD]'
                  : 'border-[#DCE2E8] bg-white hover:border-[#BEDBFE] hover:bg-[#F8FAFC]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-[#004AAD]">Business Owner</span>
                <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  role === 'business_owner' ? 'border-[#004AAD] bg-[#004AAD]' : 'border-[#DCE2E8]'
                }`}>
                  {role === 'business_owner' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                </span>
              </div>
              <p className="mt-2 text-xs text-[#5D6776] leading-relaxed">
                Manages claimed or created business listings. No access to internal tools.
              </p>
            </div>

            {/* Buzl Member */}
            <div
              onClick={() => setRole('buzl_member')}
              className={`cursor-pointer rounded-xl border p-4 transition-all ${
                role === 'buzl_member'
                  ? 'border-[#6929C4] bg-[#F0EBFF] shadow-sm ring-1 ring-[#6929C4]'
                  : 'border-[#DCE2E8] bg-white hover:border-[#D9C4FF] hover:bg-[#F8FAFC]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-[#6929C4]">Buzl Member</span>
                <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  role === 'buzl_member' ? 'border-[#6929C4] bg-[#6929C4]' : 'border-[#DCE2E8]'
                }`}>
                  {role === 'buzl_member' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                </span>
              </div>
              <p className="mt-2 text-xs text-[#5D6776] leading-relaxed">
                Internal staff/operator. Imports, edits, and manages listings via presets.
              </p>
            </div>

            {/* Admin */}
            <div
              onClick={() => setRole('admin')}
              className={`cursor-pointer rounded-xl border p-4 transition-all ${
                role === 'admin'
                  ? 'border-[#087C3C] bg-[#E3F2EA] shadow-sm ring-1 ring-[#087C3C]'
                  : 'border-[#DCE2E8] bg-white hover:border-[#BCE5CF] hover:bg-[#F8FAFC]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-[#087C3C]">Platform Admin</span>
                <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  role === 'admin' ? 'border-[#087C3C] bg-[#087C3C]' : 'border-[#DCE2E8]'
                }`}>
                  {role === 'admin' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                </span>
              </div>
              <p className="mt-2 text-xs text-[#5D6776] leading-relaxed">
                Full platform administration, user management, and publication authority.
              </p>
            </div>
          </div>
        </div>

        {/* Role-Specific Conditional Sections */}
        {role === 'buzl_member' && (
          <div className="rounded-xl border border-[#D9C4FF] bg-[#FAF8FF] p-4.5 space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-[#6929C4]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Buzl Member Details & Presets
            </div>

            {/* Buzl Member ID */}
            <div>
              <label htmlFor="memberId" className="block text-xs font-semibold text-[#2A3547]">
                Buzl Member ID (Staff Identifier)
              </label>
              <input
                id="memberId"
                name="memberId"
                type="text"
                placeholder="e.g. BUZL-M-1024"
                className="mt-1 w-full rounded-lg border border-[#DCE2E8] px-3.5 py-2 text-sm font-mono text-[#2A3547] placeholder-[#A0AEC0] bg-white focus:outline-none focus:ring-2 focus:ring-[#6929C4] focus:border-transparent"
              />
              <p className="mt-1 text-[11px] text-[#5D6776]">
                Assigned internal identifier, stamped on listings created or imported by this member.
              </p>
            </div>

            {/* Permission Preset */}
            <div>
              <label htmlFor="permissionPreset" className="block text-xs font-semibold text-[#2A3547]">
                Permission Preset
              </label>
              <select
                id="permissionPreset"
                name="permissionPreset"
                value={permissionPreset}
                onChange={(e) => setPermissionPreset(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#DCE2E8] px-3 py-2 text-sm text-[#2A3547] bg-white focus:outline-none focus:ring-2 focus:ring-[#6929C4] focus:border-transparent font-medium"
              >
                <option value="onboarding_member">
                  Onboarding Member — Create, edit, import, and submit listings
                </option>
                <option value="listing_manager">
                  Listing Manager — Manage, review, publish, and suspend listings
                </option>
                <option value="">None / Custom permissions</option>
              </select>
              <div className="mt-2 text-[11px] text-[#5D6776] bg-white p-2.5 rounded-lg border border-[#E9E4F5]">
                {permissionPreset === 'onboarding_member' ? (
                  <span>
                    <strong>Onboarding Member Preset:</strong> Grants permission to use the JSON Importer, create listings, and submit listings for review. Cannot publish directly.
                  </span>
                ) : permissionPreset === 'listing_manager' ? (
                  <span>
                    <strong>Listing Manager Preset:</strong> Grants listing management authority including updating listing statuses and managing business details.
                  </span>
                ) : (
                  <span>No preset selected. Member will inherit default member baseline permissions.</span>
                )}
              </div>
            </div>
          </div>
        )}

        {role === 'admin' && (
          <div className="rounded-xl border border-[#BCE5CF] bg-[#F2FBF6] p-4 text-xs text-[#087C3C] flex items-start gap-3">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-[#087C3C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <div>
              <strong className="block font-bold text-sm text-[#087C3C] mb-1">Administrative Privileges</strong>
              Platform Administrators have full authority across all businesses, users, categories, and moderation workflows. Ensure the invited recipient is authorized for platform operations.
            </div>
          </div>
        )}

        {role === 'business_owner' && (
          <div className="rounded-xl border border-[#BEDBFE] bg-[#F6FAFF] p-4 text-xs text-[#004AAD] flex items-start gap-3">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-[#004AAD]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <strong className="block font-bold text-sm text-[#004AAD] mb-1">Business Owner Account</strong>
              This user will receive an email invitation to access the owner portal. After signing up, their account can be assigned as the manager/owner of any business listing.
            </div>
          </div>
        )}

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#DCE2E8]">
          <Link
            href="/admin/users"
            className="px-4 py-2.5 rounded-lg border border-[#DCE2E8] text-sm font-semibold text-[#5D6776] hover:bg-[#F2F5FA] transition-colors"
          >
            Cancel
          </Link>
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
                Sending Invite...
              </>
            ) : (
              'Send Invite'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
