import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { db } from '@/lib/db';

// ─── LABS — Feature D: Signalement de dommage ───
//
// POST /api/baggage/[reference]/damage
//   Body: {
//     pin: "1234",
//     type: "before" | "after",
//     description: "État du bagage avant le voyage",
//     photos: ["data:image/jpeg;base64,...", ...]  // max 3 photos, base64
//   }
//
// Les photos sont :
//  1. Décodées depuis base64
//  2. Compressées avec sharp (resize 800x800 max, JPEG quality 80)
//  3. Sauvegardées dans /public/uploads/damage/
//  4. Le chemin est stocké en DB (JSON array)
//
// GET /api/baggage/[reference]/damage
//   Renvoie tous les rapports de dommage (avant + après) pour ce bagage.

const damageSchema = z.object({
  pin: z.string().min(4).max(8),
  type: z.enum(['before', 'after']),
  description: z.string().max(1000).optional(),
  photos: z.array(z.string()).min(1).max(3), // 1-3 photos en base64
});

const MAX_PHOTO_SIZE = 10 * 1024 * 1024; // 10 MB per photo (before compression)
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'damage');

async function savePhoto(base64Data: string): Promise<string> {
  // Extraire le type MIME et les données base64
  const matches = base64Data.match(/^data:(image\/(jpeg|jpg|png|webp));base64,(.+)$/);
  if (!matches) {
    throw new Error('Format d\'image invalide (JPEG, PNG, WebP acceptés)');
  }

  const buffer = Buffer.from(matches[3], 'base64');
  if (buffer.length > MAX_PHOTO_SIZE) {
    throw new Error('Photo trop volumineuse (max 10 MB avant compression)');
  }

  // Générer un nom de fichier unique
  const filename = `${crypto.randomUUID()}.jpg`;
  const filepath = path.join(UPLOAD_DIR, filename);

  // S'assurer que le dossier existe
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }

  // Compresser avec sharp : resize 800x800 max + JPEG quality 80
  await sharp(buffer)
    .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toFile(filepath);

  // Retourner le chemin public
  return `/uploads/damage/${filename}`;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await params;
    const body = await request.json();
    const validated = damageSchema.parse(body);

    // Récupérer le baggage
    const baggage = await db.baggage.findUnique({
      where: { reference },
      select: {
        id: true,
        ownerPin: true,
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
    if (!baggage.ownerPin) {
      return NextResponse.json(
        { error: 'Aucun PIN défini pour ce bagage' },
        { status: 400 }
      );
    }

    const pinValid = await bcrypt.compare(validated.pin, baggage.ownerPin);
    if (!pinValid) {
      return NextResponse.json(
        { error: 'PIN incorrect' },
        { status: 401 }
      );
    }

    // Vérifier s'il existe déjà un rapport de ce type
    const existing = await db.damageReport.findFirst({
      where: { baggageId: baggage.id, type: validated.type },
    });

    // Sauvegarder les photos
    const photoPaths: string[] = [];
    for (const photoBase64 of validated.photos) {
      try {
        const photoPath = await savePhoto(photoBase64);
        photoPaths.push(photoPath);
      } catch (err) {
        return NextResponse.json(
          { error: err instanceof Error ? err.message : 'Erreur lors de la sauvegarde des photos' },
          { status: 400 }
        );
      }
    }

    // Si un rapport existe déjà pour ce type, on le met à jour
    // (sinon on en crée un nouveau)
    let report;
    if (existing) {
      // Supprimer les anciennes photos
      try {
        const oldPhotos = JSON.parse(existing.photos) as string[];
        for (const oldPath of oldPhotos) {
          const fullOldPath = path.join(process.cwd(), 'public', oldPath);
          if (fs.existsSync(fullOldPath)) {
            fs.unlinkSync(fullOldPath);
          }
        }
      } catch {
        // Non-critique
      }

      report = await db.damageReport.update({
        where: { id: existing.id },
        data: {
          photos: JSON.stringify(photoPaths),
          description: validated.description || null,
        },
      });
    } else {
      report = await db.damageReport.create({
        data: {
          baggageId: baggage.id,
          type: validated.type,
          photos: JSON.stringify(photoPaths),
          description: validated.description || null,
        },
      });
    }

    return NextResponse.json({
      success: true,
      report: {
        id: report.id,
        type: report.type,
        photos: photoPaths,
        description: report.description,
        createdAt: report.createdAt.toISOString(),
      },
      message: existing
        ? `Rapport ${validated.type === 'before' ? 'pre-contrôle' : 'post-contrôle'} mis à jour.`
        : `Rapport ${validated.type === 'before' ? 'pre-contrôle' : 'post-contrôle'} créé avec ${photoPaths.length} photo(s).`,
    });
  } catch (error) {
    console.error('[damage POST] Error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// GET — liste tous les rapports de dommage pour ce bagage
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await params;
    const baggage = await db.baggage.findUnique({
      where: { reference },
      select: { id: true },
    });

    if (!baggage) {
      return NextResponse.json(
        { error: 'Bagage introuvable' },
        { status: 404 }
      );
    }

    const reports = await db.damageReport.findMany({
      where: { baggageId: baggage.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      reports: reports.map((r) => ({
        id: r.id,
        type: r.type,
        photos: JSON.parse(r.photos) as string[],
        description: r.description,
        createdAt: r.createdAt.toISOString(),
      })),
      hasBefore: reports.some((r) => r.type === 'before'),
      hasAfter: reports.some((r) => r.type === 'after'),
    });
  } catch (error) {
    console.error('[damage GET] Error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
