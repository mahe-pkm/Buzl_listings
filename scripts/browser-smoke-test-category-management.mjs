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

async function logout(page) {
  await page.goto(`${BASE_URL}/auth/logout`);
  await page.waitForURL((url) => url.pathname.includes('/login') || url.pathname === '/', { timeout: 10000 });
  await page.waitForLoadState('networkidle');
}

async function main() {
  console.log('================================================================');
  console.log('🚀 CATEGORY MANAGEMENT TAXONOMY & RBAC BROWSER SMOKE TEST');
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

  async function cleanupTestCategories() {
    if (supabase && !BASE_URL.includes('rclk.in')) {
      await supabase.from('categories').delete().like('slug', '%smoke-category%');
    }
    if (BASE_URL.includes('rclk.in')) {
      try {
        const { execSync } = await import('node:child_process');
        execSync(
          'ssh -o StrictHostKeyChecking=no root@213.210.37.204 "docker exec buzl-listing-db-1 psql -U postgres -d postgres -c \\"delete from categories where slug like \'%smoke-category%\';\\""',
          { stdio: 'pipe' }
        );
      } catch {
        // best-effort cleanup
      }
    }
  }

  // Pre-cleanup any stale test categories
  await cleanupTestCategories();

  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  try {
    // ============================================================
    // SUITE 1: Platform Admin Navigation & Category Taxonomy View
    // ============================================================
    console.log('➡️ SUITE 1: Platform Admin Navigation & Taxonomy View');
    await loginWithPassword(page, adminEmail, adminPassword);
    assert(!page.url().includes('/login'), 'Admin signed in successfully');

    // Verify Categories in sidebar
    const adminCategoriesNav = page.locator('aside nav a[href="/admin/categories"]');
    assert(await adminCategoriesNav.isVisible(), 'Sidebar contains Categories link for Admin');

    // Click Categories navigation
    await adminCategoriesNav.click();
    await page.waitForURL('**/admin/categories', { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    assert(page.url().includes('/admin/categories'), 'Admin navigated to /admin/categories');
    assert(await page.locator('h1:has-text("Category Taxonomy")').isVisible(), 'Category Taxonomy heading visible');

    // Check metric cards
    assert(await page.locator('text="Total Categories"').first().isVisible(), 'Total Categories card visible');
    assert(await page.locator('text="Active"').first().isVisible(), 'Active Categories card visible');
    assert(await page.locator('text="Inactive"').first().isVisible(), 'Inactive Categories card visible');
    assert(await page.locator('text="Top-Level"').first().isVisible(), 'Top-Level card visible');
    assert(await page.locator('text="In Use"').first().isVisible(), 'In Use card visible');

    // Admin has Add Category button
    const addCatBtn = page.locator('button:has-text("Add Category")');
    assert(await addCatBtn.isVisible(), 'Admin has active "+ Add Category" button');

    // Table is present with headers
    const tableHeaders = page.locator('thead th');
    assert((await tableHeaders.count()) === 7, 'Desktop table contains 7 columns');

    // ============================================================
    // SUITE 2: Listing Manager Read-Only Navigation & View
    // ============================================================
    console.log('\n➡️ SUITE 2: Listing Manager Read-Only Navigation & View');
    await logout(page);
    await loginWithPassword(page, managerEmail, managerPassword);

    const managerCategoriesNav = page.locator('aside nav a[href="/admin/categories"]');
    assert(await managerCategoriesNav.isVisible(), 'Sidebar contains Categories link for Listing Manager');

    await managerCategoriesNav.click();
    await page.waitForURL('**/admin/categories', { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    assert(await page.locator('h1:has-text("Category Taxonomy")').isVisible(), 'Listing Manager can view Category Taxonomy');
    assert(await page.locator('span:has-text("Read-Only Reference")').isVisible(), 'Listing Manager sees "Read-Only Reference" badge');
    assert(!(await page.locator('button:has-text("Add Category")').isVisible()), 'Add Category button is strictly HIDDEN from Listing Manager');
    assert(await page.locator('span:has-text("View only")').first().isVisible(), 'Listing Manager sees "View only" badge in table rows');
    assert(!(await page.locator('button:has-text("Edit")').isVisible()), 'Edit buttons are strictly HIDDEN from Listing Manager');
    assert(!(await page.locator('button:has-text("Deactivate")').isVisible()), 'Deactivate buttons are strictly HIDDEN from Listing Manager');

    // ============================================================
    // SUITE 3: Onboarding Member Read-Only Navigation & View
    // ============================================================
    console.log('\n➡️ SUITE 3: Onboarding Member Read-Only Navigation & View');
    await logout(page);
    await loginWithPassword(page, memberEmail, memberPassword);

    const memberCategoriesNav = page.locator('aside nav a[href="/admin/categories"]');
    assert(await memberCategoriesNav.isVisible(), 'Sidebar contains Categories link for Onboarding Member');

    await memberCategoriesNav.click();
    await page.waitForURL('**/admin/categories', { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    assert(await page.locator('h1:has-text("Category Taxonomy")').isVisible(), 'Onboarding Member can view Category Taxonomy');
    assert(await page.locator('span:has-text("Read-Only Reference")').isVisible(), 'Onboarding Member sees "Read-Only Reference" badge');
    assert(!(await page.locator('button:has-text("Add Category")').isVisible()), 'Add Category button is strictly HIDDEN from Onboarding Member');

    // ============================================================
    // SUITE 4: Business Owner & Unauthenticated RBAC Protection
    // ============================================================
    console.log('\n➡️ SUITE 4: Business Owner & Unauthenticated RBAC Protection');
    await logout(page);

    // Unauthenticated access
    await page.goto(`${BASE_URL}/admin/categories`);
    await page.waitForURL('**/login**', { timeout: 10000 });
    assert(page.url().includes('/login'), 'Unauthenticated user redirected to /login');
    assert(page.url().includes('redirect=%2Fadmin%2Fcategories') || page.url().includes('redirect='), 'Redirect query parameter preserved');

    // Business Owner login
    await loginWithPassword(page, ownerEmail, ownerPassword);
    const ownerCategoriesNav = page.locator('aside nav a[href="/admin/categories"]');
    assert(!(await ownerCategoriesNav.isVisible()), 'Sidebar strictly HIDES Categories link from Business Owner');

    // Direct URL navigation attempt by Business Owner
    await page.goto(`${BASE_URL}/admin/categories`);
    await page.waitForURL('**/dashboard**', { timeout: 10000 });
    assert(page.url().includes('/dashboard') && !page.url().includes('/admin/categories'), 'Business Owner strictly redirected to /dashboard away from /admin/categories');

    // ============================================================
    // SUITE 5: Search & Filter Toolbar Functionality
    // ============================================================
    console.log('\n➡️ SUITE 5: Search & Filter Toolbar Functionality');
    await logout(page);
    await loginWithPassword(page, adminEmail, adminPassword);
    await page.goto(`${BASE_URL}/admin/categories`);
    await page.waitForLoadState('networkidle');

    // Search by Name
    const searchInput = page.locator('input[placeholder*="Search by category name"]');
    await searchInput.fill('Restaurant');
    await page.waitForTimeout(300);

    const restaurantRows = page.locator('tbody tr:has-text("Restaurant")');
    assert((await restaurantRows.count()) >= 1, 'Search by Name "Restaurant" filters table rows');

    // Clear search
    const clearSearchBtn = page.locator('button[aria-label="Clear search"]');
    await clearSearchBtn.click();
    await page.waitForTimeout(200);
    assert((await searchInput.inputValue()) === '', 'Clear search button empties search input');

    // Search by Slug
    await searchInput.fill('web-design');
    await page.waitForTimeout(300);
    assert(await page.locator('tbody tr:has-text("Web Design Company")').isVisible(), 'Search by Slug filters table correctly');

    await searchInput.fill('');
    await page.waitForTimeout(200);

    // Status filter
    const statusSelect = page.locator('#status-filter');
    await statusSelect.selectOption('active');
    await page.waitForTimeout(300);
    assert(await page.locator('tbody tr').first().isVisible(), 'Status filter Active displays rows');

    // Hierarchy filter
    const hierarchySelect = page.locator('#hierarchy-filter');
    await hierarchySelect.selectOption('root');
    await page.waitForTimeout(300);
    assert(await page.locator('tbody tr:has-text("Top-Level")').first().isVisible(), 'Hierarchy filter Top-Level displays root categories');

    // Reset filters button
    const resetFiltersBtn = page.locator('button:has-text("Reset all filters")');
    if (await resetFiltersBtn.isVisible()) {
      await resetFiltersBtn.click();
      await page.waitForTimeout(200);
      assert((await statusSelect.inputValue()) === 'all', 'Reset filters restores status to all');
    }

    // ============================================================
    // SUITE 6: Category Creation & Auto-Slug (Admin)
    // ============================================================
    console.log('\n➡️ SUITE 6: Category Creation & Auto-Slug');
    await page.click('button:has-text("Add Category")');
    await page.waitForSelector('div[role="dialog"]', { state: 'visible' });
    assert(await page.locator('h2:has-text("Create New Category")').isVisible(), 'Create New Category modal is open');

    // Test form inputs
    const nameInput = page.locator('#cat-name');
    const slugInput = page.locator('#cat-slug');
    const sortInput = page.locator('#cat-sort');

    await nameInput.fill('Smoke Test Category');
    assert((await slugInput.inputValue()) === 'smoke-test-category', 'Category slug auto-generates from name');

    await sortInput.fill('99');
    await page.click('button[type="submit"]:has-text("Create Category")');

    // Modal closes and success notice appears
    await page.waitForSelector('div[role="dialog"]', { state: 'hidden', timeout: 10000 });
    assert(await page.locator('div[role="alert"]:has-text("created successfully")').isVisible(), 'Success notice displayed for category creation');

    // Check category appears in table
    await searchInput.fill('Smoke Test Category');
    await page.waitForTimeout(300);
    assert(await page.locator('tbody tr:has-text("Smoke Test Category")').isVisible(), 'Created category is visible in table');
    assert(await page.locator('tbody tr:has-text("smoke-test-category")').isVisible(), 'Created slug is visible in table');

    // ============================================================
    // SUITE 7: Duplicate Slug Rejection (Admin)
    // ============================================================
    console.log('\n➡️ SUITE 7: Duplicate Slug Rejection');
    await searchInput.fill('');
    await page.click('button:has-text("Add Category")');
    await page.waitForSelector('div[role="dialog"]', { state: 'visible' });

    await page.fill('#cat-name', 'Another Smoke Category');
    await page.fill('#cat-slug', 'smoke-test-category');
    await page.click('button[type="submit"]:has-text("Create Category")');

    // Modal stays open and displays friendly error
    const errorAlert = page.locator('div[role="dialog"] div[role="alert"]');
    await errorAlert.waitFor({ state: 'visible', timeout: 10000 });
    const errorText = await errorAlert.textContent();
    assert(errorText.includes('already exists'), 'Duplicate slug rejected with friendly error message');

    // Close modal
    await page.click('div[role="dialog"] button[aria-label="Close dialog"]');
    await page.waitForSelector('div[role="dialog"]', { state: 'hidden' });

    // ============================================================
    // SUITE 8: Category Editing (Admin)
    // ============================================================
    console.log('\n➡️ SUITE 8: Category Editing');
    await searchInput.fill('Smoke Test Category');
    await page.waitForTimeout(300);

    const editBtn = page.locator('tbody tr:has-text("Smoke Test Category") button:has-text("Edit")');
    await editBtn.click();

    await page.waitForSelector('div[role="dialog"]', { state: 'visible' });
    assert(await page.locator('h2:has-text("Edit Category")').isVisible(), 'Edit Category modal opened');
    assert((await page.locator('#cat-name').inputValue()) === 'Smoke Test Category', 'Edit modal pre-fills current category name');

    await page.fill('#cat-name', 'Updated Smoke Category');
    await page.fill('#cat-slug', 'updated-smoke-category');
    await page.fill('#cat-sort', '105');
    await page.click('button[type="submit"]:has-text("Update Category")');

    await page.waitForSelector('div[role="dialog"]', { state: 'hidden', timeout: 10000 });
    assert(await page.locator('div[role="alert"]:has-text("updated successfully")').isVisible(), 'Success notice displayed for category update');

    await searchInput.fill('Updated Smoke Category');
    await page.waitForTimeout(300);
    assert(await page.locator('tbody tr:has-text("Updated Smoke Category")').isVisible(), 'Updated name is reflected in table');
    assert(await page.locator('tbody tr:has-text("updated-smoke-category")').isVisible(), 'Updated slug is reflected in table');
    assert(await page.locator('tbody tr:has-text("105")').isVisible(), 'Updated sort order is reflected in table');

    // ============================================================
    // SUITE 9: Deactivation Protection (Published Listings Guard)
    // ============================================================
    console.log('\n➡️ SUITE 9: Deactivation Protection (Published Listings Guard)');
    await searchInput.fill('');
    await page.waitForTimeout(300);

    // Find a category that has published listings (e.g. Restaurant)
    const pubCatRow = page.locator('tbody tr:has(span:has-text("pub"))').first();
    const pubCatName = await pubCatRow.locator('td').first().textContent();
    console.log(`  ℹ️ Testing published category guard with: ${pubCatName?.trim()}`);

    const pubDeactivateBtn = pubCatRow.locator('button:has-text("Deactivate")');
    await pubDeactivateBtn.click();

    await page.waitForSelector('div[role="dialog"]', { state: 'visible' });
    assert(await page.locator('h2:has-text("Deactivate Category")').isVisible(), 'Deactivate confirmation modal opened');

    // Confirm warning banner is displayed
    assert(await page.locator('text="Cannot Deactivate (Published Listings Exist)"').first().isVisible(), 'Warning alert is displayed');

    // Confirm button must be disabled
    const confirmDeactBtn = page.locator('div[role="dialog"] button:has-text("Confirm Deactivation")');
    assert(await confirmDeactBtn.isDisabled(), 'Confirm Deactivation button is strictly DISABLED when published listings exist');

    // Cancel modal
    await page.click('div[role="dialog"] button:has-text("Cancel")');
    await page.waitForSelector('div[role="dialog"]', { state: 'hidden' });

    // ============================================================
    // SUITE 10: Deactivate & Activate Unreferenced Category
    // ============================================================
    console.log('\n➡️ SUITE 10: Deactivate & Activate Unreferenced Category');
    await searchInput.fill('Updated Smoke Category');
    await page.waitForTimeout(300);

    const smokeRow = page.locator('tbody tr:has-text("Updated Smoke Category")');
    const smokeDeactivateBtn = smokeRow.locator('button:has-text("Deactivate")');
    await smokeDeactivateBtn.click();

    await page.waitForSelector('div[role="dialog"]', { state: 'visible' });
    const unreferencedConfirmBtn = page.locator('div[role="dialog"] button:has-text("Confirm Deactivation")');
    assert(!(await unreferencedConfirmBtn.isDisabled()), 'Confirm Deactivation button is ENABLED for category with 0 published listings');

    await unreferencedConfirmBtn.click();
    await page.waitForSelector('div[role="dialog"]', { state: 'hidden', timeout: 10000 });

    assert(await page.locator('div[role="alert"]:has-text("deactivated")').isVisible(), 'Notice displayed confirming category deactivated');

    // Verify status badge changed to Inactive
    const inactiveBadge = page.locator('tbody tr:has-text("Updated Smoke Category") span:has-text("Inactive")');
    assert(await inactiveBadge.isVisible(), 'Category status badge is now Inactive');

    // Reactivate
    const activateBtn = page.locator('tbody tr:has-text("Updated Smoke Category") button:has-text("Activate")');
    await activateBtn.click();
    await page.waitForTimeout(1000);

    const activeBadge = page.locator('tbody tr:has-text("Updated Smoke Category") span:has-text("Active")');
    assert(await activeBadge.isVisible(), 'Category status badge successfully restored to Active');

    // Clean up temporary category
    await cleanupTestCategories();

    // ============================================================
    // SUITE 11: Mobile Viewport 375px
    // ============================================================
    console.log('\n➡️ SUITE 11: Mobile Viewport 375px');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${BASE_URL}/admin/categories`);
    await page.waitForLoadState('networkidle');

    const overflow375 = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    assert(!overflow375, 'Mobile 375px has zero horizontal viewport overflow');

    // Check mobile hamburger button
    const mobileMenuBtn = page.locator('button[aria-label="Toggle Navigation"]');
    assert(await mobileMenuBtn.isVisible(), 'Mobile hamburger button is visible');

    // Open drawer and check Categories link
    await mobileMenuBtn.click();
    await page.waitForTimeout(300);
    const mobileCatLink = page.locator('div.z-50 a[href="/admin/categories"]');
    assert(await mobileCatLink.isVisible(), 'Categories link is visible in mobile drawer (375px)');

    // ============================================================
    // SUITE 12: Mobile Viewport 390px
    // ============================================================
    console.log('\n➡️ SUITE 12: Mobile Viewport 390px');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE_URL}/admin/categories`);
    await page.waitForLoadState('networkidle');

    const overflow390 = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    assert(!overflow390, 'Mobile 390px has zero horizontal viewport overflow');

    // ============================================================
    // SUITE 13: Mobile Viewport 430px
    // ============================================================
    console.log('\n➡️ SUITE 13: Mobile Viewport 430px');
    await page.setViewportSize({ width: 430, height: 932 });
    await page.goto(`${BASE_URL}/admin/categories`);
    await page.waitForLoadState('networkidle');

    const overflow430 = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    assert(!overflow430, 'Mobile 430px has zero horizontal viewport overflow');

    console.log('\n================================================================');
    console.log('✅ ALL CATEGORY MANAGEMENT TESTS PASSED SUCCESSFULLY!');
    console.log('================================================================\n');
  } finally {
    await cleanupTestCategories();
    await browser.close();
  }
}

main().catch((err) => {
  console.error('\n❌ TEST SUITE FAILED WITH ERROR:');
  console.error(err);
  process.exit(1);
});
