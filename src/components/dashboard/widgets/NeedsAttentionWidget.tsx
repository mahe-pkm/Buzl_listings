import React from 'react';
import Link from 'next/link';
import { DashboardListingItem } from '@/lib/dashboard-data';

interface NeedsAttentionWidgetProps {
  items: DashboardListingItem[];
  title?: string;
  subtitle?: string;
}

export default function NeedsAttentionWidget({
  items,
  title = 'Listings Requiring Attention',
  subtitle = 'Data-quality and completion issues detected in published or active listings.',
}: NeedsAttentionWidgetProps) {
  return (
    <div className="bg-white rounded-[8px] border border-[#DCE2E8] shadow-xs overflow-hidden">
      <div className="px-5 py-4 border-b border-[#DCE2E8] flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E36B5D]" />
            <h2 className="text-sm font-bold text-[#2A3547]">{title}</h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#FDECEE] text-[#C93B2B] border border-[#F9C6CD]">
              {items.length}
            </span>
          </div>
          <p className="text-[11px] text-[#7D8795] mt-0.5">{subtitle}</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="p-8 text-center text-[#5D6776]">
          <div className="w-10 h-10 rounded-full bg-[#E3F2EA] text-[#087C3C] flex items-center justify-center mx-auto mb-2.5">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xs font-bold text-[#2A3547]">High Data Quality</h3>
          <p className="text-[11px] text-[#7D8795] mt-0.5">
            No listings currently require operational attention.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[#DCE2E8]">
          {items.map((b) => (
            <div
              key={b.id}
              className="p-4 hover:bg-[#F2F5FA]/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/dashboard/businesses/${b.id}/edit`}
                    className="font-semibold text-xs text-[#2A3547] hover:text-[#004AAD] transition-colors"
                  >
                    {b.canonical_name}
                  </Link>
                  <span className="font-mono text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                    {b.listing_code}
                  </span>
                  <span className="text-[11px] text-[#7D8795]">
                    • {b.category_name || 'Uncategorized'}
                  </span>
                  <span className="text-[11px] text-[#7D8795]">
                    • {b.city ? `${b.city}, ${b.state}` : 'No City'}
                  </span>
                </div>

                {/* Attention Reasons Pills */}
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {(b.attention_reasons || []).map((reason) => (
                    <span
                      key={reason}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-[#FFF1F0] text-[#D83B01] border border-[#FED9D5]"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D83B01]" />
                      {reason}
                    </span>
                  ))}
                </div>
              </div>

              <div className="shrink-0 self-end sm:self-center">
                <Link
                  href={`/dashboard/businesses/${b.id}/edit`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[6px] border border-[#DCE2E8] bg-white text-xs font-semibold text-[#004AAD] hover:bg-[#ECF4FF] transition-colors"
                >
                  Manage Listing →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
