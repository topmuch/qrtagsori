import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * GET /api/stats/public
 *
 * Statistiques publiques affichées sur la page d'accueil :
 *   - totalFound       : nombre total d'objets retrouvés
 *   - foundThisMonth   : objets retrouvés sur les 30 derniers jours glissants
 *   - totalScans       : nombre total de scans (tous bagages confondus)
 *   - totalProtected   : nombre d'objets actuellement actifs (status = 'active')
 *   - averageRating    : note moyenne des avis (si ≥ 1 avis publié)
 *   - totalReviews     : nombre d'avis publiés
 *
 * ── Définition de "retrouvé" ──────────────────────────────────────────
 * Un bagage est considéré comme "retrouvé" si AU MOINS UN des signaux
 * suivants est présent :
 *   1. status = 'found'           → mark-found côté admin
 *   2. foundAt != null            → cancel_lost depuis /track/[token]
 *                                   (propriétaire a récupéré son objet)
 *                                   OU mark-found côté admin
 *   3. founderName != null        → un trouveur s'est identifié lors d'un
 *                                   scan (forte probabilité de restitution)
 *
 * Ce critère inclusif est nécessaire car le flux produit ne pose
 * JAMAIS status='found' automatiquement :
 *   - declare_lost  → status reste 'active' (seul isLost/declaredLostAt change)
 *   - cancel_lost   → status reste 'active' (seul foundAt est posé)
 *   - scan POST     → status reste 'active' (seul founderName/founderAt posés)
 * Seul le mark-found admin (rarement utilisé) pose status='found'.
 *
 * ── "Retrouvé ce mois-ci" ─────────────────────────────────────────────
 * On retient la date la plus pertinente :
 *   - foundAt    si posé (cancel_lost ou admin mark-found)
 *   - founderAt  sinon (trouveur identifié)
 * Si l'une OU l'autre tombe dans les 30 derniers jours, on compte l'objet.
 *
 * Pas de rate limit : page publique, lecture seule, données agrégées non sensibles.
 * Cache navigateur 5 min (s-maxage) pour réduire la charge DB.
 */
export async function GET() {
  try {
    // Fenêtre de 30 jours glissants pour "ce mois-ci"
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Critère "retrouvé" — voir doc ci-dessus
    const foundWhere = {
      OR: [
        { status: 'found' },
        { foundAt: { not: null } },
        { founderName: { not: null } },
      ],
    };

    // Critère "retrouvé ce mois-ci" — foundAt OU founderAt dans les 30 derniers jours
    const foundThisMonthWhere = {
      OR: [
        { foundAt: { gte: thirtyDaysAgo } },
        { founderAt: { gte: thirtyDaysAgo } },
      ],
    };

    const [
      totalFound,
      foundThisMonth,
      totalScans,
      totalProtected,
      reviewsAggregate,
    ] = await Promise.all([
      db.baggage.count({ where: foundWhere }),
      db.baggage.count({ where: foundThisMonthWhere }),
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
