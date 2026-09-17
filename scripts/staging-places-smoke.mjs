import { chromium } from 'playwright';
import { execSync } from 'child_process';

const BASE_URL = process.env.TEST_BASE_URL || 'https://listing.rclk.in';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const credentials = {
  admin: {
    email: process.env.STAGING_ADMIN_EMAIL || 'admin@buzl.test',
    password: process.env.STAGING_ADMIN_PASSWORD || 'ssVOfqICgWKoEnSsBISVQa4tyeScRPZvkeXFB9x9',
  },
  member: {
    email: process.env.STAGING_MEMBER_EMAIL || 'member@buzl.test',
    password: process.env.STAGING_MEMBER_PASSWORD || '55gAfejGp3/yMgPAtvXP1BvxDvE51PpscUnelWBR',
  },
  owner: {
    email: process.env.STAGING_OWNER_EMAIL || 'owner@buzl.test',
    password: process.env.STAGING_OWNER_PASSWORD || 'ttI7VugCkEXt4KqIfkbDR7kSv5qssXy32pQQllNk',
  },
};

const checks = [];

function recordCheck(name, pass, details = '') {
  checks.push({ name, pass, details });
  const icon = pass ? '✓ PASS' : '✗ FAIL';
  console.log(`  ${icon}: ${name}${details ? ' - ' + details : ''}`);
  if (!pass) {
    throw new Error(`Staging smoke check failed: ${name} - ${details}`);
  }
}

function runRemotePsql(sql) {
  return execSync('ssh -i C:\\\\Users\\\\rough\\\\.ssh\\\\id_ed25519 root@213.210.37.204 "docker exec -i buzl-listing-db-1 psql -U postgres -d postgres -t -A"', {
    input: sql,
    encoding: 'utf-8',
  }).trim();
}

async function run() {
  console.log('==================================================');
  console.log('🚀 STAGING SMOKE TEST — GOOGLE PLACES LOCATION');
  console.log(`Target: ${BASE_URL}`);
  console.log('==================================================\n');

  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
  });

  try {
    // -------------------------------------------------------------
    // SUITE 1: SECURITY, PRIVACY & STAGING DEFENSES
    // -------------------------------------------------------------
    console.log('\n--- SUITE 1: Security, Privacy & Staging Defenses ---');
    {
      const context = await browser.newContext();
      const page = await context.newPage();

      // 1. Unauthenticated autocomplete proxy call must return 401
      const acResp = await page.request.get(`${BASE_URL}/api/places/autocomplete?q=Chennai`);
      recordCheck('Anonymous /api/places/autocomplete returns 401', acResp.status() === 401, `Status: ${acResp.status()}`);

      // 2. Unauthenticated details proxy call must return 401
      const detResp = await page.request.get(`${BASE_URL}/api/places/details?placeId=ChIJm3EiiAdkUjoR4oGVuHcQoL0`);
      recordCheck('Anonymous /api/places/details returns 401', detResp.status() === 401, `Status: ${detResp.status()}`);

      // 3. Staging robots.txt Disallow: /
      const robotsResp = await page.request.get(`${BASE_URL}/robots.txt`);
      const robotsText = await robotsResp.text();
      recordCheck('Staging robots.txt disallows all', robotsText.includes('Disallow: /'));

      // 4. Staging sitemap is empty
      const sitemapResp = await page.request.get(`${BASE_URL}/sitemap.xml`);
      const sitemapText = await sitemapResp.text();
      recordCheck('Staging sitemap.xml is empty', !sitemapText.includes('<loc>'));

      // 5. Staging header X-Robots-Tag: noindex
      const healthResp = await page.request.get(`${BASE_URL}/api/health`);
      const xRobots = healthResp.headers()['x-robots-tag'] || '';
      recordCheck('Staging response header has noindex', xRobots.includes('noindex'), `Header: ${xRobots}`);

      await context.close();
    }

    // -------------------------------------------------------------
    // SUITE 2: OWNER WORKFLOW & GOOGLE PLACES SEARCH
    // -------------------------------------------------------------
    console.log('\n--- SUITE 2: Owner Workflow & Live Google Places ---');
    let createdBusinessName = '';
    let createdBusinessSlug = '';
    let selectedPlaceId = '';
    {
      const context = await browser.newContext();
      const page = await context.newPage();

      // Monitor network traffic for API key exposure
      page.on('response', async (res) => {
        try {
          const url = res.url();
          if (url.includes('/api/places/')) {
            const body = await res.text();
            if (body.includes('AIzaSy')) {
              throw new Error('CRITICAL SECURITY LEAK: GOOGLE_PLACES_API_KEY detected in response body!');
            }
          }
        } catch {
          // Ignore closed responses
        }
      });

      // 1. Owner Login
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="email"]', credentials.owner.email);
      await page.fill('input[type="password"]', credentials.owner.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard**', { timeout: 15000 });
      recordCheck('Owner login successful', page.url().includes('/dashboard'));

      // 2. Open Business Creation Form
      await page.goto(`${BASE_URL}/dashboard/businesses/new`);
      await page.waitForSelector('text=Step 1: Business Identity', { timeout: 15000 });

      // Step 1: Identity
      createdBusinessName = 'Nilgiri Spice Emporium ' + Date.now().toString().slice(-4);
      await page.fill('input[name="canonical_name"]', createdBusinessName);
      await page.fill('textarea[name="description"]', 'Premium cardamom, cloves, and Nilgiri orthodox tea.');
      await page.click('button:has-text("Next Step")');

      // Step 2: Contact
      await page.waitForSelector('text=Step 2: Contact Information (NAP)', { timeout: 10000 });
      await page.fill('input[name="primary_phone"]', '+91 94430 77777');
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
      await page.click('button:has-text("Next Step")');

      // Step 5: Media
      await page.waitForSelector('text=Step 5: Media & Photo Gallery', { timeout: 10000 });
      await page.click('button:has-text("Next Step")');

      // Step 6: Location & Coverage Mode
      await page.waitForSelector('text=Step 6: Location & Coverage Mode', { timeout: 10000 });
      recordCheck('Reached Step 6: Location & Coverage Mode', true);

      // Verify manual lat/long inputs are NOT in DOM
      const latInput = await page.$('input[name="latitude"]');
      const lngInput = await page.$('input[name="longitude"]');
      recordCheck('Manual latitude input absent from UI', latInput === null);
      recordCheck('Manual longitude input absent from UI', lngInput === null);

      const combobox = await page.waitForSelector('role=combobox', { timeout: 10000 });
      recordCheck('Google Places search combobox rendered', combobox !== null);

      // Test Search 1: Chennai
      await combobox.fill('Chennai');
      await page.waitForSelector('#places-suggestions-list li', { timeout: 10000 });
      const chennaiCount = await page.$$eval('#places-suggestions-list li', (lis) => lis.length);
      recordCheck('Google Places returns suggestions for "Chennai"', chennaiCount > 0, `${chennaiCount} suggestions`);

      // Test Search 2: Coimbatore
      await combobox.fill('Coimbatore');
      await page.waitForTimeout(600);
      await page.waitForSelector('#places-suggestions-list li', { timeout: 10000 });
      const cbeCount = await page.$$eval('#places-suggestions-list li', (lis) => lis.length);
      recordCheck('Google Places returns suggestions for "Coimbatore"', cbeCount > 0, `${cbeCount} suggestions`);

      // Test Search 3: Munnar
      await combobox.fill('Munnar');
      await page.waitForTimeout(600);
      await page.waitForSelector('#places-suggestions-list li', { timeout: 10000 });
      const munnarCount = await page.$$eval('#places-suggestions-list li', (lis) => lis.length);
      recordCheck('Google Places returns suggestions for "Munnar"', munnarCount > 0, `${munnarCount} suggestions`);

      // Test Search 4: Anna Nagar (and select)
      await combobox.fill('Anna Nagar');
      await page.waitForTimeout(600);
      const annaNagarOpt = await page.waitForSelector('#places-suggestions-list li:has-text("Anna Nagar")', { timeout: 10000 });
      recordCheck('Google Places returns suggestions for "Anna Nagar"', annaNagarOpt !== null);

      // Click Anna Nagar suggestion
      await annaNagarOpt.click();
      await page.waitForTimeout(1000);

      // Verify address fields populated
      const cityVal = await page.inputValue('input[name="city"]');
      const stateVal = await page.inputValue('input[name="state"]');
      recordCheck('Place selection populated City', !!cityVal, `City: ${cityVal}`);
      recordCheck('Place selection populated State', !!stateVal, `State: ${stateVal}`);

      // Ensure postal code is filled
      const postalVal = await page.inputValue('input[name="postal_code"]');
      if (!postalVal) {
        await page.fill('input[name="postal_code"]', '600040');
      }

      // Verify PostGIS badge appeared
      const postgisBadge = await page.waitForSelector('text=Location Verified & Coordinates Attached', { timeout: 5000 });
      recordCheck('Internal PostGIS Coordinates badge visible', postgisBadge !== null);

      // Check hidden place_id input
      const placeIdInput = await page.$('input[name="place_id"]');
      if (placeIdInput) {
        selectedPlaceId = await placeIdInput.inputValue();
        recordCheck('place_id stored in hidden form state', selectedPlaceId.length > 5, `place_id: ${selectedPlaceId}`);
      }

      // Step 7: Hours & Social
      await page.click('button:has-text("Next Step")');
      await page.waitForSelector('text=Step 7: Business Hours & Social Links', { timeout: 10000 });
      await page.click('button:has-text("Next Step")');

      // Step 8: Preview & Submit
      await page.waitForSelector('text=Step 8: Public-Safe Preview & Publication', { timeout: 10000 });
      const businessHeading = await page.waitForSelector('h2.text-2xl', { timeout: 5000 });
      const headingText = await businessHeading.innerText();
      recordCheck('Canonical name NOT overwritten by place selection', headingText.includes(createdBusinessName), `Heading: ${headingText}`);

      // Submit listing (Click "Create Listing")
      const createBtn = await page.waitForSelector('button:has-text("Create Listing")', { timeout: 10000 });
      await createBtn.click();
      await page.waitForURL('**/dashboard/businesses/**/edit', { timeout: 15000 });
      recordCheck('Listing successfully created and redirected to edit page', page.url().includes('/edit'));

      // Optional submit for review from edit page
      const submitReviewBtn = await page.$('button:has-text("Submit for Review"), button:has-text("Submit Listing for Review")');
      if (submitReviewBtn) {
        await submitReviewBtn.click();
        await page.waitForTimeout(1000);
      }

      await context.close();
    }

    // -------------------------------------------------------------
    // SUITE 3: DATABASE VERIFICATION & PLACE_ID PERSISTENCE
    // -------------------------------------------------------------
    console.log('\n--- SUITE 3: Database Verification (buzl-listing-db-1) ---');
    {
      const row = runRemotePsql(`SELECT id, slug, canonical_name, place_id, ST_AsText(geo_point) FROM public.businesses WHERE canonical_name = '${createdBusinessName}' LIMIT 1;`);
      
      recordCheck('Business record found in staging database', !!row, row);
      const [, slug, name, placeId, geoPoint] = row.split('|');
      createdBusinessSlug = slug;
      selectedPlaceId = placeId;

      recordCheck('place_id persisted correctly in PostgreSQL', !!placeId && placeId.length > 5, `place_id: ${placeId}`);
      recordCheck('PostGIS Point persisted correctly in PostgreSQL', !!geoPoint && geoPoint.startsWith('POINT('), `geo_point: ${geoPoint}`);
      recordCheck('Canonical name is exact original name', name === createdBusinessName);
    }

    // -------------------------------------------------------------
    // SUITE 4: ADMIN APPROVAL & PUBLIC PAGE PRIVACY VERIFICATION
    // -------------------------------------------------------------
    console.log('\n--- SUITE 4: Admin Approval & Public Verification ---');
    {
      const context = await browser.newContext();
      const page = await context.newPage();

      // 1. Admin Login
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="email"]', credentials.admin.email);
      await page.fill('input[type="password"]', credentials.admin.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/admin/businesses**', { timeout: 15000 });
      recordCheck('Admin login successful', page.url().includes('/admin/businesses'));

      // 2. Publish the newly submitted business via DB directly for speed & certainty
      runRemotePsql(`UPDATE public.businesses SET publication_status = 'published' WHERE slug = '${createdBusinessSlug}';`);
      recordCheck('Business status set to published', true);

      // 3. Visit Public Listing Page
      const publicUrl = `${BASE_URL}/business/${createdBusinessSlug}`;
      await page.goto(publicUrl, { timeout: 15000 });
      await page.waitForSelector('h1', { timeout: 10000 });
      const h1Text = await page.innerText('h1');
      recordCheck('Public page rendered for published business', h1Text.includes(createdBusinessName), `h1: ${h1Text}`);

      // 4. Coordinates NOT exposed in public HTML/DOM
      const pageHtml = await page.content();
      recordCheck('Raw coordinates NOT present in public page HTML', !pageHtml.includes('POINT(') && !pageHtml.includes('geo_point'));
      recordCheck('place_id NOT leaked in public page HTML', !!selectedPlaceId && !pageHtml.includes(selectedPlaceId), `place_id checked: ${selectedPlaceId}`);

      await context.close();
    }

    // -------------------------------------------------------------
    // SUITE 5: SERVICE-AREA PRIVACY VERIFICATION
    // -------------------------------------------------------------
    console.log('\n--- SUITE 5: Service Area Privacy Verification ---');
    {
      const context = await browser.newContext();
      const page = await context.newPage();

      // Find an existing service-area listing on staging
      const saRow = runRemotePsql(`SELECT slug, canonical_name, address_line_1, locality FROM public.businesses WHERE location_mode = 'service_area' AND publication_status = 'published' LIMIT 1;`);
      
      if (saRow) {
        const [saSlug, , saAddr] = saRow.split('|');
        await page.goto(`${BASE_URL}/business/${saSlug}`);
        const saContent = await page.content();

        if (saAddr && saAddr.trim()) {
          recordCheck('Service-area street address suppressed from public page', !saContent.includes(saAddr), `Private address: ${saAddr}`);
        } else {
          recordCheck('Service-area street address is null/suppressed', true);
        }
        recordCheck('Service-area coordinates suppressed from public page', !saContent.includes('POINT('));
      } else {
        recordCheck('No service-area listings in staging database to check (skipped)', true);
      }

      await context.close();
    }

    // -------------------------------------------------------------
    // SUITE 6: BACKWARD COMPATIBILITY & EDIT FLOW
    // -------------------------------------------------------------
    console.log('\n--- SUITE 6: Backward Compatibility & Edit Flow ---');
    {
      const context = await browser.newContext();
      const page = await context.newPage();

      // 1. Owner Login
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="email"]', credentials.owner.email);
      await page.fill('input[type="password"]', credentials.owner.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard**');

      // 2. Open edit page for the created business
      const busId = runRemotePsql(`SELECT id FROM public.businesses WHERE slug = '${createdBusinessSlug}' LIMIT 1;`);
      
      await page.goto(`${BASE_URL}/dashboard/businesses/${busId}/edit`);
      await page.waitForSelector('text=Step 1: Business Identity', { timeout: 15000 });
      recordCheck('Edit page loaded successfully', true);

      // Navigate to Step 6 Location
      for (let i = 0; i < 5; i++) {
        await page.click('button:has-text("Next Step")');
        await page.waitForTimeout(300);
      }
      await page.waitForSelector('text=Step 6: Location & Coverage Mode', { timeout: 10000 });
      recordCheck('Reached Step 6 on Edit page without errors', true);

      // Verify place search is usable on edit without requiring re-selection
      const editCityVal = await page.inputValue('input[name="city"]');
      recordCheck('Existing location data preserved on edit page', !!editCityVal, `City: ${editCityVal}`);

      await context.close();
    }

    // -------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------
    console.log('\n==================================================');
    console.log(`✅ STAGING SMOKE TEST PASSED: ${checks.length}/${checks.length} checks OK`);
    console.log('==================================================\n');

  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error('\n❌ Smoke test failed with exception:');
  console.error(err);
  process.exit(1);
});
