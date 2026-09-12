import { Metadata } from 'next';
import Link from 'next/link';
import { searchBusinesses } from '@/lib/public-directory';
import PublicHeader from '@/components/public/PublicHeader';
import PublicFooter from '@/components/public/PublicFooter';
import PublicBusinessCard from '@/components/public/PublicBusinessCard';

export const metadata: Metadata = {
  title: 'Search Businesses & Services',
  description: 'Search verified local businesses, categories, and service areas across India.',
  robots: {
    index: false,
    follow: true,
  },
};

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    location?: string;
    page?: string;
  }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q = '', category = '', location = '', page = '1' } = await searchParams;

  const pageNumber = Math.max(1, parseInt(page, 10) || 1);
  const limit = 20;
  const offset = (pageNumber - 1) * limit;

  const results = await searchBusinesses({
    query: q,
    categorySlug: category,
    locationSlug: location,
    limit,
    offset,
  });

  const totalPages = Math.ceil(results.total_count / limit);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      <PublicHeader />

      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Search Bar Header */}
        <section className="bg-white rounded-2xl border border-[#E1E4EA] p-6 shadow-xs mb-8">
          <form
            action="/search"
            method="GET"
            className="flex flex-col md:flex-row items-stretch gap-3"
          >
            <div className="flex-1 flex items-center gap-2.5 px-3.5 py-2.5 bg-[#F8FAFC] rounded-xl border border-[#E1E4EA] focus-within:border-[#004AAD] focus-within:bg-white transition-all">
              <svg className="w-5 h-5 text-[#7D8795] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Search business, service, or keywords..."
                className="w-full bg-transparent text-sm text-[#1F242E] placeholder-[#7D8795] focus:outline-hidden"
              />
            </div>

            <div className="md:w-64 flex items-center gap-2.5 px-3.5 py-2.5 bg-[#F8FAFC] rounded-xl border border-[#E1E4EA] focus-within:border-[#004AAD] focus-within:bg-white transition-all">
              <svg className="w-5 h-5 text-[#7D8795] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <input
                type="text"
                name="location"
                defaultValue={location}
                placeholder="City (e.g. Chennai)"
                className="w-full bg-transparent text-sm text-[#1F242E] placeholder-[#7D8795] focus:outline-hidden"
              />
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 bg-[#004AAD] hover:bg-[#003C8A] text-white text-sm font-semibold rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Search</span>
            </button>
          </form>

          {/* Active Search Context */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-[#5D6776] pt-3 border-t border-[#F2F5FA]">
            <div>
              {q || location || category ? (
                <span>
                  Found <strong className="text-[#1F242E]">{results.total_count}</strong> {results.total_count === 1 ? 'business' : 'businesses'}
                  {q ? <> for &ldquo;<strong className="text-[#1F242E]">{q}</strong>&rdquo;</> : ''}
                  {location ? <> in &ldquo;<strong className="text-[#1F242E]">{location}</strong>&rdquo;</> : ''}
                </span>
              ) : (
                <span>Showing all <strong className="text-[#1F242E]">{results.total_count}</strong> published directory listings</span>
              )}
            </div>

            {(q || location || category) && (
              <Link
                href="/search"
                className="text-xs text-[#004AAD] hover:underline font-medium"
              >
                Clear all filters
              </Link>
            )}
          </div>
        </section>

        {/* Results Grid */}
        {results.items.length > 0 ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.items.map((business) => (
                <PublicBusinessCard key={business.slug} business={business} />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-6">
                {pageNumber > 1 && (
                  <Link
                    href={`/search?q=${encodeURIComponent(q)}&location=${encodeURIComponent(location)}&category=${encodeURIComponent(category)}&page=${pageNumber - 1}`}
                    className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-white border border-[#E1E4EA] text-[#1F242E] hover:bg-[#F8FAFC]"
                  >
                    ← Previous
                  </Link>
                )}
                <span className="text-xs text-[#7D8795] px-3">
                  Page {pageNumber} of {totalPages}
                </span>
                {pageNumber < totalPages && (
                  <Link
                    href={`/search?q=${encodeURIComponent(q)}&location=${encodeURIComponent(location)}&category=${encodeURIComponent(category)}&page=${pageNumber + 1}`}
                    className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-white border border-[#E1E4EA] text-[#1F242E] hover:bg-[#F8FAFC]"
                  >
                    Next →
                  </Link>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Clean Empty State */
          <div className="bg-white rounded-2xl border border-[#E1E4EA] p-12 text-center max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-full bg-[#F2F5FA] text-[#7D8795] flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-[#1F242E] mb-2">No matching businesses found</h2>
            <p className="text-xs text-[#5D6776] leading-relaxed mb-6">
              We couldn&apos;t find any published businesses matching your query. Try checking for typos or searching by general service categories.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Link
                href="/#categories"
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#004AAD] text-white hover:bg-[#003C8A] transition-colors"
              >
                Browse Categories
              </Link>
              <Link
                href="/search"
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#F2F5FA] text-[#1F242E] hover:bg-[#EAEFF7] transition-colors"
              >
                View All Listings
              </Link>
            </div>
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
