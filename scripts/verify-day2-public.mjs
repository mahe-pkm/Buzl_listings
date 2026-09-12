import { createClient } from '@supabase/supabase-js';
import { computeLiveHoursStatus } from '../src/lib/business-hours-utils.ts';

import fs from 'fs';
import path from 'path';

// Parse .env.local
const envContent = fs.readFileSync(path.resolve('.env.local'), 'utf-8');
const envVars = Object.fromEntries(
  envContent
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => {
      const idx = line.indexOf('=');
      return [line.slice(0, idx).trim(), line.slice(idx + 1).trim()];
    })
);

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || envVars.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Anonymous public client
const publicSupabase = createClient(SUPABASE_URL, ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

let passedChecks = 0;
let totalChecks = 0;

function assert(condition, message) {
  totalChecks++;
  if (condition) {
    console.log(`  ✓ ${message}`);
    passedChecks++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTests() {
  console.log('====================================================');
  console.log('DAY 2 — PUBLIC DIRECTORY & DISCOVERY VERIFICATION');
  console.log('====================================================\n');

  // ----------------------------------------------------
  // TEST 1: Public Business Detail & Strict Privacy
  // ----------------------------------------------------
  console.log('Test 1: Public Business Detail Projection & Zero Leaks');
  const { data: laptechDetail, error: laptechErr } = await publicSupabase.rpc(
    'get_published_business_by_slug',
    { p_slug: 'laptech' }
  );

  assert(!laptechErr, `get_published_business_by_slug RPC executed without error: ${laptechErr?.message || ''}`);
  assert(laptechDetail !== null, 'Found published "laptech" business');
  assert(laptechDetail.canonical_name === 'Laptech', `Canonical name matches "Laptech": got "${laptechDetail.canonical_name}"`);
  assert(laptechDetail.category_slug === 'retail-store', `Category slug is "retail-store": got "${laptechDetail.category_slug}"`);
  assert(laptechDetail.city === 'Chennai', `City is "Chennai": got "${laptechDetail.city}"`);
  assert(laptechDetail.location_mode === 'service_area', `Location mode is "service_area": got "${laptechDetail.location_mode}"`);

  // Privacy invariants: ZERO private address, postal code, or coordinates
  assert(laptechDetail.address_line_1 === null, 'Private address_line_1 is suppressed (null)');
  assert(laptechDetail.address_line_2 === null, 'Private address_line_2 is suppressed (null)');
  assert(laptechDetail.postal_code === null, 'Private postal_code is suppressed (null)');
  assert(laptechDetail.show_street_address === false, 'show_street_address is false');
  assert(!('geo_point' in laptechDetail), 'Coordinates (geo_point) are NOT present in public projection');
  assert(!('created_by' in laptechDetail), 'Internal user ID (created_by) is NOT present');
  assert(!('imported_by_member_id' in laptechDetail), 'Provenance member_id is NOT present');
  assert(!('source_place_id' in laptechDetail), 'Legacy source IDs are NOT present');

  // Related data
  assert(Array.isArray(laptechDetail.services) && laptechDetail.services.length >= 20, `Services array populated: ${laptechDetail.services.length} items`);
  assert(Array.isArray(laptechDetail.service_areas) && laptechDetail.service_areas.length >= 1, `Service areas array populated: ${laptechDetail.service_areas.length} items`);
  assert(Array.isArray(laptechDetail.hours) && laptechDetail.hours.length === 7, `Hours array populated with 7 days: ${laptechDetail.hours.length} items`);
  assert(laptechDetail.country_code === 'IN', `Country code is "IN": got "${laptechDetail.country_code}"`);
  console.log('✓ Test 1 passed\n');

  // ----------------------------------------------------
  // TEST 2: Draft / Unpublished Isolation (Must return NULL)
  // ----------------------------------------------------
  console.log('Test 2: Unpublished Business Isolation (Draft / Suspended)');
  const { data: draftDetail } = await publicSupabase.rpc('get_published_business_by_slug', {
    p_slug: 'smoke-test-store',
  });
  assert(draftDetail === null, 'Draft business returns NULL on public projection');

  const { data: suspendedDetail } = await publicSupabase.rpc('get_published_business_by_slug', {
    p_slug: 'prestige-dining-catering-2',
  });
  assert(suspendedDetail === null, 'Suspended business returns NULL on public projection');

  const { data: nonExistentDetail } = await publicSupabase.rpc('get_published_business_by_slug', {
    p_slug: 'non-existent-company-xyz',
  });
  assert(nonExistentDetail === null, 'Non-existent business returns NULL on public projection');
  console.log('✓ Test 2 passed\n');

  // ----------------------------------------------------
  // TEST 3: Search Functionality (Name, Service, Location)
  // ----------------------------------------------------
  console.log('Test 3: Search Functionality & Trigram / Full-Text Matching');
  const { data: searchName } = await publicSupabase.rpc('search_published_businesses', {
    p_query: 'Laptech',
  });
  assert(searchName && searchName.total_count >= 1, `Found listing searching by name "Laptech": ${searchName?.total_count} results`);
  assert(searchName.items.some((i) => i.slug === 'laptech'), 'Search results contain "laptech"');

  const { data: searchService } = await publicSupabase.rpc('search_published_businesses', {
    p_query: 'Replacement',
  });
  assert(searchService && searchService.total_count >= 1, `Found listing searching by service keyword "Replacement": ${searchService?.total_count} results`);

  const { data: searchLocation } = await publicSupabase.rpc('search_published_businesses', {
    p_query: 'Chennai',
  });
  assert(searchLocation && searchLocation.total_count >= 1, `Found listing searching by city "Chennai": ${searchLocation?.total_count} results`);

  const { data: searchDraft } = await publicSupabase.rpc('search_published_businesses', {
    p_query: 'Smoke Test Store',
  });
  assert(searchDraft && searchDraft.total_count === 0, 'Draft listings NEVER appear in search results (0 matches)');
  console.log('✓ Test 3 passed\n');

  // ----------------------------------------------------
  // TEST 4: Category Discovery
  // ----------------------------------------------------
  console.log('Test 4: Category Discovery');
  const { data: catResult } = await publicSupabase.rpc('get_published_businesses_by_category', {
    p_category_slug: 'retail-store',
  });
  assert(catResult !== null, 'Category discovery returned result for "retail-store"');
  assert(catResult.category.name === 'Retail Store', `Category name matches: ${catResult.category.name}`);
  assert(catResult.total_count >= 1, `Category has at least 1 listing: ${catResult.total_count}`);

  const { data: invalidCat } = await publicSupabase.rpc('get_published_businesses_by_category', {
    p_category_slug: 'fake-category-12345',
  });
  assert(invalidCat === null, 'Invalid category slug returns NULL');
  console.log('✓ Test 4 passed\n');

  // ----------------------------------------------------
  // TEST 5: Location Discovery
  // ----------------------------------------------------
  console.log('Test 5: Location Discovery');
  const { data: locResult } = await publicSupabase.rpc('get_published_businesses_by_location', {
    p_location_slug: 'chennai',
  });
  assert(locResult !== null, 'Location discovery returned result for "chennai"');
  assert(locResult.location.slug === 'chennai', `Location slug matches: ${locResult.location.slug}`);
  assert(locResult.total_count >= 1, `Location has at least 1 listing: ${locResult.total_count}`);

  const { data: invalidLoc } = await publicSupabase.rpc('get_published_businesses_by_location', {
    p_location_slug: 'atlantis-city',
  });
  assert(invalidLoc === null, 'Location with 0 listings returns NULL');
  console.log('✓ Test 5 passed\n');

  // ----------------------------------------------------
  // TEST 6: Combination Discovery & Constraint 2 (Indexable Gate)
  // ----------------------------------------------------
  console.log('Test 6: Combination Discovery & Constraint 2 (Indexable Approval Gate)');
  const { data: approvedCombo } = await publicSupabase.rpc('get_published_businesses_by_location_and_category', {
    p_location_slug: 'chennai',
    p_category_slug: 'retail-store',
  });
  assert(approvedCombo !== null, 'Found combination "chennai" + "retail-store"');
  assert(approvedCombo.is_indexable === true, 'Approved combination returns is_indexable = true');
  assert(approvedCombo.total_count >= 1, `Approved combination has listings: ${approvedCombo.total_count}`);

  // Test unapproved combination
  const { data: unapprovedCombo } = await publicSupabase.rpc('get_published_businesses_by_location_and_category', {
    p_location_slug: 'chennai',
    p_category_slug: 'clinic',
  });
  assert(unapprovedCombo !== null, 'Unapproved combination renders without crash');
  assert(unapprovedCombo.is_indexable === false, 'Unapproved combination strictly returns is_indexable = false (Constraint 2)');
  console.log('✓ Test 6 passed\n');

  // ----------------------------------------------------
  // TEST 7: Directory Home Data (Constraint 5: Recently Published)
  // ----------------------------------------------------
  console.log('Test 7: Directory Home Data & Constraint 5');
  const { data: homeData, error: homeErr } = await publicSupabase.rpc('get_directory_home_data');
  assert(!homeErr, `get_directory_home_data executed without error: ${homeErr?.message || ''}`);
  assert(Array.isArray(homeData.categories) && homeData.categories.length > 0, `Home categories populated: ${homeData.categories.length}`);
  assert(Array.isArray(homeData.locations) && homeData.locations.length > 0, `Home locations populated: ${homeData.locations.length}`);
  assert(Array.isArray(homeData.recent_businesses) && homeData.recent_businesses.length > 0, `Recently published businesses populated: ${homeData.recent_businesses.length}`);
  assert(homeData.recent_businesses.length <= 6, 'Recently published businesses capped at 6');
  assert(homeData.stats.total_businesses >= 1, `Total published count is accurate: ${homeData.stats.total_businesses}`);
  console.log('✓ Test 7 passed\n');

  // ----------------------------------------------------
  // TEST 8: Sitemap Entries & Approved Combinations
  // ----------------------------------------------------
  console.log('Test 8: Sitemap Entries');
  const { data: sitemapData, error: sitemapErr } = await publicSupabase.rpc('get_sitemap_entries');
  assert(!sitemapErr, `get_sitemap_entries executed without error: ${sitemapErr?.message || ''}`);
  assert(sitemapData.businesses.some((b) => b.slug === 'laptech'), 'Sitemap contains published business "laptech"');
  assert(!sitemapData.businesses.some((b) => b.slug === 'smoke-test-store'), 'Sitemap EXCLUDES draft businesses');
  assert(sitemapData.categories.length > 0, `Sitemap contains active categories: ${sitemapData.categories.length}`);
  assert(sitemapData.locations.length > 0, `Sitemap contains active locations: ${sitemapData.locations.length}`);
  assert(sitemapData.combinations.some((c) => c.location_slug === 'chennai' && c.category_slug === 'retail-store'), 'Sitemap includes approved combination "chennai/retail-store"');
  assert(!sitemapData.combinations.some((c) => c.location_slug === 'chennai' && c.category_slug === 'clinic'), 'Sitemap strictly EXCLUDES unapproved combinations');
  console.log('✓ Test 8 passed\n');

  // ----------------------------------------------------
  // TEST 9: Constraint 3: Timezone-Aware Live Hours
  // ----------------------------------------------------
  console.log('Test 9: Operating Hours Timezone Safety (Constraint 3)');
  const sampleHours = [
    { day_of_week: 0, opens_at: null, closes_at: null, is_closed: true, is_24_hours: false },
    { day_of_week: 1, opens_at: '09:00:00', closes_at: '18:00:00', is_closed: false, is_24_hours: false },
    { day_of_week: 2, opens_at: '09:00:00', closes_at: '18:00:00', is_closed: false, is_24_hours: false },
    { day_of_week: 3, opens_at: '09:00:00', closes_at: '18:00:00', is_closed: false, is_24_hours: false },
    { day_of_week: 4, opens_at: '09:00:00', closes_at: '18:00:00', is_closed: false, is_24_hours: false },
    { day_of_week: 5, opens_at: '09:00:00', closes_at: '18:00:00', is_closed: false, is_24_hours: false },
    { day_of_week: 6, opens_at: '10:00:00', closes_at: '16:00:00', is_closed: false, is_24_hours: false },
  ];

  // Case A: Valid trusted timezone (India)
  const indiaStatus = computeLiveHoursStatus(sampleHours, 'IN');
  assert(indiaStatus.hasTrustedTimezone === true, 'India country code resolves to trusted Asia/Kolkata timezone');
  assert(typeof indiaStatus.isOpen === 'boolean', `Computes boolean isOpen state: ${indiaStatus.isOpen}`);
  assert(indiaStatus.statusText === 'Open Now' || indiaStatus.statusText === 'Closed', `Computes truthful status text: ${indiaStatus.statusText}`);

  // Case B: Untrusted or unknown country code
  const untrustedStatus = computeLiveHoursStatus(sampleHours, 'XX');
  assert(untrustedStatus.hasTrustedTimezone === false, 'Untrusted country code correctly flags hasTrustedTimezone = false');
  assert(untrustedStatus.isOpen === null, 'Untrusted country code returns isOpen = null (Constraint 3: no live-status claims)');
  assert(untrustedStatus.statusText === null, 'Untrusted country code returns statusText = null');
  console.log('✓ Test 9 passed\n');

  console.log('====================================================');
  console.log(`ALL CHECKS PASSED: ${passedChecks}/${totalChecks} checks verified cleanly!`);
  console.log('====================================================');
}

runTests().catch((err) => {
  console.error('\nVerification failed with exception:', err);
  process.exit(1);
});
