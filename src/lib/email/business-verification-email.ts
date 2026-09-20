import "server-only";

import nodemailer, { type Transporter } from "nodemailer";

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required email configuration: ${name}`);
  return value;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character] ?? character);
}

function configuredTransport(): Transporter {
  const port = Number(required("BUSINESS_EMAIL_SMTP_PORT"));
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("BUSINESS_EMAIL_SMTP_PORT must be a valid TCP port.");
  }
  const user = process.env.BUSINESS_EMAIL_SMTP_USER?.trim();
  const password = process.env.BUSINESS_EMAIL_SMTP_PASSWORD;
  if (Boolean(user) !== Boolean(password)) {
    throw new Error("Business email SMTP username and password must be configured together.");
  }
  return nodemailer.createTransport({
    host: required("BUSINESS_EMAIL_SMTP_HOST"),
    port,
    secure: process.env.BUSINESS_EMAIL_SMTP_SECURE === "true",
    auth: user && password ? { user, pass: password } : undefined,
  });
}

export async function sendBusinessVerificationEmail(input: {
  to: string;
  businessName: string;
  verificationUrl: string;
  expiresInMinutes: number;
  transport?: Transporter;
}) {
  const safeBusinessName = escapeHtml(input.businessName);
  const safeUrl = escapeHtml(input.verificationUrl);
  const transport = input.transport ?? configuredTransport();
  return transport.sendMail({
    from: required("BUSINESS_EMAIL_FROM"),
    to: input.to,
    subject: "Verify your business email — Buzl Listing",
    text: `Verify this email address for ${input.businessName}.\n\n${input.verificationUrl}\n\nThis link expires in ${input.expiresInMinutes} minutes.`,
    html: `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#2A3547"><h1 style="font-size:20px">Verify your business email</h1><p>Verify this email address for <strong>${safeBusinessName}</strong>.</p><p><a href="${safeUrl}" style="display:inline-block;background:#004AAD;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none">Verify Business Email</a></p><p style="font-size:13px;color:#5D6776">This link expires in ${input.expiresInMinutes} minutes. If you did not request it, you can ignore this email.</p></body></html>`,
  });
}
