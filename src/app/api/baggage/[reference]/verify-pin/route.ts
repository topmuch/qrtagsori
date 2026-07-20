import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';

// ─── LABS — Feature #6: Vérification d'identité du propriétaire ───
//
// Permet au trouveur de vérifier qu'il rend le bagage à la bonne personne.
// Le propriétaire annonce oralement son PIN au trouveur, qui le saisit ici.
//
// Sécurité :
//  - Max 3 tentatives par 10 minutes (anti brute-force)
//  - En cas de succès : renvoie juste le nom du propriétaire (pas de phone/email)
//  - En cas d'échec : pas d'info sur le propriétaire divulguée
//  - Le PIN est hashé bcrypt en DB

const verifyPinSchema = z.object({
  pin: z.string().min(4).max(8),
});

// ─── Rate limiting : 3 tentatives / 10 min par bagage ───
const MAX_ATTEMPTS = 3;
const WINDOW_MS = 10 * 60 * 1000;
const attempts = new Map<string, { count: number; firstAt: number }>();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await params;
    const body = await request.json();
    const validated = verifyPinSchema.parse(body);

    // ─── Rate limiting ───
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')?.trim()
      || 'unknown';
    const rateLimitKey = `${reference}:${clientIp}`;
    const now = Date.now();
    const entry = attempts.get(rateLimitKey);

    if (entry) {
      // Reset si la fenêtre est dépassée
      if (now - entry.firstAt > WINDOW_MS) {
        attempts.delete(rateLimitKey);
      } else if (entry.count >= MAX_ATTEMPTS) {
        const minutesLeft = Math.ceil((WINDOW_MS - (now - entry.firstAt)) / 60000);
        return NextResponse.json(
          {
            error: `Trop de tentatives. Réessayez dans ${minutesLeft} min.`,
            verified: false,
            rateLimited: true,
          },
          { status: 429 }
        );
      }
    }

    // Récupérer le baggage
    const baggage = await db.baggage.findUnique({
      where: { reference },
      select: {
        reference: true,
        status: true,
        transitMode: true,
        travelerFirstName: true,
        travelerLastName: true,
      },
    });

    if (!baggage) {
      return NextResponse.json(
        { error: 'Bagage introuvable', verified: false },
        { status: 404 }
      );
    }

    if (baggage.status === 'pending_activation') {
      return NextResponse.json(
        { error: 'Ce bagage n\'est pas encore activé', verified: false },
        { status: 400 }
      );
    }

    if (baggage.transitMode === 'inactive') {
      return NextResponse.json(
        { error: 'Ce QR code est actuellement désactivé', verified: false },
        { status: 400 }
      );
    }

      return NextResponse.json(
        { error: 'Aucun PIN défini pour ce bagage. Vérification impossible.', verified: false },
        { status: 400 }
      );
    }

    // ─── Vérifier le PIN ───

    // Incrémenter le compteur d'essais
    const currentEntry = attempts.get(rateLimitKey) || { count: 0, firstAt: now };
    currentEntry.count += 1;
    if (!attempts.has(rateLimitKey)) {
      currentEntry.firstAt = now;
    }
    attempts.set(rateLimitKey, currentEntry);

    if (!pinValid) {
      const remaining = Math.max(0, MAX_ATTEMPTS - currentEntry.count);
      return NextResponse.json(
        {
          verified: false,
          error: remaining > 0
            ? `PIN incorrect. ${remaining} tentative(s) restante(s).`
            : 'Trop de tentatives. Réessayez dans 10 min.',
          attemptsRemaining: remaining,
        },
        { status: 401 }
      );
    }

    // ─── Succès : retourner le nom du propriétaire (uniquement) ───
    // Reset du rate limit en cas de succès
    attempts.delete(rateLimitKey);

    const ownerName = `${baggage.travelerFirstName || ''} ${baggage.travelerLastName || ''}`.trim();

    return NextResponse.json({
      verified: true,
      ownerName,
      message: `Identité vérifiée. Ce bagage appartient à ${ownerName}. Vous pouvez le remettre en toute confiance à cette personne.`,
    });
  } catch (error) {
    console.error('[verify-pin] Error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'PIN invalide', verified: false },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur serveur', verified: false },
      { status: 500 }
    );
  }
}
