import "server-only";

import { normalizePhoneNumber } from "./phone";
import type {
  MetaWhatsAppConfig,
  WhatsAppOtpProvider,
  WhatsAppOtpProviderContext,
  WhatsAppOtpSendResult,
} from "./types";

const LOCKED_TEMPLATE_NAME = "buzl_listing_otp";
const LOCKED_TEMPLATE_LANGUAGE = "en";
const GRAPH_VERSION_PATTERN = /^v\d+\.\d+$/;
const OTP_PATTERN = /^\d{4,10}$/;

type FetchLike = typeof fetch;

type MetaErrorBody = {
  error?: {
    code?: number;
    error_subcode?: number;
  };
};

type MetaSuccessBody = {
  messages?: Array<{ id?: string }>;
};

export class MetaWhatsAppDeliveryError extends Error {
  readonly httpStatus: number;
  readonly providerCode?: number;
  readonly providerSubcode?: number;

  constructor(httpStatus: number, providerCode?: number, providerSubcode?: number) {
    super("WhatsApp delivery was rejected by the provider.");
    this.name = "MetaWhatsAppDeliveryError";
    this.httpStatus = httpStatus;
    this.providerCode = providerCode;
    this.providerSubcode = providerSubcode;
  }
}

function requiredEnvironmentValue(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required server configuration: ${name}`);
  }
  return value;
}

export function readMetaWhatsAppConfig(): MetaWhatsAppConfig {
  const config: MetaWhatsAppConfig = {
    graphVersion: requiredEnvironmentValue("META_GRAPH_API_VERSION"),
    accessToken: requiredEnvironmentValue("META_WHATSAPP_ACCESS_TOKEN"),
    phoneNumberId: requiredEnvironmentValue("META_WHATSAPP_PHONE_NUMBER_ID"),
    wabaId: requiredEnvironmentValue("META_WHATSAPP_BUSINESS_ACCOUNT_ID"),
    templateName: requiredEnvironmentValue("META_WHATSAPP_TEMPLATE_NAME"),
    templateLanguage: requiredEnvironmentValue("META_WHATSAPP_TEMPLATE_LANGUAGE"),
  };

  if (!GRAPH_VERSION_PATTERN.test(config.graphVersion)) {
    throw new Error("META_GRAPH_API_VERSION must use the form vXX.X");
  }
  if (!/^\d+$/.test(config.phoneNumberId) || !/^\d+$/.test(config.wabaId)) {
    throw new Error("Meta resource identifiers must contain digits only");
  }
  if (config.templateName !== LOCKED_TEMPLATE_NAME) {
    throw new Error(`META_WHATSAPP_TEMPLATE_NAME must be ${LOCKED_TEMPLATE_NAME}`);
  }
  if (config.templateLanguage !== LOCKED_TEMPLATE_LANGUAGE) {
    throw new Error(`META_WHATSAPP_TEMPLATE_LANGUAGE must be ${LOCKED_TEMPLATE_LANGUAGE}`);
  }

  return config;
}

export function buildMetaAuthenticationTemplatePayload(
  recipientE164: string,
  otp: string,
  config: Pick<MetaWhatsAppConfig, "templateName" | "templateLanguage">
) {
  const normalized = normalizePhoneNumber(recipientE164);
  if (!normalized.success || !normalized.e164) {
    throw new Error("A valid E.164 WhatsApp recipient is required");
  }
  if (!OTP_PATTERN.test(otp)) {
    throw new Error("A valid transient Supabase OTP is required");
  }

  return {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: normalized.e164.slice(1),
    type: "template",
    template: {
      name: config.templateName,
      language: { code: config.templateLanguage },
      components: [
        {
          type: "body",
          parameters: [{ type: "text", text: otp }],
        },
        {
          type: "button",
          sub_type: "url",
          index: "0",
          parameters: [{ type: "text", text: otp }],
        },
      ],
    },
  } as const;
}

export async function sendMetaWhatsAppOtp(
  phone: string,
  otp: string,
  options: { fetchImpl?: FetchLike; config?: MetaWhatsAppConfig } = {}
): Promise<WhatsAppOtpSendResult> {
  const config = options.config ?? readMetaWhatsAppConfig();
  const fetchImpl = options.fetchImpl ?? fetch;
  const payload = buildMetaAuthenticationTemplatePayload(phone, otp, config);
  const endpoint = `https://graph.facebook.com/${config.graphVersion}/${config.phoneNumberId}/messages`;

  const response = await fetchImpl(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  let body: MetaErrorBody & MetaSuccessBody = {};
  try {
    body = (await response.json()) as MetaErrorBody & MetaSuccessBody;
  } catch {
    // Provider response bodies are never echoed or logged.
  }

  const messageId = body.messages?.[0]?.id;
  if (!response.ok || !messageId) {
    throw new MetaWhatsAppDeliveryError(
      response.status,
      body.error?.code,
      body.error?.error_subcode
    );
  }

  return { success: true, messageId };
}

export const metaWhatsAppOtpProvider: WhatsAppOtpProvider = {
  name: "meta-whatsapp-cloud-api",
  async sendOtp(phone: string, context?: WhatsAppOtpProviderContext) {
    if (!context?.otp) {
      return { success: false, error: "Transient Supabase OTP is required" };
    }
    return sendMetaWhatsAppOtp(phone, context.otp);
  },
};
