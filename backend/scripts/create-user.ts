import 'dotenv/config';
import { Role } from '@prisma/client';
import { z } from 'zod';
import { db, atomic } from '../src/lib/db.js';
import { hashPassword } from '../src/modules/auth/password.js';

// Trusted database operator only. No public registration or client-selected roles.
async function main() {
  const input = z.object({
    USER_EMAIL: z.email().max(254).transform(value => value.toLowerCase()),
    USER_NAME: z.string().trim().min(1).max(120),
    USER_PASSWORD: z.string().min(12).max(256),
    USER_ROLE: z.enum(Role),
  }).safeParse(process.env);
  if (!input.success) throw new Error('Set valid USER_EMAIL, USER_NAME, USER_ROLE and USER_PASSWORD (12–256 characters)');
  const { USER_EMAIL: email, USER_NAME: name, USER_PASSWORD: password, USER_ROLE: role } = input.data;
  const passwordHash = await hashPassword(password);
  await atomic(async tx => {
    if (!await tx.user.count({ where: { role: 'ADMIN', isActive: true } })) throw new Error('Bootstrap an administrator first');
    await tx.user.create({ data: { email, name, passwordHash, role } });
  });
  console.info('User created. Remove provisioning credentials from your environment.');
}
main().catch(error => {
  console.error(error instanceof Error && !('code' in error) ? error.message : 'User creation failed; check configuration and email uniqueness');
  process.exitCode = 1;
}).finally(() => db.$disconnect());
