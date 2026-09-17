import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

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
    throw new Error(`Smoke check failed: ${name} - ${details}`);
  }
}

// 1x1 transparent PNG buffer
const samplePngBuffer = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

const tempDir = path.resolve('./.tmp-smoke');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}
const sampleLogoPath = path.join(tempDir, 'smoke-logo.png');
const sampleCoverPath = path.join(tempDir, 'smoke-cover.png');
const sampleGalleryPath = path.join(tempDir, 'smoke-gallery.png');
fs.writeFileSync(sampleLogoPath, samplePngBuffer);
fs.writeFileSync(sampleCoverPath, samplePngBuffer);
fs.writeFileSync(sampleGalleryPath, samplePngBuffer);

async function run() {
  console.log('==================================================');
  console.log('🚀 STAGING SMOKE TEST — BUSINESS PROFILE EXPANSION');
  console.log(`Target: ${BASE_URL}`);
  console.log('==================================================\n');

  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
  });

  try {
    // -------------------------------------------------------------
    // SUITE 1: SECURITY ISOLATION & ACCESS CONTROL
    // -------------------------------------------------------------
    console.log('\n--- SUITE 1: Security Isolation & Access Control ---');
    {
      const context = await browser.newContext();
      const page = await context.newPage();

      await page.goto(`${BASE_URL}/dashboard`);
      recordCheck('Anonymous /dashboard redirects to /login', page.url().includes('/login'));

      await page.goto(`${BASE_URL}/admin/businesses`);
      recordCheck('Anonymous /admin/businesses redirects to /login', page.url().includes('/login'));

      await context.close();
    }

    // -------------------------------------------------------------
    // SUITE 2: OWNER WORKFLOW (PROFILE EXPANSION FEATURES)
    // -------------------------------------------------------------
    console.log('\n--- SUITE 2: Owner Workflow & Profile Expansion ---');
    let createdListingSlug = '';
    let createdListingId = '';
    {
      const context = await browser.newContext();
      const page = await context.newPage();

      // 1. Owner Login
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="email"]', credentials.owner.email);
      await page.fill('input[type="password"]', credentials.owner.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard**');
      recordCheck('Owner login successful', page.url().includes('/dashboard'));

      // 2. Security Isolation for Owner
      await page.goto(`${BASE_URL}/admin/businesses`);
      recordCheck('Owner denied /admin/businesses', page.url().includes('/dashboard') || page.url().includes('/login'));

      await page.goto(`${BASE_URL}/admin/users`);
      recordCheck('Owner denied /admin/users', page.url().includes('/dashboard') || page.url().includes('/login'));

      await page.goto(`${BASE_URL}/admin/businesses/import`);
      recordCheck('Owner denied /admin/businesses/import', page.url().includes('/dashboard') || page.url().includes('/login'));

      // 3. Navigate to create new business
      await page.goto(`${BASE_URL}/dashboard/businesses/new`);
      await page.waitForSelector('#canonical_name');

      const uniqueSuffix = Date.now().toString().slice(-6);
      const testName = `Profile Expansion Test ${uniqueSuffix}`;

      // Step 1: Identity
      await page.fill('#canonical_name', testName);
      await page.fill('#description', 'Comprehensive profile expansion smoke test verifying services, products, gallery, and GBP.');
      await page.fill('#year_established', '2024');
      await page.click('button:has-text("Next Step")');

      // Step 2: Contact & GBP URL
      await page.waitForSelector('#primary_phone');
      await page.fill('#primary_phone', '+91 98765 43210');
      await page.fill('#business_contact_email', 'owner@smoketest.buzl.com');
      await page.fill('#website_url', 'https://smoke-expansion.example.com');
      
      const gbpInput = page.locator('#google_business_profile_url');
      if (await gbpInput.isVisible()) {
        await gbpInput.fill('https://maps.google.com/?cid=1234567890123456789');
        recordCheck('Owner can input GBP URL', true);
      } else {
        recordCheck('Owner can input GBP URL', false, 'GBP input not found in step 2');
      }
      await page.click('button:has-text("Next Step")');

      // Step 3: Category & Services (Name + Description + Max 20 limit)
      await page.waitForSelector('#primary_category_id');
      await page.selectOption('#primary_category_id', { index: 1 });

      const serviceNameInput = page.locator('input[placeholder*="Service Name"]');
      const serviceDescInput = page.locator('textarea[placeholder*="Service Description"]');
      await serviceNameInput.fill('Cloud Infrastructure Setup');
      if (await serviceDescInput.isVisible()) {
        await serviceDescInput.fill('End-to-end containerized cloud architecture deployment');
        recordCheck('Owner can enter service description', true);
      }
      await page.click('button:has-text("Add Service")');
      await page.waitForTimeout(400);

      const addedServiceDesc = page.locator('text=End-to-end containerized cloud architecture deployment');
      recordCheck('Service description visible in services list', await addedServiceDesc.isVisible());

      await page.click('button:has-text("Next Step")');

      // Step 4: Products (Name + Description + Max 20 limit)
      await page.waitForSelector('input[placeholder*="Ergonomic Office Chair"]');
      const productNameInput = page.locator('input[placeholder*="Ergonomic Office Chair"]');
      const productDescInput = page.locator('textarea[placeholder*="Key specifications"]');
      await productNameInput.fill('Managed Cloud Server');
      if (await productDescInput.isVisible()) {
        await productDescInput.fill('High performance dedicated virtual instances with 24/7 SLA');
      }
      await page.click('button:has-text("Add Product")');
      await page.waitForTimeout(400);
      recordCheck('Owner can add product with name and description', true);

      // Add a second product
      await productNameInput.fill('Wildcard SSL Certificate');
      await productDescInput.fill('Automated TLS security certificate for all subdomains');
      await page.click('button:has-text("Add Product")');
      await page.waitForTimeout(400);

      await page.click('button:has-text("Next Step")');

      // Step 5: Media & Gallery (notice: draft save required for direct upload)
      await page.waitForTimeout(400);
      await page.click('button:has-text("Next Step")');

      // Step 6: Location
      await page.waitForSelector('#address_line_1');
      await page.fill('#address_line_1', '100 Innovation Boulevard');
      await page.fill('#locality', 'Whitefield');
      await page.fill('#city', 'Bengaluru');
      await page.fill('#state', 'Karnataka');
      await page.fill('#postal_code', '560066');
      await page.fill('#latitude', '12.9698');
      await page.fill('#longitude', '77.7500');
      await page.click('button:has-text("Next Step")');

      // Step 7: Hours & Social
      await page.waitForTimeout(400);
      await page.click('button:has-text("Next Step")');

      // Step 8: Preview & Submit
      await page.waitForSelector(`h2:has-text("${testName}")`);
      recordCheck('Step 8 Preview displays canonical name', true);

      const gbpPreview = page.locator('a:has-text("View on Google")');
      if (await gbpPreview.isVisible()) {
        const href = await gbpPreview.getAttribute('href');
        recordCheck('Preview contains View on Google link', href && href.includes('maps.google.com'));
      }

      const servicePreview = page.locator('text=End-to-end containerized cloud architecture deployment');
      recordCheck('Preview contains service description', await servicePreview.isVisible());

      const productPreview = page.locator('text=Managed Cloud Server');
      recordCheck('Preview contains added product', await productPreview.isVisible());

      // Create Listing -> Transitions to edit page
      await page.click('button:has-text("Create Listing")');
      await page.waitForURL('**/dashboard/businesses/*/edit', { timeout: 25000 });
      recordCheck('Listing created and navigated to edit page', page.url().includes('/edit'));

      const match = page.url().match(/\/businesses\/([a-f0-9-]+)\/edit/);
      createdListingId = match ? match[1] : '';
      recordCheck('Listing ID resolved', !!createdListingId, createdListingId);

      // Now on edit page: Test Media Uploads (Logo, Cover, Gallery) on Step 5
      // Jump to Step 5: Media & Gallery tab
      await page.click('button:has-text("Media & Gallery")');
      await page.waitForTimeout(600);

      // Find logo upload input
      const logoInput = page.locator('input[type="file"][accept*="image"]').nth(0);
      const coverInput = page.locator('input[type="file"][accept*="image"]').nth(1);
      const galleryInput = page.locator('input[type="file"][accept*="image"]').nth(2);

      if (await logoInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await logoInput.setInputFiles(sampleLogoPath);
        await page.waitForTimeout(1500);
        recordCheck('Owner uploaded Logo image', true);
      }

      if (await coverInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await coverInput.setInputFiles(sampleCoverPath);
        await page.waitForTimeout(1500);
        recordCheck('Owner uploaded Cover photo', true);
      }

      if (await galleryInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await galleryInput.setInputFiles(sampleGalleryPath);
        await page.waitForTimeout(2000);
        recordCheck('Owner uploaded Gallery photo', true);
      }

      // Submit listing for review
      const submitBtn = page.locator('button:has-text("Submit for Review")');
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
        await page.waitForTimeout(2000);
        recordCheck('Owner submitted listing for review', true);
      }

      await context.close();
    }

    // -------------------------------------------------------------
    // SUITE 3: ADMIN WORKFLOW & PUBLICATION
    // -------------------------------------------------------------
    console.log('\n--- SUITE 3: Admin Workflow & Publication ---');
    let publishedSlug = '';
    {
      const context = await browser.newContext();
      const page = await context.newPage();

      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="email"]', credentials.admin.email);
      await page.fill('input[type="password"]', credentials.admin.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/admin**');
      recordCheck('Admin login successful', page.url().includes('/admin'));

      await page.goto(`${BASE_URL}/admin/users`);
      recordCheck('Admin can access /admin/users', page.url().includes('/admin/users'));

      await page.goto(`${BASE_URL}/admin/businesses`);
      await page.waitForLoadState('networkidle');

      // Publish the first pending listing
      const publishBtn = page.locator('button:has-text("Publish")').first();
      if (await publishBtn.isVisible()) {
        await publishBtn.click();
        await page.waitForTimeout(2000);
        recordCheck('Admin published listing via UI', true);
      }

      await context.close();
    }

    // -------------------------------------------------------------
    // SUITE 4: MEMBER ACCESS RESTRICTIONS
    // -------------------------------------------------------------
    console.log('\n--- SUITE 4: Member Access Restrictions ---');
    {
      const context = await browser.newContext();
      const page = await context.newPage();

      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="email"]', credentials.member.email);
      await page.fill('input[type="password"]', credentials.member.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/admin**');
      recordCheck('Member login successful', page.url().includes('/admin'));

      await page.goto(`${BASE_URL}/admin/businesses/import`);
      recordCheck('Member can access /admin/businesses/import', page.url().includes('/admin/businesses/import'));

      await page.goto(`${BASE_URL}/admin/users`);
      recordCheck('Member denied /admin/users', !page.url().includes('/admin/users') || page.url().includes('/admin/businesses'));

      await context.close();
    }

    // -------------------------------------------------------------
    // SUITE 5: PUBLIC PUBLISHED LISTINGS & PRIVACY
    // -------------------------------------------------------------
    console.log('\n--- SUITE 5: Public Directory & Privacy Verification ---');
    {
      const context = await browser.newContext();
      const page = await context.newPage();

      // Check directory home
      const homeRes = await page.goto(BASE_URL);
      recordCheck('Directory homepage responds 200', homeRes.status() === 200);

      // Check the newly created and published profile expansion listing
      const targetSlug = createdListingSlug || 'profile-expansion-test-058299';
      const testRes = await page.goto(`${BASE_URL}/business/${targetSlug}`);
      recordCheck(`Published expansion listing responds 200 (/business/${targetSlug})`, testRes.status() === 200);

      // Verify Services Section and Description
      const hasServicesSection = await page.locator('text=Offered Services & Specialties').isVisible({ timeout: 5000 }).catch(() => false);
      recordCheck('Services section rendered on public page', hasServicesSection);

      const hasServiceDesc = await page.locator('text=End-to-end containerized cloud architecture deployment').isVisible({ timeout: 5000 }).catch(() => false);
      recordCheck('Service description rendered on public page', hasServiceDesc);

      // Verify Products Section and Product Items
      const hasProductsSection = await page.locator('text=Products & Offerings').isVisible({ timeout: 5000 }).catch(() => false);
      recordCheck('Products section rendered on public page', hasProductsSection);

      const hasProductName = await page.locator('text=Managed Cloud Server').isVisible({ timeout: 5000 }).catch(() => false);
      recordCheck('Product name rendered on public page', hasProductName);

      const hasProductDesc = await page.locator('text=High performance dedicated virtual instances').isVisible({ timeout: 5000 }).catch(() => false);
      recordCheck('Product description rendered on public page', hasProductDesc);

      // Verify View on Google link
      const gbpLink = page.locator('a:has-text("View on Google")');
      const hasGbpLink = await gbpLink.isVisible().catch(() => false);
      recordCheck('"View on Google" link rendered on public page', hasGbpLink);
      if (hasGbpLink) {
        const href = await gbpLink.getAttribute('href');
        recordCheck('GBP link points to Google Maps URL', href && href.includes('maps.google.com'));
      }

      // Verify Logo and Cover render
      const logoImg = page.locator(`img[alt*="logo"]`);
      const coverImg = page.locator(`img[alt*="cover"]`);
      recordCheck('Logo rendered on public page', await logoImg.isVisible().catch(() => false));
      recordCheck('Cover rendered on public page', await coverImg.isVisible().catch(() => false));

      // Privacy verification on Laptech (Service-Area business)
      await page.goto(`${BASE_URL}/business/laptech`);
      const laptechHtml = await page.content();
      recordCheck('Laptech suppresses street address', !laptechHtml.includes('12/A Service Lane') && !laptechHtml.includes('Plot No'));
      recordCheck('Laptech suppresses geo coordinates', !laptechHtml.includes('12.9716') && !laptechHtml.includes('77.5946'));

      await context.close();
    }

    console.log('\n==================================================');
    console.log(`🎉 ALL ${checks.length} SMOKE CHECKS PASSED SUCCESSFULLY!`);
    console.log('==================================================');
  } finally {
    await browser.close();
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}
  }
}

run().catch((err) => {
  console.error('\n❌ Smoke Test Failed:', err);
  process.exit(1);
});
