import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed the QRTags Boutique Express — 4 default sticker packs.
 * Run with: npx tsx prisma/seed-shop.ts
 */
async function main() {
  console.log('🛍️ Seeding QRTags Boutique products...');

  // Image paths persisted in DB so they survive future schema changes / new packs.
  // Each image shows the QRTAG sachet with the correct number of QR codes visible
  // (3, 5, 10, 15) — see /public/images/shop/pack-{n}-stickers.png
  const products = [
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
  ];

  for (const product of products) {
    const result = await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        name: product.name,
        price: product.price,
        quantity: product.quantity,
        description: product.description,
        sortOrder: product.sortOrder,
        image: product.image, // <-- persisted in DB
        active: true,
      },
      create: product,
    });
    console.log(`  ✅ ${result.name} — ${result.price} FCFA (${result.quantity} stickers) — image: ${result.image}`);
  }

  console.log('');
  console.log('🛍️ Boutique seed completed!');
  console.log('  4 packs are now available at /shop');
}

main()
  .catch((e) => {
    console.error('❌ Boutique seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
