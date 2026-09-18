import React from 'react';
import Topbar from '@/components/dashboard/Topbar';
import KpiCard from './widgets/KpiCard';
import QuickActionsWidget, { QuickActionItem } from './widgets/QuickActionsWidget';
import PendingReviewWidget from './widgets/PendingReviewWidget';
import NeedsAttentionWidget from './widgets/NeedsAttentionWidget';
import RecentListingsWidget from './widgets/RecentListingsWidget';
import { ListingManagerDashboardData } from '@/lib/dashboard-data';

interface ListingManagerDashboardViewProps {
  data: ListingManagerDashboardData;
  userEmail?: string | null;
}

export default function ListingManagerDashboardView({
  data,
  userEmail,
}: ListingManagerDashboardViewProps) {
  const { kpis, pendingReviews, needsAttention, recentListings } = data;

  const quickActions: QuickActionItem[] = [
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
      label: 'Listings',
      href: '/dashboard/businesses',
      description: 'Directory view',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    },
    {
      label: 'Add Business',
      href: '/dashboard/businesses/new',
      description: 'Manual intake',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
    },
    {
      label: 'Import Buzl Profile',
      href: '/admin/businesses/import',
      description: 'JSON batch intake',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
      ),
    },
    {
      label: 'Categories',
      href: '/admin/categories',
      description: 'Taxonomy explorer',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      ),
    },
  ];

  return (
    <>
      <Topbar
        title="Listing Operations"
        subtitle={`Moderation & Content Operations • ${userEmail || 'Listing Manager'}`}
        userEmail={userEmail}
        isAdmin={false}
        action={{
          label: 'Review Queue',
          href: '/review/businesses',
        }}
      />

      <main className="p-4 sm:p-6 space-y-6 flex-1 max-w-7xl w-full mx-auto">
        {/* KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <KpiCard
            label="Pending Review"
            value={kpis.pendingReview}
            subtitle="Moderation required"
            variant="warning"
            badge={kpis.pendingReview > 0 ? 'Action Req' : undefined}
          />
          <KpiCard
            label="Published"
            value={kpis.publishedListings}
            subtitle="Active directory"
            variant="success"
          />
          <KpiCard
            label="Suspended"
            value={kpis.suspendedListings}
            subtitle="Temporarily offline"
            variant="danger"
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

        {/* Recent Listings */}
        <div>
          <RecentListingsWidget
            items={recentListings}
            viewAllHref="/dashboard/businesses"
            title="Recent Listings"
          />
        </div>
      </main>
    </>
  );
}
