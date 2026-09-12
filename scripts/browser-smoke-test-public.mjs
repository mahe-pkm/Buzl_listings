import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const SCREENSHOT_DIR = path.resolve(
  process.env.USERPROFILE || 'C:\\Users\\rough',
  '.gemini/antigravity/brain/609011b5-82b6-4122-a729-36934dbf92df/.tempmediaStorage'
);

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

let passedChecks = 0;
let totalChecks = 0;

function assert(condition, message) {
  totalChecks++;
  if (condition) {
    console.log(`  ✓ ${message}`);
    passedChecks++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    throw new Error(`Browser assertion failed: ${message}`);
  }
}

async function runBrowserSmoke() {
  console.log('====================================================');
  console.log('DAY 2 — PUBLIC DIRECTORY BROWSER SMOKE TEST');
  console.log(`Target: ${BASE_URL}`);
  console.log('====================================================\n');

  const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });

  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', (err) => {
    consoleErrors.push(err.message);
  });

  try {
    // ----------------------------------------------------
    // 1. Directory Homepage (Desktop)
    // ----------------------------------------------------
    console.log('1. Verifying Public Directory Homepage (Desktop)...');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'day2_home_desktop.png'), fullPage: true });

    const title = await page.title();
    assert(title.includes('Buzl Directory'), `Homepage title contains "Buzl Directory": "${title}"`);

    const heroHeading = await page.locator('h1').textContent();
    assert(heroHeading.includes('Find Trusted Local Businesses'), `Hero heading matches: "${heroHeading}"`);

    const categoriesSection = await page.locator('#categories').isVisible();
    assert(categoriesSection, 'Categories section is visible');

    const recentSection = await page.locator('text=Recently Published Businesses').isVisible();
    assert(recentSection, 'Constraint 5: "Recently Published Businesses" section is visible');
    console.log('✓ Homepage desktop verified\n');

    // ----------------------------------------------------
    // 2. Directory Homepage (Mobile 375px Viewport)
    // ----------------------------------------------------
    console.log('2. Verifying Mobile Responsiveness (375px)...');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'day2_home_mobile.png') });

    const mobileSearch = await page.locator('input[name="q"]').isVisible();
    assert(mobileSearch, 'Search input is visible on mobile');

    // Restore desktop viewport
    await page.setViewportSize({ width: 1280, height: 800 });
    console.log('✓ Mobile viewport verified\n');

    // ----------------------------------------------------
    // 3. Search Flow
    // ----------------------------------------------------
    console.log('3. Verifying Public Search (/search?q=laptech)...');
    await page.goto(`${BASE_URL}/search?q=laptech`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'day2_search.png') });

    const searchResultsText = await page.locator('main').textContent();
    assert(searchResultsText.includes('Laptech'), 'Search results contain "Laptech"');
    assert(searchResultsText.includes('Retail Store'), 'Search card shows category "Retail Store"');
    assert(searchResultsText.includes('Serving Chennai'), 'Search card shows "Serving Chennai" (service area model)');
    // Strict privacy: no street addresses for Laptech
    assert(!searchResultsText.includes('Door No') && !searchResultsText.includes('Street'), 'Search results do NOT leak private street address');
    console.log('✓ Search flow verified\n');

    // ----------------------------------------------------
    // 4. Public Business Detail Page (/business/laptech)
    // ----------------------------------------------------
    console.log('4. Verifying Public Business Detail Page (/business/laptech)...');
    await page.goto(`${BASE_URL}/business/laptech`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'day2_business_detail.png'), fullPage: true });

    const bizH1 = await page.locator('h1').textContent();
    assert(bizH1.trim() === 'Laptech', `Business H1 matches "Laptech": got "${bizH1}"`);

    // Breadcrumbs
    const breadcrumbs = await page.locator('nav[aria-label="Breadcrumb"]').textContent();
    assert(breadcrumbs.includes('Home') && breadcrumbs.includes('Retail Store') && breadcrumbs.includes('Laptech'), 'Breadcrumbs correctly structured');

    // Category and badges
    const categoryBadge = await page.locator('a[href="/category/retail-store"]').first().textContent();
    assert(categoryBadge.includes('Retail Store'), 'Category badge links to /category/retail-store');

    const verifiedBadge = await page.locator('text=Verified Business').isVisible();
    assert(verifiedBadge, 'Verified badge is visible');

    // Contact actions
    const callButton = await page.locator('a[href^="tel:"]').isVisible();
    assert(callButton, 'Call button with tel: protocol is present');

    const shareButton = await page.locator('button:has-text("Share")').isVisible();
    assert(shareButton, 'Share button is present');

    // Services
    const servicesText = await page.locator('text=Offered Services').isVisible();
    assert(servicesText, 'Services & Specialties section is present');

    const sampleService = await page.locator('text=Laptop Screen Replacement').isVisible();
    assert(sampleService, 'Service "Laptop Screen Replacement" is rendered');

    // Operating Hours
    const hoursCard = await page.locator('text=Business Hours').isVisible();
    assert(hoursCard, 'Business Hours card is present');

    // Coverage & Strict Privacy
    const coverageText = await page.locator('text=Privacy-Protected Service Area').isVisible();
    assert(coverageText, 'Privacy-protected service area banner is visible');

    // Check JSON-LD
    const jsonLdContent = await page.locator('script[type="application/ld+json"]').allTextContents();
    const localBusinessSchema = jsonLdContent
      .map((txt) => {
        try { return JSON.parse(txt); } catch { return null; }
      })
      .find((obj) => obj && obj['@type'] === 'LocalBusiness');

    assert(localBusinessSchema !== undefined, 'LocalBusiness Schema.org JSON-LD is embedded');
    assert(localBusinessSchema.name === 'Laptech', `JSON-LD name is "Laptech": got "${localBusinessSchema?.name}"`);
    assert(localBusinessSchema.address.addressLocality === 'Chennai', 'JSON-LD addressLocality is "Chennai"');
    assert(!('streetAddress' in localBusinessSchema.address), 'JSON-LD address strictly SUPPRESSES streetAddress for service-area business');
    assert(!('geo' in localBusinessSchema), 'JSON-LD strictly OMITS geo coordinates');
    console.log('✓ Business detail page verified\n');

    // ----------------------------------------------------
    // 5. Category Discovery Page (/category/retail-store)
    // ----------------------------------------------------
    console.log('5. Verifying Category Discovery Page (/category/retail-store)...');
    await page.goto(`${BASE_URL}/category/retail-store`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'day2_category.png') });

    const catH1 = await page.locator('h1').textContent();
    assert(catH1.includes('Retail Store'), `Category H1 matches: "${catH1}"`);

    const catContent = await page.locator('main').textContent();
    assert(catContent.includes('Laptech'), 'Category page lists "Laptech"');
    console.log('✓ Category discovery page verified\n');

    // ----------------------------------------------------
    // 6. Location Discovery Page (/location/chennai)
    // ----------------------------------------------------
    console.log('6. Verifying Location Discovery Page (/location/chennai)...');
    await page.goto(`${BASE_URL}/location/chennai`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'day2_location.png') });

    const locH1 = await page.locator('h1').textContent();
    assert(locH1.includes('Chennai'), `Location H1 matches: "${locH1}"`);

    const locContent = await page.locator('main').textContent();
    assert(locContent.includes('Laptech'), 'Location page lists "Laptech"');
    console.log('✓ Location discovery page verified\n');

    // ----------------------------------------------------
    // 7. Curated Combination Page (/location/chennai/retail-store)
    // ----------------------------------------------------
    console.log('7. Verifying Curated Combination Page (/location/chennai/retail-store)...');
    await page.goto(`${BASE_URL}/location/chennai/retail-store`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'day2_combination.png') });

    const comboH1 = await page.locator('h1').textContent();
    assert(comboH1.includes('Retail Store in Chennai'), `Combination H1 matches: "${comboH1}"`);

    const comboContent = await page.locator('main').textContent();
    assert(comboContent.includes('Laptech'), 'Combination page lists "Laptech"');
    console.log('✓ Curated combination page verified\n');

    // ----------------------------------------------------
    // 8. Unpublished Listing Isolation (Draft -> 404)
    // ----------------------------------------------------
    console.log('8. Verifying Unpublished Listing Isolation (Draft -> 404)...');
    const draftResponse = await page.goto(`${BASE_URL}/business/smoke-test-store`);
    assert(draftResponse.status() === 404, `Draft business returns HTTP 404: got ${draftResponse.status()}`);

    const notFoundH1 = await page.locator('h1').textContent();
    assert(notFoundH1.includes('Page Not Found'), `404 page rendered: "${notFoundH1}"`);
    console.log('✓ Unpublished listing isolation verified\n');

    // ----------------------------------------------------
    // 9. Robots.txt and Sitemap.xml
    // ----------------------------------------------------
    console.log('9. Verifying Robots.txt and Sitemap.xml...');
    const robotsRes = await page.goto(`${BASE_URL}/robots.txt`);
    const robotsText = await robotsRes.text();
    assert(robotsText.includes('Allow: /'), 'Robots.txt allows root');
    assert(robotsText.includes('Disallow: /admin/'), 'Robots.txt disallows /admin/');
    assert(robotsText.includes('Disallow: /search'), 'Robots.txt disallows /search');
    assert(robotsText.includes('sitemap.xml'), 'Robots.txt points to sitemap.xml');

    const sitemapRes = await page.goto(`${BASE_URL}/sitemap.xml`);
    const sitemapText = await sitemapRes.text();
    assert(sitemapText.includes('/business/laptech'), 'Sitemap.xml includes published business /business/laptech');
    assert(!sitemapText.includes('smoke-test-store'), 'Sitemap.xml strictly EXCLUDES draft businesses');
    assert(sitemapText.includes('/category/retail-store'), 'Sitemap.xml includes category /category/retail-store');
    assert(sitemapText.includes('/location/chennai/retail-store'), 'Sitemap.xml includes approved combination /location/chennai/retail-store');
    console.log('✓ Robots and sitemap verified\n');

    // ----------------------------------------------------
    // 10. Console Error Verification
    // ----------------------------------------------------
    console.log('10. Checking for browser console and hydration errors...');
    const filteredErrors = consoleErrors.filter(
      (err) => !err.includes('favicon') && !err.includes('404')
    );
    assert(filteredErrors.length === 0, `Zero unexpected console/hydration errors: ${filteredErrors.join(', ')}`);
    console.log('✓ Console errors verified clean\n');

    console.log('====================================================');
    console.log(`ALL BROWSER TESTS PASSED: ${passedChecks}/${totalChecks} verified!`);
    console.log('====================================================');
  } finally {
    await context.close();
    await browser.close();
  }
}

runBrowserSmoke().catch((err) => {
  console.error('\nBrowser smoke test failed:', err);
  process.exit(1);
});
