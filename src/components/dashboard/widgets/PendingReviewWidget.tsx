import React from 'react';
import Link from 'next/link';
import { DashboardListingItem } from '@/lib/dashboard-data';

interface PendingReviewWidgetProps {
  items: DashboardListingItem[];
  canModerate?: boolean;
}

export default function PendingReviewWidget({
  items,
  canModerate = false,
}: PendingReviewWidgetProps) {
  return (
    <div className="bg-white rounded-[8px] border border-[#DCE2E8] shadow-xs overflow-hidden">
      <div className="px-5 py-4 border-b border-[#DCE2E8] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#D99B18]" />
          <h2 className="text-sm font-bold text-[#2A3547]">Pending Moderation Review</h2>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#FFF6DF] text-[#9A6700] border border-[#FFE7A8]">
            {items.length}
          </span>
        </div>
        {canModerate && (
          <Link
            href="/review/businesses"
            className="text-xs font-semibold text-[#004AAD] hover:underline"
          >
            View Moderation Queue →
          </Link>
        )}
      </div>

      {items.length === 0 ? (
        <div className="p-8 text-center text-[#5D6776]">
          <div className="w-10 h-10 rounded-full bg-[#E3F2EA] text-[#087C3C] flex items-center justify-center mx-auto mb-2.5">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xs font-bold text-[#2A3547]">All caught up</h3>
          <p className="text-[11px] text-[#7D8795] mt-0.5">
            No business listings are currently awaiting publication review.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F2F5FA] border-b border-[#DCE2E8] text-[10px] font-bold text-[#7D8795] uppercase tracking-wider">
                <th className="py-2.5 px-5">Business Name & Listing ID</th>
                <th className="py-2.5 px-4">Category</th>
                <th className="py-2.5 px-4">Location</th>
                <th className="py-2.5 px-4">Submitted / Updated</th>
                <th className="py-2.5 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCE2E8] text-xs text-[#2A3547]">
              {items.map((b) => (
                <tr key={b.id} className="hover:bg-[#F2F5FA]/50 transition-colors">
                  <td className="py-3 px-5">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <span className="font-semibold text-[#2A3547]">{b.canonical_name}</span>
                      <span className="font-mono text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200 self-start sm:self-auto">
                        {b.listing_code}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-[#5D6776]">
                    {b.category_name || '—'}
                  </td>
                  <td className="py-3 px-4 text-[#5D6776]">
                    {b.city ? `${b.city}, ${b.state}` : '—'}
                  </td>
                  <td className="py-3 px-4 text-[#7D8795] text-[11px]">
                    {new Date(b.updated_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="py-3 px-5 text-right">
                    {canModerate ? (
                      <Link
                        href={`/review/businesses`}
                        className="text-xs font-semibold text-[#004AAD] hover:underline"
                      >
                        Review →
                      </Link>
                    ) : (
                      <Link
                        href={`/dashboard/businesses/${b.id}/edit`}
                        className="text-xs font-semibold text-[#004AAD] hover:underline"
                      >
                        Details →
                      </Link>
                    )}
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
