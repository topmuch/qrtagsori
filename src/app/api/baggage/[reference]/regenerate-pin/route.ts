import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db } from '@/lib/db';

// ─── LABS — Regenerate owner PIN (for recovery if forgotten) ───
//
// POST /api/baggage/[reference]/regenerate-pin
//   Body: { pin: "1234" }  ← current PIN to verify ownership
//
// If the owner forgot their PIN, they cannot use this endpoint.
// In that case, they must contact support (mailto link on /suivi).
// But if they know their PIN and just want to change it, this works.

const regenerateSchema = z.object({
  pin: z.string().min(4).max(8),
});

function generateOwnerPin(): string {
  return String(crypto.randomInt(0, 10000)).padStart(4, '0');
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await params;
    const body = await request.json();
    const validated = regenerateSchema.parse(body);

    const baggage = await db.baggage.findUnique({
      where: { reference },
      select: {
        id: true,
        status: true,
        travelerFirstName: true,
        travelerLastName: true,
      },
    });

    if (!baggage) {
      return NextResponse.json(
        { error: 'Bagage introuvable' },
        { status: 404 }
      );
    }

    if (baggage.status === 'pending_activation') {
      return NextResponse.json(
        { error: 'Ce bagage n\'est pas encore activé' },
        { status: 400 }
      );
    }

      return NextResponse.json(
        { error: 'Aucun PIN défini pour ce bagage' },
        { status: 400 }
      );
    }

    // Verify current PIN
    if (!pinValid) {
      return NextResponse.json(
        { error: 'PIN actuel incorrect' },
        { status: 401 }
      );
    }

    // Generate new PIN
    const newPinPlain = generateOwnerPin();
    const newPinHash = await bcrypt.hash(newPinPlain, 10);

    await db.baggage.update({
      where: { id: baggage.id },
      data: {
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Nouveau PIN généré. Notez-le précieusement, il ne sera plus affiché.',
    });
  } catch (error) {
    console.error('[regenerate-pin] Error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
