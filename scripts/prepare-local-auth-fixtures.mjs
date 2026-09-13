import { createClient } from "@supabase/supabase-js";
import { loadLocalFixtureEnvironment } from "./lib/local-fixture-env.mjs";

loadLocalFixtureEnvironment();

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function assertLocalTarget(url) {
  if (process.env.BUZL_LOCAL_FIXTURES !== "true") {
    throw new Error("Refusing to prepare fixtures: BUZL_LOCAL_FIXTURES=true is required");
  }

  const hostname = new URL(url).hostname.toLowerCase();
  const isLoopback = hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  if (!isLoopback) {
    throw new Error("Refusing to prepare fixtures: LOCAL_SUPABASE_URL must be a loopback URL");
  }
}

async function findUserByEmail(admin, email) {
  let page = 1;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(`Unable to list local users: ${error.message}`);

    const match = data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
    if (match) return match;
    if (!data.nextPage) return null;
    page = data.nextPage;
  }
}

async function ensurePersona(admin, persona) {
  let user = await findUserByEmail(admin, persona.email);
  const authAttributes = {
    email: persona.email,
    password: persona.password,
    email_confirm: true,
    // Reset must also clear a previous local suspension in GoTrue, not only
    // restore the app profile's account_status.
    ban_duration: "none",
    app_metadata: { ...(user?.app_metadata ?? {}), role: persona.role },
    user_metadata: { ...(user?.user_metadata ?? {}), full_name: persona.fullName },
  };

  if (user) {
    const { data, error } = await admin.auth.admin.updateUserById(user.id, authAttributes);
    if (error) throw new Error(`Unable to reset local ${persona.role} fixture: ${error.message}`);
    user = data.user;
    console.log(`Updated local ${persona.role} fixture: ${persona.email}`);
  } else {
    const { data, error } = await admin.auth.admin.createUser(authAttributes);
    if (error || !data.user) throw new Error(`Unable to create local ${persona.role} fixture: ${error?.message ?? "unknown error"}`);
    user = data.user;
    console.log(`Created local ${persona.role} fixture: ${persona.email}`);
  }

  const { error: profileError } = await admin
    .from("profiles")
    .upsert(
      {
        id: user.id,
        full_name: persona.fullName,
        member_id: persona.memberId,
        account_status: "active",
        permission_preset: persona.permissionPreset ?? null,
      },
      { onConflict: "id" }
    );
  if (profileError) throw new Error(`Unable to synchronize local ${persona.role} profile: ${profileError.message}`);
}

async function main() {
  const url = requireEnv("LOCAL_SUPABASE_URL");
  const serviceRoleKey = requireEnv("LOCAL_SUPABASE_SERVICE_ROLE_KEY");
  assertLocalTarget(url);

  const personas = [
    {
      email: requireEnv("LOCAL_FIXTURE_OWNER_EMAIL"),
      password: requireEnv("LOCAL_FIXTURE_OWNER_PASSWORD"),
      role: "business_owner",
      fullName: "Buzl Demo Business Owner",
      memberId: null,
    },
    {
      email: requireEnv("LOCAL_FIXTURE_MEMBER_EMAIL"),
      password: requireEnv("LOCAL_FIXTURE_MEMBER_PASSWORD"),
      role: "buzl_member",
      fullName: "Buzl Onboarding Specialist",
      memberId: "BUZL-M-1024",
      permissionPreset: "onboarding_member",
    },
    {
      email: requireEnv("LOCAL_FIXTURE_MANAGER_EMAIL"),
      password: requireEnv("LOCAL_FIXTURE_MANAGER_PASSWORD"),
      role: "buzl_member",
      fullName: "Buzl Listing Manager",
      memberId: "BUZL-M-1025",
      permissionPreset: "listing_manager",
    },
    {
      email: requireEnv("LOCAL_FIXTURE_ADMIN_EMAIL"),
      password: requireEnv("LOCAL_FIXTURE_ADMIN_PASSWORD"),
      role: "admin",
      fullName: "Buzl System Administrator",
      memberId: "BUZL-M-0001",
    },
  ];

  const admin = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log("Preparing local Buzl authentication fixtures.");
  for (const persona of personas) await ensurePersona(admin, persona);
  console.log("Local Buzl authentication fixtures are ready.");
}

main().catch((error) => {
  console.error(`Local fixture preparation failed: ${error.message}`);
  process.exit(1);
});
