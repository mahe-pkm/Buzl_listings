import {
  BusinessHourRecord,
  computeLiveHoursStatus,
  formatScheduleRow,
  getDayName,
} from '@/lib/business-hours-utils';

interface BusinessHoursDisplayProps {
  hours: BusinessHourRecord[];
  countryCode?: string | null;
}

export default function BusinessHoursDisplay({ hours, countryCode }: BusinessHoursDisplayProps) {
  if (!hours || hours.length === 0) {
    return (
      <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-sm text-[#64748B]">
        Operating hours not specified for this business.
      </div>
    );
  }

  // Calculate live status according to Constraint 3
  const liveStatus = computeLiveHoursStatus(hours, countryCode);

  // Sort schedule starting Monday (1..6, 0)
  const sortedHours = [...hours].sort((a, b) => {
    const dayA = a.day_of_week === 0 ? 7 : a.day_of_week;
    const dayB = b.day_of_week === 0 ? 7 : b.day_of_week;
    return dayA - dayB;
  });

  return (
    <div className="rounded-xl border border-[#E1E4EA] bg-white overflow-hidden">
      {/* Header with live status badge if trusted timezone exists */}
      <div className="px-5 py-3.5 bg-[#F8FAFC] border-b border-[#E1E4EA] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-[#5D6776]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-bold text-[#1F242E]">Business Hours</span>
        </div>

        {/* Constraint 3: Render live badge ONLY if trusted timezone is available */}
        {liveStatus.hasTrustedTimezone && liveStatus.statusText ? (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
              liveStatus.isOpen
                ? 'bg-[#E3F2EA] text-[#087C3C] border-[#BCE5CF]'
                : 'bg-[#F2F5FA] text-[#5D6776] border-[#DCE2E8]'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                liveStatus.isOpen ? 'bg-[#087C3C] animate-pulse' : 'bg-[#7D8795]'
              }`}
            />
            {liveStatus.statusText}
          </span>
        ) : (
          <span className="text-xs text-[#7D8795]">Weekly Schedule</span>
        )}
      </div>

      {/* 7-Day Schedule List */}
      <div className="divide-y divide-[#F2F5FA] p-2">
        {sortedHours.map((record) => {
          const dayName = getDayName(record.day_of_week);
          const scheduleText = formatScheduleRow(record);
          const isClosed = record.is_closed;

          return (
            <div
              key={record.day_of_week}
              className="flex items-center justify-between px-3 py-2 text-xs"
            >
              <span className="font-medium text-[#334155] w-28">{dayName}</span>
              <span
                className={`${
                  isClosed
                    ? 'text-[#94A3B8] italic'
                    : 'text-[#0F172A] font-semibold'
                }`}
              >
                {scheduleText}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
