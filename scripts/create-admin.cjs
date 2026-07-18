/**
 * QRTags — Superadmin creation script (CommonJS for Docker entrypoint)
 *
 * Creates a default superadmin user if none exists. Safe to run multiple
 * times (uses upsert). Called by docker-entrypoint.sh on container startup.
 *
 * Usage: node scripts/create-admin.cjs
 * Env:
 *   DATABASE_URL=file:/app/data/qrtags.db
 *   ADMIN_EMAIL=admin@qrtags.com (default)
 *   ADMIN_PASSWORD=admin123 (default — change in production!)
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

async function main() {
  console.log('🔐 QRTags — Vérification du compte superadmin...');

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@qrtags.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  // Check if any superadmin exists
  const existingAdmin = await prisma.user.findFirst({
    where: { role: 'superadmin' },
  });

  if (existingAdmin) {
    console.log('✅ Superadmin déjà existant:', existingAdmin.email);
    return;
  }

  // Create default superadmin
  const hashedPassword = await hashPassword(adminPassword);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      password: hashedPassword,
      role: 'superadmin',
    },
    create: {
      email: adminEmail,
      name: 'QRTags SuperAdmin',
      password: hashedPassword,
      role: 'superadmin',
    },
  });

  console.log(`✅ Superadmin créé: ${adminEmail}`);
  console.log('⚠️  Changez ce mot de passe immédiatement après la 1ère connexion !');
}

main()
  .catch((e) => {
    console.error('❌ Erreur création admin:', e.message);
    // Non-bloquant : le container démarre quand même
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
