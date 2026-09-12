import { Metadata } from 'next';
import Link from 'next/link';
import { getDirectoryHomeData } from '@/lib/public-directory';
import PublicHeader from '@/components/public/PublicHeader';
import PublicFooter from '@/components/public/PublicFooter';
import PublicBusinessCard from '@/components/public/PublicBusinessCard';

export const metadata: Metadata = {
  alternates: {
    canonical: '/',
  },
};

export const revalidate = 60; // ISR cache revalidation every 60s

export default async function HomePage() {
  const homeData = await getDirectoryHomeData();

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      <PublicHeader />

      <main className="flex-1">
        {/* Hero Section with Search */}
        <section className="bg-gradient-to-b from-[#ECF4FF]/60 via-[#F8FAFC] to-[#FAFAFA] border-b border-[#E1E4EA] py-16 md:py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#CBD5E1] text-xs font-semibold text-[#004AAD] shadow-xs mb-6">
              <span className="w-2 h-2 rounded-full bg-[#10B981]" />
              <span>Verified Directory • {homeData.stats.total_businesses} Published Listings</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold text-[#1F242E] tracking-tight leading-tight">
              Find Trusted Local Businesses <br className="hidden sm:inline" />
              <span className="text-[#004AAD]">& Specialized Services</span>
            </h1>

            <p className="mt-4 text-base sm:text-lg text-[#5D6776] max-w-2xl mx-auto leading-relaxed">
              Explore verified local service providers, store hours, and doorstep coverage across India. Accurate, privacy-protected directory listings.
            </p>

            {/* Main Search Form */}
            <form
              action="/search"
              method="GET"
              className="mt-8 max-w-3xl mx-auto bg-white p-2.5 sm:p-3 rounded-2xl shadow-lg border border-[#E1E4EA] flex flex-col sm:flex-row items-stretch gap-2.5"
            >
              <div className="flex-1 flex items-center gap-2.5 px-3 py-2 bg-[#F8FAFC] rounded-xl border border-transparent focus-within:border-[#004AAD] focus-within:bg-white transition-all">
                <svg className="w-5 h-5 text-[#7D8795] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  name="q"
                  placeholder="Search by business name, service, or category..."
                  className="w-full bg-transparent text-sm text-[#1F242E] placeholder-[#7D8795] focus:outline-hidden"
                  autoComplete="off"
                />
              </div>

              <div className="sm:w-56 flex items-center gap-2.5 px-3 py-2 bg-[#F8FAFC] rounded-xl border border-transparent focus-within:border-[#004AAD] focus-within:bg-white transition-all">
                <svg className="w-5 h-5 text-[#7D8795] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <input
                  type="text"
                  name="location"
                  placeholder="City or area (e.g. Chennai)"
                  className="w-full bg-transparent text-sm text-[#1F242E] placeholder-[#7D8795] focus:outline-hidden"
                />
              </div>

              <button
                type="submit"
                className="px-6 py-3 bg-[#004AAD] hover:bg-[#003C8A] text-white text-sm font-semibold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Search</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </form>

            {/* Quick Category Chips */}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs text-[#5D6776]">
              <span className="text-[#7D8795] font-medium">Popular:</span>
              {homeData.categories.slice(0, 5).map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/category/${cat.slug}`}
                  className="px-2.5 py-1 rounded-full bg-white border border-[#E1E4EA] hover:border-[#004AAD] hover:text-[#004AAD] transition-colors shadow-2xs"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section id="categories" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#004AAD]">
                Explore By Industry
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#1F242E] tracking-tight mt-1">
                Browse Categories
              </h2>
            </div>
            <span className="text-xs text-[#7D8795]">
              {homeData.categories.length} Active Categories
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {homeData.categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/category/${cat.slug}`}
                className="group p-4 bg-white rounded-xl border border-[#E1E4EA] hover:border-[#004AAD] hover:shadow-md transition-all duration-200 flex flex-col justify-between min-h-[110px]"
              >
                <div>
                  <h3 className="text-sm font-semibold text-[#1F242E] group-hover:text-[#004AAD] transition-colors line-clamp-2">
                    {cat.name}
                  </h3>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-[#7D8795]">
                  <span>{cat.count} {cat.count === 1 ? 'listing' : 'listings'}</span>
                  <span className="text-[#004AAD] opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Locations Section */}
        {homeData.locations.length > 0 && (
          <section id="locations" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#E1E4EA]">
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-6 gap-2">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#004AAD]">
                  Regional Coverage
                </span>
                <h2 className="text-2xl font-bold text-[#1F242E] tracking-tight mt-1">
                  Popular Cities & Regions
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {homeData.locations.map((loc) => (
                <Link
                  key={loc.slug}
                  href={`/location/${loc.slug}`}
                  className="group px-4 py-3 bg-white rounded-xl border border-[#E1E4EA] hover:border-[#004AAD] hover:shadow-xs transition-all flex items-center justify-between"
                >
                  <span className="text-sm font-semibold text-[#1F242E] group-hover:text-[#004AAD] transition-colors truncate">
                    {loc.name}
                  </span>
                  <span className="text-xs text-[#7D8795] font-medium shrink-0 ml-2">
                    {loc.count}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Recently Published Businesses Section (Constraint 5) */}
        {homeData.recent_businesses.length > 0 && (
          <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#E1E4EA]">
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#004AAD]">
                  Latest Additions
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-[#1F242E] tracking-tight mt-1">
                  Recently Published Businesses
                </h2>
              </div>
              <Link
                href="/search"
                className="text-xs font-semibold text-[#004AAD] hover:underline flex items-center gap-1"
              >
                <span>View all listings</span>
                <span>→</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {homeData.recent_businesses.map((business) => (
                <PublicBusinessCard key={business.slug} business={business} />
              ))}
            </div>
          </section>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
