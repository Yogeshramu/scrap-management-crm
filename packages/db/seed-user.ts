import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const users = [
  { username: 'admin',   password: 'Admin@1234',   name: 'System Admin',   role: 'ADMIN'   },
  { username: 'manager', password: 'Manager@1234', name: 'Operations Manager', role: 'ADMIN' },
  { username: 'staff',   password: 'Staff@1234',   name: 'Staff User',     role: 'STAFF'   },
];

async function main() {
  for (const u of users) {
    const passwordHash = await bcrypt.hash(u.password, 12);
    await prisma.user.upsert({
      where: { username: u.username },
      update: { passwordHash, name: u.name, role: u.role },
      create: { username: u.username, passwordHash, name: u.name, role: u.role as any },
    });
    console.log(`✓ Upserted user: ${u.username} (${u.role}) — password: ${u.password}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
