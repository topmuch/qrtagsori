// Reset the admin@qrtags.com password to "Admin12345!" in the current DB.
// Run once after updating SUPERADMIN_HASH in migrate.ts so the user can log
// in immediately without waiting for the lazy migrate to fire.
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@qrtags.com';
  const password = 'Admin12345!';
  const hash = bcrypt.hashSync(password, 10);

  // Update password + ensure role is superadmin
  const result = await prisma.user.updateMany({
    where: { email },
    data: { password: hash, role: 'superadmin' },
  });

  console.log(`Updated ${result.count} user(s) with email ${email}`);
  console.log(`New password: ${password}`);
  console.log(`New hash:     ${hash}`);

  // Verify
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    const ok = bcrypt.compareSync(password, user.password || '');
    console.log(`Verify: email=${user.email} role=${user.role} passwordMatch=${ok}`);
  } else {
    console.log('⚠️  User not found after update — was the email correct?');
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
