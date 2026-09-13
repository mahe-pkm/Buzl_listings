import { createClient } from '@supabase/supabase-js';
import { assertSafeMutationTarget } from './lib/mutation-safety.mjs';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function assertStagingTarget() {
  const url = requireEnv('NEXT_PUBLIC_SUPABASE_URL');
  assertSafeMutationTarget(url, 'staging seed');
  if (process.env.ALLOW_STAGING_SEED !== 'true') throw new Error('Refusing to seed: ALLOW_STAGING_SEED=true is required');
  requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  const expectedRef = requireEnv('STAGING_SUPABASE_PROJECT_REF');
  const actualRef = new URL(url).hostname.split('.')[0];
  if (actualRef !== expectedRef) throw new Error('Refusing to seed: target project ref does not match STAGING_SUPABASE_PROJECT_REF');
  console.log('BUZL STAGING SEED TARGET'); console.log('URL:', url); console.log('Project Ref:', actualRef); console.log('Environment: staging');
}

let supabaseAdmin;

async function main() {
  assertStagingTarget();
  supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  console.log('=== BUZL LISTING STAGING SEEDER ===');
  console.log('Target:', SUPABASE_URL);

  console.log('\n--- 1. Provisioning Staging Personas ---');
  const personas = [
    { email: requireEnv('STAGING_ADMIN_EMAIL'), password: requireEnv('STAGING_ADMIN_PASSWORD'), role: 'admin', fullName: 'Buzl System Administrator', memberId: 'BUZL-M-0001' },
    { email: requireEnv('STAGING_MEMBER_EMAIL'), password: requireEnv('STAGING_MEMBER_PASSWORD'), role: 'buzl_member', fullName: 'Buzl Onboarding Specialist', memberId: 'BUZL-M-1024' },
    { email: requireEnv('STAGING_OWNER_EMAIL'), password: requireEnv('STAGING_OWNER_PASSWORD'), role: 'business_owner', fullName: 'Buzl Demo Business Owner', memberId: null },
  ];

  const { data: usersData, error: listErr } = await supabaseAdmin.auth.admin.listUsers();
  if (listErr) throw new Error('Failed to list users: ' + listErr.message);

  const personaMap = {};

  for (const p of personas) {
    let user = usersData.users.find((u) => u.email === p.email);
    if (!user) {
      const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email: p.email,
        password: p.password,
        email_confirm: true,
        app_metadata: { role: p.role },
        user_metadata: { full_name: p.fullName },
      });
      if (createErr) throw new Error('Failed to create ' + p.email + ': ' + createErr.message);
      user = created.user;
      console.log('✓ Created persona:', p.email, '(' + p.role + ')');
    } else {
      await supabaseAdmin.auth.admin.updateUserById(user.id, {
        app_metadata: { role: p.role },
        user_metadata: { full_name: p.fullName },
      });
      console.log('✓ Verified persona:', p.email, '(' + p.role + ')');
    }

    personaMap[p.role] = user;

    if (p.memberId) {
      await supabaseAdmin
        .from('profiles')
        .update({ member_id: p.memberId, full_name: p.fullName })
        .eq('id', user.id);
      console.log('✓ Assigned member_id', p.memberId, 'to', p.email);
    }
  }

  console.log('\n--- 2. Checking Taxonomy ---');
  const { data: categories, error: catErr } = await supabaseAdmin
    .from('categories')
    .select('id, name, slug')
    .eq('active', true)
    .order('sort_order', { ascending: true });

  if (catErr || !categories || categories.length === 0) {
    throw new Error('Categories not found. Ensure migrations have been applied.');
  }
  console.log('✓ Active categories available:', categories.length);

  const itCategory = categories.find((c) => c.slug === 'it-software') || categories[0];
  const retailCategory = categories.find((c) => c.slug === 'retail-store') || categories[1];
  const autoCategory = categories.find((c) => c.slug === 'automotive') || categories[2];
  const wellnessCategory = categories.find((c) => c.slug === 'health-wellness') || categories[3];

  const ownerId = personaMap.business_owner.id;
  const adminId = personaMap.admin.id;

  console.log('\n--- 3. Seeding Demonstration Listings ---');
  const demoListings = [
    {
      canonical_name: 'Apex Digital Solutions',
      slug: 'apex-digital-solutions',
      description: 'Premier web design, bespoke software engineering, and digital growth consultancy for enterprises.',
      primary_phone: '+91 98765 43210',
      whatsapp_phone: '+91 98765 43210',
      business_contact_email: 'hello@apexdigital.example.com',
      show_email: true,
      website_url: 'https://apexdigital.example.com',
      year_established: 2018,
      location_mode: 'storefront',
      city: 'New Delhi',
      state: 'Delhi',
      country: 'India',
      country_code: 'IN',
      address_line_1: '104, Barakhamba Road',
      address_line_2: 'Statesman House',
      locality: 'Connaught Place',
      postal_code: '110001',
      show_street_address: true,
      latitude: 28.6297,
      longitude: 77.2274,
      publication_status: 'published',
      verification_status: 'verified',
      primary_category_id: itCategory.id,
      services: ['Custom Web Development', 'Enterprise Cloud Architecture', 'UI/UX Strategy'],
      hours: {
        monday: { open: '09:00', close: '18:00', closed: false },
        tuesday: { open: '09:00', close: '18:00', closed: false },
        wednesday: { open: '09:00', close: '18:00', closed: false },
        thursday: { open: '09:00', close: '18:00', closed: false },
        friday: { open: '09:00', close: '18:00', closed: false },
        saturday: { open: '10:00', close: '14:00', closed: false },
        sunday: { closed: true },
      },
    },
    {
      canonical_name: 'QuickFix Doorstep Tech',
      slug: 'quickfix-doorstep-tech',
      description: 'Doorstep mobile and hardware repair specialists serving major IT corridors and residential communities.',
      primary_phone: '+91 98765 43211',
      whatsapp_phone: '+91 98765 43211',
      business_contact_email: 'service@quickfix.example.com',
      show_email: false,
      website_url: 'https://quickfix.example.com',
      year_established: 2021,
      location_mode: 'service_area',
      city: 'Bengaluru',
      state: 'Karnataka',
      country: 'India',
      country_code: 'IN',
      address_line_1: null,
      address_line_2: null,
      locality: null,
      postal_code: null,
      show_street_address: false,
      latitude: null,
      longitude: null,
      publication_status: 'published',
      verification_status: 'unverified',
      primary_category_id: itCategory.id,
      service_areas: ['Koramangala', 'HSR Layout', 'Indiranagar', 'Whitefield'],
      services: ['Laptop Screen Replacement', 'Doorstep Diagnostic Service', 'Data Recovery'],
      hours: {
        monday: { open: '08:00', close: '20:00', closed: false },
        tuesday: { open: '08:00', close: '20:00', closed: false },
        wednesday: { open: '08:00', close: '20:00', closed: false },
        thursday: { open: '08:00', close: '20:00', closed: false },
        friday: { open: '08:00', close: '20:00', closed: false },
        saturday: { open: '09:00', close: '18:00', closed: false },
        sunday: { closed: true },
      },
    },
    {
      canonical_name: 'Apex Chennai Hub',
      slug: 'apex-chennai-hub',
      description: 'Walk-in experience center and doorstep enterprise hardware support.',
      primary_phone: '+91 98765 43212',
      whatsapp_phone: '+91 98765 43212',
      business_contact_email: 'chennai@apexdigital.example.com',
      show_email: true,
      website_url: 'https://apexdigital.example.com/chennai',
      year_established: 2020,
      location_mode: 'hybrid',
      city: 'Chennai',
      state: 'Tamil Nadu',
      country: 'India',
      country_code: 'IN',
      address_line_1: '45, Anna Salai',
      address_line_2: 'Mount Road',
      locality: 'Nandanam',
      postal_code: '600035',
      show_street_address: true,
      latitude: 13.0305,
      longitude: 80.2407,
      publication_status: 'published',
      verification_status: 'verified',
      primary_category_id: retailCategory.id,
      service_areas: ['T. Nagar', 'Adyar', 'Velachery', 'Anna Nagar'],
      services: ['Retail Tech Showcase', 'Express Device Repair', 'On-site Enterprise Setup'],
      hours: {
        monday: { open: '10:00', close: '21:00', closed: false },
        tuesday: { open: '10:00', close: '21:00', closed: false },
        wednesday: { open: '10:00', close: '21:00', closed: false },
        thursday: { open: '10:00', close: '21:00', closed: false },
        friday: { open: '10:00', close: '21:00', closed: false },
        saturday: { open: '10:00', close: '21:00', closed: false },
        sunday: { open: '11:00', close: '19:00', closed: false },
      },
    },
    {
      canonical_name: 'Metro Auto Care',
      slug: 'metro-auto-care',
      description: 'Comprehensive mechanical diagnostics and detailing services.',
      primary_phone: '+91 98765 43213',
      location_mode: 'storefront',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      country_code: 'IN',
      address_line_1: 'Plot 12, MIDC Industrial Area',
      locality: 'Andheri East',
      postal_code: '400093',
      show_street_address: true,
      latitude: 19.1197,
      longitude: 72.8697,
      publication_status: 'draft',
      verification_status: 'unverified',
      primary_category_id: autoCategory.id,
      services: ['Periodic Maintenance Service', 'Computerized Wheel Alignment'],
    },
    {
      canonical_name: 'Zenith Yoga Studio',
      slug: 'zenith-yoga-studio',
      description: 'Traditional Hatha, Vinyasa, and therapeutic yoga sessions guided by certified masters.',
      primary_phone: '+91 98765 43214',
      location_mode: 'storefront',
      city: 'Pune',
      state: 'Maharashtra',
      country: 'India',
      country_code: 'IN',
      address_line_1: '2nd Floor, Harmony Complex',
      locality: 'Koregaon Park',
      postal_code: '411001',
      show_street_address: true,
      latitude: 18.5362,
      longitude: 73.894,
      publication_status: 'pending',
      verification_status: 'unverified',
      primary_category_id: wellnessCategory.id,
      services: ['Morning Hatha Yoga', 'Guided Breathwork and Meditation'],
    },
    {
      canonical_name: 'Legacy Flagged Enterprise',
      slug: 'legacy-flagged-enterprise',
      description: 'Listing temporarily suspended pending moderation review.',
      primary_phone: '+91 98765 43215',
      location_mode: 'storefront',
      city: 'Hyderabad',
      state: 'Telangana',
      country: 'India',
      country_code: 'IN',
      address_line_1: 'Old Road',
      locality: 'Banjara Hills',
      postal_code: '500034',
      show_street_address: true,
      latitude: 17.4156,
      longitude: 78.4357,
      publication_status: 'suspended',
      verification_status: 'unverified',
      primary_category_id: retailCategory.id,
      services: ['General Merchandising'],
    },
  ];

  for (const b of demoListings) {
    const { data: existing } = await supabaseAdmin
      .from('businesses')
      .select('id, slug')
      .eq('slug', b.slug)
      .maybeSingle();

    let businessId = existing?.id;

    const recordData = {
      canonical_name: b.canonical_name,
      description: b.description,
      primary_phone: b.primary_phone,
      whatsapp_phone: b.whatsapp_phone || null,
      business_contact_email: b.business_contact_email || null,
      show_email: b.show_email ?? false,
      website_url: b.website_url || null,
      year_established: b.year_established || null,
      location_mode: b.location_mode,
      city: b.city,
      state: b.state,
      country: b.country,
      country_code: b.country_code,
      address_line_1: b.address_line_1,
      address_line_2: b.address_line_2 || null,
      locality: b.locality,
      postal_code: b.postal_code,
      show_street_address: b.show_street_address,
      publication_status: b.publication_status,
      verification_status: b.verification_status,
      primary_category_id: b.primary_category_id,
      created_by: ownerId,
    };

    if (b.latitude && b.longitude) {
      recordData.geo_point = 'POINT(' + b.longitude + ' ' + b.latitude + ')';
    } else {
      recordData.geo_point = null;
    }

    if (!businessId) {
      recordData.slug = b.slug;
      const { data: inserted, error: insErr } = await supabaseAdmin
        .from('businesses')
        .insert(recordData)
        .select('id')
        .single();
      if (insErr) throw new Error('Insert failed for ' + b.canonical_name + ': ' + insErr.message);
      businessId = inserted.id;
      console.log('✓ Inserted business:', b.canonical_name, '(' + b.publication_status + ')');
    } else {
      await supabaseAdmin.from('businesses').update(recordData).eq('id', businessId);
      console.log('✓ Updated business:', b.canonical_name, '(' + b.publication_status + ')');
    }

    // Upsert business manager
    await supabaseAdmin
      .from('business_managers')
      .upsert({ business_id: businessId, user_id: ownerId, role: 'owner' }, { onConflict: 'business_id, user_id' });

    // Seed services
    if (b.services && b.services.length > 0) {
      await supabaseAdmin.from('business_services').delete().eq('business_id', businessId);
      const serviceRows = b.services.map((s, idx) => ({
        business_id: businessId,
        service_name: s,
        sort_order: idx,
      }));
      await supabaseAdmin.from('business_services').insert(serviceRows);
    }

    // Seed service areas
    if (b.service_areas && b.service_areas.length > 0) {
      await supabaseAdmin.from('business_service_areas').delete().eq('business_id', businessId);
      const areaRows = b.service_areas.map((a, idx) => ({
        business_id: businessId,
        name: a,
        city: b.city,
        state: b.state,
        country: b.country,
        sort_order: idx,
      }));
      await supabaseAdmin.from('business_service_areas').insert(areaRows);
    }

    // Seed hours in business_hours table
    if (b.hours) {
      await supabaseAdmin.from('business_hours').delete().eq('business_id', businessId);
      const dayMap = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };
      const hourRows = [];
      for (const [dayStr, h] of Object.entries(b.hours)) {
        const dayNum = dayMap[dayStr.toLowerCase()];
        if (dayNum !== undefined) {
          hourRows.push({
            business_id: businessId,
            day_of_week: dayNum,
            opens_at: h.closed ? null : (h.open ? h.open + ':00' : '09:00:00'),
            closes_at: h.closed ? null : (h.close ? h.close + ':00' : '18:00:00'),
            is_closed: !!h.closed,
            is_24_hours: false,
          });
        }
      }
      if (hourRows.length > 0) {
        await supabaseAdmin.from('business_hours').insert(hourRows);
      }
    }
  }

  console.log('\n--- 4. Seeding Approved Combination Index ---');
  const { data: existingCombo } = await supabaseAdmin
    .from('approved_combination_indexes')
    .select('id')
    .eq('location_slug', 'chennai')
    .eq('category_slug', 'retail-store')
    .maybeSingle();

  if (!existingCombo) {
    const { error: comboErr } = await supabaseAdmin.from('approved_combination_indexes').insert({
      location_slug: 'chennai',
      category_slug: 'retail-store',
      approved_by_user_id: adminId,
      notes: 'Demonstration approved combination for retail in Chennai',
    });
    if (comboErr) console.warn('Note: approved combination insert skipped:', comboErr.message);
    else console.log('✓ Seeded approved combination: chennai / retail-store');
  } else {
    console.log('✓ Approved combination chennai / retail-store already exists');
  }

  console.log('\n=== STAGING SEEDING COMPLETE ===');
  console.log('All personas, demonstration listings, and combinations verified.');
}

main().catch((err) => {
  console.error('\n❌ Seeding failed:', err);
  process.exit(1);
});
