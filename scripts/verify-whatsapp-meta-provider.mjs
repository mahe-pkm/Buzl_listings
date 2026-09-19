import assert from "node:assert/strict";
import { randomInt } from "node:crypto";

import nextEnv from "@next/env";
import { Webhook } from "standardwebhooks";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const requiredEnvironment = [
  "META_WHATSAPP_ACCESS_TOKEN",
  "META_WHATSAPP_PHONE_NUMBER_ID",
  "META_WHATSAPP_BUSINESS_ACCOUNT_ID",
  "META_WHATSAPP_TEMPLATE_NAME",
  "META_WHATSAPP_TEMPLATE_LANGUAGE",
  "META_GRAPH_API_VERSION",
  "WHATSAPP_TEST_RECIPIENT",
  "ALLOW_WHATSAPP_LIVE_SEND",
];

const liveMode = process.argv.includes("--live");
const checkEnvironmentMode = process.argv.includes("--check-env");
const providerModule = await import("../src/lib/whatsapp/meta-provider.ts");
const hookModule = await import("../src/lib/whatsapp/send-sms-hook.ts");

const {
  MetaWhatsAppDeliveryError,
  buildMetaAuthenticationTemplatePayload,
  sendMetaWhatsAppOtp,
} = providerModule;
const { SendSmsHookVerificationError, verifySendSmsHook } = hookModule;

const testConfig = {
  graphVersion: "v22.0",
  accessToken: "unit-test-token",
  phoneNumberId: "123456789",
  wabaId: "987654321",
  templateName: "buzl_listing_otp",
  templateLanguage: "en",
};
const testOtp = "654321";
const testPhone = "+919876543210";

const templatePayload = buildMetaAuthenticationTemplatePayload(testPhone, testOtp, testConfig);
assert.equal(templatePayload.to, "919876543210");
assert.equal(templatePayload.template.name, "buzl_listing_otp");
assert.equal(templatePayload.template.language.code, "en");
assert.equal(templatePayload.template.components[0].parameters[0].text, testOtp);
assert.equal(templatePayload.template.components[1].parameters[0].text, testOtp);

let capturedEndpoint = "";
let capturedAuthorization = "";
const success = await sendMetaWhatsAppOtp(testPhone, testOtp, {
  config: testConfig,
  fetchImpl: async (input, init) => {
    capturedEndpoint = String(input);
    capturedAuthorization = new Headers(init?.headers).get("authorization") ?? "";
    return new Response(JSON.stringify({ messages: [{ id: "test-message-id" }] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  },
});
assert.equal(
  capturedEndpoint,
  "https://graph.facebook.com/v22.0/123456789/messages"
);
assert.equal(capturedAuthorization, "Bearer unit-test-token");
assert.equal(success.success, true);

await assert.rejects(
  () =>
    sendMetaWhatsAppOtp(testPhone, testOtp, {
      config: testConfig,
      fetchImpl: async () =>
        new Response(JSON.stringify({ error: { code: 190, error_subcode: 463 } }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }),
    }),
  MetaWhatsAppDeliveryError
);

const hookSecretBase64 = Buffer.alloc(32, 7).toString("base64");
process.env.SEND_SMS_HOOK_SECRETS = `v1,whsec_${hookSecretBase64}`;
const hookPayload = JSON.stringify({
  user: { phone: testPhone },
  sms: { otp: testOtp },
});
const webhookId = "whatsapp-provider-unit-test";
const webhookDate = new Date();
const webhook = new Webhook(hookSecretBase64);
const hookHeaders = new Headers({
  "webhook-id": webhookId,
  "webhook-timestamp": String(Math.floor(webhookDate.getTime() / 1000)),
  "webhook-signature": webhook.sign(webhookId, webhookDate, hookPayload),
});
assert.deepEqual(verifySendSmsHook(hookPayload, hookHeaders), {
  user: { phone: testPhone },
  sms: { otp: testOtp },
});
await assert.rejects(
  async () => verifySendSmsHook(hookPayload, new Headers()),
  SendSmsHookVerificationError
);

console.log("Meta provider contract: PASS");
console.log("Authentication template mapping: PASS");
console.log("Standard Webhooks verification: PASS");
console.log("Provider error sanitization: PASS");

if (checkEnvironmentMode) {
  for (const name of requiredEnvironment) {
    console.log(`${name}=${process.env[name]?.trim() ? "READY" : "MISSING"}`);
  }
  process.exit(0);
}

if (!liveMode) {
  console.log("Direct Template Send: NOT_TESTED (run with --live after secure environment setup)");
  process.exit(0);
}

for (const name of requiredEnvironment) {
  const ready = Boolean(process.env[name]?.trim());
  console.log(`${name}=${ready ? "READY" : "MISSING"}`);
  if (!ready) process.exitCode = 2;
}
if (process.exitCode) process.exit();

if (process.env.ALLOW_WHATSAPP_LIVE_SEND !== "true") {
  throw new Error("ALLOW_WHATSAPP_LIVE_SEND=true is required for a controlled live send");
}

const liveOtp = String(randomInt(100000, 1000000));
try {
  const liveResult = await sendMetaWhatsAppOtp(
    process.env.WHATSAPP_TEST_RECIPIENT,
    liveOtp
  );
  assert.equal(liveResult.success, true);
  assert.ok(liveResult.messageId);
  console.log("Meta Authentication: PASS");
  console.log("Graph API Connectivity: PASS");
  console.log("Template Accepted: PASS");
  console.log("Message ID Returned: PASS");
  console.log("WhatsApp Message Received: WAITING_FOR_OPERATOR_CONFIRMATION");
} catch (error) {
  if (error instanceof MetaWhatsAppDeliveryError) {
    console.error(`Meta Authentication: FAIL (HTTP ${error.httpStatus})`);
    console.error(`Meta error code: ${error.providerCode ?? "unavailable"}`);
    console.error(`Meta error subcode: ${error.providerSubcode ?? "unavailable"}`);
    console.error("Safe description: WhatsApp template delivery was rejected by Meta.");
  } else {
    console.error("Meta Authentication: FAIL (configuration or network error)");
  }
  process.exitCode = 1;
}
