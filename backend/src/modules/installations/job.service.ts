import {assertStaffing,installationPurposes} from '../technicians/availability.service.js';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { ApiError } from '../../lib/http.js';
import type { Principal } from '../auth/auth.js';
import { admin,ownerUser,installationAtomic,json,requireJob,saveJob,exactHandoff } from './common.js';
import { validateTestPlan,requiredMilestones,ready,workComplete,publicJob } from './policy.js';
import * as v from './validation.js';
export function createJob(user:Principal,input:z.infer<typeof v.create>){return installationAtomic(async tx=>{
 admin(user);await ownerUser(tx,input.coordinatorId,'ADMIN');for(const id of input.technicianIds)await ownerUser(tx,id,'TECHNICIAN');
 if(new Date(input.plannedEndAt)<new Date(input.plannedStartAt))throw new ApiError(422,'INVALID_DATES','Planned end must not precede start');
 const configuration=await tx.solarConfiguration.findUniqueOrThrow({where:{id:input.configurationId}});
 const identity={...input,customerId:configuration.customerId,siteId:configuration.siteId,leadId:configuration.leadId};
 const handoff=await exactHandoff(tx,identity);
 if(handoff.dispatch.lines.some(l=>l.returnedQuantity.gt(0)))throw new ApiError(409,'DISPATCH_RETURNED','A returned dispatch cannot initialize a full installation');
 if(await tx.installationJob.count({where:{leadId:configuration.leadId,siteId:configuration.siteId,status:{not:'CANCELED'}}}))throw new ApiError(409,'PROJECT_ALREADY_INSTALLED','An installation already exists for this lead/site');
 const categories=handoff.approved.bom.lines.map(l=>l.category);validateTestPlan(input.testRequirements,categories);
 for(const userId of [...input.technicianIds].sort())await assertStaffing(tx,userId,new Date(input.plannedStartAt),new Date(input.plannedEndAt),installationPurposes(categories));
 const row=await tx.installationJob.create({data:{reference:`INS-${randomUUID()}`,name:input.name,customerId:configuration.customerId,siteId:configuration.siteId,leadId:configuration.leadId,configurationId:configuration.id,configurationApprovedVersion:input.configurationApprovedVersion,configurationReviewId:input.configurationReviewId,bomId:input.bomId,bomVersion:input.bomVersion,reservationId:input.reservationId,dispatchId:input.dispatchId,handoffSnapshot:json(handoff),testRequirements:json(input.testRequirements),plannedStartAt:new Date(input.plannedStartAt),plannedEndAt:new Date(input.plannedEndAt),coordinatorId:input.coordinatorId,createdById:user.id,siteReadinessNotes:input.siteReadinessNotes,safetyNotes:input.safetyNotes}});
 await tx.installationAssignment.createMany({data:input.technicianIds.map(userId=>({jobId:row.id,userId}))});
 await tx.installationMilestone.createMany({data:requiredMilestones(categories).map(m=>({...m,jobId:row.id,checks:{approvedDesignFollowed:false,safetyChecked:false,evidenceReviewed:false},evidenceIds:[]}))});
 for(const line of handoff.dispatch.lines){
  const c=await tx.solarComponent.findUniqueOrThrow({where:{id:line.reservationLine.componentId}});
  const bomLine=handoff.approved.bom.lines.find(l=>l.id===line.reservationLine.bomLineId)!;
  const serials=await tx.inventorySerialUnit.findMany({where:{id:{in:line.serialUnitIds},componentId:c.id,dispatchLineId:line.id,state:'DISPATCHED'}});
  if(c.serializationRequired?(!line.quantity.eq(serials.length)||serials.length!==line.serialUnitIds.length):line.serialUnitIds.length>0)throw new ApiError(409,'DISPATCH_SERIAL_MISMATCH','Dispatch serials are not available for this installation');
  const equipment=await tx.installationEquipment.create({data:{jobId:row.id,dispatchLineId:line.id,componentId:c.id,unit:bomLine.unit,serializationRequired:c.serializationRequired,dispatchedQuantity:line.quantity}});
  if(serials.length)await tx.installationEquipmentSerial.createMany({data:serials.map(s=>({equipmentId:equipment.id,serialUnitId:s.id}))});
 }
 await tx.installationStatusHistory.create({data:{jobId:row.id,actorId:user.id,event:'CREATED',toStatus:'PLANNED',jobVersion:1,reason:input.reason,details:json({dispatchId:input.dispatchId,coordinatorId:input.coordinatorId,technicianIds:input.technicianIds})}});
 return publicJob(row);
});}
export function updateJob(user:Principal,id:string,input:z.infer<typeof v.patch>){return installationAtomic(async tx=>{
 const row=await requireJob(tx,user,id,input.version,true);
 const {version:_v,reason,testRequirements,...fields}=input;
 if(['WORK_COMPLETED','TESTING'].includes(row.status)&&Object.keys(fields).some(k=>k!=='completionNotes'))throw new ApiError(409,'PLAN_FROZEN','Edit plan before work completion or through rework');
 if(testRequirements){admin(user);if(row.actualStartAt)throw new ApiError(409,'TEST_PLAN_FROZEN','Test plan is fixed when installation starts');const h=await exactHandoff(tx,row);validateTestPlan(testRequirements,h.approved.bom.lines.map(l=>l.category));}
 if((fields.plannedStartAt||fields.plannedEndAt)&&user.role!=='ADMIN')throw new ApiError(403,'ADMIN_REQUIRED','ADMIN coordinates planning dates');
 if(new Date(fields.plannedEndAt??row.plannedEndAt)<new Date(fields.plannedStartAt??row.plannedStartAt))throw new ApiError(422,'INVALID_DATES','Planned end must not precede start');
 if(fields.plannedStartAt||fields.plannedEndAt){const handoff=await exactHandoff(tx,row);const assignments=await tx.installationAssignment.findMany({where:{jobId:id},orderBy:{userId:'asc'}});for(const assignment of assignments)await assertStaffing(tx,assignment.userId,new Date(fields.plannedStartAt??row.plannedStartAt),new Date(fields.plannedEndAt??row.plannedEndAt),installationPurposes(handoff.approved.bom.lines.map(l=>l.category)),{excludeJobId:id});}
 return publicJob(await saveJob(tx,user,row,{...fields,...(testRequirements?{testRequirements:json(testRequirements)}:{})},'JOB_UPDATED',reason,{fields:Object.keys(fields),testRequirements:testRequirements??null},true));
});}
export function assign(user:Principal,id:string,input:z.infer<typeof v.assign>){return installationAtomic(async tx=>{
 admin(user);const row=await requireJob(tx,user,id,input.version,true);await ownerUser(tx,input.coordinatorId,'ADMIN');for(const userId of input.technicianIds)await ownerUser(tx,userId,'TECHNICIAN');
 const responsible=await tx.installationMilestone.findMany({where:{jobId:id,responsibleUserId:{not:null}}});
 if(responsible.some(m=>m.responsibleUserId!==input.coordinatorId&&!input.technicianIds.includes(m.responsibleUserId!)))throw new ApiError(409,'MILESTONE_ASSIGNEE_IN_USE','Reassign milestone responsibilities before removing that user');
 const handoff=await exactHandoff(tx,row);for(const userId of [...input.technicianIds].sort())await assertStaffing(tx,userId,row.plannedStartAt,row.plannedEndAt,installationPurposes(handoff.approved.bom.lines.map(l=>l.category)),{excludeJobId:id});
 await tx.installationAssignment.deleteMany({where:{jobId:id}});await tx.installationAssignment.createMany({data:input.technicianIds.map(userId=>({jobId:id,userId}))});
 return publicJob(await saveJob(tx,user,row,{coordinatorId:input.coordinatorId},'ASSIGNED',input.reason,{coordinatorId:input.coordinatorId,technicianIds:input.technicianIds}));
});}
export function transition(user:Principal,id:string,action:'start'|'hold'|'resume'|'submit-completion'|'begin-testing'|'cancel'|'request-rework',input:z.infer<typeof v.command>){return installationAtomic(async tx=>{
 const row=await requireJob(tx,user,id,input.version,true);
 let data:Parameters<typeof saveJob>[3]={};
 if(action==='start'){if(row.status!=='SITE_READY'&&row.status!=='REWORK_REQUIRED')throw new ApiError(409,'INVALID_TRANSITION','Start only ready/rework jobs');await ready(tx,row);data={status:'IN_PROGRESS',actualStartAt:row.actualStartAt??new Date(),actualEndAt:null};}
 if(action==='hold'){if(!['IN_PROGRESS','TESTING','WORK_COMPLETED','REWORK_REQUIRED'].includes(row.status))throw new ApiError(409,'INVALID_TRANSITION','Hold execution/testing/rework only');data={status:'ON_HOLD',resumeStatus:row.status};}
 if(action==='resume'){if(row.status!=='ON_HOLD'||!row.resumeStatus)throw new ApiError(409,'INVALID_TRANSITION','No held state to resume');await ready(tx,row);data={status:row.resumeStatus,resumeStatus:null};}
 if(action==='submit-completion'){if(!['IN_PROGRESS','REWORK_REQUIRED'].includes(row.status))throw new ApiError(409,'INVALID_TRANSITION','Complete active/rework execution only');await workComplete(tx,row);data={status:'WORK_COMPLETED',actualEndAt:new Date()};}
 if(action==='begin-testing'){if(row.status!=='WORK_COMPLETED')throw new ApiError(409,'INVALID_TRANSITION','Complete work before testing');await workComplete(tx,row);data={status:'TESTING'};}
 if(action==='request-rework'){if(!['WORK_COMPLETED','TESTING','ON_HOLD'].includes(row.status))throw new ApiError(409,'INVALID_TRANSITION','Request explicit rework from completed/testing/held work');data={status:'REWORK_REQUIRED',actualEndAt:null,resumeStatus:null};}
 if(action==='cancel'){admin(user);if(await tx.installationEquipment.count({where:{jobId:id,installedQuantity:{gt:0}}}))throw new ApiError(409,'INSTALLED_EQUIPMENT_LOCK','Cancellation cannot orphan installed equipment; corrective removal workflow is not implemented');data={status:'CANCELED',resumeStatus:null};}
 return publicJob(await saveJob(tx,user,row,data,action.toUpperCase().replaceAll('-','_'),input.reason,{},action==='request-rework'));
});}
