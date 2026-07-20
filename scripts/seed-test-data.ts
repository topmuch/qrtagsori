// Seed test data: 1 agency + 5 baggages (3 activated, 2 pending)
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const agency = await prisma.agency.create({
    data: {
      id: 'test-agency-001',
      name: 'Hôtel Test',
      slug: 'hotel-test',
      agencyType: 'hotel',
    },
  });
  console.log('Created agency:', agency.id);

  for (let i = 1; i <= 5; i++) {
    const isActivated = i <= 3;
    const baggage = await prisma.baggage.create({
      data: {
        reference: `QRT-TEST-${String(i).padStart(4, '0')}`,
        type: 'voyageur',
        agencyId: agency.id,
        status: isActivated ? 'activated' : 'in_stock',
        travelerFirstName: isActivated ? 'Marie' : null,
        travelerLastName: isActivated ? 'Dupont' : null,
        whatsappOwner: isActivated ? '+33612345678' : null,
        baggageIndex: 1,
        baggageType: 'cabine',
        customData: isActivated ? JSON.stringify({ object_name: `Objet ${i}`, category: 'electronics' }) : null,
      },
    });
    console.log(`Created baggage ${i}:`, baggage.reference, baggage.status);
  }
}

main().finally(() => prisma.$disconnect());
