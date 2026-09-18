import React from 'react';
import Topbar from '@/components/dashboard/Topbar';
import KpiCard from './widgets/KpiCard';
import QuickActionsWidget, { QuickActionItem } from './widgets/QuickActionsWidget';
import PendingReviewWidget from './widgets/PendingReviewWidget';
import NeedsAttentionWidget from './widgets/NeedsAttentionWidget';
import RecentListingsWidget from './widgets/RecentListingsWidget';
import CategoryOverviewWidget from './widgets/CategoryOverviewWidget';
import { AdminDashboardData } from '@/lib/dashboard-data';

interface AdminDashboardViewProps {
  data: AdminDashboardData;
  userEmail?: string | null;
}

export default function AdminDashboardView({
  data,
  userEmail,
}: AdminDashboardViewProps) {
  const { kpis, pendingReviews, needsAttention, recentListings, topCategories } = data;

  const quickActions: QuickActionItem[] = [
    {
      label: 'All Listings',
      href: '/admin/businesses',
      description: 'System-wide list',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    },
    {
      label: 'Moderation Queue',
      href: '/review/businesses',
      description: `${kpis.pendingReview} pending`,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
    {
      label: 'Categories',
      href: '/admin/categories',
      description: 'Taxonomy tree',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      ),
    },
    {
      label: 'Users',
      href: '/admin/users',
      description: 'RBAC & Access',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      label: 'Import Buzl Profile',
      href: '/admin/businesses/import',
      description: 'JSON intake wizard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
      ),
    },
    {
      label: 'Add Business',
      href: '/dashboard/businesses/new',
      description: 'Manual creation',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
    },
  ];

  return (
    <>
      <Topbar
        title="Platform Operations"
        subtitle={`System-wide control & intelligence • ${userEmail || 'Admin'}`}
        userEmail={userEmail}
        isAdmin={true}
        action={{
          label: 'Add Business',
          href: '/dashboard/businesses/new',
        }}
      />

      <main className="p-4 sm:p-6 space-y-6 flex-1 max-w-7xl w-full mx-auto">
        {/* KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <KpiCard
            label="Total Listings"
            value={kpis.totalListings}
            subtitle={kpis.suspendedListings > 0 ? `${kpis.suspendedListings} suspended` : 'All database records'}
            variant="default"
          />
          <KpiCard
            label="Pending Review"
            value={kpis.pendingReview}
            subtitle="Needs moderation"
            variant="warning"
            badge={kpis.pendingReview > 0 ? 'Action Req' : undefined}
          />
          <KpiCard
            label="Published"
            value={kpis.publishedListings}
            subtitle="Public & live"
            variant="success"
          />
          <KpiCard
            label="Drafts"
            value={kpis.draftListings}
            subtitle="In progress"
            variant="default"
          />
          <KpiCard
            label="Verified"
            value={kpis.verifiedListings}
            subtitle="Identity verified"
            variant="purple"
          />
          <KpiCard
            label="Unverified"
            value={kpis.unverifiedListings}
            subtitle="Awaiting proof"
            variant="default"
          />
        </div>

        {/* Quick Actions */}
        <QuickActionsWidget actions={quickActions} />

        {/* Operational Split: Pending Reviews & Needs Attention */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PendingReviewWidget items={pendingReviews} canModerate={true} />
          <NeedsAttentionWidget
            items={needsAttention}
            title="Listings Requiring Attention"
            subtitle="Readiness and data-quality gaps in active listings."
          />
        </div>

        {/* Operational Split: Recent Listings & Category Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RecentListingsWidget
              items={recentListings}
              viewAllHref="/admin/businesses"
              title="Recent Platform Listings"
            />
          </div>
          <div>
            <CategoryOverviewWidget categories={topCategories} />
          </div>
        </div>
      </main>
    </>
  );
}
