import {z} from 'zod';
import {ApiError} from '../../lib/http.js';
import type {Principal} from '../auth/auth.js';
import {admin,profile,technician,workforceAtomic,audit,lockUser} from './common.js';
import * as v from './validation.js';
export function createTeam(user:Principal,input:z.infer<typeof v.team>){return workforceAtomic(async tx=>{admin(user);const row=await tx.technicianTeam.create({data:{code:input.code,name:input.name}});await audit(tx,user,row.id,'TEAM_CREATED',input.reason,{},undefined,row.id);return row;});}
export function updateTeam(user:Principal,id:string,input:z.infer<typeof v.teamPatch>){return workforceAtomic(async tx=>{
 admin(user);const old=await tx.technicianTeam.findUniqueOrThrow({where:{id}});if(old.version!==input.version)throw new ApiError(409,'VERSION_CONFLICT','Team changed');
 if(input.leadId){await technician(tx,input.leadId,true);const p=await profile(tx,input.leadId);if(!p.isActive||p.employmentStatus!=='ACTIVE'||!await tx.technicianTeamMembership.count({where:{teamId:id,userId:input.leadId,endedAt:null}}))throw new ApiError(422,'TEAM_LEAD_MEMBERSHIP','Lead must be an eligible active member');}
 if(input.isActive===false&&(await tx.technicianTeamMembership.count({where:{teamId:id,endedAt:null}})||input.leadId!==null&&old.leadId!==null))throw new ApiError(409,'TEAM_OBLIGATIONS','Clear lead and close memberships before team deactivation; installation assignments remain separate');
 const{version,reason,...fields}=input;const row=await tx.technicianTeam.update({where:{id,version},data:{...fields,version:{increment:1}}});await audit(tx,user,id,'TEAM_UPDATED',reason,{fields:Object.keys(fields)},undefined,id);return row;
});}
export function addMember(user:Principal,id:string,input:z.infer<typeof v.member>){return workforceAtomic(async tx=>{
 admin(user);await lockUser(tx,input.userId);await technician(tx,input.userId,true);const p=await profile(tx,input.userId);const t=await tx.technicianTeam.findUniqueOrThrow({where:{id}});
 if(!t.isActive||!p.isActive||p.employmentStatus!=='ACTIVE')throw new ApiError(409,'TEAM_OR_TECHNICIAN_INACTIVE','Join only active team/technician profiles');if(t.version!==input.version)throw new ApiError(409,'VERSION_CONFLICT','Team changed');
 if(await tx.technicianTeamMembership.count({where:{userId:input.userId,endedAt:null}}))throw new ApiError(409,'ACTIVE_TEAM_MEMBERSHIP','Only one active team per technician');
 const member=await tx.technicianTeamMembership.create({data:{teamId:id,userId:input.userId}});const team=await tx.technicianTeam.update({where:{id,version:input.version},data:{version:{increment:1}}});await audit(tx,user,member.id,'TEAM_MEMBER_ADDED',input.reason,{},input.userId,id);return {team,member};
});}
export function removeMember(user:Principal,id:string,userId:string,input:z.infer<typeof v.command>){return workforceAtomic(async tx=>{
 admin(user);await lockUser(tx,userId);const t=await tx.technicianTeam.findUniqueOrThrow({where:{id}});if(t.version!==input.version)throw new ApiError(409,'VERSION_CONFLICT','Team changed');if(t.leadId===userId)throw new ApiError(409,'TEAM_LEAD_IN_USE','Clear or change team lead before removing membership');
 const member=await tx.technicianTeamMembership.findFirst({where:{teamId:id,userId,endedAt:null}});if(!member)throw new ApiError(404,'NOT_FOUND','Active membership not found');
 await tx.technicianTeamMembership.update({where:{id:member.id},data:{endedAt:new Date()}});const team=await tx.technicianTeam.update({where:{id,version:input.version},data:{version:{increment:1}}});await audit(tx,user,member.id,'TEAM_MEMBER_REMOVED',input.reason,{},userId,id);return team;
});}
