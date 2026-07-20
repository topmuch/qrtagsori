import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db } from '@/lib/db';

// ─── LABS — Feature G: Partage familial du suivi ───
//
// POST /api/baggage/[reference]/share
//   Body: { pin: "1234", action: "generate" | "revoke" }
//   - generate : crée un token de partage, renvoie l'URL /share/[token]
//   - revoke   : supprime le token existant (révoque l'accès)
//
// GET /api/baggage/[reference]/share
//   Renvoie l'état du partage (token existe ? URL ? date de création ?)
//   Pas de PIN requis (juste pour afficher l'état sur /suivi)

const shareSchema = z.object({
  pin: z.string().min(4).max(8),
  action: z.enum(['generate', 'revoke']),
});

function generateShareToken(): string {
  // 32 caractères hex aléatoires (128 bits d'entropie)
  return crypto.randomBytes(16).toString('hex');
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await params;
    const body = await request.json();
    const validated = shareSchema.parse(body);

    const baggage = await db.baggage.findUnique({
      where: { reference },
      select: {
        reference: true,
        status: true,
        shareToken: true,
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

    if (!pinValid) {
      return NextResponse.json(
        { error: 'PIN incorrect' },
        { status: 401 }
      );
    }

    if (validated.action === 'generate') {
      // Générer un nouveau token (remplace l'ancien s'il existe)
      const newToken = generateShareToken();
      await db.baggage.update({
        where: { reference: baggage.reference },
        data: {
          shareToken: newToken,
          shareTokenCreatedAt: new Date(),
        },
      });

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://qrtags.com';
      const shareUrl = `${appUrl}/share/${newToken}`;

      return NextResponse.json({
        success: true,
        action: 'generate',
        shareUrl,
        token: newToken,
        createdAt: new Date().toISOString(),
        message: 'Lien de partage généré. Partagez-le avec un proche. Il pourra voir le suivi en lecture seule.',
      });
    } else {
      // revoke
      if (!baggage.shareToken) {
        return NextResponse.json(
          { error: 'Aucun lien de partage actif à révoquer' },
          { status: 400 }
        );
      }

      await db.baggage.update({
        where: { reference: baggage.reference },
        data: {
          shareToken: null,
          shareTokenCreatedAt: null,
        },
      });

      return NextResponse.json({
        success: true,
        action: 'revoke',
        message: 'Lien de partage révoqué. Le lien précédent ne fonctionne plus.',
      });
    }
  } catch (error) {
    console.error('[share] Error:', error);

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

// GET — récupère l'état du partage (sans PIN, juste pour affichage)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await params;
    const baggage = await db.baggage.findUnique({
      where: { reference },
      select: {
        shareToken: true,
        shareTokenCreatedAt: true,
      },
    });

    if (!baggage) {
      return NextResponse.json(
        { error: 'Bagage introuvable' },
        { status: 404 }
      );
    }

    if (!baggage.shareToken) {
      return NextResponse.json({
        hasShare: false,
        shareUrl: null,
        createdAt: null,
      });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://qrtags.com';
    return NextResponse.json({
      hasShare: true,
      shareUrl: `${appUrl}/share/${baggage.shareToken}`,
      createdAt: baggage.shareTokenCreatedAt?.toISOString() || null,
    });
  } catch (error) {
    console.error('[share GET] Error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
