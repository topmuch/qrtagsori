import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/shop/admin/products — List ALL products (including inactive)
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    return NextResponse.json(products);
  } catch (error) {
    console.error('[shop-admin] Error fetching products:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/shop/admin/products — Create a new product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, slug, price, quantity, description, image, sortOrder } = body;

    if (!name || !slug || !price || !quantity) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        price: Number(price),
        quantity: Number(quantity),
        description: description || null,
        image: image || null,
        sortOrder: Number(sortOrder) || 0,
        active: true,
      },
    });

    return NextResponse.json(product);
  } catch (error: unknown) {
    const err = error as Error;
    const msg = err?.message || String(error);
    // Prisma unique constraint violation (P2002) — message contains "Unique" or "UNIQUE"
    if (msg.includes('Unique') || msg.includes('UNIQUE') || msg.includes('P2002')) {
      return NextResponse.json({ error: 'Ce slug existe déjà. Choisissez un autre nom.' }, { status: 409 });
    }
    console.error('[shop-admin] Error creating product:', error);
    // Surface a more useful message to the client while keeping server logs for full stack
    return NextResponse.json(
      { error: `Erreur serveur: ${msg.slice(0, 200)}` },
      { status: 500 },
    );
  }
}

// PUT /api/shop/admin/products — Update a product
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, slug, price, quantity, description, image, sortOrder, active } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(slug && { slug }),
        ...(price !== undefined && { price: Number(price) }),
        ...(quantity !== undefined && { quantity: Number(quantity) }),
        ...(description !== undefined && { description }),
        ...(image !== undefined && { image }),
        ...(sortOrder !== undefined && { sortOrder: Number(sortOrder) }),
        ...(active !== undefined && { active }),
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error('[shop-admin] Error updating product:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE /api/shop/admin/products — Delete a product
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[shop-admin] Error deleting product:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
