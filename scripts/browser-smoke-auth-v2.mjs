import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const baseUrl = process.env.AUTH_V2_BASE_URL || 'http://127.0.0.1:3000';
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const browser = await chromium.launch({ executablePath: chromePath, headless: true });

try {
  for (const width of [375, 390, 430]) {
    for (const path of ['/login', '/signup']) {
      const context = await browser.newContext({ viewport: { width, height: 900 } });
      const page = await context.newPage();
      let otpRequestBody = null;

      await page.route('**/auth/v1/otp*', async (route) => {
        otpRequestBody = route.request().postDataJSON();
        await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
      });

      await page.goto(`${baseUrl}${path}`, { waitUntil: 'networkidle' });
      const tabs = page.locator('[role="tablist"] [role="tab"]');
      assert.equal(await tabs.count(), 3, `${path} exposes three auth methods at ${width}px`);
      assert.equal((await tabs.nth(0).innerText()).trim(), 'WhatsApp');
      assert.equal(await tabs.nth(0).getAttribute('aria-selected'), 'true');
      assert.equal((await tabs.nth(1).innerText()).trim(), 'Email Code');
      assert.equal((await tabs.nth(2).innerText()).trim(), 'Password');
      assert.equal(await page.locator('#whatsapp-country').inputValue(), '+91');

      await page.fill('#whatsapp-phone', '98765 43210');
      await page.getByRole('button', { name: 'Continue with WhatsApp' }).click();
      await page.getByRole('heading', { name: 'Verify WhatsApp' }).waitFor();

      assert.equal(otpRequestBody?.phone, '+919876543210');
      assert.equal(otpRequestBody?.create_user, true);
      const requestText = JSON.stringify(otpRequestBody);
      assert.doesNotMatch(requestText, /admin|buzl_member|listing_manager|permission_preset|member_id/);

      const visibleText = await page.locator('body').innerText();
      assert.doesNotMatch(visibleText, /\+919876543210|98765 43210/);
      assert.match(visibleText, /\*+3210/);
      assert.equal(await page.locator('#whatsapp-token').getAttribute('inputmode'), 'numeric');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
      await context.close();
    }
  }

  const context = await browser.newContext({ viewport: { width: 390, height: 900 } });
  const page = await context.newPage();
  for (const path of ['/admin/users', '/admin/categories', '/review/businesses']) {
    await page.goto(`${baseUrl}${path}`, { waitUntil: 'networkidle' });
    assert.equal(new URL(page.url()).pathname, '/login', `${path} is protected from anonymous access`);
  }
  await context.close();

  const fallbackContext = await browser.newContext({ viewport: { width: 390, height: 900 } });
  const fallbackPage = await fallbackContext.newPage();
  let emailOtpBody = null;
  let passwordBody = null;
  await fallbackPage.route('**/auth/v1/otp*', async (route) => {
    emailOtpBody = route.request().postDataJSON();
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
  await fallbackPage.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' });
  await fallbackPage.getByRole('tab', { name: 'Email Code' }).click();
  await fallbackPage.fill('#otp-email', 'auth-contract@example.test');
  await fallbackPage.getByRole('button', { name: 'Continue with Email OTP' }).click();
  await fallbackPage.locator('#otp-token').waitFor();
  assert.equal(emailOtpBody?.email, 'auth-contract@example.test');
  assert.equal(emailOtpBody?.create_user, true);

  await fallbackPage.route('**/auth/v1/token?grant_type=password', async (route) => {
    passwordBody = route.request().postDataJSON();
    await route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'invalid_grant', error_description: 'Invalid login credentials' }),
    });
  });
  await fallbackPage.getByRole('tab', { name: 'Password' }).click();
  await fallbackPage.fill('#password-email', 'auth-contract@example.test');
  await fallbackPage.fill('#password-input', 'contract-only-password');
  await fallbackPage.getByRole('button', { name: 'Sign In with Password' }).click();
  await fallbackPage.getByRole('alert').waitFor();
  assert.equal(passwordBody?.email, 'auth-contract@example.test');
  assert.equal(passwordBody?.password, 'contract-only-password');
  await fallbackContext.close();

  console.log('Auth V2 Phase 2 browser smoke: PASS (mocked OTP transport; no live message sent)');
} finally {
  await browser.close();
}
