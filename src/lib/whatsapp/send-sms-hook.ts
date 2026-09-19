import "server-only";

import { Webhook } from "standardwebhooks";
import { z } from "zod";

import { sendMetaWhatsAppOtp } from "./meta-provider";

const sendSmsHookPayloadSchema = z.object({
  user: z.object({
    phone: z.string().min(8).max(32),
  }),
  sms: z.object({
    otp: z.string().regex(/^\d{4,10}$/),
  }),
});

export type SendSmsHookPayload = z.infer<typeof sendSmsHookPayloadSchema>;

export class SendSmsHookVerificationError extends Error {
  constructor() {
    super("Send SMS hook signature verification failed");
    this.name = "SendSmsHookVerificationError";
  }
}

function hookSecrets(): string[] {
  const configured = (
    process.env.SEND_SMS_HOOK_SECRETS ?? process.env.SEND_SMS_HOOK_SECRET ?? ""
  ).trim();
  if (!configured) {
    throw new Error("Missing required server configuration: SEND_SMS_HOOK_SECRETS");
  }

  return configured
    .split("|")
    .map((secret) => secret.trim().replace(/^v1,whsec_/, ""))
    .filter(Boolean);
}

export function verifySendSmsHook(payload: string, headers: Headers): SendSmsHookPayload {
  const verificationHeaders = Object.fromEntries(headers.entries());

  for (const secret of hookSecrets()) {
    try {
      const verified = new Webhook(secret).verify(payload, verificationHeaders);
      return sendSmsHookPayloadSchema.parse(verified);
    } catch {
      // Try the next configured rotation secret and fail closed after all fail.
    }
  }

  throw new SendSmsHookVerificationError();
}

export async function deliverSendSmsHook(payload: SendSmsHookPayload): Promise<void> {
  await sendMetaWhatsAppOtp(payload.user.phone, payload.sms.otp);
}
