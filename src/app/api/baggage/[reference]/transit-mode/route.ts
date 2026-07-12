import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';

// ─── Schema: payload pour basculer le mode En transit ───
const transitModeSchema = z.object({
  pin: z.string().min(4).max(8), // PIN du propriétaire (auth)
  mode: z.enum(['active', 'inactive']),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await params;
    const body = await request.json();
    const validated = transitModeSchema.parse(body);

    // Récupérer le baggage
    const baggage = await db.baggage.findUnique({
      where: { reference },
      select: {
        id: true,
        ownerPin: true,
        transitMode: true,
        status: true,
      },
    });

    if (!baggage) {
      return NextResponse.json(
        { error: 'Bagage introuvable' },
        { status: 404 }
      );
    }

    // Vérifier que le baggage est actif
    if (baggage.status === 'pending_activation') {
      return NextResponse.json(
        { error: 'Ce bagage n\'est pas encore activé' },
        { status: 400 }
      );
    }

    // Vérifier le PIN
    if (!baggage.ownerPin) {
      return NextResponse.json(
        { error: 'Aucun PIN défini. Veuillez définir un PIN d\'abord.' },
        { status: 400 }
      );
    }

    const pinValid = await bcrypt.compare(validated.pin, baggage.ownerPin);
    if (!pinValid) {
      return NextResponse.json(
        { error: 'PIN incorrect' },
        { status: 401 }
      );
    }

    // Mettre à jour le mode
    const updated = await db.baggage.update({
      where: { id: baggage.id },
      data: {
        transitMode: validated.mode,
        transitModeUpdatedAt: new Date(),
      },
      select: {
        id: true,
        reference: true,
        transitMode: true,
        transitModeUpdatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      baggage: updated,
      message: validated.mode === 'active'
        ? 'QR code réactivé. Les scans fonctionnent normalement.'
        : 'QR code désactivé. Les scans renvoient maintenant vers une page neutre.',
    });
  } catch (error) {
    console.error('[transit-mode] Error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// GET — récupère l'état actuel du mode En transit (sans PIN, juste pour affichage)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await params;
    const baggage = await db.baggage.findUnique({
      where: { reference },
      select: {
        transitMode: true,
        transitModeUpdatedAt: true,
        ownerPin: true,
      },
    });

    if (!baggage) {
      return NextResponse.json(
        { error: 'Bagage introuvable' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      transitMode: baggage.transitMode,
      transitModeUpdatedAt: baggage.transitModeUpdatedAt,
      hasPin: !!baggage.ownerPin,
    });
  } catch (error) {
    console.error('[transit-mode GET] Error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
