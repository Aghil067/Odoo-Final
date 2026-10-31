import {createHash} from 'node:crypto';
import {Prisma,type WarrantyRegistration,type WarrantyClaim,type WarrantyRegistrationStatus,type WarrantyClaimStatus} from '@prisma/client';
import {atomic,type Transaction} from '../../lib/db.js';
import {ApiError} from '../../lib/http.js';
import type {Principal} from '../auth/auth.js';
import {leadScope} from '../crm/access.js';
import {json,Decimal} from '../solar/common.js';
export {json,Decimal};
export function admin(user:Principal){if(user.role!=='ADMIN')throw new ApiError(403,'WARRANTY_ADMIN_REQUIRED','ADMIN warranty authority required');}
export function caseWorker(user:Principal){if(!['ADMIN','SUPPORT'].includes(user.role))throw new ApiError(403,'WARRANTY_CASE_REQUIRED','Authorized warranty case worker required');}
export function jobScope(user:Principal,summary=false):Prisma.InstallationJobWhereInput{
 if(user.role==='ADMIN')return {};
 if(user.role==='SUPPORT')return {warrantyAccessGrants:{some:{userId:user.id,isActive:true}}};
 if(summary&&user.role==='SALES')return {lead:leadScope(user)};
 if(summary&&user.role==='TECHNICIAN')return {assignments:{some:{userId:user.id}}};
 throw new ApiError(403,'WARRANTY_SCOPE','No warranty case/project access');
}
export async function job(tx:Transaction,user:Principal,id:string,summary=false){const row=await tx.installationJob.findFirst({where:{AND:[{id},jobScope(user,summary)]}});if(!row)throw new ApiError(404,'NOT_FOUND','Authorized installation not found');return row;}
export async function registration(tx:Transaction,user:Principal,id:string,version?:number){
 const row=await tx.warrantyRegistration.findFirst({where:{id,installation:jobScope(user)}});if(!row)throw new ApiError(404,'NOT_FOUND','Warranty registration not found');if(version!==undefined){await tx.$queryRaw`SELECT "id" FROM "WarrantyRegistration" WHERE "id"=${id}::uuid FOR UPDATE`;if(row.version!==version)throw new ApiError(409,'VERSION_CONFLICT','Registration changed; refresh');}return row;
}
export async function claim(tx:Transaction,user:Principal,id:string,version?:number){const row=await tx.warrantyClaim.findFirst({where:{id,registration:{installation:jobScope(user)}}});if(!row)throw new ApiError(404,'NOT_FOUND','Warranty claim not found');if(version!==undefined){await tx.$queryRaw`SELECT "id" FROM "WarrantyRegistration" WHERE "id"=${row.registrationId}::uuid FOR UPDATE`;await tx.$queryRaw`SELECT "id" FROM "WarrantyClaim" WHERE "id"=${id}::uuid FOR UPDATE`;if(row.version!==version)throw new ApiError(409,'VERSION_CONFLICT','Claim changed; refresh');}return row;}
export async function warrantyAtomic<T>(work:(tx:Transaction)=>Promise<T>){try{return await atomic(work);}catch(e){if((e instanceof Prisma.PrismaClientKnownRequestError||e instanceof Prisma.PrismaClientUnknownRequestError)&&((e instanceof Prisma.PrismaClientKnownRequestError&&e.code==='P2004')||/23514|23P01/.test(e.message)))throw new ApiError(409,'WARRANTY_CONSTRAINT','Warranty constraints rejected the change; refresh dates, versions, scope and lifecycle');throw e;}}
function canonical(value:unknown):string{if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';if(value!==null&&typeof value==='object')return '{'+Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>JSON.stringify(k)+':'+canonical(v)).join(',')+'}';return JSON.stringify(value)??'null';}
export function post<T extends {idempotencyKey:string;reason:string}>(user:Principal,kind:string,input:T,authorize:(tx:Transaction)=>Promise<unknown>,work:(tx:Transaction,operationId:string)=>Promise<unknown>){
 const hash=createHash('sha256').update(canonical({kind,input})).digest('hex');
 return warrantyAtomic(async tx=>{await authorize(tx);const existing=await tx.warrantyOperation.findUnique({where:{idempotencyKey:input.idempotencyKey}});if(existing){if(existing.actorId!==user.id||existing.requestHash!==hash)throw new ApiError(409,'IDEMPOTENCY_CONFLICT','Key belongs to a different actor/body/action');return existing.result;}
 const op=await tx.warrantyOperation.create({data:{idempotencyKey:input.idempotencyKey,kind,requestHash:hash,actorId:user.id,reason:input.reason,result:{}}});const result=json(await work(tx,op.id));await tx.warrantyOperation.update({where:{id:op.id},data:{result}});return result;});
}
export const registrationTransitions:Record<WarrantyRegistrationStatus,readonly WarrantyRegistrationStatus[]>={DRAFT:['PENDING_EVIDENCE','PENDING_REVIEW','VOIDED'],PENDING_EVIDENCE:['PENDING_EVIDENCE','PENDING_REVIEW','VOIDED'],PENDING_REVIEW:['ACTIVE','REJECTED','VOIDED'],ACTIVE:['VOIDED'],REJECTED:['VOIDED'],VOIDED:[]};
export const claimTransitions:Record<WarrantyClaimStatus,readonly WarrantyClaimStatus[]>={SUBMITTED:['UNDER_REVIEW','CANCELLED'],UNDER_REVIEW:['EVIDENCE_REQUIRED','ELIGIBLE','INELIGIBLE','APPROVED','DENIED','CANCELLED'],EVIDENCE_REQUIRED:['UNDER_REVIEW','CANCELLED'],ELIGIBLE:['SUBMITTED_TO_PROVIDER','APPROVED','DENIED','EVIDENCE_REQUIRED','CANCELLED'],INELIGIBLE:['CLOSED','UNDER_REVIEW','CANCELLED'],SUBMITTED_TO_PROVIDER:['PROVIDER_RESPONSE_PENDING','CANCELLED'],PROVIDER_RESPONSE_PENDING:['UNDER_REVIEW','EVIDENCE_REQUIRED','CANCELLED'],APPROVED:['RESOLVED'],DENIED:['CLOSED'],RESOLVED:['CLOSED'],CLOSED:[],CANCELLED:[]};
export async function history(tx:Transaction,user:Principal,regId:string,claimId:string|null,version:number,event:string,fromStatus:string|null,toStatus:string,reason:string,details:unknown={},operationId?:string){return tx.warrantyHistory.create({data:{registrationId:regId,claimId,entityKey:claimId??regId,version,actorId:user.id,event,fromStatus,toStatus,reason,details:json(details),operationId}});}
export async function saveRegistration(tx:Transaction,user:Principal,row:WarrantyRegistration,data:Prisma.WarrantyRegistrationUncheckedUpdateInput,event:string,reason:string,details:unknown={},op?:string){
 if(row.status==='VOIDED'||typeof data.status==='string'&&data.status!==row.status&&!registrationTransitions[row.status].includes(data.status))throw new ApiError(409,'REGISTRATION_TRANSITION','Invalid or terminal warranty transition');const result=await tx.warrantyRegistration.updateMany({where:{id:row.id,version:row.version},data:{...data,version:{increment:1}}});if(result.count!==1)throw new ApiError(409,'VERSION_CONFLICT','Registration changed');const current=await tx.warrantyRegistration.findUniqueOrThrow({where:{id:row.id}});await history(tx,user,row.id,null,current.version,event,row.status,current.status,reason,details,op);return current;
}
export async function saveClaim(tx:Transaction,user:Principal,row:WarrantyClaim,data:Prisma.WarrantyClaimUncheckedUpdateInput,event:string,reason:string,details:unknown={},op?:string,contentChanged=false){
 if(['CLOSED','CANCELLED'].includes(row.status)||typeof data.status==='string'&&data.status!==row.status&&!claimTransitions[row.status].includes(data.status))throw new ApiError(409,'CLAIM_TRANSITION','Invalid or terminal claim transition');const result=await tx.warrantyClaim.updateMany({where:{id:row.id,version:row.version},data:{...data,version:{increment:1},...(contentChanged?{contentRevision:{increment:1}}:{})}});if(result.count!==1)throw new ApiError(409,'VERSION_CONFLICT','Claim changed');const current=await tx.warrantyClaim.findUniqueOrThrow({where:{id:row.id}});await history(tx,user,row.registrationId,row.id,current.version,event,row.status,current.status,reason,details,op);return current;
}
export async function evidenceIds(tx:Transaction,regId:string,claimId:string|null,ids:string[]){if(await tx.warrantyEvidence.count({where:{registrationId:regId,claimId,id:{in:ids}}})!==ids.length||new Set(ids).size!==ids.length)throw new ApiError(422,'EVIDENCE_OWNERSHIP','Evidence must belong to this exact registration/claim');}
export const evidencePublic={id:true,registrationId:true,claimId:true,documentType:true,fileName:true,mimeType:true,sizeBytes:true,sha256:true,uploaderId:true,createdAt:true} as const;
export function publicRegistration<T extends WarrantyRegistration>(row:T){const{installationSnapshot:_internal,...safe}=row;return safe;}
export function reviewer(user:Principal,row:WarrantyClaim){caseWorker(user);if(user.role!=='ADMIN'&&row.responsibleReviewerId!==user.id)throw new ApiError(403,'CLAIM_REVIEWER_REQUIRED','Assigned internal reviewer required');}
