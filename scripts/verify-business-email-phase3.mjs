import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import nodemailer from 'nodemailer';
import {
  buildBusinessEmailVerificationUrl,
  createBusinessEmailVerificationToken,
  getBusinessEmailBaseUrl,
  hashBusinessEmailVerificationToken,
} from '../src/lib/business-email-verification.ts';
import { sendBusinessVerificationEmail } from '../src/lib/email/business-verification-email.ts';

// 1. Token generation & contract
const token = createBusinessEmailVerificationToken();
assert.match(token, /^[A-Za-z0-9_-]{40,}$/);
assert.equal(hashBusinessEmailVerificationToken(token).length, 32);

// 2. Base URL & Environment awareness
delete process.env.NEXT_PUBLIC_SITE_URL;
delete process.env.NEXT_PUBLIC_APP_URL;
assert.equal(getBusinessEmailBaseUrl(), 'http://localhost:3000');
const defaultUrl = buildBusinessEmailVerificationUrl(token);
assert.equal(defaultUrl, `http://localhost:3000/verify-business-email?token=${token}`);

process.env.NEXT_PUBLIC_SITE_URL = 'https://listing.rclk.in';
assert.equal(getBusinessEmailBaseUrl(), 'https://listing.rclk.in');
const stagingUrl = buildBusinessEmailVerificationUrl(token);
assert.equal(stagingUrl, `https://listing.rclk.in/verify-business-email?token=${token}`);

// Reset for local verification tests
process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000';
process.env.BUSINESS_EMAIL_FROM = 'Buzl Listing <no-reply@local.test>';

const url = buildBusinessEmailVerificationUrl(token);
const parsed = new URL(url);
assert.equal(parsed.pathname, '/verify-business-email');
assert.equal(parsed.searchParams.get('token'), token);
assert.equal(parsed.searchParams.size, 1);

// Ensure URL does NOT leak any private identifiers
assert.equal(parsed.searchParams.has('business_id'), false);
assert.equal(parsed.searchParams.has('id'), false);
assert.equal(parsed.searchParams.has('email'), false);
assert.equal(parsed.searchParams.has('phone'), false);
assert.equal(parsed.searchParams.has('user_id'), false);
assert.equal(parsed.searchParams.has('uid'), false);

// 3. Email transport test
const transport = nodemailer.createTransport({ jsonTransport: true });
const info = await sendBusinessVerificationEmail({
  to: 'contact@example.test',
  businessName: 'Phase 3 Test & Co',
  verificationUrl: url,
  expiresInMinutes: 30,
  transport,
});
assert.ok(info);

// 4. Inspect BusinessForm UI contracts
const formSource = await readFile(new URL('../src/components/business/BusinessForm.tsx', import.meta.url), 'utf8');

// Ensure "Optional" is removed and "Required before submission" is present
assert.doesNotMatch(formSource, /Business Contact Email\s*\(Optional\)/);
assert.match(formSource, /Business Contact Email\s*\(Required before submission\)/);

// Ensure helper text is present
assert.match(formSource, /You can save this listing as a draft without verifying your email\.\s*A verified business email is required before submitting for review\./);

// Ensure all 4 states are present
assert.match(formSource, /data-testid="business-email-verification-status"/);
assert.match(formSource, /'Required before submission'/);
assert.match(formSource, /'Verification required'/);
assert.match(formSource, /'Verification email sent'/);
assert.match(formSource, /'Verified'/);
assert.match(formSource, /isContactEmailVerificationSent \? 'Resend' : 'Verify Email'/);

console.log('Business email token generation: PASS');
console.log('Opaque verification URL: PASS');
console.log('Environment-aware canonical base URL: PASS');
console.log('Hashed token contract: PASS');
console.log('Transactional email transport contract: PASS');
console.log('Business email UX 4-state contract: PASS');
