// Utility for calculating business operating hours and timezone-safe status
// Follows Constraint 3: Only display "Open Now" / "Closed Now" when a trusted business timezone is available.

export interface BusinessHourRecord {
  day_of_week: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  opens_at: string | null; // HH:MM:SS
  closes_at: string | null; // HH:MM:SS
  is_closed: boolean;
  is_24_hours: boolean;
}

export interface LiveStatusResult {
  hasTrustedTimezone: boolean;
  isOpen: boolean | null;
  statusText: string | null;
  todayScheduleText: string | null;
}

export const TRUSTED_COUNTRY_TIMEZONES: Record<string, string> = {
  IN: 'Asia/Kolkata',
  US: 'America/New_York', // Default fallback when country is US
  GB: 'Europe/London',
  AE: 'Asia/Dubai',
  SG: 'Asia/Singapore',
};

const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export function getDayName(dayIndex: number): string {
  return DAY_NAMES[dayIndex] || 'Unknown';
}

export function formatTime(timeStr: string | null): string {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  const hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes} ${ampm}`;
}

export function formatScheduleRow(record: BusinessHourRecord): string {
  if (record.is_closed) return 'Closed';
  if (record.is_24_hours) return 'Open 24 Hours';
  if (record.opens_at && record.closes_at) {
    return `${formatTime(record.opens_at)} - ${formatTime(record.closes_at)}`;
  }
  return 'Hours unavailable';
}

export function computeLiveHoursStatus(
  hours: BusinessHourRecord[] | null | undefined,
  countryCode: string | null | undefined
): LiveStatusResult {
  if (!hours || hours.length === 0) {
    return {
      hasTrustedTimezone: false,
      isOpen: null,
      statusText: null,
      todayScheduleText: null,
    };
  }

  const normalizedCountry = countryCode?.toUpperCase()?.trim() || '';
  const timeZone = TRUSTED_COUNTRY_TIMEZONES[normalizedCountry];

  if (!timeZone) {
    // Constraint 3: No trusted timezone -> display hours without live-status claims
    return {
      hasTrustedTimezone: false,
      isOpen: null,
      statusText: null,
      todayScheduleText: null,
    };
  }

  try {
    const now = new Date();
    // Get day of week and current time in business timezone
    const partsFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    const parts = partsFormatter.formatToParts(now);
    let weekdayStr = '';
    let hour = 0;
    let minute = 0;
    let second = 0;

    for (const p of parts) {
      if (p.type === 'weekday') weekdayStr = p.value;
      if (p.type === 'hour') hour = parseInt(p.value, 10);
      if (p.type === 'minute') minute = parseInt(p.value, 10);
      if (p.type === 'second') second = parseInt(p.value, 10);
    }

    const shortDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const currentDayOfWeek = shortDays.indexOf(weekdayStr);
    if (currentDayOfWeek === -1) {
      return {
        hasTrustedTimezone: false,
        isOpen: null,
        statusText: null,
        todayScheduleText: null,
      };
    }

    const todayRecord = hours.find((h) => h.day_of_week === currentDayOfWeek);
    if (!todayRecord) {
      return {
        hasTrustedTimezone: true,
        isOpen: false,
        statusText: 'Closed',
        todayScheduleText: 'Closed Today',
      };
    }

    const todayScheduleText = formatScheduleRow(todayRecord);

    if (todayRecord.is_closed) {
      return {
        hasTrustedTimezone: true,
        isOpen: false,
        statusText: 'Closed',
        todayScheduleText,
      };
    }

    if (todayRecord.is_24_hours) {
      return {
        hasTrustedTimezone: true,
        isOpen: true,
        statusText: 'Open 24 Hours',
        todayScheduleText,
      };
    }

    if (todayRecord.opens_at && todayRecord.closes_at) {
      const currentSeconds = hour * 3600 + minute * 60 + second;

      const openParts = todayRecord.opens_at.split(':').map((x) => parseInt(x, 10));
      const closeParts = todayRecord.closes_at.split(':').map((x) => parseInt(x, 10));

      const openSeconds = (openParts[0] || 0) * 3600 + (openParts[1] || 0) * 60 + (openParts[2] || 0);
      const closeSeconds = (closeParts[0] || 0) * 3600 + (closeParts[1] || 0) * 60 + (closeParts[2] || 0);

      const isOpen = currentSeconds >= openSeconds && currentSeconds < closeSeconds;

      return {
        hasTrustedTimezone: true,
        isOpen,
        statusText: isOpen ? 'Open Now' : 'Closed',
        todayScheduleText,
      };
    }

    return {
      hasTrustedTimezone: true,
      isOpen: false,
      statusText: 'Closed',
      todayScheduleText,
    };
  } catch {
    return {
      hasTrustedTimezone: false,
      isOpen: null,
      statusText: null,
      todayScheduleText: null,
    };
  }
}
