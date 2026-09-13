import { chromium } from "playwright";

const baseUrl = process.env.TEST_BASE_URL || "http://localhost:3000";
const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

const fixtures = {
  owner: {
    email: requireEnv("LOCAL_FIXTURE_OWNER_EMAIL"),
    password: requireEnv("LOCAL_FIXTURE_OWNER_PASSWORD"),
    expectedPath: "/dashboard",
  },
  member: {
    email: requireEnv("LOCAL_FIXTURE_MEMBER_EMAIL"),
    password: requireEnv("LOCAL_FIXTURE_MEMBER_PASSWORD"),
    expectedPath: "/admin/businesses/import",
  },
  admin: {
    email: requireEnv("LOCAL_FIXTURE_ADMIN_EMAIL"),
    password: requireEnv("LOCAL_FIXTURE_ADMIN_PASSWORD"),
    expectedPath: "/admin/businesses",
  },
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
  console.log(`PASS: ${message}`);
}

async function signIn(context, fixture) {
  const page = await context.newPage();
  const pageErrors = [];
  const relevantRequests = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") pageErrors.push(message.text());
  });
  page.on("response", (response) => {
    if (response.url().includes("/auth/v1/") || response.url().startsWith(baseUrl)) {
      relevantRequests.push(`${response.status()} ${response.url()}`);
    }
  });

  console.log(`Checking login for ${fixture.email}`);
  try {
    await page.goto(`${baseUrl}/login`, { waitUntil: "commit", timeout: 10000 });
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  } catch (error) {
    const browserErrors = pageErrors.length ? ` Browser errors: ${pageErrors.join(" | ")}` : "";
    throw new Error(`${error.message}${browserErrors}`);
  }
  await page.fill('input[type="email"]', fixture.email);
  await page.fill('input[type="password"]', fixture.password);
  await page.click('button[type="submit"]');
  try {
    await page.waitForURL(`**${fixture.expectedPath}**`, { timeout: 15000 });
  } catch (error) {
    const feedback = await page.locator("form").evaluate((form) => form.parentElement?.textContent ?? "").catch(() => "");
    const cookieNames = (await context.cookies()).map((cookie) => `${cookie.domain}:${cookie.name}`).join(", ");
    throw new Error(`${error.message} Login feedback: ${feedback} Cookies: ${cookieNames || "none"} Requests: ${relevantRequests.join(" | ")}`);
  }
  assert(page.url().includes(fixture.expectedPath), `${fixture.email} reaches ${fixture.expectedPath}`);
  assert(pageErrors.length === 0, `${fixture.email} login has no browser runtime errors`);
  return page;
}

async function main() {
  console.log(`Checking authenticated routes at ${baseUrl}`);
  const browser = await chromium.launch({ executablePath: chromePath, headless: true });

  try {
    const ownerContext = await browser.newContext();
    const ownerPage = await signIn(ownerContext, fixtures.owner);
    await ownerPage.goto(`${baseUrl}/admin/businesses/import`, { waitUntil: "domcontentloaded" });
    assert(ownerPage.url().includes("/dashboard"), "business owner is denied the importer route");
    await ownerContext.close();

    const memberContext = await browser.newContext();
    const memberPage = await signIn(memberContext, fixtures.member);
    await memberPage.goto(`${baseUrl}/admin/businesses`, { waitUntil: "domcontentloaded" });
    assert(memberPage.url().includes("/admin/businesses/import"), "Buzl Member is denied the general admin route");
    await memberContext.close();

    const adminContext = await browser.newContext();
    await signIn(adminContext, fixtures.admin);
    await adminContext.close();

    const anonymousContext = await browser.newContext();
    const anonymousPage = await anonymousContext.newPage();
    await anonymousPage.goto(`${baseUrl}/dashboard`, { waitUntil: "domcontentloaded" });
    assert(anonymousPage.url().includes("/login"), "anonymous visitor is redirected to login");
    await anonymousContext.close();
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(`Auth fixture verification failed: ${error.message}`);
  process.exit(1);
});
