export type LocationMode = 'storefront' | 'service_area' | 'hybrid';
export type PublicationStatus = 'draft' | 'pending' | 'published' | 'rejected' | 'suspended' | 'archived';
export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'failed';

export interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id?: string | null;
  active: boolean;
  sort_order: number;
}

export interface BusinessService {
  id?: string;
  business_id?: string;
  service_name: string;
  service_description?: string | null;
  sort_order?: number;
}

export interface BusinessProduct {
  id?: string;
  business_id?: string;
  name: string;
  description?: string | null;
  image_path?: string | null;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}

export interface BusinessMedia {
  id?: string;
  business_id?: string;
  kind: 'logo' | 'cover' | 'gallery';
  storage_path: string;
  mime_type?: string;
  byte_size?: number;
  sort_order?: number;
  caption?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface BusinessServiceInput {
  service_name: string;
  service_description?: string;
}

export interface BusinessProductInput {
  id?: string;
  name: string;
  description?: string;
  image_path?: string;
  sort_order?: number;
}

export interface BusinessMediaInput {
  id?: string;
  kind: 'logo' | 'cover' | 'gallery';
  storage_path: string;
  sort_order?: number;
  caption?: string;
}

export interface BusinessServiceArea {
  id?: string;
  business_id?: string;
  name: string;
  city?: string | null;
  state?: string | null;
  country?: string | null;
}

export interface BusinessHoursItem {
  id?: string;
  business_id?: string;
  day_of_week: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  opens_at?: string | null; // HH:mm:ss or HH:mm
  closes_at?: string | null;
  is_closed: boolean;
  is_24_hours: boolean;
}

export interface Business {
  id: string;
  canonical_name: string;
  slug: string;
  description: string | null;
  year_established: number | null;
  primary_phone: string;
  primary_phone_normalized: string;
  alternate_phone: string | null;
  whatsapp_phone: string | null;
  business_contact_email: string | null;
  show_email: boolean;
  website_url: string | null;
  website_domain_normalized: string | null;
  primary_category_id: string;
  location_mode: LocationMode;
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
  geo_point: unknown | null;
  facebook_url: string | null;
  instagram_url: string | null;
  linkedin_url: string | null;
  youtube_url: string | null;
  google_business_profile_url: string | null;
  publication_status: PublicationStatus;
  verification_status: VerificationStatus;
  created_source: string;
  source_record_id?: string | null;
  source_buss_id?: string | null;
  source_loc_id?: string | null;
  source_place_id?: string | null;
  imported_by_user_id?: string | null;
  imported_by_member_id?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  category?: Category;
  services?: BusinessService[];
  products?: BusinessProduct[];
  media?: BusinessMedia[];
}

export interface BusinessFormData {
  // Identity
  canonical_name: string;
  description: string;
  year_established: string;
  // Contact / NAP
  primary_phone: string;
  alternate_phone: string;
  whatsapp_phone: string;
  business_contact_email: string;
  show_email: boolean;
  website_url: string;
  google_business_profile_url: string;
  // Category & Services
  primary_category_id: string;
  services: Array<BusinessServiceInput | string>;
  // Products
  products: BusinessProductInput[];
  // Location
  location_mode: LocationMode;
  city: string;
  state: string;
  country: string;
  country_code: string;
  address_line_1: string;
  address_line_2: string;
  locality: string;
  postal_code: string;
  show_street_address: boolean;
  latitude: string;
  longitude: string;
  service_areas: string[];
  // Hours
  hours: BusinessHoursItem[];
  // Social
  facebook_url: string;
  instagram_url: string;
  linkedin_url: string;
  youtube_url: string;
  // Media
  media?: BusinessMediaInput[];
}
