import {
  deliverSendSmsHook,
  SendSmsHookVerificationError,
  verifySendSmsHook,
} from "@/lib/whatsapp/send-sms-hook";
import { MetaWhatsAppDeliveryError } from "@/lib/whatsapp/meta-provider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const jsonHeaders = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json",
};

export async function POST(request: Request) {
  const rawPayload = await request.text();

  try {
    const payload = verifySendSmsHook(rawPayload, request.headers);
    await deliverSendSmsHook(payload);
    return new Response("{}", { status: 200, headers: jsonHeaders });
  } catch (error) {
    if (error instanceof SendSmsHookVerificationError) {
      return Response.json(
        { error: { http_code: 401, message: "Invalid hook signature." } },
        { status: 401, headers: jsonHeaders }
      );
    }

    if (error instanceof MetaWhatsAppDeliveryError) {
      return Response.json(
        { error: { http_code: 502, message: "WhatsApp delivery is temporarily unavailable." } },
        { status: 502, headers: jsonHeaders }
      );
    }

    return Response.json(
      { error: { http_code: 500, message: "WhatsApp delivery is not configured." } },
      { status: 500, headers: jsonHeaders }
    );
  }
}
