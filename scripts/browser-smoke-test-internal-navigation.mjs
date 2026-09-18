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
  console.log(`  ✓ ${message}`);
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

async function main() {
  console.log('================================================================');
  console.log('🚀 INTERNAL DASHBOARD PHASE A NAVIGATION & REVIEW QUEUE SMOKE TEST');
  console.log(`Base URL: ${BASE_URL}`);
  console.log('================================================================\n');

  const adminEmail = process.env.STAGING_ADMIN_EMAIL || process.env.LOCAL_FIXTURE_ADMIN_EMAIL || 'admin@buzl.test';
  const adminPassword = process.env.STAGING_ADMIN_PASSWORD || process.env.LOCAL_FIXTURE_ADMIN_PASSWORD;
  const managerEmail = process.env.STAGING_MANAGER_EMAIL || process.env.LOCAL_FIXTURE_MANAGER_EMAIL || 'manager@buzl.test';
  const managerPassword = process.env.STAGING_MANAGER_PASSWORD || process.env.LOCAL_FIXTURE_MANAGER_PASSWORD;
  const memberEmail = process.env.STAGING_MEMBER_EMAIL || process.env.LOCAL_FIXTURE_MEMBER_EMAIL || 'member@buzl.test';
  const memberPassword = process.env.STAGING_MEMBER_PASSWORD || process.env.LOCAL_FIXTURE_MEMBER_PASSWORD;
  const ownerEmail = process.env.STAGING_OWNER_EMAIL || process.env.LOCAL_FIXTURE_OWNER_EMAIL || 'owner@buzl.test';
  const ownerPassword = process.env.STAGING_OWNER_PASSWORD || process.env.LOCAL_FIXTURE_OWNER_PASSWORD;

  if (!adminPassword || !managerPassword || !memberPassword || !ownerPassword) {
    throw new Error('Test credentials missing. Please set credentials in environment or .env.fixtures.local');
  }

  const supabase =
    process.env.LOCAL_SUPABASE_URL && process.env.LOCAL_SUPABASE_SERVICE_ROLE_KEY
      ? createClient(process.env.LOCAL_SUPABASE_URL, process.env.LOCAL_SUPABASE_SERVICE_ROLE_KEY)
      : null;

  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
  });

  try {
    // ----------------------------------------------------
    // SUITE 1: Platform Admin Navigation
    // ----------------------------------------------------
    console.log('➡️ SUITE 1: Platform Admin Navigation');
    const adminContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const adminPage = await adminContext.newPage();

    await loginWithPassword(adminPage, adminEmail, adminPassword);
    assert(adminPage.url().includes('/admin') || adminPage.url().includes('/dashboard'), 'Admin signed in successfully');

    // Sidebar navigation checks
    const adminOverview = adminPage.locator('aside nav a[href="/dashboard"]');
    assert(await adminOverview.isVisible(), 'Sidebar contains Overview link');

    const adminAllListings = adminPage.locator('aside nav a[href="/admin/businesses"]');
    assert(await adminAllListings.isVisible(), 'Sidebar contains "All Listings (Admin)" link');

    const adminReviewQueue = adminPage.locator('aside nav a[href="/review/businesses"]');
    assert(await adminReviewQueue.isVisible(), 'Sidebar contains "Moderation Queue" link');

    const adminPendingBadge = adminReviewQueue.locator('[data-testid="pending-review-badge"]');
    const badgeVisible = await adminPendingBadge.isVisible();
    assert(badgeVisible, 'Moderation Queue displays pending count badge for Admin');
    const badgeText = await adminPendingBadge.innerText();
    console.log(`  ℹ️ Admin saw pending review count badge: "${badgeText}"`);

    const adminImport = adminPage.locator('aside nav a[href="/admin/businesses/import"]');
    assert(await adminImport.isVisible(), 'Sidebar contains "Import Buzl Profile" link');

    const adminUsers = adminPage.locator('aside nav a[href="/admin/users"]');
    assert(await adminUsers.isVisible(), 'Sidebar contains "Users" link');

    const adminAddUser = adminPage.locator('aside nav a[href="/admin/users/new"]');
    assert(await adminAddUser.isVisible(), 'Sidebar contains "Add User" link');

    // Check Role badge in footer
    const adminRoleBadge = adminPage.locator('aside span.rounded-full:has-text("Admin")');
    assert(await adminRoleBadge.isVisible(), 'Admin role badge displayed in footer');

    // Navigate to Moderation Queue
    await adminReviewQueue.click();
    await adminPage.waitForURL('**/review/businesses**', { timeout: 10000 });
    assert(adminPage.url().includes('/review/businesses'), 'Clicking Moderation Queue navigates to /review/businesses');

    // Check page title and active state
    const reviewHeading = adminPage.locator('h1:has-text("Moderation Review Queue")');
    assert(await reviewHeading.isVisible(), 'Page displays "Moderation Review Queue" heading');

    const activeReviewLink = adminPage.locator('aside nav a[href="/review/businesses"].bg-\\[\\#ECF4FF\\]');
    assert(await activeReviewLink.isVisible(), 'Moderation Queue link has active styling');

    await adminContext.close();

    // ----------------------------------------------------
    // SUITE 2: Listing Manager Navigation
    // ----------------------------------------------------
    console.log('\n➡️ SUITE 2: Listing Manager Navigation');
    const managerContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const managerPage = await managerContext.newPage();

    await loginWithPassword(managerPage, managerEmail, managerPassword);
    assert(managerPage.url().includes('/admin') || managerPage.url().includes('/dashboard'), 'Listing Manager signed in');

    // Check Manager nav items
    const mgrOverview = managerPage.locator('aside nav a[href="/dashboard"]');
    assert(await mgrOverview.isVisible(), 'Overview link visible for Listing Manager');

    const mgrListings = managerPage.locator('aside nav a[href="/dashboard/businesses"]');
    assert(await mgrListings.isVisible(), 'Listings link visible for Listing Manager');
    assert((await mgrListings.innerText()).includes('Listings'), 'Link label is "Listings" for Listing Manager');

    const mgrAddBiz = managerPage.locator('aside nav a[href="/dashboard/businesses/new"]');
    assert(await mgrAddBiz.isVisible(), 'Add Business link visible for Listing Manager');

    const mgrReviewQueue = managerPage.locator('aside nav a[href="/review/businesses"]');
    assert(await mgrReviewQueue.isVisible(), 'Moderation Queue link visible for Listing Manager');

    const mgrBadge = mgrReviewQueue.locator('[data-testid="pending-review-badge"]');
    assert(await mgrBadge.isVisible(), 'Pending count badge visible for Listing Manager');

    const mgrImport = managerPage.locator('aside nav a[href="/admin/businesses/import"]');
    assert(await mgrImport.isVisible(), 'Import Buzl Profile visible for Listing Manager');

    // Verify Users is HIDDEN
    const mgrUsersCount = await managerPage.locator('aside nav a[href="/admin/users"]').count();
    assert(mgrUsersCount === 0, 'Users link is strictly HIDDEN from Listing Manager');

    const mgrAddUserCount = await managerPage.locator('aside nav a[href="/admin/users/new"]').count();
    assert(mgrAddUserCount === 0, 'Add User link is strictly HIDDEN from Listing Manager');

    // Check Role pill
    const mgrRolePill = managerPage.locator('aside span.rounded-full:has-text("Listing Manager")');
    assert(await mgrRolePill.isVisible(), 'Role pill displays "Listing Manager"');

    // Click Moderation Queue
    await mgrReviewQueue.click();
    await managerPage.waitForURL('**/review/businesses**', { timeout: 10000 });
    assert(managerPage.url().includes('/review/businesses'), 'Listing Manager navigates to /review/businesses');

    // Verify layout shell is preserved (sidebar present)
    const shellSidebar = managerPage.locator('aside');
    assert(await shellSidebar.isVisible(), 'ReviewLayout renders standard sidebar shell on /review/businesses');

    await managerContext.close();

    // ----------------------------------------------------
    // SUITE 3: Onboarding Member Navigation
    // ----------------------------------------------------
    console.log('\n➡️ SUITE 3: Onboarding Member Navigation');
    const memberContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const memberPage = await memberContext.newPage();

    await loginWithPassword(memberPage, memberEmail, memberPassword);
    assert(memberPage.url().includes('/admin') || memberPage.url().includes('/dashboard'), 'Onboarding Member signed in');

    const obOverview = memberPage.locator('aside nav a[href="/dashboard"]');
    assert(await obOverview.isVisible(), 'Overview link visible for Onboarding Member');

    const obListings = memberPage.locator('aside nav a[href="/dashboard/businesses"]');
    assert(await obListings.isVisible(), 'My Listings link visible for Onboarding Member');
    assert((await obListings.innerText()).includes('My Listings'), 'Link label is "My Listings" for Onboarding Member');

    const obAddBiz = memberPage.locator('aside nav a[href="/dashboard/businesses/new"]');
    assert(await obAddBiz.isVisible(), 'Add Business link visible for Onboarding Member');

    const obImport = memberPage.locator('aside nav a[href="/admin/businesses/import"]');
    assert(await obImport.isVisible(), 'Import Buzl Profile visible for Onboarding Member');

    // Verify Moderation Queue and Users are HIDDEN
    const obReviewCount = await memberPage.locator('aside nav a[href="/review/businesses"]').count();
    assert(obReviewCount === 0, 'Moderation Queue is strictly HIDDEN from Onboarding Member');

    const obUsersCount = await memberPage.locator('aside nav a[href="/admin/users"]').count();
    assert(obUsersCount === 0, 'Users is strictly HIDDEN from Onboarding Member');

    const obAddUserCount = await memberPage.locator('aside nav a[href="/admin/users/new"]').count();
    assert(obAddUserCount === 0, 'Add User is strictly HIDDEN from Onboarding Member');

    const obRolePill = memberPage.locator('aside span.rounded-full:has-text("Onboarding Member")');
    assert(await obRolePill.isVisible(), 'Role pill displays "Onboarding Member"');

    await memberContext.close();

    // ----------------------------------------------------
    // SUITE 4: Business Owner Navigation
    // ----------------------------------------------------
    console.log('\n➡️ SUITE 4: Business Owner Navigation');
    const ownerContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const ownerPage = await ownerContext.newPage();

    await loginWithPassword(ownerPage, ownerEmail, ownerPassword);
    assert(ownerPage.url().includes('/dashboard'), 'Business Owner signed in to /dashboard');

    const ownOverview = ownerPage.locator('aside nav a[href="/dashboard"]');
    assert(await ownOverview.isVisible(), 'Overview link visible for Business Owner');

    const ownListings = ownerPage.locator('aside nav a[href="/dashboard/businesses"]');
    assert(await ownListings.isVisible(), 'My Businesses link visible for Business Owner');
    assert((await ownListings.innerText()).includes('My Businesses'), 'Link label is "My Businesses" for Owner');

    const ownAddBiz = ownerPage.locator('aside nav a[href="/dashboard/businesses/new"]');
    assert(await ownAddBiz.isVisible(), 'Add Business link visible for Business Owner');

    // Verify internal items are completely absent
    const ownReviewCount = await ownerPage.locator('aside nav a[href="/review/businesses"]').count();
    assert(ownReviewCount === 0, 'Moderation Queue is strictly HIDDEN from Business Owner');

    const ownImportCount = await ownerPage.locator('aside nav a[href="/admin/businesses/import"]').count();
    assert(ownImportCount === 0, 'Import Buzl Profile is strictly HIDDEN from Business Owner');

    const ownUsersCount = await ownerPage.locator('aside nav a[href="/admin/users"]').count();
    assert(ownUsersCount === 0, 'Users is strictly HIDDEN from Business Owner');

    const ownRolePill = ownerPage.locator('aside span.rounded-full:has-text("Owner")');
    assert(await ownRolePill.isVisible(), 'Role pill displays "Owner"');

    await ownerContext.close();

    // ----------------------------------------------------
    // SUITE 5: Direct URL RBAC Protection (/review/businesses)
    // ----------------------------------------------------
    console.log('\n➡️ SUITE 5: Direct URL RBAC Protection (/review/businesses)');

    // 5.1 Admin direct access -> ALLOW
    const adminRbacContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const adminRbacPage = await adminRbacContext.newPage();
    await loginWithPassword(adminRbacPage, adminEmail, adminPassword);
    await adminRbacPage.goto(`${BASE_URL}/review/businesses`);
    await adminRbacPage.waitForLoadState('networkidle');
    assert(adminRbacPage.url().includes('/review/businesses'), 'Admin directly allowed on /review/businesses');
    await adminRbacContext.close();

    // 5.2 Listing Manager direct access -> ALLOW
    const mgrRbacContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const mgrRbacPage = await mgrRbacContext.newPage();
    await loginWithPassword(mgrRbacPage, managerEmail, managerPassword);
    await mgrRbacPage.goto(`${BASE_URL}/review/businesses`);
    await mgrRbacPage.waitForLoadState('networkidle');
    assert(mgrRbacPage.url().includes('/review/businesses'), 'Listing Manager directly allowed on /review/businesses');
    await mgrRbacContext.close();

    // 5.3 Onboarding Member direct access -> DENY (redirect to /dashboard)
    const obRbacContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const obRbacPage = await obRbacContext.newPage();
    await loginWithPassword(obRbacPage, memberEmail, memberPassword);
    await obRbacPage.goto(`${BASE_URL}/review/businesses`);
    await obRbacPage.waitForLoadState('networkidle');
    assert(!obRbacPage.url().includes('/review/businesses'), 'Onboarding Member blocked from /review/businesses');
    assert(obRbacPage.url().includes('/dashboard'), 'Onboarding Member redirected to /dashboard');
    await obRbacContext.close();

    // 5.4 Business Owner direct access -> DENY (redirect to /dashboard)
    const ownRbacContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const ownRbacPage = await ownRbacContext.newPage();
    await loginWithPassword(ownRbacPage, ownerEmail, ownerPassword);
    await ownRbacPage.goto(`${BASE_URL}/review/businesses`);
    await ownRbacPage.waitForLoadState('networkidle');
    assert(!ownRbacPage.url().includes('/review/businesses'), 'Business Owner blocked from /review/businesses');
    assert(ownRbacPage.url().includes('/dashboard'), 'Business Owner redirected to /dashboard');
    await ownRbacContext.close();

    // 5.5 Unauthenticated direct access -> DENY (redirect to /login?redirect=/review/businesses)
    const anonContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const anonPage = await anonContext.newPage();
    await anonPage.goto(`${BASE_URL}/review/businesses`);
    await anonPage.waitForLoadState('networkidle');
    assert(anonPage.url().includes('/login'), 'Unauthenticated user redirected to /login');
    assert(anonPage.url().includes('redirect=%2Freview%2Fbusinesses') || anonPage.url().includes('redirect=/review/businesses'), 'Redirect target preserved');
    await anonContext.close();

    // ----------------------------------------------------
    // SUITE 6: Listing Manager Review Queue Capabilities
    // ----------------------------------------------------
    console.log('\n➡️ SUITE 6: Listing Manager Review Queue Capabilities');
    const lmCapsContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const lmCapsPage = await lmCapsContext.newPage();
    await loginWithPassword(lmCapsPage, managerEmail, managerPassword);
    await lmCapsPage.goto(`${BASE_URL}/review/businesses`);
    await lmCapsPage.waitForLoadState('networkidle');

    // Verify row actions
    const table = lmCapsPage.locator('table');
    assert(await table.isVisible(), 'Review queue listings table is visible');

    // Verify Verify toggle is NOT rendered for non-admin
    const verifyToggleCount = await lmCapsPage.locator('table button:has-text("Verify"), table button:has-text("Unverify")').count();
    assert(verifyToggleCount === 0, 'Verification toggle action is NOT rendered for Listing Manager (verify: false)');

    // Verify Delete button is NOT rendered for non-admin
    const deleteBtnCount = await lmCapsPage.locator('table button:has-text("Delete")').count();
    assert(deleteBtnCount === 0, 'Delete action is NOT rendered for Listing Manager (delete: false)');

    // ----------------------------------------------------
    // SUITE 7: Explicit Edit Authorization for Listing Manager
    // ----------------------------------------------------
    console.log('\n➡️ SUITE 7: Explicit Edit Authorization for Listing Manager');
    const editLinks = lmCapsPage.locator('table a[href*="/edit"]');
    const editCount = await editLinks.count();
    assert(editCount > 0, `Listing Manager has ${editCount} active Edit links in review table`);

    // Business name link should also be a link to edit
    const firstBusinessLink = lmCapsPage.locator('table td.font-semibold a[href*="/edit"]').first();
    assert(await firstBusinessLink.isVisible(), 'Business canonical name is an active edit link for Listing Manager');
    const targetEditUrl = await firstBusinessLink.getAttribute('href');

    // Click to navigate to edit
    await firstBusinessLink.click();
    await lmCapsPage.waitForURL(`**${targetEditUrl}**`, { timeout: 10000 });
    assert(lmCapsPage.url().includes('/edit'), 'Clicking edit navigates to listing edit form');

    await lmCapsContext.close();

    // ----------------------------------------------------
    // SUITE 8: Pending Count Badge Styling & Value
    // ----------------------------------------------------
    console.log('\n➡️ SUITE 8: Pending Count Badge Styling & Value');
    const badgeContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const badgePage = await badgeContext.newPage();
    await loginWithPassword(badgePage, adminEmail, adminPassword);

    const badgeLocator = badgePage.locator('aside a[href="/review/businesses"] [data-testid="pending-review-badge"]');
    assert(await badgeLocator.isVisible(), 'Pending count badge is visible in sidebar');

    const badgeClasses = await badgeLocator.getAttribute('class');
    assert(badgeClasses.includes('bg-[#FFF6DF]'), 'Badge has Buzl amber background #FFF6DF');
    assert(badgeClasses.includes('text-[#9A6700]'), 'Badge has Buzl amber text #9A6700');
    assert(badgeClasses.includes('rounded-full'), 'Badge is styled as a rounded pill');

    const countNum = parseInt(await badgeLocator.innerText(), 10);
    assert(!isNaN(countNum) && countNum >= 1, `Badge displays positive number: ${countNum}`);

    await badgeContext.close();

    // ----------------------------------------------------
    // SUITE 9: Count Freshness & Revalidation
    // ----------------------------------------------------
    console.log('\n➡️ SUITE 9: Count Freshness & Targeted Revalidation');
    const freshContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const freshPage = await freshContext.newPage();
    await loginWithPassword(freshPage, adminEmail, adminPassword);

    const initialBadge = freshPage.locator('aside a[href="/review/businesses"] [data-testid="pending-review-badge"]');
    const initialCount = parseInt(await initialBadge.innerText(), 10);
    console.log(`  ℹ️ Baseline pending count: ${initialCount}`);

    if (supabase && (BASE_URL.includes('localhost') || BASE_URL.includes('127.0.0.1'))) {
      // Insert temporary pending business record via service role
      const { data: usersList } = await supabase.auth.admin.listUsers();
      const adminUserRecord = usersList.users.find((u) => u.email === adminEmail);
      const { data: firstCat } = await supabase.from('categories').select('id').limit(1).single();

      const testSlug = `temp-test-pending-${Date.now()}`;
      const { data: inserted, error: insertErr } = await supabase
        .from('businesses')
        .insert({
          canonical_name: `Temp Freshness Test ${Date.now()}`,
          slug: testSlug,
          primary_phone: '+919876543210',
          primary_phone_normalized: '9876543210',
          primary_category_id: firstCat?.id,
          location_mode: 'storefront',
          city: 'Bengaluru',
          state: 'Karnataka',
          country: 'India',
          postal_code: '560001',
          publication_status: 'pending',
          verification_status: 'unverified',
          created_by: adminUserRecord?.id || '00000000-0000-0000-0000-000000000000',
        })
        .select('id')
        .single();

      assert(!insertErr && inserted?.id, 'Created temporary pending business for freshness test');

      try {
        // Reload page and verify badge updated
        await freshPage.reload({ waitUntil: 'networkidle' });
        const updatedBadge = freshPage.locator('aside a[href="/review/businesses"] [data-testid="pending-review-badge"]');
        const updatedCount = parseInt(await updatedBadge.innerText(), 10);
        console.log(`  ℹ️ Updated pending count after insert: ${updatedCount}`);
        assert(updatedCount === initialCount + 1, `Pending count incremented from ${initialCount} to ${updatedCount}`);
      } finally {
        // Clean up temporary business
        await supabase.from('businesses').delete().eq('id', inserted.id);
        console.log('  ℹ️ Cleaned up temporary test business');
      }

      // Verify count restored after deletion
      await freshPage.reload({ waitUntil: 'networkidle' });
      const restoredBadge = freshPage.locator('aside a[href="/review/businesses"] [data-testid="pending-review-badge"]');
      const restoredCount = parseInt(await restoredBadge.innerText(), 10);
      console.log(`  ℹ️ Restored pending count: ${restoredCount}`);
      assert(restoredCount === initialCount, `Pending count restored back to ${initialCount}`);
    } else {
      console.log(`  ℹ️ Remote target: verified live pending review count: ${initialCount}`);
      assert(initialCount >= 1, `Remote target badge shows positive pending review count: ${initialCount}`);
    }

    await freshContext.close();

    // ----------------------------------------------------
    // SUITE 10: Mobile Viewport 375px (iPhone SE)
    // ----------------------------------------------------
    console.log('\n➡️ SUITE 10: Mobile Viewport 375px');
    const mobile375Context = await browser.newContext({ viewport: { width: 375, height: 667 } });
    const mobile375Page = await mobile375Context.newPage();
    await loginWithPassword(mobile375Page, adminEmail, adminPassword);

    await mobile375Page.goto(`${BASE_URL}/review/businesses`);
    await mobile375Page.waitForLoadState('networkidle');

    // Check zero horizontal overflow on page
    const overflow375 = await mobile375Page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
    assert(overflow375, 'Mobile 375px has zero horizontal viewport overflow');

    // Open hamburger drawer
    const hamburger375 = mobile375Page.locator('button[aria-label="Toggle Navigation"]');
    assert(await hamburger375.isVisible(), 'Mobile hamburger button is visible');
    await hamburger375.click();
    await mobile375Page.waitForTimeout(300);

    // Verify drawer contains Moderation Queue with badge
    const drawerReview375 = mobile375Page.locator('div.z-50 a[href="/review/businesses"]');
    assert(await drawerReview375.isVisible(), 'Moderation Queue link visible in mobile drawer (375px)');
    const drawerBadge375 = drawerReview375.locator('[data-testid="pending-review-badge"]');
    assert(await drawerBadge375.isVisible(), 'Pending count badge visible in mobile drawer (375px)');

    await mobile375Context.close();

    // ----------------------------------------------------
    // SUITE 11: Mobile Viewport 390px (iPhone 12/13/14)
    // ----------------------------------------------------
    console.log('\n➡️ SUITE 11: Mobile Viewport 390px');
    const mobile390Context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const mobile390Page = await mobile390Context.newPage();
    await loginWithPassword(mobile390Page, adminEmail, adminPassword);

    await mobile390Page.goto(`${BASE_URL}/review/businesses`);
    await mobile390Page.waitForLoadState('networkidle');

    const overflow390 = await mobile390Page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
    assert(overflow390, 'Mobile 390px has zero horizontal viewport overflow');

    const hamburger390 = mobile390Page.locator('button[aria-label="Toggle Navigation"]');
    await hamburger390.click();
    await mobile390Page.waitForTimeout(300);

    const drawerReview390 = mobile390Page.locator('div.z-50 a[href="/review/businesses"]');
    assert(await drawerReview390.isVisible(), 'Moderation Queue link visible in mobile drawer (390px)');

    await mobile390Context.close();

    // ----------------------------------------------------
    // SUITE 12: Mobile Viewport 430px (iPhone 14/15 Pro Max)
    // ----------------------------------------------------
    console.log('\n➡️ SUITE 12: Mobile Viewport 430px');
    const mobile430Context = await browser.newContext({ viewport: { width: 430, height: 932 } });
    const mobile430Page = await mobile430Context.newPage();
    await loginWithPassword(mobile430Page, adminEmail, adminPassword);

    await mobile430Page.goto(`${BASE_URL}/review/businesses`);
    await mobile430Page.waitForLoadState('networkidle');

    const overflow430 = await mobile430Page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
    assert(overflow430, 'Mobile 430px has zero horizontal viewport overflow');

    const hamburger430 = mobile430Page.locator('button[aria-label="Toggle Navigation"]');
    await hamburger430.click();
    await mobile430Page.waitForTimeout(300);

    const drawerReview430 = mobile430Page.locator('div.z-50 a[href="/review/businesses"]');
    assert(await drawerReview430.isVisible(), 'Moderation Queue link visible in mobile drawer (430px)');

    await mobile430Context.close();

    console.log('\n================================================================');
    console.log('✅ ALL INTERNAL DASHBOARD PHASE A TESTS PASSED SUCCESSFULLY!');
    console.log('================================================================');
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error('\n❌ TEST RUN FAILED:', err);
  process.exit(1);
});
