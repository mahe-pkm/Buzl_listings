import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getBusinessesByLocationAndCategory } from '@/lib/public-directory';
import { isStagingEnvironment } from '@/lib/staging';
import PublicHeader from '@/components/public/PublicHeader';
import PublicFooter from '@/components/public/PublicFooter';
import PublicBusinessCard from '@/components/public/PublicBusinessCard';
import Breadcrumbs from '@/components/public/Breadcrumbs';

interface PageProps {
  params: Promise<{ slug: string; categorySlug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, categorySlug } = await params;
  const result = await getBusinessesByLocationAndCategory(slug, categorySlug);

  if (!result) {
    return {
      title: 'Not Found',
      robots: { index: false, follow: false },
    };
  }

  const title = `${result.category.name} in ${result.location.name}`;
  const canonicalUrl = `/location/${result.location.slug}/${result.category.slug}`;
  const isStaging = isStagingEnvironment();

  return {
    title,
    description: `Find verified ${result.category.name} in ${result.location.name}. Contact details, services, and operating hours.`,
    alternates: {
      canonical: canonicalUrl,
    },
    // Constraint 2: Only approved combinations receive index=true; unapproved receive noindex.
    // Staging Safety: Staging environment strictly forces index: false.
    robots: {
      index: isStaging ? false : result.is_indexable,
      follow: isStaging ? false : true,
    },
    openGraph: {
      title,
      description: `Directory listings for ${result.category.name} in ${result.location.name}.`,
      url: canonicalUrl,
    },
  };
}

export default async function LocationCategoryPage({ params, searchParams }: PageProps) {
  const { slug, categorySlug } = await params;
  const { page = '1' } = await searchParams;

  const pageNumber = Math.max(1, parseInt(page, 10) || 1);
  const limit = 20;
  const offset = (pageNumber - 1) * limit;

  const result = await getBusinessesByLocationAndCategory(slug, categorySlug, limit, offset);

  if (!result) {
    notFound();
  }

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: result.location.name, href: `/location/${result.location.slug}` },
    { label: result.category.name },
  ];

  const totalPages = Math.ceil(result.total_count / limit);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      <PublicHeader />

      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <Breadcrumbs items={breadcrumbs} />

        {/* Header Section (Constraint 1: No invented descriptions) */}
        <section className="bg-white rounded-2xl border border-[#E1E4EA] p-6 sm:p-8 shadow-xs mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[#004AAD]">
                  Curated Discovery
                </span>
                {!result.is_indexable && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                    Directory Query
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-[#1F242E] tracking-tight">
                {result.category.name} in {result.location.name}
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-[#5D6776]">
                {result.total_count} {result.total_count === 1 ? 'verified listing' : 'verified listings'} found
              </p>
            </div>

            <div>
              <Link
                href={`/search?category=${encodeURIComponent(result.category.slug)}&location=${encodeURIComponent(result.location.name)}`}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#004AAD] bg-[#F2F5FA] hover:bg-[#EAEFF7] rounded-xl border border-[#E1E4EA] transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>Filter in Search</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Listings Grid */}
        {result.items.length > 0 ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {result.items.map((business) => (
                <PublicBusinessCard key={business.slug} business={business} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-6">
                {pageNumber > 1 && (
                  <Link
                    href={`/location/${slug}/${categorySlug}?page=${pageNumber - 1}`}
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
                    href={`/location/${slug}/${categorySlug}?page=${pageNumber + 1}`}
                    className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-white border border-[#E1E4EA] text-[#1F242E] hover:bg-[#F8FAFC]"
                  >
                    Next →
                  </Link>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#E1E4EA] p-12 text-center max-w-lg mx-auto">
            <h2 className="text-base font-bold text-[#1F242E] mb-2">
              No matching listings in {result.location.name}
            </h2>
            <p className="text-xs text-[#5D6776] mb-6">
              We don&apos;t have any published {result.category.name} in {result.location.name} at this time.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Link
                href={`/category/${result.category.slug}`}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#004AAD] text-white hover:bg-[#003C8A] transition-colors"
              >
                All {result.category.name} Listings
              </Link>
              <Link
                href={`/location/${result.location.slug}`}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#F2F5FA] text-[#1F242E] hover:bg-[#EAEFF7] transition-colors"
              >
                All Businesses in {result.location.name}
              </Link>
            </div>
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
