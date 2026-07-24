import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { headers } from 'next/headers';

/**
 * GET /api/blog/public/[slug]
 * Variante PUBLIQUE de /api/blog/[slug] — pas d'auth requise.
 *
 * Renvoie l'article publié correspondant au slug. Si l'utilisateur est
 * connecté, on tracke la vue (pour analytics). Sinon, on incrémente
 * juste le compteur de vues sans associer d'utilisateur.
 *
 * Champs retournés : id, title, slug, content, excerpt, coverImage,
 * category, publishedAt, views, createdAt, author.name.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

    // Find post (must be published + publishedAt <= now)
    const post = await db.blogPost.findUnique({
      where: {
        slug,
        status: 'published',
        publishedAt: { lte: new Date() },
      },
      select: {
        id: true,
        title: true,
        slug: true,
        content: true,
        excerpt: true,
        coverImage: true,
        category: true,
        publishedAt: true,
        views: true,
        createdAt: true,
        author: { select: { id: true, name: true, email: true } },
      },
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Article non trouvé' },
        { status: 404 },
      );
    }

    // Try to get the current session (optional — do not 401 if missing)
    let userId: string | undefined;
    let agencyId: string | null | undefined;
    try {
      const user = await getSession();
      if (user) {
        userId = user.id;
        agencyId = user.agencyId;
      }
    } catch {
      // ignore — anonymous access allowed
    }

    // Track view (async, don't wait) — only if we have a user
    if (userId || agencyId) {
      trackView(post.id, userId, agencyId).catch(console.error);
    }

    // Increment view count (fire and forget)
    db.blogPost
      .update({ where: { id: post.id }, data: { views: { increment: 1 } } })
      .catch((err) => console.error('[blog/public] view increment failed:', err));

    return NextResponse.json({ post });
  } catch (error) {
    console.error('[blog/public/[slug]] error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de l\'article' },
      { status: 500 },
    );
  }
}

// Track view for analytics — only when we have user info
async function trackView(postId: string, userId?: string, agencyId?: string | null) {
  try {
    const headersList = await headers();
    const ipAddress =
      headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      headersList.get('x-real-ip') ||
      null;
    const userAgent = headersList.get('user-agent');

    await db.blogView.create({
      data: {
        postId,
        userId: userId || null,
        agencyId: agencyId || null,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    console.error('Error tracking blog view:', error);
  }
}
