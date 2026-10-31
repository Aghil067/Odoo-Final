import {Prisma} from '@prisma/client';
import type {Transaction} from '../../lib/db.js';
import {atomic} from '../../lib/db.js';
import {ApiError} from '../../lib/http.js';
import type {Principal} from '../auth/auth.js';
import {json} from '../solar/common.js';
export {json};
export function admin(user:Principal){if(user.role!=='ADMIN')throw new ApiError(403,'WORKFORCE_ADMIN_REQUIRED','ADMIN workforce permission required');}
export function own(user:Principal,id:string){if(user.role!=='ADMIN'&&!(user.role==='TECHNICIAN'&&user.id===id))throw new ApiError(403,'WORKFORCE_SCOPE','Only ADMIN or this technician may access these records');}
export async function workforceAtomic<T>(work:(tx:Transaction)=>Promise<T>){try{return await atomic(work);}catch(e){if((e instanceof Prisma.PrismaClientKnownRequestError||e instanceof Prisma.PrismaClientUnknownRequestError)&&((e instanceof Prisma.PrismaClientKnownRequestError&&e.code==='P2004')||/23514|23P01|no_overlap/.test(e.message)))throw new ApiError(409,'WORKFORCE_CONSTRAINT','Workforce constraints rejected the change; check commitments, identity and effective dates');throw e;}}
export async function technician(tx:Transaction,id:string,active=false){const user=await tx.user.findFirst({where:{id,role:'TECHNICIAN',...(active?{isActive:true}:{})},select:{id:true,name:true,isActive:true,role:true}});if(!user)throw new ApiError(404,'TECHNICIAN_NOT_FOUND','Existing TECHNICIAN identity required');return user;}
export async function profile(tx:Transaction,id:string,version?:number){await technician(tx,id);const p=await tx.technicianProfile.findUnique({where:{userId:id}});if(!p)throw new ApiError(404,'PROFILE_REQUIRED','Create a workforce profile for the existing user');if(version!==undefined&&p.version!==version)throw new ApiError(409,'VERSION_CONFLICT','Workforce profile changed; refresh');return p;}
export async function lockUser(tx:Transaction,id:string){await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id"=${id}::uuid FOR UPDATE`;}
export async function audit(tx:Transaction,user:Principal,entityId:string,event:string,reason:string,details:unknown={},subjectUserId?:string,teamId?:string){await tx.technicianWorkforceAudit.create({data:{actorId:user.id,entityId,event,reason,details:json(details),subjectUserId,teamId}});}
export async function bump(tx:Transaction,id:string,version:number){return tx.technicianProfile.update({where:{userId:id,version},data:{version:{increment:1}}});}
export function bounds(start:Date,end:Date,maxDays=366){if(!Number.isFinite(start.getTime())||!Number.isFinite(end.getTime())||end<=start||end.getTime()-start.getTime()>maxDays*86400000)throw new ApiError(422,'INVALID_WORKFORCE_WINDOW',`Use a positive interval of at most ${maxDays} days`);}
export const committedJobs=['PLANNED','SITE_READY','IN_PROGRESS','ON_HOLD','WORK_COMPLETED','TESTING','COMMISSIONING_REVIEW','REWORK_REQUIRED'] as const;
