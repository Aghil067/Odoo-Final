import { Router } from 'express';
import { Role, type Prisma } from '@prisma/client';
import { z } from 'zod';
import { rateLimit } from 'express-rate-limit';
import { atomic } from '../../lib/db.js';
import { ApiError, pagination, success } from '../../lib/http.js';
import { actor, authenticate, allowRoles, requireCsrf, publicUser } from './auth.js';
import { hashPassword } from './password.js';

export const usersRouter = Router();
usersRouter.use(authenticate, allowRoles('ADMIN'), requireCsrf);
const select = { ...publicUser, isActive: true, createdAt: true } as const;
const query = z.object({
  page: z.coerce.number().int().min(1).max(100000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().max(120).optional(),
  role: z.enum(Role).optional(),
}).strict();
usersRouter.get('/', async (req, res) => {
  const q = query.parse(req.query);
  const where: Prisma.UserWhereInput = { role: q.role, ...(q.q ? { OR: [
    { name: { contains: q.q, mode: 'insensitive' } },
    { email: { contains: q.q, mode: 'insensitive' } },
  ] } : {}) };
  const result = await atomic(async tx => ({
    data: await tx.user.findMany({ where, select, skip: (q.page - 1) * q.pageSize, take: q.pageSize, orderBy: [{ createdAt: 'desc' }, { id: 'asc' }] }),
    total: await tx.user.count({ where }),
  }));
  return success(res, result.data, 200, { pagination: pagination(q.page, q.pageSize, result.total) });
});
usersRouter.post('/', rateLimit({ windowMs: 15 * 60000, limit: 20 }), async (req, res) => {
  const input = z.object({
    name: z.string().trim().min(1).max(120),
    email: z.email().max(254).transform(v => v.toLowerCase()),
    password: z.string().min(12).max(256),
    role: z.enum(Role),
  }).strict().parse(req.body);
  const passwordHash = await hashPassword(input.password);
  const user = await atomic(async tx => {
    // Recheck the administrator at the write boundary, rather than trusting UI visibility.
    if (!await tx.user.count({ where: { id: actor(req).id, role: 'ADMIN', isActive: true } })) {
      throw new ApiError(403, 'FORBIDDEN', 'Active administrator required');
    }
    return tx.user.create({ data: { name: input.name, email: input.email, role: input.role, passwordHash }, select });
  });
  return success(res, user, 201);
});
