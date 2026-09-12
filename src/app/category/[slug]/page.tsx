import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getBusinessesByCategory } from '@/lib/public-directory';
import PublicHeader from '@/components/public/PublicHeader';
import PublicFooter from '@/components/public/PublicFooter';
import PublicBusinessCard from '@/components/public/PublicBusinessCard';
import Breadcrumbs from '@/components/public/Breadcrumbs';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await getBusinessesByCategory(slug);

  if (!result) {
    return {
      title: 'Category Not Found',
      robots: { index: false, follow: false },
    };
  }

  const title = `${result.category.name} Businesses`;
  const canonicalUrl = `/category/${result.category.slug}`;

  return {
    title,
    description: `Verified directory listings for ${result.category.name} across India. Compare services, operating hours, and contact details.`,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description: `Verified directory listings for ${result.category.name}.`,
      url: canonicalUrl,
    },
  };
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { page = '1' } = await searchParams;

  const pageNumber = Math.max(1, parseInt(page, 10) || 1);
  const limit = 20;
  const offset = (pageNumber - 1) * limit;

  const result = await getBusinessesByCategory(slug, limit, offset);

  // If category does not exist or is inactive, return 404
  if (!result) {
    notFound();
  }

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Categories', href: '/#categories' },
    { label: result.category.name },
  ];

  const totalPages = Math.ceil(result.total_count / limit);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      <PublicHeader />

      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <Breadcrumbs items={breadcrumbs} />

        {/* Category Header (Constraint 1: No invented descriptions) */}
        <section className="bg-white rounded-2xl border border-[#E1E4EA] p-6 sm:p-8 shadow-xs mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#004AAD]">
                Category Directory
              </span>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-[#1F242E] tracking-tight mt-1">
                {result.category.name}
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-[#5D6776]">
                {result.total_count} {result.total_count === 1 ? 'verified business' : 'verified businesses'} listed
              </p>
            </div>

            <div>
              <Link
                href={`/search?category=${encodeURIComponent(result.category.slug)}`}
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

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-6">
                {pageNumber > 1 && (
                  <Link
                    href={`/category/${slug}?page=${pageNumber - 1}`}
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
                    href={`/category/${slug}?page=${pageNumber + 1}`}
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
              No published businesses in {result.category.name} yet
            </h2>
            <p className="text-xs text-[#5D6776] mb-6">
              Businesses in this category are currently in verification or onboarding.
            </p>
            <Link
              href="/#categories"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#004AAD] text-white hover:bg-[#003C8A] transition-colors"
            >
              Browse Other Categories
            </Link>
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
