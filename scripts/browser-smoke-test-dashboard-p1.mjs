import { chromium } from 'playwright';
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


async function runTests() {
  console.log('==================================================');
  console.log('🚀 ADMIN & MEMBER OPERATIONAL DASHBOARD P1 SMOKE TESTS');
  console.log(`Base URL: ${BASE_URL}`);
  console.log('==================================================');

  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
  });

  const isStaging = BASE_URL.includes('listing.rclk.in');

  const adminEmail = isStaging ? process.env.STAGING_ADMIN_EMAIL : (process.env.LOCAL_FIXTURE_ADMIN_EMAIL || 'admin@buzl.test');
  const adminPassword = isStaging ? process.env.STAGING_ADMIN_PASSWORD : (process.env.LOCAL_FIXTURE_ADMIN_PASSWORD || 'AdminPassword123!');

  const managerEmail = isStaging ? process.env.STAGING_MANAGER_EMAIL : (process.env.LOCAL_FIXTURE_MANAGER_EMAIL || 'manager@buzl.test');
  const managerPassword = isStaging ? process.env.STAGING_MANAGER_PASSWORD : (process.env.LOCAL_FIXTURE_MANAGER_PASSWORD || 'ManagerPassword123!');

  const memberEmail = isStaging ? process.env.STAGING_MEMBER_EMAIL : (process.env.LOCAL_FIXTURE_MEMBER_EMAIL || 'member@buzl.test');
  const memberPassword = isStaging ? process.env.STAGING_MEMBER_PASSWORD : (process.env.LOCAL_FIXTURE_MEMBER_PASSWORD || 'MemberPassword123!');

  const ownerEmail = isStaging ? process.env.STAGING_OWNER_EMAIL : (process.env.LOCAL_FIXTURE_OWNER_EMAIL || 'owner@buzl.test');
  const ownerPassword = isStaging ? process.env.STAGING_OWNER_PASSWORD : (process.env.LOCAL_FIXTURE_OWNER_PASSWORD || 'OwnerPassword123!');

  try {
    // =========================================================================
    // 1. PLATFORM ADMIN DASHBOARD
    // =========================================================================
    console.log('\n➡️ SUITE 1: Platform Admin Dashboard');
    const adminContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const adminPage = await adminContext.newPage();

    await loginWithPassword(adminPage, adminEmail, adminPassword);
    await adminPage.goto(`${BASE_URL}/dashboard`);
    await adminPage.waitForLoadState('networkidle');

    // 1.1 Header & Subtitle
    const adminTitle = await adminPage.locator('h1').textContent();
    assert(adminTitle.includes('Platform Operations'), 'Admin Topbar title is "Platform Operations"');

    // 1.2 Admin KPI cards
    const kpiCards = adminPage.locator('main .grid').first().locator('> div');
    const kpiCount = await kpiCards.count();
    assert(kpiCount >= 6, `Admin dashboard displays 6 primary KPI cards (Found: ${kpiCount})`);

    const hasTotal = await adminPage.locator('text=Total Listings').isVisible();
    const hasPending = await adminPage.locator('text=Pending Review').first().isVisible();
    const hasPublished = await adminPage.locator('text=Published').first().isVisible();
    const hasDrafts = await adminPage.locator('text=Drafts').first().isVisible();
    const hasVerified = await adminPage.locator('text=Verified').first().isVisible();
    const hasUnverified = await adminPage.locator('text=Unverified').first().isVisible();

    assert(hasTotal && hasPending && hasPublished && hasDrafts && hasVerified && hasUnverified,
      'Admin dashboard displays Total, Pending, Published, Drafts, Verified, and Unverified KPIs');

    // 1.3 Quick Actions
    const quickActionsContainer = adminPage.locator('text=Quick Actions').locator('..');
    assert(await quickActionsContainer.isVisible(), 'Quick Actions section is visible');

    const hasAllListingsLink = await quickActionsContainer.locator('a[href="/admin/businesses"]').isVisible();
    const hasModerationLink = await quickActionsContainer.locator('a[href="/review/businesses"]').isVisible();
    const hasCategoriesLink = await quickActionsContainer.locator('a[href="/admin/categories"]').isVisible();
    const hasUsersLink = await quickActionsContainer.locator('a[href="/admin/users"]').isVisible();
    const hasImportLink = await quickActionsContainer.locator('a[href="/admin/businesses/import"]').isVisible();
    const hasAddBusinessLink = await quickActionsContainer.locator('a[href="/dashboard/businesses/new"]').isVisible();

    assert(hasAllListingsLink && hasModerationLink && hasCategoriesLink && hasUsersLink && hasImportLink && hasAddBusinessLink,
      'Admin Quick Actions contains real routes: All Listings, Moderation, Categories, Users, Import, Add Business');

    // 1.4 Pending Review Widget
    const hasPendingWidget = await adminPage.locator('text=Pending Moderation Review').isVisible();
    assert(hasPendingWidget, 'Pending Review Widget is rendered');

    // 1.5 Needs Attention Widget
    const hasAttentionWidget = await adminPage.locator('text=Listings Requiring Attention').isVisible();
    assert(hasAttentionWidget, 'Listings Requiring Attention Widget is rendered');

    // 1.6 Recent Listings Widget
    const hasRecentWidget = await adminPage.locator('text=Recent Platform Listings').isVisible();
    assert(hasRecentWidget, 'Recent Platform Listings Widget is rendered');

    // 1.7 Category Overview Widget
    const hasCategoryOverview = await adminPage.locator('text=Top Categories by Usage').isVisible();
    assert(hasCategoryOverview, 'Top Categories by Usage Widget is rendered');

    // 1.8 Listing ID formatting & Privacy (No UUIDs exposed)
    const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
    // Check main content text specifically for raw UUIDs
    const visibleText = await adminPage.locator('main').innerText();
    const hasExposedUuidInText = uuidRegex.test(visibleText);
    assert(!hasExposedUuidInText, 'No raw UUIDs exposed in visible text of Admin dashboard');

    // Check listing codes
    const listingIdBadges = adminPage.locator('main span.font-mono:has-text("BZL-")');
    const badgeCount = await listingIdBadges.count();
    assert(badgeCount > 0, `Monospace Listing ID badges (BZL-XXXXXX) rendered (Found: ${badgeCount})`);

    await adminContext.close();

    // =========================================================================
    // 2. LISTING MANAGER DASHBOARD
    // =========================================================================
    console.log('\n➡️ SUITE 2: Listing Manager Dashboard');
    const managerContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const managerPage = await managerContext.newPage();

    await loginWithPassword(managerPage, managerEmail, managerPassword);
    await managerPage.goto(`${BASE_URL}/dashboard`);
    await managerPage.waitForLoadState('networkidle');

    // 2.1 Title & Scope
    const managerTitle = await managerPage.locator('h1').textContent();
    assert(managerTitle.includes('Listing Operations'), 'Listing Manager Topbar title is "Listing Operations"');

    // 2.2 Manager KPIs: Pending Review, Published, Suspended, Unverified
    const managerKpis = managerPage.locator('main .grid').first().locator('> div');
    const managerKpiCount = await managerKpis.count();
    assert(managerKpiCount === 4, `Listing Manager displays 4 operational KPIs (Found: ${managerKpiCount})`);

    // 2.3 Moderation Queue Accessible
    const managerModLink = await managerPage.locator('main a[href="/review/businesses"]').first();
    assert(await managerModLink.isVisible(), 'Listing Manager has access to Moderation Queue in Quick Actions / Widget');

    // 2.4 Governance Hidden: No User management
    const managerUsersLink = await managerPage.locator('a[href="/admin/users"]');
    assert((await managerUsersLink.count()) === 0, 'Listing Manager CANNOT see or access Users in Quick Actions or Navigation');

    // 2.5 Recent listings & Needs Attention
    assert(await managerPage.locator('text=Pending Moderation Review').isVisible(), 'Manager sees Pending Moderation Review');
    assert(await managerPage.locator('text=Listings Requiring Attention').isVisible(), 'Manager sees Listings Requiring Attention');
    assert(await managerPage.locator('text=Recent Listings').isVisible(), 'Manager sees Recent Listings');

    await managerContext.close();

    // =========================================================================
    // 3. ONBOARDING MEMBER DASHBOARD
    // =========================================================================
    console.log('\n➡️ SUITE 3: Onboarding Member Dashboard');
    const memberContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const memberPage = await memberContext.newPage();

    await loginWithPassword(memberPage, memberEmail, memberPassword);
    await memberPage.goto(`${BASE_URL}/dashboard`);
    await memberPage.waitForLoadState('networkidle');

    // 3.1 Title & Scope
    const memberTitle = await memberPage.locator('h1').textContent();
    assert(memberTitle.includes('Onboarding Dashboard'), 'Onboarding Member Topbar title is "Onboarding Dashboard"');

    // 3.2 Member KPIs: Draft Listings, Pending Review, Published, Needs Completion
    const memberKpis = memberPage.locator('main .grid').first().locator('> div');
    const memberKpiCount = await memberKpis.count();
    assert(memberKpiCount === 4, `Onboarding Member displays 4 onboarding KPIs (Found: ${memberKpiCount})`);

    const hasDraftKpi = await memberPage.getByText('Draft Listings', { exact: true }).isVisible();
    assert(hasDraftKpi, 'Onboarding Member sees Draft Listings KPI');

    // 3.3 Moderation Hidden: No moderation queue links
    const memberModLinks = await memberPage.locator('a[href="/review/businesses"]');
    assert((await memberModLinks.count()) === 0, 'Onboarding Member CANNOT see or access Moderation Queue');

    // 3.4 Governance Hidden: No user management
    const memberUsersLink = await memberPage.locator('a[href="/admin/users"]');
    assert((await memberUsersLink.count()) === 0, 'Onboarding Member CANNOT see or access Users');

    // 3.5 Incomplete Listings widget
    const hasIncompleteWidget = await memberPage.locator('text=Incomplete Draft Listings').isVisible();
    assert(hasIncompleteWidget, 'Onboarding Member sees Incomplete Draft Listings widget');

    await memberContext.close();

    // =========================================================================
    // 4. BUSINESS OWNER DASHBOARD ISOLATION
    // =========================================================================
    console.log('\n➡️ SUITE 4: Business Owner Dashboard & Isolation');
    const ownerContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const ownerPage = await ownerContext.newPage();

    await loginWithPassword(ownerPage, ownerEmail, ownerPassword);
    await ownerPage.goto(`${BASE_URL}/dashboard`);
    await ownerPage.waitForLoadState('networkidle');

    // 4.1 Preserved Owner Title
    const ownerTitle = await ownerPage.locator('h1').textContent();
    assert(ownerTitle.includes('Dashboard Overview'), 'Business Owner Topbar title is preserved as "Dashboard Overview"');

    // 4.2 Owner KPI Cards: Total Businesses, Published, Pending Review, Drafts
    const ownerKpis = ownerPage.locator('main .grid').first().locator('> div');
    const ownerKpiCount = await ownerKpis.count();
    assert(ownerKpiCount === 4, `Business Owner displays 4 account KPIs (Found: ${ownerKpiCount})`);
    assert(await ownerPage.locator('text=Total Businesses').isVisible(), 'Owner sees "Total Businesses" (not platform total)');

    // 4.3 Isolation: Zero exposure to internal operations
    const ownerModLinks = await ownerPage.locator('a[href="/review/businesses"]');
    const ownerAdminListings = await ownerPage.locator('a[href="/admin/businesses"]');
    const ownerUsersLinks = await ownerPage.locator('a[href="/admin/users"]');
    const ownerCategoriesLinks = await ownerPage.locator('a[href="/admin/categories"]');

    assert((await ownerModLinks.count()) === 0, 'Business Owner CANNOT see Moderation Queue');
    assert((await ownerAdminListings.count()) === 0, 'Business Owner CANNOT see Admin Listings');
    assert((await ownerUsersLinks.count()) === 0, 'Business Owner CANNOT see Users');
    assert((await ownerCategoriesLinks.count()) === 0, 'Business Owner CANNOT see Categories admin');

    // 4.4 Recent listings table with Listing ID badge
    const ownerListingsTable = await ownerPage.locator('text=Recent Listings').isVisible();
    assert(ownerListingsTable, 'Owner sees Recent Listings table');

    await ownerContext.close();

    // =========================================================================
    // 5. MOBILE VIEWPORT TESTS (375px, 390px, 430px)
    // =========================================================================
    console.log('\n➡️ SUITE 5: Mobile Responsive Layout');
    const viewports = [
      { name: '375px (iPhone SE)', width: 375, height: 667 },
      { name: '390px (iPhone 14/15)', width: 390, height: 844 },
      { name: '430px (iPhone Pro Max)', width: 430, height: 932 },
    ];

    for (const vp of viewports) {
      console.log(`  Testing ${vp.name}...`);
      const mobileContext = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      const mobilePage = await mobileContext.newPage();

      await loginWithPassword(mobilePage, adminEmail, adminPassword);
      await mobilePage.goto(`${BASE_URL}/dashboard`);
      await mobilePage.waitForLoadState('networkidle');

      // Check horizontal overflow
      const scrollWidth = await mobilePage.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await mobilePage.evaluate(() => document.documentElement.clientWidth);
      assert(scrollWidth <= clientWidth, `No horizontal scroll on ${vp.width}px (scrollWidth=${scrollWidth}, clientWidth=${clientWidth})`);

      // Check KPI grid stacks nicely
      const kpisStacked = await mobilePage.locator('main .grid').first().isVisible();
      assert(kpisStacked, `KPI grid is properly displayed on ${vp.width}px`);

      // Quick actions wrap
      const quickActionsVisible = await mobilePage.locator('text=Quick Actions').isVisible();
      assert(quickActionsVisible, `Quick Actions visible on ${vp.width}px`);

      await mobileContext.close();
    }

    console.log('\n==================================================');
    console.log('🎉 ALL DASHBOARD P1 SMOKE TESTS PASSED!');
    console.log('==================================================');
  } finally {
    await browser.close();
  }
}

runTests().catch((err) => {
  console.error('\n🚨 TEST SUITE FAILED WITH ERROR:', err);
  process.exit(1);
});
