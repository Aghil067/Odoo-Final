import {randomUUID} from 'node:crypto';
import {z} from 'zod';
import {ApiError} from '../../lib/http.js';
import type {Principal} from '../auth/auth.js';
import {admin,caseWorker,post,job,registration,saveRegistration,history,json,publicRegistration,evidencePublic} from './common.js';
import {installedIdentity,activation} from './eligibility.js';
import {civil,today,effective} from './dates.js';
import * as v from './validation.js';
export function createRegistration(user:Principal,input:z.infer<typeof v.registration>){return post(user,'REGISTRATION_CREATE',input,async tx=>{caseWorker(user);await job(tx,user,input.installationId);},async(tx,op)=>{
 const identity=await installedIdentity(tx,input.installationId,input.policyId,input.policyVersion,input.equipmentId,input.serialUnitId);
 if(!identity.policy.isActive||identity.policy.currentVersion!==input.policyVersion)throw new ApiError(409,'POLICY_CURRENT_VERSION_REQUIRED','Use current active policy version');
 if(await tx.warrantyRegistration.count({where:{coverageKey:identity.coverageKey,status:{notIn:['REJECTED','VOIDED']}}}))throw new ApiError(409,'DUPLICATE_COVERAGE','This exact policy/installed identity already has nonvoid coverage');
 const row=await tx.warrantyRegistration.create({data:{reference:`WAR-${randomUUID()}`,coverageKey:identity.coverageKey,customerId:identity.handoff.customerId,siteId:identity.handoff.siteId,installationId:input.installationId,commissioningReviewId:identity.handoff.commissioningReviewId,policyId:input.policyId,policyVersion:input.policyVersion,coverageType:identity.revision.coverageType,equipmentId:input.equipmentId,componentId:identity.componentId,serialUnitId:input.serialUnitId,coverageQuantity:identity.coverageQuantity,policySnapshot:json({...identity.revision,policyReference:identity.policy.reference,policyName:identity.policy.name}),installationSnapshot:json(identity.handoff),registeredById:user.id}});
 await history(tx,user,row.id,null,1,'REGISTERED',null,'DRAFT',input.reason,{policyVersion:row.policyVersion,coverageKey:row.coverageKey},op);return publicRegistration(row);
});}
export function editRegistration(user:Principal,id:string,input:z.infer<typeof v.registrationPatch>){return post(user,'REGISTRATION_EVIDENCE_DETAILS',{...input,registrationId:id},async tx=>{caseWorker(user);await registration(tx,user,id);},async(tx,op)=>{
 const row=await registration(tx,user,id,input.version);if(!['DRAFT','PENDING_EVIDENCE'].includes(row.status))throw new ApiError(409,'REGISTRATION_FROZEN','Edit evidence dates/references before review; active terms require explicit void/re-registration');
 if(input.proposedStartDate&&civil(input.proposedStartDate)>today()||input.providerRegisteredAt&&civil(input.providerRegisteredAt)>today())throw new ApiError(422,'FUTURE_EVIDENCE_DATE','Record observed dates only');
 return publicRegistration(await saveRegistration(tx,user,row,{proposedStartDate:input.proposedStartDate?civil(input.proposedStartDate):null,dateSourceNotes:input.dateSourceNotes,providerRegistrationReference:input.providerRegistrationReference,providerRegisteredAt:input.providerRegisteredAt?civil(input.providerRegisteredAt):null},'EVIDENCE_DETAILS_UPDATED',input.reason,{fields:['proposedStartDate','dateSourceNotes','providerRegistrationReference','providerRegisteredAt']},op));
});}
export function submitRegistration(user:Principal,id:string,input:z.infer<typeof v.command>){return post(user,'REGISTRATION_SUBMIT',{...input,registrationId:id},async tx=>{caseWorker(user);await registration(tx,user,id);},async(tx,op)=>{
 const row=await registration(tx,user,id,input.version);if(!['DRAFT','PENDING_EVIDENCE'].includes(row.status))throw new ApiError(409,'REGISTRATION_NOT_EDITABLE','Submit only draft/pending-evidence registration');const result=await activation(tx,row),status=result.findings.length?'PENDING_EVIDENCE':'PENDING_REVIEW';
 const current=await saveRegistration(tx,user,row,{status},'SUBMITTED',input.reason,{findings:result.findings,startRule:result.startRule,candidateStart:result.startDate,candidateExpiry:result.expiryDate},op);return {registration:publicRegistration(current),activation:{findings:result.findings,startDate:result.startDate,expiryDate:result.expiryDate,startRule:result.startRule,calendarSemantics:result.calendarSemantics}};
});}
export function reviewRegistration(user:Principal,id:string,input:z.infer<typeof v.registrationReview>){return post(user,'REGISTRATION_REVIEW',{...input,registrationId:id},async tx=>{admin(user);await registration(tx,user,id);},async(tx,op)=>{
 const row=await registration(tx,user,id,input.version);if(row.status!=='PENDING_REVIEW')throw new ApiError(409,'REGISTRATION_NOT_SUBMITTED','Review exact pending-review version');
 if(row.registeredById===user.id||await tx.warrantyHistory.count({where:{registrationId:id,claimId:null,actorId:user.id,event:{not:'REVIEWED'}}}))throw new ApiError(403,'INDEPENDENT_REVIEW_REQUIRED','Independent ADMIN must verify registration');
 const result=await activation(tx,row);
 if(input.decision==='ACTIVE'&&(result.findings.length||!result.startDate||!result.expiryDate||!Object.values(input.checklist).every(Boolean)))throw new ApiError(422,'ACTIVATION_BLOCKED','Resolve activation findings and verify all registration evidence checks');
 const evidence=await tx.warrantyEvidence.findMany({where:{registrationId:id,claimId:null},select:evidencePublic});
 const decision=await tx.warrantyDecision.create({data:{registrationId:id,entityKey:id,reviewedVersion:row.version,reviewerId:user.id,operationId:op,decision:input.decision,notes:input.notes,checklist:json(input.checklist),snapshot:json({registration:publicRegistration(row),evidence,activation:{findings:result.findings,startDate:result.startDate,expiryDate:result.expiryDate,startRule:result.startRule}})}});
 const current=await saveRegistration(tx,user,row,{status:input.decision,...(input.decision==='ACTIVE'?{verifiedStartDate:result.startDate,expiresAt:result.expiryDate,approvedById:user.id,approvedVersion:row.version,activatedAt:decision.createdAt}:{})},'REVIEWED',input.reason,{decisionId:decision.id,notes:input.notes},op);return {registration:publicRegistration(current),decision};
});}
export function voidRegistration(user:Principal,id:string,input:z.infer<typeof v.command>){return post(user,'REGISTRATION_VOID',{...input,registrationId:id},async tx=>{admin(user);await registration(tx,user,id);},async(tx,op)=>{
 const row=await registration(tx,user,id,input.version);const decision=await tx.warrantyDecision.create({data:{registrationId:id,entityKey:id,reviewedVersion:row.version,reviewerId:user.id,operationId:op,decision:'VOIDED',notes:input.reason,checklist:{},snapshot:json(publicRegistration(row))}});return publicRegistration(await saveRegistration(tx,user,row,{status:'VOIDED'},'VOIDED',input.reason,{decisionId:decision.id,priorEffectiveStatus:effective(row)},op));
});}
