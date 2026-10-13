import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── Utilitaire : extraire l'e-mail du customData (jamais renvoyé par les routes publiques) ───
function extractEmail(customData: string | null): string | null {
  if (!customData) return null;
  try {
    const parsed = JSON.parse(customData) as { email?: unknown };
    return typeof parsed.email === 'string' ? parsed.email : null;
  } catch {
    return null;
  }
}

// ─── Utilitaire : fusionner l'e-mail dans customData ───
function mergeEmailIntoCustomData(customData: string | null, email: string): string {
  let current: Record<string, unknown> = {};
  if (customData) {
    try {
      current = JSON.parse(customData) as Record<string, unknown>;
    } catch {
      current = {};
    }
  }
  const trimmed = email.trim();
  if (trimmed) {
    current.email = trimmed;
  } else {
    delete current.email;
  }
  return JSON.stringify(current);
}

// ═══════════════════════════════════════════════════════
//  GET — charge le bagage pour la page d'édition /suivi/[reference]/edit
//  (réservé à l'édition : inclut l'e-mail du propriétaire)
// ═══════════════════════════════════════════════════════
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await params;
    const baggage = await db.baggage.findUnique({ where: { reference } });
    if (!baggage) {
      return NextResponse.json({ error: 'Tag introuvable' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      baggage: { ...baggage, email: extractEmail(baggage.customData) },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// ─── Champs modifiables partagés PUT / POST ───
async function applyUpdate(
  reference: string,
  body: Record<string, unknown>
): Promise<{ ok: boolean; status?: number; payload?: Record<string, unknown> }> {
  const travelerFirstName = body.travelerFirstName;
  const travelerLastName = body.travelerLastName;
  const whatsappOwner = body.whatsappOwner;
  const email = body.email;

  const baggage = await db.baggage.findUnique({ where: { reference } });
  if (!baggage) {
    return { ok: false, status: 404, payload: { error: 'Tag introuvable' } };
  }

  const updateData: Record<string, unknown> = {};
  if (travelerFirstName !== undefined) updateData.travelerFirstName = travelerFirstName;
  if (travelerLastName !== undefined) updateData.travelerLastName = travelerLastName;
  if (whatsappOwner !== undefined) updateData.whatsappOwner = whatsappOwner;

  if (email !== undefined) {
    const trimmed = typeof email === 'string' ? email.trim() : '';
    if (trimmed && !EMAIL_RE.test(trimmed)) {
      return { ok: false, status: 400, payload: { error: 'Adresse email invalide' } };
    }
    updateData.customData = mergeEmailIntoCustomData(baggage.customData, trimmed);
  }

  // Rien à mettre à jour (ex. test de PIN) → succès sans écriture
  if (Object.keys(updateData).length === 0) {
    return { ok: true, payload: { success: true, message: 'Aucun champ à mettre à jour', baggage } };
  }

  const updated = await db.baggage.update({
    where: { reference },
    data: updateData,
  });

  return {
    ok: true,
    payload: { success: true, message: 'Profil mis à jour avec succès.', baggage: updated },
  };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await params;
    const body = (await request.json()) as Record<string, unknown>;
    const result = await applyUpdate(reference, body);
    if (!result.ok) {
      return NextResponse.json(result.payload, { status: result.status });
    }
    return NextResponse.json(result.payload);
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await params;
    const body = (await request.json()) as Record<string, unknown>;
    const result = await applyUpdate(reference, body);
    if (!result.ok) {
      return NextResponse.json(result.payload, { status: result.status });
    }
    return NextResponse.json(result.payload);
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
