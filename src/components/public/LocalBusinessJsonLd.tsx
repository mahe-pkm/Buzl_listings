import { PublicBusinessDetail } from '@/lib/public-directory';

interface LocalBusinessJsonLdProps {
  business: PublicBusinessDetail;
  canonicalUrl: string;
}

const SCHEMA_DAYS = [
  'https://schema.org/Sunday',
  'https://schema.org/Monday',
  'https://schema.org/Tuesday',
  'https://schema.org/Wednesday',
  'https://schema.org/Thursday',
  'https://schema.org/Friday',
  'https://schema.org/Saturday',
];

export default function LocalBusinessJsonLd({
  business,
  canonicalUrl,
}: LocalBusinessJsonLdProps) {
  // Build opening hours specifications
  const openingHoursSpecification = (business.hours || [])
    .filter((h) => !h.is_closed && (h.is_24_hours || (h.opens_at && h.closes_at)))
    .map((h) => {
      if (h.is_24_hours) {
        return {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: SCHEMA_DAYS[h.day_of_week],
          opens: '00:00:00',
          closes: '23:59:59',
        };
      }
      return {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: SCHEMA_DAYS[h.day_of_week],
        opens: h.opens_at,
        closes: h.closes_at,
      };
    });

  // Strict privacy-safe address and areaServed builder
  let postalAddress: Record<string, unknown>;

  if (business.location_mode !== 'service_area' && business.show_street_address) {
    // Storefront with public address
    const street = [business.address_line_1, business.address_line_2]
      .filter(Boolean)
      .join(', ');

    postalAddress = {
      '@type': 'PostalAddress',
      ...(street ? { streetAddress: street } : {}),
      ...(business.locality ? { addressLocality: business.locality } : { addressLocality: business.city }),
      addressRegion: business.state,
      ...(business.postal_code ? { postalCode: business.postal_code } : {}),
      addressCountry: business.country_code || 'IN',
    };
  } else {
    // Service-area or hidden street address: NEVER output street address or coordinates
    postalAddress = {
      '@type': 'PostalAddress',
      addressLocality: business.city,
      addressRegion: business.state,
      addressCountry: business.country_code || 'IN',
    };
  }

  // Area served
  let areaServed: unknown = undefined;
  if (business.service_areas && business.service_areas.length > 0) {
    areaServed = business.service_areas.map((sa) => ({
      '@type': 'AdministrativeArea',
      name: sa.name,
    }));
  } else {
    areaServed = {
      '@type': 'City',
      name: business.city,
    };
  }

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': canonicalUrl,
    name: business.canonical_name,
    url: canonicalUrl,
    telephone: business.primary_phone,
    address: postalAddress,
    ...(areaServed ? { areaServed } : {}),
    ...(business.description ? { description: business.description } : {}),
    ...(business.website_url ? { sameAs: [business.website_url] } : {}),
    ...(openingHoursSpecification.length > 0 ? { openingHoursSpecification } : {}),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
