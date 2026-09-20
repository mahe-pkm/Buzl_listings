import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient, getSessionUser } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function GetStartedPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect('/login');
  }

  if (user.accountStatus !== 'active') {
    redirect('/login?error=account_inactive');
  }

  // Privileged internal roles should not be forced through business owner onboarding
  if (user.role === 'admin') {
    redirect('/admin/businesses');
  }
  if (user.role === 'buzl_member') {
    redirect('/admin/businesses/import');
  }
  if (user.role !== 'business_owner') {
    redirect('/dashboard');
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completed_at')
    .eq('id', user.id)
    .single();

  // Completed owners go straight to their dashboard
  if (profile?.onboarding_completed_at) {
    redirect('/dashboard');
  }

  // Check if user has an existing draft in progress
  const { count } = await supabase
    .from('business_managers')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  const hasExistingDraft = (count ?? 0) > 0;

  return (
    <div className="min-h-screen bg-[#F2F5FA] flex flex-col">
      {/* Top Header */}
      <header className="border-b border-[#DCE2E8] bg-white px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-decoration-none">
            <span className="text-xl font-black tracking-tight text-[#004AAD]">Buzl</span>
            <span className="rounded-[4px] bg-[#ECF4FF] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#004AAD]">
              Listing
            </span>
          </Link>
          <a
            href="/auth/logout"
            className="text-xs font-semibold text-[#5D6776] hover:text-[#2A3547] transition-colors"
          >
            Sign Out
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Welcome Card */}
          <div className="rounded-[12px] border border-[#DCE2E8] bg-white p-6 sm:p-8 shadow-xs">
            <div className="inline-flex items-center gap-1.5 rounded-[4px] bg-[#ECF4FF] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#004AAD]">
              BUSINESS OWNER
            </div>
            <h1 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-[#2A3547]">
              Register your business with Buzl
            </h1>
            <p className="mt-2 text-sm sm:text-base leading-relaxed text-[#5D6776]">
              Create your business profile, add your services and contact information, verify your
              business email, and submit your listing for review.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-3">
              <Link
                href="/onboarding"
                className="inline-flex items-center justify-center rounded-[8px] bg-[#004AAD] px-6 py-3 text-sm font-semibold text-white shadow-xs hover:bg-[#003E91] transition-colors"
              >
                {hasExistingDraft ? 'Continue Registration →' : 'Register My Business →'}
              </Link>
              <span className="text-xs text-[#7D8795]">
                {hasExistingDraft
                  ? 'Your draft is saved. Pick up right where you left off.'
                  : 'Usually takes only a few minutes if your business information is ready.'}
              </span>
            </div>
          </div>

          {/* Value / Benefits Row */}
          <section aria-labelledby="benefits-heading" className="space-y-3">
            <h2 id="benefits-heading" className="text-xs font-bold uppercase tracking-[0.12em] text-[#7D8795]">
              Why register on Buzl Listing
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-[10px] border border-[#DCE2E8] bg-white p-4 shadow-xs">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-[#ECF4FF] text-[#004AAD] font-bold text-xs">
                    📍
                  </span>
                  <h3 className="text-sm font-bold text-[#2A3547]">Local Discovery</h3>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-[#5D6776]">
                  Help customers find your business across your city and surrounding service areas.
                </p>
              </div>

              <div className="rounded-[10px] border border-[#DCE2E8] bg-white p-4 shadow-xs">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-[#ECF4FF] text-[#004AAD] font-bold text-xs">
                    ✓
                  </span>
                  <h3 className="text-sm font-bold text-[#2A3547]">Verified Information</h3>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-[#5D6776]">
                  Build trust with verified contact details, operational hours, and confirmed location.
                </p>
              </div>

              <div className="rounded-[10px] border border-[#DCE2E8] bg-white p-4 shadow-xs">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-[#ECF4FF] text-[#004AAD] font-bold text-xs">
                    ★
                  </span>
                  <h3 className="text-sm font-bold text-[#2A3547]">Better Visibility</h3>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-[#5D6776]">
                  Show your services, products, photos, and key business highlights in a structured profile.
                </p>
              </div>
            </div>
          </section>

          {/* Registration Process (5 Steps) */}
          <section aria-labelledby="process-heading" className="rounded-[12px] border border-[#DCE2E8] bg-white p-6 shadow-xs space-y-4">
            <div>
              <h2 id="process-heading" className="text-sm font-bold text-[#2A3547]">
                Registration Process
              </h2>
              <p className="text-xs text-[#5D6776] mt-0.5">
                A simple 5-step journey to get your business listed
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
              {[
                { num: '01', title: 'Create profile', desc: 'Set your business identity & brand' },
                { num: '02', title: 'Add details', desc: 'Category, location, hours & services' },
                { num: '03', title: 'Verify email', desc: 'Confirm business contact email' },
                { num: '04', title: 'Submit for review', desc: 'Submit completed listing' },
                { num: '05', title: 'Get published', desc: 'Listing goes live after approval' },
              ].map((step) => (
                <div
                  key={step.num}
                  className="rounded-[8px] border border-[#EAEFF4] bg-[#F7F9FC] p-3 flex flex-col justify-between"
                >
                  <span className="text-[11px] font-black text-[#004AAD] tracking-wider">
                    {step.num}
                  </span>
                  <div className="mt-2">
                    <p className="text-xs font-bold text-[#2A3547] leading-tight">{step.title}</p>
                    <p className="text-[11px] text-[#7D8795] mt-1 leading-snug">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-[8px] bg-[#F0FDF4] border border-[#BBF7D0] p-3 text-xs text-[#15803D]">
              <strong>Moderation Note:</strong> After you submit your business, our team reviews the listing before it is published.
            </div>
          </section>

          {/* What You'll Need */}
          <section aria-labelledby="checklist-heading" className="rounded-[12px] border border-[#DCE2E8] bg-white p-6 shadow-xs space-y-4">
            <div>
              <h2 id="checklist-heading" className="text-sm font-bold text-[#2A3547]">
                What You&apos;ll Need
              </h2>
              <p className="text-xs text-[#5D6776] mt-0.5">
                You can complete your registration step by step. Have these details handy:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#2A3547]">
              {[
                'Business name & primary category',
                'Storefront address or named service areas',
                'Primary phone & optional WhatsApp number',
                'Services offered & optional product catalog',
                'Operational hours for each day of the week',
                'Business logo, cover photo, and gallery',
                'Social profiles (Facebook, Instagram, LinkedIn, YouTube)',
                'Business contact email (required before review submission)',
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-2 py-1">
                  <span className="text-[#087C3C] font-bold mt-0.5">✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="rounded-[8px] bg-[#FFF8E6] border border-[#FEE5A5] p-3 text-xs text-[#7A5200]">
              <strong>Email Verification Rule:</strong> Business email verification is required before submitting your listing for review. You can save your draft and complete registration steps before verifying.
            </div>
          </section>

          {/* Bottom Action Card */}
          <div className="rounded-[12px] border border-[#DCE2E8] bg-white p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-[#2A3547]">Ready to begin?</p>
              <p className="text-xs text-[#5D6776]">
                Step into the registration wizard to create your listing.
              </p>
            </div>
            <Link
              href="/onboarding"
              className="w-full sm:w-auto text-center inline-flex items-center justify-center rounded-[8px] bg-[#004AAD] px-6 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[#003E91] transition-colors"
            >
              {hasExistingDraft ? 'Continue Registration →' : 'Register My Business →'}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
