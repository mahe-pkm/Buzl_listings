import Link from 'next/link';
import { getSessionUser } from '@/lib/supabase/server';

export default async function HomePage() {
  const user = await getSessionUser();

  return (
    <div className="min-h-screen bg-[#F2F5FA] flex flex-col font-sans">
      {/* Navigation Header */}
      <header className="h-16 bg-white border-b border-[#DCE2E8] px-6 md:px-12 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#004AAD] flex items-center justify-center text-white font-bold text-lg tracking-wider">
            B
          </div>
          <span className="font-bold text-xl tracking-tight text-[#2A3547]">
            Buzl <span className="text-[#004AAD] font-semibold text-sm tracking-normal">Listing</span>
          </span>
        </div>

        <div>
          {user ? (
            <Link
              href={user.isAdmin ? '/admin/businesses' : '/dashboard'}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-[8px] bg-[#004AAD] text-white text-xs font-semibold hover:bg-[#003E91] transition-colors shadow-xs"
            >
              Open Dashboard →
            </Link>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-[8px] bg-[#004AAD] text-white text-xs font-semibold hover:bg-[#003E91] transition-colors shadow-xs"
            >
              Sign In to Dashboard →
            </Link>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ECF4FF] text-[#004AAD] border border-[#BEDBFE] text-xs font-semibold mb-6">
          <span className="w-2 h-2 rounded-full bg-[#004AAD] animate-pulse" />
          Day 1 Core Workflow Active
        </div>

        <h1 className="text-3xl md:text-4xl font-extrabold text-[#2A3547] tracking-tight leading-tight">
          Citation-First Business Listing & Management
        </h1>

        <p className="mt-4 text-sm md:text-base text-[#5D6776] leading-relaxed max-w-xl">
          Complete end-to-end directory foundation supporting Storefront, Service-Area, and Hybrid models with independent publication and verification lifecycles.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {user ? (
            <Link
              href="/dashboard"
              className="px-6 py-2.5 rounded-[8px] bg-[#004AAD] text-white text-sm font-semibold hover:bg-[#003E91] transition-colors shadow-xs"
            >
              Go to Dashboard
            </Link>
          ) : (
            <Link
              href="/login"
              className="px-6 py-2.5 rounded-[8px] bg-[#004AAD] text-white text-sm font-semibold hover:bg-[#003E91] transition-colors shadow-xs"
            >
              Sign In with Prototype Account
            </Link>
          )}

          <Link
            href="/dashboard/businesses/new"
            className="px-6 py-2.5 rounded-[8px] bg-white border border-[#DCE2E8] text-[#2A3547] text-sm font-semibold hover:bg-[#F2F5FA] transition-colors"
          >
            Create New Listing
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-4 text-left w-full">
          <div className="bg-white p-5 rounded-[8px] border border-[#DCE2E8] shadow-xs">
            <div className="w-8 h-8 rounded bg-[#ECF4FF] text-[#004AAD] flex items-center justify-center font-bold text-xs mb-3">
              1
            </div>
            <h2 className="text-xs font-bold text-[#2A3547] uppercase tracking-wider">Multi-Mode Locations</h2>
            <p className="text-xs text-[#5D6776] mt-1">
              Storefront with coordinates, Pure Service-Area with named regions, or Hybrid presence.
            </p>
          </div>

          <div className="bg-white p-5 rounded-[8px] border border-[#DCE2E8] shadow-xs">
            <div className="w-8 h-8 rounded bg-[#E3F2EA] text-[#087C3C] flex items-center justify-center font-bold text-xs mb-3">
              2
            </div>
            <h2 className="text-xs font-bold text-[#2A3547] uppercase tracking-wider">Public-Safe Preview</h2>
            <p className="text-xs text-[#5D6776] mt-1">
              Guaranteed isolation of private coordinates, auth credentials, and internal states.
            </p>
          </div>

          <div className="bg-white p-5 rounded-[8px] border border-[#DCE2E8] shadow-xs">
            <div className="w-8 h-8 rounded bg-[#FFF6DF] text-[#D99B18] flex items-center justify-center font-bold text-xs mb-3">
              3
            </div>
            <h2 className="text-xs font-bold text-[#2A3547] uppercase tracking-wider">Publication Lifecycle</h2>
            <p className="text-xs text-[#5D6776] mt-1">
              Owner submission (`draft` → `pending`) and Admin publication and moderation controls.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
