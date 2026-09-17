'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import StatusBadge from '@/components/ui/StatusBadge';
import TableToolbar from './TableToolbar';
import AdminBusinessRowActions from '@/components/admin/AdminBusinessRowActions';
import { PublicationStatus, VerificationStatus } from '@/types/business';

export interface BusinessTableRow {
  id: string;
  canonical_name: string;
  slug: string;
  location_mode: string;
  city: string;
  state: string;
  publication_status: PublicationStatus;
  verification_status: VerificationStatus;
  updated_at: string;
  primary_category_id: string;
  categoryName?: string;
}

interface BusinessTableViewProps {
  businesses: BusinessTableRow[];
  isAdmin?: boolean;
  moderationPermissions?: { publish: boolean; suspend: boolean; verify: boolean; delete: boolean };
}

export default function BusinessTableView({ businesses, isAdmin = false, moderationPermissions }: BusinessTableViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const canEdit = !isAdmin || moderationPermissions?.delete !== false;

  const filteredList = useMemo(() => {
    return businesses.filter((b) => {
      const matchesSearch =
        searchTerm.trim() === '' ||
        b.canonical_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.categoryName && b.categoryName.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = statusFilter === 'all' || b.publication_status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [businesses, searchTerm, statusFilter]);

  return (
    <div className="bg-white rounded-[8px] border border-[#DCE2E8] shadow-xs overflow-hidden">
      <TableToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        totalCount={filteredList.length}
      />

      {filteredList.length === 0 ? (
        <div className="p-12 text-center">
          <p className="text-xs text-[#5D6776]">No listings match your search criteria.</p>
          {(searchTerm || statusFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
              }}
              className="mt-2 text-xs font-semibold text-[#004AAD] hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F2F5FA] border-b border-[#DCE2E8] text-[11px] font-bold text-[#7D8795] uppercase tracking-wider">
                <th className="py-3 px-6">Business Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Mode</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Listing Status</th>
                <th className="py-3 px-4">Verification</th>
                <th className="py-3 px-4">Updated</th>
                <th className="py-3 px-6 text-right">{isAdmin ? 'Moderation Actions' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCE2E8] text-xs text-[#2A3547]">
              {filteredList.map((b) => {
                const updatedDate = new Date(b.updated_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });

                return (
                  <tr key={b.id} className="hover:bg-[#F2F5FA]/50 transition-colors">
                    <td className="py-3.5 px-6 font-semibold text-[#2A3547]">
                      {canEdit ? (
                        <Link href={`/dashboard/businesses/${b.id}/edit`} className="hover:text-[#004AAD] block">
                          {b.canonical_name}
                        </Link>
                      ) : b.canonical_name}
                      <span className="text-[11px] text-[#7D8795] font-normal">
                        /business/{b.slug}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#5D6776]">{b.categoryName || '—'}</td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={b.location_mode} type="mode" />
                    </td>
                    <td className="py-3.5 px-4 text-[#5D6776]">
                      {b.city}, {b.state}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={b.publication_status} type="publication" />
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={b.verification_status} type="verification" />
                    </td>
                    <td className="py-3.5 px-4 text-[#7D8795]">{updatedDate}</td>
                    <td className="py-3.5 px-6 text-right">
                      {isAdmin ? (
                        <AdminBusinessRowActions
                          businessId={b.id}
                          publicationStatus={b.publication_status}
                          verificationStatus={b.verification_status}
                          permissions={{
                            publish: moderationPermissions?.publish ?? true,
                            suspend: moderationPermissions?.suspend ?? true,
                            verify: moderationPermissions?.verify ?? true,
                            delete: moderationPermissions?.delete ?? true,
                            edit: canEdit,
                          }}
                        />
                      ) : (
                        <div className="flex items-center justify-end gap-3">
                          {b.publication_status === 'published' && (
                            <Link
                              href={`/business/${b.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
                            >
                              <span>View Listing</span>
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </Link>
                          )}
                          <Link
                            href={`/dashboard/businesses/${b.id}/edit`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[#004AAD] hover:underline"
                          >
                            Edit
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </Link>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
