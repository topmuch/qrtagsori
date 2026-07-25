import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * GET /api/stats/public
 *
 * Statistiques publiques affichées sur la page d'accueil :
 *   - totalFound       : nombre total d'objets retrouvés (status = 'found')
 *   - foundThisMonth   : objets retrouvés sur les 30 derniers jours glissants
 *   - totalScans       : nombre total de scans (tous bagages confondus)
 *   - totalProtected   : nombre d'objets actuellement actifs (status = 'active')
 *   - averageRating    : note moyenne des avis (si ≥ 1 avis publié)
 *   - totalReviews     : nombre d'avis publiés
 *
 * Pas de rate limit : page publique, lecture seule, données agrégées non sensibles.
 * Cache navigateur 5 min (s-maxage) pour réduire la charge DB.
 */
export async function GET() {
  try {
    // Fenêtre de 30 jours glissants pour "ce mois-ci"
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalFound,
      foundThisMonth,
      totalScans,
      totalProtected,
      reviewsAggregate,
    ] = await Promise.all([
      db.baggage.count({ where: { status: 'found' } }),
      db.baggage.count({
        where: {
          status: 'found',
          foundAt: { gte: thirtyDaysAgo },
        },
      }),
      db.scanLog.count(),
      db.baggage.count({ where: { status: 'active' } }),
      db.review.aggregate({
        where: { isApproved: true },
        _avg: { rating: true },
        _count: { id: true },
      }),
    ]);

    const stats = {
      totalFound,
      foundThisMonth,
      totalScans,
      totalProtected,
      averageRating: reviewsAggregate._avg.rating
        ? Math.round(reviewsAggregate._avg.rating * 10) / 10
        : 0,
      totalReviews: reviewsAggregate._count.id,
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(stats, {
      headers: {
        // Cache navigateur 5 min, cache CDN 5 min aussi (s-maxage)
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('[stats/public] Error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des statistiques.' },
      { status: 500 }
    );
  }
}
