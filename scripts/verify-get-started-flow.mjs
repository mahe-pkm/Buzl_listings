import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { routeForAuthenticatedUser } from '../src/lib/auth-routing.ts';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

const [getStartedPage, onboardingPage, middleware] = await Promise.all([
  read('src/app/get-started/page.tsx'),
  read('src/app/onboarding/page.tsx'),
  read('src/middleware.ts'),
]);

// 1. Contract & Unit Checks for Routing
console.log('--- 1. Auth Routing Unit Tests ---');
assert.equal(routeForAuthenticatedUser('business_owner', null), '/get-started');
assert.equal(routeForAuthenticatedUser('business_owner', null, '/dashboard'), '/get-started');
assert.equal(routeForAuthenticatedUser('business_owner', null, '/onboarding'), '/onboarding');
assert.equal(routeForAuthenticatedUser('business_owner', null, '/get-started'), '/get-started');
assert.equal(routeForAuthenticatedUser('business_owner', '2026-09-20T00:00:00Z'), '/dashboard');
assert.equal(routeForAuthenticatedUser('business_owner', '2026-09-20T00:00:00Z', '/onboarding'), '/dashboard');
assert.equal(routeForAuthenticatedUser('business_owner', '2026-09-20T00:00:00Z', '/get-started'), '/dashboard');

assert.equal(routeForAuthenticatedUser('admin', null), '/admin/businesses');
assert.equal(routeForAuthenticatedUser('admin', null, '/get-started'), '/admin/businesses');
assert.equal(routeForAuthenticatedUser('admin', null, '/onboarding'), '/admin/businesses');

assert.equal(routeForAuthenticatedUser('buzl_member', null), '/admin/businesses/import');
assert.equal(routeForAuthenticatedUser('buzl_member', null, '/get-started'), '/admin/businesses/import');
assert.equal(routeForAuthenticatedUser('buzl_member', null, '/onboarding'), '/admin/businesses/import');
console.log('PASS: Routing unit tests');

// 2. Middleware Pattern Checks
console.log('--- 2. Middleware Guard Checks ---');
assert.match(middleware, /pathname === "\/get-started"/);
assert.match(middleware, /pathname !== '\/get-started' && pathname !== '\/onboarding'/);
assert.match(middleware, /pathname === '\/get-started' \|\| pathname === '\/onboarding'/);
assert.match(middleware, /dest = "\/get-started"/);
console.log('PASS: Middleware pattern checks');

// 3. Page Content & Copy Checks
console.log('--- 3. Page Content & Copy Checks ---');
assert.match(getStartedPage, /BUSINESS OWNER/);
assert.match(getStartedPage, /Register your business with Buzl/);
assert.match(getStartedPage, /Create your business profile, add your services and contact information/);
assert.match(getStartedPage, /Register My Business →/);
assert.match(getStartedPage, /Continue Registration →/);
assert.match(getStartedPage, /Local Discovery/);
assert.match(getStartedPage, /Verified Information/);
assert.match(getStartedPage, /Better Visibility/);
assert.match(getStartedPage, /01[\s\S]*02[\s\S]*03[\s\S]*04[\s\S]*05/);
assert.match(getStartedPage, /After you submit your business, our team reviews the listing before it is published/);
assert.match(getStartedPage, /Business email verification is required before submitting your listing for review/);
assert.match(getStartedPage, /Usually takes only a few minutes if your business information is ready/);

// Verify no forbidden terms on /get-started
assert.doesNotMatch(getStartedPage, /publication_status|verification_status|Supabase|UID|RPC|RBAC/);

// Verify onboarding page copy
assert.match(onboardingPage, /Register Your Business/);
assert.match(onboardingPage, /Business Registration/);
assert.match(onboardingPage, /Complete your business information step by step/);
console.log('PASS: Page content and copy checks');

// 4. Live Browser & Responsive Smoke Tests
console.log('--- 4. Live Browser & Responsive Checks ---');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const browser = await chromium.launch({ executablePath: chromePath, headless: true });

try {
  // Test 4A: Unauthenticated user visiting /get-started redirects to /login
  const anonContext = await browser.newContext();
  const anonPage = await anonContext.newPage();
  await anonPage.goto('http://localhost:3000/get-started', { waitUntil: 'domcontentloaded' });
  assert(anonPage.url().includes('/login'), `Expected redirect to /login, got ${anonPage.url()}`);
  console.log('PASS: Unauthenticated visitor redirected to /login');
  await anonContext.close();

  // Test 4B: Responsive viewports (375, 390, 430)
  const viewports = [
    { width: 375, height: 667, name: '375px' },
    { width: 390, height: 844, name: '390px' },
    { width: 430, height: 932, name: '430px' },
  ];

  for (const vp of viewports) {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await context.newPage();
    // Test that login page renders cleanly without horizontal overflow
    await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded' });
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    assert(scrollWidth <= clientWidth + 1, `Horizontal scroll detected on ${vp.name}: ${scrollWidth} > ${clientWidth}`);
    console.log(`PASS: Viewport ${vp.name} renders without horizontal overflow`);
    await context.close();
  }
} finally {
  await browser.close();
}

console.log('ALL GET-STARTED FLOW VERIFICATION CHECKS PASS!');
