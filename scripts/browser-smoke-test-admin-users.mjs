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
  console.log('🚀 PLATFORM ADMIN USER MANAGEMENT UX BROWSER & MOBILE TEST SUITE');
  console.log(`Base URL: ${BASE_URL}`);
  console.log('================================================================\n');

  const isStaging = BASE_URL.includes('rclk.in');
  const adminEmail = isStaging ? (process.env.STAGING_ADMIN_EMAIL || 'admin@buzl.test') : (process.env.LOCAL_FIXTURE_ADMIN_EMAIL || 'admin@buzl.test');
  const adminPassword = isStaging ? process.env.STAGING_ADMIN_PASSWORD : (process.env.LOCAL_FIXTURE_ADMIN_PASSWORD || 'AdminPassword123!');
  const ownerEmail = isStaging ? (process.env.STAGING_OWNER_EMAIL || 'owner@buzl.test') : (process.env.LOCAL_FIXTURE_OWNER_EMAIL || 'owner@buzl.test');
  const ownerPassword = isStaging ? process.env.STAGING_OWNER_PASSWORD : (process.env.LOCAL_FIXTURE_OWNER_PASSWORD || 'OwnerPassword123!');
  const memberEmail = isStaging ? (process.env.STAGING_MEMBER_EMAIL || 'member@buzl.test') : (process.env.LOCAL_FIXTURE_MEMBER_EMAIL || 'member@buzl.test');
  const memberPassword = isStaging ? process.env.STAGING_MEMBER_PASSWORD : (process.env.LOCAL_FIXTURE_MEMBER_PASSWORD || 'MemberPassword123!');

  if (!adminPassword || !ownerPassword || !memberPassword) {
    throw new Error('Test credentials missing. Please set credentials in environment or .env.fixtures.local');
  }

  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
  });

  try {
    // ----------------------------------------------------
    // SUITE 1: Admin Navigation Discoverability & Sidebar Integration
    // ----------------------------------------------------
    console.log('➡️ SUITE 1: Admin Navigation Discoverability & Sidebar Integration');
    const adminContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const adminPage = await adminContext.newPage();

    await loginWithPassword(adminPage, adminEmail, adminPassword);
    assert(adminPage.url().includes('/admin') || adminPage.url().includes('/dashboard'), 'Admin signed in successfully');

    // Check sidebar navigation items
    const usersNavLink = adminPage.locator('aside a[href="/admin/users"]');
    await usersNavLink.waitFor({ state: 'visible', timeout: 10000 });
    assert(await usersNavLink.isVisible(), 'Sidebar contains "Users" navigation link pointing to /admin/users');

    const addUserNavLink = adminPage.locator('aside a[href="/admin/users/new"]');
    await addUserNavLink.waitFor({ state: 'visible', timeout: 10000 });
    assert(await addUserNavLink.isVisible(), 'Sidebar contains "Add User" navigation link pointing to /admin/users/new');

    // Click Users link
    await usersNavLink.click();
    await adminPage.waitForURL('**/admin/users**', { timeout: 10000 });
    assert(adminPage.url().includes('/admin/users'), 'Clicking "Users" in sidebar navigates to /admin/users');

    // ----------------------------------------------------
    // SUITE 2: User List View & Summary Metrics
    // ----------------------------------------------------
    console.log('\n➡️ SUITE 2: User List View & Summary Metrics');
    const pageHeading = adminPage.locator('h1:has-text("User Management")');
    try {
      await pageHeading.waitFor({ state: 'visible', timeout: 10000 });
    } catch {
      console.log('Current URL:', adminPage.url());
      console.log('Page body text:', await adminPage.innerText('body'));
    }
    assert(await pageHeading.isVisible(), 'Page displays "User Management" heading');

    const inviteBtn = adminPage.locator('a[href="/admin/users/new"]:has-text("Invite User")');
    assert(await inviteBtn.isVisible(), 'Header contains "+ Invite User" button linking to /admin/users/new');

    // Verify 5 Summary metric cards
    const totalUsersCard = adminPage.locator('div:has-text("Total Users")').first();
    assert(await totalUsersCard.isVisible(), 'Metric Card "Total Users" is visible');

    const ownersCard = adminPage.locator('div:has-text("Business Owners")').first();
    assert(await ownersCard.isVisible(), 'Metric Card "Business Owners" is visible');

    const membersCard = adminPage.locator('div:has-text("Buzl Members")').first();
    assert(await membersCard.isVisible(), 'Metric Card "Buzl Members" is visible');

    const adminsCard = adminPage.locator('div:has-text("Admins")').first();
    assert(await adminsCard.isVisible(), 'Metric Card "Admins" is visible');

    const suspendedCard = adminPage.locator('div:has-text("Suspended")').first();
    assert(await suspendedCard.isVisible(), 'Metric Card "Suspended" is visible');

    // Table view on desktop
    const desktopTable = adminPage.locator('table');
    assert(await desktopTable.isVisible(), 'Desktop users table is visible');

    const tableHeaders = ['User', 'Role', 'Member ID', 'Permission Preset', 'Status', 'Last Sign-in', 'Actions'];
    for (const header of tableHeaders) {
      const th = adminPage.locator(`th:has-text("${header}")`);
      assert(await th.count() > 0, `Table contains column header "${header}"`);
    }

    // Role Badges visible in table
    const adminBadge = adminPage.locator('table span:has-text("Admin")').first();
    assert(await adminBadge.isVisible(), 'Admin role badge is rendered');

    // Status Badges visible
    const activeBadge = adminPage.locator('table span:has-text("Active")').first();
    assert(await activeBadge.isVisible(), 'Active status badge is rendered');

    // ----------------------------------------------------
    // SUITE 3: Live Search, Filter Interactivity & Empty State
    // ----------------------------------------------------
    console.log('\n➡️ SUITE 3: Live Search, Filter Interactivity & Empty State');
    const searchInput = adminPage.locator('input[placeholder*="Search by name, email"]');
    assert(await searchInput.isVisible(), 'Search input is visible');

    // Search for admin
    await searchInput.fill(adminEmail);
    await adminPage.waitForTimeout(200);

    const adminRows = adminPage.locator(`table tbody tr:has-text("${adminEmail}")`);
    assert(await adminRows.count() >= 1, `Searching for "${adminEmail}" returns the admin user row`);

    // Search for nonexistent string to verify empty state
    await searchInput.fill('nonexistent-user-xyz-query');
    await adminPage.waitForTimeout(200);

    const emptyStateText = adminPage.locator('text=No users found').first();
    assert(await emptyStateText.isVisible(), 'Empty state "No users found" appears on non-matching query');

    const clearFiltersBtn = adminPage.locator('button:has-text("Clear all filters")').first();
    assert(await clearFiltersBtn.isVisible(), 'Clear filters button is displayed in empty state');
    await clearFiltersBtn.click();
    await adminPage.waitForTimeout(200);

    assert(await adminRows.count() >= 1, 'Clearing filters restores user list');

    // Test Role Pills
    const roleAdminsPill = adminPage.locator('button:has-text("Admins (")');
    assert(await roleAdminsPill.isVisible(), 'Admins role filter pill is visible');
    await roleAdminsPill.click();
    await adminPage.waitForTimeout(200);

    const nonAdminRole = adminPage.locator('table tbody tr span:has-text("Business Owner")');
    assert(await nonAdminRole.count() === 0, 'Clicking Admins filter pill filters out Business Owners');

    // Reset filters
    const resetFiltersBtn = adminPage.locator('button:has-text("Reset filters")');
    if (await resetFiltersBtn.isVisible()) {
      await resetFiltersBtn.click();
    }

    // ----------------------------------------------------
    // SUITE 4: Invite User Page & Role-Conditional Fields UX
    // ----------------------------------------------------
    console.log('\n➡️ SUITE 4: Invite User Page & Role-Conditional Fields UX');
    await adminPage.goto(`${BASE_URL}/admin/users/new`);
    await adminPage.waitForLoadState('networkidle');

    const backToUsersBreadcrumb = adminPage.locator('a[href="/admin/users"]:has-text("Back to Users")');
    assert(await backToUsersBreadcrumb.isVisible(), 'Breadcrumb "Back to Users" is visible');

    const inviteHeading = adminPage.locator('h1:has-text("Invite New User")');
    assert(await inviteHeading.isVisible(), 'Heading "Invite New User" is visible');

    // Form inputs
    const fullNameInput = adminPage.locator('input#fullName');
    const emailInput = adminPage.locator('input#email');
    assert(await fullNameInput.isVisible(), 'Full Name input is visible');
    assert(await emailInput.isVisible(), 'Email Address input is visible');

    // Business Owner selected by default: Member ID & Preset should NOT be visible
    const memberIdSection = adminPage.locator('input#memberId');
    assert(await memberIdSection.count() === 0, 'Member ID input is hidden when Business Owner is selected');

    // Click Buzl Member role card
    const buzlMemberCard = adminPage.locator('span:has-text("Buzl Member")').first();
    await buzlMemberCard.click();
    await adminPage.waitForTimeout(150);

    // Now Member ID & Preset MUST be visible
    assert(await memberIdSection.isVisible(), 'Member ID input appears dynamically when Buzl Member is selected');
    const presetSelect = adminPage.locator('select#permissionPreset');
    assert(await presetSelect.isVisible(), 'Permission Preset select appears dynamically for Buzl Member');

    // Click Platform Admin role card
    const adminRoleCard = adminPage.locator('span:has-text("Platform Admin")').first();
    await adminRoleCard.click();
    await adminPage.waitForTimeout(150);

    const adminNotice = adminPage.locator('text=Administrative Privileges');
    assert(await adminNotice.isVisible(), 'Platform Admin privilege warning notice appears when Admin is selected');
    assert(await memberIdSection.count() === 0, 'Member ID input is hidden when Platform Admin is selected');

    // ----------------------------------------------------
    // SUITE 5: User Detail & Manage UX
    // ----------------------------------------------------
    console.log('\n➡️ SUITE 5: User Detail & Manage UX (Profile, Auth Details, Associated Businesses)');
    // Go to admin users list and find owner user to inspect
    await adminPage.goto(`${BASE_URL}/admin/users`);
    await adminPage.waitForLoadState('networkidle');

    const ownerRow = adminPage.locator(`table tbody tr:has-text("${ownerEmail}")`);
    assert(await ownerRow.count() > 0, `User row for ${ownerEmail} exists`);

    const ownerManageBtn = ownerRow.locator('a:has-text("Manage")');
    await ownerManageBtn.click();
    await adminPage.waitForURL((url) => url.pathname.startsWith('/admin/users/') && url.pathname !== '/admin/users' && !url.pathname.includes('/new'), { timeout: 15000 });
    assert(adminPage.url().includes('/admin/users/'), 'Navigated to user management detail screen');

    // Verify sections on Detail page
    const detailBreadcrumb = adminPage.locator('a[href="/admin/users"]:has-text("Back to Users")');
    assert(await detailBreadcrumb.isVisible(), 'Back to Users breadcrumb is visible on detail page');

    const profileCard = adminPage.locator('h2:has-text("Profile & Role Settings")');
    assert(await profileCard.isVisible(), 'Profile & Role Settings section is visible');

    const authDetailsCard = adminPage.locator('h2:has-text("Authentication & Identity Details")');
    assert(await authDetailsCard.isVisible(), 'Authentication & Identity Details section is visible');

    const authEmailDisplay = adminPage.locator(`div:has-text("${ownerEmail}")`);
    assert(await authEmailDisplay.count() > 0, 'Auth Email is displayed in metadata section');

    const associatedBusinessesCard = adminPage.locator('h2:has-text("Associated Businesses")');
    assert(await associatedBusinessesCard.isVisible(), 'Associated Businesses section is visible');

    const dangerZoneCard = adminPage.locator('h2:has-text("Administrative Actions")');
    assert(await dangerZoneCard.isVisible(), 'Administrative Actions / Danger Zone section is visible');

    const resetPasswordBtn = adminPage.locator('button:has-text("Send Password Reset")');
    assert(await resetPasswordBtn.isVisible(), '"Send Password Reset" button is visible');

    const revokeSessionsBtn = adminPage.locator('button:has-text("Revoke All Sessions")');
    assert(await revokeSessionsBtn.isVisible(), '"Revoke All Sessions" button is visible');

    // ----------------------------------------------------
    // SUITE 6: Admin Self-Protection Enforcement
    // ----------------------------------------------------
    console.log('\n➡️ SUITE 6: Admin Self-Protection Enforcement');
    // Navigate to admin's own manage page
    await adminPage.goto(`${BASE_URL}/admin/users`);
    await adminPage.waitForLoadState('networkidle');

    const myAdminRow = adminPage.locator(`table tbody tr:has-text("${adminEmail}")`);
    const myAdminManageBtn = myAdminRow.locator('a:has-text("Manage")');
    await myAdminManageBtn.click();
    await adminPage.waitForURL((url) => url.pathname.startsWith('/admin/users/') && url.pathname !== '/admin/users' && !url.pathname.includes('/new'), { timeout: 15000 });

    // Self indicator badge
    const selfBadge = adminPage.locator('text=Current Admin (You)');
    assert(await selfBadge.isVisible(), '"Current Admin (You)" indicator badge is visible on own account');

    // Self-Account Protection banner
    const selfProtectionBanner = adminPage.locator('text=Self-Account Protection Active');
    assert(await selfProtectionBanner.isVisible(), '"Self-Account Protection Active" banner is visible');

    // Role selector is disabled
    const roleSelect = adminPage.locator('select#editRole');
    assert(await roleSelect.isDisabled(), 'Platform Role selector is disabled for self-admin');

    // Status selector is disabled
    const statusSelect = adminPage.locator('select#editAccountStatus');
    assert(await statusSelect.isDisabled(), 'Account Status selector is disabled for self-admin');

    // ----------------------------------------------------
    // SUITE 7: Modal Confirmations for Destructive Actions
    // ----------------------------------------------------
    console.log('\n➡️ SUITE 7: Modal Confirmations for Destructive Actions');
    // Navigate back to owner user
    await adminPage.goto(`${BASE_URL}/admin/users`);
    await adminPage.waitForLoadState('networkidle');

    const targetOwnerRow = adminPage.locator(`table tbody tr:has-text("${ownerEmail}")`);
    await targetOwnerRow.locator('a:has-text("Manage")').click();
    await adminPage.waitForURL((url) => url.pathname.startsWith('/admin/users/') && url.pathname !== '/admin/users' && !url.pathname.includes('/new'), { timeout: 15000 });

    // Test Revoke Sessions modal
    const revokeBtn = adminPage.locator('button:has-text("Revoke All Sessions")');
    await revokeBtn.waitFor({ state: 'visible', timeout: 10000 });
    await revokeBtn.click();
    await adminPage.waitForTimeout(200);

    const revokeModal = adminPage.locator('h3:has-text("Revoke All Sessions?")');
    assert(await revokeModal.isVisible(), 'Confirmation modal pops up on clicking Revoke All Sessions');

    const cancelRevokeBtn = adminPage.locator('button:has-text("Cancel")').last();
    await cancelRevokeBtn.click();
    await adminPage.waitForTimeout(200);
    assert(await revokeModal.count() === 0, 'Cancel button safely closes the Revoke modal');

    // Test Suspend Account modal
    const targetStatusSelect = adminPage.locator('select#editAccountStatus');
    await targetStatusSelect.selectOption('suspended');

    const saveChangesBtn = adminPage.locator('button:has-text("Save Account Changes")');
    await saveChangesBtn.click();
    await adminPage.waitForTimeout(200);

    const suspendModal = adminPage.locator('h3:has-text("Suspend User Account?")');
    assert(await suspendModal.isVisible(), 'Confirmation modal pops up before suspending user account');

    const cancelSuspendBtn = adminPage.locator('button:has-text("Cancel")').last();
    await cancelSuspendBtn.click();
    await adminPage.waitForTimeout(200);
    assert(await suspendModal.count() === 0, 'Cancel button safely closes the Suspend modal without saving');

    await adminContext.close();

    // ----------------------------------------------------
    // SUITE 8: Unauthorized Access Denial (RBAC Security Invariant)
    // ----------------------------------------------------
    console.log('\n➡️ SUITE 8: Unauthorized Access Denial (RBAC Security Invariant)');
    // 8.1 Business Owner denied
    const ownerContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const ownerPage = await ownerContext.newPage();

    await loginWithPassword(ownerPage, ownerEmail, ownerPassword);
    assert(ownerPage.url().includes('/dashboard'), 'Owner logged in to /dashboard');

    // Attempt direct navigation to /admin/users
    await ownerPage.goto(`${BASE_URL}/admin/users`);
    await ownerPage.waitForLoadState('networkidle');

    assert(!ownerPage.url().includes('/admin/users'), 'Business Owner is blocked from /admin/users');
    assert(ownerPage.url().includes('/dashboard'), 'Business Owner redirected to /dashboard');

    // Attempt direct navigation to /admin/users/new
    await ownerPage.goto(`${BASE_URL}/admin/users/new`);
    await ownerPage.waitForLoadState('networkidle');

    assert(!ownerPage.url().includes('/admin/users/new'), 'Business Owner is blocked from /admin/users/new');
    assert(ownerPage.url().includes('/dashboard'), 'Business Owner redirected to /dashboard');

    await ownerContext.close();

    // 8.2 Buzl Member denied /admin/users
    const memberContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const memberPage = await memberContext.newPage();

    await loginWithPassword(memberPage, memberEmail, memberPassword);

    await memberPage.goto(`${BASE_URL}/admin/users`);
    await memberPage.waitForLoadState('networkidle');

    assert(!memberPage.url().includes('/admin/users'), 'Buzl Member is blocked from /admin/users');
    assert(memberPage.url().includes('/admin/businesses/import') || memberPage.url().includes('/dashboard'), 'Buzl Member redirected away from admin users');

    await memberContext.close();

    // ----------------------------------------------------
    // SUITE 9: Mobile Viewports Responsiveness (375px, 390px, 430px)
    // ----------------------------------------------------
    console.log('\n➡️ SUITE 9: Mobile Viewports Responsiveness (375px, 390px, 430px)');
    for (const width of [375, 390, 430]) {
      console.log(`  Testing mobile viewport: ${width}x667`);
      const mobileContext = await browser.newContext({ viewport: { width, height: 667 } });
      const mobilePage = await mobileContext.newPage();

      await loginWithPassword(mobilePage, adminEmail, adminPassword);

      // Navigate to /admin/users
      await mobilePage.goto(`${BASE_URL}/admin/users`);
      await mobilePage.waitForLoadState('networkidle');

      // Check no horizontal scroll
      const scrollWidth = await mobilePage.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await mobilePage.evaluate(() => document.documentElement.clientWidth);
      assert(scrollWidth <= clientWidth, `No horizontal scroll on ${width}px (/admin/users): scrollWidth=${scrollWidth}, clientWidth=${clientWidth}`);

      // Verify mobile stacked cards are visible and desktop table is hidden
      const mobileCards = mobilePage.locator('.block.md\\:hidden .rounded-xl');
      await mobileCards.first().waitFor({ state: 'visible', timeout: 10000 });
      assert(await mobileCards.count() > 0, `Stacked mobile user cards rendered on ${width}px`);

      // Verify first mobile card contains Manage link
      const firstManageLink = mobileCards.first().locator('a:has-text("Manage")');
      await firstManageLink.waitFor({ state: 'visible', timeout: 5000 });
      assert(await firstManageLink.isVisible(), `Manage link is visible on mobile user card (${width}px)`);

      // Navigate to /admin/users/new on mobile
      await mobilePage.goto(`${BASE_URL}/admin/users/new`);
      await mobilePage.waitForLoadState('networkidle');

      const newScrollWidth = await mobilePage.evaluate(() => document.documentElement.scrollWidth);
      const newClientWidth = await mobilePage.evaluate(() => document.documentElement.clientWidth);
      assert(newScrollWidth <= newClientWidth, `No horizontal scroll on ${width}px (/admin/users/new): scrollWidth=${newScrollWidth}, clientWidth=${newClientWidth}`);

      await mobileContext.close();
    }

    console.log('\n================================================================');
    console.log('✅ ALL ADMIN USER MANAGEMENT UX BROWSER SMOKE TESTS PASSED!');
    console.log('================================================================');
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error('\n❌ TEST SUITE FAILED:', err);
  process.exit(1);
});
