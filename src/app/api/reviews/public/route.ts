import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ─── GET /api/reviews/public ───
// Retourne les avis publiés (isApproved=true) avec les champs publics only.
// Pas de rate limit (page publique, lecture seule).
export async function GET() {
  try {
    const limit = 50;  // 50 avis max sur la page /avis

    const [reviews, statsAggregate] = await Promise.all([
      db.review.findMany({
        where: { isApproved: true },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          name: true,
          location: true,
          rating: true,
          title: true,
          content: true,
          createdAt: true,
          // Champs spécifiques aux avis postés depuis /track/[token]
          finderName: true,
          objectName: true,
          objectPhoto: true,
          objectCategory: true,
          language: true,
        },
      }),
      db.review.aggregate({
        where: { isApproved: true },
        _avg: { rating: true },
        _count: { id: true },
      }),
    ]);

    return NextResponse.json({
      reviews,
      stats: {
        averageRating: statsAggregate._avg.rating
          ? Math.round(statsAggregate._avg.rating * 10) / 10
          : 0,
        totalReviews: statsAggregate._count.id,
      },
    });
  } catch (error) {
    console.error('Error fetching public reviews:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des avis.' },
      { status: 500 }
    );
  }
}
