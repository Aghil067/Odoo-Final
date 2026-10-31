import { Prisma } from '@prisma/client';
import { db, type Transaction } from '../../lib/db.js';
import { ApiError, pagination } from '../../lib/http.js';
import type { Principal } from '../auth/auth.js';
import type { Query } from './validation.js';
export type Context = {
    tx: Transaction;
    user: Principal;
    q: Query;
    from: Date;
    to: Date;
    asOf: Date;
};
export const LIMIT = 10000;
export function bounded<T>(rows: T[], limit = LIMIT): T[] {
    if (rows.length > limit)
        throw new ApiError(422, 'ANALYTICS_SCOPE_LIMIT', 'Narrow the date range or project filters; analytics will not silently truncate totals');
    return rows;
}
export function metric(value: unknown, source: string, definition: string, unit = 'count') { return { value, source, definition, unit }; }
export const unavailable = (definition: string) => metric(null, 'UNAVAILABLE', definition);
export function range(c: Context) { return { gte: c.from, lt: c.to }; }
export function paging(q: Query) { return { skip: (q.page - 1) * q.pageSize, take: q.pageSize }; }
export function page<T>(data: T[], total: number, q: Query) { return { data, pagination: pagination(q.page, q.pageSize, total) }; }
export function averageDuration(rows: {
    start: Date | null;
    end: Date | null;
}[]) {
    const eligible = rows.filter((r): r is {
        start: Date;
        end: Date;
    } => !!r.start && !!r.end && r.end >= r.start);
    return { averageSeconds: eligible.length ? eligible.reduce((n, r) => n + (r.end.getTime() - r.start.getTime()) / 1000, 0) / eligible.length : null, sampleCount: eligible.length, excludedCount: rows.length - eligible.length };
}
export function bucket(date: Date, group: Query['groupBy']) {
    const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    if (group === 'month')
        d.setUTCDate(1);
    if (group === 'week')
        d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
    return d.toISOString();
}
export function series(c: Context, rows: Date[]) {
    const map = new Map<string, number>();
    for (const d of rows) {
        if (d >= c.from && d < c.to) {
            const key = bucket(d, c.q.groupBy);
            map.set(key, (map.get(key) ?? 0) + 1);
        }
    }
    const out = [];
    const d = new Date(bucket(c.from, c.q.groupBy));
    while (d < c.to) {
        const key = d.toISOString();
        out.push({ bucket: key, count: map.get(key) ?? 0 });
        if (c.q.groupBy === 'month')
            d.setUTCMonth(d.getUTCMonth() + 1);
        else
            d.setUTCDate(d.getUTCDate() + (c.q.groupBy === 'week' ? 7 : 1));
    }
    return out;
}
export function ratio(numerator: number, denominator: number) { return { numerator, denominator, percentage: denominator ? numerator / denominator * 100 : null }; }
export async function snapshot(user: Principal, input: Partial<Query>, work: (c: Context) => Promise<unknown>) {
    const asOf = new Date(), to = input.to ? new Date(input.to) : asOf, from = input.from ? new Date(input.from) : new Date(to.getTime() - 30 * 86400000);
    if (from >= to || to.getTime() - from.getTime() > 366 * 86400000)
        throw new ApiError(422, 'ANALYTICS_WINDOW', 'Use a positive date interval of at most366days');
    const q = { groupBy: 'month', page: 1, pageSize: 20, days: 30, ...input } as Query;
    return db.$transaction(async (tx) => {
        await tx.$executeRaw `SET TRANSACTION READ ONLY`;
        const data = await work({ tx, user, q, from, to, asOf });
        return { data, meta: { asOf, from, to, timezone: 'UTC', interval: 'FROM_INCLUSIVE_TO_EXCLUSIVE', groupBy: q.groupBy, scope: user.role, snapshot: 'REPEATABLE_READ', filters: q } };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead, maxWait: 5000, timeout: 20000 });
}
