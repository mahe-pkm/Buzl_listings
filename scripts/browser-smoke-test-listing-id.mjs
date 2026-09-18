import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import { loadLocalFixtureEnvironment } from './lib/local-fixture-env.mjs';

loadLocalFixtureEnvironment();

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const CHROME_PATH = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(message);
  }
  console.log(`  ✅ ${message}`);
}

async function loginWithPassword(page, email, password) {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');

  // Switch to Password tab
  const passwordTab = page.locator('button[role="tab"]:has-text("Password")');
  await passwordTab.click();

  await page.fill('#password-email', email);
  await page.fill('#password-input', password);
  await page.click('button[type="submit"]:has-text("Sign In with Password")');
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });
  await page.waitForLoadState('networkidle');
}

async function logout(page) {
  await page.goto(`${BASE_URL}/dashboard`);
  await page.waitForLoadState('networkidle');
  const userMenuBtn = page.locator('button[aria-label="User menu"]');
  await userMenuBtn.click();
  const signoutBtn = page.locator('button:has-text("Sign Out")');
  await signoutBtn.click();
  await page.waitForURL((url) => url.pathname.includes('/login'));
}

async function runTests() {
  console.log('🚀 Starting Listing ID Smoke Test Suite...');

  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });

  const page = await context.newPage();

  try {
    const isStaging = BASE_URL.includes('listing.rclk.in');
    
    const adminEmail = isStaging ? process.env.STAGING_ADMIN_EMAIL : (process.env.LOCAL_FIXTURE_ADMIN_EMAIL || 'admin@buzl.test');
    const adminPassword = isStaging ? process.env.STAGING_ADMIN_PASSWORD : (process.env.LOCAL_FIXTURE_ADMIN_PASSWORD || 'AdminPassword123!');
    const ownerEmail = isStaging ? process.env.STAGING_OWNER_EMAIL : (process.env.LOCAL_FIXTURE_OWNER_EMAIL || 'owner@buzl.test');
    const ownerPassword = isStaging ? process.env.STAGING_OWNER_PASSWORD : (process.env.LOCAL_FIXTURE_OWNER_PASSWORD || 'OwnerPassword123!');

    console.log('\n======================================');
    console.log('0. Pre-requisite: Create a listing');
    console.log('======================================');
    
    // Use Supabase client to create a test listing directly
    const supabaseUrl = process.env.LOCAL_SUPABASE_URL || 'http://127.0.0.1:54321';
    const supabaseKey = process.env.LOCAL_SUPABASE_SERVICE_ROLE_KEY;
    if (supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Get owner user ID
      const { data: { users } } = await supabase.auth.admin.listUsers();
      const ownerUser = users.find(u => u.email === ownerEmail);
      
      if (ownerUser) {
        // Find a category
        const { data: cats } = await supabase.from('categories').select('id').limit(1);
        const catId = cats && cats.length > 0 ? cats[0].id : null;
        
        // Insert business
        const { data: biz, error } = await supabase.from('businesses').insert({
          canonical_name: `Smoke Test Business ${Date.now()}`,
          slug: `smoke-test-${Date.now()}`,
          description: 'A test business',
          primary_phone: '+1234567890',
          location_mode: 'storefront',
          city: 'Test City',
          state: 'TX',
          country: 'USA',
          primary_category_id: catId,
          created_by: ownerUser.id,
          publication_status: 'published'
        }).select().single();
        
        if (error) console.error("Error creating test business:", error);
        else {
          // Add as manager
          await supabase.from('business_managers').insert({
            business_id: biz.id,
            user_id: ownerUser.id,
            role: 'owner'
          });
          console.log(`Created test business: ${biz.listing_code}`);
        }
      }
    }

    console.log('\n======================================');
    console.log('1. Admin: View & Search Listing IDs');
    console.log('======================================');
    await loginWithPassword(page, adminEmail, adminPassword);
    await page.goto(`${BASE_URL}/admin/businesses`);
    await page.waitForLoadState('networkidle');

    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    const adminBadges = page.locator('span.font-mono:has-text("BZL-")');
    const adminBadgeCount = await adminBadges.count();
    assert(adminBadgeCount > 0, `Admin table displays Listing ID badges (Found ${adminBadgeCount})`);

    const testListingId = await adminBadges.first().textContent();
    const cleanListingId = testListingId.trim();

    await page.fill('input[placeholder="Search businesses..."]', cleanListingId);
    await page.waitForTimeout(1000); 
    const exactSearchResults = await page.locator('table tbody tr').count();
    assert(exactSearchResults === 1, `Search by exact Listing ID returns 1 result`);

    const numericSuffix = cleanListingId.split('-')[1];
    await page.fill('input[placeholder="Search businesses..."]', numericSuffix);
    await page.waitForTimeout(1000); 
    const suffixSearchResults = await page.locator('table tbody tr').count();
    assert(suffixSearchResults === 1, `Search by numeric suffix returns 1 result`);

    await page.fill('input[placeholder="Search businesses..."]', '');
    await page.waitForTimeout(1000);

    console.log('\n======================================');
    console.log('2. Moderation: View & Search Listing IDs');
    console.log('======================================');
    await page.goto(`${BASE_URL}/review/businesses`);
    await page.waitForLoadState('networkidle');

    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    const modBadges = page.locator('span.font-mono:has-text("BZL-")');
    const modBadgeCount = await modBadges.count();
    assert(modBadgeCount > 0, `Moderation queue displays Listing ID badges (Found ${modBadgeCount})`);

    await page.fill('input[placeholder="Search businesses..."]', cleanListingId);
    await page.waitForTimeout(1000);
    const modSearchResults = await page.locator('table tbody tr').count();
    assert(modSearchResults === 1, `Search by Listing ID in Moderation queue works`);

    console.log('\n======================================');
    console.log('3. User Management: Associated Businesses');
    console.log('======================================');
    await page.goto(`${BASE_URL}/admin/users`);
    await page.waitForLoadState('networkidle');

    const ownerLink = page.locator('a:has-text("owner@buzl.test")');
    await ownerLink.click();
    await page.waitForLoadState('networkidle');

    const assocBadges = page.locator('span.font-mono:has-text("BZL-")');
    const assocBadgeCount = await assocBadges.count();
    assert(assocBadgeCount > 0, `Associated businesses display Listing ID badges (Found ${assocBadgeCount})`);
    await logout(page);

    console.log('\n======================================');
    console.log('4. Business Owner: Dashboard & Edit');
    console.log('======================================');
    await loginWithPassword(page, ownerEmail, ownerPassword);
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');

    const recentBadges = page.locator('span.font-mono:has-text("BZL-")');
    const recentBadgeCount = await recentBadges.count();
    assert(recentBadgeCount > 0, `Recent listings display Listing ID (Found ${recentBadgeCount})`);

    await page.goto(`${BASE_URL}/dashboard/businesses`);
    await page.waitForLoadState('networkidle');

    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    const ownerBadges = page.locator('span.font-mono:has-text("BZL-")');
    const ownerBadgeCount = await ownerBadges.count();
    assert(ownerBadgeCount > 0, `Member business table displays Listing ID badges (Found ${ownerBadgeCount})`);

    const ownerListingId = await ownerBadges.first().textContent();

    await page.fill('input[placeholder="Search businesses..."]', ownerListingId.trim());
    await page.waitForTimeout(1000);
    const ownerSearchResults = await page.locator('table tbody tr').count();
    assert(ownerSearchResults === 1, `Search by Listing ID in member table works`);

    const manageLink = page.locator('a:has-text("Manage →")').first();
    await manageLink.click();
    await page.waitForLoadState('networkidle');

    const readOnlyBadge = page.getByTestId('listing-code-badge');
    assert(await readOnlyBadge.isVisible(), `Edit page displays read-only Listing ID badge`);

    const copyButton = page.getByTestId('listing-code-copy');
    assert(await copyButton.isVisible(), `Copy button exists`);
    await copyButton.click();
    assert(true, `Copy button clicked without error`);

    console.log('\n======================================');
    console.log('5. Mobile Viewport Check');
    console.log('======================================');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    const mobileBadges = page.locator('span.font-mono:has-text("BZL-")');
    assert(await mobileBadges.count() > 0, `Listing ID badges render in mobile view`);

    console.log('\n======================================');
    console.log('6. Staging Demo Credentials Invariant');
    console.log('======================================');
    const response = await page.request.get(`${BASE_URL}/api/internal/demo-credentials`);
    assert(response.status() === 200, `/api/internal/demo-credentials responds with HTTP 200`);

    console.log('\n🎉 ALL LISTING ID SMOKE TESTS PASSED!');
  } catch (err) {
    console.error('\n🚨 TEST SUITE FAILED:', err.message);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

runTests();
