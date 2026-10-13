import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://qrtags.com';
  const disallow = ['/admin/', '/agence/', '/api/', '/dashboard/', '/mes-bagages', '/connexion', '/login', '/connexion-voyageur', '/forgot-password', '/reset-password', '/verify-email', '/voyageurs-standard', '/offline', '/demo', '/expired', '/success', '/checklist', '/checklist/*', '/workflow/*', '/track/*', '/share/*', '/shop/success', '/suivi/*/edit'];
  return {
    rules: [
      { userAgent: 'Googlebot', allow: '/', disallow },
      { userAgent: 'Bingbot', allow: '/', disallow },
      { userAgent: 'Twitterbot', allow: '/' },
      { userAgent: 'facebookexternalhit', allow: '/' },
      { userAgent: 'LinkedInBot', allow: '/' },
      { userAgent: 'Applebot', allow: '/' },
      { userAgent: 'Slackbot', allow: '/' },
      { userAgent: 'Discordbot', allow: '/' },
      { userAgent: 'TelegramBot', allow: '/' },
      { userAgent: '*', allow: '/', disallow },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
