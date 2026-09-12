import Link from 'next/link';
import PublicHeader from '@/components/public/PublicHeader';
import PublicFooter from '@/components/public/PublicFooter';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      <PublicHeader />

      <main className="flex-1 flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center bg-white rounded-2xl border border-[#E1E4EA] p-8 sm:p-10 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-[#ECF4FF] text-[#004AAD] font-bold text-xl flex items-center justify-center mx-auto mb-4 border border-[#BEDBFE]">
            404
          </div>

          <h1 className="text-2xl font-extrabold text-[#1F242E] tracking-tight mb-2">
            Page Not Found
          </h1>

          <p className="text-xs sm:text-sm text-[#5D6776] leading-relaxed mb-6">
            The listing, category, or page you are looking for does not exist, has moved, or is not currently active in our directory.
          </p>

          <form action="/search" method="GET" className="mb-6">
            <div className="flex items-center gap-2 p-1.5 bg-[#F8FAFC] rounded-xl border border-[#E1E4EA] focus-within:border-[#004AAD] focus-within:bg-white transition-all">
              <input
                type="text"
                name="q"
                placeholder="Search businesses..."
                className="w-full px-3 py-1.5 bg-transparent text-xs text-[#1F242E] placeholder-[#7D8795] focus:outline-hidden"
              />
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-[#004AAD] hover:bg-[#003C8A] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Search
              </button>
            </div>
          </form>

          <div className="flex flex-wrap items-center justify-center gap-3 text-xs">
            <Link
              href="/"
              className="px-4 py-2 font-semibold text-white bg-[#004AAD] hover:bg-[#003C8A] rounded-xl transition-colors"
            >
              Directory Home
            </Link>
            <Link
              href="/#categories"
              className="px-4 py-2 font-semibold text-[#1F242E] bg-[#F2F5FA] hover:bg-[#EAEFF7] rounded-xl transition-colors"
            >
              Browse Categories
            </Link>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
