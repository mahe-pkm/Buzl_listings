import Link from 'next/link';

interface TopbarProps {
  title: string;
  subtitle?: string;
  userEmail?: string | null;
  isAdmin?: boolean;
  action?: {
    label: string;
    href: string;
  };
  onMenuToggle?: () => void;
}

export default function Topbar({
  title,
  subtitle,
  userEmail,
  isAdmin = false,
  action,
}: TopbarProps) {
  const initial = userEmail ? userEmail.charAt(0).toUpperCase() : 'U';

  return (
    <header className="h-16 bg-white border-b border-[#DCE2E8] px-4 md:px-6 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className="min-w-0">
          <h1 className="text-base md:text-lg font-semibold text-[#2A3547] leading-tight truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-[#5D6776] truncate hidden sm:block">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {action && (
          <Link
            href={action.href}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[8px] bg-[#004AAD] text-white text-xs font-semibold hover:bg-[#003E91] transition-colors shadow-xs"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">{action.label}</span>
          </Link>
        )}

        {/* User Avatar & Context */}
        {userEmail && (
          <div className="flex items-center gap-2 pl-3 border-l border-[#DCE2E8]">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-xs ${
                isAdmin ? 'bg-[#087C3C]' : 'bg-[#004AAD]'
              }`}
              title={userEmail}
            >
              {initial}
            </div>
            <div className="hidden lg:block text-left text-xs">
              <div className="font-semibold text-[#2A3547] max-w-[140px] truncate">
                {userEmail}
              </div>
              <div className="text-[10px] text-[#7D8795]">
                {isAdmin ? 'Administrator' : 'Business Owner'}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
