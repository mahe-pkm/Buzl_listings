import { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import Link from 'next/link';
import { getPublishedBusiness, resolveSlugRedirect } from '@/lib/public-directory';
import { getAppBaseUrl } from '@/lib/staging';
import PublicHeader from '@/components/public/PublicHeader';
import PublicFooter from '@/components/public/PublicFooter';
import Breadcrumbs from '@/components/public/Breadcrumbs';
import BusinessHoursDisplay from '@/components/public/BusinessHoursDisplay';
import LocalBusinessJsonLd from '@/components/public/LocalBusinessJsonLd';
import ShareButton from '@/components/public/ShareButton';
import { getMediaPublicUrl } from '@/lib/media-actions';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const business = await getPublishedBusiness(slug);

  if (!business) {
    return {
      title: 'Business Not Found',
      robots: { index: false, follow: false },
    };
  }

  const title = `${business.canonical_name} — ${business.category_name} in ${business.city}`;
  const description =
    business.description?.slice(0, 160) ||
    `Verified ${business.category_name} in ${business.city}, ${business.state}. Contact details, services, and operating hours.`;

  const canonicalUrl = `/business/${business.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: 'website',
      siteName: 'Buzl Directory',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  };
}

export default async function BusinessDetailPage({ params }: PageProps) {
  const { slug } = await params;

  // 1. Check for old/renamed slug redirect (HTTP 301)
  const canonicalRedirect = await resolveSlugRedirect(slug);
  if (canonicalRedirect && canonicalRedirect !== slug) {
    permanentRedirect(`/business/${canonicalRedirect}`);
  }

  // 2. Fetch published business details
  const business = await getPublishedBusiness(slug);

  // 3. Draft, pending, suspended, rejected, archived, or non-existent listings return 404
  if (!business) {
    notFound();
  }

  const baseUrl = getAppBaseUrl();
  const canonicalUrl = `${baseUrl}/business/${business.slug}`;

  const cleanPhone = business.primary_phone.replace(/[^0-9+]/g, '');
  const cleanWhatsapp = business.whatsapp_phone ? business.whatsapp_phone.replace(/[^0-9]/g, '') : null;

  const logoMedia = business.media?.find((m) => m.kind === 'logo');
  const coverMedia = business.media?.find((m) => m.kind === 'cover');
  const galleryMedia = business.media?.filter((m) => m.kind === 'gallery') || [];
  const logoUrl = getMediaPublicUrl(logoMedia?.storage_path);
  const coverUrl = getMediaPublicUrl(coverMedia?.storage_path);

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: business.category_name, href: `/category/${business.category_slug}` },
    { label: business.canonical_name },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      <PublicHeader />

      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <Breadcrumbs items={breadcrumbs} />

        {/* Cover Photo Banner (if available) */}
        {coverUrl && (
          <div className="w-full h-48 sm:h-72 rounded-2xl overflow-hidden mb-6 border border-[#E1E4EA] bg-[#E2E8F0] shadow-xs">
            <img src={coverUrl} alt={`${business.canonical_name} cover`} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Hero Business Header Card */}
        <section className="bg-white rounded-2xl border border-[#E1E4EA] p-6 sm:p-8 shadow-xs mb-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex items-start gap-4 sm:gap-5 flex-1">
              {/* Business Logo Avatar (if available) */}
              {logoUrl && (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-[#E1E4EA] bg-white shadow-2xs shrink-0 flex items-center justify-center">
                  <img src={logoUrl} alt={`${business.canonical_name} logo`} className="w-full h-full object-contain p-1" />
                </div>
              )}

              <div className="flex-1">
                {/* Category Pill & Verification Status */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <Link
                    href={`/category/${business.category_slug}`}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#F2F5FA] text-[#004AAD] hover:bg-[#EAEFF7] transition-colors"
                  >
                    {business.category_name}
                  </Link>

                  {business.verification_status === 'verified' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#ECF4FF] text-[#004AAD] border border-[#BEDBFE]">
                      <svg className="w-3.5 h-3.5 text-[#004AAD]" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Verified Business
                    </span>
                  )}

                  <span className="text-xs px-2.5 py-1 rounded-full bg-[#F8FAFC] text-[#5D6776] border border-[#E2E8F0] uppercase font-medium tracking-wide">
                    {business.location_mode === 'service_area'
                      ? 'Doorstep / Service Area'
                      : business.location_mode === 'storefront'
                      ? 'Storefront Location'
                      : 'Hybrid (Storefront & Area)'}
                  </span>
                </div>

                {/* Business Canonical Title */}
                <h1 className="text-2xl sm:text-4xl font-extrabold text-[#1F242E] tracking-tight mb-3">
                  {business.canonical_name}
                </h1>

                {/* Geographic Overview */}
                <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-sm text-[#5D6776]">
                  <div className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-[#7D8795] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>
                      {business.city}, {business.state}, {business.country}
                    </span>
                  </div>

                  {business.location_mode !== 'service_area' && business.show_street_address && business.locality && (
                    <>
                      <span>•</span>
                      <span>Locality: {business.locality}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <a
                href={`tel:${cleanPhone}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#004AAD] hover:bg-[#003C8A] transition-colors shadow-xs"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                <span>Call Business</span>
              </a>

              {cleanWhatsapp && (
                <a
                  href={`https://wa.me/${cleanWhatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#087C3C] hover:bg-[#066531] transition-colors shadow-xs"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                  </svg>
                  <span>WhatsApp</span>
                </a>
              )}

              {/* Google Business Profile URL (View on Google) */}
              {business.google_business_profile_url && (
                <a
                  href={business.google_business_profile_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-[#1F242E] bg-white border border-[#E1E4EA] hover:bg-[#F8FAFC] transition-colors shadow-2xs"
                >
                  <svg className="w-4 h-4 text-[#EA4335]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                  <span>View on Google</span>
                </a>
              )}

              {business.website_url && (
                <a
                  href={business.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-[#1F242E] bg-white border border-[#E1E4EA] hover:bg-[#F8FAFC] transition-colors shadow-2xs"
                >
                  <svg className="w-4 h-4 text-[#7D8795]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  <span>Visit Website</span>
                </a>
              )}

              {/* Email Button ONLY if show_email is true */}
              {business.show_email && business.business_contact_email && (
                <a
                  href={`mailto:${business.business_contact_email}`}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-[#1F242E] bg-white border border-[#E1E4EA] hover:bg-[#F8FAFC] transition-colors shadow-2xs"
                >
                  <svg className="w-4 h-4 text-[#7D8795]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>Email</span>
                </a>
              )}

              <ShareButton title={business.canonical_name} url={canonicalUrl} />
            </div>
          </div>
        </section>

        {/* Content Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Left Column (2 Cols) */}
          <div className="lg:col-span-2 space-y-8">
            {/* About / Description */}
            {business.description && (
              <section className="bg-white rounded-2xl border border-[#E1E4EA] p-6 sm:p-7 shadow-xs">
                <h2 className="text-lg font-bold text-[#1F242E] mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#004AAD]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  About {business.canonical_name}
                </h2>
                <div className="text-sm text-[#475569] leading-relaxed whitespace-pre-line">
                  {business.description}
                </div>
              </section>
            )}

            {/* Services Section */}
            {business.services && business.services.length > 0 && (
              <section className="bg-white rounded-2xl border border-[#E1E4EA] p-6 sm:p-7 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-[#1F242E] flex items-center gap-2">
                    <svg className="w-5 h-5 text-[#004AAD]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    Offered Services & Specialties
                  </h2>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#F2F5FA] text-[#004AAD]">
                    {business.services.length} Services
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {business.services.map((svc, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[#1E293B] flex flex-col gap-1"
                    >
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-[#087C3C] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm font-semibold">{svc.service_name}</span>
                      </div>
                      {svc.service_description && (
                        <p className="text-xs text-[#5D6776] pl-6 leading-relaxed">
                          {svc.service_description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Products Section */}
            {business.products && business.products.length > 0 && (
              <section className="bg-white rounded-2xl border border-[#E1E4EA] p-6 sm:p-7 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-[#1F242E] flex items-center gap-2">
                    <svg className="w-5 h-5 text-[#004AAD]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    Products & Offerings
                  </h2>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#F2F5FA] text-[#004AAD]">
                    {business.products.length} Products
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {business.products.map((prod) => {
                    const prodImgUrl = getMediaPublicUrl(prod.image_path);
                    return (
                      <div
                        key={prod.id || prod.name}
                        className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col justify-between"
                      >
                        {prodImgUrl && (
                          <div className="w-full h-40 rounded-lg overflow-hidden bg-[#E2E8F0] mb-3 border border-[#E1E4EA]">
                            <img src={prodImgUrl} alt={prod.name} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div>
                          <h3 className="font-semibold text-sm text-[#1E293B]">{prod.name}</h3>
                          {prod.description && (
                            <p className="text-xs text-[#5D6776] mt-1.5 line-clamp-3 leading-relaxed">
                              {prod.description}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Photo Gallery Section */}
            {galleryMedia.length > 0 && (
              <section className="bg-white rounded-2xl border border-[#E1E4EA] p-6 sm:p-7 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-[#1F242E] flex items-center gap-2">
                    <svg className="w-5 h-5 text-[#004AAD]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Photo Gallery
                  </h2>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#F2F5FA] text-[#004AAD]">
                    {galleryMedia.length} Photos
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {galleryMedia.map((m, idx) => {
                    const imgUrl = getMediaPublicUrl(m.storage_path);
                    return (
                      <div
                        key={m.id || idx}
                        className="group relative rounded-xl overflow-hidden bg-[#E2E8F0] aspect-4/3 border border-[#E2E8F0]"
                      >
                        {imgUrl && (
                          <img
                            src={imgUrl}
                            alt={m.caption || `${business.canonical_name} photo ${idx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                        )}
                        {m.caption && (
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 text-[11px] text-white font-medium truncate">
                            {m.caption}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Service Area / Location Coverage Details */}
            <section className="bg-white rounded-2xl border border-[#E1E4EA] p-6 sm:p-7 shadow-xs">
              <h2 className="text-lg font-bold text-[#1F242E] mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-[#004AAD]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {business.location_mode === 'service_area'
                  ? 'Doorstep & Mobile Service Coverage'
                  : 'Location & Address'}
              </h2>

              {business.location_mode === 'service_area' ? (
                <div>
                  <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-100 text-xs text-blue-800 mb-4 leading-relaxed">
                    <span className="font-semibold">Privacy-Protected Service Area:</span> This business provides on-site, doorstep, or remote mobile services. Residential street addresses and exact coordinates are kept confidential.
                  </div>

                  {business.service_areas && business.service_areas.length > 0 ? (
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#5D6776] mb-3">
                        Designated Coverage Areas
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {business.service_areas.map((sa, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-semibold text-[#1F242E]"
                          >
                            <svg className="w-3.5 h-3.5 text-[#004AAD]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                            {sa.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-[#5D6776]">
                      Services available across {business.city}, {business.state}.
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3 text-sm text-[#475569]">
                  {business.show_street_address ? (
                    <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                      <p className="font-semibold text-[#1F242E]">{business.canonical_name}</p>
                      {business.address_line_1 && <p>{business.address_line_1}</p>}
                      {business.address_line_2 && <p>{business.address_line_2}</p>}
                      <p>
                        {[business.locality, business.city, business.state].filter(Boolean).join(', ')}
                        {business.postal_code ? ` — ${business.postal_code}` : ''}
                      </p>
                      <p className="text-xs text-[#7D8795] pt-1">{business.country}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-[#5D6776]">
                      Located in {business.city}, {business.state}. Contact business directly for street address.
                    </p>
                  )}

                  {/* If Hybrid, also show service areas */}
                  {business.location_mode === 'hybrid' && business.service_areas && business.service_areas.length > 0 && (
                    <div className="pt-4 border-t border-[#F2F5FA]">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#5D6776] mb-2">
                        Doorstep Delivery / Mobile Service Areas
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {business.service_areas.map((sa, idx) => (
                          <span
                            key={idx}
                            className="inline-block px-2.5 py-1 rounded-md bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-medium text-[#334155]"
                          >
                            {sa.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* Social Links */}
            {(business.facebook_url || business.instagram_url || business.linkedin_url || business.youtube_url) && (
              <section className="bg-white rounded-2xl border border-[#E1E4EA] p-6 shadow-xs">
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#5D6776] mb-3">
                  Online Profiles & Socials
                </h2>
                <div className="flex flex-wrap gap-3">
                  {business.facebook_url && (
                    <a
                      href={business.facebook_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#F2F5FA] hover:bg-[#EAEFF7] text-[#1F242E] transition-colors"
                    >
                      Facebook
                    </a>
                  )}
                  {business.instagram_url && (
                    <a
                      href={business.instagram_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#F2F5FA] hover:bg-[#EAEFF7] text-[#1F242E] transition-colors"
                    >
                      Instagram
                    </a>
                  )}
                  {business.linkedin_url && (
                    <a
                      href={business.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#F2F5FA] hover:bg-[#EAEFF7] text-[#1F242E] transition-colors"
                    >
                      LinkedIn
                    </a>
                  )}
                  {business.youtube_url && (
                    <a
                      href={business.youtube_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#F2F5FA] hover:bg-[#EAEFF7] text-[#1F242E] transition-colors"
                    >
                      YouTube
                    </a>
                  )}
                </div>
              </section>
            )}
          </div>

          {/* Right Sidebar (1 Col) */}
          <div className="space-y-6">
            {/* Operating Hours (Constraint 3) */}
            <BusinessHoursDisplay
              hours={business.hours}
              countryCode={business.country_code}
            />

            {/* Fast NAP Info Card */}
            <div className="bg-white rounded-2xl border border-[#E1E4EA] p-6 shadow-xs space-y-4 text-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#5D6776]">
                Directory Verification Snapshot
              </h3>

              <div className="space-y-3 divide-y divide-[#F2F5FA]">
                <div className="pt-2 flex justify-between">
                  <span className="text-[#7D8795]">Primary Category</span>
                  <Link
                    href={`/category/${business.category_slug}`}
                    className="font-semibold text-[#004AAD] hover:underline"
                  >
                    {business.category_name}
                  </Link>
                </div>

                <div className="pt-3 flex justify-between">
                  <span className="text-[#7D8795]">Primary City</span>
                  <Link
                    href={`/location/${business.city.toLowerCase()}`}
                    className="font-semibold text-[#004AAD] hover:underline"
                  >
                    {business.city}
                  </Link>
                </div>

                <div className="pt-3 flex justify-between">
                  <span className="text-[#7D8795]">Directory Status</span>
                  <span className="font-semibold text-[#087C3C]">Active & Published</span>
                </div>

                <div className="pt-3 flex justify-between">
                  <span className="text-[#7D8795]">Verification</span>
                  <span className="font-semibold text-[#1F242E] capitalize">
                    {business.verification_status}
                  </span>
                </div>

                {business.show_email && business.business_contact_email && (
                  <div className="pt-3 flex justify-between">
                    <span className="text-[#7D8795]">Public Email</span>
                    <a
                      href={`mailto:${business.business_contact_email}`}
                      className="font-semibold text-[#004AAD] hover:underline truncate max-w-[150px]"
                    >
                      {business.business_contact_email}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Schema.org LocalBusiness JSON-LD */}
      <LocalBusinessJsonLd
        business={business}
        canonicalUrl={canonicalUrl}
      />

      <PublicFooter />
    </div>
  );
}
