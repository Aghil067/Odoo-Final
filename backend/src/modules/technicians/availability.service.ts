import {WorkforcePurpose} from '@prisma/client';
import type {Transaction} from '../../lib/db.js';
import {ApiError} from '../../lib/http.js';
import {bounds,committedJobs,lockUser,technician} from './common.js';
import {coverage,merge,minutes,overlaps,subtract,type Interval} from './calendar.js';
export type SourceOptions={excludeSurveyId?:string;excludeJobId?:string;excludeServiceVisitId?:string;excludeServiceTicketId?:string};
export async function commitments(tx:Transaction,userId:string,from:Date,to:Date,options:SourceOptions={}){
 const surveys=await tx.siteSurvey.findMany({where:{assignedToId:userId,id:{not:options.excludeSurveyId},status:{in:['SCHEDULED','IN_PROGRESS']},scheduledAt:{lt:to},scheduledEndAt:{gt:from}},select:{id:true,reference:true,status:true,scheduledAt:true,scheduledEndAt:true,expectedDurationMinutes:true},take:501,orderBy:{id:'asc'}});
 const installations=await tx.installationAssignment.findMany({where:{userId,jobId:{not:options.excludeJobId},job:{status:{in:[...committedJobs]},plannedStartAt:{lt:to},plannedEndAt:{gt:from}}},select:{job:{select:{id:true,reference:true,status:true,plannedStartAt:true,plannedEndAt:true}}},take:501,orderBy:{jobId:'asc'}});
 const rows=[...surveys.filter(s=>s.scheduledAt&&s.scheduledEndAt).map(s=>({kind:'SURVEY' as 'SURVEY'|'INSTALLATION'|'SERVICE',id:s.id,reference:s.reference,start:s.scheduledAt!.getTime(),end:s.scheduledEndAt!.getTime()})),...installations.map(a=>({kind:'INSTALLATION' as const,id:a.job.id,reference:a.job.reference,start:a.job.plannedStartAt.getTime(),end:a.job.plannedEndAt.getTime()}))];
 const services=await tx.serviceVisit.findMany({where:{userId,id:{not:options.excludeServiceVisitId},status:{in:['SCHEDULED','IN_PROGRESS']},scheduledStartAt:{lt:to},scheduledEndAt:{gt:from}},select:{id:true,scheduledStartAt:true,scheduledEndAt:true,ticket:{select:{reference:true}}},take:501,orderBy:{id:'asc'}});
 rows.push(...services.map(s=>({kind:'SERVICE' as const,id:s.id,reference:s.ticket.reference,start:s.scheduledStartAt.getTime(),end:s.scheduledEndAt.getTime()})));
 return {surveys,installations,services,rows,truncated:surveys.length>500||installations.length>500||services.length>500};
}
export async function availabilityIn(tx:Transaction,userId:string,from:Date,to:Date,purposes:WorkforcePurpose[],options:SourceOptions={}){
 bounds(from,to,7);const user=await technician(tx,userId),p=await tx.technicianProfile.findUnique({where:{userId}});
 const window={start:from.getTime(),end:to.getTime()},rest=(p?.minimumRestMinutes??0)*60000;
 const work=await commitments(tx,userId,new Date(window.start-rest),new Date(window.end+rest),options);
 const schedules=await tx.technicianWorkSchedule.findMany({where:{userId,isActive:true,effectiveFrom:{lt:to},effectiveTo:{gt:from}},include:{shifts:true},take:101});
 const cal=coverage(schedules,from,to),known=minutes(merge(schedules.map(s=>({start:Math.max(window.start,s.effectiveFrom.getTime()),end:Math.min(window.end,s.effectiveTo.getTime())}))))>=minutes([window])&&schedules.length<=100;
 const leaves=await tx.technicianLeave.findMany({where:{userId,status:'APPROVED',startsAt:{lt:to},endsAt:{gt:from}},select:{id:true,startsAt:true,endsAt:true},take:501});
 const exceptions=await tx.technicianCalendarException.findMany({where:{userId,isActive:true,startsAt:{lt:to},endsAt:{gt:from}},select:{id:true,startsAt:true,endsAt:true},take:501});
 const requirements=await tx.skillCatalog.findMany({where:{isActive:true,mandatoryFor:{hasSome:purposes}},include:{skills:{where:{userId}},certifications:{where:{userId,verification:'VERIFIED',issuedAt:{lte:from},expiresAt:{gte:to}}}},take:101});
 const missingQualifications=requirements.filter(r=>!r.skills.some(s=>s.verification==='VERIFIED'&&s.level>=r.minimumLevel)||(r.requiresCertification&&!r.certifications.length)).map(r=>({skillId:r.id,code:r.code,certificationRequired:r.requiresCertification}));
 const activeCount=await tx.siteSurvey.count({where:{assignedToId:userId,id:{not:options.excludeSurveyId},status:{in:['REQUESTED','SCHEDULED','IN_PROGRESS','SUBMITTED','REVISION_REQUIRED']}}})+await tx.installationAssignment.count({where:{userId,jobId:{not:options.excludeJobId},job:{status:{in:[...committedJobs]}}}});
 const unknownCount=await tx.siteSurvey.count({where:{assignedToId:userId,id:{not:options.excludeSurveyId},status:{in:['REQUESTED','SCHEDULED','IN_PROGRESS','REVISION_REQUIRED']},OR:[{scheduledAt:null},{scheduledEndAt:null},{status:'IN_PROGRESS',scheduledEndAt:{lte:from}}]}})+await tx.installationAssignment.count({where:{userId,jobId:{not:options.excludeJobId},job:{status:{in:[...committedJobs]},OR:[{plannedEndAt:{lte:from},status:{in:['IN_PROGRESS','ON_HOLD','REWORK_REQUIRED']}},{plannedStartAt:{equals:tx.installationJob.fields.plannedEndAt}}]}}});
 const serviceCount=await tx.serviceAssignment.count({where:{userId,endedAt:null,ticketId:{not:options.excludeServiceTicketId},ticket:{status:{notIn:['RESOLVED','CLOSED','CANCELLED']}}}});
 const untimedServiceCount=await tx.serviceAssignment.count({where:{userId,endedAt:null,ticketId:{not:options.excludeServiceTicketId},ticket:{status:{notIn:['RESOLVED','CLOSED','CANCELLED']},visits:{none:{status:{in:['SCHEDULED','IN_PROGRESS']}}}}}});
 const overdueServiceCount=await tx.serviceVisit.count({where:{userId,id:{not:options.excludeServiceVisitId},status:'IN_PROGRESS',scheduledEndAt:{lte:from}}});
 const conflicts=work.rows.filter(r=>overlaps(window,{start:r.start-rest,end:r.end+rest}));
 const blocked:Interval[]=[...conflicts.map(r=>({start:r.start-rest,end:r.end+rest})),...leaves.map(l=>({start:l.startsAt.getTime(),end:l.endsAt.getTime()})),...exceptions.map(l=>({start:l.startsAt.getTime(),end:l.endsAt.getTime()}))];
 const free=subtract(cal.intervals,blocked),shiftMinutes=minutes(cal.intervals),freeMinutes=minutes(free);
 const reasons:string[]=[];
 if(!user.isActive||(p&&(!p.isActive||p.employmentStatus!=='ACTIVE')))reasons.push('INACTIVE');
 if(!p)reasons.push('PROFILE_MISSING');if(!known)reasons.push('CALENDAR_INCOMPLETE');if(cal.ambiguous)reasons.push('AMBIGUOUS_LOCAL_TIME');if(unknownCount+overdueServiceCount+untimedServiceCount)reasons.push('UNTIMED_OR_OVERDUE_WORK');
 if(work.truncated||leaves.length>500||exceptions.length>500||requirements.length>100)reasons.push('DATA_LIMIT');if(missingQualifications.length)reasons.push('QUALIFICATION_REQUIRED');if(purposes.some(p=>!requirements.some(r=>r.mandatoryFor.includes(p))))reasons.push('QUALIFICATION_POLICY_MISSING');
 if(p&&activeCount+serviceCount>=p.maxActiveAssignments)reasons.push('CAPACITY_LIMIT');if(conflicts.length)reasons.push('COMMITTED_WORK');if(leaves.length)reasons.push('APPROVED_LEAVE');if(exceptions.length)reasons.push('CALENDAR_BLOCK');
 const uncertain=reasons.some(r=>['PROFILE_MISSING','CALENDAR_INCOMPLETE','AMBIGUOUS_LOCAL_TIME','UNTIMED_OR_OVERDUE_WORK','DATA_LIMIT'].includes(r));
 const fullLeave=minutes(leaves.map(l=>({start:Math.max(window.start,l.startsAt.getTime()),end:Math.min(window.end,l.endsAt.getTime())})))>=minutes([window]);
 const status=reasons.includes('INACTIVE')?'INACTIVE':fullLeave?'ON_LEAVE':uncertain?'UNKNOWN':missingQualifications.length||reasons.includes('QUALIFICATION_POLICY_MISSING')?'NEEDS_REVIEW':leaves.length&&freeMinutes===0?'ON_LEAVE':reasons.includes('CAPACITY_LIMIT')?'BUSY':!shiftMinutes?'OFF_SHIFT':!freeMinutes?'BUSY':freeMinutes<minutes([window])?'PARTIALLY_AVAILABLE':'AVAILABLE';
 const blockers=reasons.filter(r=>r!=='');
 return {userId,name:user.name,from:from.toISOString(),to:to.toISOString(),purposes,status,reasons,managed:p?.enforceScheduling??false,committable:!!p?.enforceScheduling&&blockers.length===0&&freeMinutes>=minutes([window]),coarseInstallationCommittable:!!p?.enforceScheduling&&blockers.length===0&&freeMinutes>0,shiftMinutes,availableShiftMinutes:freeMinutes,plannedOccupiedShiftMinutes:shiftMinutes-freeMinutes,freeIntervals:free.map(r=>({from:new Date(r.start).toISOString(),to:new Date(r.end).toISOString()})),conflicts:conflicts.map(r=>({kind:r.kind,id:r.id,reference:r.reference,from:new Date(r.start).toISOString(),to:new Date(r.end).toISOString()})),missingQualifications,activeAssignmentCount:activeCount+serviceCount,untimedOrOverdueAssignmentCount:unknownCount+overdueServiceCount+untimedServiceCount,teamMembership:await tx.technicianTeamMembership.findFirst({where:{userId,endedAt:null,team:{isActive:true}},select:{teamId:true}}),teamObligationPolicy:'INDIVIDUAL_SOURCE_ASSIGNMENTS_ONLY',installationWindowPolicy:'EXCLUSIVE_PLANNING_SPAN_NOT_WORKED_HOURS',utilizationPercent:null};
}
export async function assertStaffing(tx:Transaction,userId:string,from:Date,to:Date,purposes:WorkforcePurpose[],options:SourceOptions={}){
 bounds(from,to);await lockUser(tx,userId);await technician(tx,userId,true);const p=await tx.technicianProfile.findUnique({where:{userId}});
 if(p&&(!p.isActive||p.employmentStatus!=='ACTIVE'))throw new ApiError(409,'TECHNICIAN_INACTIVE','Technician workforce profile is inactive');
 if(await tx.serviceVisit.count({where:{userId,id:{not:options.excludeServiceVisitId},status:'IN_PROGRESS',scheduledEndAt:{lte:from}}}))throw new ApiError(409,'WORKFORCE_OVERDUE_SERVICE','Finish observed overdue service visit before committing more work');
 const rest=(p?.minimumRestMinutes??0)*60000,work=await commitments(tx,userId,new Date(from.getTime()-rest),new Date(to.getTime()+rest),options);
 if(work.truncated||work.rows.some(r=>overlaps({start:from.getTime(),end:to.getTime()},{start:r.start-rest,end:r.end+rest})))throw new ApiError(409,'WORKFORCE_BUSY','Committed survey/installation overlaps this planning window or required rest');
 if(await tx.technicianLeave.count({where:{userId,status:'APPROVED',startsAt:{lt:to},endsAt:{gt:from}}})||await tx.technicianCalendarException.count({where:{userId,isActive:true,startsAt:{lt:to},endsAt:{gt:from}}}))throw new ApiError(409,'WORKFORCE_UNAVAILABLE','Approved leave or calendar block conflicts with committed work');
 if(p?.enforceScheduling){const result=await availabilityIn(tx,userId,from,to,purposes,options);const coarse=purposes.some(p=>p!=='SURVEY'&&p!=='SERVICE');if(!(coarse?result.coarseInstallationCommittable:result.committable&&result.status==='AVAILABLE'))throw new ApiError(409,'WORKFORCE_ELIGIBILITY','Managed technician needs known calendar coverage, current verified qualifications and capacity; inspect availability');}
}
export async function validateExisting(tx:Transaction,userId:string){
 const now=new Date(),surveys=await tx.siteSurvey.findMany({where:{assignedToId:userId,status:{in:['SCHEDULED','IN_PROGRESS']},scheduledEndAt:{gt:now}},select:{id:true,scheduledAt:true,scheduledEndAt:true},take:101});
 const assignments=await tx.installationAssignment.findMany({where:{userId,job:{status:{in:[...committedJobs]},plannedEndAt:{gt:now}}},include:{job:{include:{equipment:{select:{component:{select:{category:true}}}}}}},take:101});
 if(surveys.length>100||assignments.length>100)throw new ApiError(409,'WORKFORCE_REVIEW_REQUIRED','Too many commitments for atomic revalidation');
 for(const s of surveys)if(s.scheduledAt&&s.scheduledEndAt)await assertStaffing(tx,userId,s.scheduledAt,s.scheduledEndAt,['SURVEY'],{excludeSurveyId:s.id});
 for(const a of assignments)await assertStaffing(tx,userId,a.job.plannedStartAt,a.job.plannedEndAt,installationPurposes(a.job.equipment.map(e=>e.component.category)),{excludeJobId:a.jobId});
 const services=await tx.serviceVisit.findMany({where:{userId,status:{in:['SCHEDULED','IN_PROGRESS']},scheduledEndAt:{gt:now}},include:{ticket:true},take:101});
 if(services.length>100)throw new ApiError(409,'WORKFORCE_REVIEW_REQUIRED','Too many service commitments for atomic revalidation');
 for(const s of services){await assertStaffing(tx,userId,s.scheduledStartAt,s.scheduledEndAt,['SERVICE'],{excludeServiceVisitId:s.id,excludeServiceTicketId:s.ticketId});await requiredSkills(tx,s.ticket.requiredSkillIds,userId,s.scheduledStartAt,s.scheduledEndAt);}
}
export function installationPurposes(categories:string[]):WorkforcePurpose[]{return ['PV_INSTALLATION',...(categories.includes('INVERTER')?['INVERTER' as const]:[]),...(categories.includes('BATTERY')?['BATTERY' as const]:[]),'COMMISSIONING'];}

export async function requiredSkills(tx:Transaction,skillIds:string[],userId:string,from:Date,to:Date){
 const rows=await tx.skillCatalog.findMany({where:{id:{in:skillIds},isActive:true},include:{skills:{where:{userId,verification:'VERIFIED'}},certifications:{where:{userId,verification:'VERIFIED',issuedAt:{lte:from},expiresAt:{gte:to}}}}});
 if(rows.length!==skillIds.length||rows.some(s=>!s.skills.some(q=>q.level>=s.minimumLevel)||s.requiresCertification&&!s.certifications.length))throw new ApiError(409,'SERVICE_REQUIRED_QUALIFICATION','Current verified triage skills/certifications must cover work window');
}
