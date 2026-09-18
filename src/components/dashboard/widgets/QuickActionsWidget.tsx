import React from 'react';
import Link from 'next/link';

export interface QuickActionItem {
  label: string;
  href: string;
  description?: string;
  icon?: React.ReactNode;
}

interface QuickActionsWidgetProps {
  actions: QuickActionItem[];
}

export default function QuickActionsWidget({ actions }: QuickActionsWidgetProps) {
  return (
    <div className="bg-white rounded-[8px] border border-[#DCE2E8] shadow-xs p-5">
      <h2 className="text-xs font-bold text-[#7D8795] uppercase tracking-wider mb-3">
        Quick Actions
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {actions.map((action) => (
          <Link
            key={action.href + action.label}
            href={action.href}
            className="flex flex-col items-center justify-center p-3 rounded-[8px] border border-[#DCE2E8] bg-[#F8FAFC] hover:bg-[#ECF4FF] hover:border-[#BEDBFE] hover:text-[#004AAD] text-[#2A3547] transition-all text-center group"
          >
            {action.icon && (
              <span className="w-6 h-6 text-[#5D6776] group-hover:text-[#004AAD] transition-colors mb-1.5 flex items-center justify-center">
                {action.icon}
              </span>
            )}
            <span className="text-xs font-semibold">{action.label}</span>
            {action.description && (
              <span className="text-[10px] text-[#7D8795] mt-0.5 group-hover:text-[#004AAD]/80 line-clamp-1">
                {action.description}
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
