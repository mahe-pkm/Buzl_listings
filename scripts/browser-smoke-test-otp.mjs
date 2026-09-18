import { chromium } from "playwright";
import { loadLocalFixtureEnvironment } from "./lib/local-fixture-env.mjs";

loadLocalFixtureEnvironment();

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";
const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const MAILPIT_URL = "http://127.0.0.1:54324";

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(message);
  }
  console.log(`  ✓ ${message}`);
}

async function clearMailbox() {
  try {
    await fetch(`${MAILPIT_URL}/api/v1/messages`, { method: "DELETE" });
  } catch (e) {
    console.error("Failed to clear mailbox", e.message);
  }
}

async function getLatestOtp(recipientEmail) {
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 500));
    const res = await fetch(`${MAILPIT_URL}/api/v1/messages`);
    const data = await res.json();
    const msgs = data.messages || [];
    const msg = msgs.find((m) =>
      m.To?.some((t) => t.Address.toLowerCase() === recipientEmail.toLowerCase())
    );
    if (msg) {
      const msgRes = await fetch(`${MAILPIT_URL}/api/v1/message/${msg.ID}`);
      const detail = await msgRes.json();
      const body = detail.Text || detail.HTML || "";
      const match = body.match(/\b\d{6}\b/);
      if (match) return match[0];
    }
  }
  throw new Error(`No OTP found in Mailpit for ${recipientEmail}`);
}

async function main() {
  console.log("==================================================");
  console.log("🚀 STARTING BROWSER SMOKE TEST: EMAIL OTP AUTH");
  console.log(`Base URL: ${BASE_URL}`);
  console.log("==================================================\n");

  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });

  const page = await context.newPage();
  page.on("console", (msg) => {
    if (msg.type() === "error") console.log("BROWSER CONSOLE ERROR:", msg.text());
  });

  try {
    // ----------------------------------------------------
    // SUITE 1: Existing Business Owner OTP Login
    // ----------------------------------------------------
    console.log("➡️ SUITE 1: Existing Business Owner OTP Login");
    await clearMailbox();

    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState("networkidle");

    // Check tabs
    const otpTab = page.locator("button", { hasText: "Email Code (OTP)" });
    await assert(await otpTab.isVisible(), "Email Code (OTP) tab visible");

    // Fill email
    await page.fill("#otp-email", "owner@buzl.test");
    await page.click('button:has-text("Continue with Email OTP")');

    // Wait for verify step
    const tokenInput = page.locator("#otp-token");
    await tokenInput.waitFor({ state: "visible", timeout: 10000 });
    assert(true, "Switched to OTP verification step");

    // Get OTP from Mailpit
    const otpCode = await getLatestOtp("owner@buzl.test");
    console.log(`  Found OTP in Mailpit: ${otpCode}`);
    assert(Boolean(otpCode && otpCode.length === 6), "Fetched 6-digit code from Mailpit");

    // Fill OTP
    await tokenInput.fill(otpCode);
    await page.click('button:has-text("Verify and Sign In")');

    // Wait for redirect to dashboard
    await page.waitForURL("**/dashboard**", { timeout: 15000 });
    assert(page.url().includes("/dashboard"), "Redirected to /dashboard after OTP verification");

    // ----------------------------------------------------
    // SUITE 2: Logout
    // ----------------------------------------------------
    console.log("\n➡️ SUITE 2: Logout");
    await page.goto(`${BASE_URL}/auth/logout`);
    await page.waitForURL("**/login**", { timeout: 15000 });
    assert(page.url().includes("/login"), "Logged out and returned to /login");

    // ----------------------------------------------------
    // SUITE 3: Password Login Regression
    // ----------------------------------------------------
    console.log("\n➡️ SUITE 3: Password Login Regression");
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState("networkidle");

    // Switch to Password tab
    await page.click('button:has-text("Password")');
    const pwdEmail = page.locator("#password-email");
    await pwdEmail.waitFor({ state: "visible" });
    assert(true, "Switched to Password tab");

    await pwdEmail.fill("owner@buzl.test");
    if (!process.env.LOCAL_FIXTURE_OWNER_PASSWORD) throw new Error("LOCAL_FIXTURE_OWNER_PASSWORD is required");
    await page.fill("#password-input", process.env.LOCAL_FIXTURE_OWNER_PASSWORD);
    await page.click('button:has-text("Sign In with Password")');

    await page.waitForURL("**/dashboard**", { timeout: 15000 });
    assert(page.url().includes("/dashboard"), "Password login succeeded and reached /dashboard");

    // Logout again
    await page.goto(`${BASE_URL}/auth/logout`);
    await page.waitForURL("**/login**", { timeout: 15000 });

    // ----------------------------------------------------
    // SUITE 4: New User Signup with Email OTP
    // ----------------------------------------------------
    console.log("\n➡️ SUITE 4: New User Signup with Email OTP");
    await clearMailbox();
    const newOwnerEmail = `browser_owner_${Date.now()}@example.com`;

    await page.goto(`${BASE_URL}/signup`);
    await page.waitForLoadState("networkidle");

    const signupOtpTab = page.locator("button", { hasText: "Email Code (OTP)" });
    await assert(await signupOtpTab.isVisible(), "Signup Email OTP tab visible");

    await page.fill("#signup-otp-email", newOwnerEmail);
    await page.click('button:has-text("Continue with Email OTP")');

    const signupTokenInput = page.locator("#signup-otp-token");
    await signupTokenInput.waitFor({ state: "visible", timeout: 10000 });
    assert(true, "Signup switched to verification step");

    const newOtp = await getLatestOtp(newOwnerEmail);
    console.log(`  Found new user OTP in Mailpit: ${newOtp}`);
    assert(Boolean(newOtp && newOtp.length === 6), "Fetched new user 6-digit OTP");

    await signupTokenInput.fill(newOtp);
    await page.click('button:has-text("Verify and Create Account")');

    await page.waitForURL("**/dashboard**", { timeout: 15000 });
    assert(page.url().includes("/dashboard"), "New user authenticated and redirected to /dashboard");

    console.log("\n==================================================");
    console.log("🎉 ALL BROWSER SMOKE TESTS PASSED (100%)");
    console.log("==================================================");
  } finally {
    await context.close();
    await browser.close();
  }
}

main().catch((err) => {
  console.error("\n❌ Browser smoke test failed:", err);
  process.exit(1);
});
