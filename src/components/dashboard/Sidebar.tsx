'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

interface SidebarProps {
  userEmail?: string | null;
  role?: string;
  isAdmin?: boolean;
}

export default function Sidebar({ userEmail, role = 'business_owner', isAdmin = false }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    {
      label: 'Overview',
      href: '/dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      active: pathname === '/dashboard',
    },
    {
      label: 'My Businesses',
      href: '/dashboard/businesses',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      active: pathname.startsWith('/dashboard/businesses') && pathname !== '/dashboard/businesses/new',
    },
    {
      label: 'Add Business',
      href: '/dashboard/businesses/new',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
      active: pathname === '/dashboard/businesses/new',
    },
  ];

  const adminItems = [
    {
      label: 'All Listings (Admin)',
      href: '/admin/businesses',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      active: pathname.startsWith('/admin'),
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col justify-between h-full py-5 px-3">
      <div className="space-y-6">
        <div>
          <div className="px-3 mb-2 text-xs font-semibold text-[#7D8795] uppercase tracking-wider">
            Management
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-sm font-medium transition-colors ${
                  item.active
                    ? 'bg-[#ECF4FF] text-[#004AAD]'
                    : 'text-[#5D6776] hover:bg-[#F2F5FA] hover:text-[#2A3547]'
                }`}
              >
                <span className={item.active ? 'text-[#004AAD]' : 'text-[#7D8795]'}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {isAdmin && (
          <div>
            <div className="px-3 mb-2 text-xs font-semibold text-[#7D8795] uppercase tracking-wider">
              Admin Area
            </div>
            <nav className="space-y-1">
              {adminItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-sm font-medium transition-colors ${
                    item.active
                      ? 'bg-[#ECF4FF] text-[#004AAD]'
                      : 'text-[#5D6776] hover:bg-[#F2F5FA] hover:text-[#2A3547]'
                  }`}
                >
                  <span className={item.active ? 'text-[#004AAD]' : 'text-[#7D8795]'}>
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>

      {/* User Card & Logout */}
      <div className="pt-4 border-t border-[#DCE2E8]">
        <div className="bg-[#F2F5FA] p-3 rounded-[8px] mb-2">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-xs font-medium text-[#2A3547] truncate max-w-[130px]">
              {userEmail || 'User'}
            </span>
            <span
              className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${
                role === 'admin' || isAdmin
                  ? 'bg-[#E3F2EA] text-[#087C3C] border-[#BCE5CF]'
                  : 'bg-[#ECF4FF] text-[#004AAD] border-[#BEDBFE]'
              }`}
            >
              {role === 'admin' || isAdmin ? 'Admin' : 'Owner'}
            </span>
          </div>
          <p className="text-[11px] text-[#7D8795]">Buzl Enterprise System</p>
        </div>

        <form action="/auth/logout" method="POST">
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-[8px] text-xs font-medium text-[#E36B5D] hover:bg-[#FDECEE] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign out
          </button>
        </form>

        <div className="mt-3 px-3 flex items-center justify-between text-[10px] text-[#7D8795]">
          <span>v0.1 Prototype</span>
          <span className="text-[#004AAD] font-medium">Buzl Listing</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Header with Hamburger */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-[#DCE2E8] px-4 flex items-center justify-between z-40">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-[#004AAD] flex items-center justify-center text-white font-bold text-sm">
            B
          </div>
          <span className="font-bold text-base text-[#2A3547]">Buzl Listing</span>
        </Link>

        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-1.5 rounded-lg text-[#5D6776] hover:bg-[#F2F5FA]"
          aria-label="Toggle Navigation"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer Sidebar */}
      <div
        className={`md:hidden fixed top-14 left-0 bottom-0 w-72 bg-white border-r border-[#DCE2E8] z-50 transform transition-transform duration-200 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </div>

      {/* Desktop Fixed Sidebar */}
      <aside className="hidden md:flex w-64 bg-white border-r border-[#DCE2E8] flex-col shrink-0 min-h-screen">
        <div className="h-16 flex items-center px-6 border-b border-[#DCE2E8]">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#004AAD] flex items-center justify-center text-white font-bold text-lg tracking-wider">
              B
            </div>
            <span className="font-bold text-xl tracking-tight text-[#2A3547]">
              Buzl <span className="text-[#004AAD] font-semibold text-sm tracking-normal">Listing</span>
            </span>
          </Link>
        </div>
        <div className="flex-1 flex flex-col justify-between">
          {sidebarContent}
        </div>
      </aside>
    </>
  );
}
