import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ═══════════════════════════════════════════════════════
//  STATUS NORMALIZATION
// ═══════════════════════════════════════════════════════
// La DB peut contenir des statuts en français (EN_ATTENTE, ACTIF)
// ou en anglais (pending_activation, active).
// Cette normalisation garantit que le frontend reçoit TOUJOURS
// les statuts en anglais, quel que soit le format en DB.

const STATUS_ALIASES: Record<string, string> = {
  // Français → English
  EN_ATTENTE: 'pending_activation',
  ACTIF: 'active',
  SCANNÉ: 'scanned',
  PERDU: 'lost',
  TROUVÉ: 'found',
  BLOQUÉ: 'blocked',
  // Minuscules
  en_attente: 'pending_activation',
  actif: 'active',
  scanné: 'scanned',
  perdu: 'lost',
  trouvé: 'found',
  bloqué: 'blocked',
};

/** Normalise un statut vers le format anglais standard */
function normalizeStatus(status: string | null | undefined): string {
  if (!status) return 'pending_activation';
  return STATUS_ALIASES[status] || status;
}

/** Vérifie si un statut correspond à "en attente" (tous formats) */
function isPending(status: string): boolean {
  const normalized = normalizeStatus(status);
  return normalized === 'pending_activation';
}

/** Vérifie si un statut correspond à "actif" (tous formats) */
function isActive(status: string): boolean {
  const normalized = normalizeStatus(status);
  return normalized === 'active';
}

// GET - List all baggages for an agency
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agencyId = searchParams.get('agencyId');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    if (!agencyId) {
      return NextResponse.json(
        { error: 'Agency ID is required' },
        { status: 400 }
      );
    }

    // Build where clause — NO status filter by default (show ALL baggages)
    const where: Record<string, unknown> = { agencyId };

    // If a specific status filter is requested, match BOTH French and English variants
    if (status && status !== 'all') {
      const aliases = Object.entries(STATUS_ALIASES)
        .filter(([, eng]) => eng === status)
        .map(([fr]) => fr);
      where.status = { in: [status, ...aliases] };
    }

    if (search) {
      where.OR = [
        { reference: { contains: search } },
        { travelerFirstName: { contains: search } },
        { travelerLastName: { contains: search } },
      ];
    }

    const baggages = await db.baggage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // Normalize statuses in response (frontend always gets English format)
    const normalizedBaggages = baggages.map(b => ({
      ...b,
      status: normalizeStatus(b.status),
    }));

    // Calculate stats — count BOTH French and English status variants
    const stats = {
      total: normalizedBaggages.length,
      pending: normalizedBaggages.filter(b => isPending(b.status)).length,
      active: normalizedBaggages.filter(b => isActive(b.status)).length,
      scanned: baggages.filter(b => b.status === 'scanned' || b.status === 'SCANNÉ').length,
      lost: baggages.filter(b => b.status === 'lost' || b.status === 'PERDU').length,
      found: baggages.filter(b => b.status === 'found' || b.status === 'TROUVÉ').length,
    };

    return NextResponse.json({
      baggages: normalizedBaggages,
      stats
    });

  } catch (error) {
    console.error('Get baggages error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
