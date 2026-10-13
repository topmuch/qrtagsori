import type { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://qrtags.com';
  const now = new Date();

  const frLangs: Record<string, string> = {
    'fr-FR': `${baseUrl}/`, 'en-US': `${baseUrl}/en`, 'ar-AR': `${baseUrl}/ar`,
    'fr-SN': `${baseUrl}/`, 'fr-CI': `${baseUrl}/`, 'fr-ML': `${baseUrl}/`,
    'fr-BF': `${baseUrl}/`, 'fr-TG': `${baseUrl}/`, 'fr-BJ': `${baseUrl}/`,
    'fr-GN': `${baseUrl}/`, 'fr-BE': `${baseUrl}/`, 'fr-CH': `${baseUrl}/`,
  };

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, lastModified: now, changeFrequency: 'daily', priority: 1.0, alternates: { languages: frLangs } },
    { url: `${baseUrl}/assistance`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/a-propos`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/avis`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/devenir-partenaire`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/inscription`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/inscrire`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/scan`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/shop`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/shop/pack-3-stickers`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/shop/pack-5-stickers`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/shop/pack-10-stickers`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/shop/pack-15-stickers`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/fonctionnalites/sans-batterie`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/fonctionnalites/sans-application`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/fonctionnalites/alertes-whatsapp`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/fonctionnalites/securite-rgpd`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/fonctionnalites/geolocalisation`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/etapes/activez-30-secondes`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/etapes/recevez-votre-qr`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/etapes/soyez-notifie`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/etapes/voyagez-serein`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/etapes/trouveur/vous-trouvez-un-objet`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/etapes/trouveur/scannez-le-qr-code`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/etapes/trouveur/contactez-le-proprietaire`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/etapes/trouveur/objet-est-rendu`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/metiers/hotels`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/metiers/ecoles`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/metiers/consignes`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/metiers/loueurs`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/metiers/cliniques`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/cgu`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/confidentialite`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/mentions-legales`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];

  const dynamicPages: MetadataRoute.Sitemap = [];
  try {
    const { db } = await import('@/lib/db');
    const posts = await db.blogPost.findMany({
      where: { status: 'published', publishedAt: { lte: new Date() } },
      select: { slug: true, publishedAt: true, updatedAt: true },
      orderBy: { publishedAt: 'desc' }, take: 500,
    });
    for (const p of posts) {
      dynamicPages.push({ url: `${baseUrl}/blog/${p.slug}`, lastModified: p.updatedAt || p.publishedAt || now, changeFrequency: 'weekly', priority: 0.6 });
    }
    const products = await db.product.findMany({ where: { active: true }, select: { slug: true, updatedAt: true }, take: 50 });
    for (const p of products) {
      dynamicPages.push({ url: `${baseUrl}/shop/${p.slug}`, lastModified: p.updatedAt || now, changeFrequency: 'weekly', priority: 0.7 });
    }
  } catch { /* DB unavailable */ }

  return [...staticPages, ...dynamicPages];
}
