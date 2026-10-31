import {z} from 'zod';
import {ApiError} from '../../lib/http.js';
import type {Principal} from '../auth/auth.js';
import {admin,post,json,job} from './common.js';
import {civil,today} from './dates.js';
import * as v from './validation.js';
function validate(input:z.infer<typeof v.policyVersion>|z.infer<typeof v.policyCreate>){
 const workmanship=input.coverageType==='INSTALLER_WORKMANSHIP';
 if(workmanship?(input.providerType!=='INSTALLER'||input.applicableComponentId!==null||input.applicableCategory!==null):!!input.applicableComponentId===!!input.applicableCategory)throw new ApiError(422,'POLICY_TARGET','Workmanship is project/installer coverage; equipment policies require exactly one component or category');
 if(input.coverageType.startsWith('MANUFACTURER')&&input.providerType!=='MANUFACTURER')throw new ApiError(422,'POLICY_PROVIDER','Manufacturer coverage requires an explicitly configured manufacturer provider');
 if((input.durationUnit==='YEARS'&&input.duration>100)||(input.durationUnit==='MONTHS'&&input.duration>1200))throw new ApiError(422,'POLICY_DURATION','Supported maximum is100years/1200months/36600days, not a recommended warranty');
 if(input.effectiveTo&&civil(input.effectiveTo)<=civil(input.effectiveFrom))throw new ApiError(422,'POLICY_DATES','Policy effective range is positive and end-exclusive');
 if(civil(input.effectiveFrom)<today()&&!input.backdatingReason)throw new ApiError(422,'POLICY_BACKDATING_REASON','ADMIN must explicitly document retrospective policy effect');
}
function fields(input:z.infer<typeof v.policyVersion>|z.infer<typeof v.policyCreate>){const result=v.policyVersion.omit({version:true,idempotencyKey:true,reason:true}).parse(Object.fromEntries(Object.entries(input).filter(([k])=>k in v.policyFields)));return {...result,effectiveFrom:civil(result.effectiveFrom),effectiveTo:result.effectiveTo?civil(result.effectiveTo):null};}
export function createPolicy(user:Principal,input:z.infer<typeof v.policyCreate>){return post(user,'POLICY_CREATE',input,async()=>admin(user),async tx=>{
 validate(input);if(input.applicableComponentId)await tx.solarComponent.findUniqueOrThrow({where:{id:input.applicableComponentId}});const row=await tx.warrantyPolicy.create({data:{reference:input.reference,name:input.name,createdById:user.id}});const revision=await tx.warrantyPolicyVersion.create({data:{...fields(input),policyId:row.id,version:1,publishedById:user.id,publicationReason:input.reason}});return {policy:row,revision};
});}
export function publishPolicy(user:Principal,id:string,input:z.infer<typeof v.policyVersion>){return post(user,'POLICY_VERSION',{...input,policyId:id},async()=>admin(user),async tx=>{
 validate(input);const old=await tx.warrantyPolicy.findUniqueOrThrow({where:{id}});if(old.version!==input.version||!old.isActive)throw new ApiError(409,'POLICY_VERSION_CONFLICT','Publish only current active policy');const previous=await tx.warrantyPolicyVersion.findUniqueOrThrow({where:{policyId_version:{policyId:id,version:old.currentVersion}}});if(previous.coverageType!==input.coverageType||previous.providerType!==input.providerType)throw new ApiError(422,'POLICY_KIND_IMMUTABLE','Use a distinct policy reference for different coverage/provider type');const revision=await tx.warrantyPolicyVersion.create({data:{...fields(input),policyId:id,version:old.currentVersion+1,publishedById:user.id,publicationReason:input.reason}});const policy=await tx.warrantyPolicy.update({where:{id,version:input.version},data:{currentVersion:{increment:1},version:{increment:1}}});return {policy,revision};
});}
export function patchPolicy(user:Principal,id:string,input:z.infer<typeof v.policyPatch>){return post(user,'POLICY_RENAME',{...input,policyId:id},async()=>admin(user),async tx=>tx.warrantyPolicy.update({where:{id,version:input.version},data:{name:input.name,version:{increment:1}}}));}
export function deactivatePolicy(user:Principal,id:string,input:z.infer<typeof v.command>){return post(user,'POLICY_DEACTIVATE',{...input,policyId:id},async()=>admin(user),async tx=>tx.warrantyPolicy.update({where:{id,version:input.version},data:{isActive:false,version:{increment:1}}}));}
export function grantAccess(user:Principal,installationId:string,input:z.infer<typeof v.grant>){return post(user,'CASE_ACCESS_GRANT',{...input,installationId},async tx=>{admin(user);await job(tx,user,installationId);},async tx=>{
 if(!await tx.user.count({where:{id:input.userId,role:'SUPPORT',isActive:true}}))throw new ApiError(422,'SUPPORT_USER_REQUIRED','Grant explicit access to an active SUPPORT user');return tx.warrantyAccessGrant.upsert({where:{installationId_userId:{installationId,userId:input.userId}},create:{installationId,userId:input.userId,grantedById:user.id},update:{isActive:true,grantedById:user.id,version:{increment:1}}});
});}
export function revokeAccess(user:Principal,id:string,input:z.infer<typeof v.command>){return post(user,'CASE_ACCESS_REVOKE',{...input,grantId:id},async()=>admin(user),async tx=>tx.warrantyAccessGrant.update({where:{id,version:input.version},data:{isActive:false,version:{increment:1}}}));}
