import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL) throw new Error('NEXT_PUBLIC_SUPABASE_URL is required');
if (!SERVICE_ROLE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log('--- SEEDING BUZL MEMBER ACCOUNT & MEMBER IDS ---');

  // 1. Create or update Buzl Member account
  const memberEmail = 'member@buzl.test';
  const { data: usersData, error: listErr } = await supabaseAdmin.auth.admin.listUsers();
  if (listErr) throw listErr;

  let memberUser = usersData.users.find((u) => u.email === memberEmail);

  if (!memberUser) {
    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: memberEmail,
      password: process.env.STAGING_MEMBER_PASSWORD || (() => { throw new Error('STAGING_MEMBER_PASSWORD is required'); })(),
      email_confirm: true,
      app_metadata: { role: 'buzl_member' },
      user_metadata: { full_name: 'Buzl Onboarding Specialist' },
    });
    if (createErr) throw createErr;
    memberUser = created.user;
    console.log('✓ Created member user:', memberUser.id);
  } else {
    // Ensure role is buzl_member
    await supabaseAdmin.auth.admin.updateUserById(memberUser.id, {
      app_metadata: { role: 'buzl_member' },
      user_metadata: { full_name: 'Buzl Onboarding Specialist' },
    });
    console.log('✓ Updated member user:', memberUser.id);
  }

  // 2. Set member_id in profiles table
  // Member: BUZL-M-1024
  await supabaseAdmin
    .from('profiles')
    .update({ member_id: 'BUZL-M-1024', full_name: 'Buzl Onboarding Specialist' })
    .eq('id', memberUser.id);
  console.log('✓ Assigned member_id BUZL-M-1024 to member@buzl.test');

  // Admin: BUZL-M-0001
  const adminUser = usersData.users.find((u) => u.email === 'admin@buzl.test');
  if (adminUser) {
    await supabaseAdmin
      .from('profiles')
      .update({ member_id: 'BUZL-M-0001' })
      .eq('id', adminUser.id);
    console.log('✓ Assigned member_id BUZL-M-0001 to admin@buzl.test');
  }

  console.log('--- SEEDING COMPLETE ---');
}

main().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
