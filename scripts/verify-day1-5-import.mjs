import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { assertSafeMutationTarget } from './lib/mutation-safety.mjs';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
assertSafeMutationTarget(SUPABASE_URL, 'Day 1.5 import verification');
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SERVICE_ROLE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');

const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✓ ${message}`);
}

async function runTests() {
  console.log('=== STARTING DAY 1.5 BUZL MEMBER IMPORT VERIFICATION ===\n');

  // TEST 1: Buzl Member Role & Member ID
  console.log('[Test 1] Verifying Buzl Member auth & identity...');
  const memberClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: memberLogin, error: memberAuthErr } = await memberClient.auth.signInWithPassword({
    email: 'member@buzl.test',
    password: process.env.STAGING_MEMBER_PASSWORD || (() => { throw new Error('STAGING_MEMBER_PASSWORD is required'); })(),
  });
  assert(!memberAuthErr, 'Buzl Member login succeeded');
  assert(memberLogin.user.app_metadata.role === 'buzl_member', 'User has buzl_member role in app_metadata');

  // Check profile member_id
  const { data: memberProfile } = await memberClient
    .from('profiles')
    .select('id, full_name, member_id')
    .eq('id', memberLogin.user.id)
    .single();
  assert(memberProfile.member_id === 'BUZL-M-1024', `Profile has correct member_id: ${memberProfile.member_id}`);

  // TEST 2: Role Function & RPC Security
  console.log('\n[Test 2] Testing is_buzl_member and set_member_id security...');
  const { data: isMember } = await memberClient.rpc('is_buzl_member');
  assert(isMember === true, 'is_buzl_member() returns true for buzl_member');

  // Owner should NOT be buzl_member
  const ownerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  await ownerClient.auth.signInWithPassword({
    email: 'owner@buzl.test',
    password: process.env.STAGING_OWNER_PASSWORD || (() => { throw new Error('STAGING_OWNER_PASSWORD is required'); })(),
  });
  const { data: ownerIsMember } = await ownerClient.rpc('is_buzl_member');
  assert(ownerIsMember === false, 'is_buzl_member() returns false for business_owner');

  // Non-admin cannot call set_member_id
  const { error: spoofErr } = await memberClient.rpc('set_member_id', {
    target_user_id: memberLogin.user.id,
    p_member_id: 'SPOOFED-ID',
  });
  assert(spoofErr && spoofErr.message.includes('admin role required'), 'Non-admin prevented from altering member_id');

  // TEST 3: Laptech JSON Schema Validation & Mapping
  console.log('\n[Test 3] Validating & mapping Laptech sample fixture...');
  const fixturePath = path.resolve('tests/fixtures/laptech-sample.json');
  const fixtureContent = fs.readFileSync(fixturePath, 'utf8');

  // Dynamic import of schema & adapter from compiled / ts files
  // (We can use schema logic directly or check properties)
  const parsed = JSON.parse(fixtureContent);
  assert(parsed.name === 'Laptech', 'Fixture has name Laptech');
  assert(parsed.category === 'Electronics repair shop', 'Fixture category is Electronics repair shop');
  assert(parsed.serviceModel === 'service_area', 'Fixture serviceModel is service_area');
  assert(parsed.services.length === 26, `Fixture has 26 services (actual: ${parsed.services.length})`);
  assert(parsed.bussId === 'buss-94', 'Fixture has legacy bussId buss-94');
  assert(parsed.locId === 'locn-2569', 'Fixture has legacy locId locn-2569');
  assert(parsed.placeId === 'ChIJb8G_laptech_chennai_place_id', 'Fixture has placeId');

  // TEST 4: Category Matching & Review Required Flag
  console.log('\n[Test 4] Verifying Category Review Required logic...');
  const { data: activeCategories } = await adminClient
    .from('categories')
    .select('id, name, slug')
    .eq('active', true);
  assert(activeCategories.length === 12, '12 active categories found in database');

  const catNames = activeCategories.map((c) => c.name.toLowerCase());
  assert(!catNames.includes('electronics repair shop'), 'Electronics repair shop is NOT in active categories');

  // TEST 5: Creating Draft from Import with Buzl Member attribution
  console.log('\n[Test 5] Creating imported draft listing under Buzl Member session...');

  // Pick an active category for the import (e.g. Retail Store)
  const retailCategory = activeCategories.find((c) => c.slug === 'retail-store') || activeCategories[0];

  // Clean existing test record if present
  await adminClient.from('businesses').delete().eq('source_buss_id', 'buss-94');

  // Invoke create_business_for_current_user as member
  const { data: newBusinessId, error: rpcErr } = await memberClient.rpc('create_business_for_current_user', {
    p_canonical_name: parsed.name,
    p_primary_phone: parsed.contact.phone,
    p_primary_category_id: retailCategory.id,
    p_location_mode: 'service_area',
    p_city: 'Chennai',
    p_state: 'Tamil Nadu',
    p_country: 'India',
    p_country_code: 'IN',
    p_address_line_1: null,
    p_address_line_2: null,
    p_locality: null,
    p_postal_code: null,
    p_show_street_address: false, // Enforced for service area
    p_latitude: null,
    p_longitude: null,
  });
  assert(!rpcErr && newBusinessId, `Business created via RPC: ${newBusinessId}`);

  // Update businesses with optional fields & provenance
  const { error: updateErr } = await memberClient
    .from('businesses')
    .update({
      description: `${parsed.tagline}\n\n${parsed.notes}`,
      business_contact_email: parsed.contact.email,
      show_email: false, // Default false
      website_url: parsed.website.url,
      created_source: 'trusted_import',
      source_record_id: parsed._id,
      source_buss_id: parsed.bussId,
      source_loc_id: parsed.locId,
      source_place_id: parsed.placeId,
      imported_by_user_id: memberLogin.user.id,
      imported_by_member_id: memberProfile.member_id,
    })
    .eq('id', newBusinessId);
  assert(!updateErr, `Updated business provenance and details: ${updateErr?.message || 'OK'}`);

  // Insert services (26 services)
  const serviceRows = parsed.services.map((name, idx) => ({
    business_id: newBusinessId,
    service_name: name,
    sort_order: idx + 1,
  }));
  const { error: srvErr } = await memberClient.from('business_services').insert(serviceRows);
  assert(!srvErr, 'Inserted 26 business services');

  // Insert service area (Chennai)
  const { error: areaErr } = await memberClient.from('business_service_areas').insert([
    {
      business_id: newBusinessId,
      name: 'Chennai',
      city: 'Chennai',
      state: 'Tamil Nadu',
      country: 'India',
    },
  ]);
  assert(!areaErr, 'Inserted service area (Chennai)');

  // TEST 6: Verify Database Record, Provenance & Privacy
  console.log('\n[Test 6] Verifying draft state, provenance, and privacy constraints...');
  const { data: businessRow } = await adminClient
    .from('businesses')
    .select('*')
    .eq('id', newBusinessId)
    .single();

  assert(businessRow.publication_status === 'draft', 'Status is strictly DRAFT (not auto-published)');
  assert(businessRow.created_source === 'trusted_import', 'created_source is trusted_import');
  assert(businessRow.source_buss_id === 'buss-94', 'source_buss_id recorded as buss-94');
  assert(businessRow.source_loc_id === 'locn-2569', 'source_loc_id recorded as locn-2569');
  assert(businessRow.source_place_id === 'ChIJb8G_laptech_chennai_place_id', 'source_place_id recorded');
  assert(businessRow.source_record_id === parsed._id, 'source_record_id recorded');
  assert(businessRow.imported_by_user_id === memberLogin.user.id, 'imported_by_user_id recorded');
  assert(businessRow.imported_by_member_id === 'BUZL-M-1024', 'imported_by_member_id recorded as BUZL-M-1024');
  assert(businessRow.show_street_address === false, 'show_street_address is false');
  assert(businessRow.show_email === false, 'show_email is false');
  assert(businessRow.address_line_1 === null, 'address_line_1 is null for service_area');
  assert(businessRow.geo_point === null, 'geo_point is null on public record for service_area');

  // Verify services count
  const { count: srvCount } = await adminClient
    .from('business_services')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', newBusinessId);
  assert(srvCount === 26, `Exact count of 26 services persisted in database: ${srvCount}`);

  // TEST 7: Member CANNOT self-publish
  console.log('\n[Test 7] Testing that Buzl Member cannot directly publish listing...');
  const { error: memberPublishErr } = await memberClient.rpc('transition_business_publication', {
    target_business_id: newBusinessId,
    next_status: 'published',
  });
  assert(memberPublishErr, 'Buzl Member is denied direct transition to published');

  // TEST 8: Public Reader Zero Leakage Check
  console.log('\n[Test 8] Checking anonymous public reader for draft isolation...');
  const { data: publicDraft } = await anonClient.rpc('get_published_business_public', {
    requested_slug: businessRow.slug,
  });
  assert(!publicDraft || publicDraft.length === 0, 'Draft listing returns 0 rows to anonymous reader');

  // TEST 9: Duplicate Detection Check
  console.log('\n[Test 9] Testing duplicate detection across phone, domain, and legacy IDs...');
  const { data: dupPhone } = await adminClient
    .from('businesses')
    .select('id, canonical_name')
    .eq('primary_phone_normalized', '919789090902');
  assert(dupPhone.length >= 1, `Found duplicate match by primary_phone_normalized: ${dupPhone[0].canonical_name}`);

  const { data: dupBussId } = await adminClient
    .from('businesses')
    .select('id, canonical_name')
    .eq('source_buss_id', 'buss-94');
  assert(dupBussId.length >= 1, `Found duplicate match by source_buss_id: ${dupBussId[0].canonical_name}`);

  console.log('\n==================================================');
  console.log('🎉 ALL DAY 1.5 BUZL MEMBER IMPORT TESTS PASSED!');
  console.log('==================================================');
}

runTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
