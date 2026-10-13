import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Auth: extract token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token manquant' },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7);

    // Validate session
    const session = await db.travelerSession.findUnique({
      where: { token },
      include: { traveler: true },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Token invalide' },
        { status: 401 }
      );
    }

    // Check expiration
    if (new Date() > session.expiresAt) {
      await db.travelerSession.delete({ where: { id: session.id } });
      return NextResponse.json(
        { error: 'Session expirée' },
        { status: 401 }
      );
    }

    // Parse body
    const body = await request.json();
    const { reference } = body;

    if (!reference || typeof reference !== 'string') {
      return NextResponse.json(
        { error: 'Référence du bagage requise' },
        { status: 400 }
      );
    }

    // Find baggage by reference
    const baggage = await db.baggage.findUnique({
      where: { reference },
    });

    if (!baggage) {
      return NextResponse.json(
        { error: 'Bagage introuvable' },
        { status: 404 }
      );
    }

    // Check if baggage already linked to a different traveler
    if (baggage.travelerId && baggage.travelerId !== session.travelerId) {
      return NextResponse.json(
        { error: 'Ce bagage est déjà lié à un autre voyageur' },
        { status: 403 }
      );
    }

    // Link baggage to traveler (no-op if already linked to same traveler)
    await db.baggage.update({
      where: { id: baggage.id },
      data: { travelerId: session.travelerId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[traveler/link-baggage] Erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
