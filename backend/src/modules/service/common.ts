import {createHash} from 'node:crypto';
import {Prisma,type ServiceTicket,type ServiceTicketStatus} from '@prisma/client';
import {atomic,type Transaction} from '../../lib/db.js';
import {ApiError} from '../../lib/http.js';
import type {Principal} from '../auth/auth.js';
import {leadScope} from '../crm/access.js';
import {json,Decimal} from '../solar/common.js';
export {json,Decimal};
export function admin(u:Principal){if(u.role!=='ADMIN')throw new ApiError(403,'SERVICE_ADMIN','ADMIN required');}
export function coordinate(u:Principal){if(!['ADMIN','SUPPORT'].includes(u.role))throw new ApiError(403,'SERVICE_COORDINATOR','Service coordinator required');}
export function projectScope(u:Principal):Prisma.InstallationJobWhereInput{if(u.role==='ADMIN')return {};if(u.role==='SUPPORT')return {serviceAccess:{some:{userId:u.id,role:'SUPPORT',isActive:true}}};throw new ApiError(403,'SERVICE_PROJECT_SCOPE','Explicit service project access required');}
export function scope(u:Principal,summary=false):Prisma.ServiceTicketWhereInput {
 if(u.role==='ADMIN')return {};
 if(u.role==='SUPPORT')return {installation:projectScope(u)};
 if(u.role==='TECHNICIAN')return {assignments:{some:{userId:u.id,endedAt:null}}};
 if(summary&&u.role==='SALES')return {installation:{lead:leadScope(u)}};
 throw new ApiError(403,'SERVICE_SCOPE','Service access denied');
}
export async function serviceAtomic<T>(work:(tx:Transaction)=>Promise<T>){try{return await atomic(work);}catch(e){if((e instanceof Prisma.PrismaClientKnownRequestError||e instanceof Prisma.PrismaClientUnknownRequestError)&&((e instanceof Prisma.PrismaClientKnownRequestError&&e.code==='P2004')||/23514|23P01/.test(e.message)))throw new ApiError(409,'SERVICE_CONSTRAINT','Service constraints rejected the change; refresh scope, version, lifecycle and scheduling');throw e;}}
export async function ticket(tx:Transaction,u:Principal,id:string,version?:number){const r=await tx.serviceTicket.findFirst({where:{AND:[{id},scope(u)]}});if(!r)throw new ApiError(404,'NOT_FOUND','Authorized service ticket not found');if(version!==undefined){await tx.$queryRaw`SELECT "id" FROM "ServiceTicket" WHERE "id"=${id}::uuid FOR UPDATE`;if(r.version!==version)throw new ApiError(409,'VERSION_CONFLICT','Ticket changed; refresh');}return r;}
export function mutable(r:ServiceTicket){if(['CLOSED','CANCELLED','RESOLVED'].includes(r.status))throw new ApiError(409,'SERVICE_FROZEN','Explicit reopening required before execution changes');}
const graph:Record<ServiceTicketStatus,readonly ServiceTicketStatus[]>={OPEN:['TRIAGED','CANCELLED'],TRIAGED:['ASSIGNED','RESOLVED','ON_HOLD','WAITING_FOR_CUSTOMER','WAITING_FOR_PARTS','CANCELLED'],ASSIGNED:['VISIT_SCHEDULED','RESOLVED','ON_HOLD','WAITING_FOR_CUSTOMER','WAITING_FOR_PARTS','CANCELLED'],VISIT_SCHEDULED:['IN_PROGRESS','ASSIGNED','ON_HOLD','WAITING_FOR_CUSTOMER','WAITING_FOR_PARTS','CANCELLED'],IN_PROGRESS:['VISIT_SCHEDULED','RESOLVED','ON_HOLD','WAITING_FOR_CUSTOMER','WAITING_FOR_PARTS','CANCELLED'],ON_HOLD:['TRIAGED','ASSIGNED','IN_PROGRESS','REOPENED','VISIT_SCHEDULED','CANCELLED'],WAITING_FOR_CUSTOMER:['TRIAGED','ASSIGNED','IN_PROGRESS','REOPENED','VISIT_SCHEDULED','CANCELLED'],WAITING_FOR_PARTS:['TRIAGED','ASSIGNED','IN_PROGRESS','REOPENED','VISIT_SCHEDULED','CANCELLED'],REOPENED:['TRIAGED','CANCELLED'],RESOLVED:['CLOSED','REOPENED'],CLOSED:['REOPENED'],CANCELLED:[]};
export const transitions=graph;
export async function history(tx:Transaction,u:Principal,r:ServiceTicket,event:string,reason:string,details:unknown,from:ServiceTicketStatus|null,op?:string){await tx.serviceTicketHistory.create({data:{ticketId:r.id,version:r.version,actorId:u.id,event,reason,details:json(details),fromStatus:from,toStatus:r.status,operationId:op}});}
export async function save(tx:Transaction,u:Principal,r:ServiceTicket,data:Prisma.ServiceTicketUncheckedUpdateInput,event:string,reason:string,details:unknown={},op?:string){
 if(r.status==='CANCELLED'||typeof data.status==='string'&&data.status!==r.status&&!graph[r.status].includes(data.status))throw new ApiError(409,'SERVICE_TRANSITION','Invalid service transition');
 const result=await tx.serviceTicket.updateMany({where:{id:r.id,version:r.version},data:{...data,version:{increment:1}}});if(result.count!==1)throw new ApiError(409,'VERSION_CONFLICT','Ticket changed');const current=await tx.serviceTicket.findUniqueOrThrow({where:{id:r.id}});await history(tx,u,current,event,reason,details,r.status,op);return current;
}
function canonical(x:unknown):string{if(Array.isArray(x))return '['+x.map(canonical).join(',')+']';if(x!==null&&typeof x==='object')return '{'+Object.entries(x).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>JSON.stringify(k)+':'+canonical(v)).join(',')+'}';return JSON.stringify(x)??'null';}
export function post<T extends {idempotencyKey:string;reason:string}>(u:Principal,kind:string,input:T,authorize:(tx:Transaction)=>Promise<unknown>,work:(tx:Transaction,op:string)=>Promise<unknown>){return serviceAtomic(async tx=>{await authorize(tx);const hash=createHash('sha256').update(canonical({kind,input})).digest('hex'),old=await tx.serviceOperation.findUnique({where:{idempotencyKey:input.idempotencyKey}});if(old){if(old.actorId!==u.id||old.requestHash!==hash)throw new ApiError(409,'IDEMPOTENCY_CONFLICT','Command key belongs to different actor/body/target');return old.result;}const op=await tx.serviceOperation.create({data:{idempotencyKey:input.idempotencyKey,kind,requestHash:hash,actorId:u.id,reason:input.reason,result:{}}});const result=json(await work(tx,op.id));await tx.serviceOperation.update({where:{id:op.id},data:{result}});return result;});}
export async function evidenceIds(tx:Transaction,r:ServiceTicket,ids:string[],visitId?:string){if(await tx.serviceEvidence.count({where:{ticketId:r.id,executionRevision:r.executionRevision,id:{in:ids},...(visitId?{visitId}:{})}})!==ids.length)throw new ApiError(422,'SERVICE_EVIDENCE_OWNER','Evidence must belong to current ticket cycle and exact visit when specified');}
export const evidenceSelect={id:true,ticketId:true,visitId:true,type:true,fileName:true,mimeType:true,sizeBytes:true,sha256:true,uploaderId:true,executionRevision:true,createdAt:true} as const;
export function publicTicket(r:ServiceTicket){const{warrantySnapshot:_private,...safe}=r;return safe;}
