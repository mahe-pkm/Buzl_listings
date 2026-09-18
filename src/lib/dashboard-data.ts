import { createClient } from '@/lib/supabase/server';
import { listCategories } from '@/lib/category-actions';

interface RawBusinessRecord {
  id: string;
  listing_code: string;
  canonical_name: string;
  slug: string;
  location_mode: 'storefront' | 'service_area' | 'hybrid';
  address_line_1?: string | null;
  locality?: string | null;
  postal_code?: string | null;
  geo_point?: unknown;
  city: string;
  state: string;
  google_business_profile_url?: string | null;
  publication_status: 'draft' | 'pending' | 'published' | 'suspended' | 'archived';
  verification_status: 'unverified' | 'pending' | 'verified' | 'failed';
  updated_at: string;
  primary_category_id?: string | null;
  categories?: { name?: string } | { name?: string }[] | null;
  business_service_areas?: { id: string }[] | null;
  business_services?: { id: string }[] | null;
  business_media?: { kind: string }[] | null;
}

export interface DashboardListingItem {
  id: string;
  listing_code: string;
  canonical_name: string;
  slug: string;
  location_mode: 'storefront' | 'service_area' | 'hybrid';
  city: string;
  state: string;
  publication_status: 'draft' | 'pending' | 'published' | 'suspended' | 'archived';
  verification_status: 'unverified' | 'pending' | 'verified' | 'failed';
  updated_at: string;
  category_name: string | null;
  attention_reasons?: string[];
}

export interface AdminDashboardData {
  kpis: {
    totalListings: number;
    pendingReview: number;
    publishedListings: number;
    draftListings: number;
    verifiedListings: number;
    unverifiedListings: number;
    suspendedListings: number;
  };
  pendingReviews: DashboardListingItem[];
  needsAttention: DashboardListingItem[];
  recentListings: DashboardListingItem[];
  topCategories: Array<{
    id: string;
    name: string;
    slug: string;
    usageCount: number;
    publishedUsageCount: number;
    active: boolean;
  }>;
}

export interface ListingManagerDashboardData {
  kpis: {
    pendingReview: number;
    publishedListings: number;
    suspendedListings: number;
    unverifiedListings: number;
  };
  pendingReviews: DashboardListingItem[];
  needsAttention: DashboardListingItem[];
  recentListings: DashboardListingItem[];
}

export interface OnboardingMemberDashboardData {
  kpis: {
    draftListings: number;
    pendingReview: number;
    publishedListings: number;
    requiringCompletion: number;
  };
  incompleteListings: DashboardListingItem[];
  recentlySubmitted: DashboardListingItem[];
  recentListings: DashboardListingItem[];
}

export interface OwnerDashboardData {
  kpis: {
    total: number;
    published: number;
    pending: number;
    draft: number;
  };
  listings: DashboardListingItem[];
}

function extractAttentionReasons(b: RawBusinessRecord): string[] {
  const reasons: string[] = [];

  const isPublished = b.publication_status === 'published';
  const isPending = b.publication_status === 'pending';
  const isDraft = b.publication_status === 'draft';

  // 1. Location integrity (Storefront / Hybrid)
  if (['storefront', 'hybrid'].includes(b.location_mode)) {
    const missingAddress = !b.address_line_1?.trim() || !b.locality?.trim() || !b.postal_code?.trim();
    const missingCoords = !b.geo_point;
    if (isPublished && (missingAddress || missingCoords)) {
      reasons.push('Missing Street Address or Map Point');
    }
  }

  // 2. Service area integrity (Service-area / Hybrid)
  if (['service_area', 'hybrid'].includes(b.location_mode)) {
    const areas = b.business_service_areas || [];
    if (isPublished && areas.length === 0) {
      reasons.push('Missing Service Area');
    }
  }

  // 3. Media: Missing Logo
  const media = b.business_media || [];
  const hasLogo = media.some((m) => m.kind === 'logo');
  if ((isPublished || isPending) && !hasLogo) {
    reasons.push('Missing Logo');
  }

  // 4. Missing Google Business Profile URL
  if (isPublished && !b.google_business_profile_url?.trim()) {
    reasons.push('Missing Google Business Profile');
  }

  // 5. Missing Services
  const services = b.business_services || [];
  if (isPublished && services.length === 0) {
    reasons.push('No Services Listed');
  }

  // 6. Unverified published listing
  if (isPublished && b.verification_status === 'unverified') {
    reasons.push('Unverified Listing');
  }

  // 7. Draft missing core readiness
  if (isDraft) {
    if (!b.primary_category_id) {
      reasons.push('Category Required');
    }
    if (['storefront', 'hybrid'].includes(b.location_mode) && (!b.address_line_1?.trim() || !b.locality?.trim() || !b.postal_code?.trim() || !b.geo_point)) {
      reasons.push('Address & Map Required');
    }
    if (['service_area', 'hybrid'].includes(b.location_mode) && (b.business_service_areas || []).length === 0) {
      reasons.push('Service Area Required');
    }
  }

  return reasons;
}

function getCategoryName(categories: RawBusinessRecord['categories']): string | null {
  if (!categories) return null;
  if (Array.isArray(categories)) {
    return categories[0]?.name ?? null;
  }
  return (categories as { name?: string }).name ?? null;
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const supabase = await createClient();

  // 1. Parallel KPI Counts via exact head queries
  const [
    totalRes,
    pendingRes,
    publishedRes,
    draftRes,
    verifiedRes,
    unverifiedRes,
    suspendedRes,
  ] = await Promise.all([
    supabase.from('businesses').select('*', { count: 'exact', head: true }),
    supabase.from('businesses').select('*', { count: 'exact', head: true }).eq('publication_status', 'pending'),
    supabase.from('businesses').select('*', { count: 'exact', head: true }).eq('publication_status', 'published'),
    supabase.from('businesses').select('*', { count: 'exact', head: true }).eq('publication_status', 'draft'),
    supabase.from('businesses').select('*', { count: 'exact', head: true }).eq('verification_status', 'verified'),
    supabase.from('businesses').select('*', { count: 'exact', head: true }).eq('verification_status', 'unverified'),
    supabase.from('businesses').select('*', { count: 'exact', head: true }).eq('publication_status', 'suspended'),
  ]);

  // 2. Pending Reviews Widget (limit 5)
  const { data: pendingData } = await supabase
    .from('businesses')
    .select('id, listing_code, canonical_name, slug, location_mode, city, state, publication_status, verification_status, updated_at, categories(name)')
    .eq('publication_status', 'pending')
    .order('updated_at', { ascending: false })
    .limit(5);

  const pendingReviews: DashboardListingItem[] = (pendingData || []).map((b: RawBusinessRecord) => ({
    id: b.id,
    listing_code: b.listing_code,
    canonical_name: b.canonical_name,
    slug: b.slug,
    location_mode: b.location_mode,
    city: b.city,
    state: b.state,
    publication_status: b.publication_status,
    verification_status: b.verification_status,
    updated_at: b.updated_at,
    category_name: getCategoryName(b.categories),
  }));

  // 3. Recent Listings Widget (limit 6)
  const { data: recentData } = await supabase
    .from('businesses')
    .select('id, listing_code, canonical_name, slug, location_mode, city, state, publication_status, verification_status, updated_at, categories(name)')
    .order('updated_at', { ascending: false })
    .limit(6);

  const recentListings: DashboardListingItem[] = (recentData || []).map((b: RawBusinessRecord) => ({
    id: b.id,
    listing_code: b.listing_code,
    canonical_name: b.canonical_name,
    slug: b.slug,
    location_mode: b.location_mode,
    city: b.city,
    state: b.state,
    publication_status: b.publication_status,
    verification_status: b.verification_status,
    updated_at: b.updated_at,
    category_name: getCategoryName(b.categories),
  }));

  // 4. Needs Attention Widget: Bounded inspect of active listings (limit 25)
  const { data: attentionCandidateData } = await supabase
    .from('businesses')
    .select(`
      id,
      listing_code,
      canonical_name,
      slug,
      location_mode,
      address_line_1,
      locality,
      postal_code,
      geo_point,
      city,
      state,
      google_business_profile_url,
      publication_status,
      verification_status,
      updated_at,
      primary_category_id,
      categories(name),
      business_service_areas(id),
      business_services(id),
      business_media(kind)
    `)
    .in('publication_status', ['published', 'pending'])
    .order('updated_at', { ascending: false })
    .limit(25);

  const needsAttention: DashboardListingItem[] = [];
  for (const b of (attentionCandidateData || []) as RawBusinessRecord[]) {
    const reasons = extractAttentionReasons(b);
    if (reasons.length > 0) {
      needsAttention.push({
        id: b.id,
        listing_code: b.listing_code,
        canonical_name: b.canonical_name,
        slug: b.slug,
        location_mode: b.location_mode,
        city: b.city,
        state: b.state,
        publication_status: b.publication_status,
        verification_status: b.verification_status,
        updated_at: b.updated_at,
        category_name: getCategoryName(b.categories),
        attention_reasons: reasons,
      });
      if (needsAttention.length >= 6) break;
    }
  }

  // 5. Category Overview (reuse existing listCategories)
  let topCategories: AdminDashboardData['topCategories'] = [];
  try {
    const { categories } = await listCategories();
    topCategories = (categories || [])
      .filter((c) => c.total_listings > 0)
      .sort((a, b) => b.total_listings - a.total_listings)
      .slice(0, 5)
      .map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        usageCount: c.total_listings,
        publishedUsageCount: c.published_listings,
        active: c.active,
      }));
  } catch (err) {
    console.error('Error fetching categories for dashboard:', err);
  }

  return {
    kpis: {
      totalListings: totalRes.count ?? 0,
      pendingReview: pendingRes.count ?? 0,
      publishedListings: publishedRes.count ?? 0,
      draftListings: draftRes.count ?? 0,
      verifiedListings: verifiedRes.count ?? 0,
      unverifiedListings: unverifiedRes.count ?? 0,
      suspendedListings: suspendedRes.count ?? 0,
    },
    pendingReviews,
    needsAttention,
    recentListings,
    topCategories,
  };
}

export async function getListingManagerDashboardData(): Promise<ListingManagerDashboardData> {
  const supabase = await createClient();

  // Listing Manager KPIs: Pending Review, Published, Suspended, Unverified
  const [
    pendingRes,
    publishedRes,
    suspendedRes,
    unverifiedRes,
  ] = await Promise.all([
    supabase.from('businesses').select('*', { count: 'exact', head: true }).eq('publication_status', 'pending'),
    supabase.from('businesses').select('*', { count: 'exact', head: true }).eq('publication_status', 'published'),
    supabase.from('businesses').select('*', { count: 'exact', head: true }).eq('publication_status', 'suspended'),
    supabase.from('businesses').select('*', { count: 'exact', head: true }).eq('verification_status', 'unverified'),
  ]);

  // Pending reviews
  const { data: pendingData } = await supabase
    .from('businesses')
    .select('id, listing_code, canonical_name, slug, location_mode, city, state, publication_status, verification_status, updated_at, categories(name)')
    .eq('publication_status', 'pending')
    .order('updated_at', { ascending: false })
    .limit(5);

  const pendingReviews: DashboardListingItem[] = (pendingData || []).map((b: RawBusinessRecord) => ({
    id: b.id,
    listing_code: b.listing_code,
    canonical_name: b.canonical_name,
    slug: b.slug,
    location_mode: b.location_mode,
    city: b.city,
    state: b.state,
    publication_status: b.publication_status,
    verification_status: b.verification_status,
    updated_at: b.updated_at,
    category_name: getCategoryName(b.categories),
  }));

  // Recent listings
  const { data: recentData } = await supabase
    .from('businesses')
    .select('id, listing_code, canonical_name, slug, location_mode, city, state, publication_status, verification_status, updated_at, categories(name)')
    .order('updated_at', { ascending: false })
    .limit(6);

  const recentListings: DashboardListingItem[] = (recentData || []).map((b: RawBusinessRecord) => ({
    id: b.id,
    listing_code: b.listing_code,
    canonical_name: b.canonical_name,
    slug: b.slug,
    location_mode: b.location_mode,
    city: b.city,
    state: b.state,
    publication_status: b.publication_status,
    verification_status: b.verification_status,
    updated_at: b.updated_at,
    category_name: getCategoryName(b.categories),
  }));

  // Needs Attention
  const { data: attentionCandidateData } = await supabase
    .from('businesses')
    .select(`
      id,
      listing_code,
      canonical_name,
      slug,
      location_mode,
      address_line_1,
      locality,
      postal_code,
      geo_point,
      city,
      state,
      google_business_profile_url,
      publication_status,
      verification_status,
      updated_at,
      primary_category_id,
      categories(name),
      business_service_areas(id),
      business_services(id),
      business_media(kind)
    `)
    .in('publication_status', ['published', 'pending'])
    .order('updated_at', { ascending: false })
    .limit(25);

  const needsAttention: DashboardListingItem[] = [];
  for (const b of (attentionCandidateData || []) as RawBusinessRecord[]) {
    const reasons = extractAttentionReasons(b);
    if (reasons.length > 0) {
      needsAttention.push({
        id: b.id,
        listing_code: b.listing_code,
        canonical_name: b.canonical_name,
        slug: b.slug,
        location_mode: b.location_mode,
        city: b.city,
        state: b.state,
        publication_status: b.publication_status,
        verification_status: b.verification_status,
        updated_at: b.updated_at,
        category_name: getCategoryName(b.categories),
        attention_reasons: reasons,
      });
      if (needsAttention.length >= 6) break;
    }
  }

  return {
    kpis: {
      pendingReview: pendingRes.count ?? 0,
      publishedListings: publishedRes.count ?? 0,
      suspendedListings: suspendedRes.count ?? 0,
      unverifiedListings: unverifiedRes.count ?? 0,
    },
    pendingReviews,
    needsAttention,
    recentListings,
  };
}

export async function getOnboardingMemberDashboardData(): Promise<OnboardingMemberDashboardData> {
  const supabase = await createClient();

  // Onboarding member RLS automatically limits businesses to ones they manage
  const [
    draftRes,
    pendingRes,
    publishedRes,
  ] = await Promise.all([
    supabase.from('businesses').select('*', { count: 'exact', head: true }).eq('publication_status', 'draft'),
    supabase.from('businesses').select('*', { count: 'exact', head: true }).eq('publication_status', 'pending'),
    supabase.from('businesses').select('*', { count: 'exact', head: true }).eq('publication_status', 'published'),
  ]);

  // Fetch recent drafts to find incomplete ones
  const { data: draftCandidates } = await supabase
    .from('businesses')
    .select(`
      id,
      listing_code,
      canonical_name,
      slug,
      location_mode,
      address_line_1,
      locality,
      postal_code,
      geo_point,
      city,
      state,
      google_business_profile_url,
      publication_status,
      verification_status,
      updated_at,
      primary_category_id,
      categories(name),
      business_service_areas(id),
      business_services(id),
      business_media(kind)
    `)
    .eq('publication_status', 'draft')
    .order('updated_at', { ascending: false })
    .limit(20);

  const incompleteListings: DashboardListingItem[] = [];
  for (const b of (draftCandidates || []) as RawBusinessRecord[]) {
    const reasons = extractAttentionReasons(b);
    if (reasons.length > 0) {
      incompleteListings.push({
        id: b.id,
        listing_code: b.listing_code,
        canonical_name: b.canonical_name,
        slug: b.slug,
        location_mode: b.location_mode,
        city: b.city,
        state: b.state,
        publication_status: b.publication_status,
        verification_status: b.verification_status,
        updated_at: b.updated_at,
        category_name: getCategoryName(b.categories),
        attention_reasons: reasons,
      });
    }
  }

  // Recently submitted (status pending)
  const { data: pendingData } = await supabase
    .from('businesses')
    .select('id, listing_code, canonical_name, slug, location_mode, city, state, publication_status, verification_status, updated_at, categories(name)')
    .eq('publication_status', 'pending')
    .order('updated_at', { ascending: false })
    .limit(5);

  const recentlySubmitted: DashboardListingItem[] = (pendingData || []).map((b: RawBusinessRecord) => ({
    id: b.id,
    listing_code: b.listing_code,
    canonical_name: b.canonical_name,
    slug: b.slug,
    location_mode: b.location_mode,
    city: b.city,
    state: b.state,
    publication_status: b.publication_status,
    verification_status: b.verification_status,
    updated_at: b.updated_at,
    category_name: getCategoryName(b.categories),
  }));

  // Recent listings overall
  const { data: recentData } = await supabase
    .from('businesses')
    .select('id, listing_code, canonical_name, slug, location_mode, city, state, publication_status, verification_status, updated_at, categories(name)')
    .order('updated_at', { ascending: false })
    .limit(6);

  const recentListings: DashboardListingItem[] = (recentData || []).map((b: RawBusinessRecord) => ({
    id: b.id,
    listing_code: b.listing_code,
    canonical_name: b.canonical_name,
    slug: b.slug,
    location_mode: b.location_mode,
    city: b.city,
    state: b.state,
    publication_status: b.publication_status,
    verification_status: b.verification_status,
    updated_at: b.updated_at,
    category_name: getCategoryName(b.categories),
  }));

  return {
    kpis: {
      draftListings: draftRes.count ?? 0,
      pendingReview: pendingRes.count ?? 0,
      publishedListings: publishedRes.count ?? 0,
      requiringCompletion: incompleteListings.length,
    },
    incompleteListings: incompleteListings.slice(0, 5),
    recentlySubmitted,
    recentListings,
  };
}

export async function getOwnerDashboardData(): Promise<OwnerDashboardData> {
  const supabase = await createClient();

  const { data: businesses } = await supabase
    .from('businesses')
    .select('id, listing_code, canonical_name, slug, location_mode, city, state, publication_status, verification_status, updated_at, primary_category_id, categories(name)')
    .order('updated_at', { ascending: false });

  const list: DashboardListingItem[] = (businesses || []).map((b: RawBusinessRecord) => ({
    id: b.id,
    listing_code: b.listing_code,
    canonical_name: b.canonical_name,
    slug: b.slug,
    location_mode: b.location_mode,
    city: b.city,
    state: b.state,
    publication_status: b.publication_status,
    verification_status: b.verification_status,
    updated_at: b.updated_at,
    category_name: getCategoryName(b.categories),
  }));

  return {
    kpis: {
      total: list.length,
      published: list.filter((b) => b.publication_status === 'published').length,
      pending: list.filter((b) => b.publication_status === 'pending').length,
      draft: list.filter((b) => b.publication_status === 'draft').length,
    },
    listings: list,
  };
}
