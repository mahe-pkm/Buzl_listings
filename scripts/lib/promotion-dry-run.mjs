const SOURCE_KEYS = ["source_record_id", "source_buss_id", "source_loc_id", "source_place_id"];

export function normalizePhone(value) {
  return String(value || "").replace(/\D/g, "");
}

export function normalizeDomain(value) {
  if (!value) return null;
  try {
    return new URL(value.includes("://") ? value : `https://${value}`).hostname
      .replace(/^www\./i, "")
      .toLowerCase();
  } catch {
    return null;
  }
}

export function validateSelector(selector) {
  if (!selector || typeof selector !== "object") return "localSelector is required";
  const presentSourceKeys = SOURCE_KEYS.filter((key) => typeof selector[key] === "string" && selector[key].trim());
  if (presentSourceKeys.length === 1) return null;
  if (presentSourceKeys.length > 1) return "localSelector must contain one source provenance key";
  if (typeof selector.slug === "string" && selector.slug.trim()) return null;
  if (typeof selector.canonical_name === "string" && selector.canonical_name.trim() && normalizePhone(selector.primary_phone)) return null;
  return "localSelector needs one provenance key, slug, or canonical_name plus primary_phone";
}

export function privacyIssues(business) {
  if (!['service_area', 'hybrid'].includes(business.location_mode)) return [];
  const issues = [];
  if (business.location_mode === 'service_area' && business.show_street_address) issues.push('service_area listing has show_street_address=true');
  if (business.location_mode === 'service_area' && (business.address_line_1 || business.address_line_2 || business.postal_code || business.geo_point)) {
    issues.push('service_area listing retains street address, postal code, or coordinates');
  }
  return issues;
}

export function classifyCandidate(localBusiness, candidates, context) {
  const privacy = context.privacyIssues || [];
  if (context.localSelectionError || context.categoryMissing || context.ownerIssue || privacy.length) {
    return { classification: 'NEEDS REVIEW', action: 'skip' };
  }
  if (!candidates.length) return { classification: 'LOCAL ONLY', action: 'create' };
  const strong = candidates.filter((candidate) => candidate.signals.some((signal) => signal.startsWith('provenance:')) || (candidate.signals.includes('phone') && candidate.signals.includes('domain')));
  if (strong.length === 1 && candidates.length === 1) return { classification: 'EXISTS IN STAGING', action: 'update' };
  return { classification: 'POSSIBLE DUPLICATE', action: 'skip' };
}

export function validateRequestedPublicationStatus(value) {
  if (value == null) return null;
  return ['draft', 'pending', 'published', 'rejected', 'suspended', 'archived'].includes(value)
    ? null
    : 'requestedPublicationStatus must be a valid publication state when provided';
}

export function makePackage(localBusiness, category, children, requestedPublicationStatus) {
  return {
    mediaExcluded: true,
    publicationStatus: requestedPublicationStatus || null,
    publicationStatusExplicitlyRequested: Boolean(requestedPublicationStatus),
    business: {
      canonical_name: localBusiness.canonical_name,
      primary_phone: localBusiness.primary_phone,
      primary_category_slug: category?.slug || null,
      location_mode: localBusiness.location_mode,
      city: localBusiness.city,
      state: localBusiness.state,
      country: localBusiness.country,
      country_code: localBusiness.country_code,
      show_email: localBusiness.show_email,
      show_street_address: localBusiness.show_street_address,
      description: localBusiness.description,
      year_established: localBusiness.year_established,
      alternate_phone: localBusiness.alternate_phone,
      whatsapp_phone: localBusiness.whatsapp_phone,
      business_contact_email: localBusiness.business_contact_email,
      website_url: localBusiness.website_url,
      address_line_1: localBusiness.address_line_1,
      address_line_2: localBusiness.address_line_2,
      locality: localBusiness.locality,
      district: localBusiness.district,
      postal_code: localBusiness.postal_code,
      social: {
        facebook_url: localBusiness.facebook_url,
        instagram_url: localBusiness.instagram_url,
        linkedin_url: localBusiness.linkedin_url,
        youtube_url: localBusiness.youtube_url
      },
      provenance: Object.fromEntries(SOURCE_KEYS.map((key) => [key, localBusiness[key] || null]))
    },
    services: children.services || [],
    hours: children.hours || [],
    serviceAreas: children.serviceAreas || []
  };
}
