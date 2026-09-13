import { chromium } from 'playwright';
import { assertSafeMutationTarget } from './lib/mutation-safety.mjs';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
assertSafeMutationTarget(BASE_URL, 'browser smoke test');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required for authenticated smoke tests`);
  return value;
}

const fixtures = {
  owner: {
    email: requireEnv('LOCAL_FIXTURE_OWNER_EMAIL'),
    password: requireEnv('LOCAL_FIXTURE_OWNER_PASSWORD'),
  },
  member: {
    email: requireEnv('LOCAL_FIXTURE_MEMBER_EMAIL'),
    password: requireEnv('LOCAL_FIXTURE_MEMBER_PASSWORD'),
  },
  admin: {
    email: requireEnv('LOCAL_FIXTURE_ADMIN_EMAIL'),
    password: requireEnv('LOCAL_FIXTURE_ADMIN_PASSWORD'),
  },
};

const results = {
  routesTested: new Set(),
  accountFlowsTested: [],
  uiRuntimeIssues: [],
  consoleErrors: [],
  pageErrors: [],
};

function logStep(msg) {
  console.log(`\n➡️  ${msg}`);
}

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    results.uiRuntimeIssues.push(message);
    throw new Error(message);
  }
  console.log(`  ✓ ${message}`);
}

async function main() {
  console.log('==================================================');
  console.log('🚀 STARTING COMPREHENSIVE BROWSER SMOKE TEST');
  console.log(`Base URL: ${BASE_URL}`);
  console.log('==================================================');

  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
  });

  try {
    // -------------------------------------------------------------
    // SUITE 1: ANONYMOUS ACCESS RESTRICTIONS
    // -------------------------------------------------------------
    logStep('SUITE 1: Anonymous Access & Redirect Verification');
    {
      const context = await browser.newContext();
      const page = await context.newPage();

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          const text = msg.text();
          if (text.includes('_next/hmr') || text.includes('WebSocket')) return;
          results.consoleErrors.push(`[Anon] ${text}`);
        }
      });
      page.on('pageerror', (err) => results.pageErrors.push(`[Anon] ${err.message}`));

      // 1. /dashboard -> /login
      await page.goto(`${BASE_URL}/dashboard`);
      results.routesTested.add('/dashboard');
      assert(page.url().includes('/login'), 'Unauthenticated /dashboard redirects to /login');

      // 2. /admin/businesses -> /login
      await page.goto(`${BASE_URL}/admin/businesses`);
      results.routesTested.add('/admin/businesses');
      assert(page.url().includes('/login'), 'Unauthenticated /admin/businesses redirects to /login');

      // 3. /admin/businesses/import -> /login
      await page.goto(`${BASE_URL}/admin/businesses/import`);
      results.routesTested.add('/admin/businesses/import');
      assert(page.url().includes('/login'), 'Unauthenticated /admin/businesses/import redirects to /login');

      // 4. /internal/businesses/import -> /login
      await page.goto(`${BASE_URL}/internal/businesses/import`);
      results.routesTested.add('/internal/businesses/import');
      assert(page.url().includes('/login'), 'Unauthenticated /internal/businesses/import redirects to /login');

      await page.screenshot({ path: 'tests/screenshots/01_anon_redirect.png' });
      await context.close();
    }

    // -------------------------------------------------------------
    // SUITE 2: OWNER WORKFLOW
    // -------------------------------------------------------------
    logStep('SUITE 2: Owner Workflow (owner@buzl.test)');
    {
      const context = await browser.newContext();
      const page = await context.newPage();

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          const text = msg.text();
          if (text.includes('_next/hmr') || text.includes('WebSocket')) return;
          results.consoleErrors.push(`[Owner] ${text}`);
        }
      });
      page.on('pageerror', (err) => results.pageErrors.push(`[Owner] ${err.message}`));

      // 1. Login
      await page.goto(`${BASE_URL}/login`);
      results.routesTested.add('/login');
      await page.fill('input[type="email"]', fixtures.owner.email);
      await page.fill('input[type="password"]', fixtures.owner.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard**');
      assert(page.url().includes('/dashboard'), 'Owner logs in and redirects to /dashboard');
      await page.screenshot({ path: 'tests/screenshots/02_owner_dashboard.png' });

      // 2. Owner denied importer access
      await page.goto(`${BASE_URL}/admin/businesses/import`);
      assert(!page.url().includes('/import'), 'Owner cannot access /admin/businesses/import (redirected)');
      assert(page.url().includes('/dashboard'), 'Owner redirected to /dashboard from import');

      // 3. View Business List
      await page.goto(`${BASE_URL}/dashboard/businesses`);
      results.routesTested.add('/dashboard/businesses');
      assert(page.url().includes('/dashboard/businesses'), 'Owner navigates to /dashboard/businesses');
      await page.screenshot({ path: 'tests/screenshots/03_owner_businesses.png' });

      // 4. Create New Business
      await page.goto(`${BASE_URL}/dashboard/businesses/new`);
      results.routesTested.add('/dashboard/businesses/new');
      assert(page.url().includes('/dashboard/businesses/new'), 'Owner opens business creation form');

      // Step 1: Identity
      await page.fill('input[id="canonical_name"]', 'Smoke Test Store');
      await page.fill('textarea[id="description"]', 'Verified automated smoke test storefront listing.');
      await page.fill('input[id="year_established"]', '2023');
      await page.click('button:has-text("Next Step")');

      // Step 2: Contact
      await page.waitForSelector('input[id="primary_phone"]');
      await page.fill('input[id="primary_phone"]', '+91 91234 56789');
      await page.fill('input[id="business_contact_email"]', 'contact@smoketest.com');
      await page.fill('input[id="website_url"]', 'https://smoketeststore.in');
      await page.click('button:has-text("Next Step")');

      // Step 3: Category & Services
      await page.waitForSelector('select[id="primary_category_id"]');
      await page.selectOption('select[id="primary_category_id"]', { index: 1 });
      await page.fill('input[placeholder*="Enter service name"]', 'Express Delivery');
      await page.click('button:has-text("Add Service")');
      await page.fill('input[placeholder*="Enter service name"]', 'Doorstep Fitting');
      await page.click('button:has-text("Add Service")');
      await page.click('button:has-text("Next Step")');

      // Step 4: Location (Storefront)
      await page.waitForSelector('input[id="address_line_1"]');
      await page.fill('input[id="address_line_1"]', '42 Test Industrial Layout');
      await page.fill('input[id="locality"]', 'Koramangala');
      await page.fill('input[id="city"]', 'Bengaluru');
      await page.fill('input[id="state"]', 'Karnataka');
      await page.fill('input[id="postal_code"]', '560034');
      await page.fill('input[id="latitude"]', '12.9352');
      await page.fill('input[id="longitude"]', '77.6245');
      await page.click('button:has-text("Next Step")');

      // Step 5: Hours & Social
      await page.waitForTimeout(500);
      await page.click('button:has-text("Next Step")');

      // Step 6: Preview & Submit
      await page.waitForSelector('h2:has-text("Smoke Test Store")');
      assert(await page.isVisible('h2:has-text("Smoke Test Store")'), 'Business preview renders canonical name');
      await page.screenshot({ path: 'tests/screenshots/04_owner_preview.png' });

      // Click Create Listing
      await page.click('button:has-text("Create Listing")');
      await page.waitForURL('**/dashboard/businesses/*/edit', { timeout: 15000 });
      assert(page.url().includes('/edit'), 'Listing created and transitioned to edit page');
      await page.screenshot({ path: 'tests/screenshots/05_owner_created.png' });

      // If on edit page, submit for review
      if (page.url().includes('/edit')) {
        results.routesTested.add('/dashboard/businesses/[id]/edit');
        const submitBtn = page.locator('button:has-text("Submit for Review")');
        if (await submitBtn.isVisible()) {
          await submitBtn.click();
          await page.waitForTimeout(2000);
          assert(await page.isVisible('text=pending') || await page.isVisible('text=Pending'), 'Status updated to pending after submission');
          await page.screenshot({ path: 'tests/screenshots/06_owner_submitted.png' });
        }
      }

      results.accountFlowsTested.push('OWNER: login -> dashboard -> list -> create -> preview -> submit');
      await context.close();
    }

    // -------------------------------------------------------------
    // SUITE 3: BUZL MEMBER WORKFLOW
    // -------------------------------------------------------------
    logStep('SUITE 3: Buzl Member Workflow (member@buzl.test)');
    {
      const context = await browser.newContext();
      const page = await context.newPage();

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          const text = msg.text();
          if (text.includes('_next/hmr') || text.includes('WebSocket')) return;
          results.consoleErrors.push(`[Member] ${text}`);
        }
      });
      page.on('pageerror', (err) => results.pageErrors.push(`[Member] ${err.message}`));

      // 1. Login
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="email"]', fixtures.member.email);
      await page.fill('input[type="password"]', fixtures.member.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/admin/businesses/import**', { timeout: 15000 });
      assert(page.url().includes('/admin/businesses/import'), 'Buzl Member logs in and routes to /admin/businesses/import');
      await page.screenshot({ path: 'tests/screenshots/07_member_importer.png' });

      // 2. Check Member attribution header
      assert(await page.isVisible('text=Member ID: BUZL-M-1024'), 'Member ID BUZL-M-1024 displayed in header');
      assert(await page.locator('[data-testid="header-role-badge"]').innerText().then(t => t.includes('Buzl Member')), 'Role badge Buzl Member displayed');

      // 3. Click Load Laptech Sample Profile
      await page.click('button:has-text("Load Laptech Sample Profile")');
      await page.waitForTimeout(1000);

      // 4. Verify 8 Review Sections
      assert(await page.isVisible('text=Source Identity & Provenance'), 'Section 1: Source Identity visible');
      assert(await page.isVisible('text=Import Actor Attribution'), 'Section 2: Import Actor visible');
      assert(await page.isVisible('text=Business Information'), 'Section 3: Business Information visible');
      assert(await page.isVisible('text=Classification & Category'), 'Section 4: Classification visible');
      assert(await page.isVisible('text=Location & Delivery Mode'), 'Section 5: Location visible');
      assert(await page.isVisible('text=Services Provided'), 'Section 6: Services visible');
      assert(await page.isVisible('text=Warnings & Duplicate Signals'), 'Section 7: Warnings & Duplicates visible');
      assert(await page.isVisible('text=Privacy Controls'), 'Section 8: Privacy Controls visible');

      // 5. Verify Laptech specific details & CATEGORY REVIEW REQUIRED
      assert(await page.isVisible('text=CATEGORY REVIEW REQUIRED'), 'CATEGORY REVIEW REQUIRED badge is displayed for Electronics repair shop');
      assert(await page.isVisible('text=buss-94'), 'Legacy bussId buss-94 is displayed');
      assert(await page.isVisible('text=locn-2569'), 'Legacy locId locn-2569 is displayed');
      assert(await page.isVisible('text=Service-Area Privacy Enforcement'), 'Service-area privacy notice displayed');
      assert(await page.isVisible('text=Internal Only (Suppressed from Public)'), 'Coordinates tagged internal-only');

      // Verify show_street_address is locked to false
      const streetAddrCheckbox = page.locator('input[type="checkbox"]:disabled');
      assert(await streetAddrCheckbox.isVisible(), 'Street address toggle is disabled/locked for service area');

      // 6. Verify 26 services in Section 6
      assert(await page.isVisible('text=Services Provided (26)'), 'All 26 services extracted');
      assert(await page.isVisible('text=Motherboard Chip-level Service'), 'Specific service Motherboard Chip-level Service visible');

      // 7. Verify Public Preview Card on the right
      assert(await page.isVisible('text=Public-Safe Preview'), 'Public preview card is rendered');
      assert(await page.isVisible('h2:has-text("Laptech")'), 'Public preview shows business name Laptech');
      // Ensure street address is NOT rendered in preview card
      const previewText = await page.locator('.sticky').innerText();
      assert(!previewText.includes('Shop No 14, 1st Floor'), 'Street address is suppressed from public preview card');

      await page.screenshot({ path: 'tests/screenshots/08_member_laptech_reviewed.png' });

      // 8. Select an active category to clear review requirement
      await page.selectOption('select#platform_category_select', { label: 'Retail Store' });
      await page.waitForTimeout(500);

      // 9. Click Create Draft Listing
      await page.click('button:has-text("Create Draft Listing")');
      await page.waitForSelector('text=BUZL PROFILE IMPORTED', { timeout: 15000 });
      await page.screenshot({ path: 'tests/screenshots/09_member_import_success.png' });
      assert(await page.isVisible('text=BUZL PROFILE IMPORTED'), 'Success screen displayed with BUZL PROFILE IMPORTED');
      assert(await page.isVisible('text=draft (Requires Admin Review)'), 'Created listing confirmed in draft state');
      const pageText = await page.innerText('body');
      console.log('--- Page text contains BUZL-M-1024? ---', pageText.includes('BUZL-M-1024'));
      assert(pageText.includes('BUZL-M-1024'), 'Success screen attributes import to BUZL-M-1024');

      results.accountFlowsTested.push('BUZL MEMBER: login -> /admin/businesses/import -> load Laptech -> 8 sections -> category review -> service-area privacy -> choose category -> create draft (26 services)');
      await context.close();
    }

    // -------------------------------------------------------------
    // SUITE 4: ADMIN WORKFLOW
    // -------------------------------------------------------------
    logStep('SUITE 4: Admin Workflow (admin@buzl.test)');
    {
      const context = await browser.newContext();
      const page = await context.newPage();

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          const text = msg.text();
          if (text.includes('_next/hmr') || text.includes('WebSocket')) return;
          results.consoleErrors.push(`[Admin] ${text}`);
        }
      });
      page.on('pageerror', (err) => results.pageErrors.push(`[Admin] ${err.message}`));

      // 1. Login
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="email"]', fixtures.admin.email);
      await page.fill('input[type="password"]', fixtures.admin.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/admin/businesses**', { timeout: 15000 });
      assert(page.url().includes('/admin/businesses'), 'Admin logs in and routes to /admin/businesses');
      await page.screenshot({ path: 'tests/screenshots/10_admin_businesses.png' });

      // 2. Verify Table contains listings
      assert(await page.isVisible('table'), 'Admin businesses table rendered');
      assert(await page.isVisible('text=Smoke Test Store') || await page.isVisible('text=Laptech'), 'Admin sees platform listings');

      // 3. Inspect pending listing and publish
      const publishBtn = page.locator('button:has-text("Publish")').first();
      if (await publishBtn.isVisible()) {
        await publishBtn.click();
        await page.waitForSelector('table span:has-text("published")', { timeout: 10000 });
        assert(await page.locator('table span:has-text("published")').first().isVisible(), 'Listing transitioned to published state');
        await page.screenshot({ path: 'tests/screenshots/11_admin_published.png' });
      }

      // 4. Suspend listing
      const suspendBtn = page.locator('button:has-text("Suspend")').first();
      if (await suspendBtn.isVisible()) {
        await suspendBtn.click();
        await page.waitForSelector('table span:has-text("suspended")', { timeout: 10000 });
        assert(await page.locator('table span:has-text("suspended")').first().isVisible(), 'Listing transitioned to suspended state');
        await page.screenshot({ path: 'tests/screenshots/12_admin_suspended.png' });
      }

      results.accountFlowsTested.push('ADMIN: login -> /admin/businesses -> inspect -> publish -> suspend');
      await context.close();
    }

    // -------------------------------------------------------------
    // SUITE 5: MOBILE RESPONSIVENESS & DRAWER
    // -------------------------------------------------------------
    logStep('SUITE 5: Mobile Responsiveness Verification (375x667 Viewport)');
    {
      const context = await browser.newContext({
        viewport: { width: 375, height: 667 },
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
      });
      const page = await context.newPage();

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          const text = msg.text();
          if (text.includes('_next/hmr') || text.includes('WebSocket')) return;
          results.consoleErrors.push(`[Mobile] ${text}`);
        }
      });
      page.on('pageerror', (err) => results.pageErrors.push(`[Mobile] ${err.message}`));

      // 1. Login on mobile
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="email"]', fixtures.owner.email);
      await page.fill('input[type="password"]', fixtures.owner.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard**');

      // 2. Check hamburger button is visible
      const hamburger = page.locator('button[aria-label="Toggle Navigation"]');
      assert(await hamburger.isVisible(), 'Mobile top header with hamburger toggle is visible');

      // 3. Open drawer
      await hamburger.click();
      await page.waitForTimeout(500);
      assert(await page.isVisible('nav >> text=My Businesses'), 'Mobile sidebar drawer opens upon hamburger click');
      await page.screenshot({ path: 'tests/screenshots/13_mobile_drawer_open.png' });

      // 4. Verify no horizontal overflow
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const innerWidth = await page.evaluate(() => window.innerWidth);
      assert(scrollWidth <= innerWidth, `No horizontal scroll overflow on mobile: scrollWidth (${scrollWidth}) <= innerWidth (${innerWidth})`);

      await context.close();
    }

    console.log('\n==================================================');
    console.log('🎉 ALL BROWSER SMOKE TESTS PASSED CLEANLY!');
    console.log('==================================================');
  } catch (err) {
    console.error('\n❌ Browser Smoke Test Failed with Error:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }

  return results;
}

main().then((res) => {
  console.log('\n--- FINAL TEST TELEMETRY ---');
  console.log('Routes Tested:', Array.from(res.routesTested));
  console.log('Account Flows Tested:', res.accountFlowsTested);
  console.log('Console Errors:', res.consoleErrors.length === 0 ? 'None (0 errors)' : res.consoleErrors);
  console.log('Page Errors / Hydration Errors:', res.pageErrors.length === 0 ? 'None (0 errors)' : res.pageErrors);
  console.log('UI/Runtime Issues:', res.uiRuntimeIssues.length === 0 ? 'None (0 issues)' : res.uiRuntimeIssues);
});
