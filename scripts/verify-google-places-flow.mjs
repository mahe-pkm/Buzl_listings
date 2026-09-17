import { createClient } from '@supabase/supabase-js';
import { loadLocalFixtureEnvironment } from './lib/local-fixture-env.mjs';
import { assertSafeMutationTarget } from './lib/mutation-safety.mjs';
import { MockPlacesProvider } from '../src/lib/places/mock-provider.ts';
import { GooglePlacesProvider } from '../src/lib/places/google-provider.ts';
import { normalizeGooglePlaceDetails } from '../src/lib/places/normalize.ts';

loadLocalFixtureEnvironment();

process.env.BUZL_MUTATION_ENV = process.env.BUZL_MUTATION_ENV || 'local';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

assertSafeMutationTarget(SUPABASE_URL, 'Google Places Location verification');

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`PASS: ${message}`);
}

async function main() {
  console.log('=== STARTING GOOGLE PLACES LOCATION FLOW VERIFICATION ===\n');

  // -------------------------------------------------------------
  // PART 1: Provider Abstraction & Mock Unit Verification
  // -------------------------------------------------------------
  console.log('--- 1. Testing MockPlacesProvider ---');
  const mockProvider = new MockPlacesProvider();
  assert(mockProvider.isAvailable() === true, 'MockPlacesProvider is available');

  const emptyRes = await mockProvider.autocomplete('a');
  assert(emptyRes.success && emptyRes.suggestions.length === 0, 'Query < 2 chars returns empty array');

  const chennaiRes = await mockProvider.autocomplete('anna nagar');
  assert(chennaiRes.success && chennaiRes.suggestions.length >= 1, 'Found Anna Nagar suggestion');
  const annaNagarSuggestion = chennaiRes.suggestions[0];
  assert(annaNagarSuggestion.place_id === 'mock_chennai_anna_nagar_001', 'Suggestion has correct place_id');

  const detailsRes = await mockProvider.getDetails('mock_chennai_anna_nagar_001');
  assert(detailsRes.success && detailsRes.details !== undefined, 'getDetails succeeded for valid place_id');
  const annaDetails = detailsRes.details;
  assert(annaDetails.city === 'Chennai', 'City is Chennai');
  assert(annaDetails.state === 'Tamil Nadu', 'State is Tamil Nadu');
  assert(annaDetails.country === 'India', 'Country is India');
  assert(annaDetails.postal_code === '600040', 'Postal code is 600040');
  assert(annaDetails.latitude === 13.0850, 'Latitude is 13.0850');
  assert(annaDetails.longitude === 80.2101, 'Longitude is 80.2101');

  const notFoundRes = await mockProvider.getDetails('non_existent_place_xyz');
  assert(!notFoundRes.success && notFoundRes.errorCode === 'NOT_FOUND', 'Non-existent place_id returns NOT_FOUND');

  // -------------------------------------------------------------
  // PART 2: GooglePlacesProvider Safety Verification
  // -------------------------------------------------------------
  console.log('\n--- 2. Testing GooglePlacesProvider Safety ---');
  const googleWithoutKey = new GooglePlacesProvider('');
  assert(googleWithoutKey.isAvailable() === false, 'GooglePlacesProvider without key reports isAvailable = false');
  const noKeyAuto = await googleWithoutKey.autocomplete('test');
  assert(!noKeyAuto.success && noKeyAuto.errorCode === 'NOT_CONFIGURED', 'Autocomplete without key returns NOT_CONFIGURED');
  const noKeyDetails = await googleWithoutKey.getDetails('ChIJ123');
  assert(!noKeyDetails.success && noKeyDetails.errorCode === 'NOT_CONFIGURED', 'getDetails without key returns NOT_CONFIGURED');

  // -------------------------------------------------------------
  // PART 3: Normalization Logic Verification
  // -------------------------------------------------------------
  console.log('\n--- 3. Testing Google Place Address Normalization ---');
  const sampleIndianPlace = {
    name: 'Apollo Pharmacy Anna Nagar',
    formatted_address: 'Door 12, 2nd Avenue, Anna Nagar West, Chennai, Tamil Nadu 600040, India',
    address_components: [
      { long_name: 'Door 12', short_name: 'Door 12', types: ['street_number'] },
      { long_name: '2nd Avenue', short_name: '2nd Ave', types: ['route'] },
      { long_name: 'Anna Nagar West', short_name: 'Anna Nagar West', types: ['sublocality_level_1', 'sublocality'] },
      { long_name: 'Chennai', short_name: 'Chennai', types: ['locality'] },
      { long_name: 'Chennai District', short_name: 'Chennai', types: ['administrative_area_level_2'] },
      { long_name: 'Tamil Nadu', short_name: 'TN', types: ['administrative_area_level_1'] },
      { long_name: 'India', short_name: 'IN', types: ['country'] },
      { long_name: '600040', short_name: '600040', types: ['postal_code'] },
    ],
    geometry: {
      location: { lat: 13.0850, lng: 80.2101 },
    },
  };

  const normalized = normalizeGooglePlaceDetails(sampleIndianPlace, 'ChIJ_test_apollo_001');
  assert(normalized !== null, 'Normalized details parsed successfully');
  assert(normalized.place_id === 'ChIJ_test_apollo_001', 'place_id preserved');
  assert(normalized.address_line_1 === 'Door 12 2nd Avenue', 'Street address combined accurately');
  assert(normalized.locality === 'Anna Nagar West', 'Locality extracted correctly');
  assert(normalized.city === 'Chennai', 'City extracted correctly');
  assert(normalized.state === 'Tamil Nadu', 'State extracted correctly');
  assert(normalized.postal_code === '600040', 'Postal code extracted correctly');
  assert(normalized.country_code === 'IN', 'Country code extracted correctly');
  assert(normalized.latitude === 13.0850, 'Latitude parsed');
  assert(normalized.longitude === 80.2101, 'Longitude parsed');

  // -------------------------------------------------------------
  // PART 4: Supabase Database, RPC, and RLS Verification
  // -------------------------------------------------------------
  console.log('\n--- 4. Testing Supabase RPC and place_id Persistence ---');
  const ownerClient = createClient(SUPABASE_URL, ANON_KEY);
  const ownerEmail = process.env.LOCAL_FIXTURE_OWNER_EMAIL;
  const ownerPassword = process.env.LOCAL_FIXTURE_OWNER_PASSWORD;

  const { data: ownerAuth, error: ownerLoginErr } = await ownerClient.auth.signInWithPassword({
    email: ownerEmail,
    password: ownerPassword,
  });

  if (ownerLoginErr || !ownerAuth.user) {
    throw new Error('Owner login failed: ' + (ownerLoginErr?.message || 'unknown'));
  }
  console.log('✓ Owner authenticated:', ownerAuth.user.email);

  // Fetch an active category
  const { data: categories } = await ownerClient
    .from('categories')
    .select('id, name')
    .eq('active', true)
    .order('sort_order', { ascending: true })
    .limit(1);

  assert(categories && categories.length > 0, 'Fetched active category for tests');
  const categoryId = categories[0].id;

  // 4a. Create Storefront Business with place_id via RPC
  const testPlaceId = 'mock_chennai_anna_nagar_001';
  const { data: bizId, error: createErr } = await ownerClient.rpc('create_business_for_current_user', {
    p_canonical_name: 'Buzl Places Test Storefront',
    p_primary_phone: '+91 98840 12345',
    p_primary_category_id: categoryId,
    p_location_mode: 'storefront',
    p_city: 'Chennai',
    p_state: 'Tamil Nadu',
    p_country: 'India',
    p_country_code: 'IN',
    p_address_line_1: '2nd Avenue',
    p_address_line_2: 'Suite 101',
    p_locality: 'Anna Nagar West',
    p_postal_code: '600040',
    p_show_street_address: true,
    p_latitude: 13.0850,
    p_longitude: 80.2101,
    p_place_id: testPlaceId,
  });

  assert(!createErr && Boolean(bizId), 'Created business with place_id via RPC');

  // Verify record in businesses table
  const { data: createdBiz, error: fetchErr } = await ownerClient
    .from('businesses')
    .select('id, canonical_name, place_id, city, state, postal_code, location_mode')
    .eq('id', bizId)
    .single();

  assert(!fetchErr && createdBiz, 'Fetched created business record');
  assert(createdBiz.place_id === testPlaceId, 'place_id correctly persisted in database table');
  assert(createdBiz.city === 'Chennai', 'City is Chennai');

  // 4b. Update place_id via authenticated update
  const updatedPlaceId = 'mock_chennai_tnagar_002';
  const { error: updateErr } = await ownerClient
    .from('businesses')
    .update({
      place_id: updatedPlaceId,
      address_line_1: '45 Usman Road',
      locality: 'T. Nagar',
      postal_code: '600017',
    })
    .eq('id', bizId);

  assert(!updateErr, 'Updated place_id and address on owned business');

  const { data: updatedBiz } = await ownerClient
    .from('businesses')
    .select('place_id, locality, postal_code')
    .eq('id', bizId)
    .single();

  assert(updatedBiz.place_id === updatedPlaceId, 'Updated place_id persisted correctly');
  assert(updatedBiz.locality === 'T. Nagar', 'Updated locality persisted correctly');

  // 4c. Legacy listing compatibility (listing without place_id)
  const { data: legacyBizId, error: legacyErr } = await ownerClient.rpc('create_business_for_current_user', {
    p_canonical_name: 'Buzl Legacy Listing Without PlaceId',
    p_primary_phone: '+91 98840 99999',
    p_primary_category_id: categoryId,
    p_location_mode: 'storefront',
    p_city: 'Chennai',
    p_state: 'Tamil Nadu',
    p_country: 'India',
    p_country_code: 'IN',
    p_address_line_1: 'Old Traditional Street',
    p_locality: 'Mylapore',
    p_postal_code: '600004',
    p_show_street_address: true,
    p_latitude: 13.0336,
    p_longitude: 80.2687,
    p_place_id: null, // Legacy: no place_id
  });

  assert(!legacyErr && Boolean(legacyBizId), 'Created legacy listing without place_id');

  const { data: legacyBiz } = await ownerClient
    .from('businesses')
    .select('id, place_id, locality')
    .eq('id', legacyBizId)
    .single();

  assert(legacyBiz.place_id === null, 'Legacy listing has place_id = null and is valid');

  // Clean up test businesses
  await ownerClient.from('businesses').delete().eq('id', bizId);
  await ownerClient.from('businesses').delete().eq('id', legacyBizId);
  console.log('✓ Cleaned up test business records');

  console.log('\n=== ALL GOOGLE PLACES LOCATION VERIFICATIONS PASSED 100% ===');
}

main().catch((err) => {
  console.error('VERIFICATION FAILED:', err);
  process.exit(1);
});
