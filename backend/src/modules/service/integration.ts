import type {Transaction} from '../../lib/db.js';
import {ApiError} from '../../lib/http.js';
import type {Principal} from '../auth/auth.js';
import {commissionedRecord} from '../installations/review.service.js';
import {coverageIn} from '../warranties/read.service.js';
import {availabilityIn,assertStaffing,requiredSkills} from '../technicians/availability.service.js';
import {json} from './common.js';
import type {ServiceTicket} from '@prisma/client';
export async function installed(tx:Transaction,installationId:string,equipmentId:string|null,serialUnitId:string|null){
 const j=await tx.installationJob.findUniqueOrThrow({where:{id:installationId}}),h=await commissionedRecord(tx,j);
 if(!equipmentId){if(serialUnitId)throw new ApiError(422,'SERVICE_EQUIPMENT_REQUIRED','Select installed equipment with original serial');return h;}
 const e=h.equipment.find(e=>e.id===equipmentId);if(!e||e.installedQuantity.lte(0))throw new ApiError(422,'SERVICE_INSTALLED_EQUIPMENT','Use actual commissioned equipment');
 if(e.serializationRequired?(!serialUnitId||!e.serials.some(s=>s.serialUnitId===serialUnitId)):!!serialUnitId)throw new ApiError(422,'SERVICE_SERIAL_IDENTITY','Use the exact original installed serial for serialized equipment');return h;
}
export async function warranty(tx:Transaction,u:Principal,installationId:string,serialUnitId:string|null,equipmentId:string|null){
 try{const context=await coverageIn(tx,u,installationId,{page:1,pageSize:100},serialUnitId??undefined,equipmentId??undefined);return {capturedAt:new Date(),context,selection:{equipmentId,serialUnitId},coverageTruncated:context.pagination.totalItems>100,authority:'CONTEXT_ONLY_NOT_CLAIM_APPROVAL'};}
 catch(e){if(e instanceof ApiError&&[403,404].includes(e.status))return {capturedAt:new Date(),context:null,limitation:'M07_SCOPE_UNAVAILABLE_NOT_NO_COVERAGE'};throw e;}
}
export async function claimLink(tx:Transaction,u:Principal,id:string|null,installationId:string,equipmentId:string|null,serialUnitId:string|null){
 if(!id)return;
 if(u.role!=='ADMIN'&&!(u.role==='SUPPORT'&&await tx.warrantyAccessGrant.count({where:{installationId,userId:u.id,isActive:true}})))throw new ApiError(403,'SERVICE_WARRANTY_CLAIM_SCOPE','Separate M07 case permission required to link a claim');
 const c=await tx.warrantyClaim.findUniqueOrThrow({where:{id},include:{registration:true}}),r=c.registration;
 if(r.installationId!==installationId||r.equipmentId&&r.equipmentId!==equipmentId||r.serialUnitId&&r.serialUnitId!==serialUnitId)throw new ApiError(422,'SERVICE_CLAIM_IDENTITY','Warranty claim must concern this same installation/equipment identity');
}
export async function slaTerms(tx:Transaction,id:string|null,category:ServiceTicket['category'],priority:ServiceTicket['priority'],openedAt:Date){
 if(!id)return {slaPolicyId:null,slaSnapshot:json({configured:false,clock:'UNCONFIGURED'}),firstResponseDueAt:null,resolutionDueAt:null};
 const p=await tx.serviceSlaPolicy.findUniqueOrThrow({where:{id}});
 if(p.category!==category||p.priority!==priority||p.effectiveFrom>openedAt||p.effectiveTo&&p.effectiveTo<=openedAt)throw new ApiError(422,'SERVICE_SLA_POLICY','Select an effective policy for this category, priority and opening time');
 return {slaPolicyId:id,slaSnapshot:json(p),firstResponseDueAt:new Date(openedAt.getTime()+p.firstResponseMinutes*60000),resolutionDueAt:new Date(openedAt.getTime()+p.resolutionMinutes*60000)};
}
export async function schedule(tx:Transaction,r:ServiceTicket,userId:string,from:Date,to:Date,legacyAcknowledged:boolean,notes:string,excludeServiceVisitId?:string){
 if(to<=from||to.getTime()-from.getTime()>7*86400000)throw new ApiError(422,'SERVICE_VISIT_WINDOW','Use a positive visit window up to seven days');
 await assertStaffing(tx,userId,from,to,['SERVICE'],{excludeServiceVisitId,excludeServiceTicketId:r.id});await requiredSkills(tx,r.requiredSkillIds,userId,from,to);
 const result=await availabilityIn(tx,userId,from,to,['SERVICE'],{excludeServiceVisitId,excludeServiceTicketId:r.id});
 if(result.managed&&!result.committable)throw new ApiError(409,'SERVICE_AVAILABILITY','Managed service visits require full confirmed availability');
 if(!result.managed&&(!legacyAcknowledged||r.safetyConcern))throw new ApiError(409,'SERVICE_LEGACY_UNCERTAINTY','Legacy planning needs explicit uncertainty acknowledgement; safety-related work requires managed verified staffing');
 return json({availability:result,legacyUncertaintyAcknowledged:legacyAcknowledged,schedulingNotes:notes,confirmedAvailability:result.committable});
}
