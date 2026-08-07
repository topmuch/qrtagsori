import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://qrtags.com';
  return {
    rules: [
      // Bots majeurs — tout indexé
      { userAgent: 'Googlebot', allow: '/', disallow: ['/admin/', '/agence/tableau-de-bord', '/api/'] },
      { userAgent: 'Bingbot', allow: '/', disallow: ['/admin/', '/agence/tableau-de-bord', '/api/'] },
      { userAgent: 'Twitterbot', allow: '/' },
      { userAgent: 'facebookexternalhit', allow: '/' },
      { userAgent: 'LinkedInBot', allow: '/' },
      { userAgent: 'Applebot', allow: '/' },
      // Catch-all
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/agence/tableau-de-bord',
          '/agence/baggages',
          '/agence/profil',
          '/agence/rapports',
          '/agence/assistance',
          '/agence/perdus',
          '/agence/trouvailles',
          '/api/',
          '/dashboard/',
          '/mes-bagages',
          '/suivi/*/edit',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
