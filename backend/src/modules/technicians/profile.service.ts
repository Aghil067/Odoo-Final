import {Prisma} from '@prisma/client';
import {z} from 'zod';
import {ApiError} from '../../lib/http.js';
import type {Principal} from '../auth/auth.js';
import {admin,own,technician,profile,workforceAtomic,audit,bump,lockUser,json,committedJobs} from './common.js';
import {validateExisting} from './availability.service.js';
import * as v from './validation.js';
export function createProfile(user:Principal,id:string,input:z.infer<typeof v.profile>){return workforceAtomic(async tx=>{
 admin(user);await lockUser(tx,id);await technician(tx,id,true);if(new Date(input.joinedAt)>new Date())throw new ApiError(422,'INVALID_JOIN_DATE','Joined date is an observed employment date');const{reason,emergencyContact,...fields}=input;
 const row=await tx.technicianProfile.create({data:{...fields,userId:id,joinedAt:new Date(input.joinedAt),emergencyContact:emergencyContact?json(emergencyContact):Prisma.DbNull}});
 await validateExisting(tx,id);await audit(tx,user,row.id,'PROFILE_CREATED',reason,{fields:Object.keys(fields)},id);return row;
});}
export function updateProfile(user:Principal,id:string,input:z.infer<typeof v.profilePatch>){return workforceAtomic(async tx=>{
 admin(user);await lockUser(tx,id);const old=await profile(tx,id,input.version);if(input.joinedAt&&new Date(input.joinedAt)>new Date())throw new ApiError(422,'INVALID_JOIN_DATE','Joined date cannot be future');const{version,reason,emergencyContact,...fields}=input;
 if(fields.isActive===false||fields.employmentStatus&&fields.employmentStatus!=='ACTIVE'){
  if(await tx.siteSurvey.count({where:{assignedToId:id,status:{in:['REQUESTED','SCHEDULED','IN_PROGRESS','SUBMITTED','REVISION_REQUIRED']}}})||await tx.installationAssignment.count({where:{userId:id,job:{status:{in:[...committedJobs]}}}})||await tx.technicianTeamMembership.count({where:{userId:id,endedAt:null}}))throw new ApiError(409,'TECHNICIAN_OBLIGATIONS','Resolve active assignments/team membership before deactivation');
 }
 const row=await tx.technicianProfile.update({where:{userId:id,version},data:{...fields,...(emergencyContact!==undefined?{emergencyContact:emergencyContact?json(emergencyContact):Prisma.DbNull}:{}),version:{increment:1}}});
 await validateExisting(tx,id);await audit(tx,user,old.id,'PROFILE_UPDATED',reason,{changedFields:Object.keys(input).filter(k=>!['version','reason'].includes(k))},id);return row;
});}
export function createCatalog(user:Principal,input:z.infer<typeof v.catalog>){return workforceAtomic(async tx=>{admin(user);const{reason,...data}=input;const row=await tx.skillCatalog.create({data});if(data.mandatoryFor.length&&await tx.technicianProfile.count({where:{enforceScheduling:true}}))throw new ApiError(409,'QUALIFICATION_POLICY_LOCKED','Introduce mandatory policy before enabling managed profiles, or explicitly resolve/disable managed policy first');await audit(tx,user,row.id,'SKILL_CATALOG_CREATED',reason,{code:row.code});return row;});}
export function updateCatalog(user:Principal,id:string,input:z.infer<typeof v.catalogPatch>){return workforceAtomic(async tx=>{
 admin(user);const old=await tx.skillCatalog.findUniqueOrThrow({where:{id}});if(old.version!==input.version)throw new ApiError(409,'VERSION_CONFLICT','Catalog changed');
 if(await tx.technicianProfile.count({where:{enforceScheduling:true}}))throw new ApiError(409,'QUALIFICATION_POLICY_LOCKED','Resolve/disable managed profiles explicitly before changing mandatory qualification policy');
 const{reason,version,...fields}=input;const row=await tx.skillCatalog.update({where:{id,version},data:{...fields,version:{increment:1}}});await audit(tx,user,id,'SKILL_CATALOG_UPDATED',reason,{fields:Object.keys(fields)});return row;
});}
export function putSkill(user:Principal,id:string,input:z.infer<typeof v.skill>){return workforceAtomic(async tx=>{
 own(user,id);await lockUser(tx,id);await profile(tx,id,input.version);const old=await tx.technicianSkill.findUnique({where:{userId_skillId:{userId:id,skillId:input.skillId}}});
 if(user.role!=='ADMIN'&&(input.verification!=='DECLARED'||old?.verification==='VERIFIED'))throw new ApiError(403,'SKILL_VERIFICATION_ADMIN','Self declarations cannot modify verified qualifications or mark verification');
 if(!await tx.skillCatalog.findFirst({where:{id:input.skillId,isActive:true}}))throw new ApiError(422,'SKILL_UNAVAILABLE','Use an active skill catalog entry');
 if(input.verification==='VERIFIED'&&!input.evidenceReference)throw new ApiError(422,'QUALIFICATION_EVIDENCE_REQUIRED','Verified qualifications need a trusted evidence reference');
 const data={level:input.level,experienceMonths:input.experienceMonths,verification:input.verification,evidenceReference:input.evidenceReference,verifiedById:input.verification==='VERIFIED'?user.id:null,verifiedAt:input.verification==='VERIFIED'?new Date():null};
 const row=await tx.technicianSkill.upsert({where:{userId_skillId:{userId:id,skillId:input.skillId}},create:{...data,userId:id,skillId:input.skillId},update:data});
 const p=await bump(tx,id,input.version);await validateExisting(tx,id);await audit(tx,user,row.id,'TECHNICIAN_SKILL_UPDATED',input.reason,{skillId:input.skillId,verification:input.verification,level:input.level},id);return {skill:row,profileVersion:p.version};
});}
export function createCertification(user:Principal,id:string,input:z.infer<typeof v.certification>){return workforceAtomic(async tx=>{
 own(user,id);await lockUser(tx,id);await profile(tx,id,input.version);if(user.role!=='ADMIN'&&input.verification!=='DECLARED')throw new ApiError(403,'CERTIFICATION_VERIFICATION_ADMIN','Only ADMIN verifies qualifications');
 if(!await tx.skillCatalog.findFirst({where:{id:input.skillId,isActive:true}}))throw new ApiError(422,'SKILL_UNAVAILABLE','Use an active skill catalog entry');
 if(new Date(input.expiresAt)<=new Date(input.issuedAt)||new Date(input.issuedAt)>new Date())throw new ApiError(422,'CERTIFICATION_DATES','Issue date must be observed, and expiry later than issue');
 const{version,reason,...fields}=input;const row=await tx.technicianCertification.create({data:{...fields,userId:id,issuedAt:new Date(input.issuedAt),expiresAt:new Date(input.expiresAt),verifiedById:input.verification==='VERIFIED'?user.id:null,verifiedAt:input.verification==='VERIFIED'?new Date():null}});const p=await bump(tx,id,version);await validateExisting(tx,id);await audit(tx,user,row.id,'CERTIFICATION_CREATED',reason,{skillId:input.skillId,verification:input.verification},id);return {certification:row,profileVersion:p.version};
});}
export function reviewCertification(user:Principal,id:string,certificateId:string,input:z.infer<typeof v.certificateReview>){return workforceAtomic(async tx=>{
 admin(user);await lockUser(tx,id);await profile(tx,id);const old=await tx.technicianCertification.findFirst({where:{id:certificateId,userId:id}});if(!old)throw new ApiError(404,'NOT_FOUND','Certification not found');
 if(old.version!==input.version)throw new ApiError(409,'VERSION_CONFLICT','Certification changed');
 const row=await tx.technicianCertification.update({where:{id:old.id,version:input.version},data:{verification:input.verification,verifiedById:input.verification==='VERIFIED'?user.id:null,verifiedAt:input.verification==='VERIFIED'?new Date():null,version:{increment:1}}});
 await validateExisting(tx,id);await audit(tx,user,row.id,'CERTIFICATION_REVIEWED',input.reason,{verification:input.verification},id);return row;
});}
