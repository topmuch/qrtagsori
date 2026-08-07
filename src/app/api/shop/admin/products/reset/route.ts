import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRoleApi } from '@/lib/auth-middleware';

// ─────────────────────────────────────────────────────────────────────
// POST /api/shop/admin/products/reset
// Destructive: deletes ALL existing Product rows that have no orders,
// archives those that do (active=false + renamed + slug suffixed),
// then upserts the 4 clean packs (3, 5, 10, 15 stickers) with the
// generated sachet images.
//
// Result: boutique always shows the 4 expected sachets, while past
// orders keep their product reference intact for history.
// ─────────────────────────────────────────────────────────────────────

// Default clean packs (kept in sync with prisma/seed-shop.ts)
const CLEAN_PACKS = [
  {
    name: 'Pack 3 Stickers',
    slug: 'pack-3-stickers',
    price: 1500,
    quantity: 3,
    description: '3 étiquettes QR indestructibles. Idéal pour tester.',
    sortOrder: 1,
    image: '/images/shop/pack-3-stickers.png',
  },
  {
    name: 'Pack 5 Stickers',
    slug: 'pack-5-stickers',
    price: 3000,
    quantity: 5,
    description: '5 étiquettes QR indestructibles. Le plus populaire.',
    sortOrder: 2,
    image: '/images/shop/pack-5-stickers.png',
  },
  {
    name: 'Pack 10 Stickers',
    slug: 'pack-10-stickers',
    price: 4000,
    quantity: 10,
    description: '10 étiquettes QR indestructibles. Pour usage fréquent.',
    sortOrder: 3,
    image: '/images/shop/pack-10-stickers.png',
  },
  {
    name: 'Pack 15 Stickers',
    slug: 'pack-15-stickers',
    price: 5500,
    quantity: 15,
    description: '15 étiquettes QR indestructibles. Le plus économique.',
    sortOrder: 4,
    image: '/images/shop/pack-15-stickers.png',
  },
] as const;

export async function POST() {
  try {
    // Require superadmin
    await requireRoleApi('superadmin');
  } catch {
    return NextResponse.json(
      { error: 'Non autorisé. Réservé au superadministrateur.' },
      { status: 401 }
    );
  }

  try {
    // ─── Snapshot before reset ───
    const totalProducts = await prisma.product.count();
    const totalOrders = await prisma.order.count();

    // ─── Find products referenced by orders (cannot be deleted) ───
    const productsWithOrders = await prisma.product.findMany({
      where: { orders: { some: {} } },
      select: { id: true, name: true, slug: true },
    });
    const protectedIds = new Set(productsWithOrders.map(p => p.id));

    // ─── Delete products WITHOUT orders ───
    const deleted = await prisma.product.deleteMany({
      where: { id: { notIn: Array.from(protectedIds) } },
    });

    // ─── Archive (deactivate) products WITH orders ───
    // We rename them with a "[archivé]" prefix and suffix their slug so
    // they don't collide with the clean packs we're about to upsert.
    let archivedCount = 0;
    for (const p of productsWithOrders) {
      const collides = CLEAN_PACKS.some(c => c.slug === p.slug);
      const newSlug = collides ? `${p.slug}-archived-${p.id.slice(-6)}` : p.slug;
      const newName = p.name.toLowerCase().includes('archiv')
        ? p.name
        : `${p.name} [archivé]`;

      await prisma.product.update({
        where: { id: p.id },
        data: {
          active: false,
          slug: newSlug,
          name: newName,
          sortOrder: 999,
        },
      });
      archivedCount++;
    }

    // ─── Upsert the 4 clean packs ───
    const upserted: { name: string; slug: string; price: number; quantity: number }[] = [];
    for (const pack of CLEAN_PACKS) {
      const result = await prisma.product.upsert({
        where: { slug: pack.slug },
        update: {
          name: pack.name,
          price: pack.price,
          quantity: pack.quantity,
          description: pack.description,
          image: pack.image,
          sortOrder: pack.sortOrder,
          active: true,
        },
        create: {
          name: pack.name,
          slug: pack.slug,
          price: pack.price,
          quantity: pack.quantity,
          description: pack.description,
          image: pack.image,
          sortOrder: pack.sortOrder,
          active: true,
        },
      });
      upserted.push({
        name: result.name,
        slug: result.slug,
        price: result.price,
        quantity: result.quantity,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Boutique réinitialisée : ${deleted.count} produit(s) supprimé(s), ${archivedCount} archivé(s), ${upserted.length} pack(s) propre(s) recréé(s).`,
      stats: {
        before: { products: totalProducts, orders: totalOrders },
        deleted: deleted.count,
        archived: archivedCount,
        upserted: upserted.length,
        packs: upserted,
      },
    });
  } catch (error) {
    console.error('[shop-admin] Reset failed:', error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Erreur lors de la réinitialisation: ${msg.slice(0, 200)}` },
      { status: 500 }
    );
  }
}
