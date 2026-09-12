import { BuzlProfileImportInput } from './schema';
import { BusinessFormData, LocationMode } from '@/types/business';

export interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

export interface CategoryMatchResult {
  status: 'matched' | 'review_required';
  categoryId: string | null;
  categoryName: string | null;
  sourceCategory: string;
  note?: string;
}

export interface ParsedAddress {
  rawAddress: string;
  address_line_1: string;
  address_line_2: string;
  locality: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  country_code: string;
}

export interface ImportMappedListing {
  sourceIdentity: {
    recordId: string | null;
    bussId: string | null;
    locId: string | null;
    placeId: string | null;
    legacyStatus: string;
    gbpStatus: string;
    createdBy?: string;
    createdAt?: string;
    updatedBy?: string;
    updatedAt?: string;
  };
  formData: BusinessFormData;
  categoryMatch: CategoryMatchResult;
  sourceCoordinates: {
    lat: number | null;
    lng: number | null;
    isSuppressedFromPublic: boolean;
  };
  warnings: string[];
}

const INDIAN_STATES = [
  'Andaman and Nicobar Islands',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Chhattisgarh',
  'Dadra and Nagar Haveli',
  'Daman and Diu',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu and Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Ladakh',
  'Lakshadweep',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Puducherry',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
];

const CATEGORY_ALIASES: Record<string, string> = {
  'digital marketing': 'digital-marketing-agency',
  'digital marketing agency': 'digital-marketing-agency',
  'web design': 'web-design-company',
  'web designer': 'web-design-company',
  'restaurant': 'restaurant',
  'hotel': 'hotel',
  'travel agency': 'travel-agency',
  'tour agency': 'travel-agency',
  'real estate': 'real-estate-agency',
  'real estate agency': 'real-estate-agency',
  'financial consultant': 'financial-consultant',
  'financial advisor': 'financial-consultant',
  'clinic': 'clinic',
  'hospital': 'clinic',
  'doctor': 'clinic',
  'beauty salon': 'beauty-salon',
  'hair salon': 'beauty-salon',
  'automobile service': 'automobile-service',
  'car repair': 'automobile-service',
  'car service': 'automobile-service',
  'education & training': 'education-training',
  'coaching center': 'education-training',
  'retail store': 'retail-store',
  'grocery store': 'retail-store',
  'shop': 'retail-store',
};

export function parseIndianAddress(raw: string, fallbackCity?: string): ParsedAddress {
  const result: ParsedAddress = {
    rawAddress: raw,
    address_line_1: '',
    address_line_2: '',
    locality: '',
    city: fallbackCity || 'Chennai',
    state: 'Tamil Nadu',
    postal_code: '',
    country: 'India',
    country_code: 'IN',
  };

  if (!raw || !raw.trim()) {
    return result;
  }

  let cleaned = raw.trim();

  // 1. Extract PIN Code (6-digit number)
  const pinMatch = cleaned.match(/\b(\d{6})\b/);
  if (pinMatch) {
    result.postal_code = pinMatch[1];
    cleaned = cleaned.replace(pinMatch[0], '').replace(/,\s*,/g, ',').trim();
  }

  // 2. Extract State
  for (const st of INDIAN_STATES) {
    const regex = new RegExp(`\\b${st}\\b`, 'i');
    if (regex.test(cleaned)) {
      result.state = st;
      cleaned = cleaned.replace(regex, '').replace(/,\s*,/g, ',').trim();
      break;
    }
  }

  // Split remaining by commas
  const segments = cleaned
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (segments.length === 0) {
    result.address_line_1 = raw.trim();
    return result;
  }

  // Last segment is typically City if not matched
  if (segments.length >= 1) {
    const candidateCity = segments.pop()!;
    if (candidateCity) {
      result.city = candidateCity;
    }
  }

  // Next segment from end is typically Locality
  if (segments.length >= 1) {
    result.locality = segments.pop()!;
  }

  // Remaining parts form address_line_1 and optionally address_line_2
  if (segments.length > 2) {
    result.address_line_1 = segments.slice(0, 2).join(', ');
    result.address_line_2 = segments.slice(2).join(', ');
  } else if (segments.length > 0) {
    result.address_line_1 = segments.join(', ');
  } else {
    result.address_line_1 = result.locality || result.city;
  }

  return result;
}

export function matchCategory(
  sourceCategory: string,
  activeCategories: CategoryOption[]
): CategoryMatchResult {
  const normSource = (sourceCategory || '').trim().toLowerCase();

  // 1. Direct name match
  const directMatch = activeCategories.find(
    (c) => c.name.toLowerCase() === normSource || c.slug.toLowerCase() === normSource
  );
  if (directMatch) {
    return {
      status: 'matched',
      categoryId: directMatch.id,
      categoryName: directMatch.name,
      sourceCategory,
    };
  }

  // 2. Alias lookup
  const aliasSlug = CATEGORY_ALIASES[normSource];
  if (aliasSlug) {
    const aliasMatch = activeCategories.find((c) => c.slug === aliasSlug);
    if (aliasMatch) {
      return {
        status: 'matched',
        categoryId: aliasMatch.id,
        categoryName: aliasMatch.name,
        sourceCategory,
        note: `Matched via alias '${aliasSlug}'`,
      };
    }
  }

  // 3. Review required (no match found)
  return {
    status: 'review_required',
    categoryId: null,
    categoryName: null,
    sourceCategory,
    note: `Source category '${sourceCategory}' is not an active category. Manual selection required.`,
  };
}

export function mapBuzlProfileToListing(
  input: BuzlProfileImportInput,
  activeCategories: CategoryOption[]
): ImportMappedListing {
  const warnings: string[] = [];

  // 1. Category Matching
  const categoryMatch = matchCategory(input.category, activeCategories);
  if (categoryMatch.status === 'review_required') {
    warnings.push(
      `Category Review Required: "${input.category}" does not match any active category. Please select an active category before saving.`
    );
  }

  // 2. Location Mode & Privacy
  const rawModel = input.serviceModel || 'service_area';
  let mode: LocationMode = 'service_area';
  if (rawModel === 'storefront' || rawModel === 'hybrid') {
    mode = rawModel;
  }

  const isServiceArea = mode === 'service_area';

  // 3. Address parsing
  const rawAddress = input.location?.address || '';
  const primaryServiceArea = input.location?.serviceAreas?.[0];
  const parsedAddress = parseIndianAddress(rawAddress, primaryServiceArea);

  // 4. Source Coordinates & Suppression
  const sourceLat = input.location?.geo?.lat ?? null;
  const sourceLng = input.location?.geo?.lng ?? null;
  const isSuppressed = isServiceArea;

  if (isServiceArea) {
    warnings.push(
      'Service-area mode: Street address and map coordinates from legacy profile are suppressed from public view and held for internal review only.'
    );
  }

  // 5. Description synthesis from tagline and notes
  const descriptionParts: string[] = [];
  if (input.tagline?.trim()) {
    descriptionParts.push(input.tagline.trim());
  }
  if (input.notes?.trim()) {
    descriptionParts.push(input.notes.trim());
  }
  if (input.usp && input.usp.length > 0) {
    descriptionParts.push(`Key Highlights: ${input.usp.join(' • ')}`);
  }
  const description = descriptionParts.join('\n\n');

  // 6. Services list
  const services: string[] = Array.from(
    new Set(
      (input.services || [])
        .map((s) => (typeof s === 'string' ? s.trim() : ''))
        .filter((s) => s.length > 0)
    )
  );

  // 7. Service areas list
  const serviceAreas: string[] = Array.from(
    new Set(
      (input.location?.serviceAreas || [])
        .map((a) => a.trim())
        .filter((a) => a.length > 0)
    )
  );
  if (isServiceArea && serviceAreas.length === 0 && parsedAddress.city) {
    serviceAreas.push(parsedAddress.city);
  }

  // 8. Contact & Socials
  const phone = (input.contact?.phone || '').trim();
  if (!phone) {
    warnings.push('Warning: Primary phone number is missing from the imported profile.');
  }

  const formData: BusinessFormData = {
    canonical_name: input.name.trim(),
    description,
    year_established: '',
    primary_phone: phone,
    alternate_phone: '',
    whatsapp_phone: '',
    business_contact_email: (input.contact?.email || '').trim(),
    show_email: false, // Default false for privacy
    website_url: (input.website?.url || '').trim(),
    primary_category_id: categoryMatch.categoryId || '',
    services,
    location_mode: mode,
    city: parsedAddress.city,
    state: parsedAddress.state,
    country: parsedAddress.country,
    country_code: parsedAddress.country_code,
    address_line_1: isServiceArea ? '' : parsedAddress.address_line_1,
    address_line_2: isServiceArea ? '' : parsedAddress.address_line_2,
    locality: isServiceArea ? '' : parsedAddress.locality,
    postal_code: isServiceArea ? '' : parsedAddress.postal_code,
    show_street_address: isServiceArea ? false : true,
    latitude: !isServiceArea && sourceLat !== null ? String(sourceLat) : '',
    longitude: !isServiceArea && sourceLng !== null ? String(sourceLng) : '',
    service_areas: serviceAreas,
    hours: [],
    facebook_url: input.social?.facebook?.trim() || '',
    instagram_url: input.social?.instagram?.trim() || '',
    linkedin_url: input.social?.linkedin?.trim() || '',
    youtube_url: input.social?.youtube?.trim() || '',
  };

  return {
    sourceIdentity: {
      recordId: input._id || null,
      bussId: input.bussId || null,
      locId: input.locId || null,
      placeId: input.placeId || null,
      legacyStatus: input.status || 'active',
      gbpStatus: input.gbpStatus || 'active',
      createdBy: input.createdBy,
      createdAt: input.createdAt,
      updatedBy: input.updatedBy,
      updatedAt: input.updatedAt,
    },
    formData,
    categoryMatch,
    sourceCoordinates: {
      lat: sourceLat,
      lng: sourceLng,
      isSuppressedFromPublic: isSuppressed,
    },
    warnings,
  };
}
