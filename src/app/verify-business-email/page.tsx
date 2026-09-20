import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  getAuthorizedResendBusinessId,
  getVerifiedBusinessReturnPath,
  requestBusinessEmailVerification,
  verifyBusinessEmailToken,
} from '@/lib/business-email-verification-actions';

type Props = {
  searchParams: Promise<{ token?: string; status?: string }>;
};

export const dynamic = 'force-dynamic';

export default async function VerifyBusinessEmailPage({ searchParams }: Props) {
  const { token, status } = await searchParams;
  const returnPath = status === 'success' ? await getVerifiedBusinessReturnPath() : '/dashboard/businesses';
  const action = token ? verifyBusinessEmailToken.bind(null, token) : null;
  const resendBusinessId = status === 'invalid' && token ? await getAuthorizedResendBusinessId(token) : null;

  async function resend() {
    'use server';
    if (!resendBusinessId) redirect('/verify-business-email?status=invalid');
    await requestBusinessEmailVerification(resendBusinessId);
    redirect(`/dashboard/businesses/${resendBusinessId}/edit`);
  }

  return (
    <main className="min-h-screen bg-[#F2F5FA] px-4 py-12 flex items-center justify-center">
      <section className="w-full max-w-lg rounded-[10px] border border-[#DCE2E8] bg-white p-6 sm:p-8 shadow-sm">
        <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#004AAD] text-lg font-bold text-white">B</div>
        {status === 'success' ? (
          <>
            <h1 className="text-xl font-bold text-[#2A3547] text-center">Business email verified successfully.</h1>
            <p className="mt-3 text-sm text-[#5D6776] text-center">The verified status is now available on the business profile.</p>
            <Link href={returnPath} className="mt-6 block rounded-[8px] bg-[#004AAD] px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-[#003E91]">
              Return to Business Profile
            </Link>
          </>
        ) : token && action && status !== 'invalid' ? (
          <>
            <h1 className="text-xl font-bold text-[#2A3547] text-center">Verify business email</h1>
            <p className="mt-3 text-sm text-[#5D6776] text-center">Confirm this email address for your Buzl business profile.</p>
            <form action={action} className="mt-6">
              <button type="submit" className="w-full rounded-[8px] bg-[#004AAD] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#003E91]">
                Verify Business Email
              </button>
            </form>
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold text-[#2A3547] text-center">Verification unavailable</h1>
            <p className="mt-3 text-sm text-[#5D6776] text-center">This verification link is invalid or has expired.</p>
            {resendBusinessId && (
              <form action={resend} className="mt-6">
                <button type="submit" className="w-full rounded-[8px] bg-[#004AAD] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#003E91]">
                  Send New Verification Email
                </button>
              </form>
            )}
            <Link href="/dashboard/businesses" className="mt-6 block rounded-[8px] border border-[#004AAD] px-4 py-2.5 text-center text-sm font-semibold text-[#004AAD] hover:bg-[#ECF4FF]">
              Return to Business Profiles
            </Link>
          </>
        )}
      </section>
    </main>
  );
}
