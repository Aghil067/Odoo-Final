import {Prisma,WorkforcePurpose} from '@prisma/client';
import {z} from 'zod';
import type {Transaction} from '../../lib/db.js';
import {ApiError,pagination} from '../../lib/http.js';
import type {Principal} from '../auth/auth.js';
import {requireSurvey} from '../surveys/access.js';
import {admin,own,technician,workforceAtomic,committedJobs,bounds} from './common.js';
import {availabilityIn,commitments} from './availability.service.js';
import {overlaps} from './calendar.js';
import * as v from './validation.js';
const paging=(q:z.infer<typeof v.page>)=>({skip:(q.page-1)*q.pageSize,take:q.pageSize});
function privateProfile<T extends {privateNotes:string|null}>(p:T,user:Principal){if(user.role==='ADMIN')return p;const{privateNotes:_private,...safe}=p;return safe;}
export function profiles(user:Principal,q:z.infer<typeof v.list>){return workforceAtomic(async tx=>{
 if(!['ADMIN','TECHNICIAN'].includes(user.role))throw new ApiError(403,'WORKFORCE_SCOPE','Profiles are private workforce records');
 const where:Prisma.UserWhereInput={role:'TECHNICIAN',...(user.role==='TECHNICIAN'?{id:user.id}:{}),...(q.q?{name:{contains:q.q,mode:'insensitive'}}:{})};
 const rows=await tx.user.findMany({where,...paging(q),select:{id:true,name:true,isActive:true,technicianProfile:true},orderBy:[{name:'asc'},{id:'asc'}]});
 return {data:rows.map(r=>({...r,technicianProfile:r.technicianProfile?privateProfile(r.technicianProfile,user):null})),pagination:pagination(q.page,q.pageSize,await tx.user.count({where}))};
});}
export function detail(user:Principal,id:string){return workforceAtomic(async tx=>{own(user,id);const identity=await technician(tx,id);const p=await tx.technicianProfile.findUnique({where:{userId:id}});return {user:identity,profile:p?privateProfile(p,user):null};});}
export function catalog(user:Principal,q:z.infer<typeof v.list>){return workforceAtomic(async tx=>{
 if(!['ADMIN','TECHNICIAN'].includes(user.role))throw new ApiError(403,'WORKFORCE_SCOPE','Skill catalog workforce access required');const where:Prisma.SkillCatalogWhereInput={...(user.role==='ADMIN'?{}:{isActive:true}),...(q.q?{OR:[{code:{contains:q.q,mode:'insensitive'}},{name:{contains:q.q,mode:'insensitive'}}]}:{})};return {data:await tx.skillCatalog.findMany({where,...paging(q),orderBy:{code:'asc'}}),pagination:pagination(q.page,q.pageSize,await tx.skillCatalog.count({where}))};
});}
export function collection(user:Principal,id:string,q:z.infer<typeof v.page>,kind:'skills'|'certifications'|'schedule'|'exceptions'|'history'){return workforceAtomic(async tx=>{
 own(user,id);await technician(tx,id);const where={userId:id},p=paging(q);let data:unknown,total:number;
 if(kind==='skills'){data=await tx.technicianSkill.findMany({where,...p,include:{skill:true},orderBy:{id:'asc'}});total=await tx.technicianSkill.count({where});}
 else if(kind==='certifications'){data=await tx.technicianCertification.findMany({where,...p,orderBy:[{expiresAt:'desc'},{id:'asc'}]});total=await tx.technicianCertification.count({where});}
 else if(kind==='schedule'){data=await tx.technicianWorkSchedule.findMany({where,...p,include:{shifts:true},orderBy:[{effectiveFrom:'desc'},{id:'asc'}]});total=await tx.technicianWorkSchedule.count({where});}
 else if(kind==='exceptions'){data=await tx.technicianCalendarException.findMany({where,...p,orderBy:[{startsAt:'desc'},{id:'asc'}]});total=await tx.technicianCalendarException.count({where});}
 else{data=await tx.technicianWorkforceAudit.findMany({where:{subjectUserId:id},...p,orderBy:[{createdAt:'desc'},{id:'asc'}]});total=await tx.technicianWorkforceAudit.count({where:{subjectUserId:id}});}
 return {data,pagination:pagination(q.page,q.pageSize,total)};
});}
export function teams(user:Principal,q:z.infer<typeof v.page>){return workforceAtomic(async tx=>{
 if(!['ADMIN','TECHNICIAN'].includes(user.role))throw new ApiError(403,'WORKFORCE_SCOPE','Workforce team access required');const where:Prisma.TechnicianTeamWhereInput=user.role==='ADMIN'?{}:{memberships:{some:{userId:user.id,endedAt:null}}};return {data:await tx.technicianTeam.findMany({where,...paging(q),orderBy:{code:'asc'}}),pagination:pagination(q.page,q.pageSize,await tx.technicianTeam.count({where}))};
});}
export function teamDetail(user:Principal,id:string,q:z.infer<typeof v.page>,history=false){return workforceAtomic(async tx=>{
 if(user.role!=='ADMIN'&&!await tx.technicianTeamMembership.count({where:{teamId:id,userId:user.id,endedAt:null}}))throw new ApiError(404,'NOT_FOUND','Team not found');
 const team=await tx.technicianTeam.findUniqueOrThrow({where:{id}});
 if(history)return {team,data:await tx.technicianWorkforceAudit.findMany({where:{teamId:id},...paging(q),orderBy:[{createdAt:'desc'},{id:'asc'}]}),pagination:pagination(q.page,q.pageSize,await tx.technicianWorkforceAudit.count({where:{teamId:id}}))};
 const where={teamId:id,...(user.role==='ADMIN'?{}:{endedAt:null})};return {team,data:await tx.technicianTeamMembership.findMany({where,...paging(q),include:{user:{select:{id:true,name:true,isActive:true}}},orderBy:[{startedAt:'desc'},{id:'asc'}]}),pagination:pagination(q.page,q.pageSize,await tx.technicianTeamMembership.count({where}))};
});}
export function leaves(user:Principal,q:z.infer<typeof v.reportQuery>){return workforceAtomic(async tx=>{
 if(user.role!=='ADMIN')own(user,q.userId??user.id);const where={userId:user.role==='ADMIN'?q.userId:user.id};return {data:await tx.technicianLeave.findMany({where,...paging(q),orderBy:[{startsAt:'desc'},{id:'asc'}]}),pagination:pagination(q.page,q.pageSize,await tx.technicianLeave.count({where}))};
});}
async function availabilityScope(tx:Transaction,user:Principal,userId:string,purpose:WorkforcePurpose,surveyId?:string){
 if(user.role==='SALES'){if(!surveyId||purpose!=='SURVEY')throw new ApiError(403,'SURVEY_CONTEXT_REQUIRED','SALES availability requires an authorized survey context');await requireSurvey(tx,user,surveyId);}
 else own(user,userId);
}
function availabilityPublic<T extends Awaited<ReturnType<typeof availabilityIn>>>(data:T,user:Principal){if(user.role!=='SALES')return data;return {userId:data.userId,name:data.name,from:data.from,to:data.to,status:data.status,reasons:data.reasons,managed:data.managed,committable:data.committable&&data.status==='AVAILABLE',freeIntervals:data.freeIntervals};}
export function availability(user:Principal,id:string,q:z.infer<typeof v.window>){return workforceAtomic(async tx=>{await availabilityScope(tx,user,id,q.purpose,q.surveyId);return availabilityPublic(await availabilityIn(tx,id,new Date(q.from),new Date(q.to),[q.purpose]),user);});}
export function check(user:Principal,input:z.infer<typeof v.check>){return workforceAtomic(async tx=>{const data=[];for(const id of input.userIds){await availabilityScope(tx,user,id,input.purpose,input.surveyId);data.push(availabilityPublic(await availabilityIn(tx,id,new Date(input.from),new Date(input.to),[input.purpose]),user));}return data;});}
export function overview(user:Principal,q:z.infer<typeof v.availabilityList>){return workforceAtomic(async tx=>{
 bounds(new Date(q.from),new Date(q.to),7);if(user.role==='SALES'){if(!q.surveyId||q.purpose!=='SURVEY')throw new ApiError(403,'SURVEY_CONTEXT_REQUIRED','SALES availability needs its authorized survey');await requireSurvey(tx,user,q.surveyId);}else if(user.role!=='ADMIN'&&user.role!=='TECHNICIAN')throw new ApiError(403,'WORKFORCE_SCOPE','Availability access denied');
 const where:Prisma.UserWhereInput={role:'TECHNICIAN',...(user.role==='TECHNICIAN'?{id:user.id}:{})},users=await tx.user.findMany({where,...paging(q),select:{id:true},orderBy:{id:'asc'}});const data=[];for(const u of users)data.push(availabilityPublic(await availabilityIn(tx,u.id,new Date(q.from),new Date(q.to),[q.purpose]),user));return {data,pagination:pagination(q.page,q.pageSize,await tx.user.count({where}))};
});}
export function assignments(user:Principal,q:z.infer<typeof v.reportQuery>,kind:'SURVEY'|'INSTALLATION'){return workforceAtomic(async tx=>{
 if(user.role!=='ADMIN')own(user,q.userId??user.id);const id=user.role==='ADMIN'?q.userId:user.id;
 if(kind==='SURVEY'){const where={assignedToId:id??{not:null}};return {data:await tx.siteSurvey.findMany({where,...paging(q),select:{id:true,reference:true,assignedToId:true,status:true,scheduledAt:true,scheduledEndAt:true,expectedDurationMinutes:true},orderBy:[{createdAt:'desc'},{id:'asc'}]}),pagination:pagination(q.page,q.pageSize,await tx.siteSurvey.count({where})),source:'M02'};}
 const where={userId:id};return {data:await tx.installationAssignment.findMany({where,...paging(q),select:{id:true,userId:true,job:{select:{id:true,reference:true,status:true,plannedStartAt:true,plannedEndAt:true,actualStartAt:true,actualEndAt:true}}},orderBy:{id:'asc'}}),pagination:pagination(q.page,q.pageSize,await tx.installationAssignment.count({where})),source:'M05'};
});}
export function summary(user:Principal){return workforceAtomic(async tx=>{admin(user);return {activeTechnicians:await tx.user.count({where:{role:'TECHNICIAN',isActive:true,technicianProfile:{isActive:true,employmentStatus:'ACTIVE'}}}),unprofiledTechnicians:await tx.user.count({where:{role:'TECHNICIAN',technicianProfile:null}}),managedTechnicians:await tx.technicianProfile.count({where:{enforceScheduling:true}}),activeTeams:await tx.technicianTeam.count({where:{isActive:true}}),scheduledSurveys:await tx.siteSurvey.count({where:{status:{in:['SCHEDULED','IN_PROGRESS']}}}),assignedInstallations:await tx.installationJob.count({where:{status:{in:[...committedJobs]},assignments:{some:{}}}}),unassignedInstallations:await tx.installationJob.count({where:{status:{in:[...committedJobs]},assignments:{none:{}}}}),upcomingApprovedLeaves:await tx.technicianLeave.count({where:{status:'APPROVED',endsAt:{gt:new Date()}}}),expiredVerifiedCertifications:await tx.technicianCertification.count({where:{verification:'VERIFIED',expiresAt:{lte:new Date()}}}),skillCoverage:await tx.technicianSkill.groupBy({by:['skillId','verification'],_count:{_all:true}}),actualWorkedHours:null,utilizationPercent:null};});}
export function workload(user:Principal,q:z.infer<typeof v.reportQuery>){return workforceAtomic(async tx=>{
 if(user.role!=='ADMIN')own(user,q.userId??user.id);const where:Prisma.UserWhereInput={role:'TECHNICIAN',...(user.role==='ADMIN'?q.userId?{id:q.userId}:{}:{id:user.id})};const users=await tx.user.findMany({where,...paging(q),select:{id:true,name:true},orderBy:{id:'asc'}}),data=[];
 for(const u of users){const surveys=await tx.siteSurvey.findMany({where:{assignedToId:u.id,status:{in:['SCHEDULED','IN_PROGRESS']}},select:{scheduledAt:true,scheduledEndAt:true},take:501});data.push({...u,activeSurveyAssignments:await tx.siteSurvey.count({where:{assignedToId:u.id,status:{in:['REQUESTED','SCHEDULED','IN_PROGRESS','SUBMITTED','REVISION_REQUIRED']}}}),activeInstallationAssignments:await tx.installationAssignment.count({where:{userId:u.id,job:{status:{in:[...committedJobs]}}}}),approvedSurveysAsFinalAssignee:await tx.siteSurvey.count({where:{assignedToId:u.id,status:'APPROVED'}}),commissionedJobsAsFinalAssignee:await tx.installationAssignment.count({where:{userId:u.id,job:{status:'COMMISSIONED'}}}),plannedSurveyMinutes:surveys.length>500?null:surveys.reduce((n,s)=>n+(s.scheduledAt&&s.scheduledEndAt?(s.scheduledEndAt.getTime()-s.scheduledAt.getTime())/60000:0),0),actualWorkedHours:null,utilizationPercent:null,performanceScope:'ASSIGNMENT_COUNTS_NOT_LABOR_PRODUCTIVITY'});}
 return {data,pagination:pagination(q.page,q.pageSize,await tx.user.count({where}))};
});}
export function conflicts(user:Principal,q:z.infer<typeof v.availabilityList>){return workforceAtomic(async tx=>{
 admin(user);bounds(new Date(q.from),new Date(q.to),7);const where={role:'TECHNICIAN' as const},users=await tx.user.findMany({where,...paging(q),select:{id:true},orderBy:{id:'asc'}}),data=[];
 for(const u of users){const a=await availabilityIn(tx,u.id,new Date(q.from),new Date(q.to),[q.purpose]);const work=await commitments(tx,u.id,new Date(q.from),new Date(q.to));const p=await tx.technicianProfile.findUnique({where:{userId:u.id}});const rest=(p?.minimumRestMinutes??0)*60000,pairs=[];for(let i=0;i<work.rows.length;i++)for(let j=i+1;j<work.rows.length;j++){const left=work.rows[i]!,right=work.rows[j]!;if(overlaps(left,{start:right.start-rest,end:right.end+rest}))pairs.push({left:{kind:left.kind,id:left.id},right:{kind:right.kind,id:right.id},reason:'OVERLAP_OR_REST'});}const leaves=await tx.technicianLeave.findMany({where:{userId:u.id,status:'APPROVED',startsAt:{lt:new Date(q.to)},endsAt:{gt:new Date(q.from)}},select:{id:true,startsAt:true,endsAt:true},take:501});
 const blocks=await tx.technicianCalendarException.findMany({where:{userId:u.id,isActive:true,startsAt:{lt:new Date(q.to)},endsAt:{gt:new Date(q.from)}},select:{id:true,startsAt:true,endsAt:true},take:501});
 const unavailabilityConflicts=work.rows.flatMap(w=>[...leaves.map(l=>({...l,kind:'APPROVED_LEAVE'})),...blocks.map(b=>({...b,kind:'CALENDAR_BLOCK'}))].filter(b=>overlaps(w,{start:b.startsAt.getTime(),end:b.endsAt.getTime()})).map(b=>({work:{kind:w.kind,id:w.id},block:{kind:b.kind,id:b.id}})));
 data.push({userId:u.id,conflicts:pairs,unavailabilityConflicts,eligibilityWarnings:a.reasons.filter(r=>r!=='COMMITTED_WORK'),dataComplete:!work.truncated&&leaves.length<=500&&blocks.length<=500});}
 return {data,pagination:pagination(q.page,q.pageSize,await tx.user.count({where}))};
});}
export function recommendations(user:Principal,q:z.infer<typeof v.recommendations>){return workforceAtomic(async tx=>{
 admin(user);bounds(new Date(q.from),new Date(q.to),7);const where:Prisma.UserWhereInput={role:'TECHNICIAN',isActive:true,...(q.teamId?{technicianTeamMemberships:{some:{teamId:q.teamId,endedAt:null,team:{isActive:true}}}}:{})};const users=await tx.user.findMany({where,...paging(q),select:{id:true,name:true,technicianProfile:{select:{experienceMonths:true}}},orderBy:{id:'asc'}}),data=[];
 for(const u of users){const a=await availabilityIn(tx,u.id,new Date(q.from),new Date(q.to),[q.purpose]);data.push({userId:u.id,name:u.name,eligible:q.purpose==='SURVEY'?a.committable&&a.status==='AVAILABLE':a.coarseInstallationCommittable,availabilityStatus:a.status,reasons:a.reasons,activeAssignmentCount:a.activeAssignmentCount,experienceMonths:u.technicianProfile?.experienceMonths??null});}
 data.sort((a,b)=>Number(b.eligible)-Number(a.eligible)||a.activeAssignmentCount-b.activeAssignmentCount||(b.experienceMonths??-1)-(a.experienceMonths??-1)||a.userId.localeCompare(b.userId));return {data,pagination:pagination(q.page,q.pageSize,await tx.user.count({where})),rankingScope:'EXPLAINED_WITHIN_THIS_PAGE_NOT_ROUTE_OPTIMIZATION',automaticAssignment:false};
});}
