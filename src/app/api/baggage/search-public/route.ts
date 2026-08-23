import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * API PUBLIQUE — recherche un baggage non lié par référence.
 * Ne renvoie que les baggages où travelerId est null (disponibles pour liaison).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').trim().toUpperCase();

    if (!q || q.length < 2) {
      return NextResponse.json({ success: true, results: [] });
    }

    // Ne chercher que les baggages NON liés (travelerId est null)
    const results = await db.baggage.findMany({
      where: {
        reference: { contains: q },
        travelerId: null,
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
    });

    const mapped = results.map(b => {
      let objectName: string | null = null;
      let color: string | null = null;
      let categoryLabel: string | null = null;
      try {
        const cd = b.customData ? JSON.parse(b.customData) : null;
        if (cd) {
          objectName = cd.object_name || null;
          color = cd.color || null;
          categoryLabel = cd.category_label || null;
        }
      } catch {}

      return {
        id: b.id,
        reference: b.reference,
        objectName,
        color,
        categoryLabel,
        status: b.status,
      };
    });

    return NextResponse.json({ success: true, results: mapped });
  } catch (error) {
    console.error('[baggage/search-public] Erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
