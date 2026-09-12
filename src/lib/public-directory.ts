import { createClient } from '@/lib/supabase/server';
import { BusinessHourRecord } from '@/lib/business-hours-utils';

export interface PublicBusinessCardData {
  slug: string;
  canonical_name: string;
  description: string | null;
  category_name: string;
  category_slug: string;
  location_mode: 'storefront' | 'service_area' | 'hybrid';
  city: string;
  state: string;
  country: string;
  country_code: string;
  primary_phone: string;
  whatsapp_phone: string | null;
  website_url: string | null;
  show_street_address: boolean;
  address_line_1: string | null;
  locality: string | null;
  postal_code: string | null;
  verification_status: 'unverified' | 'pending' | 'verified' | 'failed';
  updated_at: string;
  services: string[];
  service_areas: string[];
}

export interface PublicServiceItem {
  service_name: string;
}

export interface PublicServiceAreaItem {
  name: string;
  city?: string | null;
  state?: string | null;
  country?: string | null;
}

export interface PublicMediaItem {
  kind: 'logo' | 'cover';
  storage_path: string;
}

export interface PublicBusinessDetail {
  slug: string;
  canonical_name: string;
  description: string | null;
  primary_phone: string;
  alternate_phone: string | null;
  whatsapp_phone: string | null;
  business_contact_email: string | null;
  show_email: boolean;
  website_url: string | null;
  category_name: string;
  category_slug: string;
  location_mode: 'storefront' | 'service_area' | 'hybrid';
  address_line_1: string | null;
  address_line_2: string | null;
  locality: string | null;
  city: string;
  district: string | null;
  state: string;
  country: string;
  country_code: string;
  postal_code: string | null;
  show_street_address: boolean;
  facebook_url: string | null;
  instagram_url: string | null;
  linkedin_url: string | null;
  youtube_url: string | null;
  verification_status: 'unverified' | 'pending' | 'verified' | 'failed';
  created_at: string;
  updated_at: string;
  services: PublicServiceItem[];
  service_areas: PublicServiceAreaItem[];
  hours: BusinessHourRecord[];
  media: PublicMediaItem[];
}

export interface SearchResponse {
  total_count: number;
  limit: number;
  offset: number;
  items: PublicBusinessCardData[];
}

export interface CategoryDiscoveryResponse {
  category: {
    name: string;
    slug: string;
  };
  total_count: number;
  limit: number;
  offset: number;
  items: PublicBusinessCardData[];
}

export interface LocationDiscoveryResponse {
  location: {
    name: string;
    slug: string;
  };
  total_count: number;
  limit: number;
  offset: number;
  items: PublicBusinessCardData[];
}

export interface CombinationDiscoveryResponse {
  location: {
    name: string;
    slug: string;
  };
  category: {
    name: string;
    slug: string;
  };
  is_indexable: boolean;
  total_count: number;
  limit: number;
  offset: number;
  items: PublicBusinessCardData[];
}

export interface DirectoryCategoryCount {
  name: string;
  slug: string;
  count: number;
}

export interface DirectoryLocationCount {
  name: string;
  slug: string;
  count: number;
}

export interface DirectoryHomeData {
  categories: DirectoryCategoryCount[];
  locations: DirectoryLocationCount[];
  recent_businesses: PublicBusinessCardData[];
  stats: {
    total_businesses: number;
    total_categories: number;
    total_locations: number;
  };
}

export interface SitemapEntries {
  businesses: { slug: string; updated_at: string }[];
  categories: { slug: string }[];
  locations: { slug: string }[];
  combinations: { location_slug: string; category_slug: string }[];
}

export async function getPublishedBusiness(slug: string): Promise<PublicBusinessDetail | null> {
  if (!slug || typeof slug !== 'string') return null;
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('get_published_business_by_slug', {
    p_slug: slug.trim().toLowerCase(),
  });

  if (error || !data) {
    return null;
  }

  return data as PublicBusinessDetail;
}

export async function resolveSlugRedirect(slug: string): Promise<string | null> {
  if (!slug || typeof slug !== 'string') return null;
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('resolve_business_slug_redirect', {
    p_slug: slug.trim().toLowerCase(),
  });

  if (error || !data) {
    return null;
  }

  return data as string;
}

export async function searchBusinesses(params: {
  query?: string;
  categorySlug?: string;
  locationSlug?: string;
  limit?: number;
  offset?: number;
}): Promise<SearchResponse> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('search_published_businesses', {
    p_query: params.query?.trim() || null,
    p_category_slug: params.categorySlug?.trim() || null,
    p_location_slug: params.locationSlug?.trim() || null,
    p_limit: params.limit || 20,
    p_offset: params.offset || 0,
  });

  if (error || !data) {
    return {
      total_count: 0,
      limit: params.limit || 20,
      offset: params.offset || 0,
      items: [],
    };
  }

  return data as SearchResponse;
}

export async function getBusinessesByCategory(
  categorySlug: string,
  limit: number = 20,
  offset: number = 0
): Promise<CategoryDiscoveryResponse | null> {
  if (!categorySlug) return null;
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('get_published_businesses_by_category', {
    p_category_slug: categorySlug.trim().toLowerCase(),
    p_limit: limit,
    p_offset: offset,
  });

  if (error || !data) {
    return null;
  }

  return data as CategoryDiscoveryResponse;
}

export async function getBusinessesByLocation(
  locationSlug: string,
  limit: number = 20,
  offset: number = 0
): Promise<LocationDiscoveryResponse | null> {
  if (!locationSlug) return null;
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('get_published_businesses_by_location', {
    p_location_slug: locationSlug.trim().toLowerCase(),
    p_limit: limit,
    p_offset: offset,
  });

  if (error || !data) {
    return null;
  }

  return data as LocationDiscoveryResponse;
}

export async function getBusinessesByLocationAndCategory(
  locationSlug: string,
  categorySlug: string,
  limit: number = 20,
  offset: number = 0
): Promise<CombinationDiscoveryResponse | null> {
  if (!locationSlug || !categorySlug) return null;
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('get_published_businesses_by_location_and_category', {
    p_location_slug: locationSlug.trim().toLowerCase(),
    p_category_slug: categorySlug.trim().toLowerCase(),
    p_limit: limit,
    p_offset: offset,
  });

  if (error || !data) {
    return null;
  }

  return data as CombinationDiscoveryResponse;
}

export async function getDirectoryHomeData(): Promise<DirectoryHomeData> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('get_directory_home_data');

  if (error || !data) {
    return {
      categories: [],
      locations: [],
      recent_businesses: [],
      stats: {
        total_businesses: 0,
        total_categories: 0,
        total_locations: 0,
      },
    };
  }

  return data as DirectoryHomeData;
}

export async function getSitemapEntries(): Promise<SitemapEntries> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('get_sitemap_entries');

  if (error || !data) {
    return {
      businesses: [],
      categories: [],
      locations: [],
      combinations: [],
    };
  }

  return data as SitemapEntries;
}
