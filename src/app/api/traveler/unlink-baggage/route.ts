import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token manquant' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const session = await db.travelerSession.findUnique({
      where: { token },
    });

    if (!session || new Date() > session.expiresAt) {
      return NextResponse.json({ error: 'Session invalide ou expirée' }, { status: 401 });
    }

    const body = await request.json();
    const { reference } = body;

    if (!reference) {
      return NextResponse.json({ error: 'Référence requise' }, { status: 400 });
    }

    const baggage = await db.baggage.findUnique({ where: { reference } });
    if (!baggage) {
      return NextResponse.json({ error: 'Bagage introuvable' }, { status: 404 });
    }

    if (baggage.travelerId !== session.travelerId) {
      return NextResponse.json({ error: 'Ce bagage ne vous appartient pas' }, { status: 403 });
    }

    await db.baggage.update({
      where: { id: baggage.id },
      data: { travelerId: null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[traveler/unlink-baggage] Erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
