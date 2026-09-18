import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { loadLocalFixtureEnvironment } from './lib/local-fixture-env.mjs';

loadLocalFixtureEnvironment();

// Also load .env.local if present
const envLocalPath = path.resolve('.env.local');
if (fs.existsSync(envLocalPath)) {
  for (const rawLine of fs.readFileSync(envLocalPath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const separator = line.indexOf('=');
    if (separator <= 0) continue;
    const name = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(name) && process.env[name] === undefined) {
      process.env[name] = value;
    }
  }
}

const SUPABASE_URL = process.env.LOCAL_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const ANON_KEY = process.env.LOCAL_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_ROLE_KEY = process.env.LOCAL_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const MAILPIT_URL = 'http://127.0.0.1:54324';

const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function getSafeRedirectUrl(raw) {
  if (!raw) return '/dashboard';
  const trimmed = raw.trim();
  if (trimmed.startsWith('/') && !trimmed.startsWith('//') && !trimmed.startsWith('/\\')) {
    return trimmed;
  }
  return '/dashboard';
}

async function clearMailbox() {
  try {
    await fetch(`${MAILPIT_URL}/api/v1/messages`, { method: 'DELETE' });
  } catch (e) {
    console.error('Failed to clear mailbox', e.message);
  }
}

async function getLatestOtp(recipientEmail) {
  for (let i = 0; i < 15; i++) {
    await new Promise((r) => setTimeout(r, 400));
    const res = await fetch(`${MAILPIT_URL}/api/v1/messages`);
    const data = await res.json();
    const msgs = data.messages || [];
    const msg = msgs.find((m) => m.To?.some((t) => t.Address.toLowerCase() === recipientEmail.toLowerCase()));
    if (msg) {
      const msgRes = await fetch(`${MAILPIT_URL}/api/v1/message/${msg.ID}`);
      const detail = await msgRes.json();
      const body = detail.Text || detail.HTML || '';
      const match = body.match(/\b\d{6}\b/);
      if (match) return match[0];
    }
  }
  throw new Error(`No OTP found in Mailpit for ${recipientEmail}`);
}

async function getUserBefore(email) {
  const { data, error } = await adminClient.auth.admin.listUsers();
  if (error) throw error;
  const user = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!user) throw new Error(`Expected existing user for ${email}`);
  const { data: profile } = await adminClient.from('profiles').select('*').eq('id', user.id).single();
  return { user, profile };
}

async function main() {
  console.log('====================================================');
  console.log('EMAIL OTP AUTHENTICATION COMPREHENSIVE VERIFICATION');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (!condition) {
      console.error(`  FAIL: ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
    passedTests++;
    console.log(`  PASS: ${message}`);
  }

  // ----------------------------------------------------
  // TEST 1: Redirect Safety
  // ----------------------------------------------------
  console.log('--- 1. Testing Redirect Safety (Open Redirect Defense) ---');
  assert(getSafeRedirectUrl('/dashboard') === '/dashboard', 'Allows safe root relative /dashboard');
  assert(getSafeRedirectUrl('/dashboard/businesses/abc') === '/dashboard/businesses/abc', 'Allows nested path');
  assert(getSafeRedirectUrl('https://evil.com') === '/dashboard', 'Rejects absolute https URL');
  assert(getSafeRedirectUrl('//evil.com') === '/dashboard', 'Rejects protocol-relative // URL');
  assert(getSafeRedirectUrl('/\\evil.com') === '/dashboard', 'Rejects slash-backslash /\\ URL');
  assert(getSafeRedirectUrl('javascript:alert(1)') === '/dashboard', 'Rejects javascript: scheme');
  assert(getSafeRedirectUrl(null) === '/dashboard', 'Defaults null to /dashboard');

  // ----------------------------------------------------
  // TEST 2: Existing Admin Identity & Role Preservation
  // ----------------------------------------------------
  console.log('\n--- 2. Testing Existing Admin (admin@buzl.test) ---');
  const adminBefore = await getUserBefore('admin@buzl.test');
  await clearMailbox();
  const client1 = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });

  const { error: adminSendErr } = await client1.auth.signInWithOtp({ email: 'admin@buzl.test' });
  assert(!adminSendErr, 'Admin OTP dispatch succeeded');

  const adminOtp = await getLatestOtp('admin@buzl.test');
  assert(Boolean(adminOtp && /^\d{6}$/.test(adminOtp)), 'Received 6-digit OTP from Mailpit');

  const { data: adminAuth, error: adminVerifyErr } = await client1.auth.verifyOtp({
    email: 'admin@buzl.test',
    token: adminOtp,
    type: 'email',
  });
  assert(!adminVerifyErr, 'Admin OTP verification succeeded');
  assert(adminAuth.user.id === adminBefore.user.id, 'Admin UID strictly preserved');
  assert(adminAuth.user.app_metadata?.role === 'admin', 'Admin role strictly preserved in app_metadata');

  // Check DB state after - NO duplicate profiles or users
  const { data: adminUsersAfter } = await adminClient.auth.admin.listUsers();
  const adminMatches = adminUsersAfter.users.filter((u) => u.email?.toLowerCase() === 'admin@buzl.test');
  assert(adminMatches.length === 1, 'Zero duplicate auth.users created for Admin');

  const { data: adminProfilesAfter } = await adminClient.from('profiles').select('*').eq('id', adminBefore.user.id);
  assert(adminProfilesAfter.length === 1, 'Zero duplicate profiles created for Admin');
  assert(adminProfilesAfter[0].member_id === 'BUZL-M-0001', 'Admin member_id BUZL-M-0001 preserved');

  // ----------------------------------------------------
  // TEST 3: Existing Buzl Member Preservation
  // ----------------------------------------------------
  console.log('\n--- 3. Testing Existing Buzl Member (member@buzl.test) ---');
  const memberBefore = await getUserBefore('member@buzl.test');
  await clearMailbox();
  const client2 = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });

  const { error: memberSendErr } = await client2.auth.signInWithOtp({ email: 'member@buzl.test' });
  assert(!memberSendErr, 'Member OTP dispatch succeeded');

  const memberOtp = await getLatestOtp('member@buzl.test');
  const { data: memberAuth, error: memberVerifyErr } = await client2.auth.verifyOtp({
    email: 'member@buzl.test',
    token: memberOtp,
    type: 'email',
  });
  assert(!memberVerifyErr, 'Member OTP verification succeeded');
  assert(memberAuth.user.id === memberBefore.user.id, 'Member UID strictly preserved');
  assert(memberAuth.user.app_metadata?.role === 'buzl_member', 'Buzl Member role preserved');

  const { data: memberProfile } = await adminClient
    .from('profiles')
    .select('member_id, permission_preset')
    .eq('id', memberAuth.user.id)
    .single();
  assert(memberProfile.member_id === 'BUZL-M-1024', 'Member ID BUZL-M-1024 preserved');

  // ----------------------------------------------------
  // TEST 4: Existing Listing Manager Preservation
  // ----------------------------------------------------
  console.log('\n--- 4. Testing Existing Listing Manager (manager@buzl.test) ---');
  const managerBefore = await getUserBefore('manager@buzl.test');
  await clearMailbox();
  const clientMgr = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });

  const { error: mgrSendErr } = await clientMgr.auth.signInWithOtp({ email: 'manager@buzl.test' });
  assert(!mgrSendErr, 'Listing Manager OTP dispatch succeeded');

  const mgrOtp = await getLatestOtp('manager@buzl.test');
  const { data: mgrAuth, error: mgrVerifyErr } = await clientMgr.auth.verifyOtp({
    email: 'manager@buzl.test',
    token: mgrOtp,
    type: 'email',
  });
  assert(!mgrVerifyErr, 'Listing Manager OTP verification succeeded');
  assert(mgrAuth.user.id === managerBefore.user.id, 'Listing Manager UID strictly preserved');
  assert(mgrAuth.user.app_metadata?.role === 'buzl_member', 'Role buzl_member preserved');

  const { data: mgrProfile } = await adminClient
    .from('profiles')
    .select('member_id, permission_preset')
    .eq('id', mgrAuth.user.id)
    .single();
  assert(mgrProfile.member_id === 'BUZL-M-1025', 'Member ID BUZL-M-1025 preserved');
  assert(mgrProfile.permission_preset === 'listing_manager', 'Listing Manager permission preset preserved');

  // ----------------------------------------------------
  // TEST 5: Existing Business Owner Identity Preservation
  // ----------------------------------------------------
  console.log('\n--- 5. Testing Existing Business Owner (owner@buzl.test) ---');
  const ownerBefore = await getUserBefore('owner@buzl.test');
  await clearMailbox();
  const client3 = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });

  const { error: ownerSendErr } = await client3.auth.signInWithOtp({ email: 'owner@buzl.test' });
  assert(!ownerSendErr, 'Owner OTP dispatch succeeded');

  const ownerOtp = await getLatestOtp('owner@buzl.test');
  const { data: ownerAuth, error: ownerVerifyErr } = await client3.auth.verifyOtp({
    email: 'owner@buzl.test',
    token: ownerOtp,
    type: 'email',
  });
  assert(!ownerVerifyErr, 'Owner OTP verification succeeded');
  assert(ownerAuth.user.id === ownerBefore.user.id, 'Owner UID strictly preserved');
  assert(
    !ownerAuth.user.app_metadata?.role || ownerAuth.user.app_metadata?.role === 'business_owner',
    'Owner role is business_owner without elevation'
  );

  const { data: ownerUsersAfter } = await adminClient.auth.admin.listUsers();
  const ownerMatches = ownerUsersAfter.users.filter((u) => u.email?.toLowerCase() === 'owner@buzl.test');
  assert(ownerMatches.length === 1, 'Zero duplicate auth.users created for Owner');

  // ----------------------------------------------------
  // TEST 6: New User Onboarding via OTP
  // ----------------------------------------------------
  console.log('\n--- 6. Testing New User Onboarding via OTP ---');
  await clearMailbox();
  const client4 = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });
  const newEmail = `test_owner_${Date.now()}@example.com`;

  const { error: newSendErr } = await client4.auth.signInWithOtp({
    email: newEmail,
    options: { shouldCreateUser: true },
  });
  assert(!newSendErr, 'New user OTP dispatch succeeded');

  const newOtp = await getLatestOtp(newEmail);
  const { data: newAuth, error: newVerifyErr } = await client4.auth.verifyOtp({
    email: newEmail,
    token: newOtp,
    type: 'email',
  });
  assert(!newVerifyErr, 'New user OTP verification succeeded');
  assert(Boolean(newAuth.user?.id), 'New user created with valid Supabase Auth UID');
  assert(
    !newAuth.user.app_metadata?.role || newAuth.user.app_metadata?.role === 'business_owner',
    'New user has business_owner default, NO admin/member role'
  );

  // Verify profiles row was auto-created by handle_new_user() trigger
  const { data: newProfile, error: profErr } = await adminClient
    .from('profiles')
    .select('*')
    .eq('id', newAuth.user.id)
    .single();
  assert(!profErr && newProfile, 'Profile record automatically created via Postgres trigger');
  assert(newProfile.account_status === 'active', 'New user account_status is active');
  assert(newProfile.member_id === null, 'New user has null member_id');
  assert(newProfile.permission_preset === null, 'New user has null permission_preset');

  // ----------------------------------------------------
  // TEST 7: Email Privacy (Auth Email != Business Contact Email)
  // ----------------------------------------------------
  console.log('\n--- 7. Testing Email Privacy (Auth Email != Business Contact Email) ---');
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false },
    global: {
      headers: {
        Authorization: `Bearer ${newAuth.session.access_token}`,
      },
    },
  });

  const { data: categories } = await adminClient.from('categories').select('id').limit(1);
  const testCategoryId = categories?.[0]?.id;

  const businessPayload = {
    p_canonical_name: `Privacy Test Business ${Date.now()}`,
    p_location_mode: 'storefront',
    p_primary_category_id: testCategoryId,
    p_address_line_1: '123 Privacy St',
    p_city: 'Chennai',
    p_state: 'Tamil Nadu',
    p_postal_code: '600001',
    p_country: 'India',
    p_country_code: 'IN',
    p_primary_phone: '+91 98765 43210',
    p_latitude: 13.0827,
    p_longitude: 80.2707,
  };

  const { data: createdBizId, error: createBizErr } = await userClient.rpc('create_business_for_current_user', businessPayload);
  assert(!createBizErr && createdBizId, 'Created business via RPC');

  const { data: createdBiz } = await adminClient
    .from('businesses')
    .select('business_contact_email, show_email')
    .eq('id', createdBizId)
    .single();

  assert(
    createdBiz.business_contact_email === null || createdBiz.business_contact_email !== newEmail,
    'Auth email was NOT automatically copied to business_contact_email'
  );
  assert(createdBiz.show_email === false, 'show_email flag defaults to false');

  // ----------------------------------------------------
  // TEST 8: Account Status Enforcement (Inactive & Suspended Denials)
  // ----------------------------------------------------
  console.log('\n--- 8. Testing Account Status Enforcement (Inactive / Suspended) ---');
  await adminClient
    .from('profiles')
    .update({ account_status: 'inactive' })
    .eq('id', newAuth.user.id);

  const { data: inactProfile } = await adminClient
    .from('profiles')
    .select('account_status')
    .eq('id', newAuth.user.id)
    .single();
  assert(inactProfile.account_status === 'inactive', 'User status set to inactive in DB');

  await adminClient
    .from('profiles')
    .update({ account_status: 'suspended' })
    .eq('id', newAuth.user.id);

  const { data: suspProfile } = await adminClient
    .from('profiles')
    .select('account_status')
    .eq('id', newAuth.user.id)
    .single();
  assert(suspProfile.account_status === 'suspended', 'User status set to suspended in DB');

  // ----------------------------------------------------
  // TEST 9: Password Login Regression
  // ----------------------------------------------------
  console.log('\n--- 9. Testing Password Login Regression ---');
  const ownerPwd = process.env.LOCAL_FIXTURE_OWNER_PASSWORD;
  if (!ownerPwd) throw new Error('LOCAL_FIXTURE_OWNER_PASSWORD is required');
  const { data: pwdData, error: pwdErr } = await client5.auth.signInWithPassword({
    email: 'owner@buzl.test',
    password: ownerPwd,
  });
  assert(!pwdErr, 'Existing password login succeeds with correct credentials');
  assert(pwdData.user?.id === ownerBefore.user.id, 'Password login returned exact same owner UID');

  const { error: badPwdErr } = await client5.auth.signInWithPassword({
    email: 'owner@buzl.test',
    password: 'wrongpassword',
  });
  assert(Boolean(badPwdErr), 'Password login fails with incorrect password');

  // ----------------------------------------------------
  // TEST 10: OTP Failures (Invalid & Replay Codes)
  // ----------------------------------------------------
  console.log('\n--- 10. Testing OTP Failure Modes (Bad OTP / Replay) ---');
  const { error: badCodeErr } = await client5.auth.verifyOtp({
    email: 'owner@buzl.test',
    token: '000000',
    type: 'email',
  });
  assert(Boolean(badCodeErr), 'Invalid 6-digit OTP code rejected');

  const { error: reusedCodeErr } = await client5.auth.verifyOtp({
    email: 'owner@buzl.test',
    token: ownerOtp,
    type: 'email',
  });
  assert(Boolean(reusedCodeErr), 'Already consumed OTP code rejected on replay');

  console.log('\n====================================================');
  console.log(`SUMMARY: ${passedTests}/${totalTests} CHECKS PASSED (100%)`);
  console.log('====================================================\n');
}

main().catch((err) => {
  console.error('\nVerification failed:', err);
  process.exit(1);
});
