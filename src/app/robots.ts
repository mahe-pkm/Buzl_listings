import { MetadataRoute } from 'next';
import { isStagingEnvironment, getAppBaseUrl } from '@/lib/staging';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getAppBaseUrl();
  const isStaging = isStagingEnvironment();

  if (isStaging) {
    return {
      rules: [
        {
          userAgent: '*',
          disallow: '/',
        },
      ],
    };
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/dashboard/',
          '/internal/',
          '/login',
          '/auth/',
          '/search',
          '/api/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
