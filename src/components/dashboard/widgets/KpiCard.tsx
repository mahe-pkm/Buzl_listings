import React from 'react';

interface KpiCardProps {
  label: string;
  value: number | string;
  subtitle?: string;
  variant?: 'default' | 'success' | 'warning' | 'purple' | 'danger';
  badge?: string;
}

export default function KpiCard({
  label,
  value,
  subtitle,
  variant = 'default',
  badge,
}: KpiCardProps) {
  const variantStyles = {
    default: {
      label: 'text-[#5D6776]',
      value: 'text-[#2A3547]',
      border: 'border-[#DCE2E8]',
    },
    success: {
      label: 'text-[#087C3C]',
      value: 'text-[#087C3C]',
      border: 'border-[#BCE5CF]',
    },
    warning: {
      label: 'text-[#D99B18]',
      value: 'text-[#D99B18]',
      border: 'border-[#FFE7A8]',
    },
    purple: {
      label: 'text-[#6929C4]',
      value: 'text-[#6929C4]',
      border: 'border-[#D4BBFF]',
    },
    danger: {
      label: 'text-[#DA1E28]',
      value: 'text-[#DA1E28]',
      border: 'border-[#FFD7D9]',
    },
  };

  const style = variantStyles[variant] || variantStyles.default;

  return (
    <div className={`bg-white p-5 rounded-[8px] border ${style.border} shadow-xs flex flex-col justify-between`}>
      <div className="flex items-center justify-between gap-2">
        <span className={`text-xs font-semibold uppercase tracking-wider ${style.label}`}>
          {label}
        </span>
        {badge && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F2F5FA] text-[#5D6776] border border-[#DCE2E8]">
            {badge}
          </span>
        )}
      </div>
      <div className="mt-2">
        <div className={`text-2xl font-bold tracking-tight ${style.value}`}>{value}</div>
        {subtitle && (
          <span className="text-[11px] text-[#5D6776] mt-0.5 block">{subtitle}</span>
        )}
      </div>
    </div>
  );
}
