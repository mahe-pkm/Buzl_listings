import { chromium } from 'playwright';
import { loadLocalFixtureEnvironment } from './lib/local-fixture-env.mjs';

loadLocalFixtureEnvironment({ optional: true });

const BASE_URL = process.env.TEST_BASE_URL || 'https://listing.rclk.in';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const results = {
  health: false,
  indexingGuards: false,
  whatsappUI: false,
  ownerJourney: false,
  adminJourney: false,
  publicListing: false,
  mobile375: false,
  mobile390: false,
  mobile430: false,
  privacy: false,
  logs: [],
};

function log(msg) {
  console.log(msg);
  results.logs.push(msg);
}

function assert(condition, message) {
  if (!condition) {
    log(`  ❌ FAIL: ${message}`);
    throw new Error(message);
  }
  log(`  ✓ PASS: ${message}`);
}

async function run() {
  log('==================================================');
  log('📋 STAGING TEAM REVIEW — AUTOMATED SYSTEM AUDIT');
  log(`Base URL: ${BASE_URL}`);
  log('==================================================\n');

  // Load credentials from environment / local fixtures
  const ownerEmail = process.env.STAGING_OWNER_EMAIL || process.env.LOCAL_FIXTURE_OWNER_EMAIL || 'owner@buzl.test';
  const ownerPassword = process.env.STAGING_OWNER_PASSWORD || process.env.LOCAL_FIXTURE_OWNER_PASSWORD;
  const adminEmail = process.env.STAGING_ADMIN_EMAIL || process.env.LOCAL_FIXTURE_ADMIN_EMAIL || 'admin@buzl.test';
  const adminPassword = process.env.STAGING_ADMIN_PASSWORD || process.env.LOCAL_FIXTURE_ADMIN_PASSWORD;
  const memberEmail = process.env.STAGING_MEMBER_EMAIL || process.env.LOCAL_FIXTURE_MEMBER_EMAIL || 'member@buzl.test';
  const memberPassword = process.env.STAGING_MEMBER_PASSWORD || process.env.LOCAL_FIXTURE_MEMBER_PASSWORD;

  log('✓ Loaded staging demo credentials');

  // ----------------------------------------------------
  // 1. HEALTH & INDEXING GUARDS
  // ----------------------------------------------------
  log('\n--- 1. Health & Staging Indexing Guards ---');
  const healthRes = await fetch(`${BASE_URL}/api/health`);
  assert(healthRes.status === 200, `Health check returned HTTP 200: status=${healthRes.status}`);
  assert(healthRes.headers.get('x-robots-tag')?.includes('noindex'), 'Health endpoint sends X-Robots-Tag: noindex');
  results.health = true;

  const robotsRes = await fetch(`${BASE_URL}/robots.txt`);
  const robotsText = await robotsRes.text();
  assert(robotsRes.status === 200, 'robots.txt returned HTTP 200');
  assert(robotsText.includes('Disallow: /'), 'robots.txt contains "Disallow: /"');
  assert(robotsRes.headers.get('x-robots-tag')?.includes('noindex'), 'robots.txt sends X-Robots-Tag: noindex');

  const sitemapRes = await fetch(`${BASE_URL}/sitemap.xml`);
  const sitemapText = await sitemapRes.text();
  assert(sitemapRes.status === 200, 'sitemap.xml returned HTTP 200');
  assert(!sitemapText.includes('<url>'), 'sitemap.xml has empty urlset (no indexed URLs)');
  results.indexingGuards = true;

  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
  });

  try {
    // ----------------------------------------------------
    // 2. WHATSAPP UI & AUTH TABS (/login & /signup)
    // ----------------------------------------------------
    log('\n--- 2. WhatsApp UI Preview & Auth Tabs ---');
    const authContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const authPage = await authContext.newPage();

    // Check /login tabs
    await authPage.goto(`${BASE_URL}/login`);
    await authPage.waitForLoadState('networkidle');

    const loginTabs = authPage.locator('div[role="tablist"] button[role="tab"]');
    assert(await loginTabs.count() === 3, 'Login has exactly 3 tabs');
    assert(await loginTabs.nth(0).innerText() === 'Email Code (OTP)', 'Login Tab 1 is "Email Code (OTP)"');
    assert(await loginTabs.nth(1).innerText() === 'WhatsApp OTP', 'Login Tab 2 is "WhatsApp OTP"');
    assert(await loginTabs.nth(2).innerText() === 'Password', 'Login Tab 3 is "Password"');
    assert(await loginTabs.nth(0).getAttribute('aria-selected') === 'true', 'Email OTP is default active tab');

    // Click WhatsApp tab on /login
    await loginTabs.nth(1).click();
    assert(await loginTabs.nth(1).getAttribute('aria-selected') === 'true', 'WhatsApp tab selected');
    assert(await authPage.locator('text=WhatsApp verification is coming soon').isVisible(), 'Coming soon notice visible');
    assert(await authPage.locator('text=WhatsApp OTP delivery is being activated').isVisible(), 'Activation pending explanation visible');
    assert(await authPage.locator('#whatsapp-country').isVisible(), 'Country selector visible');
    assert(await authPage.locator('#whatsapp-phone').isVisible(), 'Phone input visible');

    // Test phone validation
    await authPage.fill('#whatsapp-phone', '123');
    await authPage.click('button[type="submit"]:has-text("Continue with WhatsApp")');
    assert(await authPage.locator('div[role="alert"]:has-text("⚠")').isVisible(), 'Invalid phone triggers validation error');

    // Test valid phone submit (activation notice, zero fake OTP)
    await authPage.fill('#whatsapp-phone', '9876543210');
    await authPage.click('button[type="submit"]:has-text("Continue with WhatsApp")');
    const infoBox = authPage.locator('.bg-\\[\\#EBF5FF\\]');
    assert(await infoBox.isVisible(), 'Valid phone displays activation info banner');
    assert((await infoBox.innerText()).includes('is being activated'), 'Banner explains activation pending');
    assert(await authPage.locator('#otp-token').count() === 0, 'No fake OTP 6-digit input rendered');

    // Fallback switch to Email Code
    const fallbackBtn = authPage.locator('button:has-text("Use Email Code →")');
    assert(await fallbackBtn.isVisible(), '"Use Email Code →" action is visible');
    await fallbackBtn.click();
    assert(await authPage.locator('#otp-email').isVisible(), 'Switched back to Email OTP tab');

    // Check /signup tabs
    await authPage.goto(`${BASE_URL}/signup`);
    await authPage.waitForLoadState('networkidle');

    const signupTabs = authPage.locator('div[role="tablist"] button[role="tab"]');
    assert(await signupTabs.count() === 3, 'Signup has exactly 3 tabs');
    assert(await signupTabs.nth(0).innerText() === 'Email Code (OTP)', 'Signup Tab 1 is "Email Code (OTP)"');
    assert(await signupTabs.nth(1).innerText() === 'WhatsApp OTP', 'Signup Tab 2 is "WhatsApp OTP"');
    assert(await signupTabs.nth(2).innerText() === 'Password', 'Signup Tab 3 is "Password"');

    await signupTabs.nth(1).click();
    assert(await authPage.locator('text=WhatsApp verification is coming soon').isVisible(), 'Signup coming soon notice visible');
    assert(await authPage.locator('#signup-whatsapp-phone').isVisible(), 'Signup WhatsApp phone input visible');

    await authContext.close();
    results.whatsappUI = true;

    // ----------------------------------------------------
    // 3. OWNER JOURNEY REVIEW
    // ----------------------------------------------------
    log('\n--- 3. Owner Journey Review ---');
    const ownerContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const ownerPage = await ownerContext.newPage();

    // Owner login
    await ownerPage.goto(`${BASE_URL}/login`);
    await ownerPage.waitForLoadState('networkidle');
    await ownerPage.locator('button[role="tab"]:has-text("Password")').click();
    await ownerPage.fill('#password-email', ownerEmail);
    await ownerPage.fill('#password-input', ownerPassword);
    await ownerPage.click('button[type="submit"]:has-text("Sign in")');
    await ownerPage.waitForURL('**/dashboard**');
    assert(ownerPage.url().includes('/dashboard'), 'Owner successfully logged in to /dashboard');

    // Verify Owner CANNOT self-publish or self-verify
    await ownerPage.goto(`${BASE_URL}/admin/businesses`);
    await ownerPage.waitForLoadState('networkidle');
    assert(!ownerPage.url().includes('/admin/businesses'), 'Owner denied access to /admin/businesses (redirected)');

    // Start New Business Creation
    await ownerPage.goto(`${BASE_URL}/dashboard/businesses/new`);
    await ownerPage.waitForLoadState('networkidle');

    const testTimestamp = Date.now();
    const testBusinessName = `Team Review Business ${testTimestamp}`;

    // Step 1: Business Details
    assert(await ownerPage.locator('h2:has-text("Step 1: Business Details")').isVisible(), 'Step 1 is "Step 1: Business Details"');
    assert(await ownerPage.locator('label[for="canonical_name"]:has-text("Business Name")').isVisible(), 'Label is "Business Name" (not canonical_name)');
    await ownerPage.fill('#canonical_name', testBusinessName);
    await ownerPage.fill('#description', 'Comprehensive staging team review test business showcasing all owner features.');
    await ownerPage.fill('#year_established', '2023');
    await ownerPage.click('button:has-text("Next Step →")');

    // Step 2: Location & Coverage Mode (Zero Jargon)
    assert(await ownerPage.locator('h2:has-text("Step 2: Location & Coverage Mode")').isVisible(), 'Step 2 Location is visible');
    assert(await ownerPage.locator('text=PostGIS').count() === 0, 'Zero instances of "PostGIS" jargon');
    assert(await ownerPage.locator('text=Geospatial Coordinates').count() === 0, 'Zero instances of "Geospatial Coordinates" jargon');
    const serviceAreaModeBtn = ownerPage.locator('button:has-text("Service-Area Only")');
    await serviceAreaModeBtn.click();
    await ownerPage.fill('#city', 'New Delhi');
    await ownerPage.fill('#state', 'Delhi');
    await ownerPage.fill('#country', 'India');
    await ownerPage.fill('input[placeholder="Enter coverage area..."]', 'South Delhi');
    await ownerPage.click('button:has-text("Add Area")');
    await ownerPage.click('button:has-text("Next Step →")');

    // Step 3: Contact Information & GBP Link
    assert(await ownerPage.locator('h2:has-text("Step 3: Contact Information")').isVisible(), 'Step 3 is "Step 3: Contact Information"');
    assert(await ownerPage.locator('label[for="google_business_profile_url"]:has-text("Google Business Profile Link")').isVisible(), 'Google Business Profile Link is visible');
    await ownerPage.fill('#primary_phone', '+91 98765 43210');
    await ownerPage.fill('#business_contact_email', 'contact@teamreview.test');
    await ownerPage.fill('#google_business_profile_url', 'https://maps.app.goo.gl/teamReview123');
    await ownerPage.click('button:has-text("Next Step →")');

    // Step 4: Category & Services
    assert(await ownerPage.locator('label:has-text("What services does your business offer?")').isVisible(), 'Step 4 asks "What services does your business offer?"');
    assert(await ownerPage.locator('text=No services added yet').isVisible(), 'Friendly empty state when 0 services');
    await ownerPage.fill('input[placeholder*="Service Name"]', 'Team Consultation');
    await ownerPage.fill('textarea[placeholder*="Service Description"]', 'In-depth consultation for local business optimization.');
    await ownerPage.click('button:has-text("+ Add Service")');
    assert(await ownerPage.locator('text=Team Consultation').isVisible(), 'Service added successfully');
    await ownerPage.click('button:has-text("Next Step →")');

    // Step 5: Products & Offerings
    assert(await ownerPage.locator('h2:has-text("Step 5: Products & Offerings (Optional)")').isVisible(), 'Step 5 is "Step 5: Products & Offerings (Optional)"');
    assert(await ownerPage.locator('text=No products added yet').isVisible(), 'Friendly empty state when 0 products');
    await ownerPage.fill('input[placeholder*="Ergonomic"]', 'Buzl Starter Pack');
    await ownerPage.fill('textarea[placeholder*="Key specifications"]', 'Starter package for digital directory visibility.');
    await ownerPage.click('button:has-text("+ Add Product")');
    assert(await ownerPage.locator('text=Buzl Starter Pack').isVisible(), 'Product added successfully');
    await ownerPage.click('button:has-text("Next Step →")');

    // Step 6: Media & Photo Gallery
    assert(await ownerPage.locator('h2:has-text("Step 6: Media & Photo Gallery")').isVisible(), 'Step 6 Media is visible');
    await ownerPage.click('button:has-text("Next Step →")');

    // Step 7: Hours & Social Links
    assert(await ownerPage.locator('h2:has-text("Step 7: Business Hours & Social Links")').isVisible(), 'Step 7 Hours & Social visible');
    await ownerPage.click('button:has-text("Next Step →")');

    // Step 8: Preview & Submit
    assert(await ownerPage.locator('h2:has-text("Step 8: Preview & Submit")').isVisible(), 'Step 8 Preview & Submit is visible');
    assert(await ownerPage.locator('text=Listing Readiness Summary').isVisible(), 'Listing Readiness Summary card visible');
    assert(await ownerPage.locator('text=Public Listing Preview').first().isVisible(), 'Public Listing Preview badge visible');

    // Check Owner cannot publish directly (no "Publish Listing" button in owner view)
    assert(await ownerPage.locator('button:has-text("Publish Listing")').count() === 0, 'Owner cannot self-publish');

    // Create listing as draft
    const createBtn = ownerPage.locator('button:has-text("Create Listing")');
    assert(await createBtn.isVisible(), 'Create Listing button visible');
    await createBtn.click();
    await ownerPage.waitForURL('**/dashboard/businesses/**/edit**', { timeout: 15000 });
    assert(ownerPage.url().includes('/edit'), 'Listing created and transitioned to edit view');

    // In edit view, navigate to Step 8 to submit for review
    await ownerPage.locator('button:has-text("Preview & Submit")').first().click();
    const submitBtn = ownerPage.locator('button:has-text("Submit for Review")');
    assert(await submitBtn.isVisible(), 'Submit for Review button visible in edit mode');
    await submitBtn.click();

    // Verify submission toast & Pending Review banner
    await ownerPage.waitForSelector('text=Your listing has been submitted for review', { timeout: 15000 });
    assert(await ownerPage.locator('text=Your listing has been submitted for review').isVisible(), 'Submission toast confirmed');
    await ownerPage.waitForSelector('text=Pending Review', { timeout: 10000 });
    assert(await ownerPage.locator('text=Pending Review').isVisible(), 'Pending Review banner visible');
    assert(await ownerPage.locator('text=under review by our moderation team').isVisible(), 'Banner explains moderation review policy');

    await ownerContext.close();
    results.ownerJourney = true;

    // ----------------------------------------------------
    // 4. ADMIN / MODERATION REVIEW
    // ----------------------------------------------------
    log('\n--- 4. Admin / Moderation Review ---');
    const adminContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const adminPage = await adminContext.newPage();

    // Admin login
    await adminPage.goto(`${BASE_URL}/login`);
    await adminPage.waitForLoadState('networkidle');
    await adminPage.locator('button[role="tab"]:has-text("Password")').click();
    await adminPage.fill('#password-email', adminEmail);
    await adminPage.fill('#password-input', adminPassword);
    await adminPage.click('button[type="submit"]:has-text("Sign in")');
    await adminPage.waitForURL('**/admin/**');
    assert(adminPage.url().includes('/admin'), 'Admin logged in successfully');

    // Navigate to admin business list
    await adminPage.goto(`${BASE_URL}/dashboard/businesses`);
    await adminPage.waitForLoadState('networkidle');
    assert(await adminPage.locator('th:has-text("Listing Status")').isVisible(), 'Table displays "Listing Status" header');

    // Find our pending review listing
    const targetRow = adminPage.locator(`td:has-text("${testBusinessName}")`);
    assert(await targetRow.count() > 0, 'Created business found in business list');
    await targetRow.locator('a').first().click();
    await adminPage.waitForLoadState('networkidle');

    // Navigate to Step 8
    await adminPage.locator('button:has-text("Preview & Submit")').first().click();

    // Admin sees Publish button
    const adminPublishBtn = adminPage.locator('button:has-text("Publish Listing")');
    assert(await adminPublishBtn.isVisible(), 'Admin sees "Publish Listing" button');
    await adminPublishBtn.click();

    // Verify Published Listing banner
    await adminPage.waitForSelector('text=Published Listing', { timeout: 15000 });
    assert(await adminPage.locator('text=Published Listing').isVisible(), 'Published Listing banner is visible');

    // Verify direct "View Public Listing ↗" button
    const viewPublicBtn = adminPage.locator('a:has-text("View Public Listing")');
    assert(await viewPublicBtn.isVisible(), '"View Public Listing ↗" action is visible in banner');
    const publicSlugHref = await viewPublicBtn.getAttribute('href');
    assert(Boolean(publicSlugHref && publicSlugHref.startsWith('/business/')), `Public link points to /business/ slug: ${publicSlugHref}`);

    await adminContext.close();
    results.adminJourney = true;

    // ----------------------------------------------------
    // 5. PUBLIC LISTING & PRIVACY REVIEW
    // ----------------------------------------------------
    log('\n--- 5. Public Listing & Privacy Review ---');
    const publicContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const publicPage = await publicContext.newPage();

    // Visit the published listing
    const publicRes = await publicPage.goto(`${BASE_URL}${publicSlugHref}`);
    assert(publicRes.status() === 200, `Public listing page returned HTTP 200: ${publicSlugHref}`);

    // Verify rendered public attributes
    assert(await publicPage.locator(`h1:has-text("${testBusinessName}")`).isVisible(), 'Public page displays business name');
    assert(await publicPage.locator('text=Team Consultation').isVisible(), 'Public page displays service name');
    assert(await publicPage.locator('text=In-depth consultation for local business optimization.').isVisible(), 'Public page displays service description');
    assert(await publicPage.locator('text=Buzl Starter Pack').isVisible(), 'Public page displays product name');
    assert(await publicPage.locator('text=Starter package for digital directory visibility.').isVisible(), 'Public page displays product description');
    assert(await publicPage.locator('a:has-text("View on Google")').isVisible(), 'Public page displays "View on Google" CTA');

    // Verify PRIVACY & NO LEAKS of internal values
    const pageHtml = await publicPage.content();
    assert(!pageHtml.includes('place_id'), 'Zero exposure of place_id in public DOM');
    assert(!pageHtml.includes('PostGIS'), 'Zero exposure of PostGIS in public DOM');
    assert(!pageHtml.includes('BUZL-M-'), 'Zero exposure of internal member_id in public DOM');
    assert(!pageHtml.includes(ownerEmail), 'Zero exposure of auth email in public DOM');

    // Verify Service-Area privacy on Laptech
    const laptechRes = await publicPage.goto(`${BASE_URL}/business/laptech`);
    if (laptechRes && laptechRes.status() === 200) {
      const laptechHtml = await publicPage.content();
      assert(!laptechHtml.includes('12/A Service Lane') && !laptechHtml.includes('Plot No'), 'Service area private address hidden');
      assert(!laptechHtml.includes('12.9716') && !laptechHtml.includes('77.5946'), 'Service area geo coordinates hidden');
    }

    await publicContext.close();
    results.publicListing = true;
    results.privacy = true;

    // ----------------------------------------------------
    // 6. MOBILE RESPONSIVENESS REVIEW (375px, 390px, 430px)
    // ----------------------------------------------------
    log('\n--- 6. Mobile Responsiveness Review (375px, 390px, 430px) ---');
    for (const width of [375, 390, 430]) {
      log(`  Evaluating mobile viewport: ${width}px...`);
      const mobileContext = await browser.newContext({ viewport: { width, height: 800 } });
      const mobilePage = await mobileContext.newPage();

      // Login page
      await mobilePage.goto(`${BASE_URL}/login`);
      await mobilePage.waitForLoadState('networkidle');
      let scrollWidth = await mobilePage.evaluate(() => document.documentElement.scrollWidth);
      let clientWidth = await mobilePage.evaluate(() => document.documentElement.clientWidth);
      assert(scrollWidth <= clientWidth, `No horizontal scroll on ${width}px (/login): scrollWidth=${scrollWidth}, clientWidth=${clientWidth}`);

      // Signup page
      await mobilePage.goto(`${BASE_URL}/signup`);
      await mobilePage.waitForLoadState('networkidle');
      scrollWidth = await mobilePage.evaluate(() => document.documentElement.scrollWidth);
      clientWidth = await mobilePage.evaluate(() => document.documentElement.clientWidth);
      assert(scrollWidth <= clientWidth, `No horizontal scroll on ${width}px (/signup): scrollWidth=${scrollWidth}, clientWidth=${clientWidth}`);

      // Public listing page
      await mobilePage.goto(`${BASE_URL}${publicSlugHref}`);
      await mobilePage.waitForLoadState('networkidle');
      scrollWidth = await mobilePage.evaluate(() => document.documentElement.scrollWidth);
      clientWidth = await mobilePage.evaluate(() => document.documentElement.clientWidth);
      assert(scrollWidth <= clientWidth, `No horizontal scroll on ${width}px (${publicSlugHref}): scrollWidth=${scrollWidth}, clientWidth=${clientWidth}`);

      await mobileContext.close();
      if (width === 375) results.mobile375 = true;
      if (width === 390) results.mobile390 = true;
      if (width === 430) results.mobile430 = true;
    }

    log('\n==================================================');
    log('🎉 ALL STAGING TEAM REVIEW CHECKS PASSED (100%)');
    log('==================================================\n');
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error('\n❌ Staging Review Check Failed:', err);
  process.exit(1);
});
