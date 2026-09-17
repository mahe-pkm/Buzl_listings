/**
 * WhatsApp OTP Authentication & Delivery Types
 */

export interface PhoneNormalizationResult {
  success: boolean;
  e164?: string;
  countryCode?: string;
  nationalNumber?: string;
  formatted?: string;
  error?: string;
}

export interface WhatsAppOtpSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  cooldownSeconds?: number;
  retryAfter?: number;
}

export interface WhatsAppOtpVerifyResult {
  success: boolean;
  phone?: string;
  error?: string;
  attemptsRemaining?: number;
  lockedUntil?: number;
}

export interface WhatsAppOtpProviderContext {
  ip?: string;
  userAgent?: string;
  /**
   * Transient Supabase-generated OTP token received from the Auth Hook.
   * Transmitted immediately to the delivery provider; never persisted or logged.
   */
  otp?: string;
}

export interface MetaWhatsAppConfig {
  graphVersion: string;
  accessToken: string;
  phoneNumberId: string;
  wabaId: string;
  templateName: string;
  templateLanguage: string;
}

export interface WhatsAppOtpProvider {
  name: string;
  sendOtp(phone: string, context?: WhatsAppOtpProviderContext): Promise<WhatsAppOtpSendResult>;
  verifyOtp(phone: string, code: string, context?: WhatsAppOtpProviderContext): Promise<WhatsAppOtpVerifyResult>;
}
