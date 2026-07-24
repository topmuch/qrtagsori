// Quick DB inspection: blog posts + their coverImage values
import { PrismaClient } from '@prisma/client';
import path from 'path';

const prisma = new PrismaClient({
  datasources: { db: { url: `file:${path.resolve('/home/z/my-project/db/custom.db')}` } },
});

async function main() {
  const posts = await prisma.blogPost.findMany({
    select: { id: true, title: true, slug: true, coverImage: true, status: true },
  });
  console.log(`Found ${posts.length} blog posts:`);
  for (const p of posts) {
    console.log(`  - [${p.status}] ${p.title}  →  coverImage=${JSON.stringify(p.coverImage)}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
