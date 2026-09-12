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
      facebook_url: data.facebook_url?.trim() || null,
      instagram_url: data.instagram_url?.trim() || null,
      linkedin_url: data.linkedin_url?.trim() || null,
      youtube_url: data.youtube_url?.trim() || null,
    })
    .eq('id', businessId);

  if (updateError) {
    return { success: false, error: updateError.message, businessId };
  }

  // 3. Insert Services
  const cleanServices = (data.services || []).filter((s) => s.trim().length > 0);
  if (cleanServices.length > 0) {
    const serviceRows = cleanServices.map((name, idx) => ({
      business_id: businessId,
      service_name: name.trim(),
      sort_order: idx + 1,
    }));
    await supabase.from('business_services').insert(serviceRows);
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

  const lat = (mode === 'storefront' || mode === 'hybrid') && data.latitude ? parseFloat(data.latitude) : null;
  const lng = (mode === 'storefront' || mode === 'hybrid') && data.longitude ? parseFloat(data.longitude) : null;
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

  // 2. Sync Services (delete existing for this business and re-insert)
  await supabase.from('business_services').delete().eq('business_id', businessId);
  const cleanServices = (data.services || []).filter((s) => s.trim().length > 0);
  if (cleanServices.length > 0) {
    const serviceRows = cleanServices.map((name, idx) => ({
      business_id: businessId,
      service_name: name.trim(),
      sort_order: idx + 1,
    }));
    await supabase.from('business_services').insert(serviceRows);
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

export function parseEwkbPoint(hex: string | null): { lat: number; lng: number } | null {
  if (!hex || hex.length < 42) return null;
  try {
    const buffer = Buffer.from(hex, 'hex');
    const isLittleEndian = buffer.readUInt8(0) === 1;
    const lng = isLittleEndian ? buffer.readDoubleLE(9) : buffer.readDoubleBE(9);
    const lat = isLittleEndian ? buffer.readDoubleLE(17) : buffer.readDoubleBE(17);
    if (isNaN(lat) || isNaN(lng)) return null;
    return { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) };
  } catch {
    return null;
  }
}
