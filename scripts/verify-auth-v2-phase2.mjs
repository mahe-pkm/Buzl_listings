import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { normalizePhoneNumber } from '../src/lib/whatsapp/phone.ts';
import { routeForAuthenticatedUser } from '../src/lib/auth-routing.ts';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

const [panel, login, signup, onboarding, businessForm, businessActions, middleware] = await Promise.all([
  read('src/components/auth/WhatsAppAuthPanel.tsx'),
  read('src/app/login/page.tsx'),
  read('src/app/signup/page.tsx'),
  read('src/app/onboarding/page.tsx'),
  read('src/components/business/BusinessForm.tsx'),
  read('src/lib/business-actions.ts'),
  read('src/middleware.ts'),
]);

const india = normalizePhoneNumber('98765 43210', '+91');
assert.equal(india.success, true);
assert.equal(india.e164, '+919876543210');
assert.equal(normalizePhoneNumber('+44 7700 900123', '+91').e164, '+447700900123');
assert.equal(normalizePhoneNumber('not-a-phone', '+91').success, false);

assert.match(panel, /signInWithOtp\(\{[\s\S]*phone: normalized\.e164,[\s\S]*shouldCreateUser: true/);
assert.match(panel, /verifyOtp\(\{[\s\S]*phone: verifiedPhone,[\s\S]*token,[\s\S]*type: 'sms'/);
assert.doesNotMatch(panel, /app_metadata|permission_preset|member_id|account_status\s*:/);
assert.doesNotMatch(panel, /WHATSAPP_TEST_RECIPIENT|META_WHATSAPP|Coming Soon|coming soon/);

assert.match(login, /useState<AuthMethod>\("whatsapp"\)/);
assert.match(signup, /useState<SignupMethod>\('whatsapp'\)/);
for (const source of [login, signup]) {
  assert.match(source, />\s*WhatsApp\s*</);
  assert.match(source, />\s*Email Code\s*</);
  assert.match(source, />\s*Password\s*</);
}

assert.equal(routeForAuthenticatedUser('business_owner', null), '/onboarding');
assert.equal(routeForAuthenticatedUser('business_owner', '2026-09-20T00:00:00Z'), '/dashboard');
assert.equal(routeForAuthenticatedUser('admin', null), '/admin/businesses');
assert.equal(routeForAuthenticatedUser('buzl_member', null), '/admin/businesses/import');

assert.match(onboarding, /<BusinessForm categories=\{categories\} onboardingMode \/>/);
assert.match(businessForm, /primary_phone: ''/);
assert.match(businessForm, /completeBusinessOwnerOnboarding\(\)/);
assert.match(businessActions, /rpc\('complete_user_onboarding'\)/);
assert.match(businessActions, /user\.role !== 'business_owner'/);
assert.match(middleware, /pathname === "\/onboarding"/);
assert.match(middleware, /pathname\.startsWith\("\/admin"\)/);
assert.match(middleware, /pathname\.startsWith\("\/review"\)/);

console.log('Auth V2 Phase 2 contract checks: PASS');
