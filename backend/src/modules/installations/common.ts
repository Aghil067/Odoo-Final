import { Prisma,type InstallationJob,type InstallationStatus } from '@prisma/client';
import type { Transaction } from '../../lib/db.js';
import { atomic } from '../../lib/db.js';
import { ApiError } from '../../lib/http.js';
import type { Principal } from '../auth/auth.js';
import { leadScope } from '../crm/access.js';
import { Decimal,json } from '../solar/common.js';
import { approvedConfigurationRecord } from '../solar/review.service.js';
export {Decimal,json};
export const transitions:Record<InstallationStatus,readonly InstallationStatus[]>={
 PLANNED:['SITE_READY','CANCELED'],SITE_READY:['PLANNED','IN_PROGRESS','CANCELED'],IN_PROGRESS:['ON_HOLD','WORK_COMPLETED'],ON_HOLD:['IN_PROGRESS','TESTING','WORK_COMPLETED','REWORK_REQUIRED','CANCELED'],WORK_COMPLETED:['TESTING','ON_HOLD','REWORK_REQUIRED'],TESTING:['COMMISSIONING_REVIEW','ON_HOLD','REWORK_REQUIRED'],COMMISSIONING_REVIEW:['COMMISSIONED','REWORK_REQUIRED'],REWORK_REQUIRED:['IN_PROGRESS','ON_HOLD','WORK_COMPLETED'],COMMISSIONED:[],CANCELED:[],
};
export async function installationAtomic<T>(work:(tx:Transaction)=>Promise<T>) {
 try{return await atomic(work);}catch(e){
  if((e instanceof Prisma.PrismaClientKnownRequestError&&e.code==='P2004')||(e instanceof Prisma.PrismaClientUnknownRequestError&&e.message.includes('23514')))throw new ApiError(409,'INSTALLATION_CONSTRAINT','Installation constraints rejected the operation; refresh eligibility, versions and equipment');
  throw e;
 }
}
export function admin(user:Principal){if(user.role!=='ADMIN')throw new ApiError(403,'ADMIN_REQUIRED','Installation coordinator/reviewer ADMIN permission required');}
export function scope(user:Principal):Prisma.InstallationJobWhereInput {
 if(user.role==='ADMIN')return {};
 if(user.role==='TECHNICIAN')return {assignments:{some:{userId:user.id}}};
 if(user.role==='SALES')return {lead:leadScope(user)};
 if(user.role==='FINANCE')return {status:'COMMISSIONED'};
 throw new ApiError(403,'INSTALLATION_FORBIDDEN','Your role cannot access installation execution/history');
}
export async function requireJob(tx:Transaction,user:Principal,id:string,version?:number,write=false){
 const row=await tx.installationJob.findFirst({where:{AND:[{id},scope(user)]}});
 if(!row)throw new ApiError(404,'NOT_FOUND','Installation job not found');
 if(version!==undefined&&version!==row.version)throw new ApiError(409,'VERSION_CONFLICT','Job changed; refresh and use the current version');
 if(write){
  if(!['ADMIN','TECHNICIAN'].includes(user.role))throw new ApiError(403,'INSTALLATION_FORBIDDEN','Assigned installation editor required');
  if(['COMMISSIONED','CANCELED','COMMISSIONING_REVIEW'].includes(row.status))throw new ApiError(409,'INSTALLATION_FROZEN','Terminal/submitted installation is immutable');
 }
 return row;
}
export async function saveJob(tx:Transaction,user:Principal,row:InstallationJob,data:Prisma.InstallationJobUncheckedUpdateInput,event:string,reason:string,details:unknown={},executionChanged=false){
 if(typeof data.status==='string'&&data.status!==row.status&&!transitions[row.status].includes(data.status))throw new ApiError(409,'INVALID_TRANSITION',`Cannot move from ${row.status} to ${data.status}`);
 const result=await tx.installationJob.updateMany({where:{id:row.id,version:row.version},data:{...data,version:{increment:1},...(executionChanged?{executionRevision:{increment:1}}:{})}});
 if(result.count!==1)throw new ApiError(409,'VERSION_CONFLICT','Concurrent job change; refresh');
 const current=await tx.installationJob.findUniqueOrThrow({where:{id:row.id}});
 await tx.installationStatusHistory.create({data:{jobId:row.id,actorId:user.id,event,fromStatus:row.status,toStatus:current.status,jobVersion:current.version,reason,details:json(details)}});
 return current;
}
export async function evidence(tx:Transaction,jobId:string,ids:string[]){
 if(new Set(ids).size!==ids.length||await tx.installationAttachment.count({where:{jobId,id:{in:ids}}})!==ids.length)throw new ApiError(422,'EVIDENCE_OWNERSHIP','Evidence must belong to this job');
}
export async function ownerUser(tx:Transaction,id:string,role:'ADMIN'|'TECHNICIAN'){
 if(!await tx.user.findFirst({where:{id,role,isActive:true}}))throw new ApiError(422,'INVALID_ASSIGNEE',`Choose an active ${role} user`);
}
export async function exactHandoff(tx:Transaction,job:Pick<InstallationJob,'configurationId'|'configurationApprovedVersion'|'configurationReviewId'|'bomId'|'bomVersion'|'dispatchId'|'reservationId'|'customerId'|'siteId'|'leadId'>){
 const approved=await approvedConfigurationRecord(tx,await tx.solarConfiguration.findUniqueOrThrow({where:{id:job.configurationId}}));
 const dispatch=await tx.stockDispatch.findUniqueOrThrow({where:{id:job.dispatchId},include:{reservation:true,lines:{include:{reservationLine:true}}}});
 const c=approved.configuration,r=dispatch.reservation;
 if(c.customerId!==job.customerId||c.siteId!==job.siteId||c.leadId!==job.leadId||approved.approvedVersion!==job.configurationApprovedVersion||approved.reviewId!==job.configurationReviewId||approved.bom.id!==job.bomId||approved.bom.version!==job.bomVersion||dispatch.reservationId!==job.reservationId||r.status!=='DISPATCHED'||dispatch.status!=='POSTED'||r.configurationId!==c.id||r.bomId!==approved.bom.id||r.configurationVersion!==approved.approvedVersion||r.configurationReviewId!==approved.reviewId||r.bomVersion!==approved.bom.version)throw new ApiError(409,'DISPATCH_HANDOFF_MISMATCH','Use the same exact eligible approved design, BOM, reservation and posted dispatch');
 if(dispatch.lines.length!==approved.bom.lines.length||approved.bom.lines.some(b=>!dispatch.lines.some(d=>d.reservationLine.bomLineId===b.id&&d.reservationLine.componentId===b.componentId&&d.quantity.eq(b.quantity)&&d.reservationLine.quantity.eq(b.quantity))))throw new ApiError(409,'DISPATCH_INCOMPLETE','Dispatch must account for every approved BOM line and quantity');
 return {approved,dispatch};
}
export async function blockingIssues(tx:Transaction,jobId:string){return tx.installationIssue.count({where:{jobId,status:'OPEN',OR:[{blocking:true},{severity:{in:['HIGH','CRITICAL']}}]}});}
