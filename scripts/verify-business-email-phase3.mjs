import assert from 'node:assert/strict';
import nodemailer from 'nodemailer';
import {
  buildBusinessEmailVerificationUrl,
  createBusinessEmailVerificationToken,
  hashBusinessEmailVerificationToken,
} from '../src/lib/business-email-verification.ts';
import { sendBusinessVerificationEmail } from '../src/lib/email/business-verification-email.ts';

process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000';
process.env.BUSINESS_EMAIL_FROM = 'Buzl Listing <no-reply@local.test>';

const token = createBusinessEmailVerificationToken();
assert.match(token, /^[A-Za-z0-9_-]{40,}$/);
assert.equal(hashBusinessEmailVerificationToken(token).length, 32);

const url = buildBusinessEmailVerificationUrl(token);
const parsed = new URL(url);
assert.equal(parsed.pathname, '/verify-business-email');
assert.equal(parsed.searchParams.get('token'), token);
assert.equal(parsed.searchParams.size, 1);

const transport = nodemailer.createTransport({ jsonTransport: true });
const info = await sendBusinessVerificationEmail({
  to: 'contact@example.test',
  businessName: 'Phase 3 Test & Co',
  verificationUrl: url,
  expiresInMinutes: 30,
  transport,
});
assert.ok(info);

console.log('Business email token generation: PASS');
console.log('Opaque verification URL: PASS');
console.log('Hashed token contract: PASS');
console.log('Transactional email transport contract: PASS');
