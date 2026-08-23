import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * API PUBLIQUE — recherche un baggage par référence sans authentification.
 * Utilisée par la page /mes-bagages pour le flow :
 *   chercher QR → voir le résultat → s'inscrire → lier automatiquement
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').trim();

    if (!q || q.length < 2) {
      return NextResponse.json({ success: true, results: [] });
    }

    // Chercher par référence exacte ou partielle
    const results = await db.baggage.findMany({
      where: {
        reference: { contains: q, mode: 'insensitive' },
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
    });

    // Parser customData une seule fois
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
        isLinked: !!b.travelerId,
        createdAt: b.createdAt,
      };
    });

    return NextResponse.json({ success: true, results: mapped });
  } catch (error) {
    console.error('[baggage/search-public] Erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
