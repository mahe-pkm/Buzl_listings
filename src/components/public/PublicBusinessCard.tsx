import Link from 'next/link';
import { PublicBusinessCardData } from '@/lib/public-directory';

interface PublicBusinessCardProps {
  business: PublicBusinessCardData;
}

export default function PublicBusinessCard({ business }: PublicBusinessCardProps) {
  // Format location display according to strict privacy rules
  let locationDisplay = `${business.city}, ${business.state}`;

  if (business.location_mode === 'service_area') {
    if (business.service_areas && business.service_areas.length > 0) {
      locationDisplay = `Serving ${business.service_areas.slice(0, 2).join(', ')}${
        business.service_areas.length > 2 ? ` +${business.service_areas.length - 2} more` : ''
      }`;
    } else {
      locationDisplay = `Serving ${business.city}`;
    }
  } else if (business.show_street_address && business.locality) {
    locationDisplay = `${business.locality}, ${business.city}`;
  }

  const cleanPhone = business.primary_phone.replace(/[^0-9+]/g, '');
  const cleanWhatsapp = business.whatsapp_phone ? business.whatsapp_phone.replace(/[^0-9]/g, '') : null;

  return (
    <article className="group bg-white rounded-xl border border-[#E1E4EA] hover:border-[#004AAD]/30 hover:shadow-md transition-all duration-200 p-5 flex flex-col justify-between">
      <div>
        {/* Top Header: Category & Verification */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <Link
            href={`/category/${business.category_slug}`}
            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#F2F5FA] text-[#004AAD] hover:bg-[#EAEFF7] transition-colors"
          >
            {business.category_name}
          </Link>

          {business.verification_status === 'verified' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#ECF4FF] text-[#004AAD] border border-[#BEDBFE]">
              <svg className="w-3 h-3 text-[#004AAD]" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Verified
            </span>
          )}
        </div>

        {/* Business Title */}
        <h3 className="text-lg font-bold text-[#1F242E] group-hover:text-[#004AAD] transition-colors line-clamp-1 mb-1">
          <Link href={`/business/${business.slug}`}>
            {business.canonical_name}
          </Link>
        </h3>

        {/* Location & Service Model */}
        <div className="flex items-center gap-1.5 text-xs text-[#5D6776] mb-3">
          <svg className="w-4 h-4 text-[#7D8795] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="truncate">{locationDisplay}</span>
          {business.location_mode === 'service_area' && (
            <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-medium">
              Doorstep / Area
            </span>
          )}
        </div>

        {/* Description snippet if available */}
        {business.description && (
          <p className="text-xs text-[#5D6776] line-clamp-2 leading-relaxed mb-4">
            {business.description}
          </p>
        )}

        {/* Services Chips */}
        {business.services && business.services.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {business.services.slice(0, 3).map((service, idx) => (
              <span
                key={idx}
                className="inline-block px-2 py-0.5 text-[11px] rounded bg-[#F8FAFC] text-[#475569] border border-[#E2E8F0] truncate max-w-[200px]"
              >
                {service}
              </span>
            ))}
            {business.services.length > 3 && (
              <span className="inline-block px-1.5 py-0.5 text-[10px] rounded bg-[#F8FAFC] text-[#64748B] font-medium">
                +{business.services.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Card Action Footer */}
      <div className="pt-3 border-t border-[#F2F5FA] flex items-center justify-between gap-2 mt-2">
        <Link
          href={`/business/${business.slug}`}
          className="text-xs font-semibold text-[#004AAD] hover:underline"
        >
          View Listing →
        </Link>

        <div className="flex items-center gap-2">
          {cleanWhatsapp && (
            <a
              href={`https://wa.me/${cleanWhatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center p-2 rounded-lg text-[#087C3C] bg-[#E3F2EA] hover:bg-[#D1EBE0] transition-colors"
              title="Chat on WhatsApp"
              aria-label={`Chat with ${business.canonical_name} on WhatsApp`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
              </svg>
            </a>
          )}

          <a
            href={`tel:${cleanPhone}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#004AAD] hover:bg-[#003C8A] transition-colors"
            aria-label={`Call ${business.canonical_name}`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
            <span>Call</span>
          </a>
        </div>
      </div>
    </article>
  );
}
