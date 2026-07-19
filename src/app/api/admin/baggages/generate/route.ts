import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  generateReference,
  generateReferencesBulk,
  generateSetId,
  calculateExpirationDate,
} from '@/lib/qr';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

/**
 * QRTags — API de génération de lots de QR codes par le Superadmin
 *
 * Étape 1 du workflow QRTags :
 *   Le Superadmin génère un lot de N QR codes.
 *   Optionnellement, il l'assigne immédiatement à une agence.
 *
 * Body :
 *   {
 *     context: 'agency',
 *     agencyId?: string,         // si fourni, le lot est assigné immédiatement
 *     count: number,             // nombre de tags à générer
 *     notes?: string,            // notes libres sur le lot
 *     generatedById?: string,    // ID du superadmin (User)
 *   }
 *
 * Crée :
 *   - 1 entrée TagLot (lot_number, quantity, status, agencyId si fourni)
 *   - N entrées Baggage (status: 'in_stock' ou 'assigned_to_agency')
 */

// ─── Schémas Zod ────────────────────────────────────────────────────
const individualSchema = z.object({
  context: z.literal('individual'),
  // QRTags : accepte 'qrtags' (nouveau) + 'hajj'/'voyageur' (legacy)
  type: z.enum(['hajj', 'voyageur', 'qrtags']).optional(),
  firstName: z.string().min(1, 'Le prénom est requis').max(50),
  lastName: z.string().min(1, 'Le nom est requis').max(50),
  whatsapp: z.string().min(6, 'Le numéro WhatsApp est requis').max(20),
  duration: z.enum(['7d', '1y']),
  baggageCount: z.number().min(1).max(2),
});

const agencySchema = z.object({
  context: z.literal('agency'),
  type: z.enum(['hajj', 'voyageur', 'qrtags']).optional(),
  // QRTags : agencyId peut être vide (stock central) ou un ID valide
  // On accepte explicitement "" et on nettoie côté code
  agencyId: z.union([z.string().min(1), z.literal('')]).optional(),
  count: z.number().min(1).max(3),
  travelerCount: z.number().min(1).max(5000),
  notes: z.string().max(500).optional(),
  generatedById: z.string().optional(),
});

const combinedSchema = z.discriminatedUnion('context', [individualSchema, agencySchema]);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = combinedSchema.parse(body);

    if (validatedData.context === 'individual') {
      // ─── Génération individuelle (propriétaire direct, sans agence) ──
      const references = await generateBaggagesWithTraveler({
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        whatsapp: validatedData.whatsapp,
        duration: validatedData.duration,
        baggageCount: validatedData.baggageCount as 1 | 2,
      });

      return NextResponse.json({
        success: true,
        generated: references.length,
        references,
      });
    }
    // QRTags : forcer le refresh des pages étiquettes/qrcodes
    revalidatePath('/admin/etiquettes');
    revalidatePath('/admin/qrcodes');

    // ─── Génération en lot pour agence (ou stock central) ──────────
    // QRTags : si agencyId est "" ou undefined → stock central (null)
    const rawAgencyId = validatedData.agencyId;
    const agencyId = rawAgencyId && rawAgencyId.trim() !== '' ? rawAgencyId : undefined;

    const result = await generateLotForAgency({
      agencyId,
      travelerCount: validatedData.travelerCount,
      count: validatedData.count as 1 | 2 | 3,
      notes: validatedData.notes,
      generatedById: validatedData.generatedById,
    });

    // QRTags : forcer le refresh des pages étiquettes/qrcodes après génération
    revalidatePath('/admin/etiquettes');
    revalidatePath('/admin/qrcodes');

    return NextResponse.json({
      success: true,
      generated: result.references.length,
      references: result.references,
      lot: result.lot,
    });
  } catch (error) {
    console.error('[QRTags/generate] Erreur:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Erreur de validation', details: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: 'Erreur serveur lors de la génération' },
      { status: 500 },
    );
  }
}

// ═══════════════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════════════

async function generateBaggagesWithTraveler(options: {
  firstName: string;
  lastName: string;
  whatsapp: string;
  duration: '7d' | '1y';
  baggageCount: 1 | 2;
}): Promise<string[]> {
  const { firstName, lastName, whatsapp, duration, baggageCount } = options;

  const setId = generateSetId();
  const expiresAt = calculateExpirationDate('voyageur', duration === '1y' ? 'tag' : 'sticker');

  const references: string[] = [];
  for (let i = 0; i < baggageCount; i++) {
    references.push(await generateReference());
  }

  // QRTags : statut 'activated' directement (génération individuelle = activation)
  await db.baggage.createMany({
    data: references.map((reference, i) => ({
      reference,
      type: 'voyageur',
      setId,
      agencyId: null,
      travelerFirstName: firstName,
      travelerLastName: lastName,
      whatsappOwner: whatsapp,
      baggageIndex: i + 1,
      baggageType: 'soute',
      status: 'activated',
      activatedAt: new Date(),
      expiresAt,
    })),
  });

  return references;
}

async function generateLotForAgency(options: {
  agencyId?: string;
  travelerCount: number;
  count: 1 | 2 | 3;
  notes?: string;
  generatedById?: string;
}): Promise<{ references: string[]; lot: { id: string; lotNumber: string } }> {
  const { travelerCount, count, notes, generatedById } = options;
  const totalBaggages = travelerCount * count;

  // QRTags : vérifier que l'agencyId existe AVANT de créer le TagLot
  // (sinon FK violation). Si l'agence n'existe pas, on crée le lot en stock central.
  let agencyId = options.agencyId;
  if (agencyId) {
    const agency = await db.agency.findUnique({
      where: { id: agencyId },
      select: { id: true, name: true },
    });
    if (!agency) {
      console.warn(
        `[QRTags/generate] AgencyId "${agencyId}" introuvable — création du lot en stock central`,
      );
      agencyId = undefined;
    } else {
      console.log(
        `[QRTags/generate] Lot: ${travelerCount} × ${count} = ${totalBaggages} tags → agency "${agency.name}"`,
      );
    }
  } else {
    console.log(
      `[QRTags/generate] Lot: ${travelerCount} × ${count} = ${totalBaggages} tags → stock central`,
    );
  }

  // ─── 1. Créer le TagLot ──────────────────────────────────────
  const lotNumber = generateSetId();
  const lot = await db.tagLot.create({
    data: {
      lotNumber,
      generatedById: generatedById || null,
      agencyId: agencyId || null,
      quantity: totalBaggages,
      notes: notes || null,
      status: agencyId ? 'assigned' : 'generated',
      assignedAt: agencyId ? new Date() : null,
    },
  });

  // ─── 2. Générer toutes les références en bulk ────────────────
  const allReferences = await generateReferencesBulk(null, totalBaggages);

  // ─── 3. Construire les données Baggage ───────────────────────
  const now = new Date();
  const allData: Array<{
    reference: string;
    type: string;
    setId: string;
    agencyId: string | null;
    lotId: string;
    baggageIndex: number;
    baggageType: string;
    status: string;
    assignedToAgencyAt: Date | null;
  }> = [];

  const setIds: string[] = [];
  for (let t = 0; t < travelerCount; t++) {
    setIds.push(generateSetId());
  }

  let refIndex = 0;
  for (let t = 0; t < travelerCount; t++) {
    const setId = setIds[t];
    for (let i = 0; i < count; i++) {
      allData.push({
        reference: allReferences[refIndex++],
        type: 'voyageur',
        setId,
        agencyId: agencyId || null,
        lotId: lot.id,
        baggageIndex: i + 1,
        baggageType: 'soute',
        // QRTags : 'assigned_to_agency' si agencyId, sinon 'in_stock'
        status: agencyId ? 'assigned_to_agency' : 'in_stock',
        assignedToAgencyAt: agencyId ? now : null,
      });
    }
  }

  // ─── 4. Batch insert par chunks de 200 ───────────────────────
  const BATCH_SIZE = 200;
  for (let i = 0; i < allData.length; i += BATCH_SIZE) {
    const batch = allData.slice(i, i + BATCH_SIZE);
    await db.baggage.createMany({ data: batch });
    console.log(
      `[QRTags/generate] Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} tags` +
      ` (total: ${Math.min(i + BATCH_SIZE, allData.length)}/${allData.length})`,
    );
  }

  console.log(`[QRTags/generate] Lot ${lotNumber} terminé (${totalBaggages} tags)`);
  return { references: allReferences, lot: { id: lot.id, lotNumber: lot.lotNumber } };
}

// ═══════════════════════════════════════════════════════════════════
//  GET — Liste des baggages (admin)
// ═══════════════════════════════════════════════════════════════════
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agencyId = searchParams.get('agencyId');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '500');

    const where: Record<string, unknown> = {};

    if (agencyId) where.agencyId = agencyId;
    if (type)     where.type = type;
    if (status)   where.status = status;

    const baggages = await db.baggage.findMany({
      where,
      include: {
        agency: { select: { id: true, name: true, agencyType: true } },
        lot:    { select: { id: true, lotNumber: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({ baggages });
  } catch (error) {
    console.error('[QRTags/generate GET] Erreur:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 },
    );
  }
}
