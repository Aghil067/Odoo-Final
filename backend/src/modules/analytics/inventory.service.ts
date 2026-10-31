import { Prisma } from '@prisma/client';
import { requireDepartment } from './access.service.js';
import { type Context, metric, page, paging } from './common.js';
export async function inventory(c: Context, mode: 'summary' | 'warehouses' | 'low-stock' | 'movements') {
    requireDepartment(c, 'inventory');
    const wh = c.q.warehouseId ? Prisma.sql `AND b."warehouseId"=${c.q.warehouseId}::uuid` : Prisma.empty;
    if (mode === 'movements') {
        const type = c.q.status ? Prisma.sql `AND m."type"=${c.q.status}::"StockMovementType"` : Prisma.empty;
        const data = await c.tx.$queryRaw `SELECT date_trunc(${c.q.groupBy},m."createdAt" AT TIME ZONE 'UTC') AT TIME ZONE 'UTC' AS "bucket",m."type",b."warehouseId",c."unit",count(*)::int AS "movementCount",sum(m."onHandAfter"-m."onHandBefore") AS "onHandDelta",sum(m."reservedAfter"-m."reservedBefore") AS "reservedDelta",sum(m."quarantinedAfter"-m."quarantinedBefore") AS "quarantinedDelta" FROM "StockMovement" m JOIN "InventoryBalance" b ON b."id"=m."balanceId" JOIN "SolarComponent" c ON c."id"=b."componentId" WHERE m."createdAt">=${c.from} AND m."createdAt"<${c.to} ${wh} ${type} GROUP BY 1,m."type",b."warehouseId",c."unit" ORDER BY 1,m."type",b."warehouseId",c."unit" LIMIT ${c.q.pageSize} OFFSET ${(c.q.page - 1) * c.q.pageSize}`;
        const totals = await c.tx.$queryRaw<{
            count: bigint;
        }[]> `SELECT count(*) FROM (SELECT 1 FROM "StockMovement" m JOIN "InventoryBalance" b ON b."id"=m."balanceId" JOIN "SolarComponent" c ON c."id"=b."componentId" WHERE m."createdAt">=${c.from} AND m."createdAt"<${c.to} ${wh} ${type} GROUP BY date_trunc(${c.q.groupBy},m."createdAt" AT TIME ZONE 'UTC'),m."type",b."warehouseId",c."unit") grouped`;
        return { ...page(data as unknown[], Number(totals[0]?.count ?? 0), c.q), source: 'StockMovement', definition: 'Signed before/after deltas in interval, grouped UTC bucket/type/warehouse/unit; never combine incompatible units' };
    }
    if (mode === 'low-stock') {
        const filter = Prisma.sql `b."onHandQuantity"-b."reservedQuantity"<=b."reorderLevel" ${wh}`;
        const data = await c.tx.$queryRaw `SELECT b."id",b."componentId",b."warehouseId",b."onHandQuantity",b."reservedQuantity",b."quarantinedQuantity",b."reorderLevel",b."onHandQuantity"-b."reservedQuantity" AS "availableQuantity",b."updatedAt",c."sku",c."unit" FROM "InventoryBalance" b JOIN "SolarComponent" c ON c."id"=b."componentId" WHERE ${filter} ORDER BY b."warehouseId",b."componentId" LIMIT ${c.q.pageSize} OFFSET ${(c.q.page - 1) * c.q.pageSize}`;
        const total = await c.tx.$queryRaw<{
            count: bigint;
        }[]> `SELECT count(*) FROM "InventoryBalance" b WHERE ${filter}`;
        return { ...page(data as unknown[], Number(total[0]?.count ?? 0), c.q), source: 'InventoryBalance', definition: 'Current warehouse/component balances where usable on-hand minus reserved <= reorderLevel; quarantine excluded; not a replenishment order' };
    }
    if (mode === 'warehouses') {
        const where = { warehouseId: c.q.warehouseId };
        const rows = await c.tx.inventoryBalance.findMany({ where, ...paging(c.q), select: { id: true, warehouseId: true, componentId: true, onHandQuantity: true, reservedQuantity: true, quarantinedQuantity: true, reorderLevel: true, component: { select: { unit: true, sku: true } }, warehouse: { select: { code: true, isActive: true } } }, orderBy: [{ warehouseId: 'asc' }, { componentId: 'asc' }] });
        return { ...page(rows.map(r => ({ ...r, availableQuantity: new Prisma.Decimal(r.onHandQuantity).minus(r.reservedQuantity) })), await c.tx.inventoryBalance.count({ where }), c.q), source: 'InventoryBalance', definition: 'Current balances paginated by warehouse/component; quantities retain unit' };
    }
    const byUnit = await c.tx.$queryRaw `SELECT c."unit",sum(b."onHandQuantity") AS "onHandQuantity",sum(b."reservedQuantity") AS "reservedQuantity",sum(b."onHandQuantity"-b."reservedQuantity") AS "availableQuantity",sum(b."quarantinedQuantity") AS "quarantinedQuantity",count(*)::int AS "balanceCount",count(*) FILTER (WHERE b."onHandQuantity"-b."reservedQuantity"<=b."reorderLevel")::int AS "lowStockCount",count(*) FILTER (WHERE b."onHandQuantity"-b."reservedQuantity"<=0)::int AS "outOfStockCount" FROM "InventoryBalance" b JOIN "SolarComponent" c ON c."id"=b."componentId" WHERE true ${wh} GROUP BY c."unit" ORDER BY c."unit"`;
    const shortage = await c.tx.$queryRaw<{
        count: bigint;
    }[]> `SELECT count(*) FROM "InventoryBalance" b WHERE b."onHandQuantity"-b."reservedQuantity"<=b."reorderLevel" ${wh}`;
    return { byUnit, inventoryShortages: metric(Number(shortage[0]?.count ?? 0), 'InventoryBalance', 'Current warehouse/component available quantity <= configured reorderLevel'), reservations: await c.tx.stockReservation.groupBy({ by: ['status'], where: { warehouseId: c.q.warehouseId }, _count: { _all: true }, orderBy: { status: 'asc' } }), postedDispatches: metric(await c.tx.stockDispatch.count({ where: { warehouseId: c.q.warehouseId, status: 'POSTED' } }), 'StockDispatch', 'Current POSTED warehouse releases, not delivery or installation completion'), serializedUnits: await c.tx.inventorySerialUnit.groupBy({ by: ['state'], where: { warehouseId: c.q.warehouseId }, _count: { _all: true }, orderBy: { state: 'asc' } }), source: 'InventoryBalance,StockReservation,StockDispatch,InventorySerialUnit', basis: 'CURRENT_SNAPSHOT_NO_HISTORICAL_BALANCE_RECONSTRUCTION' };
}
