'use server';

import { createClient, getSessionUser } from '@/lib/supabase/server';
import {
  BusinessFormData,
  LocationMode,
  PublicationStatus,
  VerificationStatus,
} from '@/types/business';
import { revalidatePath } from 'next/cache';

export async function checkDuplicates(phone: string, websiteUrl?: string, excludeId?: string) {
  const supabase = await createClient();
  const digits = phone.replace(/[^0-9]/g, '');
  if (!digits || digits.length < 7) {
    return { isDuplicate: false, message: null };
  }

  let domain: string | null = null;
  if (websiteUrl && websiteUrl.trim()) {
    try {
      const url = websiteUrl.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '');
      domain = url.split('/')[0] || null;
    } catch {
      domain = null;
    }
  }

  // Check matching phone
  let phoneQuery = supabase
    .from('businesses')
    .select('id, canonical_name')
    .eq('primary_phone_normalized', digits);

  if (excludeId) {
    phoneQuery = phoneQuery.neq('id', excludeId);
  }

  const { data: phoneMatches } = await phoneQuery;

  if (phoneMatches && phoneMatches.length > 0) {
    return {
      isDuplicate: true,
      reason: 'phone',
      message: `A listing named "${phoneMatches[0].canonical_name}" already exists with this phone number. Duplicate listings are flagged for administrative review.`,
    };
  }

  // Check matching domain if present
  if (domain) {
    let domainQuery = supabase
      .from('businesses')
      .select('id, canonical_name')
      .eq('website_domain_normalized', domain);

    if (excludeId) {
      domainQuery = domainQuery.neq('id', excludeId);
    }

    const { data: domainMatches } = await domainQuery;
    if (domainMatches && domainMatches.length > 0) {
      return {
        isDuplicate: true,
        reason: 'domain',
        message: `A listing named "${domainMatches[0].canonical_name}" already exists with this website domain. Duplicate listings are flagged for administrative review.`,
      };
    }
  }

  return { isDuplicate: false, message: null };
}

export interface ImportDuplicateMatch {
  id: string;
  canonical_name: string;
  reason: 'phone' | 'domain' | 'source_buss_id' | 'source_loc_id' | 'source_place_id';
  field: string;
  value: string;
}

export async function checkImportDuplicates(params: {
  phone?: string;
  websiteUrl?: string;
  sourceBussId?: string | null;
  sourceLocId?: string | null;
  sourcePlaceId?: string | null;
}): Promise<{ isDuplicate: boolean; matches: ImportDuplicateMatch[] }> {
  const supabase = await createClient();
  const matches: ImportDuplicateMatch[] = [];

  // 1. Phone match
  if (params.phone) {
    const digits = params.phone.replace(/[^0-9]/g, '');
    if (digits.length >= 7) {
      const { data } = await supabase
        .from('businesses')
        .select('id, canonical_name')
        .eq('primary_phone_normalized', digits)
        .limit(1);

      if (data && data.length > 0) {
        matches.push({
          id: data[0].id,
          canonical_name: data[0].canonical_name,
          reason: 'phone',
          field: 'Primary Phone',
          value: params.phone,
        });
      }
    }
  }

  // 2. Domain match
  if (params.websiteUrl && params.websiteUrl.trim()) {
    try {
      const url = params.websiteUrl.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '');
      const domain = url.split('/')[0] || null;
      if (domain) {
        const { data } = await supabase
          .from('businesses')
          .select('id, canonical_name')
          .eq('website_domain_normalized', domain)
          .limit(1);

        if (data && data.length > 0) {
          matches.push({
            id: data[0].id,
            canonical_name: data[0].canonical_name,
            reason: 'domain',
            field: 'Website Domain',
            value: domain,
          });
        }
      }
    } catch {
      // Ignore URL parsing errors
    }
  }

  // 3. Source Buss ID
  if (params.sourceBussId) {
    const { data } = await supabase
      .from('businesses')
      .select('id, canonical_name')
      .eq('source_buss_id', params.sourceBussId)
      .limit(1);

    if (data && data.length > 0) {
      matches.push({
        id: data[0].id,
        canonical_name: data[0].canonical_name,
        reason: 'source_buss_id',
        field: 'Source Buss ID (bussId)',
        value: params.sourceBussId,
      });
    }
  }

  // 4. Source Loc ID
  if (params.sourceLocId) {
    const { data } = await supabase
      .from('businesses')
      .select('id, canonical_name')
      .eq('source_loc_id', params.sourceLocId)
      .limit(1);

    if (data && data.length > 0) {
      matches.push({
        id: data[0].id,
        canonical_name: data[0].canonical_name,
        reason: 'source_loc_id',
        field: 'Source Location ID (locId)',
        value: params.sourceLocId,
      });
    }
  }

  // 5. Source Place ID
  if (params.sourcePlaceId) {
    const { data } = await supabase
      .from('businesses')
      .select('id, canonical_name')
      .eq('source_place_id', params.sourcePlaceId)
      .limit(1);

    if (data && data.length > 0) {
      matches.push({
        id: data[0].id,
        canonical_name: data[0].canonical_name,
        reason: 'source_place_id',
        field: 'Source Place ID (placeId)',
        value: params.sourcePlaceId,
      });
    }
  }

  return {
    isDuplicate: matches.length > 0,
    matches,
  };
}

export async function createDraftFromImport({
  formData,
  provenance,
}: {
  formData: BusinessFormData;
  provenance: {
    source_record_id?: string | null;
    source_buss_id?: string | null;
    source_loc_id?: string | null;
    source_place_id?: string | null;
  };
}) {
  const user = await getSessionUser();
  if (!user || (!user.isAdmin && !user.isBuzlMember)) {
    return { success: false, error: 'Unauthorized: Internal Buzl Member or Admin role required.' };
  }

  const supabase = await createClient();

  // Validate category requirement
  if (!formData.primary_category_id) {
    return { success: false, error: 'Category is required. Please select an active category.' };
  }

  // Validate location mode requirements
  const mode = formData.location_mode;
  if (mode === 'storefront' || mode === 'hybrid') {
    if (!formData.address_line_1?.trim() || !formData.locality?.trim() || !formData.postal_code?.trim()) {
      return { success: false, error: 'Storefront and hybrid listings require Address Line 1, Locality, and Postal Code.' };
    }
    if (!formData.latitude || !formData.longitude) {
      return { success: false, error: 'Storefront and hybrid listings require valid map coordinates.' };
    }
  }

  if (mode === 'service_area' || mode === 'hybrid') {
    const validAreas = (formData.service_areas || []).filter((a) => a.trim().length > 0);
    if (validAreas.length === 0) {
      return { success: false, error: 'Service-area and hybrid listings require at least one named service area.' };
    }
  }

  const lat = (mode === 'storefront' || mode === 'hybrid') && formData.latitude ? parseFloat(formData.latitude) : null;
  const lng = (mode === 'storefront' || mode === 'hybrid') && formData.longitude ? parseFloat(formData.longitude) : null;
  const showAddress = mode === 'service_area' ? false : Boolean(formData.show_street_address);

  // 1. Call RPC create_business_for_current_user
  const { data: businessId, error: rpcError } = await supabase.rpc(
    'create_business_for_current_user',
    {
      p_canonical_name: formData.canonical_name.trim(),
      p_primary_phone: formData.primary_phone.trim(),
      p_primary_category_id: formData.primary_category_id,
      p_location_mode: mode as LocationMode,
      p_city: formData.city.trim(),
      p_state: formData.state.trim(),
      p_country: formData.country?.trim() || 'India',
      p_country_code: (formData.country_code?.trim() || 'IN').toUpperCase(),
      p_address_line_1: mode === 'service_area' ? null : formData.address_line_1?.trim() || null,
      p_address_line_2: mode === 'service_area' ? null : formData.address_line_2?.trim() || null,
      p_locality: mode === 'service_area' ? null : formData.locality?.trim() || null,
      p_postal_code: mode === 'service_area' ? null : formData.postal_code?.trim() || null,
      p_show_street_address: showAddress,
      p_latitude: lat,
      p_longitude: lng,
      p_place_id: (provenance.source_place_id || formData.place_id)?.trim() || null,
    }
  );

  if (rpcError || !businessId) {
    return { success: false, error: rpcError?.message || 'Failed to create business listing' };
  }

  // 2. Update optional fields and provenance
  const { error: updateError } = await supabase
    .from('businesses')
    .update({
      description: formData.description?.trim() || null,
      year_established: formData.year_established ? parseInt(formData.year_established, 10) : null,
      alternate_phone: formData.alternate_phone?.trim() || null,
      whatsapp_phone: formData.whatsapp_phone?.trim() || null,
      business_contact_email: formData.business_contact_email?.trim() || null,
      show_email: formData.show_email ?? false,
      website_url: formData.website_url?.trim() || null,
      google_business_profile_url: formData.google_business_profile_url?.trim() || null,
      place_id: (provenance.source_place_id || formData.place_id)?.trim() || null,
      facebook_url: formData.facebook_url?.trim() || null,
      instagram_url: formData.instagram_url?.trim() || null,
      linkedin_url: formData.linkedin_url?.trim() || null,
      youtube_url: formData.youtube_url?.trim() || null,
      created_source: 'trusted_import',
      source_record_id: provenance.source_record_id?.trim() || null,
      source_buss_id: provenance.source_buss_id?.trim() || null,
      source_loc_id: provenance.source_loc_id?.trim() || null,
      source_place_id: provenance.source_place_id?.trim() || null,
      imported_by_user_id: user.id,
      imported_by_member_id: user.memberId || null,
    })
    .eq('id', businessId);

  if (updateError) {
    return { success: false, error: updateError.message, businessId };
  }

  // 3. Insert Services (normalized, max 20)
  const cleanServices = (formData.services || [])
    .map((s) => {
      if (typeof s === 'string') return { service_name: s.trim(), service_description: null };
      return {
        service_name: (s.service_name || '').trim(),
        service_description: s.service_description ? s.service_description.trim() : null,
      };
    })
    .filter((s) => s.service_name.length > 0)
    .slice(0, 20);

  if (cleanServices.length > 0) {
    const serviceRows = cleanServices.map((s, idx) => ({
      business_id: businessId,
      service_name: s.service_name,
      service_description: s.service_description || null,
      sort_order: idx + 1,
    }));
    await supabase.from('business_services').insert(serviceRows);
  }

  // 4. Insert Service Areas if applicable
  if ((mode === 'service_area' || mode === 'hybrid') && formData.service_areas?.length > 0) {
    const areaRows = formData.service_areas
      .filter((a) => a.trim().length > 0)
      .map((name) => ({
        business_id: businessId,
        name: name.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        country: formData.country?.trim() || 'India',
      }));
    if (areaRows.length > 0) {
      await supabase.from('business_service_areas').insert(areaRows);
    }
  }

  // 5. Insert Hours
  if (formData.hours && formData.hours.length > 0) {
    const hourRows = formData.hours.map((h) => ({
      business_id: businessId,
      day_of_week: h.day_of_week,
      opens_at: h.is_closed || h.is_24_hours ? null : h.opens_at || null,
      closes_at: h.is_closed || h.is_24_hours ? null : h.closes_at || null,
      is_closed: h.is_closed,
      is_24_hours: h.is_24_hours,
    }));
    await supabase.from('business_hours').insert(hourRows);
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/businesses');
  revalidatePath('/admin/businesses');
  revalidatePath('/admin/businesses/import');

  return {
    success: true,
    businessId,
    memberId: user.memberId,
  };
}

export async function createBusiness(data: BusinessFormData) {
  const user = await getSessionUser();
  if (!user) {
    return { success: false, error: 'Authentication required' };
  }

  const supabase = await createClient();

  // Validate location mode requirements
  const mode = data.location_mode;
  if (mode === 'storefront' || mode === 'hybrid') {
    if (!data.address_line_1?.trim() || !data.locality?.trim() || !data.postal_code?.trim()) {
      return { success: false, error: 'Storefront and hybrid listings require Address Line 1, Locality, and Postal Code.' };
    }
    if (!data.latitude || !data.longitude) {
      return { success: false, error: 'Storefront and hybrid listings require valid map coordinates (Latitude and Longitude).' };
    }
  }

  if (mode === 'service_area' || mode === 'hybrid') {
    const validAreas = (data.service_areas || []).filter((a) => a.trim().length > 0);
    if (validAreas.length === 0) {
      return { success: false, error: 'Service-area and hybrid listings require at least one named service area.' };
    }
  }

  // Validate Google Business Profile URL if provided
  const gbpUrl = data.google_business_profile_url?.trim() || null;
  if (gbpUrl && !/^https?:\/\//i.test(gbpUrl)) {
    return { success: false, error: 'Google Business Profile URL must be a valid http or https URL.' };
  }

  // Normalize and validate services (max 20)
  const cleanServices = (data.services || [])
    .map((s) => {
      if (typeof s === 'string') return { service_name: s.trim(), service_description: null };
      return {
        service_name: (s.service_name || '').trim(),
        service_description: s.service_description ? s.service_description.trim() : null,
      };
    })
    .filter((s) => s.service_name.length > 0);

  if (cleanServices.length > 20) {
    return { success: false, error: 'A business cannot have more than 20 services.' };
  }

  // Normalize and validate products (max 20)
  const cleanProducts = (data.products || [])
    .map((p, idx) => ({
      name: (p.name || '').trim(),
      description: p.description ? p.description.trim() : null,
      image_path: p.image_path ? p.image_path.trim() : null,
      sort_order: typeof p.sort_order === 'number' ? p.sort_order : idx + 1,
    }))
    .filter((p) => p.name.length > 0);

  if (cleanProducts.length > 20) {
    return { success: false, error: 'A business cannot have more than 20 products.' };
  }

  // 1. Call RPC create_business_for_current_user
  const lat = (mode === 'storefront' || mode === 'hybrid') && data.latitude ? parseFloat(data.latitude) : null;
  const lng = (mode === 'storefront' || mode === 'hybrid') && data.longitude ? parseFloat(data.longitude) : null;
  const showAddress = mode === 'service_area' ? false : Boolean(data.show_street_address);

  const { data: businessId, error: rpcError } = await supabase.rpc(
    'create_business_for_current_user',
    {
      p_canonical_name: data.canonical_name.trim(),
      p_primary_phone: data.primary_phone.trim(),
      p_primary_category_id: data.primary_category_id,
      p_location_mode: mode as LocationMode,
      p_city: data.city.trim(),
      p_state: data.state.trim(),
      p_country: data.country?.trim() || 'India',
      p_country_code: (data.country_code?.trim() || 'IN').toUpperCase(),
      p_address_line_1: mode === 'service_area' ? null : data.address_line_1?.trim() || null,
      p_address_line_2: mode === 'service_area' ? null : data.address_line_2?.trim() || null,
      p_locality: mode === 'service_area' ? null : data.locality?.trim() || null,
      p_postal_code: mode === 'service_area' ? null : data.postal_code?.trim() || null,
      p_show_street_address: showAddress,
      p_latitude: lat,
      p_longitude: lng,
      p_place_id: data.place_id?.trim() || null,
    }
  );

  if (rpcError || !businessId) {
    return { success: false, error: rpcError?.message || 'Failed to create business listing' };
  }

  // 2. Update optional fields on businesses
  const { error: updateError } = await supabase
    .from('businesses')
    .update({
      description: data.description?.trim() || null,
      year_established: data.year_established ? parseInt(data.year_established, 10) : null,
      alternate_phone: data.alternate_phone?.trim() || null,
      whatsapp_phone: data.whatsapp_phone?.trim() || null,
      business_contact_email: data.business_contact_email?.trim() || null,
      show_email: data.show_email ?? false,
      website_url: data.website_url?.trim() || null,
      google_business_profile_url: gbpUrl,
      place_id: data.place_id?.trim() || null,
      facebook_url: data.facebook_url?.trim() || null,
      instagram_url: data.instagram_url?.trim() || null,
      linkedin_url: data.linkedin_url?.trim() || null,
      youtube_url: data.youtube_url?.trim() || null,
    })
    .eq('id', businessId);

  if (updateError) {
    return { success: false, error: updateError.message, businessId };
  }

  // 3. Insert Services (name + description, max 20)
  if (cleanServices.length > 0) {
    const serviceRows = cleanServices.map((s, idx) => ({
      business_id: businessId,
      service_name: s.service_name,
      service_description: s.service_description,
      sort_order: idx + 1,
    }));
    await supabase.from('business_services').insert(serviceRows);
  }

  // 4. Insert Products (max 20)
  if (cleanProducts.length > 0) {
    const productRows = cleanProducts.map((p, idx) => ({
      business_id: businessId,
      name: p.name,
      description: p.description,
      image_path: p.image_path,
      sort_order: typeof p.sort_order === 'number' ? p.sort_order : idx + 1,
    }));
    await supabase.from('business_products').insert(productRows);
  }

  // 5. Insert Media if provided
  if (data.media && data.media.length > 0) {
    const mediaRows = data.media
      .filter((m) => m.storage_path?.trim())
      .map((m, idx) => ({
        business_id: businessId,
        kind: m.kind,
        storage_path: m.storage_path.trim(),
        mime_type: 'image/jpeg',
        byte_size: 1024,
        sort_order: typeof m.sort_order === 'number' ? m.sort_order : idx + 1,
        caption: m.caption?.trim() || null,
      }));
    if (mediaRows.length > 0) {
      await supabase.from('business_media').insert(mediaRows);
    }
  }

  // 4. Insert Service Areas if applicable
  if ((mode === 'service_area' || mode === 'hybrid') && data.service_areas?.length > 0) {
    const areaRows = data.service_areas
      .filter((a) => a.trim().length > 0)
      .map((name) => ({
        business_id: businessId,
        name: name.trim(),
        city: data.city.trim(),
        state: data.state.trim(),
        country: data.country?.trim() || 'India',
      }));
    if (areaRows.length > 0) {
      await supabase.from('business_service_areas').insert(areaRows);
    }
  }

  // 5. Insert Hours
  if (data.hours && data.hours.length > 0) {
    const hourRows = data.hours.map((h) => ({
      business_id: businessId,
      day_of_week: h.day_of_week,
      opens_at: h.is_closed || h.is_24_hours ? null : h.opens_at || null,
      closes_at: h.is_closed || h.is_24_hours ? null : h.closes_at || null,
      is_closed: h.is_closed,
      is_24_hours: h.is_24_hours,
    }));
    await supabase.from('business_hours').insert(hourRows);
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/businesses');
  revalidatePath('/admin/businesses');

  return { success: true, businessId };
}

export async function updateBusiness(businessId: string, data: BusinessFormData) {
  const user = await getSessionUser();
  if (!user) {
    return { success: false, error: 'Authentication required' };
  }

  const supabase = await createClient();

  const mode = data.location_mode;
  if (mode === 'storefront' || mode === 'hybrid') {
    if (!data.address_line_1?.trim() || !data.locality?.trim() || !data.postal_code?.trim()) {
      return { success: false, error: 'Storefront and hybrid listings require Address Line 1, Locality, and Postal Code.' };
    }
    if (!data.latitude || !data.longitude) {
      return { success: false, error: 'Storefront and hybrid listings require valid map coordinates (Latitude and Longitude).' };
    }
  }

  if (mode === 'service_area' || mode === 'hybrid') {
    const validAreas = (data.service_areas || []).filter((a) => a.trim().length > 0);
    if (validAreas.length === 0) {
      return { success: false, error: 'Service-area and hybrid listings require at least one named service area.' };
    }
  }

  // Validate Google Business Profile URL if provided
  const gbpUrl = data.google_business_profile_url?.trim() || null;
  if (gbpUrl && !/^https?:\/\//i.test(gbpUrl)) {
    return { success: false, error: 'Google Business Profile URL must be a valid http or https URL.' };
  }

  // Normalize and validate services (max 20)
  const cleanServices = (data.services || [])
    .map((s) => {
      if (typeof s === 'string') return { service_name: s.trim(), service_description: null };
      return {
        service_name: (s.service_name || '').trim(),
        service_description: s.service_description ? s.service_description.trim() : null,
      };
    })
    .filter((s) => s.service_name.length > 0);

  if (cleanServices.length > 20) {
    return { success: false, error: 'A business cannot have more than 20 services.' };
  }

  // Normalize and validate products (max 20)
  const cleanProducts = (data.products || [])
    .map((p, idx) => ({
      name: (p.name || '').trim(),
      description: p.description ? p.description.trim() : null,
      image_path: p.image_path ? p.image_path.trim() : null,
      sort_order: typeof p.sort_order === 'number' ? p.sort_order : idx + 1,
    }))
    .filter((p) => p.name.length > 0);

  if (cleanProducts.length > 20) {
    return { success: false, error: 'A business cannot have more than 20 products.' };
  }

  const rawLat = (mode === 'storefront' || mode === 'hybrid') && data.latitude ? parseFloat(data.latitude) : null;
  const rawLng = (mode === 'storefront' || mode === 'hybrid') && data.longitude ? parseFloat(data.longitude) : null;
  const validCoords =
    rawLat !== null &&
    rawLng !== null &&
    !isNaN(rawLat) &&
    !isNaN(rawLng) &&
    rawLat >= -90 &&
    rawLat <= 90 &&
    rawLng >= -180 &&
    rawLng <= 180;
  const lat = validCoords ? rawLat : null;
  const lng = validCoords ? rawLng : null;
  const showAddress = mode === 'service_area' ? false : Boolean(data.show_street_address);

  // Format geo_point for update: WKT format 'POINT(lng lat)'
  const geoPointValue = lat !== null && lng !== null ? `SRID=4326;POINT(${lng} ${lat})` : null;

  // 1. Update businesses table
  const { error: updateError } = await supabase
    .from('businesses')
    .update({
      canonical_name: data.canonical_name.trim(),
      primary_phone: data.primary_phone.trim(),
      primary_category_id: data.primary_category_id,
      location_mode: mode as LocationMode,
      description: data.description?.trim() || null,
      year_established: data.year_established ? parseInt(data.year_established, 10) : null,
      alternate_phone: data.alternate_phone?.trim() || null,
      whatsapp_phone: data.whatsapp_phone?.trim() || null,
      business_contact_email: data.business_contact_email?.trim() || null,
      show_email: data.show_email ?? false,
      website_url: data.website_url?.trim() || null,
      google_business_profile_url: gbpUrl,
      place_id: data.place_id !== undefined ? (data.place_id ? data.place_id.trim() : null) : undefined,
      city: data.city.trim(),
      state: data.state.trim(),
      country: data.country?.trim() || 'India',
      country_code: (data.country_code?.trim() || 'IN').toUpperCase(),
      address_line_1: mode === 'service_area' ? null : data.address_line_1?.trim() || null,
      address_line_2: mode === 'service_area' ? null : data.address_line_2?.trim() || null,
      locality: mode === 'service_area' ? null : data.locality?.trim() || null,
      postal_code: mode === 'service_area' ? null : data.postal_code?.trim() || null,
      show_street_address: showAddress,
      geo_point: geoPointValue,
      facebook_url: data.facebook_url?.trim() || null,
      instagram_url: data.instagram_url?.trim() || null,
      linkedin_url: data.linkedin_url?.trim() || null,
      youtube_url: data.youtube_url?.trim() || null,
    })
    .eq('id', businessId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  // 2. Sync Services (name + description, max 20)
  await supabase.from('business_services').delete().eq('business_id', businessId);
  if (cleanServices.length > 0) {
    const serviceRows = cleanServices.map((s, idx) => ({
      business_id: businessId,
      service_name: s.service_name,
      service_description: s.service_description,
      sort_order: idx + 1,
    }));
    await supabase.from('business_services').insert(serviceRows);
  }

  // 2.5 Sync Products (max 20)
  await supabase.from('business_products').delete().eq('business_id', businessId);
  if (cleanProducts.length > 0) {
    const productRows = cleanProducts.map((p, idx) => ({
      business_id: businessId,
      name: p.name,
      description: p.description,
      image_path: p.image_path,
      sort_order: typeof p.sort_order === 'number' ? p.sort_order : idx + 1,
    }));
    await supabase.from('business_products').insert(productRows);
  }

  // 2.8 Sync Media captions and sort orders
  if (data.media && data.media.length > 0) {
    for (const m of data.media) {
      if (m.id) {
        await supabase
          .from('business_media')
          .update({
            caption: m.caption ? m.caption.trim().slice(0, 200) : null,
            sort_order: typeof m.sort_order === 'number' ? m.sort_order : 0,
          })
          .eq('id', m.id)
          .eq('business_id', businessId);
      }
    }
  }

  // 3. Sync Service Areas
  await supabase.from('business_service_areas').delete().eq('business_id', businessId);
  if ((mode === 'service_area' || mode === 'hybrid') && data.service_areas?.length > 0) {
    const areaRows = data.service_areas
      .filter((a) => a.trim().length > 0)
      .map((name) => ({
        business_id: businessId,
        name: name.trim(),
        city: data.city.trim(),
        state: data.state.trim(),
        country: data.country?.trim() || 'India',
      }));
    if (areaRows.length > 0) {
      await supabase.from('business_service_areas').insert(areaRows);
    }
  }

  // 4. Sync Hours
  await supabase.from('business_hours').delete().eq('business_id', businessId);
  if (data.hours && data.hours.length > 0) {
    const hourRows = data.hours.map((h) => ({
      business_id: businessId,
      day_of_week: h.day_of_week,
      opens_at: h.is_closed || h.is_24_hours ? null : h.opens_at || null,
      closes_at: h.is_closed || h.is_24_hours ? null : h.closes_at || null,
      is_closed: h.is_closed,
      is_24_hours: h.is_24_hours,
    }));
    await supabase.from('business_hours').insert(hourRows);
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/businesses');
  revalidatePath(`/dashboard/businesses/${businessId}/edit`);
  revalidatePath('/admin/businesses');

  return { success: true, businessId };
}

export async function transitionPublication(businessId: string, nextStatus: PublicationStatus) {
  const user = await getSessionUser();
  if (!user) {
    return { success: false, error: 'Authentication required' };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc('transition_business_publication', {
    target_business_id: businessId,
    next_status: nextStatus,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/businesses');
  revalidatePath(`/dashboard/businesses/${businessId}/edit`);
  revalidatePath('/admin/businesses');

  return { success: true };
}

export async function setVerification(businessId: string, nextStatus: VerificationStatus) {
  const user = await getSessionUser();
  if (!user || !user.isAdmin) {
    return { success: false, error: 'Admin role required' };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc('set_business_verification', {
    target_business_id: businessId,
    next_status: nextStatus,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/businesses');
  revalidatePath(`/dashboard/businesses/${businessId}/edit`);
  revalidatePath('/admin/businesses');

  return { success: true };
}

export async function deleteBusiness(businessId: string) {
  const user = await getSessionUser();
  if (!user || !user.isAdmin) {
    return { success: false, error: 'Admin role required' };
  }

  const supabase = await createClient();
  const { error } = await supabase.from('businesses').delete().eq('id', businessId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/businesses');
  revalidatePath('/admin/businesses');

  return { success: true };
}
