import { MetadataRoute } from 'next';
import { getSitemapEntries } from '@/lib/public-directory';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const data = await getSitemapEntries();

  const entries: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
  ];

  // 1. Published businesses
  for (const b of data.businesses) {
    entries.push({
      url: `${baseUrl}/business/${b.slug}`,
      lastModified: new Date(b.updated_at),
      changeFrequency: 'weekly',
      priority: 0.8,
    });
  }

  // 2. Active categories
  for (const c of data.categories) {
    entries.push({
      url: `${baseUrl}/category/${c.slug}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    });
  }

  // 3. Active locations
  for (const l of data.locations) {
    entries.push({
      url: `${baseUrl}/location/${l.slug}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    });
  }

  // 4. Approved indexable combinations ONLY (Constraint 2)
  for (const combo of data.combinations) {
    entries.push({
      url: `${baseUrl}/location/${combo.location_slug}/${combo.category_slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    });
  }

  return entries;
}
