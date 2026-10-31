import { createHash } from 'node:crypto';
import { Prisma, type SolarComponent, type StockMovementType } from '@prisma/client';
import { atomic, type Transaction } from '../../lib/db.js';
import { ApiError } from '../../lib/http.js';
import type { Principal } from '../auth/auth.js';
import { Decimal, json } from '../solar/common.js';
export { Decimal, json };
export function operator(user: Principal, adminOnly = false) {
  if (!(adminOnly ? ['ADMIN'] : ['ADMIN','WAREHOUSE']).includes(user.role)) throw new ApiError(403,'INVENTORY_FORBIDDEN','Inventory operator permission required');
}
export function reader(user: Principal) { if (!['ADMIN','WAREHOUSE','FINANCE'].includes(user.role)) throw new ApiError(403,'INVENTORY_FORBIDDEN','Inventory oversight permission required'); }
function canonical(value: unknown): string {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value !== null && typeof value === 'object') return '{' + Object.entries(value).sort(([a],[b]) => a.localeCompare(b)).map(([k,v]) => JSON.stringify(k)+':'+canonical(v)).join(',') + '}';
  return JSON.stringify(value) ?? 'null';
}
export async function inventoryAtomic<T>(work: (tx: Transaction) => Promise<T>) {
  try { return await atomic(work); } catch (e) {
    if ((e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2004') || (e instanceof Prisma.PrismaClientUnknownRequestError && e.message.includes('23514'))) throw new ApiError(409,'INVENTORY_CONSTRAINT','Stock constraints rejected this change; refresh balances, versions and serial states');
    throw e;
  }
}
export function post<T extends {idempotencyKey:string;reference:string;reason:string}>(user: Principal, kind: string, input: T, work: (tx: Transaction, operationId: string) => Promise<unknown>, adminOnly = false) {
  operator(user, adminOnly);
  const requestHash = createHash('sha256').update(canonical({kind,input})).digest('hex');
  return inventoryAtomic(async tx => {
    const existing = await tx.inventoryOperation.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
    if (existing) {
      if (existing.actorId !== user.id || existing.requestHash !== requestHash) throw new ApiError(409,'IDEMPOTENCY_CONFLICT','Idempotency key belongs to a different actor or request');
      return existing.result;
    }
    const op = await tx.inventoryOperation.create({ data: { idempotencyKey: input.idempotencyKey, kind, reference: input.reference, requestHash, reason: input.reason, actorId: user.id, payload: json(input), result: {} } });
    const result = json(await work(tx, op.id));
    await tx.inventoryOperation.update({ where: { id: op.id }, data: { result } });
    return result;
  });
}
export async function warehouse(tx: Transaction, id: string, active = true) {
  const row = await tx.warehouse.findUnique({ where: { id } });
  if (!row) throw new ApiError(404,'NOT_FOUND','Warehouse not found');
  if (active && !row.isActive) throw new ApiError(409,'WAREHOUSE_INACTIVE','Warehouse is inactive');
  return row;
}
export async function component(tx: Transaction, id: string, active = true) {
  const row = await tx.solarComponent.findUnique({ where: { id } });
  if (!row) throw new ApiError(404,'NOT_FOUND','Component not found');
  if (active && !row.isActive) throw new ApiError(409,'COMPONENT_INACTIVE','Component is inactive');
  return row;
}
export function checkQuantity(c: SolarComponent, value: string, allowZero = false) {
  const q = new Decimal(value);
  if (q.lt(0) || (!allowZero && q.eq(0)) || q.gt('999999999999.999')) throw new ApiError(422,'INVALID_QUANTITY','Quantity is outside supported range');
  if ((['PCS','SET','PAIR'].includes(c.unit) || c.serializationRequired) && !q.isInteger()) throw new ApiError(422,'FRACTIONAL_QUANTITY','Counted and serialized equipment requires whole quantities');
  if (c.serializationRequired && c.unit !== 'PCS') throw new ApiError(422,'SERIAL_UNIT_POLICY','Serialized equipment must use PCS');
  return q;
}
export async function balance(tx: Transaction, c: SolarComponent, warehouseId: string) {
  const row = await tx.inventoryBalance.upsert({ where: { componentId_warehouseId: {componentId:c.id,warehouseId} }, create: {componentId:c.id,warehouseId,serializationRequired:c.serializationRequired}, update:{} });
  await tx.$queryRaw`SELECT "id" FROM "InventoryBalance" WHERE "id" = ${row.id}::uuid FOR UPDATE`;
  return tx.inventoryBalance.findUniqueOrThrow({ where:{id:row.id} });
}
export const available = (b: {onHandQuantity:Prisma.Decimal;reservedQuantity:Prisma.Decimal}) => new Decimal(b.onHandQuantity).minus(b.reservedQuantity);
export const publicBalance = <T extends {onHandQuantity:Prisma.Decimal;reservedQuantity:Prisma.Decimal}>(b:T) => ({...b,availableQuantity:available(b).toString()});
const deltas: Record<StockMovementType,[number,number,number]> = {
  OPENING_BALANCE:[1,0,0],RECEIPT:[1,0,0],ADJUSTMENT_IN:[1,0,0],ADJUSTMENT_OUT:[-1,0,0],RESERVATION:[0,1,0],RESERVATION_RELEASE:[0,-1,0],DISPATCH:[-1,-1,0],RETURN:[0,0,1],TRANSFER_IN:[1,0,0],TRANSFER_OUT:[-1,0,0],INSPECTION_RELEASE:[1,0,-1],QUARANTINE_DISPOSAL:[0,0,-1],
};
export async function move(tx: Transaction, operationId:string, c:SolarComponent, warehouseId:string, type:StockMovementType, quantity:string, links:{reservationLineId?:string;dispatchLineId?:string}={}) {
  checkQuantity(c,quantity);
  const before = await balance(tx,c,warehouseId), q = new Decimal(quantity), d = deltas[type];
  const after = {onHand:new Decimal(before.onHandQuantity).plus(q.mul(d[0])),reserved:new Decimal(before.reservedQuantity).plus(q.mul(d[1])),quarantined:new Decimal(before.quarantinedQuantity).plus(q.mul(d[2]))};
  if (after.onHand.lt(0) || after.reserved.lt(0) || after.reserved.gt(after.onHand) || after.quarantined.lt(0)) throw new ApiError(409,'INSUFFICIENT_STOCK','Available, reserved or quarantined stock is insufficient');
  if ([after.onHand,after.reserved,after.quarantined].some(value=>value.gt('999999999999999.999'))) throw new ApiError(422,'QUANTITY_OVERFLOW','Accumulated stock exceeds supported Decimal precision');
  return tx.stockMovement.create({data:{operationId,balanceId:before.id,type,quantity,...links,onHandBefore:before.onHandQuantity,onHandAfter:after.onHand,reservedBefore:before.reservedQuantity,reservedAfter:after.reserved,quarantinedBefore:before.quarantinedQuantity,quarantinedAfter:after.quarantined}});
}
