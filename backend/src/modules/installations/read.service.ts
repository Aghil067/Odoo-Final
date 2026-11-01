import { Prisma } from '@prisma/client';
import { ApiError,pagination } from '../../lib/http.js';
import type { Principal } from '../auth/auth.js';
import { installationAtomic,requireJob,scope } from './common.js';
import { attachmentPublic,publicJob } from './policy.js';
import * as v from './validation.js';
import { z } from 'zod';
export function assignees(user:Principal,q:z.infer<typeof v.page>&{q?:string;role:'ADMIN'|'TECHNICIAN'}){return installationAtomic(async tx=>{
 if(user.role!=='ADMIN')throw new ApiError(403,'ADMIN_REQUIRED','Only coordinators select installation assignees');
 const where:Prisma.UserWhereInput={isActive:true,role:q.role,...(q.q?{name:{contains:q.q,mode:'insensitive'}}:{})};
 const data=await tx.user.findMany({where,select:{id:true,name:true,role:true},skip:(q.page-1)*q.pageSize,take:q.pageSize,orderBy:[{name:'asc'},{id:'asc'}]});
 return {data,pagination:pagination(q.page,q.pageSize,await tx.user.count({where}))};
});}
export function listJobs(user:Principal,q:z.infer<typeof v.list>){return installationAtomic(async tx=>{
 const where:Prisma.InstallationJobWhereInput={AND:[scope(user),{status:q.status,customerId:q.customerId,leadId:q.leadId,siteId:q.siteId,...(q.q?{OR:[{name:{contains:q.q,mode:'insensitive'}},{reference:{contains:q.q,mode:'insensitive'}}]}:{})}]};
 const data=await tx.installationJob.findMany({where,skip:(q.page-1)*q.pageSize,take:q.pageSize,orderBy:[{createdAt:'desc'},{id:'desc'}]});
 return {data:data.map(publicJob),pagination:pagination(q.page,q.pageSize,await tx.installationJob.count({where}))};
});}
export function detail(user:Principal,id:string){return installationAtomic(async tx=>{
 const job=await requireJob(tx,user,id);
 if(user.role==='FINANCE')return publicJob(job);
 const data=await tx.installationJob.findUniqueOrThrow({where:{id},include:{assignments:{include:{user:{select:{id:true,name:true,role:true,isActive:true}}}},milestones:true,equipment:{include:{component:{select:{id:true,name:true,sku:true,category:true}},serials:{include:{serialUnit:{select:{serialNumber:true,state:true}}}}}}}});
 return publicJob(data);
});}
export function summary(user:Principal){return installationAtomic(async tx=>({byStatus:await tx.installationJob.groupBy({by:['status'],where:scope(user),_count:{_all:true}}),blockingOpenIssues:await tx.installationIssue.count({where:{job:scope(user),status:'OPEN',OR:[{blocking:true},{severity:{in:['HIGH','CRITICAL']}}]}})}));}
export function collection(user:Principal,id:string,q:z.infer<typeof v.page>,kind:'milestones'|'equipment'|'issues'|'tests'|'attachments'|'history'|'receipts'|'readiness'|'reviews'){return installationAtomic(async tx=>{
 await requireJob(tx,user,id);if(user.role==='FINANCE')throw new ApiError(403,'COMPLETION_SUMMARY_ONLY','FINANCE reads approved completion summaries only');
 const where={jobId:id},paging={skip:(q.page-1)*q.pageSize,take:q.pageSize};
 // Keep each Prisma query typed; collections have distinct model payloads.
 let data:unknown,total:number;
 switch(kind){
 case 'milestones':data=await tx.installationMilestone.findMany({where,...paging,orderBy:{type:'asc'}});total=await tx.installationMilestone.count({where});break;
 case 'equipment':data=await tx.installationEquipment.findMany({where,...paging,include:{component:{select:{id:true,name:true,sku:true,category:true}},serials:{include:{serialUnit:{select:{serialNumber:true,state:true}}}}},orderBy:{id:'asc'}});total=await tx.installationEquipment.count({where});break;
 case 'issues':data=await tx.installationIssue.findMany({where,...paging,orderBy:[{reportedAt:'desc'},{id:'desc'}]});total=await tx.installationIssue.count({where});break;
 case 'tests':data=await tx.installationTest.findMany({where,...paging,orderBy:{jobVersion:'desc'}});total=await tx.installationTest.count({where});break;
 case 'attachments':data=await tx.installationAttachment.findMany({where,...paging,select:attachmentPublic,orderBy:[{createdAt:'desc'},{id:'desc'}]});total=await tx.installationAttachment.count({where});break;
 case 'history':data=await tx.installationStatusHistory.findMany({where,...paging,orderBy:{jobVersion:'desc'}});total=await tx.installationStatusHistory.count({where});break;
 case 'receipts':data=await tx.installationReceipt.findMany({where,...paging,orderBy:{jobVersion:'desc'}});total=await tx.installationReceipt.count({where});break;
 case 'readiness':data=await tx.installationReadiness.findMany({where,...paging,orderBy:{jobVersion:'desc'}});total=await tx.installationReadiness.count({where});break;
 case 'reviews':if(user.role!=='ADMIN')throw new ApiError(403,'REVIEW_SNAPSHOT_PRIVATE','Only ADMIN reads full commissioning snapshots');data=await tx.installationCommissioningReview.findMany({where,...paging,orderBy:{jobVersion:'desc'}});total=await tx.installationCommissioningReview.count({where});break;
 }
 return {data,pagination:pagination(q.page,q.pageSize,total)};
});}
export function warehouseEquipment(user:Principal,id:string){return installationAtomic(async tx=>{
 if(!['ADMIN','WAREHOUSE'].includes(user.role))throw new ApiError(403,'WAREHOUSE_REQUIRED','Warehouse equipment-reference access required');
 const row=await tx.installationJob.findUnique({where:{id},select:{id:true,reference:true,dispatchId:true,reservationId:true,status:true,equipment:{select:{dispatchLineId:true,componentId:true,unit:true,dispatchedQuantity:true,receivedQuantity:true,damagedQuantity:true,installedQuantity:true,serials:{select:{serialUnitId:true,received:true,damaged:true,installedAt:true}}}}}});
 if(!row)throw new ApiError(404,'NOT_FOUND','Job not found');return row;
});}
