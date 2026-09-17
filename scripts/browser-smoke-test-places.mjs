import { chromium } from 'playwright';
import { loadLocalFixtureEnvironment } from './lib/local-fixture-env.mjs';
import { assertSafeMutationTarget } from './lib/mutation-safety.mjs';
import { createClient } from '@supabase/supabase-js';

loadLocalFixtureEnvironment();

process.env.BUZL_MUTATION_ENV = process.env.BUZL_MUTATION_ENV || 'local';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3005';
assertSafeMutationTarget(BASE_URL, 'browser smoke test');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(message);
  }
  console.log(`  ✓ ${message}`);
}

async function main() {
  console.log('==================================================');
  console.log('🚀 STARTING BROWSER SMOKE TEST: GOOGLE PLACES LOCATION');
  console.log(`Base URL: ${BASE_URL}`);
  console.log('==================================================');

  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });

  const page = await context.newPage();
  page.on('console', (msg) => {
    if (msg.type() === 'error') console.log('BROWSER CONSOLE ERROR:', msg.text());
  });
  page.on('pageerror', (err) => console.error('BROWSER UNCAUGHT ERROR:', err.message));
  let createdBusinessId = null;

  try {
    // 1. Log in as owner
    console.log('\n➡️ 1. Logging in as owner...');
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', process.env.LOCAL_FIXTURE_OWNER_EMAIL);
    await page.fill('input[type="password"]', process.env.LOCAL_FIXTURE_OWNER_PASSWORD);
    await page.click('button[type="submit"]');

    await page.waitForURL('**/dashboard**', { timeout: 15000 });
    assert(page.url().includes('/dashboard'), 'Owner logged in and reached /dashboard');

    // 2. Navigate to create business
    console.log('\n➡️ 2. Navigating to Create Business form...');
    await page.goto(`${BASE_URL}/dashboard/businesses/new`);
    await page.waitForSelector('text=Step 1: Business Identity', { timeout: 15000 });
    assert(true, 'Reached BusinessForm Step 1: Business Identity');

    // Step 1: Identity
    const testBusinessName = 'Kaveri Organic Foods ' + Date.now().toString().slice(-4);
    await page.fill('input[name="canonical_name"]', testBusinessName);
    await page.fill('textarea[name="description"]', 'Organic grains, cold-pressed oils, and farm-fresh spices.');
    await page.click('button:has-text("Next Step")');

    // Step 2: Contact
    await page.waitForSelector('text=Step 2: Contact Information (NAP)', { timeout: 10000 });
    await page.fill('input[name="primary_phone"]', '+91 98840 88888');
    await page.click('button:has-text("Next Step")');

    // Step 3: Category & Services
    await page.waitForSelector('text=Step 3: Primary Category & Services', { timeout: 10000 });
    await page.waitForSelector('#primary_category_id');
    const catOptions = await page.$$eval('#primary_category_id option', (opts) =>
      opts.map((o) => o.value).filter(Boolean)
    );
    if (catOptions.length > 0) {
      await page.selectOption('#primary_category_id', catOptions[0]);
    }
    await page.waitForTimeout(300);
    await page.click('button:has-text("Next Step")');

    // Step 4: Products
    await page.waitForSelector('text=Step 4: Products & Offerings', { timeout: 10000 });
    await page.waitForTimeout(300);
    await page.click('button:has-text("Next Step")');

    // Step 5: Media & Gallery
    await page.waitForSelector('text=Step 5: Media & Photo Gallery', { timeout: 10000 });
    await page.click('button:has-text("Next Step")');

    // Step 6: Location & Coverage Mode
    console.log('\n➡️ 3. Testing Step 6 Location & Google Places UX...');
    await page.waitForSelector('text=Step 6: Location & Coverage Mode', { timeout: 10000 });

    // Verify manual lat/long inputs are NOT present in the DOM
    const manualLatInput = await page.$('input[name="latitude"]');
    const manualLngInput = await page.$('input[name="longitude"]');
    assert(manualLatInput === null, 'Manual latitude input is removed from normal UI');
    assert(manualLngInput === null, 'Manual longitude input is removed from normal UI');

    // Verify Google Places search input is present
    const placesSearchInput = await page.waitForSelector('role=combobox');
    assert(placesSearchInput !== null, 'Google Places combobox is rendered');

    // Type query into search combobox
    await placesSearchInput.fill('Anna Nagar');
    console.log('  Typed "Anna Nagar" into Google Places search...');

    // Wait for autocomplete suggestions listbox
    const suggestionsList = await page.waitForSelector('#places-suggestions-list', { timeout: 5000 });
    assert(suggestionsList !== null, 'Suggestions dropdown rendered');

    // Select the Anna Nagar West suggestion
    const annaNagarOption = await page.waitForSelector('li:has-text("Anna Nagar West")', { timeout: 5000 });
    assert(annaNagarOption !== null, 'Anna Nagar West suggestion option is available');
    await annaNagarOption.click();

    // Verify auto-fill of address fields
    await page.waitForSelector('text=Location Verified & Coordinates Attached', { timeout: 5000 });
    assert(true, 'Location Verified banner displayed');

    const addr1Val = await page.inputValue('input[name="address_line_1"]');
    const localityVal = await page.inputValue('input[name="locality"]');
    const cityVal = await page.inputValue('input[name="city"]');
    const stateVal = await page.inputValue('input[name="state"]');
    const postalVal = await page.inputValue('input[name="postal_code"]');

    assert(addr1Val.includes('2nd Avenue'), `Address line 1 auto-filled: "${addr1Val}"`);
    assert(localityVal === 'Anna Nagar West', `Locality auto-filled: "${localityVal}"`);
    assert(cityVal === 'Chennai', `City auto-filled: "${cityVal}"`);
    assert(stateVal === 'Tamil Nadu', `State auto-filled: "${stateVal}"`);
    assert(postalVal === '600040', `Postal code auto-filled: "${postalVal}"`);

    // Verify PostGIS ready coordinates badge
    const postGisBadge = await page.waitForSelector('text=PostGIS Ready');
    assert(postGisBadge !== null, 'PostGIS Ready coordinates badge is visible');

    // Click Next Step
    await page.click('button:has-text("Next Step")');

    // Step 7: Hours & Social
    await page.waitForSelector('text=Step 7: Business Hours & Social Links', { timeout: 10000 });
    await page.click('button:has-text("Next Step")');

    // Step 8: Preview & Submit
    console.log('\n➡️ 4. Testing Step 8 Preview and Canonical Name Safety...');
    await page.waitForSelector('text=Step 8: Public-Safe Preview & Publication', { timeout: 10000 });

    const businessHeading = await page.textContent('h2.text-2xl');
    assert(businessHeading?.includes(testBusinessName), `Canonical name protected: "${businessHeading}"`);

    // Click Create Listing
    console.log('\n➡️ 5. Submitting listing creation...');
    await page.click('button:has-text("Create Listing")');

    // Wait for redirect to edit page /dashboard/businesses/[id]/edit
    await page.waitForURL('**/dashboard/businesses/**/edit', { timeout: 15000 });
    assert(page.url().includes('/edit'), 'Successfully created and redirected to business edit page');

    // Extract business ID from URL
    const urlParts = page.url().split('/');
    const editIdx = urlParts.indexOf('edit');
    createdBusinessId = urlParts[editIdx - 1];
    console.log(`  Created business ID: ${createdBusinessId}`);

    // 6. Verify in Database
    console.log('\n➡️ 6. Verifying persisted place_id and coordinates in PostgreSQL...');
    const ownerClient = createClient(SUPABASE_URL, ANON_KEY);
    await ownerClient.auth.signInWithPassword({
      email: process.env.LOCAL_FIXTURE_OWNER_EMAIL,
      password: process.env.LOCAL_FIXTURE_OWNER_PASSWORD,
    });

    const { data: dbBiz } = await ownerClient
      .from('businesses')
      .select('id, canonical_name, place_id, city, locality, postal_code')
      .eq('id', createdBusinessId)
      .single();

    assert(dbBiz !== null, 'Found business in database');
    assert(dbBiz.place_id === 'mock_chennai_anna_nagar_001', `place_id persisted correctly: ${dbBiz.place_id}`);
    assert(dbBiz.locality === 'Anna Nagar West', 'Locality persisted');
    assert(dbBiz.postal_code === '600040', 'Postal code persisted');

    // 7. Verify Edit Page UX (Pre-populated flow)
    console.log('\n➡️ 7. Testing Edit Business Page UX...');
    await page.waitForSelector(`text=Edit: ${testBusinessName}`);

    // Navigate to Step 6
    for (let i = 0; i < 5; i++) {
      await page.click('button:has-text("Next Step")');
    }

    await page.waitForSelector('text=Step 6: Location & Coverage Mode');
    const editVerifiedBanner = await page.waitForSelector('text=Location Verified & Coordinates Attached');
    assert(editVerifiedBanner !== null, 'Existing business renders verified location banner on edit');

    const editPlaceIdText = await page.textContent('p:has-text("Place ID:")');
    assert(editPlaceIdText?.includes('mock_chennai_anna_nagar_001'), `Edit page displays Place ID: ${editPlaceIdText}`);

    console.log('\n==================================================');
    console.log('🎉 ALL BROWSER SMOKE CHECKS PASSED 100%!');
    console.log('==================================================');
  } catch (err) {
    const text = await page.textContent('body');
    console.error('PAGE BODY AT FAILURE:\n', text?.slice(0, 800));
    throw err;
  } finally {
    if (createdBusinessId) {
      const cleanupClient = createClient(SUPABASE_URL, ANON_KEY);
      await cleanupClient.auth.signInWithPassword({
        email: process.env.LOCAL_FIXTURE_OWNER_EMAIL,
        password: process.env.LOCAL_FIXTURE_OWNER_PASSWORD,
      });
      await cleanupClient.from('businesses').delete().eq('id', createdBusinessId);
      console.log(`✓ Cleaned up test business ID: ${createdBusinessId}`);
    }
    await context.close();
    await browser.close();
  }
}

main().catch((err) => {
  console.error('BROWSER SMOKE TEST FAILED:', err);
  process.exit(1);
});
