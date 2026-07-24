import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * GET /api/blog/public
 * Variante PUBLIQUE de /api/blog (pas d'auth requise).
 * Utilisée pour afficher les derniers articles sur la home page et
 * dans les zones publiques du site.
 *
 * Query params:
 *   - limit (default 3, max 12)
 *   - category (filtre optionnel)
 *
 * Ne renvoie que les champs publics : id, title, slug, excerpt, coverImage,
 * category, publishedAt, author.name.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const limit = Math.min(parseInt(searchParams.get('limit') || '3', 10), 12);

    const where: Record<string, unknown> = {
      status: 'published',
      publishedAt: { lte: new Date() },
    };
    if (category && category !== 'all') where.category = category;

    const posts = await db.blogPost.findMany({
      where,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        coverImage: true,
        category: true,
        publishedAt: true,
        author: { select: { name: true } },
      },
      orderBy: { publishedAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({ posts });
  } catch (error) {
    console.error('[blog/public] error:', error);
    return NextResponse.json({ posts: [] });
  }
}
