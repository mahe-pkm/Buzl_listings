import { randomBytes } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const envPath = path.resolve(".env.local");
const temporaryPath = `${envPath}.tmp`;

const ignoreCheck = spawnSync("git", ["check-ignore", "-q", ".env.local"], {
  cwd: process.cwd(),
  stdio: "ignore",
});

if (ignoreCheck.status !== 0) {
  throw new Error("Refusing to write the hook secret because .env.local is not Git ignored");
}

const existing = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
const lines = existing.split(/\r?\n/);
let changed = false;

function ensureValue(name, isValid, createValue, comment) {
  const index = lines.findIndex((line) =>
    new RegExp(`^\\s*${name}\\s*=`).test(line)
  );
  const currentValue =
    index >= 0 ? lines[index].slice(lines[index].indexOf("=") + 1).trim() : "";

  if (isValid(currentValue)) return;

  const replacement = `${name}=${createValue()}`;
  if (index >= 0) {
    lines[index] = replacement;
  } else {
    if (lines.length > 0 && lines.at(-1) !== "") lines.push("");
    lines.push(comment);
    lines.push(replacement);
  }
  changed = true;
}

ensureValue(
  "SEND_SMS_HOOK_SECRETS",
  (value) => /^v1,whsec_[A-Za-z0-9+/]{43}=$/.test(value),
  () => `v1,whsec_${randomBytes(32).toString("base64")}`,
  "# Local Supabase Send SMS Auth Hook signing secret"
);
ensureValue(
  "SUPABASE_AUTH_SMS_TWILIO_AUTH_TOKEN",
  (value) => value.length >= 32,
  () => randomBytes(32).toString("hex"),
  "# Inert local provider token required by Supabase CLI to enable phone Auth; delivery uses the hook"
);

if (changed) {
  fs.writeFileSync(temporaryPath, `${lines.join("\n").replace(/\n+$/, "")}\n`, {
    encoding: "utf8",
    mode: 0o600,
  });
  fs.renameSync(temporaryPath, envPath);
}

console.log("SEND_SMS_HOOK_SECRETS=READY");
console.log("LOCAL_PHONE_PROVIDER_COMPATIBILITY=READY");
