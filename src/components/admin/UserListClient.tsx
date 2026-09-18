'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { ManagedUser } from '@/app/admin/users/actions';

interface UserListClientProps {
  initialUsers: ManagedUser[];
}

export default function UserListClient({ initialUsers }: UserListClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'buzl_member' | 'business_owner'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'invited' | 'inactive' | 'suspended'>('all');

  // Calculate high-level summary metrics
  const metrics = useMemo(() => {
    const total = initialUsers.length;
    const owners = initialUsers.filter((u) => u.role === 'business_owner').length;
    const members = initialUsers.filter((u) => u.role === 'buzl_member').length;
    const admins = initialUsers.filter((u) => u.role === 'admin').length;
    const suspended = initialUsers.filter((u) => u.accountStatus === 'suspended').length;
    return { total, owners, members, admins, suspended };
  }, [initialUsers]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return initialUsers.filter((user) => {
      // Role filter
      if (roleFilter !== 'all' && user.role !== roleFilter) {
        return false;
      }
      // Status filter
      if (statusFilter !== 'all' && user.accountStatus !== statusFilter) {
        return false;
      }
      // Text search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const nameMatch = user.fullName?.toLowerCase().includes(query) ?? false;
        const emailMatch = user.email?.toLowerCase().includes(query) ?? false;
        const memberIdMatch = user.memberId?.toLowerCase().includes(query) ?? false;
        if (!nameMatch && !emailMatch && !memberIdMatch) {
          return false;
        }
      }
      return true;
    });
  }, [initialUsers, roleFilter, statusFilter, searchQuery]);

  const hasFiltersApplied = searchQuery.trim() !== '' || roleFilter !== 'all' || statusFilter !== 'all';

  const resetFilters = () => {
    setSearchQuery('');
    setRoleFilter('all');
    setStatusFilter('all');
  };

  const getRoleBadge = (role: ManagedUser['role']) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E3F2EA] text-[#087C3C] border border-[#BCE5CF]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#087C3C]" />
            Admin
          </span>
        );
      case 'buzl_member':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F0EBFF] text-[#6929C4] border border-[#D9C4FF]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#6929C4]" />
            Buzl Member
          </span>
        );
      case 'business_owner':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#ECF4FF] text-[#004AAD] border border-[#BEDBFE]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#004AAD]" />
            Business Owner
          </span>
        );
    }
  };

  const getStatusBadge = (status: ManagedUser['accountStatus']) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E3F2EA] text-[#087C3C] border border-[#BCE5CF]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#087C3C] animate-pulse" />
            Active
          </span>
        );
      case 'invited':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FFF6DF] text-[#9A6700] border border-[#FFE7A8]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#9A6700]" />
            Invited
          </span>
        );
      case 'suspended':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FDECEE] text-[#C93B2B] border border-[#F9C6CB]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C93B2B]" />
            Suspended
          </span>
        );
      case 'inactive':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F2F5FA] text-[#5D6776] border border-[#DCE2E8]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#5D6776]" />
            Inactive
          </span>
        );
    }
  };

  const getPresetLabel = (preset: ManagedUser['permissionPreset']) => {
    if (!preset) return <span className="text-[#A0AEC0]">—</span>;
    if (preset === 'onboarding_member') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#F2F5FA] text-[#2A3547] border border-[#DCE2E8]" title="Can create, edit, import, and submit listings">
          Onboarding Member
        </span>
      );
    }
    if (preset === 'listing_manager') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#F2F5FA] text-[#2A3547] border border-[#DCE2E8]" title="Can manage listings and publish/suspend where permitted">
          Listing Manager
        </span>
      );
    }
    return <span className="text-xs text-[#5D6776]">{preset}</span>;
  };

  const getInitials = (name: string | null, email?: string) => {
    if (name && name.trim()) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return parts[0].slice(0, 2).toUpperCase();
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2A3547]">User Management</h1>
          <p className="text-sm text-[#5D6776] mt-1">
            Platform roles, Buzl Member access, presets, and account lifecycles.
          </p>
        </div>
        <Link
          href="/admin/users/new"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#004AAD] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#003C8A] transition-colors focus:outline-none focus:ring-2 focus:ring-[#004AAD] focus:ring-offset-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Invite User
        </Link>
      </div>

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="rounded-xl border border-[#DCE2E8] bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#5D6776]">Total Users</div>
          <div className="mt-2 text-2xl font-bold text-[#2A3547]">{metrics.total}</div>
          <div className="mt-1 text-xs text-[#5D6776]">All platform accounts</div>
        </div>
        <div className="rounded-xl border border-[#DCE2E8] bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#004AAD]">Business Owners</div>
          <div className="mt-2 text-2xl font-bold text-[#004AAD]">{metrics.owners}</div>
          <div className="mt-1 text-xs text-[#5D6776]">Listing managers</div>
        </div>
        <div className="rounded-xl border border-[#DCE2E8] bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#6929C4]">Buzl Members</div>
          <div className="mt-2 text-2xl font-bold text-[#6929C4]">{metrics.members}</div>
          <div className="mt-1 text-xs text-[#5D6776]">Staff & operators</div>
        </div>
        <div className="rounded-xl border border-[#DCE2E8] bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#087C3C]">Admins</div>
          <div className="mt-2 text-2xl font-bold text-[#087C3C]">{metrics.admins}</div>
          <div className="mt-1 text-xs text-[#5D6776]">Platform admins</div>
        </div>
        <div className="rounded-xl border border-[#DCE2E8] bg-white p-4 shadow-sm col-span-2 sm:col-span-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#C93B2B]">Suspended</div>
          <div className="mt-2 text-2xl font-bold text-[#C93B2B]">{metrics.suspended}</div>
          <div className="mt-1 text-xs text-[#5D6776]">Blocked accounts</div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="rounded-xl border border-[#DCE2E8] bg-white p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#5D6776]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or Buzl Member ID..."
              className="w-full pl-9 pr-8 py-2 rounded-lg border border-[#DCE2E8] text-sm text-[#2A3547] placeholder-[#A0AEC0] focus:outline-none focus:ring-2 focus:ring-[#004AAD] focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#5D6776] hover:text-[#2A3547]"
                aria-label="Clear search"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Status Filter Dropdown */}
          <div className="flex items-center gap-2">
            <label htmlFor="status-filter" className="text-xs font-semibold text-[#5D6776] whitespace-nowrap">
              Status:
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'invited' | 'inactive' | 'suspended')}
              className="rounded-lg border border-[#DCE2E8] py-2 px-3 text-sm text-[#2A3547] bg-white focus:outline-none focus:ring-2 focus:ring-[#004AAD] focus:border-transparent font-medium"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="invited">Invited</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        {/* Role Pills Filter */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-[#F2F5FA]">
          <span className="text-xs font-semibold text-[#5D6776] mr-1">Role:</span>
          <button
            type="button"
            onClick={() => setRoleFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
              roleFilter === 'all'
                ? 'bg-[#2A3547] text-white'
                : 'bg-[#F2F5FA] text-[#5D6776] hover:bg-[#EAEFF4]'
            }`}
          >
            All ({metrics.total})
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter('business_owner')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
              roleFilter === 'business_owner'
                ? 'bg-[#004AAD] text-white'
                : 'bg-[#ECF4FF] text-[#004AAD] hover:bg-[#E0EDFF]'
            }`}
          >
            Business Owners ({metrics.owners})
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter('buzl_member')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
              roleFilter === 'buzl_member'
                ? 'bg-[#6929C4] text-white'
                : 'bg-[#F0EBFF] text-[#6929C4] hover:bg-[#E5DAFF]'
            }`}
          >
            Buzl Members ({metrics.members})
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter('admin')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
              roleFilter === 'admin'
                ? 'bg-[#087C3C] text-white'
                : 'bg-[#E3F2EA] text-[#087C3C] hover:bg-[#D4EBDD]'
            }`}
          >
            Admins ({metrics.admins})
          </button>

          {hasFiltersApplied && (
            <button
              type="button"
              onClick={resetFilters}
              className="ml-auto text-xs font-semibold text-[#004AAD] hover:underline"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* Filter summary line */}
      <div className="flex items-center justify-between text-xs text-[#5D6776] px-1">
        <span>
          Showing <strong className="text-[#2A3547]">{filteredUsers.length}</strong> of{' '}
          <strong className="text-[#2A3547]">{initialUsers.length}</strong> users
        </span>
      </div>

      {/* Desktop Table View (hidden on mobile, visible on md+) */}
      <div className="hidden md:block overflow-hidden rounded-xl border border-[#DCE2E8] bg-white shadow-sm">
        <table className="min-w-full text-left text-sm divide-y divide-[#DCE2E8]">
          <thead className="bg-[#F2F5FA] text-[#5D6776] text-xs uppercase tracking-wider font-semibold">
            <tr>
              <th className="py-3.5 px-4">User</th>
              <th className="py-3.5 px-4">Role</th>
              <th className="py-3.5 px-4">Member ID</th>
              <th className="py-3.5 px-4">Permission Preset</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4">Last Sign-in</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#DCE2E8] bg-white">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-[#F8FAFC] transition-colors">
                  {/* User name & email */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#ECF4FF] text-[#004AAD] font-semibold text-xs flex items-center justify-center flex-shrink-0 border border-[#BEDBFE]">
                        {getInitials(user.fullName, user.email)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-[#2A3547] truncate max-w-[180px]">
                          {user.fullName || <span className="text-[#A0AEC0] italic">No name set</span>}
                        </div>
                        <div className="text-xs text-[#5D6776] truncate max-w-[220px] font-mono">
                          {user.email || '—'}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="py-3.5 px-4 whitespace-nowrap">{getRoleBadge(user.role)}</td>

                  {/* Member ID */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {user.memberId ? (
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#F2F5FA] text-[#2A3547] border border-[#DCE2E8]">
                        {user.memberId}
                      </span>
                    ) : (
                      <span className="text-[#A0AEC0]">—</span>
                    )}
                  </td>

                  {/* Permission Preset */}
                  <td className="py-3.5 px-4 whitespace-nowrap">{getPresetLabel(user.permissionPreset)}</td>

                  {/* Status */}
                  <td className="py-3.5 px-4 whitespace-nowrap">{getStatusBadge(user.accountStatus)}</td>

                  {/* Last Sign-in */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-xs text-[#5D6776]">
                    {user.lastSignInAt
                      ? new Date(user.lastSignInAt).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Never'}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-right">
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-[#004AAD] bg-[#ECF4FF] hover:bg-[#004AAD] hover:text-white transition-colors border border-[#BEDBFE]"
                    >
                      Manage
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="py-12 px-4 text-center">
                  <div className="flex flex-col items-center justify-center text-[#5D6776]">
                    <div className="w-12 h-12 rounded-full bg-[#F2F5FA] flex items-center justify-center mb-3 text-[#A0AEC0]">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="font-semibold text-base text-[#2A3547]">No users found</div>
                    <div className="text-sm mt-1 max-w-sm text-[#5D6776]">
                      No accounts matched your search criteria or selected filters.
                    </div>
                    {hasFiltersApplied && (
                      <button
                        type="button"
                        onClick={resetFilters}
                        className="mt-4 px-4 py-2 rounded-lg bg-[#004AAD] text-white text-xs font-semibold hover:bg-[#003C8A] transition-colors"
                      >
                        Clear all filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked Card View (visible on < md, hidden on md+) */}
      <div className="block md:hidden space-y-3">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <div
              key={user.id}
              className="rounded-xl border border-[#DCE2E8] bg-white p-4 shadow-sm space-y-3"
            >
              {/* Card Header: Avatar, Name, Role Badge */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-[#ECF4FF] text-[#004AAD] font-semibold text-xs flex items-center justify-center flex-shrink-0 border border-[#BEDBFE]">
                    {getInitials(user.fullName, user.email)}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-[#2A3547] text-sm truncate">
                      {user.fullName || <span className="text-[#A0AEC0] italic">No name set</span>}
                    </div>
                    <div className="text-xs text-[#5D6776] truncate font-mono">
                      {user.email || '—'}
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0">{getRoleBadge(user.role)}</div>
              </div>

              {/* Status and Badges Row */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#F2F5FA]">
                <div>{getStatusBadge(user.accountStatus)}</div>
                {user.memberId && (
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#F2F5FA] text-[#2A3547] border border-[#DCE2E8]">
                    {user.memberId}
                  </span>
                )}
                {user.permissionPreset && (
                  <div>{getPresetLabel(user.permissionPreset)}</div>
                )}
              </div>

              {/* Card Footer: Last Sign In & Action Link */}
              <div className="flex items-center justify-between pt-2 border-t border-[#F2F5FA] text-xs">
                <div className="text-[#5D6776]">
                  Sign-in:{' '}
                  {user.lastSignInAt
                    ? new Date(user.lastSignInAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'Never'}
                </div>
                <Link
                  href={`/admin/users/${user.id}`}
                  className="inline-flex items-center gap-1 font-semibold text-[#004AAD] hover:underline"
                >
                  Manage
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-[#DCE2E8] bg-white p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-[#F2F5FA] flex items-center justify-center mx-auto mb-3 text-[#A0AEC0]">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="font-semibold text-base text-[#2A3547]">No users found</div>
            <div className="text-sm mt-1 text-[#5D6776]">
              No accounts matched your search criteria or selected filters.
            </div>
            {hasFiltersApplied && (
              <button
                type="button"
                onClick={resetFilters}
                className="mt-4 px-4 py-2 rounded-lg bg-[#004AAD] text-white text-xs font-semibold hover:bg-[#003C8A] transition-colors"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
