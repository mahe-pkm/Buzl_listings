import fs from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { assertSafeMutationTarget } from './lib/mutation-safety.mjs';
import { classifyCandidate, makePackage, normalizePhone, privacyIssues, validateRequestedPublicationStatus, validateSelector } from './lib/promotion-dry-run.mjs';

const ROOT = process.cwd();
const SELECT = 'id,canonical_name,description,year_established,primary_phone,primary_phone_normalized,alternate_phone,whatsapp_phone,business_contact_email,show_email,website_url,website_domain_normalized,primary_category_id,location_mode,address_line_1,address_line_2,locality,city,district,state,country,country_code,postal_code,show_street_address,facebook_url,instagram_url,linkedin_url,youtube_url,publication_status,verification_status,source_record_id,source_buss_id,source_loc_id,source_place_id,created_source';

function fail(message) { throw new Error(message); }
function env(name) { return process.env[name] || fail(`${name} is required when selectedBusinesses is not empty`); }
function args() {
  const values = process.argv.slice(2);
  if (values.includes('--apply')) fail('This promotion tool is dry-run only; --apply is intentionally unsupported.');
  if (values.some((value) => !['--dry-run', '--json', '--manifest'].includes(value)) && !values.some((value, index) => values[index - 1] === '--manifest')) fail('Unsupported argument. Use --dry-run and optional --manifest <path>.');
  const index = values.indexOf('--manifest');
  return { manifest: index >= 0 ? values[index + 1] : 'scripts/data/staging-promotion.local.json' };
}
async function queryOne(client, selector) {
  const validation = validateSelector(selector);
  if (validation) return { error: validation };
  let query = client.from('businesses').select(SELECT);
  for (const key of ['source_record_id', 'source_buss_id', 'source_loc_id', 'source_place_id']) if (selector[key]) query = query.eq(key, selector[key].trim());
  if (selector.slug) query = query.eq('slug', selector.slug.trim());
  if (selector.canonical_name) query = query.eq('canonical_name', selector.canonical_name.trim()).eq('primary_phone_normalized', normalizePhone(selector.primary_phone));
  const { data, error } = await query;
  if (error) return { error: error.message };
  if (data.length !== 1) return { error: `local selector matched ${data.length} businesses` };
  return { business: data[0] };
}
async function children(client, businessId) {
  const [services, serviceAreas, hours] = await Promise.all([
    client.from('business_services').select('service_name,sort_order').eq('business_id', businessId),
    client.from('business_service_areas').select('name,city,state,country').eq('business_id', businessId),
    client.from('business_hours').select('day_of_week,opens_at,closes_at,is_closed,is_24_hours').eq('business_id', businessId)
  ]);
  for (const result of [services, serviceAreas, hours]) if (result.error) fail(`Could not read local listing package: ${result.error.message}`);
  return { services: services.data, serviceAreas: serviceAreas.data, hours: hours.data };
}
async function userByEmail(client, email) {
  const { data, error } = await client.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) fail(`Could not resolve staging user: ${error.message}`);
  return data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase()) || null;
}
async function categoryById(client, id) {
  const { data, error } = await client.from('categories').select('id,slug,name,active').eq('id', id).maybeSingle();
  if (error) fail(`Could not read local category: ${error.message}`);
  return data;
}
async function candidateRows(client, local) {
  const found = new Map();
  async function add(query, signal) {
    const { data, error } = await query;
    if (error) fail(`Could not read staging candidates: ${error.message}`);
    for (const row of data) {
      const current = found.get(row.id) || { ...row, signals: [] };
      current.signals.push(signal); found.set(row.id, current);
    }
  }
  for (const key of ['source_record_id', 'source_buss_id', 'source_place_id']) if (local[key]) await add(client.from('businesses').select(SELECT).eq(key, local[key]), `provenance:${key}`);
  if (local.source_loc_id) await add(client.from('businesses').select(SELECT).eq('source_loc_id', local.source_loc_id), 'provenance-support:source_loc_id');
  if (local.primary_phone_normalized) await add(client.from('businesses').select(SELECT).eq('primary_phone_normalized', local.primary_phone_normalized), 'phone');
  if (local.website_domain_normalized) await add(client.from('businesses').select(SELECT).eq('website_domain_normalized', local.website_domain_normalized), 'domain');
  if (local.canonical_name && local.city) await add(client.from('businesses').select(SELECT).eq('canonical_name', local.canonical_name).eq('city', local.city), 'name-location');
  return [...found.values()];
}
async function inspectEntry(entry, local, staging) {
  const base = { selectionKey: entry.selectionKey || null, ownerEmail: entry.ownerEmail || null };
  const publicationError = validateRequestedPublicationStatus(entry.requestedPublicationStatus);
  if (publicationError) return { ...base, classification: 'NEEDS REVIEW', action: 'skip', issues: [publicationError] };
  const selected = await queryOne(local, entry.localSelector);
  if (selected.error) return { ...base, classification: 'NEEDS REVIEW', action: 'skip', issues: [selected.error] };
  const business = selected.business;
  const listingChildren = await children(local, business.id);
  const localCategory = await categoryById(local, business.primary_category_id);
  let stageCategory = null;
  if (localCategory?.slug) {
    const { data, error } = await staging.from('categories').select('id,slug,name,active').eq('slug', localCategory.slug).eq('active', true).maybeSingle();
    if (error) fail(`Could not resolve staging category: ${error.message}`);
    stageCategory = data;
  }
  const owner = entry.ownerEmail ? await userByEmail(staging, entry.ownerEmail) : null;
  const ownerIssue = !owner ? 'staging owner is missing' : owner.app_metadata?.role !== 'business_owner' ? 'staging owner does not have business_owner role' : null;
  const privacy = privacyIssues(business);
  const candidates = await candidateRows(staging, business);
  const decision = classifyCandidate(business, candidates, { categoryMissing: !stageCategory, ownerIssue, privacyIssues: privacy });
  const issues = [!localCategory?.slug ? 'local primary category has no slug' : null, !stageCategory ? `missing active staging category for slug ${localCategory?.slug || '(unknown)'}` : null, ownerIssue, ...privacy].filter(Boolean);
  return { ...base, localBusiness: { canonicalName: business.canonical_name, city: business.city, localIdCopied: false }, classification: decision.classification, action: decision.action, candidates: candidates.map(({ id, canonical_name, city, signals }) => ({ id, canonicalName: canonical_name, city, signals })), issues, privacyCorrectionRequired: privacy.length > 0, package: makePackage(business, localCategory, listingChildren, entry.requestedPublicationStatus) };
}
async function main() {
  const { manifest } = args();
  if (!manifest) fail('--manifest requires a path');
  const raw = await fs.readFile(path.resolve(ROOT, manifest), 'utf8');
  const parsed = JSON.parse(raw);
  const entries = parsed.selectedBusinesses;
  if (!Array.isArray(entries)) fail('Manifest selectedBusinesses must be an array');
  const report = { mode: 'dry-run', writes: 0, manifest: path.relative(ROOT, path.resolve(ROOT, manifest)), selectedBusinesses: entries.length, results: [] };
  if (!entries.length) { console.log(JSON.stringify({ ...report, summary: { discovered: 0, existingInStaging: 0, localOnly: 0, possibleDuplicate: 0, needsReview: 0, create: 0, update: 0, skip: 0 } }, null, 2)); return; }
  if (process.env.APP_ENV !== 'staging') fail('APP_ENV=staging is required for a local-to-staging promotion dry run');
  const stagingUrl = env('STAGING_SUPABASE_URL');
  assertSafeMutationTarget(stagingUrl, 'staging business promotion dry run');
  const local = createClient(env('LOCAL_SUPABASE_URL'), env('LOCAL_SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false, autoRefreshToken: false } });
  const staging = createClient(stagingUrl, env('STAGING_SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false, autoRefreshToken: false } });
  const actor = await userByEmail(staging, env('STAGING_PROMOTION_ACTOR_EMAIL'));
  if (!actor || actor.app_metadata?.role !== 'admin') fail('STAGING_PROMOTION_ACTOR_EMAIL must resolve to an existing staging admin');
  report.promotionActor = { email: actor.email, role: actor.app_metadata.role };
  for (const entry of entries) report.results.push(await inspectEntry(entry, local, staging));
  const count = (predicate) => report.results.filter(predicate).length;
  report.summary = { discovered: report.results.filter((result) => result.localBusiness).length, existingInStaging: count((r) => r.classification === 'EXISTS IN STAGING'), localOnly: count((r) => r.classification === 'LOCAL ONLY'), possibleDuplicate: count((r) => r.classification === 'POSSIBLE DUPLICATE'), needsReview: count((r) => r.classification === 'NEEDS REVIEW'), create: count((r) => r.action === 'create'), update: count((r) => r.action === 'update'), skip: count((r) => r.action === 'skip') };
  console.log(JSON.stringify(report, null, 2));
}
main().catch((error) => { console.error(`PROMOTION DRY RUN FAILED: ${error.message}`); process.exitCode = 1; });
