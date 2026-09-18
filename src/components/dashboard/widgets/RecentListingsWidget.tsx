import React from 'react';
import Link from 'next/link';
import { DashboardListingItem } from '@/lib/dashboard-data';
import StatusBadge from '@/components/ui/StatusBadge';

interface RecentListingsWidgetProps {
  items: DashboardListingItem[];
  viewAllHref?: string;
  title?: string;
}

export default function RecentListingsWidget({
  items,
  viewAllHref = '/dashboard/businesses',
  title = 'Recent Listings',
}: RecentListingsWidgetProps) {
  return (
    <div className="bg-white rounded-[8px] border border-[#DCE2E8] shadow-xs overflow-hidden">
      <div className="px-5 py-4 border-b border-[#DCE2E8] flex items-center justify-between">
        <h2 className="text-sm font-bold text-[#2A3547]">{title}</h2>
        <Link
          href={viewAllHref}
          className="text-xs font-semibold text-[#004AAD] hover:underline"
        >
          View all →
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="p-8 text-center text-[#5D6776]">
          <h3 className="text-xs font-bold text-[#2A3547]">No listings found</h3>
          <p className="text-[11px] text-[#7D8795] mt-0.5">
            No businesses are available in the system yet.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F2F5FA] border-b border-[#DCE2E8] text-[10px] font-bold text-[#7D8795] uppercase tracking-wider">
                <th className="py-2.5 px-5">Business & Listing ID</th>
                <th className="py-2.5 px-4">Category</th>
                <th className="py-2.5 px-4">Location</th>
                <th className="py-2.5 px-4">Publication</th>
                <th className="py-2.5 px-4">Verification</th>
                <th className="py-2.5 px-4">Updated</th>
                <th className="py-2.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCE2E8] text-xs text-[#2A3547]">
              {items.map((b) => (
                <tr key={b.id} className="hover:bg-[#F2F5FA]/50 transition-colors">
                  <td className="py-3 px-5">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <Link
                        href={`/dashboard/businesses/${b.id}/edit`}
                        className="font-semibold text-[#2A3547] hover:text-[#004AAD]"
                      >
                        {b.canonical_name}
                      </Link>
                      <span className="font-mono text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200 self-start sm:self-auto">
                        {b.listing_code}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-[#5D6776]">{b.category_name || '—'}</td>
                  <td className="py-3 px-4 text-[#5D6776]">
                    {b.city ? `${b.city}, ${b.state}` : '—'}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={b.publication_status} type="publication" />
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                        b.verification_status === 'verified'
                          ? 'bg-[#E3F2EA] text-[#087C3C] border-[#BCE5CF]'
                          : b.verification_status === 'pending'
                          ? 'bg-[#FFF6DF] text-[#9A6700] border-[#FFE7A8]'
                          : 'bg-[#F2F5FA] text-[#5D6776] border-[#DCE2E8]'
                      }`}
                    >
                      {b.verification_status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[#7D8795] text-[11px]">
                    {new Date(b.updated_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td className="py-3 px-5 text-right flex items-center justify-end gap-2">
                    {b.publication_status === 'published' && (
                      <Link
                        href={`/business/${b.slug}`}
                        target="_blank"
                        className="text-xs font-semibold text-[#087C3C] hover:underline"
                      >
                        View ↗
                      </Link>
                    )}
                    <Link
                      href={`/dashboard/businesses/${b.id}/edit`}
                      className="text-xs font-semibold text-[#004AAD] hover:underline"
                    >
                      Manage →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
