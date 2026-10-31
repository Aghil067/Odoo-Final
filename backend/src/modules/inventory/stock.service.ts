import { z } from 'zod';
import { ApiError } from '../../lib/http.js';
import type { Principal } from '../auth/auth.js';
import { post,warehouse,component,balance,checkQuantity,move,publicBalance } from './common.js';
import {receiveSerials,selectSerials,transitionSerials} from './serial.service.js';
import * as v from './validation.js';
export function createWarehouse(user:Principal,input:z.infer<typeof v.warehouseCreate>) {
  return post(user,'WAREHOUSE_CREATE',input,async tx => {
    const {idempotencyKey:_key,reference:_ref,reason:_reason,...data}=input;
    return tx.warehouse.create({data});
  },true);
}
export function updateWarehouse(user:Principal,id:string,input:z.infer<typeof v.warehouseUpdate>) {
  return post(user,'WAREHOUSE_UPDATE',{...input,warehouseId:id},async tx => {
    const row=await warehouse(tx,id,false);
    if (row.version!==input.version) throw new ApiError(409,'VERSION_CONFLICT','Warehouse changed; refresh');
    if (input.isActive===false && (await tx.inventoryBalance.count({where:{warehouseId:id,OR:[{onHandQuantity:{gt:0}},{reservedQuantity:{gt:0}},{quarantinedQuantity:{gt:0}}]}}) || await tx.stockReservation.count({where:{warehouseId:id,status:'ACTIVE'}}))) throw new ApiError(409,'WAREHOUSE_OBLIGATIONS','Clear stock, quarantine and active reservations before deactivation');
    const {idempotencyKey:_key,reference:_ref,reason:_reason,version:_version,...data}=input;
    const updated=await tx.warehouse.update({where:{id,version:input.version},data:{...data,version:{increment:1}}});
    return {before:row,warehouse:updated};
  },true);
}
export function receipt(user:Principal,input:z.infer<typeof v.receipt>) {
  return post(user,'RECEIPT',input,async (tx,op) => {
    await warehouse(tx,input.warehouseId); const c=await component(tx,input.componentId); checkQuantity(c,input.quantity);
    if (new Date(input.receivedAt).getTime()>Date.now()) throw new ApiError(422,'FUTURE_RECEIPT','Receipt date cannot be in the future');
    const movement=await move(tx,op,c,input.warehouseId,'RECEIPT',input.quantity);
    await receiveSerials(tx,c,input.warehouseId,input.quantity,input.serialNumbers,new Date(input.receivedAt),op,movement.id);
    return {operationId:op,movement,balance:publicBalance(await balance(tx,c,input.warehouseId))};
  });
}
export function adjustment(user:Principal,input:z.infer<typeof v.adjustment>) {
  return post(user,'ADJUSTMENT',input,async (tx,op) => {
    await warehouse(tx,input.warehouseId); const incoming=['OPENING_BALANCE','ADJUSTMENT_IN'].includes(input.action);
    const c=await component(tx,input.componentId,incoming || input.action==='INSPECTION_RELEASE'); checkQuantity(c,input.quantity);
    if (input.action==='OPENING_BALANCE' && await tx.stockMovement.count({where:{balance:{componentId:c.id,warehouseId:input.warehouseId}}})) throw new ApiError(409,'OPENING_ALREADY_POSTED','Opening balance is allowed only before the first stock event');
    if (incoming && input.serialIds.length || !incoming && input.serialNumbers.length) throw new ApiError(422,'INVALID_SERIAL_INPUT','Incoming adjustments register serial numbers; other adjustments select serial IDs');
    const rows=incoming?[]:await selectSerials(tx,c,input.warehouseId,input.quantity,input.serialIds,input.action==='ADJUSTMENT_OUT'?'AVAILABLE':'QUARANTINED');
    const movement=await move(tx,op,c,input.warehouseId,input.action,input.quantity);
    if (incoming) await receiveSerials(tx,c,input.warehouseId,input.quantity,input.serialNumbers,new Date(),op,movement.id);
    else await transitionSerials(tx,rows,op,movement.id,input.action==='INSPECTION_RELEASE'?'AVAILABLE':'RETIRED',input.warehouseId,{reservationLineId:null,dispatchLineId:null});
    return {operationId:op,movement,balance:publicBalance(await balance(tx,c,input.warehouseId))};
  },true);
}
export function transfer(user:Principal,input:z.infer<typeof v.transfer>) {
  return post(user,'TRANSFER',input,async (tx,op) => {
    if (input.sourceWarehouseId===input.destinationWarehouseId) throw new ApiError(422,'SAME_WAREHOUSE','Transfer warehouses must differ');
    for (const id of [input.sourceWarehouseId,input.destinationWarehouseId].sort()) await warehouse(tx,id);
    const c=await component(tx,input.componentId); checkQuantity(c,input.quantity);
    for (const id of [input.sourceWarehouseId,input.destinationWarehouseId].sort()) await balance(tx,c,id);
    const rows=await selectSerials(tx,c,input.sourceWarehouseId,input.quantity,input.serialIds,'AVAILABLE');
    const record=await tx.stockTransfer.create({data:{operationId:op,sourceWarehouseId:input.sourceWarehouseId,destinationWarehouseId:input.destinationWarehouseId,componentId:c.id,quantity:input.quantity}});
    const outgoing=await move(tx,op,c,input.sourceWarehouseId,'TRANSFER_OUT',input.quantity);
    const incoming=await move(tx,op,c,input.destinationWarehouseId,'TRANSFER_IN',input.quantity);
    await transitionSerials(tx,rows,op,incoming.id,'AVAILABLE',input.destinationWarehouseId,{reservationLineId:null,dispatchLineId:null});
    return {operationId:op,transfer:record,movements:[outgoing,incoming]};
  });
}
export function reorder(user:Principal,input:z.infer<typeof v.reorder>) {
  return post(user,'REORDER_POLICY',input,async tx => {
    await warehouse(tx,input.warehouseId); const c=await component(tx,input.componentId);
    checkQuantity(c,input.reorderLevel,true); if(input.reorderQuantity!==null) checkQuantity(c,input.reorderQuantity);
    const row=await balance(tx,c,input.warehouseId);
    if(row.version!==input.version) throw new ApiError(409,'VERSION_CONFLICT','Balance changed; refresh');
    return publicBalance(await tx.inventoryBalance.update({where:{id:row.id,version:row.version},data:{reorderLevel:input.reorderLevel,reorderQuantity:input.reorderQuantity,version:{increment:1}}}));
  },true);
}
