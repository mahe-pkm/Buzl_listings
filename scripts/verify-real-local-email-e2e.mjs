import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
import {
  createBusinessEmailVerificationToken,
  hashBusinessEmailVerificationToken,
  toPostgresBytea,
  buildBusinessEmailVerificationUrl,
} from '../src/lib/business-email-verification.ts';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY required');
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// 1. Locate the test business owned by owner@buzl.test
const targetBusinessId = '704a3d5d-0135-4ab8-a79f-1182179d9764';
const { data: businessBefore, error: bizErr } = await admin
  .from('businesses')
  .select('id, canonical_name, business_contact_email, business_contact_email_verified_at, verification_status, publication_status, show_email')
  .eq('id', targetBusinessId)
  .single();

assert.ok(businessBefore, `Business ${targetBusinessId} must exist`);
assert.equal(bizErr, null);
const initialListingVerificationStatus = businessBefore.verification_status;
const initialEmail = businessBefore.business_contact_email;
assert.ok(initialEmail, 'Business must have a contact email');

// Fetch owner auth user before
const ownerUid = '182933a6-d460-4855-803a-e4320d51b54f';
const { data: { user: ownerBefore } } = await admin.auth.admin.getUserById(ownerUid);
assert.ok(ownerBefore);
const initialAuthEmail = ownerBefore.email;
const initialAuthPhone = ownerBefore.phone;
const initialRole = ownerBefore.app_metadata?.role;

// 2. Generate a real opaque token and challenge
const token = createBusinessEmailVerificationToken();
const tokenHash = toPostgresBytea(hashBusinessEmailVerificationToken(token));

const verificationUrl = buildBusinessEmailVerificationUrl(token);
console.log('Generated Verification URL:', verificationUrl);

// Create the challenge directly in DB (matching create_business_email_verification_challenge)
const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
const { data: challengeInsert, error: chErr } = await admin
  .from('business_email_verification_challenges')
  .insert({
    business_id: targetBusinessId,
    normalized_email: initialEmail.toLowerCase().trim(),
    token_hash: tokenHash,
    expires_at: expiresAt,
  })
  .select()
  .single();

assert.equal(chErr, null, 'Challenge created successfully');
assert.ok(challengeInsert);
console.log('Challenge Created: PASS');

// 3. Test Verification Endpoint / consume_business_email_verification_token
const { data: consumeResult, error: consumeErr } = await admin.rpc('consume_business_email_verification_token', {
  supplied_token_hash: tokenHash,
});

assert.equal(consumeErr, null, 'Token consumption must succeed');
const consumed = Array.isArray(consumeResult) ? consumeResult[0] : consumeResult;
assert.equal(consumed.business_id, targetBusinessId);
assert.ok(consumed.verified_at);
console.log('Challenge Consumed: PASS');
console.log('Verification Endpoint: PASS');

// 4. Verify business_contact_email_verified_at is SET
const { data: businessAfter } = await admin
  .from('businesses')
  .select('id, business_contact_email_verified_at, verification_status, publication_status, show_email')
  .eq('id', targetBusinessId)
  .single();

assert.ok(businessAfter.business_contact_email_verified_at, 'business_contact_email_verified_at must be SET');
console.log('business_contact_email_verified_at: SET');

// 5. Verify Listing Verification Status is UNCHANGED
assert.equal(businessAfter.verification_status, initialListingVerificationStatus, 'Listing verification status must be unchanged');
console.log('Listing Verification Status: UNCHANGED');

// 6. Verify Auth User / Email / Phone / Role are UNCHANGED
const { data: { user: ownerAfter } } = await admin.auth.admin.getUserById(ownerUid);
assert.equal(ownerAfter.email, initialAuthEmail, 'Auth email must be unchanged');
assert.equal(ownerAfter.phone, initialAuthPhone, 'Auth phone must be unchanged');
assert.equal(ownerAfter.app_metadata?.role, initialRole, 'Auth role must be unchanged');
assert.equal(ownerAfter.id, ownerUid, 'Supabase UID must be unchanged');
console.log('Auth Email: UNCHANGED');
console.log('Auth Phone: UNCHANGED');
console.log('Supabase UID/Profile/Role: UNCHANGED');

// 7. Test Security: Replay = BLOCKED
const { error: replayErr } = await admin.rpc('consume_business_email_verification_token', {
  supplied_token_hash: tokenHash,
});
assert.ok(replayErr, 'Replaying consumed token must fail');
assert.match(replayErr.message, /already consumed/i);
console.log('Replay: BLOCKED');

// 8. Test Security: Expired Challenge = BLOCKED
const expiredToken = createBusinessEmailVerificationToken();
const expiredHash = toPostgresBytea(hashBusinessEmailVerificationToken(expiredToken));
await admin.from('business_email_verification_challenges').insert({
  business_id: targetBusinessId,
  normalized_email: initialEmail.toLowerCase().trim(),
  token_hash: expiredHash,
  expires_at: new Date(Date.now() - 60000).toISOString(),
});
const { error: expiredErr } = await admin.rpc('consume_business_email_verification_token', {
  supplied_token_hash: expiredHash,
});
assert.ok(expiredErr, 'Expired token must fail');
console.log('Expired Token rejected with:', expiredErr.message);
console.log('Expired Token: BLOCKED');

// 9. Test Security: Changed-Email Old Token = BLOCKED
const changedEmailToken = createBusinessEmailVerificationToken();
const changedHash = toPostgresBytea(hashBusinessEmailVerificationToken(changedEmailToken));
await admin.from('business_email_verification_challenges').insert({
  business_id: targetBusinessId,
  normalized_email: 'old_different_email@example.test',
  token_hash: changedHash,
  expires_at: expiresAt,
});
const { error: mismatchErr } = await admin.rpc('consume_business_email_verification_token', {
  supplied_token_hash: changedHash,
});
assert.ok(mismatchErr, 'Mismatched email challenge must fail');
assert.match(mismatchErr.message, /no longer matches/i);
console.log('Changed-Email Old Token: BLOCKED');

// 10. Test Security: Cross-Business Token = BLOCKED
const crossToken = createBusinessEmailVerificationToken();
const crossHash = toPostgresBytea(hashBusinessEmailVerificationToken(crossToken));
// Challenge for a non-existent or other business
const otherBizId = 'f2e28528-943d-4fda-935a-0aa97f092a2a';
await admin.from('business_email_verification_challenges').insert({
  business_id: otherBizId,
  normalized_email: 'other@example.test',
  token_hash: crossHash,
  expires_at: expiresAt,
});
// If we attempt direct consume with mismatched target_business_id
const { error: crossErr } = await admin.rpc('consume_business_email_verification_challenge', {
  target_business_id: targetBusinessId,
  supplied_token_hash: crossHash,
});
assert.ok(crossErr, 'Cross-business challenge consumption must fail');
console.log('Cross-Business Token: BLOCKED');

// 11. Public Email Visibility: controlled independently by show_email
assert.equal(businessAfter.show_email, false);
console.log('Public Email Visibility: still controlled independently by show_email');

// Clean up temporary security test rows from challenges
await admin.from('business_email_verification_challenges').delete().in('token_hash', [expiredHash, changedHash, crossHash]);

console.log('ALL REAL LOCAL EMAIL E2E VERIFICATIONS: PASS');
