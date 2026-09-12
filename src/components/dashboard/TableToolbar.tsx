'use client';

interface TableToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  totalCount: number;
}

export default function TableToolbar({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  totalCount,
}: TableToolbarProps) {
  return (
    <div className="p-4 border-b border-[#DCE2E8] flex flex-wrap items-center justify-between gap-3 bg-white">
      <div className="flex flex-1 items-center gap-2 max-w-md">
        <div className="relative w-full">
          <svg
            className="w-4 h-4 text-[#7D8795] absolute left-3 top-1/2 -translate-y-1/2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by business name or city..."
            className="w-full pl-9 pr-3.5 py-1.5 rounded-[8px] border border-[#DCE2E8] text-xs text-[#2A3547] placeholder-[#7D8795] focus:outline-none focus:border-[#004AAD]"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          className="px-3 py-1.5 rounded-[8px] border border-[#DCE2E8] text-xs text-[#2A3547] bg-white focus:outline-none focus:border-[#004AAD]"
        >
          <option value="all">All Statuses</option>
          <option value="published">Published</option>
          <option value="pending">Pending</option>
          <option value="draft">Draft</option>
          <option value="suspended">Suspended</option>
        </select>

        <span className="text-xs text-[#7D8795] pl-2 border-l border-[#DCE2E8]">
          {totalCount} listing{totalCount === 1 ? '' : 's'}
        </span>
      </div>
    </div>
  );
}
