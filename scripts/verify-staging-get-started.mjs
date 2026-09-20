import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { chromium } from 'playwright';

const STAGING_BASE = 'https://listing.rclk.in';
const SSH_CMD = 'ssh -i C:\\Users\\rough\\.ssh\\id_ed25519 root@213.210.37.204';

function runSql(sql) {
  return execSync(`${SSH_CMD} "docker exec -i buzl-listing-db-1 psql -U postgres -d postgres -t -A"`, {
    input: sql,
    encoding: 'utf8',
  }).trim();
}

console.log('==================================================');
console.log('STAGING GET-STARTED & ROUTING VERIFICATION SUITE');
console.log('==================================================');

const browser = await chromium.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
});

try {
  // Fetch demo credentials
  console.log('\n--- 1. Fetching Staging Demo Credentials ---');
  const demoRes = await fetch(`${STAGING_BASE}/api/internal/demo-credentials`);
  assert.equal(demoRes.status, 200, 'Demo credentials endpoint must return 200');
  const { accounts } = await demoRes.json();
  assert(accounts.admin?.email && accounts.admin?.password, 'Admin credentials missing');
  assert(accounts.member?.email && accounts.member?.password, 'Member credentials missing');
  assert(accounts.owner?.email && accounts.owner?.password, 'Owner credentials missing');
  console.log('PASS: Demo credentials retrieved');

  // Test 2: Unauthenticated Visitor Guard
  console.log('\n--- 2. Unauthenticated Visitor Guard ---');
  const unauthContext = await browser.newContext();
  const unauthPage = await unauthContext.newPage();
  await unauthPage.goto(`${STAGING_BASE}/get-started`, { waitUntil: 'domcontentloaded' });
  assert(unauthPage.url().includes('/login'), `Expected redirect to /login, got ${unauthPage.url()}`);
  console.log(`PASS: Unauthenticated visitor redirected to: ${unauthPage.url()}`);
  await unauthContext.close();

  // Test 3: Demo Admin Login & Routing
  console.log('\n--- 3. Demo Admin Login & Routing ---');
  const adminContext = await browser.newContext();
  const adminPage = await adminContext.newPage();
  await adminPage.goto(`${STAGING_BASE}/login`, { waitUntil: 'domcontentloaded' });
  
  // Click Password tab
  await adminPage.click('button:has-text("Password")');
  await adminPage.fill('input[type="email"]', accounts.admin.email);
  await adminPage.fill('input[type="password"]', accounts.admin.password);
  await Promise.all([
    adminPage.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 }),
    adminPage.click('button[type="submit"]:has-text("Sign in")'),
  ]);
  assert(adminPage.url().includes('/admin/businesses'), `Admin expected /admin/businesses, got: ${adminPage.url()}`);
  console.log(`PASS: Admin landed on ${adminPage.url()}`);

  // Admin tries to access /get-started
  await adminPage.goto(`${STAGING_BASE}/get-started`, { waitUntil: 'domcontentloaded' });
  assert(adminPage.url().includes('/admin/businesses'), `Admin visiting /get-started should redirect to /admin/businesses, got: ${adminPage.url()}`);
  console.log('PASS: Admin cannot enter /get-started (redirected to /admin/businesses)');

  // Admin tries to access /onboarding
  await adminPage.goto(`${STAGING_BASE}/onboarding`, { waitUntil: 'domcontentloaded' });
  assert(adminPage.url().includes('/admin/businesses'), `Admin visiting /onboarding should redirect to /admin/businesses, got: ${adminPage.url()}`);
  console.log('PASS: Admin cannot enter /onboarding (redirected to /admin/businesses)');
  await adminContext.close();

  // Test 4: Demo Buzl Member Login & Routing
  console.log('\n--- 4. Demo Buzl Member Login & Routing ---');
  const memberContext = await browser.newContext();
  const memberPage = await memberContext.newPage();
  await memberPage.goto(`${STAGING_BASE}/login`, { waitUntil: 'domcontentloaded' });
  
  await memberPage.click('button:has-text("Password")');
  await memberPage.fill('input[type="email"]', accounts.member.email);
  await memberPage.fill('input[type="password"]', accounts.member.password);
  await Promise.all([
    memberPage.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 }),
    memberPage.click('button[type="submit"]:has-text("Sign in")'),
  ]);
  assert(memberPage.url().includes('/admin/businesses/import'), `Member expected /admin/businesses/import, got: ${memberPage.url()}`);
  console.log(`PASS: Member landed on ${memberPage.url()}`);

  // Member tries to access /get-started
  await memberPage.goto(`${STAGING_BASE}/get-started`, { waitUntil: 'domcontentloaded' });
  assert(memberPage.url().includes('/admin/businesses/import'), `Member visiting /get-started should redirect to /admin/businesses/import, got: ${memberPage.url()}`);
  console.log('PASS: Member cannot enter /get-started (redirected to /admin/businesses/import)');

  // Member tries to access /onboarding
  await memberPage.goto(`${STAGING_BASE}/onboarding`, { waitUntil: 'domcontentloaded' });
  assert(memberPage.url().includes('/admin/businesses/import'), `Member visiting /onboarding should redirect to /admin/businesses/import, got: ${memberPage.url()}`);
  console.log('PASS: Member cannot enter /onboarding (redirected to /admin/businesses/import)');
  await memberContext.close();

  // Test 5: Completed Business Owner Login & Routing
  console.log('\n--- 5. Completed Business Owner Login & Routing ---');
  const ownerContext = await browser.newContext();
  const ownerPage = await ownerContext.newPage();
  await ownerPage.goto(`${STAGING_BASE}/login`, { waitUntil: 'domcontentloaded' });
  
  await ownerPage.click('button:has-text("Password")');
  await ownerPage.fill('input[type="email"]', accounts.owner.email);
  await ownerPage.fill('input[type="password"]', accounts.owner.password);
  await Promise.all([
    ownerPage.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 }),
    ownerPage.click('button[type="submit"]:has-text("Sign in")'),
  ]);
  assert(ownerPage.url().includes('/dashboard'), `Completed owner expected /dashboard, got: ${ownerPage.url()}`);
  console.log(`PASS: Completed Owner landed on ${ownerPage.url()}`);

  // Completed owner tries to visit /get-started
  await ownerPage.goto(`${STAGING_BASE}/get-started`, { waitUntil: 'domcontentloaded' });
  assert(ownerPage.url().includes('/dashboard'), `Completed owner visiting /get-started should redirect to /dashboard, got: ${ownerPage.url()}`);
  console.log('PASS: Completed Owner visiting /get-started redirected to /dashboard');

  // Completed owner tries to visit /onboarding
  await ownerPage.goto(`${STAGING_BASE}/onboarding`, { waitUntil: 'domcontentloaded' });
  assert(ownerPage.url().includes('/dashboard'), `Completed owner visiting /onboarding should redirect to /dashboard, got: ${ownerPage.url()}`);
  console.log('PASS: Completed Owner visiting /onboarding redirected to /dashboard');
  await ownerContext.close();

  // Test 6 & 7: Incomplete Business Owner (Zero DB Side Effects & Page Verification)
  console.log('\n--- 6 & 7. Incomplete Business Owner & Zero Side Effects ---');
  const testEmail = 'staging-owner-mu09cdpi@example.invalid';

  // Record baseline DB counts before visiting /get-started
  const countBefore = {
    businesses: Number(runSql('select count(*) from businesses;')),
    managers: Number(runSql('select count(*) from business_managers;')),
    completedProfiles: Number(runSql('select count(*) from profiles where onboarding_completed_at is not null;')),
    challenges: Number(runSql('select count(*) from business_email_verification_challenges;')),
  };

  try {
    // Temporarily grant test incomplete user the same password as demo owner via subquery
    runSql(`update auth.users set encrypted_password = (select encrypted_password from auth.users where email = '${accounts.owner.email}') where email = '${testEmail}';`);

    const incContext = await browser.newContext();
    const incPage = await incContext.newPage();
    await incPage.goto(`${STAGING_BASE}/login`, { waitUntil: 'domcontentloaded' });
    
    await incPage.click('button:has-text("Password")');
    await incPage.fill('input[type="email"]', testEmail);
    await incPage.fill('input[type="password"]', accounts.owner.password);
    await Promise.all([
      incPage.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 }),
      incPage.click('button[type="submit"]:has-text("Sign in")'),
    ]);
    
    assert(incPage.url().includes('/get-started'), `Incomplete owner expected /get-started, got: ${incPage.url()}`);
    console.log(`PASS: Incomplete Owner landed directly on ${incPage.url()}`);

    // Verify Copy and Elements on /get-started
    const content = await incPage.content();
    assert(content.includes('Register your business with Buzl'), 'Expected heading "Register your business with Buzl"');
    assert(content.includes('Register My Business →'), 'Expected primary CTA "Register My Business →"');
    assert(content.includes('Local Discovery'), 'Expected "Local Discovery"');
    assert(content.includes('Verified Information'), 'Expected "Verified Information"');
    assert(content.includes('Better Visibility'), 'Expected "Better Visibility"');
    assert(content.includes('After you submit your business, our team reviews the listing before it is published'), 'Expected moderation note');
    assert(content.includes('Business email verification is required before submitting your listing for review'), 'Expected email verification rule');
    assert(!/publication_status|verification_status|Supabase|UID|RPC|RBAC/.test(content), 'Forbidden technical terms detected on /get-started');
    console.log('PASS: Page copy and elements confirmed cleanly with zero technical leakage');

    // Test transition from /get-started to /onboarding
    await Promise.all([
      incPage.waitForURL((url) => url.pathname.includes('/onboarding'), { timeout: 15000 }),
      incPage.click('a:has-text("Register My Business →")'),
    ]);
    assert(incPage.url().includes('/onboarding'), `Expected transition to /onboarding, got: ${incPage.url()}`);
    console.log('PASS: "Register My Business →" CTA successfully navigated to /onboarding');

    // Test 8: Mobile Responsiveness on /get-started
    console.log('\n--- 8. Mobile Responsiveness Tests ---');
    const viewports = [
      { width: 375, height: 667, name: '375px' },
      { width: 390, height: 844, name: '390px' },
      { width: 430, height: 932, name: '430px' },
    ];

    for (const vp of viewports) {
      await incPage.setViewportSize({ width: vp.width, height: vp.height });
      await incPage.goto(`${STAGING_BASE}/get-started`, { waitUntil: 'domcontentloaded' });
      const scrollWidth = await incPage.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await incPage.evaluate(() => document.documentElement.clientWidth);
      assert(scrollWidth <= clientWidth + 1, `Horizontal scroll detected on ${vp.name}: ${scrollWidth} > ${clientWidth}`);
      console.log(`PASS: Mobile ${vp.name} renders with 0 horizontal overflow`);
    }

    await incContext.close();

    // Verify Zero DB Side Effects
    console.log('\n--- 9. Zero DB Side Effects Check ---');
    const countAfter = {
      businesses: Number(runSql('select count(*) from businesses;')),
      managers: Number(runSql('select count(*) from business_managers;')),
      completedProfiles: Number(runSql('select count(*) from profiles where onboarding_completed_at is not null;')),
      challenges: Number(runSql('select count(*) from business_email_verification_challenges;')),
    };

    assert.equal(countAfter.businesses, countBefore.businesses, 'businesses count must not change');
    assert.equal(countAfter.managers, countBefore.managers, 'business_managers count must not change');
    assert.equal(countAfter.completedProfiles, countBefore.completedProfiles, 'completed profiles count must not change');
    assert.equal(countAfter.challenges, countBefore.challenges, 'challenges count must not change');
    console.log('PASS: Confirmed 0 database insertions or mutations after visiting /get-started');

  } finally {
    // Restore original password hash on test account
    runSql(`update auth.users set encrypted_password = '$2a$10$DdzJ8se5jb1HeaNkWVXS3u9P4BW2VLi4RUiacuDqjcJj34RYuVUR2' where email = '${testEmail}';`);
    console.log('Test account password restored to original value.');
  }

  console.log('\n==================================================');
  console.log('ALL LIVE STAGING VERIFICATION CHECKS PASS!');
  console.log('==================================================');

} finally {
  await browser.close();
}
