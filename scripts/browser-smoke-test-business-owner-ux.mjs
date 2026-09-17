import { chromium } from 'playwright';
import { loadLocalFixtureEnvironment } from './lib/local-fixture-env.mjs';

loadLocalFixtureEnvironment();

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(message);
  }
  console.log(`  ✓ ${message}`);
}

async function main() {
  console.log('==================================================');
  console.log('🚀 BUSINESS OWNER UX BROWSER & MOBILE TEST SUITE');
  console.log(`Base URL: ${BASE_URL}`);
  console.log('==================================================\n');

  let ownerEmail = process.env.LOCAL_FIXTURE_OWNER_EMAIL || 'owner@buzl.test';
  let ownerPassword = process.env.LOCAL_FIXTURE_OWNER_PASSWORD || 'OwnerPassword123!';
  let adminEmail = process.env.LOCAL_FIXTURE_ADMIN_EMAIL || 'admin@buzl.test';
  let adminPassword = process.env.LOCAL_FIXTURE_ADMIN_PASSWORD || 'AdminPassword123!';

  try {
    const credRes = await fetch(`${BASE_URL}/api/internal/demo-credentials`);
    if (credRes.ok) {
      const credData = await credRes.json();
      if (credData.accounts?.owner?.password) {
        ownerEmail = credData.accounts.owner.email;
        ownerPassword = credData.accounts.owner.password;
      }
      if (credData.accounts?.admin?.password) {
        adminEmail = credData.accounts.admin.email;
        adminPassword = credData.accounts.admin.password;
      }
    }
  } catch {
    // fallback to fixture defaults
  }

  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
  });

  try {
    // ----------------------------------------------------
    // SUITE 1: Mobile Viewports & Auth UI (375px, 390px, 430px)
    // ----------------------------------------------------
    console.log('➡️ SUITE 1: Auth UI on Mobile Viewports (375px, 390px, 430px)');
    for (const width of [375, 390, 430]) {
      console.log(`  Testing viewport: ${width}x667`);
      const context = await browser.newContext({ viewport: { width, height: 667 } });
      const page = await context.newPage();

      // --- 1.1 Test /login ---
      await page.goto(`${BASE_URL}/login`);
      await page.waitForLoadState('networkidle');

      // Check tab order on /login
      const tabs = page.locator('div[role="tablist"] button[role="tab"]');
      assert(await tabs.count() === 3, `Login has exactly 3 tabs on ${width}px`);
      assert(await tabs.nth(0).innerText() === 'Email Code (OTP)', 'Tab 1 is Email Code (OTP)');
      assert(await tabs.nth(1).innerText() === 'WhatsApp OTP', 'Tab 2 is WhatsApp OTP');
      assert(await tabs.nth(2).innerText() === 'Password', 'Tab 3 is Password');

      // Email OTP is default
      const emailInput = page.locator('#otp-email');
      assert(await emailInput.isVisible(), `Email OTP input is visible by default on ${width}px`);
      const emailBox = await emailInput.boundingBox();
      assert(emailBox !== null && emailBox.width > 180, `Email input width (${emailBox?.width}px) is comfortable for typing on ${width}px`);

      let scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      let clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      assert(scrollWidth <= clientWidth, `No horizontal scroll on ${width}px (/login OTP tab): scrollWidth=${scrollWidth}, clientWidth=${clientWidth}`);

      // Test WhatsApp tab on /login
      await tabs.nth(1).click();
      assert(await tabs.nth(1).getAttribute('aria-selected') === 'true', 'WhatsApp tab is selected on /login');
      const comingSoonNotice = page.locator('text=WhatsApp verification is coming soon');
      assert(await comingSoonNotice.isVisible(), 'Notice "WhatsApp verification is coming soon" is visible');
      const countrySelect = page.locator('#whatsapp-country');
      assert(await countrySelect.isVisible(), 'Country select is visible');
      const phoneInput = page.locator('#whatsapp-phone');
      assert(await phoneInput.isVisible(), 'Phone input is visible');
      const phoneBox = await phoneInput.boundingBox();
      assert(phoneBox !== null && phoneBox.width > 120, `Phone input width (${phoneBox?.width}px) is comfortable for typing on ${width}px`);

      // Test invalid phone validation
      await phoneInput.fill('123');
      await page.click('button[type="submit"]:has-text("Continue with WhatsApp")');
      const errorBanner = page.locator('div[role="alert"]:has-text("⚠")');
      assert(await errorBanner.isVisible(), 'Invalid phone triggers validation error');

      // Test valid phone triggers activation notice without fake OTP
      await phoneInput.fill('9876543210');
      await page.click('button[type="submit"]:has-text("Continue with WhatsApp")');
      const infoNotice = page.locator('.bg-\\[\\#EBF5FF\\]');
      assert(await infoNotice.isVisible(), 'Activation info notice is displayed for valid phone');
      assert((await infoNotice.innerText()).includes('is being activated'), 'Notice mentions being activated');
      const fakeOtpToken = page.locator('#otp-token');
      assert(await fakeOtpToken.count() === 0, 'No fake OTP verification token screen is shown');

      // Test "Use Email Code →" switch button
      const useEmailBtn = page.locator('button:has-text("Use Email Code →")');
      assert(await useEmailBtn.isVisible(), '"Use Email Code →" button is visible');
      await useEmailBtn.click();
      assert(await emailInput.isVisible(), 'Clicking "Use Email Code →" switched back to Email OTP');

      // Switch to Password tab on /login
      await tabs.nth(2).click();
      const pwdInput = page.locator('#password-input');
      assert(await pwdInput.isVisible(), `Password input is visible on ${width}px`);
      const pwdBox = await pwdInput.boundingBox();
      assert(pwdBox !== null && pwdBox.width > 180, `Password input width (${pwdBox?.width}px) is comfortable for typing on ${width}px`);

      scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      assert(scrollWidth <= clientWidth, `No horizontal scroll on ${width}px (/login Password tab): scrollWidth=${scrollWidth}, clientWidth=${clientWidth}`);

      // --- 1.2 Test /signup ---
      await page.goto(`${BASE_URL}/signup`);
      await page.waitForLoadState('networkidle');

      const signupTabs = page.locator('div[role="tablist"] button[role="tab"]');
      assert(await signupTabs.count() === 3, `Signup has exactly 3 tabs on ${width}px`);
      assert(await signupTabs.nth(0).innerText() === 'Email Code (OTP)', 'Signup Tab 1 is Email Code (OTP)');
      assert(await signupTabs.nth(1).innerText() === 'WhatsApp OTP', 'Signup Tab 2 is WhatsApp OTP');
      assert(await signupTabs.nth(2).innerText() === 'Password', 'Signup Tab 3 is Password');

      // Switch to WhatsApp tab on /signup
      await signupTabs.nth(1).click();
      const signupNotice = page.locator('text=WhatsApp verification is coming soon');
      assert(await signupNotice.isVisible(), 'Signup notice "WhatsApp verification is coming soon" is visible');
      const signupPhoneInput = page.locator('#signup-whatsapp-phone');
      assert(await signupPhoneInput.isVisible(), 'Signup WhatsApp phone input is visible');

      // Test valid phone submit on /signup
      await signupPhoneInput.fill('9876543210');
      await page.click('button[type="submit"]:has-text("Continue with WhatsApp")');
      const signupInfoNotice = page.locator('.bg-\\[\\#EBF5FF\\]');
      assert(await signupInfoNotice.isVisible(), 'Signup activation info notice is displayed');
      assert((await signupInfoNotice.innerText()).includes('is being activated'), 'Signup notice mentions being activated');

      // Test switch to email code on /signup
      const signupUseEmailBtn = page.locator('button:has-text("Use Email Code →")');
      await signupUseEmailBtn.click();
      const signupOtpEmail = page.locator('#signup-otp-email');
      assert(await signupOtpEmail.isVisible(), 'Switched back to Email OTP on /signup');

      scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      assert(scrollWidth <= clientWidth, `No horizontal scroll on ${width}px (/signup): scrollWidth=${scrollWidth}, clientWidth=${clientWidth}`);

      await context.close();
    }

    // ----------------------------------------------------
    // SUITE 2: Desktop Context & Login as Owner
    // ----------------------------------------------------
    console.log('\n➡️ SUITE 2: Owner Login & Dashboard UX');
    const desktopContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await desktopContext.newPage();

    // Login via password tab
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    const passwordTab = page.locator('button[role="tab"]:has-text("Password")');
    await passwordTab.click();

    await page.fill('#password-email', ownerEmail);
    await page.fill('#password-input', ownerPassword);
    await page.click('button[type="submit"]:has-text("Sign in")');
    await page.waitForURL('**/dashboard**');
    assert(page.url().includes('/dashboard'), 'Successfully redirected to /dashboard');

    // 2.1 Verify dashboard empty state or table
    const emptyState = page.locator('text=No business listings yet');
    const statusHeader = page.locator('th:has-text("Listing Status")');
    const hasHeaderOrEmpty = (await emptyState.isVisible()) || (await statusHeader.count() > 0);
    assert(hasHeaderOrEmpty, 'Dashboard shows valid initial state (empty state or "Listing Status" header)');

    // ----------------------------------------------------
    // SUITE 3: Business Creation Form UX (8-Step Flow)
    // ----------------------------------------------------
    console.log('\n➡️ SUITE 3: Business Creation Form UX');
    await page.goto(`${BASE_URL}/dashboard/businesses/new`);
    await page.waitForLoadState('networkidle');

    // 3.1 Step 1: Business Details
    const step1Heading = page.locator('h2:has-text("Step 1: Business Details")');
    assert(await step1Heading.isVisible(), 'Step 1 title is "Step 1: Business Details"');

    const businessNameLabel = page.locator('label[for="canonical_name"]:has-text("Business Name")');
    assert(await businessNameLabel.isVisible(), 'Business Name label is visible (not "Canonical Business Name")');

    // Fill Step 1
    const testName = `UX Test Shop ${Date.now()}`;
    await page.fill('#canonical_name', testName);
    await page.click('button:has-text("Next Step →")');

    // 3.2 Step 2: Contact Information & GBP Link
    const step2Heading = page.locator('h2:has-text("Step 2: Contact Information")');
    assert(await step2Heading.isVisible(), 'Step 2 title is "Step 2: Contact Information"');

    const gbpLabel = page.locator('label[for="google_business_profile_url"]:has-text("Google Business Profile Link")');
    assert(await gbpLabel.isVisible(), 'Google Business Profile Link label is visible');

    await page.fill('#primary_phone', '+91 98765 43210');
    await page.fill('#google_business_profile_url', 'https://maps.app.goo.gl/example123');
    await page.click('button:has-text("Next Step →")');

    // 3.3 Step 3: Category & Services
    const step3Label = page.locator('label:has-text("What services does your business offer?")');
    assert(await step3Label.isVisible(), 'Step 3 label is "What services does your business offer?"');

    const serviceEmptyState = page.locator('text=No services added yet');
    assert(await serviceEmptyState.isVisible(), 'Step 3 shows friendly empty state when 0 services');

    // Add a service
    await page.fill('input[placeholder*="Service Name"]', 'General Consultation');
    await page.click('button:has-text("+ Add Service")');
    assert(await page.locator('text=General Consultation').isVisible(), 'Service added successfully');
    await page.click('button:has-text("Next Step →")');

    // 3.4 Step 4: Products & Offerings (Optional)
    const step4Heading = page.locator('h2:has-text("Step 4: Products & Offerings (Optional)")');
    assert(await step4Heading.isVisible(), 'Step 4 header is "Step 4: Products & Offerings (Optional)"');

    const productEmptyState = page.locator('text=No products added yet');
    assert(await productEmptyState.isVisible(), 'Step 4 shows friendly empty state when 0 products');
    await page.click('button:has-text("Next Step →")');

    // 3.5 Step 5: Media & Gallery
    const step5Heading = page.locator('h2:has-text("Step 5: Media & Photo Gallery")');
    assert(await step5Heading.isVisible(), 'Step 5 Media is visible');
    await page.click('button:has-text("Next Step →")');

    // 3.6 Step 6: Location & Zero Jargon
    const step6Heading = page.locator('h2:has-text("Step 6: Location & Coverage Mode")');
    assert(await step6Heading.isVisible(), 'Step 6 Location is visible');

    // Check no PostGIS or Geospatial Coordinates jargon
    const postgisJargon = page.locator('text=PostGIS');
    assert(await postgisJargon.count() === 0, 'Zero instances of "PostGIS" jargon in UI');
    const geospatialJargon = page.locator('text=Geospatial Coordinates');
    assert(await geospatialJargon.count() === 0, 'Zero instances of "Geospatial Coordinates" jargon in UI');

    // Fill location (Service-Area mode for quick validation)
    const serviceAreaModeBtn = page.locator('button:has-text("Service-Area Only")');
    await serviceAreaModeBtn.click();
    await page.fill('#city', 'New Delhi');
    await page.fill('#state', 'Delhi');
    await page.fill('#country', 'India');
    await page.fill('input[placeholder="Enter coverage area..."]', 'South Delhi');
    await page.click('button:has-text("Add Area")');
    await page.click('button:has-text("Next Step →")');

    // 3.7 Step 7: Hours & Social
    const step7Heading = page.locator('h2:has-text("Step 7: Business Hours & Social Links")');
    assert(await step7Heading.isVisible(), 'Step 7 Hours & Social is visible');
    await page.click('button:has-text("Next Step →")');

    // 3.8 Step 8: Preview & Submit + Readiness Checklist
    const step8Heading = page.locator('h2:has-text("Step 8: Preview & Submit")');
    assert(await step8Heading.isVisible(), 'Step 8 title is "Step 8: Preview & Submit"');

    const readinessCard = page.locator('h3:has-text("Listing Readiness Summary")');
    assert(await readinessCard.isVisible(), 'Listing Readiness Summary card is visible');

    const previewBadge = page.locator('text=Public Listing Preview').first();
    assert(await previewBadge.isVisible(), 'Public Listing Preview badge is visible (not "Public-Safe Output")');

    // Save listing
    await page.click('button:has-text("Create Listing")');
    await page.waitForURL('**/dashboard/businesses/**/edit', { timeout: 10000 });
    assert(page.url().includes('/edit'), 'Listing created successfully and navigated to edit view');

    // 3.9 Verify Listing Status header and created row on /dashboard/businesses
    await page.goto(`${BASE_URL}/dashboard/businesses`);
    await page.waitForLoadState('networkidle');
    const tableHeader = page.locator('th:has-text("Listing Status")');
    assert(await tableHeader.count() > 0, 'Table header displays "Listing Status" on /dashboard/businesses');
    const createdRow = page.locator(`td:has-text("${testName}")`);
    assert(await createdRow.count() > 0, 'Created business appears in the business table');

    // 3.10 Submit for Review and Verify Pending Review Banner
    const editLink = createdRow.locator('a').first();
    await editLink.click();
    await page.waitForLoadState('networkidle');

    // Click step 8 in desktop step navigation
    const step8Btn = page.locator('button:has-text("Preview & Submit")').first();
    await step8Btn.click();

    // Submit for review
    const submitBtn = page.locator('button:has-text("Submit for Review")');
    assert(await submitBtn.isVisible(), 'Submit for Review button is visible for draft listing');
    await submitBtn.click();

    // Verify submission toast
    await page.waitForSelector('text=Your listing has been submitted for review', { timeout: 15000 });
    const submissionToast = page.locator('text=Your listing has been submitted for review');
    assert(await submissionToast.isVisible(), 'Toast confirms "Your listing has been submitted for review."');

    // Verify Pending Review Banner
    await page.waitForSelector('text=Pending Review', { timeout: 10000 });
    const pendingBanner = page.locator('text=Pending Review');
    assert(await pendingBanner.isVisible(), 'Pending Review banner is visible on the listing');
    const pendingDetails = page.locator('text=You can continue updating your business details below');
    assert(await pendingDetails.isVisible(), 'Pending banner explains owner can continue updating details');

    // ----------------------------------------------------
    // SUITE 4: Mobile Form Navigation (375px)
    // ----------------------------------------------------
    console.log('\n➡️ SUITE 4: Form Mobile Step Header (375px)');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${BASE_URL}/dashboard/businesses/new`);
    await page.waitForLoadState('networkidle');
    const mobileStepIndicator = page.locator('text=Step 1 of 8');
    assert(await mobileStepIndicator.isVisible(), 'Mobile compact step indicator "Step 1 of 8" is visible on 375px');

    await desktopContext.close();

    // ----------------------------------------------------
    // SUITE 5: Admin Publish & Published Listing Banner
    // ----------------------------------------------------
    console.log('\n➡️ SUITE 5: Published Listing UX & View Public Listing ↗');
    const adminContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const adminPage = await adminContext.newPage();

    // Login as Admin
    await adminPage.goto(`${BASE_URL}/login`);
    await adminPage.waitForLoadState('networkidle');
    const adminPwdTab = adminPage.locator('button[role="tab"]:has-text("Password")');
    await adminPwdTab.click();
    await adminPage.fill('#password-email', adminEmail);
    await adminPage.fill('#password-input', adminPassword);
    await adminPage.click('button[type="submit"]:has-text("Sign in")');
    await adminPage.waitForURL('**/admin/**');

    // Go to the businesses list
    await adminPage.goto(`${BASE_URL}/dashboard/businesses`);
    await adminPage.waitForLoadState('networkidle');
    const adminTargetRow = adminPage.locator(`td:has-text("${testName}")`);
    await adminTargetRow.locator('a').first().click();
    await adminPage.waitForLoadState('networkidle');

    // Go to step 8
    const adminStep8Btn = adminPage.locator('button:has-text("Preview & Submit")').first();
    await adminStep8Btn.click();

    // Publish listing
    const publishBtn = adminPage.locator('button:has-text("Publish Listing")');
    assert(await publishBtn.isVisible(), 'Admin sees "Publish Listing" button');
    await publishBtn.click();

    // Verify Published Listing banner
    await adminPage.waitForSelector('text=Published Listing', { timeout: 15000 });
    const publishedBanner = adminPage.locator('text=Published Listing');
    assert(await publishedBanner.isVisible(), 'Published Listing banner is visible');
    const publicLinkBtn = adminPage.locator('a:has-text("View Public Listing")');
    assert(await publicLinkBtn.isVisible(), 'Direct "View Public Listing ↗" button is visible in banner');

    // Verify Public Listing loads
    const href = await publicLinkBtn.getAttribute('href');
    assert(Boolean(href && href.startsWith('/business/')), `Public link points to /business/ slug: ${href}`);

    await adminContext.close();

    console.log('\n==================================================');
    console.log('🎉 ALL BUSINESS OWNER UX TESTS PASSED (100%)');
    console.log('==================================================\n');
  } catch (err) {
    console.error('Test run failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main();
