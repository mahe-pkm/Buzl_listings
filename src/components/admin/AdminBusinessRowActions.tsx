'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { transitionPublication, setVerification, deleteBusiness } from '@/lib/business-actions';
import { PublicationStatus, VerificationStatus } from '@/types/business';
import Link from 'next/link';

interface AdminBusinessRowActionsProps {
  businessId: string;
  publicationStatus: PublicationStatus;
  verificationStatus: VerificationStatus;
  permissions?: { publish: boolean; suspend: boolean; verify: boolean; delete: boolean; edit?: boolean };
}

export default function AdminBusinessRowActions({
  businessId,
  publicationStatus,
  verificationStatus,
  permissions = { publish: true, suspend: true, verify: true, delete: true, edit: true },
}: AdminBusinessRowActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handlePublish = () => {
    setError(null);
    startTransition(async () => {
      const res = await transitionPublication(businessId, 'published');
      if (res.success) {
        router.refresh();
      } else {
        setError(res.error || 'Publish failed');
      }
    });
  };

  const handleSuspend = () => {
    setError(null);
    startTransition(async () => {
      const res = await transitionPublication(businessId, 'suspended');
      if (res.success) {
        router.refresh();
      } else {
        setError(res.error || 'Suspend failed');
      }
    });
  };

  const handleVerify = () => {
    setError(null);
    startTransition(async () => {
      const next: VerificationStatus = verificationStatus === 'verified' ? 'unverified' : 'verified';
      const res = await setVerification(businessId, next);
      if (res.success) {
        router.refresh();
      } else {
        setError(res.error || 'Verification toggle failed');
      }
    });
  };

  const handleDelete = () => {
    if (!confirm('Are you sure you want to permanently delete this listing?')) return;
    setError(null);
    startTransition(async () => {
      const res = await deleteBusiness(businessId);
      if (res.success) {
        router.refresh();
      } else {
        setError(res.error || 'Delete failed');
      }
    });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      {error && <span className="text-[10px] text-[#E36B5D] font-medium">{error}</span>}
      <div className="flex items-center gap-1.5">
        {permissions.edit !== false && <Link
          href={`/dashboard/businesses/${businessId}/edit`}
          className="px-2 py-1 rounded bg-[#F2F5FA] text-[#2A3547] text-[11px] font-semibold hover:bg-[#EAEFF4] transition-colors border border-[#DCE2E8]"
        >
          Edit
        </Link>}

        {publicationStatus !== 'published' && permissions.publish ? (
          <button
            type="button"
            disabled={isPending}
            onClick={handlePublish}
            className="px-2.5 py-1 rounded bg-[#087C3C] text-white text-[11px] font-semibold hover:bg-[#06612F] transition-colors disabled:opacity-50"
          >
            Publish
          </button>
        ) : publicationStatus === 'published' && permissions.suspend ? (
          <button
            type="button"
            disabled={isPending}
            onClick={handleSuspend}
            className="px-2.5 py-1 rounded bg-[#E36B5D] text-white text-[11px] font-semibold hover:bg-[#C93B2B] transition-colors disabled:opacity-50"
          >
            Suspend
          </button>
        ) : null}

        {permissions.verify && <button
          type="button"
          disabled={isPending}
          onClick={handleVerify}
          className="px-2 py-1 rounded bg-white text-[#004AAD] text-[11px] font-semibold hover:bg-[#ECF4FF] transition-colors border border-[#BEDBFE] disabled:opacity-50"
        >
          {verificationStatus === 'verified' ? 'Unverify' : 'Verify'}
        </button>}

        {permissions.delete && <button
          type="button"
          disabled={isPending}
          onClick={handleDelete}
          className="p-1 rounded text-[#7D8795] hover:text-[#E36B5D] hover:bg-[#FDECEE] transition-colors"
          title="Delete Listing"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>}
      </div>
    </div>
  );
}
