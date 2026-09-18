import React from 'react';
import Topbar from '@/components/dashboard/Topbar';
import KpiCard from './widgets/KpiCard';
import QuickActionsWidget, { QuickActionItem } from './widgets/QuickActionsWidget';
import NeedsAttentionWidget from './widgets/NeedsAttentionWidget';
import PendingReviewWidget from './widgets/PendingReviewWidget';
import RecentListingsWidget from './widgets/RecentListingsWidget';
import { OnboardingMemberDashboardData } from '@/lib/dashboard-data';

interface OnboardingMemberDashboardViewProps {
  data: OnboardingMemberDashboardData;
  userEmail?: string | null;
}

export default function OnboardingMemberDashboardView({
  data,
  userEmail,
}: OnboardingMemberDashboardViewProps) {
  const { kpis, incompleteListings, recentlySubmitted, recentListings } = data;

  const quickActions: QuickActionItem[] = [
    {
      label: 'Add Business',
      href: '/dashboard/businesses/new',
      description: 'Create new listing',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
    },
    {
      label: 'Import Buzl Profile',
      href: '/admin/businesses/import',
      description: 'JSON import intake',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
      ),
    },
    {
      label: 'My Listings',
      href: '/dashboard/businesses',
      description: 'Managed records',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    },
    {
      label: 'Categories',
      href: '/admin/categories',
      description: 'Browse taxonomy',
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
        title="Onboarding Dashboard"
        subtitle={`Listing Intake & Intake Completion • ${userEmail || 'Onboarding Member'}`}
        userEmail={userEmail}
        isAdmin={false}
        action={{
          label: 'Add Business',
          href: '/dashboard/businesses/new',
        }}
      />

      <main className="p-4 sm:p-6 space-y-6 flex-1 max-w-7xl w-full mx-auto">
        {/* KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <KpiCard
            label="Draft Listings"
            value={kpis.draftListings}
            subtitle="Intake in progress"
            variant="default"
          />
          <KpiCard
            label="Pending Review"
            value={kpis.pendingReview}
            subtitle="Submitted for review"
            variant="warning"
          />
          <KpiCard
            label="Published"
            value={kpis.publishedListings}
            subtitle="Live & approved"
            variant="success"
          />
          <KpiCard
            label="Needs Completion"
            value={kpis.requiringCompletion}
            subtitle="Missing requirements"
            variant={kpis.requiringCompletion > 0 ? 'warning' : 'default'}
          />
        </div>

        {/* Quick Actions */}
        <QuickActionsWidget actions={quickActions} />

        {/* Incomplete Listings & Recently Submitted */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <NeedsAttentionWidget
            items={incompleteListings}
            title="Incomplete Draft Listings"
            subtitle="Drafts missing required fields before they can be submitted for review."
          />
          <PendingReviewWidget
            items={recentlySubmitted}
            canModerate={false}
          />
        </div>

        {/* Recent Listings */}
        <div>
          <RecentListingsWidget
            items={recentListings}
            viewAllHref="/dashboard/businesses"
            title="My Recent Listings"
          />
        </div>
      </main>
    </>
  );
}
