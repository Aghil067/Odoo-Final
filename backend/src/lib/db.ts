import { PrismaClient, Prisma } from '@prisma/client';

export const db = new PrismaClient();
export type Transaction = Prisma.TransactionClient;

// Serializable transactions also protect permission/archive checks from concurrent writes.
// Serialization failures surface as 409; clients must re-read before deliberately retrying.
export function atomic<T>(work: (tx: Transaction) => Promise<T>): Promise<T> {
  return db.$transaction(work, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}
