import {z} from 'zod';
import {ApiError} from '../../lib/http.js';
import type {Principal} from '../auth/auth.js';
import {admin,own,technician,profile,workforceAtomic,audit,bump,lockUser,bounds} from './common.js';
import {commitments,validateExisting} from './availability.service.js';
import * as v from './validation.js';
export function putSchedule(user:Principal,id:string,input:z.infer<typeof v.schedule>){return workforceAtomic(async tx=>{
 admin(user);await lockUser(tx,id);await profile(tx,id,input.version);const from=new Date(input.effectiveFrom),to=new Date(input.effectiveTo);bounds(from,to);
 const shifts=[...input.shifts].sort((a,b)=>a.weekday-b.weekday||a.startMinute-b.startMinute);for(let i=1;i<shifts.length;i++){const a=shifts[i-1]!,b=shifts[i]!;if(a.weekday===b.weekday&&a.endMinute>b.startMinute)throw new ApiError(422,'SHIFT_OVERLAP','Weekly shifts cannot overlap; split overnight shifts into separate dated-day definitions');}
 if(input.replaceScheduleId){const old=await tx.technicianWorkSchedule.findFirst({where:{id:input.replaceScheduleId,userId:id,isActive:true}});if(!old)throw new ApiError(404,'NOT_FOUND','Active schedule to replace not found');await tx.technicianWorkSchedule.update({where:{id:old.id},data:{isActive:false}});}
 if(await tx.technicianWorkSchedule.count({where:{userId:id,isActive:true,effectiveFrom:{lt:to},effectiveTo:{gt:from}}}))throw new ApiError(409,'SCHEDULE_OVERLAP','Effective schedules must not overlap');
 const schedule=await tx.technicianWorkSchedule.create({data:{userId:id,timezone:input.timezone,effectiveFrom:from,effectiveTo:to,shifts:{create:input.shifts}},include:{shifts:true}});
 const p=await bump(tx,id,input.version);await validateExisting(tx,id);await audit(tx,user,schedule.id,'SCHEDULE_CREATED',input.reason,{replacedScheduleId:input.replaceScheduleId??null,timezone:input.timezone,effectiveFrom:from,effectiveTo:to},id);return {schedule,profileVersion:p.version};
});}
export function createException(user:Principal,id:string,input:z.infer<typeof v.exception>){return workforceAtomic(async tx=>{
 admin(user);await lockUser(tx,id);await profile(tx,id,input.version);const from=new Date(input.startsAt),to=new Date(input.endsAt);bounds(from,to);
 const work=await commitments(tx,id,from,to);if(work.rows.length||work.truncated)throw new ApiError(409,'COMMITTED_ASSIGNMENT_CONFLICT','Reschedule/reassign actual M02/M05 work before blocking this interval');
 const row=await tx.technicianCalendarException.create({data:{userId:id,startsAt:from,endsAt:to,kind:input.kind,reason:input.reason}});const p=await bump(tx,id,input.version);await audit(tx,user,row.id,'CALENDAR_EXCEPTION_CREATED',input.reason,{kind:input.kind,startsAt:from,endsAt:to},id);return {exception:row,profileVersion:p.version};
});}
export function cancelException(user:Principal,id:string,exceptionId:string,input:z.infer<typeof v.command>){return workforceAtomic(async tx=>{
 admin(user);await lockUser(tx,id);const p=await profile(tx,id);const old=await tx.technicianCalendarException.findFirst({where:{id:exceptionId,userId:id,isActive:true}});if(!old)throw new ApiError(404,'NOT_FOUND','Active calendar exception not found');if(old.version!==input.version)throw new ApiError(409,'VERSION_CONFLICT','Exception changed');
 const row=await tx.technicianCalendarException.update({where:{id:old.id,version:input.version},data:{isActive:false,version:{increment:1}}});await bump(tx,id,p.version);await audit(tx,user,row.id,'CALENDAR_EXCEPTION_CANCELLED',input.reason,{},id);return row;
});}
export function requestLeave(user:Principal,input:z.infer<typeof v.leave>){return workforceAtomic(async tx=>{
 own(user,input.userId);await lockUser(tx,input.userId);await technician(tx,input.userId,true);await profile(tx,input.userId);const from=new Date(input.startsAt),to=new Date(input.endsAt);bounds(from,to);
 if(await tx.technicianLeave.count({where:{userId:input.userId,status:{in:['REQUESTED','APPROVED']},startsAt:{lt:to},endsAt:{gt:from}}}))throw new ApiError(409,'LEAVE_OVERLAP','Pending/approved leave cannot overlap');
 const row=await tx.technicianLeave.create({data:{userId:input.userId,startsAt:from,endsAt:to,category:input.category,privateNotes:input.privateNotes}});await audit(tx,user,row.id,'LEAVE_REQUESTED',input.reason,{startsAt:from,endsAt:to},input.userId);return row;
});}
export function reviewLeave(user:Principal,id:string,input:z.infer<typeof v.leaveReview>){return workforceAtomic(async tx=>{
 admin(user);const old=await tx.technicianLeave.findUniqueOrThrow({where:{id}});await lockUser(tx,old.userId);if(old.version!==input.version||old.status!=='REQUESTED')throw new ApiError(409,'LEAVE_STATE_CONFLICT','Review only the current requested leave');
 if(input.decision==='APPROVED'){const work=await commitments(tx,old.userId,old.startsAt,old.endsAt);if(work.rows.length||work.truncated)throw new ApiError(409,'COMMITTED_ASSIGNMENT_CONFLICT','Explicitly reschedule/reassign actual M02/M05 work before approving leave');}
 const row=await tx.technicianLeave.update({where:{id,version:input.version,status:'REQUESTED'},data:{status:input.decision,reviewedById:user.id,reviewedAt:new Date(),decisionNotes:input.decisionNotes,version:{increment:1}}});await audit(tx,user,id,'LEAVE_REVIEWED',input.reason,{decision:input.decision},old.userId);return row;
});}
export function cancelLeave(user:Principal,id:string,input:z.infer<typeof v.command>){return workforceAtomic(async tx=>{
 const old=await tx.technicianLeave.findUniqueOrThrow({where:{id}});own(user,old.userId);await lockUser(tx,old.userId);if(old.version!==input.version||!['REQUESTED','APPROVED'].includes(old.status)||old.status==='APPROVED'&&old.startsAt<=new Date())throw new ApiError(409,'LEAVE_STATE_CONFLICT','Cancel pending leave or approved leave before it begins');
 const row=await tx.technicianLeave.update({where:{id,version:input.version},data:{status:'CANCELLED',version:{increment:1}}});await audit(tx,user,id,'LEAVE_CANCELLED',input.reason,{},old.userId);return row;
});}
