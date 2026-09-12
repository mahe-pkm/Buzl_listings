import { PublicationStatus, VerificationStatus } from '@/types/business';

interface StatusBadgeProps {
  status: PublicationStatus | VerificationStatus | string;
  type?: 'publication' | 'verification' | 'mode';
}

export default function StatusBadge({ status, type = 'publication' }: StatusBadgeProps) {
  let colorClasses = 'bg-[#F2F5FA] text-[#5D6776] border-[#DCE2E8]';

  if (type === 'publication') {
    switch (status) {
      case 'published':
        colorClasses = 'bg-[#E3F2EA] text-[#087C3C] border-[#BCE5CF]';
        break;
      case 'pending':
        colorClasses = 'bg-[#FFF6DF] text-[#9A6700] border-[#FFE7A8]';
        break;
      case 'draft':
        colorClasses = 'bg-[#F2F5FA] text-[#5D6776] border-[#DCE2E8]';
        break;
      case 'suspended':
      case 'rejected':
      case 'archived':
        colorClasses = 'bg-[#FDECEE] text-[#C93B2B] border-[#F9C6CB]';
        break;
    }
  } else if (type === 'verification') {
    switch (status) {
      case 'verified':
        colorClasses = 'bg-[#ECF4FF] text-[#004AAD] border-[#BEDBFE]';
        break;
      case 'pending':
        colorClasses = 'bg-[#FFF6DF] text-[#9A6700] border-[#FFE7A8]';
        break;
      case 'failed':
        colorClasses = 'bg-[#FDECEE] text-[#C93B2B] border-[#F9C6CB]';
        break;
      case 'unverified':
      default:
        colorClasses = 'bg-[#F2F5FA] text-[#7D8795] border-[#DCE2E8]';
        break;
    }
  } else if (type === 'mode') {
    colorClasses = 'bg-[#F2F5FA] text-[#5D6776] border-[#DCE2E8]';
  }

  const label = status?.replace('_', ' ');

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide border uppercase ${colorClasses}`}
    >
      {label}
    </span>
  );
}
