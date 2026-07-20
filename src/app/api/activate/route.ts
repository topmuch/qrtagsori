import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

/**
 * QRTags — API d'activation d'un tag
 *
 * Étape 3 du workflow QRTags :
 *   L'utilisateur final scanne son QR code → arrive sur /inscrire → remplit
 *   le formulaire (champs dynamiques selon agency_type de l'agence qui a vendu
 *   le tag) → POST /api/activate.
 *
 * Le tag passe du statut 'sold' (ou 'in_stock' / 'assigned_to_agency' en
 * rétrocompat) au statut 'activated'.
 *
 * Champs acceptés :
 *   - reference (requis) : référence du tag (ex: QRT26-XXXXXX)
 *   - travelerFirstName (requis)
 *   - travelerLastName (requis)
 *   - whatsappOwner (requis) : numéro WhatsApp du propriétaire (cible WAME)
 *   - customData (optionnel) : objet JSON des champs dynamiques par métier
 *   - destination (optionnel)
 *   - departureDate (optionnel)
 *   - departureTime (optionnel)
 */

// ─── Génération du PIN propriétaire (4 chiffres) ───────────────────
function generateOwnerPin(): string {
  return String(crypto.randomInt(0, 10000)).padStart(4, '0');
}

// ─── Schéma Zod (zod v4 : utilise .issues pas .errors) ─────────────
const activateSchema = z.object({
  reference: z.string().min(1, 'Référence requise'),
  travelerFirstName: z.string().min(1, 'Prénom requis'),
  travelerLastName: z.string().min(1, 'Nom requis'),
  whatsappOwner: z.string().min(1, 'Numéro WhatsApp requis'),
  customData: z.record(z.string(), z.unknown()).optional(),
  // Champs libres optionnels (rétrocompat)
  destination: z.string().optional(),
  departureDate: z.string().optional(),
  departureTime: z.string().optional(),
});

// ─── Statuts considérés comme "non encore activés" ─────────────────
const PENDING_STATUSES = new Set([
  'in_stock',
  'assigned_to_agency',
  'sold',
  'pending_activation', // rétrocompat
]);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = activateSchema.parse(body);

    // ─── 1. Trouver le tag ─────────────────────────────────────
    const baggage = await db.baggage.findUnique({
      where: { reference: validatedData.reference },
      include: { agency: true },
    });

    if (!baggage) {
      return NextResponse.json(
        { error: 'Tag introuvable', message: 'Code QR non valide' },
        { status: 404 },
      );
    }

    // ─── 2. Vérifier qu'il n'est pas déjà activé ──────────────
    if (!PENDING_STATUSES.has(baggage.status)) {
      return NextResponse.json(
        {
          error: 'Tag déjà activé',
          message: 'Ce tag a déjà été activé',
          currentStatus: baggage.status,
        },
        { status: 400 },
      );
    }

    // ─── 3. Générer le PIN propriétaire ───────────────────────
    const ownerPinPlain = generateOwnerPin();
    const ownerPinHash = await bcrypt.hash(ownerPinPlain, 10);

    // ─── 4. Calculer l'expiration (1 an par défaut QRTags) ────
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    // ─── 5. Sérialiser customData en JSON string ──────────────
    const customDataJson = validatedData.customData
      ? JSON.stringify(validatedData.customData)
      : null;

    // ─── 6. Mettre à jour le tag ──────────────────────────────
    const updatedBaggage = await db.baggage.update({
      where: { id: baggage.id },
      data: {
        travelerFirstName: validatedData.travelerFirstName,
        travelerLastName: validatedData.travelerLastName,
        whatsappOwner: validatedData.whatsappOwner,
        destination: validatedData.destination || null,
        departureDate: validatedData.departureDate
          ? new Date(validatedData.departureDate + 'T00:00:00')
          : null,
        departureTime: validatedData.departureTime || null,
        // QRTags : custom_data JSON (champs dynamiques par agency_type)
        customData: customDataJson,
        // QRTags : nouveau statut + timestamp
        status: 'activated',
        activatedAt: new Date(),
        expiresAt,
        // PIN propriétaire (hashé bcrypt)
        ownerPin: ownerPinHash,
        ownerPinSetAt: new Date(),
      },
    });

    // ─── 7. Réponse ───────────────────────────────────────────
    return NextResponse.json({
      success: true,
      baggage: {
        id: updatedBaggage.id,
        reference: updatedBaggage.reference,
        type: updatedBaggage.type,
        status: updatedBaggage.status,
        activatedAt: updatedBaggage.activatedAt,
        expiresAt: updatedBaggage.expiresAt,
        // PIN en clair (une seule fois, pour affichage sur /success)
        ownerPin: ownerPinPlain,
      },
    });
  } catch (error) {
    console.error('[QRTags/activate] Erreur:', error);

    if (error instanceof z.ZodError) {
      // zod v4 : error.issues (pas error.issues)
      return NextResponse.json(
        { error: 'Erreur de validation', details: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: 'Erreur serveur lors de l\'activation' },
      { status: 500 },
    );
  }
}
