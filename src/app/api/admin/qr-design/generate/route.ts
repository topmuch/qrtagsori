import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

/**
 * POST /api/admin/qr-design/generate
 * 
 * Generate QR code references in the database (same as the legacy generate,
 * but designed to work with the design export flow).
 * 
 * Body: { agencyId?: string, quantity: number (1-100) }
 * Returns: { success, generated, references[] }
 */

const schema = z.object({
  agencyId: z.string().optional(),
  quantity: z.number().int().min(1).max(100),
});

function generateRandomCode(length = 6): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function generateUniqueReference(): Promise<string> {
  const year = new Date().getFullYear().toString().slice(-2);
  for (let i = 0; i < 100; i++) {
    const ref = `QRT${year}-${generateRandomCode(6)}`;
    const existing = await db.baggage.findUnique({
      where: { reference: ref },
      select: { id: true },
    });
    if (!existing) return ref;
  }
  return `QRT${year}-${Date.now()}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agencyId, quantity } = schema.parse(body);

    // Generate unique references
    const references: string[] = [];
    for (let i = 0; i < quantity; i++) {
      references.push(await generateUniqueReference());
    }

    // Create baggage records
    await db.baggage.createMany({
      data: references.map((reference) => ({
        reference,
        type: 'voyageur',
        agencyId: agencyId && agencyId.trim() !== '' ? agencyId : null,
        status: agencyId ? 'assigned_to_agency' : 'in_stock',
      })),
    });

    revalidatePath('/admin/generer');
    revalidatePath('/admin/etiquettes');
    revalidatePath('/admin/qrcodes');

    return NextResponse.json({
      success: true,
      generated: references.length,
      references,
    });
  } catch (error) {
    console.error('[QR-DESIGN GENERATE] Error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Erreur de validation', details: error.issues },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: 'Erreur lors de la génération.' },
      { status: 500 },
    );
  }
}
