import { z } from 'zod';
import { ApiError } from '../../lib/http.js';
import type { Principal } from '../auth/auth.js';
import { post,warehouse,component,move,json,checkQuantity } from './common.js';
import { approvedBom } from './availability.service.js';
import {selectSerials,transitionSerials} from './serial.service.js';
import * as v from './validation.js';
export function reserve(user:Principal,input:z.infer<typeof v.reservation>) {
  return post(user,'RESERVATION',input,async(tx,op)=>{
    await warehouse(tx,input.warehouseId);
    const approved=await approvedBom(tx,user,input.configurationId);
    if(approved.approvedVersion!==input.approvedVersion || approved.reviewId!==input.reviewId || approved.bom.id!==input.bomId || approved.bom.version!==input.bomVersion) throw new ApiError(409,'BOM_VERSION_MISMATCH','Use the exact approved configuration, review and BOM versions');
    if(!approved.bom.lines.length) throw new ApiError(409,'EMPTY_BOM','Approved BOM has no lines');
    if(await tx.stockReservation.count({where:{configuration:{leadId:approved.configuration.leadId,siteId:approved.configuration.siteId},status:{in:['ACTIVE','DISPATCHED']}}})) throw new ApiError(409,'PROJECT_ALREADY_ALLOCATED','This configuration already has an active or dispatched full reservation');
    if(new Set(input.serialSelections.map(s=>s.componentId)).size!==input.serialSelections.length || input.serialSelections.some(s=>!approved.bom.lines.some(l=>l.componentId===s.componentId))) throw new ApiError(422,'INVALID_SERIAL_SELECTION','Select each BOM component at most once');
    const reservation=await tx.stockReservation.create({data:{reference:input.reference,configurationId:input.configurationId,bomId:approved.bom.id,configurationVersion:approved.approvedVersion,configurationReviewId:approved.reviewId,bomVersion:approved.bom.version,handoffSnapshot:json(approved),warehouseId:input.warehouseId,operationId:op}});
    for(const line of [...approved.bom.lines].sort((a,b)=>a.componentId.localeCompare(b.componentId))) {
      const c=await component(tx,line.componentId); checkQuantity(c,line.quantity.toString());
      const serials=await selectSerials(tx,c,input.warehouseId,line.quantity.toString(),input.serialSelections.find(s=>s.componentId===c.id)?.serialIds??[],'AVAILABLE');
      const allocation=await tx.stockReservationLine.create({data:{reservationId:reservation.id,bomLineId:line.id,componentId:c.id,quantity:line.quantity,serialUnitIds:serials.map(s=>s.id)}});
      const movement=await move(tx,op,c,input.warehouseId,'RESERVATION',line.quantity.toString(),{reservationLineId:allocation.id});
      await transitionSerials(tx,serials,op,movement.id,'RESERVED',input.warehouseId,{reservationLineId:allocation.id,dispatchLineId:null});
    }
    return {operationId:op,reservation:await tx.stockReservation.findUniqueOrThrow({where:{id:reservation.id},include:{lines:{include:{serials:true}}}})};
  });
}
export function release(user:Principal,id:string,input:z.infer<typeof v.release>,cancel=false) {
  return post(user,cancel?'RESERVATION_CANCEL':'RESERVATION_RELEASE',{...input,reservationId:id},async(tx,op)=>{
    const row=await tx.stockReservation.findUnique({where:{id},include:{lines:{orderBy:{componentId:'asc'},include:{serials:true}}}});
    if(!row) throw new ApiError(404,'NOT_FOUND','Reservation not found');
    if(row.status!=='ACTIVE'||row.version!==input.version) throw new ApiError(409,'RESERVATION_STATE_CONFLICT','Release only the current active reservation');
    for(const line of row.lines) {
      const c=await component(tx,line.componentId,false);
      const serials=await selectSerials(tx,c,row.warehouseId,line.quantity.toString(),line.serials.map(s=>s.id),'RESERVED',line.id);
      const movement=await move(tx,op,c,row.warehouseId,'RESERVATION_RELEASE',line.quantity.toString(),{reservationLineId:line.id});
      await transitionSerials(tx,serials,op,movement.id,'AVAILABLE',row.warehouseId,{reservationLineId:null,dispatchLineId:null});
    }
    return {operationId:op,reservation:await tx.stockReservation.update({where:{id,version:input.version,status:'ACTIVE'},data:{status:cancel?'CANCELLED':'RELEASED',version:{increment:1}}})};
  });
}
export function dispatch(user:Principal,input:z.infer<typeof v.dispatch>) {
  return post(user,'DISPATCH',input,async(tx,op)=>{
    const row=await tx.stockReservation.findUnique({where:{id:input.reservationId},include:{lines:{orderBy:{componentId:'asc'},include:{serials:true}}}});
    if(!row) throw new ApiError(404,'NOT_FOUND','Reservation not found');
    if(row.status!=='ACTIVE'||row.version!==input.version) throw new ApiError(409,'RESERVATION_STATE_CONFLICT','Dispatch only the current active reservation');
    if(new Date(input.dispatchedAt).getTime()>Date.now() || new Date(input.dispatchedAt)<row.createdAt) throw new ApiError(422,'INVALID_DISPATCH_DATE','Dispatch date must be between reservation creation and now');
    await warehouse(tx,row.warehouseId);
    const approved=await approvedBom(tx,user,row.configurationId);
    if(approved.approvedVersion!==row.configurationVersion || approved.reviewId!==row.configurationReviewId || approved.bom.id!==row.bomId || approved.bom.version!==row.bomVersion) throw new ApiError(409,'BOM_VERSION_MISMATCH','Reservation approval reference is no longer eligible');
    const record=await tx.stockDispatch.create({data:{reference:input.reference,reservationId:row.id,warehouseId:row.warehouseId,operationId:op,dispatchedAt:new Date(input.dispatchedAt),notes:input.notes}});
    for(const line of row.lines) {
      const c=await component(tx,line.componentId);
      const serials=await selectSerials(tx,c,row.warehouseId,line.quantity.toString(),line.serials.map(s=>s.id),'RESERVED',line.id);
      const dispatched=await tx.stockDispatchLine.create({data:{dispatchId:record.id,reservationLineId:line.id,quantity:line.quantity,serialUnitIds:serials.map(s=>s.id)}});
      const movement=await move(tx,op,c,row.warehouseId,'DISPATCH',line.quantity.toString(),{reservationLineId:line.id,dispatchLineId:dispatched.id});
      await transitionSerials(tx,serials,op,movement.id,'DISPATCHED',row.warehouseId,{reservationLineId:line.id,dispatchLineId:dispatched.id});
    }
    await tx.stockReservation.update({where:{id:row.id,version:input.version,status:'ACTIVE'},data:{status:'DISPATCHED',version:{increment:1}}});
    return {operationId:op,dispatch:await tx.stockDispatch.findUniqueOrThrow({where:{id:record.id},include:{lines:{include:{serials:true}}}}),scope:'WAREHOUSE_RELEASE_ONLY'};
  });
}
export function returns(user:Principal,input:z.infer<typeof v.returns>) {
  return post(user,'RETURN',input,async(tx,op)=>{
    await warehouse(tx,input.warehouseId);
    const record=await tx.stockDispatch.findUnique({where:{id:input.dispatchId},include:{lines:{include:{reservationLine:true}}}});
    if(!record) throw new ApiError(404,'NOT_FOUND','Dispatch not found');
    if(new Set(input.lines.map(l=>l.dispatchLineId)).size!==input.lines.length) throw new ApiError(422,'DUPLICATE_LINE','Return each dispatch line once per operation');
    const movements=[];
    for(const inputLine of [...input.lines].sort((a,b)=>a.dispatchLineId.localeCompare(b.dispatchLineId))) {
      const line=record.lines.find(l=>l.id===inputLine.dispatchLineId);
      if(!line) throw new ApiError(422,'INVALID_DISPATCH_LINE','Return must reference a line in the specified dispatch');
      const c=await component(tx,line.reservationLine.componentId,false),q=checkQuantity(c,inputLine.quantity);
      if(q.plus(line.returnedQuantity).gt(line.quantity)) throw new ApiError(409,'EXCESS_RETURN','Return exceeds the unreturned dispatched quantity');
      const serials=await selectSerials(tx,c,record.warehouseId,inputLine.quantity,inputLine.serialIds,'DISPATCHED',line.reservationLineId,line.id);
      const movement=await move(tx,op,c,input.warehouseId,'RETURN',inputLine.quantity,{reservationLineId:line.reservationLineId,dispatchLineId:line.id});
      await transitionSerials(tx,serials,op,movement.id,'QUARANTINED',input.warehouseId,{reservationLineId:null,dispatchLineId:line.id});
      await tx.stockDispatchLine.update({where:{id:line.id,returnedQuantity:line.returnedQuantity},data:{returnedQuantity:{increment:q}}});
      movements.push(movement);
    }
    return {operationId:op,dispatchId:record.id,movements,disposition:'QUARANTINED_NOT_AVAILABLE'};
  });
}
