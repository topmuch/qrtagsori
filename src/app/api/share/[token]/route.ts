import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ─── LABS — Feature G: API publique pour la page de partage ───
//
// GET /api/share/[token]
//   Renvoie les informations de suivi (LECTURE SEULE) pour la page
//   /share/[token]. Aucun PIN requis — le token lui-même est l'auth.
//
// Sécurité :
//  - Le token est un secret partagé (128 bits d'entropie)
//  - Aucune info sensible renvoyée (pas de PIN, pas de phone, pas d'email)
//  - Le propriétaire peut révoquer le token à tout moment
//  - Seuls les 5 derniers scans sont renvoyés (pas l'historique complet)

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token || token.length < 16) {
      return NextResponse.json(
        { error: 'Token invalide' },
        { status: 400 }
      );
    }

    // Récupérer le baggage par son shareToken
    const baggage = await db.baggage.findUnique({
      where: { shareToken: token },
      include: {
        scanLogs: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            location: true,
            city: true,
            country: true,
            finderName: true,
            createdAt: true,
          },
        },
      },
    });

    if (!baggage) {
      return NextResponse.json(
        { error: 'Lien de partage invalide ou révoqué' },
        { status: 404 }
      );
    }

    if (baggage.status === 'pending_activation') {
      return NextResponse.json(
        { error: 'Ce bagage n\'est pas encore activé' },
        { status: 400 }
      );
    }

    if (baggage.transitMode === 'inactive') {
      return NextResponse.json(
        { error: 'Le propriétaire a temporairement désactivé ce QR code' },
        { status: 400 }
      );
    }

    // Construire la réponse — SANS données sensibles
    return NextResponse.json({
      reference: baggage.reference,
      travelerName: `${baggage.travelerFirstName || ''} ${baggage.travelerLastName || ''}`.trim() || 'Voyageur',
      type: baggage.type,
      transportMode: baggage.transportMode,
      flightNumber: baggage.flightNumber,
      airlineName: baggage.airlineName,
      trainNumber: baggage.trainNumber,
      trainCompany: baggage.trainCompany,
      shipName: baggage.shipName,
      busCompany: baggage.busCompany,
      busLineNumber: baggage.busLineNumber,
      destination: baggage.destination,
      status: baggage.status,
      lastScanDate: baggage.lastScanDate?.toISOString() || null,
      lastLocation: baggage.lastLocation,
      declaredLostAt: baggage.declaredLostAt?.toISOString() || null,
      foundAt: baggage.foundAt?.toISOString() || null,
      expiresAt: baggage.expiresAt?.toISOString() || null,
      scans: baggage.scanLogs.map((scan) => ({
        location: scan.location,
        city: scan.city,
        country: scan.country,
        finderName: scan.finderName,
        scannedAt: scan.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('[share GET] Error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
