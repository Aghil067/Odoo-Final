import { Prisma } from '@prisma/client';
import type { Principal } from '../auth/auth.js';
import { leadScope } from '../crm/access.js';
import { ApiError,pagination } from '../../lib/http.js';
import { inventoryAtomic,reader,publicBalance } from './common.js';
import {projectScope} from './availability.service.js';
import type {Query} from './validation.js';
const paging=(q:Query)=>({skip:(q.page-1)*q.pageSize,take:q.pageSize});
export function configurationScope(user:Principal):Prisma.SolarConfigurationWhereInput {
  if(['ADMIN','WAREHOUSE','FINANCE'].includes(user.role)) return {};
  if(user.role==='SALES') return {lead:leadScope(user)};
  if(user.role==='TECHNICIAN') return {survey:{assignedToId:user.id}};
  throw new ApiError(403,'INVENTORY_FORBIDDEN','Project inventory permission required');
}
const reservationSelect={id:true,reference:true,configurationId:true,bomId:true,configurationVersion:true,configurationReviewId:true,bomVersion:true,warehouseId:true,operationId:true,status:true,version:true,createdAt:true,updatedAt:true} as const;
export function warehouses(user:Principal,q:Query) {
  reader(user); return inventoryAtomic(async tx=>{
    const where:Prisma.WarehouseWhereInput={...(q.active?{isActive:q.active==='true'}:{}),...(q.q?{OR:[{name:{contains:q.q,mode:'insensitive'}},{code:{contains:q.q,mode:'insensitive'}}]}:{})};
    return {data:await tx.warehouse.findMany({where,...paging(q),orderBy:{code:'asc'}}),pagination:pagination(q.page,q.pageSize,await tx.warehouse.count({where}))};
  });
}
export function warehouseDetail(user:Principal,id:string) {reader(user);return inventoryAtomic(tx=>tx.warehouse.findUniqueOrThrow({where:{id}}));}
export function balances(user:Principal,q:Query) {
  reader(user); return inventoryAtomic(async tx=>{
    const where:Prisma.InventoryBalanceWhereInput={warehouseId:q.warehouseId,componentId:q.componentId,...(q.q?{component:{OR:[{name:{contains:q.q,mode:'insensitive'}},{sku:{contains:q.q,mode:'insensitive'}}]}}:{})};
    return {data:(await tx.inventoryBalance.findMany({where,...paging(q),include:{component:{select:{id:true,sku:true,name:true,unit:true,category:true,isActive:true}},warehouse:{select:{id:true,code:true,name:true}}},orderBy:[{warehouseId:'asc'},{componentId:'asc'}]})).map(publicBalance),pagination:pagination(q.page,q.pageSize,await tx.inventoryBalance.count({where}))};
  });
}
export function movements(user:Principal,q:Query) {
  reader(user); return inventoryAtomic(async tx=>{
    const where:Prisma.StockMovementWhereInput={type:q.type,operationId:q.operationId,balance:{warehouseId:q.warehouseId,componentId:q.componentId},createdAt:{gte:q.from?new Date(q.from):undefined,lte:q.to?new Date(q.to):undefined}};
    return {data:await tx.stockMovement.findMany({where,...paging(q),include:{balance:{select:{warehouseId:true,componentId:true}},operation:{select:{id:true,kind:true,reference:true,actorId:true,reason:true,createdAt:true}}},orderBy:[{createdAt:'desc'},{id:'desc'}]}),pagination:pagination(q.page,q.pageSize,await tx.stockMovement.count({where}))};
  });
}
export function serials(user:Principal,q:Query) {
  reader(user);return inventoryAtomic(async tx=>{
    const where:Prisma.InventorySerialUnitWhereInput={warehouseId:q.warehouseId,componentId:q.componentId,state:q.state,...(q.q?{serialNumber:{contains:q.q.toUpperCase()}}:{})};
    return {data:await tx.inventorySerialUnit.findMany({where,...paging(q),orderBy:{serialNumber:'asc'}}),pagination:pagination(q.page,q.pageSize,await tx.inventorySerialUnit.count({where}))};
  });
}
export function serialDetail(user:Principal,id:string) { reader(user);return inventoryAtomic(tx=>tx.inventorySerialUnit.findUniqueOrThrow({where:{id},include:{component:{select:{id:true,sku:true,name:true}},receiptOperation:{select:{id:true,reference:true,createdAt:true}},warehouse:true}})); }
export function serialHistory(user:Principal,id:string,q:Query) { reader(user);return inventoryAtomic(async tx=>{await tx.inventorySerialUnit.findUniqueOrThrow({where:{id}});const where={serialUnitId:id};return {data:await tx.inventorySerialEvent.findMany({where,...paging(q),include:{operation:{select:{id:true,reference:true,kind:true,actor:{select:{id:true,name:true}}}}},orderBy:{version:'desc'}}),pagination:pagination(q.page,q.pageSize,await tx.inventorySerialEvent.count({where}))};}); }
export function reservations(user:Principal,q:Query) {return inventoryAtomic(async tx=>{
  const where:Prisma.StockReservationWhereInput={warehouseId:q.warehouseId,configurationId:q.configurationId,status:q.status,configuration:configurationScope(user)};
  return {data:await tx.stockReservation.findMany({where,select:reservationSelect,...paging(q),orderBy:[{createdAt:'desc'},{id:'desc'}]}),pagination:pagination(q.page,q.pageSize,await tx.stockReservation.count({where}))};
});}
export function reservationDetail(user:Principal,id:string) {return inventoryAtomic(async tx=>{
  const row=await tx.stockReservation.findFirst({where:{id,configuration:configurationScope(user)},select:{...reservationSelect,lines:{include:{serials:{select:{id:true,serialNumber:true,state:true}},dispatchLine:true}},dispatch:{select:{id:true,reference:true,status:true,dispatchedAt:true}}}});
  if(!row) throw new ApiError(404,'NOT_FOUND','Reservation not found');return row;
});}
export function dispatches(user:Principal,q:Query) {return inventoryAtomic(async tx=>{
  const where:Prisma.StockDispatchWhereInput={warehouseId:q.warehouseId,reservation:{configurationId:q.configurationId,configuration:configurationScope(user)}};
  return {data:await tx.stockDispatch.findMany({where,...paging(q),orderBy:[{createdAt:'desc'},{id:'desc'}]}),pagination:pagination(q.page,q.pageSize,await tx.stockDispatch.count({where}))};
});}
export function dispatchDetail(user:Principal,id:string) {return inventoryAtomic(async tx=>{
  const row=await tx.stockDispatch.findFirst({where:{id,reservation:{configuration:configurationScope(user)}},include:{reservation:{select:{...reservationSelect,configuration:{select:{customerId:true,leadId:true,siteId:true,approvedSurveyId:true,approvedSurveyVersion:true,surveyReviewId:true}}}},lines:{include:{reservationLine:{select:{componentId:true,bomLineId:true,bomLine:{select:{unit:true,skuSnapshot:true,descriptionSnapshot:true}}}},serials:{select:{id:true,serialNumber:true,state:true}}}}}});
  if(!row) throw new ApiError(404,'NOT_FOUND','Dispatch not found');
  const historicalSerials=await tx.inventorySerialUnit.findMany({where:{id:{in:row.lines.flatMap(l=>l.serialUnitIds)}},select:{id:true,serialNumber:true,componentId:true,state:true,warehouseId:true,receivedAt:true,receiptOperationId:true}});
  return {...row,lines:row.lines.map(l=>({...l,serials:historicalSerials.filter(s=>l.serialUnitIds.includes(s.id))})),scope:'WAREHOUSE_RELEASE_NOT_INSTALLATION_OR_WARRANTY'};
});}
export function reservationAvailability(user:Principal,id:string) {return inventoryAtomic(async tx=>{
  const row=await tx.stockReservation.findUnique({where:{id},include:{lines:{orderBy:{componentId:'asc'}}}});
  if(!row)throw new ApiError(404,'NOT_FOUND','Reservation not found');await projectScope(tx,user,row.configurationId);
  const rows=await tx.inventoryBalance.findMany({where:{warehouseId:row.warehouseId,componentId:{in:row.lines.map(l=>l.componentId)}}});
  return {reservationId:id,status:row.status,lines:row.lines.map(l=>{const b=rows.find(b=>b.componentId===l.componentId);return {componentId:l.componentId,reservedForThisProject:row.status==='ACTIVE'?l.quantity.toString():'0',warehouseBalance:b?publicBalance(b):null};})};
});}
export function lowStock(user:Principal,q:Query) {
  reader(user);return inventoryAtomic(async tx=>{
    const filter=Prisma.sql`b."onHandQuantity" - b."reservedQuantity" <= b."reorderLevel" ${q.warehouseId?Prisma.sql`AND b."warehouseId"=${q.warehouseId}::uuid`:Prisma.empty} ${q.componentId?Prisma.sql`AND b."componentId"=${q.componentId}::uuid`:Prisma.empty}`;
    const data=await tx.$queryRaw`SELECT b.*, b."onHandQuantity"-b."reservedQuantity" AS "availableQuantity", c."sku",c."name",c."unit" FROM "InventoryBalance" b JOIN "SolarComponent" c ON c."id"=b."componentId" WHERE ${filter} ORDER BY b."warehouseId",b."componentId" LIMIT ${q.pageSize} OFFSET ${(q.page-1)*q.pageSize}`;
    const count=await tx.$queryRaw<{count:bigint}[]>`SELECT count(*) FROM "InventoryBalance" b WHERE ${filter}`;
    return {data,pagination:pagination(q.page,q.pageSize,Number(count[0]?.count??0))};
  });
}
export function summary(user:Principal,q:Query) {
  reader(user);return inventoryAtomic(async tx=>{
    const filter=q.warehouseId?Prisma.sql`WHERE b."warehouseId"=${q.warehouseId}::uuid`:Prisma.empty;
    const totals=await tx.$queryRaw`SELECT c."unit",sum(b."onHandQuantity") AS "onHandQuantity",sum(b."reservedQuantity") AS "reservedQuantity",sum(b."onHandQuantity"-b."reservedQuantity") AS "availableQuantity",sum(b."quarantinedQuantity") AS "quarantinedQuantity",count(*)::int AS "balanceCount",count(*) FILTER (WHERE b."onHandQuantity"-b."reservedQuantity"<=b."reorderLevel")::int AS "lowStockCount" FROM "InventoryBalance" b JOIN "SolarComponent" c ON c."id"=b."componentId" ${filter} GROUP BY c."unit" ORDER BY c."unit"`;
    return {byUnit:totals,activeWarehouseCount:await tx.warehouse.count({where:{isActive:true,...(q.warehouseId?{id:q.warehouseId}:{})}}),activeReservationCount:await tx.stockReservation.count({where:{warehouseId:q.warehouseId,status:'ACTIVE'}}),scope:'QUANTITIES_ONLY_NO_INVENTORY_VALUATION'};
  });
}
export function operations(user:Principal,q:Query) { reader(user);return inventoryAtomic(async tx=>{
 const where:Prisma.InventoryOperationWhereInput={kind:q.kind,...(q.q?{reference:{contains:q.q,mode:'insensitive'}}:{})};
 return {data:await tx.inventoryOperation.findMany({where,...paging(q),select:{id:true,kind:true,reference:true,actorId:true,reason:true,createdAt:true},orderBy:[{createdAt:'desc'},{id:'desc'}]}),pagination:pagination(q.page,q.pageSize,await tx.inventoryOperation.count({where}))};
});}
export function operationDetail(user:Principal,id:string) {reader(user);return inventoryAtomic(tx=>tx.inventoryOperation.findUniqueOrThrow({where:{id},select:{id:true,kind:true,reference:true,actorId:true,reason:true,payload:true,result:true,createdAt:true}}));}

const componentLookupSelect={id:true,sku:true,name:true,category:true,unit:true,serializationRequired:true,isActive:true,version:true,manufacturer:true,modelNumber:true} as const;
export function components(user:Principal,q:Query){reader(user);return inventoryAtomic(async tx=>{
 const where:Prisma.SolarComponentWhereInput={category:q.category,...(q.active?{isActive:q.active==='true'}:{}),...(q.q?{OR:[{sku:{contains:q.q,mode:'insensitive'}},{name:{contains:q.q,mode:'insensitive'}}]}:{})};
 return {data:await tx.solarComponent.findMany({where,select:componentLookupSelect,...paging(q),orderBy:[{name:'asc'},{id:'asc'}]}),pagination:pagination(q.page,q.pageSize,await tx.solarComponent.count({where}))};
});}
export function componentDetail(user:Principal,id:string){reader(user);return inventoryAtomic(async tx=>{const row=await tx.solarComponent.findUnique({where:{id},select:componentLookupSelect});if(!row)throw new ApiError(404,'NOT_FOUND','Component not found');return row;});}
export function fulfillmentConfigurations(user:Principal,q:Query){return inventoryAtomic(async tx=>{
 const where:Prisma.SolarConfigurationWhereInput={AND:[configurationScope(user),{status:'APPROVED',nextRevision:null,...(q.q?{OR:[{reference:{contains:q.q,mode:'insensitive'}},{name:{contains:q.q,mode:'insensitive'}}]}:{})}]};
 return {data:await tx.solarConfiguration.findMany({where,...paging(q),select:{id:true,reference:true,name:true,approvedVersion:true,customer:{select:{id:true,name:true}},site:{select:{id:true,name:true}}},orderBy:[{createdAt:'desc'},{id:'desc'}]}),pagination:pagination(q.page,q.pageSize,await tx.solarConfiguration.count({where}))};
});}
