import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { countryNameToCode } from '@/lib/country-utils';

// ─── LABS — Feature #2: Update baggage profile (requires owner PIN) ───
// Permet au propriétaire de modifier ses coordonnées de voyage en temps réel
// sans changer le QR code physique.

const updateSchema = z.object({
  pin: z.string().min(4).max(8),
  // Champs éditables (tous optionnels — seul ceux fournis sont mis à jour)
  travelerFirstName: z.string().min(1).max(50).optional(),
  travelerLastName: z.string().min(1).max(50).optional(),
  whatsappOwner: z.string().min(6).max(20).optional(),
  airlineName: z.string().max(100).optional(),
  flightNumber: z.string().max(50).optional(),
  trainCompany: z.string().max(100).optional(),
  trainNumber: z.string().max(50).optional(),
  shipName: z.string().max(100).optional(),
  shipCabin: z.string().max(50).optional(),
  busCompany: z.string().max(100).optional(),
  busLineNumber: z.string().max(50).optional(),
  destination: z.string().max(200).optional(),
  departureDate: z.string().optional(), // ISO date string YYYY-MM-DD
  departureTime: z.string().optional(), // "HH:MM"
  transportMode: z.enum(['flight', 'train', 'boat', 'bus']).optional(),
  // Optionnel : régénérer un nouveau PIN
  newPin: z.string().min(4).max(8).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await params;
    const body = await request.json();
    const validated = updateSchema.parse(body);

    // Récupérer le baggage
    const baggage = await db.baggage.findUnique({
      where: { reference },
      select: {
        reference: true,
        status: true,
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

    // Vérifier le PIN
      return NextResponse.json(
        { error: 'Aucun PIN défini pour ce bagage. Contactez le support.' },
        { status: 400 }
      );
    }

    if (!pinValid) {
      return NextResponse.json(
        { error: 'PIN incorrect' },
        { status: 401 }
      );
    }

    // Construire l'objet data à mettre à jour (uniquement les champs fournis)
    const updateData: Record<string, unknown> = {};

    if (validated.travelerFirstName !== undefined) updateData.travelerFirstName = validated.travelerFirstName;
    if (validated.travelerLastName !== undefined) updateData.travelerLastName = validated.travelerLastName;
    if (validated.whatsappOwner !== undefined) updateData.whatsappOwner = validated.whatsappOwner;
    if (validated.airlineName !== undefined) updateData.airlineName = validated.airlineName || null;
    if (validated.flightNumber !== undefined) updateData.flightNumber = validated.flightNumber || null;
    if (validated.trainCompany !== undefined) updateData.trainCompany = validated.trainCompany || null;
    if (validated.trainNumber !== undefined) updateData.trainNumber = validated.trainNumber || null;
    if (validated.shipName !== undefined) updateData.shipName = validated.shipName || null;
    if (validated.shipCabin !== undefined) updateData.shipCabin = validated.shipCabin || null;
    if (validated.busCompany !== undefined) updateData.busCompany = validated.busCompany || null;
    if (validated.busLineNumber !== undefined) updateData.busLineNumber = validated.busLineNumber || null;
    if (validated.destination !== undefined) {
      updateData.destination = validated.destination || null;
      // LABS — Feature #4: mettre à jour aussi le code ISO pays dérivé
      updateData.destinationCountry = countryNameToCode(validated.destination);
    }
    if (validated.departureDate !== undefined) {
      updateData.departureDate = validated.departureDate
        ? new Date(validated.departureDate + 'T00:00:00')
        : null;
    }
    if (validated.departureTime !== undefined) updateData.departureTime = validated.departureTime || null;
    if (validated.transportMode !== undefined) updateData.transportMode = validated.transportMode;

    // Si l'utilisateur veut changer son PIN
    if (validated.newPin) {
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'Aucun champ à mettre à jour' },
        { status: 400 }
      );
    }

    const updated = await db.baggage.update({
      where: { reference: baggage.reference },
      data: updateData,
      select: {
        reference: true,
        travelerFirstName: true,
        travelerLastName: true,
        whatsappOwner: true,
        airlineName: true,
        flightNumber: true,
        trainCompany: true,
        trainNumber: true,
        shipName: true,
        shipCabin: true,
        busCompany: true,
        busLineNumber: true,
        destination: true,
        departureDate: true,
        departureTime: true,
        transportMode: true,
      },
    });

    return NextResponse.json({
      success: true,
      baggage: updated,
      message: validated.newPin
        ? 'Profil mis à jour. Votre nouveau PIN est actif.'
        : 'Profil mis à jour avec succès.',
    });
  } catch (error) {
    console.error('[baggage update] Error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// GET — récupère les infos éditables (sans exposer le hash du PIN)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await params;
    const baggage = await db.baggage.findUnique({
      where: { reference },
      select: {
        reference: true,
        travelerFirstName: true,
        travelerLastName: true,
        whatsappOwner: true,
        airlineName: true,
        flightNumber: true,
        trainCompany: true,
        trainNumber: true,
        shipName: true,
        shipCabin: true,
        busCompany: true,
        busLineNumber: true,
        destination: true,
        destinationCountry: true,
        suspiciousScanCount: true,
        departureDate: true,
        departureTime: true,
        transportMode: true,
        status: true,
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

    return NextResponse.json({
      baggage: {
        ...baggage,
      },
    });
  } catch (error) {
    console.error('[baggage GET] Error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
