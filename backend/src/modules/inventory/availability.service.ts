import type { Transaction } from '../../lib/db.js';
import { ApiError } from '../../lib/http.js';
import type { Principal } from '../auth/auth.js';
import { leadScope } from '../crm/access.js';
import { approvedConfigurationRecord } from '../solar/review.service.js';
import { inventoryAtomic,Decimal,available,warehouse } from './common.js';
export async function projectScope(tx:Transaction,user:Principal,configurationId:string) {
  const where=user.role==='SALES'?{lead:leadScope(user)}:user.role==='TECHNICIAN'?{survey:{assignedToId:user.id}}:['ADMIN','WAREHOUSE','FINANCE'].includes(user.role)?{}:null;
  if (!where) throw new ApiError(403,'INVENTORY_FORBIDDEN','Project inventory read permission required');
  const row=await tx.solarConfiguration.findFirst({where:{AND:[{id:configurationId},where]}});
  if (!row) throw new ApiError(404,'NOT_FOUND','Configuration not found');
  return row;
}
export async function approvedBom(tx:Transaction,user:Principal,configurationId:string) {
  return approvedConfigurationRecord(tx,await projectScope(tx,user,configurationId));
}
export function availability(user:Principal,configurationId:string,warehouseId:string) {
  return inventoryAtomic(async tx => {
    await warehouse(tx,warehouseId);
    const approved=await approvedBom(tx,user,configurationId);
    const balances=await tx.inventoryBalance.findMany({where:{warehouseId,componentId:{in:approved.bom.lines.map(l=>l.componentId)}},include:{component:true}});
    const catalog=await tx.solarComponent.findMany({where:{id:{in:approved.bom.lines.map(l=>l.componentId)}}});
    const lines=approved.bom.lines.map(line=>{
      const b=balances.find(b=>b.componentId===line.componentId), free=b?available(b):new Decimal(0), required=new Decimal(line.quantity),shortage=Decimal.max(required.minus(free),0);
      const eligible=catalog.find(c=>c.id===line.componentId)?.isActive===true;
      return {bomLineId:line.id,componentId:line.componentId,sku:line.skuSnapshot,description:line.descriptionSnapshot,serializationRequired:catalog.find(c=>c.id===line.componentId)?.serializationRequired??null,unit:line.unit,requiredQuantity:required.toString(),onHandQuantity:b?.onHandQuantity.toString()??'0',reservedQuantity:b?.reservedQuantity.toString()??'0',availableQuantity:free.toString(),quarantinedQuantity:b?.quarantinedQuantity.toString()??'0',shortageQuantity:shortage.toString(),componentActive:eligible,status:!eligible?'UNAVAILABLE':shortage.eq(0)?'AVAILABLE':free.gt(0)?'PARTIAL':'UNAVAILABLE'};
    });
    const allocation=await tx.stockReservation.findFirst({where:{configuration:{leadId:approved.configuration.leadId,siteId:approved.configuration.siteId},status:{in:['ACTIVE','DISPATCHED']}},select:{id:true,reference:true,status:true}});
    return {allocation,configurationId,approvedVersion:approved.approvedVersion,reviewId:approved.reviewId,bomId:approved.bom.id,bomVersion:approved.bom.version,warehouseId,fulfillmentStatus:lines.every(l=>l.status==='AVAILABLE')?'AVAILABLE':lines.some(l=>l.status!=='UNAVAILABLE')?'PARTIAL':'UNAVAILABLE',lines,scope:'WAREHOUSE_AVAILABILITY_NOT_STOCK_RESERVATION'};
  });
}
