import React from 'react';
import Link from 'next/link';

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  usageCount: number;
  publishedUsageCount: number;
  active: boolean;
}

interface CategoryOverviewWidgetProps {
  categories: CategoryItem[];
}

export default function CategoryOverviewWidget({
  categories,
}: CategoryOverviewWidgetProps) {
  return (
    <div className="bg-white rounded-[8px] border border-[#DCE2E8] shadow-xs overflow-hidden flex flex-col justify-between">
      <div>
        <div className="px-5 py-4 border-b border-[#DCE2E8] flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#2A3547]">Top Categories by Usage</h2>
          <Link
            href="/admin/categories"
            className="text-xs font-semibold text-[#004AAD] hover:underline"
          >
            Manage Taxonomy →
          </Link>
        </div>

        {categories.length === 0 ? (
          <div className="p-8 text-center text-[#5D6776]">
            <h3 className="text-xs font-bold text-[#2A3547]">No categories in use</h3>
            <p className="text-[11px] text-[#7D8795] mt-0.5">
              Categories will appear here once listings are assigned to them.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#DCE2E8]">
            {categories.map((c) => (
              <div
                key={c.id}
                className="px-5 py-3 flex items-center justify-between hover:bg-[#F2F5FA]/50 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-xs font-semibold text-[#2A3547] truncate">
                    {c.name}
                  </span>
                  {!c.active && (
                    <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 border border-slate-200">
                      Inactive
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-bold text-[#004AAD] bg-[#ECF4FF] border border-[#BEDBFE] px-2 py-0.5 rounded-full">
                    {c.usageCount} {c.usageCount === 1 ? 'listing' : 'listings'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-3 bg-[#F8FAFC] border-t border-[#DCE2E8] text-right">
        <Link
          href="/admin/categories"
          className="text-[11px] font-semibold text-[#5D6776] hover:text-[#004AAD] transition-colors"
        >
          View all categories in Directory Taxonomy →
        </Link>
      </div>
    </div>
  );
}
