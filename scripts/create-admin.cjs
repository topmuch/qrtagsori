/**
 * QRBag Labs — Admin user creation script (CommonJS for Docker CMD)
 *
 * Creates a superadmin user if none exists. Safe to run multiple times
 * (uses upsert). Called by the Dockerfile CMD on container startup.
 *
 * Usage: node scripts/create-admin.cjs
 * Env:   DATABASE_URL=file:/app/data/qrbag.db
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

async function main() {
  console.log('🔐 Checking admin users...');

  // Check if any superadmin exists
  const existingAdmin = await prisma.user.findFirst({
    where: { role: 'superadmin' },
  });

  if (existingAdmin) {
    console.log('✅ Superadmin already exists:', existingAdmin.email);
    return;
  }

  // Create default superadmin
  const hashedPassword = await hashPassword('admin123');
  await prisma.user.upsert({
    where: { email: 'admin@qrbag.com' },
    update: {
      password: hashedPassword,
      role: 'superadmin',
    },
    create: {
      email: 'admin@qrbag.com',
      name: 'SuperAdmin',
      password: hashedPassword,
      role: 'superadmin',
    },
  });

  console.log('✅ Superadmin created: admin@qrbag.com / admin123');
  console.log('⚠️  Change this password immediately after first login!');
}

main()
  .catch((e) => {
    console.error('❌ Error creating admin:', e.message);
    // Non-blocking: don't exit with error code so container still starts
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
