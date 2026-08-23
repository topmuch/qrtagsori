import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/shop/products — Liste des produits actifs (pour section boutique)
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error('[shop] Error fetching products:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
