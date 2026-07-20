import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const activateSchema = z.object({
  reference: z.string().min(1, 'Référence requise'),
  travelerFirstName: z.string().min(1, 'Prénom requis'),
  travelerLastName: z.string().min(1, 'Nom requis'),
  whatsappOwner: z.string().min(1, 'Numéro WhatsApp requis'),
  customData: z.record(z.string(), z.unknown()).optional(),
});

const PENDING_STATUSES = new Set(['in_stock', 'assigned_to_agency', 'sold', 'pending_activation']);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = activateSchema.parse(body);

    const baggage = await db.baggage.findUnique({
      where: { reference: validatedData.reference },
      include: { agency: true },
    });

    if (!baggage) {
      return NextResponse.json({ error: 'Tag introuvable' }, { status: 404 });
    }

    if (!PENDING_STATUSES.has(baggage.status)) {
      return NextResponse.json({ error: 'Tag déjà activé' }, { status: 400 });
    }

    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    const updatedBaggage = await db.baggage.update({
      where: { id: baggage.id },
      data: {
        travelerFirstName: validatedData.travelerFirstName,
        travelerLastName: validatedData.travelerLastName,
        whatsappOwner: validatedData.whatsappOwner,
        status: 'activated',
        expiresAt,
      },
    });

    return NextResponse.json({
      success: true,
      baggage: {
        id: updatedBaggage.id,
        reference: updatedBaggage.reference,
        type: updatedBaggage.type,
        status: updatedBaggage.status,
        expiresAt: updatedBaggage.expiresAt,
      },
    });
  } catch (error) {
    console.error('[activate] Erreur:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Erreur de validation', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
