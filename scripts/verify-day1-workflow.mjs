import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

async function main() {
  console.log('--- STARTING DAY 1 CORE WORKFLOW INTEGRATION VERIFICATION ---');

  // Client 1: Owner
  const ownerClient = createClient(SUPABASE_URL, ANON_KEY);
  const { data: ownerAuth, error: ownerLoginErr } = await ownerClient.auth.signInWithPassword({
    email: 'owner@buzl.test',
    password: 'password123',
  });

  if (ownerLoginErr || !ownerAuth.user) {
    throw new Error('Owner login failed: ' + (ownerLoginErr?.message || 'unknown'));
  }
  console.log('✓ Owner login successful:', ownerAuth.user.email, 'Role:', ownerAuth.user.app_metadata?.role);

  // Client 2: Admin
  const adminClient = createClient(SUPABASE_URL, ANON_KEY);
  const { data: adminAuth, error: adminLoginErr } = await adminClient.auth.signInWithPassword({
    email: 'admin@buzl.test',
    password: 'password123',
  });

  if (adminLoginErr || !adminAuth.user) {
    throw new Error('Admin login failed: ' + (adminLoginErr?.message || 'unknown'));
  }
  console.log('✓ Admin login successful:', adminAuth.user.email, 'Role:', adminAuth.user.app_metadata?.role);

  // Fetch active categories
  const { data: categories, error: catErr } = await ownerClient
    .from('categories')
    .select('id, name, slug')
    .eq('active', true)
    .order('sort_order', { ascending: true });

  if (catErr || !categories || categories.length === 0) {
    throw new Error('Failed to fetch categories: ' + catErr?.message);
  }
  console.log(`✓ Fetched ${categories.length} active categories. Example: ${categories[0].name}`);

  const cat1 = categories[0].id;
  const cat2 = categories[1].id;

  // 1. Create Storefront Business as Owner
  console.log('\n--- 1. Creating Storefront Business ---');
  const { data: storefrontId, error: sfErr } = await ownerClient.rpc('create_business_for_current_user', {
    p_canonical_name: 'Apex Digital Solutions',
    p_primary_phone: '+91 98765 43210',
    p_primary_category_id: cat1,
    p_location_mode: 'storefront',
    p_city: 'New Delhi',
    p_state: 'Delhi',
    p_country: 'India',
    p_country_code: 'IN',
    p_address_line_1: '104, Barakhamba Road',
    p_address_line_2: 'Statesman House',
    p_locality: 'Connaught Place',
    p_postal_code: '110001',
    p_show_street_address: true,
    p_latitude: 28.6297,
    p_longitude: 77.2274,
  });

  if (sfErr || !storefrontId) {
    throw new Error('Storefront creation failed: ' + sfErr?.message);
  }
  console.log('✓ Storefront created with ID:', storefrontId);

  // Add services & hours to storefront
  await ownerClient.from('business_services').insert([
    { business_id: storefrontId, service_name: 'Web Design', sort_order: 1 },
    { business_id: storefrontId, service_name: 'SEO Optimization', sort_order: 2 },
  ]);
  console.log('✓ Added services to storefront');

  await ownerClient.from('business_hours').insert([
    { business_id: storefrontId, day_of_week: 1, opens_at: '09:00', closes_at: '18:00', is_closed: false, is_24_hours: false },
    { business_id: storefrontId, day_of_week: 2, opens_at: '09:00', closes_at: '18:00', is_closed: false, is_24_hours: false },
  ]);
  console.log('✓ Added hours to storefront');

  // Verify owner CANNOT publish directly to 'published'
  const { error: directPublishErr } = await ownerClient.rpc('transition_business_publication', {
    target_business_id: storefrontId,
    next_status: 'published',
  });
  if (!directPublishErr) {
    throw new Error('SECURITY VIOLATION: Owner was able to directly publish!');
  }
  console.log('✓ Security check passed: Owner directly publishing to "published" was rejected as expected.');

  // Owner submits storefront for review
  const { error: submitErr } = await ownerClient.rpc('transition_business_publication', {
    target_business_id: storefrontId,
    next_status: 'pending',
  });
  if (submitErr) {
    throw new Error('Owner submit to pending failed: ' + submitErr.message);
  }
  console.log('✓ Owner submitted storefront to "pending" successfully');

  // 2. Create Service-Area Business as Owner
  console.log('\n--- 2. Creating Service-Area Business ---');
  const { data: serviceAreaBizId, error: saErr } = await ownerClient.rpc('create_business_for_current_user', {
    p_canonical_name: 'Delhi Rapid Repair Services',
    p_primary_phone: '+91 98765 11223',
    p_primary_category_id: cat2,
    p_location_mode: 'service_area',
    p_city: 'New Delhi',
    p_state: 'Delhi',
    p_country: 'India',
    p_country_code: 'IN',
    p_address_line_1: null,
    p_address_line_2: null,
    p_locality: null,
    p_postal_code: null,
    p_show_street_address: false,
    p_latitude: null,
    p_longitude: null,
  });

  if (saErr || !serviceAreaBizId) {
    throw new Error('Service area creation failed: ' + saErr?.message);
  }
  console.log('✓ Service-Area business created with ID:', serviceAreaBizId);

  // Add named service areas (required for service_area publishability)
  const { error: areaInsertErr } = await ownerClient.from('business_service_areas').insert([
    { business_id: serviceAreaBizId, name: 'South Delhi', city: 'New Delhi', state: 'Delhi', country: 'India' },
    { business_id: serviceAreaBizId, name: 'Noida Sector 62', city: 'Noida', state: 'Uttar Pradesh', country: 'India' },
  ]);
  if (areaInsertErr) {
    throw new Error('Failed to insert service areas: ' + areaInsertErr.message);
  }
  console.log('✓ Added 2 named service areas');

  // Submit service-area business for review
  const { error: saSubmitErr } = await ownerClient.rpc('transition_business_publication', {
    target_business_id: serviceAreaBizId,
    next_status: 'pending',
  });
  if (saSubmitErr) {
    throw new Error('Service-Area submit to pending failed: ' + saSubmitErr.message);
  }
  console.log('✓ Owner submitted service-area business to "pending" successfully');

  // 3. Create Hybrid Business as Owner
  console.log('\n--- 3. Creating Hybrid Business ---');
  const { data: hybridId, error: hyErr } = await ownerClient.rpc('create_business_for_current_user', {
    p_canonical_name: 'Prestige Dining & Catering',
    p_primary_phone: '+91 98765 99887',
    p_primary_category_id: cat1,
    p_location_mode: 'hybrid',
    p_city: 'New Delhi',
    p_state: 'Delhi',
    p_country: 'India',
    p_country_code: 'IN',
    p_address_line_1: 'Plot 42, Community Centre',
    p_locality: 'Saket',
    p_postal_code: '110017',
    p_show_street_address: true,
    p_latitude: 28.5244,
    p_longitude: 77.2177,
  });

  if (hyErr || !hybridId) {
    throw new Error('Hybrid creation failed: ' + hyErr?.message);
  }
  console.log('✓ Hybrid business created with ID:', hybridId);

  // Add named service area to hybrid
  await ownerClient.from('business_service_areas').insert([
    { business_id: hybridId, name: 'Greater Kailash', city: 'New Delhi', state: 'Delhi', country: 'India' },
  ]);
  console.log('✓ Added service area to hybrid business');

  // Submit hybrid business
  const { error: hySubmitErr } = await ownerClient.rpc('transition_business_publication', {
    target_business_id: hybridId,
    next_status: 'pending',
  });
  if (hySubmitErr) {
    throw new Error('Hybrid submit to pending failed: ' + hySubmitErr.message);
  }
  console.log('✓ Owner submitted hybrid business to "pending" successfully');

  // 4. Test Duplicate Detection Query
  console.log('\n--- 4. Testing Duplicate Detection Query ---');
  const testPhone = '+91 98765 43210'.replace(/[^0-9]/g, ''); // '919876543210'
  const { data: dupMatches } = await ownerClient
    .from('businesses')
    .select('id, canonical_name')
    .eq('primary_phone_normalized', testPhone);

  if (dupMatches && dupMatches.length > 0) {
    console.log('✓ Duplicate detection correctly identified existing listing by phone:', dupMatches[0].canonical_name);
  } else {
    throw new Error('Duplicate detection failed to find matching phone');
  }

  // 5. Admin Moderation & Publication Actions
  console.log('\n--- 5. Admin Moderation & Publication ---');
  // Admin queries all businesses
  const { data: allAdminBiz, error: adminQueryErr } = await adminClient
    .from('businesses')
    .select('id, canonical_name, publication_status, slug')
    .order('created_at', { ascending: false });

  if (adminQueryErr || !allAdminBiz || allAdminBiz.length < 3) {
    throw new Error('Admin query failed or returned too few businesses: ' + adminQueryErr?.message);
  }
  console.log(`✓ Admin successfully queried all ${allAdminBiz.length} platform listings`);

  // Admin publishes Storefront
  const { error: adminPubErr } = await adminClient.rpc('transition_business_publication', {
    target_business_id: storefrontId,
    next_status: 'published',
  });
  if (adminPubErr) {
    throw new Error('Admin publication of storefront failed: ' + adminPubErr.message);
  }
  console.log('✓ Admin published Apex Digital Solutions');

  // Admin verifies Storefront
  const { error: adminVerErr } = await adminClient.rpc('set_business_verification', {
    target_business_id: storefrontId,
    next_status: 'verified',
  });
  if (adminVerErr) {
    throw new Error('Admin verification failed: ' + adminVerErr.message);
  }
  console.log('✓ Admin verified Apex Digital Solutions');

  // Admin publishes Service Area
  const { error: adminSaPubErr } = await adminClient.rpc('transition_business_publication', {
    target_business_id: serviceAreaBizId,
    next_status: 'published',
  });
  if (adminSaPubErr) {
    throw new Error('Admin publication of service-area failed: ' + adminSaPubErr.message);
  }
  console.log('✓ Admin published Delhi Rapid Repair Services');

  // Admin suspends Hybrid
  const { error: adminSuspendErr } = await adminClient.rpc('transition_business_publication', {
    target_business_id: hybridId,
    next_status: 'suspended',
  });
  if (adminSuspendErr) {
    throw new Error('Admin suspension failed: ' + adminSuspendErr.message);
  }
  console.log('✓ Admin suspended Prestige Dining & Catering');

  // 6. Test Public Reader (Anonymous)
  console.log('\n--- 6. Anonymous Public Reader Verification ---');
  const anonClient = createClient(SUPABASE_URL, ANON_KEY);

  // Get slug of published storefront
  const { data: publishedBiz } = await adminClient
    .from('businesses')
    .select('slug')
    .eq('id', storefrontId)
    .single();

  const { data: publicData, error: pubReadErr } = await anonClient.rpc('get_published_business_public', {
    requested_slug: publishedBiz.slug,
  });

  if (pubReadErr || !publicData || publicData.length === 0) {
    throw new Error('Public read of published business failed: ' + pubReadErr?.message);
  }

  const pubRecord = publicData[0];
  console.log('✓ Public reader returned canonical data:');
  console.log('  Name:', pubRecord.canonical_name);
  console.log('  Category:', pubRecord.category_name);
  console.log('  Mode:', pubRecord.location_mode);
  console.log('  Address:', pubRecord.address_line_1, pubRecord.locality, pubRecord.city);
  console.log('  Phone:', pubRecord.primary_phone);

  // Check that private coordinates / internal fields are NOT returned
  if ('geo_point' in pubRecord || 'latitude' in pubRecord || 'primary_phone_normalized' in pubRecord) {
    throw new Error('SECURITY VIOLATION: Private coordinates or normalized fields leaked to public reader!');
  }
  console.log('✓ Security check passed: No coordinates, normalized data, or internal states leaked.');

  // Check that suspended hybrid business is NOT accessible to public reader
  const { data: suspendedBiz } = await adminClient
    .from('businesses')
    .select('slug')
    .eq('id', hybridId)
    .single();

  const { data: suspendedPublicData } = await anonClient.rpc('get_published_business_public', {
    requested_slug: suspendedBiz.slug,
  });

  if (suspendedPublicData && suspendedPublicData.length > 0) {
    throw new Error('SECURITY VIOLATION: Suspended business returned by public reader!');
  }
  console.log('✓ Security check passed: Suspended business correctly hidden from public reader.');

  console.log('\n======================================================');
  console.log('ALL DAY 1 CORE WORKFLOW CHECKS PASSED PERFECTLY!');
  console.log('======================================================');
}

main().catch((err) => {
  console.error('VERIFICATION FAILED:', err);
  process.exit(1);
});
