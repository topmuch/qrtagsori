import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    let token: string | null = null;

    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    }
    if (!token) {
      const url = new URL(request.url);
      token = url.searchParams.get('token');
    }

    if (!token) {
      return NextResponse.json({ error: 'Token manquant' }, { status: 401 });
    }

    const session = await db.travelerSession.findUnique({ where: { token } });
    if (!session || new Date() > session.expiresAt) {
      return NextResponse.json({ error: 'Session invalide ou expirée' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';

    if (!q) {
      return NextResponse.json({ success: true, results: [] });
    }

    // Chercher par référence, nom d'objet (dans customData), ou travelerName
    const allResults = await db.baggage.findMany({
      where: {
        OR: [
          { reference: { contains: q } },
          { travelerFirstName: { contains: q } },
          { travelerLastName: { contains: q } },
          { customData: { contains: q } },
        ]
      },
      take: 30,
      orderBy: { createdAt: 'desc' }
    });

    // Filtrer : seulement les baggages non liés OU liés à ce voyageur
    const results = allResults.filter(b => !b.travelerId || b.travelerId === session.travelerId);

    return NextResponse.json({
      success: true,
      results: results.map(b => ({
        id: b.id,
        reference: b.reference,
        objectName: b.customData ? (JSON.parse(b.customData)).object_name : null,
        status: b.status,
        isLinked: b.travelerId === session.travelerId,
        createdAt: b.createdAt,
      }))
    });
  } catch (error) {
    console.error('[traveler/search-baggage] Erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
