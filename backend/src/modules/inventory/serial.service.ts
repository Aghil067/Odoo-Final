import type { InventorySerialState, InventorySerialUnit, SolarComponent } from '@prisma/client';
import type { Transaction } from '../../lib/db.js';
import { ApiError } from '../../lib/http.js';
import { Decimal } from './common.js';
export async function selectSerials(tx:Transaction,c:SolarComponent,warehouseId:string,quantity:string,ids:string[],state:InventorySerialState,reservationLineId?:string,dispatchLineId?:string) {
  if (!c.serializationRequired) {
    if (ids.length) throw new ApiError(422,'UNEXPECTED_SERIALS','Unserialized components cannot select serial units');
    return [];
  }
  if (!new Decimal(quantity).eq(ids.length) || new Set(ids).size !== ids.length) throw new ApiError(422,'SERIAL_COUNT_MISMATCH','Select exactly one distinct serial per unit');
  const rows = await tx.inventorySerialUnit.findMany({where:{id:{in:ids},componentId:c.id,warehouseId,state,...(reservationLineId?{reservationLineId}:{}),...(dispatchLineId?{dispatchLineId}:{})},orderBy:{id:'asc'}});
  if (rows.length !== ids.length) throw new ApiError(409,'SERIAL_STATE_CONFLICT','Serial units are missing, in another warehouse or in an incompatible state/allocation');
  return rows;
}
export async function transitionSerials(tx:Transaction,rows:InventorySerialUnit[],operationId:string,movementId:string,toState:InventorySerialState,warehouseId:string,links:{reservationLineId:string|null;dispatchLineId:string|null}) {
  for (const row of rows) {
    const updated = await tx.inventorySerialUnit.updateMany({where:{id:row.id,version:row.version,state:row.state,warehouseId:row.warehouseId},data:{state:toState,warehouseId,...links,version:{increment:1}}});
    if (updated.count !== 1) throw new ApiError(409,'SERIAL_STATE_CONFLICT','Serial changed concurrently');
    await tx.inventorySerialEvent.create({data:{serialUnitId:row.id,operationId,movementId,version:row.version+1,fromState:row.state,toState,fromWarehouseId:row.warehouseId,toWarehouseId:warehouseId,...links}});
  }
}
export async function receiveSerials(tx:Transaction,c:SolarComponent,warehouseId:string,quantity:string,serialNumbers:string[],receivedAt:Date,operationId:string,movementId:string) {
  if (c.serializationRequired ? !new Decimal(quantity).eq(serialNumbers.length) : serialNumbers.length > 0) throw new ApiError(422,'SERIAL_COUNT_MISMATCH','Serialized receipts need one serial per unit; unserialized receipts must omit serials');
  if (new Set(serialNumbers).size !== serialNumbers.length) throw new ApiError(422,'DUPLICATE_SERIAL','Serial numbers must be distinct');
  for (const serialNumber of serialNumbers) {
    const row = await tx.inventorySerialUnit.create({data:{serialNumber,componentId:c.id,warehouseId,receiptOperationId:operationId,receivedAt}});
    await tx.inventorySerialEvent.create({data:{serialUnitId:row.id,operationId,movementId,version:1,toState:'AVAILABLE',toWarehouseId:warehouseId}});
  }
}
