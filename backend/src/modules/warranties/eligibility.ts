import type {Transaction} from '../../lib/db.js';
import {ApiError} from '../../lib/http.js';
import type {WarrantyRegistration} from '@prisma/client';
import {commissionedRecord} from '../installations/review.service.js';
import {Decimal} from './common.js';
import {civil,today,expiry,addDays} from './dates.js';
export type Finding={code:string;message:string;kind:'BLOCKER'|'EVIDENCE'|'MANUAL'};
export async function installedIdentity(tx:Transaction,installationId:string,policyId:string,policyVersion:number,equipmentId:string|null,serialUnitId:string|null){
 const installation=await tx.installationJob.findUniqueOrThrow({where:{id:installationId}}),handoff=await commissionedRecord(tx,installation);
 const revision=await tx.warrantyPolicyVersion.findUniqueOrThrow({where:{policyId_version:{policyId,version:policyVersion}}});
 const policy=await tx.warrantyPolicy.findUniqueOrThrow({where:{id:policyId}});
 if(revision.coverageType==='INSTALLER_WORKMANSHIP'){
  if(equipmentId||serialUnitId)throw new ApiError(422,'WORKMANSHIP_IDENTITY','Workmanship covers the project/site, not an equipment serial');
  return {handoff,policy,revision,componentId:null,coverageQuantity:new Decimal(1),coverageKey:`${policyId}:${installationId}:WORKMANSHIP`};
 }
 const e=handoff.equipment.find(e=>e.id===equipmentId);if(!e)throw new ApiError(422,'INSTALLED_EQUIPMENT_REQUIRED','Select equipment from the commissioned installation');
 const component=await tx.solarComponent.findUniqueOrThrow({where:{id:e.componentId}});
 if(revision.applicableComponentId?revision.applicableComponentId!==component.id:revision.applicableCategory!==component.category)throw new ApiError(422,'POLICY_COMPONENT_MISMATCH','Policy target does not match this installed component');
 if(e.serializationRequired){if(!serialUnitId||!e.serials.some(s=>s.serialUnitId===serialUnitId&&s.installedAt))throw new ApiError(422,'INSTALLED_SERIAL_REQUIRED','Use the exact original installed serial identity');}
 else if(serialUnitId)throw new ApiError(422,'UNEXPECTED_SERIAL','Nonserialized equipment uses full installed quantity, without a fabricated serial');
 return {handoff,policy,revision,componentId:e.componentId,coverageQuantity:e.serializationRequired?new Decimal(1):new Decimal(e.installedQuantity),coverageKey:`${policyId}:${installationId}:${e.serializationRequired?'SERIAL:'+serialUnitId:'EQUIPMENT:'+e.id}`};
}
export async function activation(tx:Transaction,row:WarrantyRegistration){
 const identity=await installedIdentity(tx,row.installationId,row.policyId,row.policyVersion,row.equipmentId,row.serialUnitId),p=identity.revision,findings:Finding[]=[];
 const add=(code:string,message:string,kind:Finding['kind']='EVIDENCE')=>findings.push({code,message,kind});
 if(!identity.policy.isActive||identity.policy.currentVersion!==row.policyVersion)add('POLICY_SUPERSEDED_OR_INACTIVE','New activation requires the current active policy; void/re-register explicitly to change frozen terms','BLOCKER');
 if(identity.coverageKey!==row.coverageKey||identity.componentId!==row.componentId||!identity.coverageQuantity.eq(row.coverageQuantity)||identity.handoff.commissioningReviewId!==row.commissioningReviewId)add('INSTALLED_IDENTITY_MISMATCH','Reconcile the original approved installation/equipment identity','BLOCKER');
 const evidence=await tx.warrantyEvidence.findMany({where:{registrationId:row.id,claimId:null},select:{id:true,documentType:true},take:101});
 for(const type of p.requiredDocuments)if(!evidence.some(e=>e.documentType===type))add('REQUIRED_DOCUMENT_MISSING',`Policy requires ${type}`);
 let start:Date|null=null;
 if(p.startRule==='COMMISSIONING_DATE')start=identity.handoff.commissioningDate?civil(identity.handoff.commissioningDate):null;
 else if(p.startRule==='INSTALLATION_COMPLETION_DATE')start=identity.handoff.actualWorkEndAt?civil(identity.handoff.actualWorkEndAt):null;
 else if(p.startRule==='MANUFACTURER_REGISTRATION_DATE')start=row.providerRegisteredAt;
 else start=row.proposedStartDate;
 if(!start)add('START_DATE_UNKNOWN',`Reliable ${p.startRule} date is missing; dispatch/site receipt is not customer delivery`);
 const document=p.startRule==='DELIVERY_DATE'?'DELIVERY_PROOF':p.startRule==='PURCHASE_DATE'?'PURCHASE_PROOF':p.startRule==='MANUAL_VERIFIED_DATE'?'OTHER':p.startRule==='MANUFACTURER_REGISTRATION_DATE'?'MANUFACTURER_REGISTRATION':null;
 if(document&&(!evidence.some(e=>e.documentType===document)||!row.dateSourceNotes))add('START_EVIDENCE_REQUIRED',`External start rule requires ${document} and source-verification notes`);
 const providerRequired=p.requiresProviderRegistration||p.startRule==='MANUFACTURER_REGISTRATION_DATE';
 if(providerRequired&&(!row.providerRegistrationReference||!row.providerRegisteredAt||!evidence.some(e=>e.documentType==='MANUFACTURER_REGISTRATION')))add('PROVIDER_REGISTRATION_REQUIRED','Actual provider registration reference/date/confirmation is required');
 if(row.providerRegisteredAt&&row.providerRegisteredAt>today())add('FUTURE_PROVIDER_DATE','Provider registration must be an observed date','BLOCKER');
 if(start){
  if(start>today())add('FUTURE_START_DATE','Observed warranty start must not be future','BLOCKER');
  if(start<p.effectiveFrom||p.effectiveTo&&start>=p.effectiveTo)add('POLICY_EFFECTIVE_RANGE','Start date falls outside the frozen policy effective range','BLOCKER');
  if(p.registrationDeadlineDays!==null){const filed=providerRequired?row.providerRegisteredAt:civil(row.createdAt);if(!filed)add('REGISTRATION_DEADLINE_UNKNOWN','Required registration date is unknown');else if(filed>addDays(start,p.registrationDeadlineDays))add('REGISTRATION_DEADLINE_MISSED','Explicit policy registration deadline was missed','BLOCKER');}
 }
 return {findings,startDate:start,expiryDate:start?expiry(start,p.duration,p.durationUnit):null,startRule:p.startRule,calendarSemantics:'UTC_CIVIL_START_INCLUSIVE_EXPIRY_EXCLUSIVE_CLAMP_MONTH_END',dateSource:p.startRule==='DELIVERY_DATE'?'EXTERNAL_DELIVERY_PROOF_NOT_M04_DISPATCH_OR_M05_SITE_RECEIPT':p.startRule,identity};
}
