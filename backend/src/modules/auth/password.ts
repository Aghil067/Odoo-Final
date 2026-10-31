import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

function derive(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }, (error, key) => {
      if (error) reject(error); else resolve(key);
    });
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const key = await derive(password, salt);
  return `scrypt:${salt}:${key.toString('hex')}`;
}

export async function verifyPassword(password: string, stored?: string): Promise<boolean> {
  const [, salt, hash] = (stored ?? `scrypt:${'0'.repeat(32)}:${'0'.repeat(128)}`).split(':');
  const key = await derive(password, salt ?? '0'.repeat(32));
  const expected = Buffer.from(hash ?? '', 'hex');
  return expected.length === key.length && timingSafeEqual(expected, key) && stored !== undefined;
}
