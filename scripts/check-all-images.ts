// Quick DB inspection: shop products + their image values
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    select: { id: true, name: true, slug: true, image: true, active: true, sortOrder: true },
  });
  console.log(`Found ${products.length} products:`);
  for (const p of products) {
    console.log(`  - [${p.active ? 'active' : 'inactive'}] ${p.name} (slug=${p.slug})  →  image=${JSON.stringify(p.image)}`);
  }

  const posts = await prisma.blogPost.findMany({
    select: { id: true, title: true, slug: true, coverImage: true, status: true },
  });
  console.log(`\nFound ${posts.length} blog posts:`);
  for (const p of posts) {
    console.log(`  - [${p.status}] ${p.title}  →  coverImage=${JSON.stringify(p.coverImage)}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
