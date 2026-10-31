import 'dotenv/config';
import { z } from 'zod';
import { db, atomic } from '../src/lib/db.js';
import { hashPassword } from '../src/modules/auth/password.js';

async function main() {
  const input = z.object({
    BOOTSTRAP_ADMIN_EMAIL: z.email().max(254).transform(value => value.toLowerCase()),
    BOOTSTRAP_ADMIN_NAME: z.string().trim().min(1).max(120),
    BOOTSTRAP_ADMIN_PASSWORD: z.string().min(12).max(256),
  }).safeParse(process.env);
  if (!input.success) throw new Error('Set valid BOOTSTRAP_ADMIN_EMAIL, BOOTSTRAP_ADMIN_NAME and BOOTSTRAP_ADMIN_PASSWORD (12–256 characters)');
  const { BOOTSTRAP_ADMIN_EMAIL: email, BOOTSTRAP_ADMIN_NAME: name, BOOTSTRAP_ADMIN_PASSWORD: password } = input.data;
  const passwordHash = await hashPassword(password);
  await atomic(async tx => {
    if (await tx.user.count({ where: { role: 'ADMIN' } })) throw new Error('Bootstrap refused: an administrator already exists');
    await tx.user.create({ data: { email, name, passwordHash, role: 'ADMIN' } });
  });
  console.info('Initial administrator created. Remove bootstrap credentials from your environment.');
}
main().catch(error => {
  console.error(error instanceof Error && !('code' in error) ? error.message : 'Bootstrap failed; check configuration, existing email or concurrent bootstrap');
  process.exitCode = 1;
}).finally(() => db.$disconnect());
