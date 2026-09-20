'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient, getSessionUser } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  BUSINESS_EMAIL_VERIFICATION_EXPIRY_MINUTES,
  buildBusinessEmailVerificationUrl,
  createBusinessEmailVerificationToken,
  hashBusinessEmailVerificationToken,
  toPostgresBytea,
} from '@/lib/business-email-verification';
import { sendBusinessVerificationEmail } from '@/lib/email/business-verification-email';

export async function requestBusinessEmailVerification(businessId: string) {
  const user = await getSessionUser();
  if (!user || user.accountStatus !== 'active') {
    return { success: false, error: 'Active account required.' };
  }

  const token = createBusinessEmailVerificationToken();
  const tokenHash = toPostgresBytea(hashBusinessEmailVerificationToken(token));
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('create_business_email_verification_challenge', {
    target_business_id: businessId,
    supplied_token_hash: tokenHash,
  });
  const challenge = Array.isArray(data) ? data[0] : data;
  if (error || !challenge?.normalized_email || !challenge?.business_name) {
    return { success: false, error: 'Unable to send a verification email. Please try again later.' };
  }

  try {
    await sendBusinessVerificationEmail({
      to: challenge.normalized_email,
      businessName: challenge.business_name,
      verificationUrl: buildBusinessEmailVerificationUrl(token),
      expiresInMinutes: BUSINESS_EMAIL_VERIFICATION_EXPIRY_MINUTES,
    });
  } catch {
    const admin = createAdminClient();
    await admin.rpc('discard_business_email_verification_challenge', {
      supplied_token_hash: tokenHash,
    });
    return { success: false, error: 'Unable to send a verification email. Please try again later.' };
  }

  revalidatePath(`/dashboard/businesses/${businessId}/edit`);
  return { success: true as const, status: 'sent' as const };
}

export async function verifyBusinessEmailToken(token: string) {
  if (!token || token.length > 256) redirect('/verify-business-email?status=invalid');
  const tokenHash = toPostgresBytea(hashBusinessEmailVerificationToken(token));
  const admin = createAdminClient();
  const { data, error } = await admin.rpc('consume_business_email_verification_token', {
    supplied_token_hash: tokenHash,
  });
  const result = Array.isArray(data) ? data[0] : data;
  if (error || !result?.business_id) {
    redirect(`/verify-business-email?status=invalid&token=${encodeURIComponent(token)}`);
  }

  const cookieStore = await cookies();
  cookieStore.set('buzl_verified_business', result.business_id, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 300,
    path: '/',
  });
  revalidatePath(`/dashboard/businesses/${result.business_id}/edit`);
  redirect('/verify-business-email?status=success');
}

export async function getVerifiedBusinessReturnPath(): Promise<string> {
  const cookieStore = await cookies();
  const businessId = cookieStore.get('buzl_verified_business')?.value;
  if (!businessId || !/^[0-9a-f-]{36}$/i.test(businessId)) return '/dashboard/businesses';
  return `/dashboard/businesses/${businessId}/edit`;
}

export async function getAuthorizedResendBusinessId(token: string): Promise<string | null> {
  if (!token || token.length > 256) return null;
  const user = await getSessionUser();
  if (!user || user.accountStatus !== 'active') return null;

  const admin = createAdminClient();
  const tokenHash = toPostgresBytea(hashBusinessEmailVerificationToken(token));
  const { data: businessId } = await admin.rpc('resolve_business_email_verification_challenge', {
    supplied_token_hash: tokenHash,
  });
  if (!businessId) return null;

  const supabase = await createClient();
  const { data: manages } = await supabase.rpc('is_business_manager', {
    target_business_id: businessId,
  });
  return manages ? (businessId as string) : null;
}
