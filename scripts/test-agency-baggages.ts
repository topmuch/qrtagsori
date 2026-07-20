// Test script — check if /api/agency/baggages works without crashing
// Run with: npx tsx scripts/test-agency-baggages.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Testing agency baggages query...');

  // First, find any agency
  const agency = await prisma.agency.findFirst();
  if (!agency) {
    console.log('❌ No agency found in DB. Create one first.');
    return;
  }
  console.log(`✅ Found agency: ${agency.name} (${agency.id})`);

  // Run the exact same query as /api/agency/baggages
  try {
    const baggages = await prisma.baggage.findMany({
      where: { agencyId: agency.id },
      orderBy: { createdAt: 'desc' },
      include: {
        agency: {
          select: { id: true, name: true, agencyType: true },
        },
      },
    });
    console.log(`✅ Query succeeded. Found ${baggages.length} baggages.`);
    if (baggages.length > 0) {
      console.log('First baggage:', JSON.stringify(baggages[0], null, 2));
    }
  } catch (err) {
    console.error('❌ Query FAILED:', err);
  }
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
