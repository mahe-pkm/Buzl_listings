import assert from "node:assert/strict";

import nextEnv from "@next/env";
import { Webhook } from "standardwebhooks";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const configuredSecret = process.env.SEND_SMS_HOOK_SECRETS?.trim();
if (!configuredSecret) {
  throw new Error("SEND_SMS_HOOK_SECRETS is required");
}

const secret = configuredSecret.replace(/^v1,whsec_/, "");
const endpoint =
  process.env.WHATSAPP_HOOK_TEST_URL ??
  "http://127.0.0.1:3000/api/internal/auth-hooks/send-sms";
const payload = JSON.stringify({
  user: { phone: "+15555550123" },
  sms: { otp: "000000" },
});
const webhookId = "whatsapp-runtime-signature-check";
const webhookDate = new Date();
const webhook = new Webhook(secret);
const validHeaders = {
  "content-type": "application/json",
  "webhook-id": webhookId,
  "webhook-timestamp": String(Math.floor(webhookDate.getTime() / 1000)),
  "webhook-signature": webhook.sign(webhookId, webhookDate, payload),
};

const missing = await fetch(endpoint, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: payload,
});
assert.equal(missing.status, 401);

const invalid = await fetch(endpoint, {
  method: "POST",
  headers: {
    ...validHeaders,
    "webhook-signature": "v1,invalid-signature",
  },
  body: payload,
});
assert.equal(invalid.status, 401);

const valid = await fetch(endpoint, {
  method: "POST",
  headers: validHeaders,
  body: payload,
});
assert.equal(
  valid.status,
  500,
  "The signature-only server must disable provider delivery and return its sanitized configuration error"
);

console.log("Missing signature rejected: PASS");
console.log("Invalid signature rejected: PASS");
console.log("Valid signature accepted by verifier: PASS");
console.log("Provider delivery attempted: NO");
