import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * QRTags — API de gestion du statut d'un tag
 *
 * Workflow QRTags :
 *   in_stock → assigned_to_agency → sold → activated → scanned → lost → found → blocked
 *
 * Cette route gère aussi :
 *   - L'enregistrement d'une vente (création TagSale + statut 'sold')
 *   - L'activation (statut 'activated' + custom_data JSON + activatedAt)
 *   - Les changements de statut classiques (scanned/lost/found/blocked)
 *
 * Méthodes :
 *   PATCH /api/baggage/[reference]/status  { status, ... }
 *   POST   /api/baggage/[reference]/status  { status, ... }   (alias pour compat frontend)
 */

// ─── Statuts valides QRTags + rétrocompatibilité ───────────────────
const VALID_STATUSES = [
  // QRTags
  'in_stock',
  'assigned_to_agency',
  'sold',
  'activated',
  'scanned',
  'lost',
  'found',
  'blocked',
  // Rétrocompat QRBags (mappés automatiquement)
  'pending_activation', // → in_stock
  'active',             // → activated
];

function normalizeStatus(s: string): string {
  if (s === 'pending_activation') return 'in_stock';
  if (s === 'active') return 'activated';
  return s;
}

async function updateTagStatus(
  request: NextRequest,
  { params }: { params: Promise<{ reference: string }> },
) {
  try {
    const { reference } = await params;
    const body = await request.json();
    const {
      status: rawStatus,
      buyerName,
      buyerPhone,
      salePrice,
      invoiceRef,
      customData,
      agencyType,
      // Champs propriétaire (si activation)
      travelerFirstName,
      travelerLastName,
      whatsappOwner,
    } = body;

    if (!rawStatus) {
      return NextResponse.json(
        { error: 'Le statut est requis' },
        { status: 400 },
      );
    }

    if (!VALID_STATUSES.includes(rawStatus)) {
      return NextResponse.json(
        { error: `Statut invalide: ${rawStatus}` },
        { status: 400 },
      );
    }

    const status = normalizeStatus(rawStatus);

    // ─── Récupérer le tag existant ──────────────────────────────
    const tag = await db.baggage.findUnique({
      where: { reference },
      include: { agency: true, lot: true },
    });

    if (!tag) {
      return NextResponse.json(
        { error: 'Tag introuvable' },
        { status: 404 },
      );
    }

    // ─── Préparer les données à mettre à jour ──────────────────
    const updateData: Record<string, unknown> = { status };

    // ─── Cas 1 : Marquer comme vendu (étape 2 du workflow) ────
    if (status === 'sold') {
      updateData.soldAt = new Date();
    }

    // ─── Cas 2 : Activer le tag (étape 3 du workflow) ─────────
    if (status === 'activated') {
      updateData.activatedAt = new Date();
      if (customData !== undefined) {
        // customData doit être sérialisé en JSON string (champ TEXT en SQLite)
        updateData.customData =
          typeof customData === 'string' ? customData : JSON.stringify(customData);
      }
      if (travelerFirstName !== undefined) updateData.travelerFirstName = travelerFirstName;
      if (travelerLastName !== undefined)  updateData.travelerLastName = travelerLastName;
      if (whatsappOwner !== undefined)     updateData.whatsappOwner = whatsappOwner;
    }

    // ─── Cas 3 : Marquer comme perdu/trouvé ───────────────────
    if (status === 'lost')  updateData.declaredLostAt = new Date();
    if (status === 'found') updateData.foundAt = new Date();

    // ─── Cas 4 : Assigné à l'agence ───────────────────────────
    if (status === 'assigned_to_agency') {
      updateData.assignedToAgencyAt = new Date();
    }

    // ─── Mettre à jour le tag ─────────────────────────────────
    const updated = await db.baggage.update({
      where: { reference },
      data: updateData,
      include: { agency: true, lot: true },
    });

    // ─── Si "sold" : créer une entrée TagSale ─────────────────
    if (status === 'sold' && tag.agencyId) {
      try {
        await db.tagSale.create({
          data: {
            baggageId: tag.id,
            agencyId: tag.agencyId,
            buyerName: buyerName || null,
            buyerPhone: buyerPhone || null,
            salePrice: salePrice != null ? Number(salePrice) : null,
            invoiceRef: invoiceRef || null,
            soldAt: new Date(),
          },
        });
      } catch (e) {
        console.warn('[QRTags/status] TagSale non créé:', e);
        // Non bloquant : le statut du tag a été mis à jour, c'est l'essentiel.
      }
    }

    return NextResponse.json({
      success: true,
      tag: updated,
    });
  } catch (error) {
    console.error('[QRTags/status] Erreur:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du statut' },
      { status: 500 },
    );
  }
}

// ─── Exports : PATCH + POST (alias) ────────────────────────────────
export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ reference: string }> },
) {
  return updateTagStatus(request, ctx);
}

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ reference: string }> },
) {
  return updateTagStatus(request, ctx);
}

// ─── GET : récupérer le statut d'un tag ────────────────────────────
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ reference: string }> },
) {
  try {
    const { reference } = await params;
    const tag = await db.baggage.findUnique({
      where: { reference },
      select: {
        id: true,
        reference: true,
        status: true,
        type: true,
        agencyId: true,
        lotId: true,
        customData: true,
        travelerFirstName: true,
        travelerLastName: true,
        whatsappOwner: true,
        assignedToAgencyAt: true,
        soldAt: true,
        activatedAt: true,
        declaredLostAt: true,
        foundAt: true,
        lastScanDate: true,
        lastLocation: true,
        createdAt: true,
        expiresAt: true,
        agency: {
          select: {
            id: true,
            name: true,
            agencyType: true,
          },
        },
        lot: {
          select: {
            id: true,
            lotNumber: true,
            quantity: true,
            status: true,
          },
        },
      },
    });

    if (!tag) {
      return NextResponse.json(
        { error: 'Tag introuvable' },
        { status: 404 },
      );
    }

    return NextResponse.json({ tag });
  } catch (error) {
    console.error('[QRTags/status GET] Erreur:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du tag' },
      { status: 500 },
    );
  }
}
