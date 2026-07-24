import type { MetadataRoute } from 'next';

/**
 * Sitemap dynamique — Next.js App Router génère /sitemap.xml automatiquement.
 * Inclut les pages publiques principales + les articles de blog publiés.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://qrtags.com';
  const now = new Date();

  // Pages publiques statiques
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/assistance`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/a-propos`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/inscription`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/inscrire`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/devenir-partenaire`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/cgu`, lastModified: now, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${baseUrl}/confidentialite`, lastModified: now, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${baseUrl}/mentions-legales`, lastModified: now, changeFrequency: 'yearly', priority: 0.4 },
    // Pages fonctionnalités
    { url: `${baseUrl}/fonctionnalites/sans-batterie`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/fonctionnalites/sans-application`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/fonctionnalites/alertes-whatsapp`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/fonctionnalites/securite-rgpd`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/fonctionnalites/geolocalisation`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    // Pages étapes
    { url: `${baseUrl}/etapes/activez-30-secondes`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/etapes/recevez-votre-qr`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/etapes/soyez-notifie`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/etapes/voyagez-serein`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    // Pages métiers
    { url: `${baseUrl}/metiers/hotels`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/metiers/ecoles`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/metiers/consignes`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/metiers/loueurs`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/metiers/cliniques`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    // Boutique
    { url: `${baseUrl}/shop`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
  ];

  // Articles de blog publiés (fetch DB)
  const blogPosts: MetadataRoute.Sitemap = [];
  try {
    // Import dynamique pour éviter de casser le build si DB indisponible
    const { db } = await import('@/lib/db');
    const posts = await db.blogPost.findMany({
      where: { status: 'published', publishedAt: { lte: new Date() } },
      select: { slug: true, publishedAt: true, updatedAt: true },
      orderBy: { publishedAt: 'desc' },
      take: 200,
    });
    for (const p of posts) {
      blogPosts.push({
        url: `${baseUrl}/agence/blog/${p.slug}`,
        lastModified: p.updatedAt || p.publishedAt || now,
        changeFrequency: 'weekly',
        priority: 0.6,
      });
    }
  } catch {
    // DB indisponible — on renvoie au moins les pages statiques
  }

  return [...staticPages, ...blogPosts];
}
