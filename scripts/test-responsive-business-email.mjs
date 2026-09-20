import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const baseUrl = 'http://127.0.0.1:3000';
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const browser = await chromium.launch({ executablePath: chromePath, headless: true });

try {
  for (const width of [375, 390, 430]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();

    // Test 1: Verify Business Email page (invalid / expired status)
    await page.goto(`${baseUrl}/verify-business-email?status=invalid`, { waitUntil: 'networkidle' });
    const heading = await page.getByRole('heading', { level: 1 }).innerText();
    assert.match(heading, /Verification unavailable/i);
    const noOverflowInvalid = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
    assert.equal(noOverflowInvalid, true, `No horizontal overflow at ${width}px on /verify-business-email?status=invalid`);

    // Test 2: Verify Business Email page (success status)
    await page.goto(`${baseUrl}/verify-business-email?status=success`, { waitUntil: 'networkidle' });
    const successHeading = await page.getByRole('heading', { level: 1 }).innerText();
    assert.match(successHeading, /Business email verified successfully/i);
    const noOverflowSuccess = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
    assert.equal(noOverflowSuccess, true, `No horizontal overflow at ${width}px on /verify-business-email?status=success`);

    // Test 3: Verify Business Email page (with token prompt)
    await page.goto(`${baseUrl}/verify-business-email?token=test-sample-opaque-token-12345678901234567890`, { waitUntil: 'networkidle' });
    const promptHeading = await page.getByRole('heading', { level: 1 }).innerText();
    assert.match(promptHeading, /Verify business email/i);
    const noOverflowToken = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
    assert.equal(noOverflowToken, true, `No horizontal overflow at ${width}px on /verify-business-email?token=...`);

    console.log(`Responsive check ${width}px: PASS`);
    await context.close();
  }
} finally {
  await browser.close();
}

console.log('All responsive viewport checks (375, 390, 430): PASS');
