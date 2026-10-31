import { z } from 'zod';
import { ApiError } from '../../lib/http.js';
import type { Principal } from '../auth/auth.js';
import { installationAtomic,requireJob,saveJob,evidence,json,Decimal,blockingIssues,admin,exactHandoff } from './common.js';
import { ready,publicJob } from './policy.js';
import * as v from './validation.js';
export function siteReadiness(user:Principal,id:string,input:z.infer<typeof v.readiness>){return installationAtomic(async tx=>{
 const row=await requireJob(tx,user,id,input.version,true);await evidence(tx,id,input.evidenceIds);
 if(await tx.installationReadiness.count({where:{jobId:id}})>=100)throw new ApiError(409,'RECORD_LIMIT','At most 100 readiness records per job');
 await tx.installationReadiness.create({data:{jobId:id,actorId:user.id,checklist:json(input.checklist),notes:input.notes,conditionalWorkResolution:input.conditionalWorkResolution,outstandingIssues:input.outstandingIssues,evidenceIds:input.evidenceIds,jobVersion:row.version}});
 const complete=Object.values(input.checklist).every(Boolean)&&!input.outstandingIssues;
 let status=row.status;
 if(row.status==='PLANNED'&&complete){try{await ready(tx,row);status='SITE_READY';}catch(e){if(!(e instanceof ApiError&&['SITE_RECEIPT_REQUIRED','EQUIPMENT_NOT_RECONCILED','SERIAL_NOT_RECONCILED','BLOCKING_ISSUES'].includes(e.code)))throw e;}}
 if(!complete&&row.status==='SITE_READY')status='PLANNED';
 return publicJob(await saveJob(tx,user,row,{status},'SITE_READINESS',input.reason,{checklist:input.checklist,notes:input.notes,conditionalWorkResolution:input.conditionalWorkResolution,outstandingIssues:input.outstandingIssues,evidenceIds:input.evidenceIds},true));
});}
export function confirmReceipt(user:Principal,id:string,input:z.infer<typeof v.receipt>){return installationAtomic(async tx=>{
 const row=await requireJob(tx,user,id,input.version,true);
 if(!['PLANNED','SITE_READY','ON_HOLD'].includes(row.status))throw new ApiError(409,'RECEIPT_PLAN_FROZEN','Record/update site receipt before starting, or while on hold');
 const {dispatch}=await exactHandoff(tx,row);const receivedAt=new Date(input.receivedAt);
 if(receivedAt>new Date()||receivedAt<dispatch.dispatchedAt)throw new ApiError(422,'INVALID_RECEIPT_DATE','Site receipt must be between warehouse release and now');
 await evidence(tx,id,input.evidenceIds);
 const equipment=await tx.installationEquipment.findMany({where:{jobId:id},include:{serials:{include:{serialUnit:true}}}});
 if(input.lines.length!==equipment.length||new Set(input.lines.map(l=>l.equipmentId)).size!==equipment.length)throw new ApiError(422,'RECEIPT_LINES_REQUIRED','Provide cumulative verification for every original dispatch line once');
 for(const line of input.lines){
  const e=equipment.find(e=>e.id===line.equipmentId);if(!e)throw new ApiError(422,'EQUIPMENT_OWNERSHIP','Equipment must belong to this job');
  const received=new Decimal(line.receivedQuantity),damaged=new Decimal(line.damagedQuantity),d=dispatch.lines.find(d=>d.id===e.dispatchLineId)!;
  if(received.plus(damaged).gt(new Decimal(e.dispatchedQuantity).minus(d.returnedQuantity))||received.lt(e.installedQuantity))throw new ApiError(422,'RECEIPT_QUANTITY','Usable plus damaged cannot exceed unreturned dispatch; usable cannot drop below installed');
  if((['PCS','SET','PAIR'].includes(e.unit)||e.serializationRequired)&&(!received.isInteger()||!damaged.isInteger()))throw new ApiError(422,'FRACTIONAL_EQUIPMENT','Counted equipment requires whole quantities');
  if(e.serializationRequired){
   const all=[...line.receivedSerialIds,...line.damagedSerialIds];
   if(!received.eq(line.receivedSerialIds.length)||!damaged.eq(line.damagedSerialIds.length)||new Set(all).size!==all.length||all.some(s=>!e.serials.some(x=>x.serialUnitId===s&&x.serialUnit.state==='DISPATCHED'&&x.serialUnit.dispatchLineId===d.id)))throw new ApiError(422,'RECEIPT_SERIAL_MISMATCH','Verify distinct original currently dispatched serials for usable/damaged counts');
   if(e.serials.some(s=>s.installedAt&&!line.receivedSerialIds.includes(s.serialUnitId)))throw new ApiError(409,'INSTALLED_SERIAL_LOCK','Installed serial verification cannot be removed');
   for(const serial of e.serials)await tx.installationEquipmentSerial.update({where:{id:serial.id},data:{received:line.receivedSerialIds.includes(serial.serialUnitId),damaged:line.damagedSerialIds.includes(serial.serialUnitId)}});
  }else if(line.receivedSerialIds.length||line.damagedSerialIds.length)throw new ApiError(422,'UNEXPECTED_SERIALS','Nonserialized equipment must omit serials');
  await tx.installationEquipment.update({where:{id:e.id},data:{receivedQuantity:received,damagedQuantity:damaged}});
  const missing=new Decimal(e.dispatchedQuantity).minus(received).minus(damaged).minus(d.returnedQuantity);
  for(const type of ['EQUIPMENT_MISSING','EQUIPMENT_DAMAGED'] as const){
   if((type==='EQUIPMENT_MISSING'?missing:damaged).gt(0)&&!await tx.installationIssue.count({where:{jobId:id,equipmentId:e.id,type,status:'OPEN'}})){
    if(await tx.installationIssue.count({where:{jobId:id}})>=500)throw new ApiError(409,'RECORD_LIMIT','At most 500 issues per job');
    await tx.installationIssue.create({data:{jobId:id,equipmentId:e.id,type,severity:'HIGH',blocking:true,description:`Site receipt reports ${type==='EQUIPMENT_MISSING'?missing.toString():damaged.toString()} ${e.unit}; receipt evidence retained`,reportedById:user.id,evidenceIds:input.evidenceIds}});
   }
  }
 }
 if(await tx.installationReceipt.count({where:{jobId:id}})>=100)throw new ApiError(409,'RECORD_LIMIT','At most 100 receipt verifications per job');
 const receipt=await tx.installationReceipt.create({data:{jobId:id,actorId:user.id,receivedAt,jobVersion:row.version,notes:input.notes,evidenceIds:input.evidenceIds,snapshot:json(input.lines)}});
 const complete=input.lines.every(l=>{const e=equipment.find(e=>e.id===l.equipmentId)!;return new Decimal(l.receivedQuantity).eq(e.dispatchedQuantity)&&new Decimal(l.damagedQuantity).eq(0);});
 const proposed={...row,deliveryConfirmedAt:complete?receivedAt:null};
 let status=row.status;
 if(row.status==='PLANNED'&&complete){try{await ready(tx,proposed);status='SITE_READY';}catch(e){if(!(e instanceof ApiError&&['SITE_NOT_READY','BLOCKING_ISSUES'].includes(e.code)))throw e;}}
 if(!complete&&row.status==='SITE_READY')status='PLANNED';
 return {job:publicJob(await saveJob(tx,user,row,{deliveryConfirmedAt:proposed.deliveryConfirmedAt,status},'RECEIPT_VERIFIED',input.reason,{receiptId:receipt.id,lines:input.lines},true)),receipt};
});}
export function milestone(user:Principal,id:string,milestoneId:string,input:z.infer<typeof v.milestone>){return installationAtomic(async tx=>{
 const row=await requireJob(tx,user,id,input.version,true);
 if(['WORK_COMPLETED','TESTING','ON_HOLD'].includes(row.status))throw new ApiError(409,'MILESTONE_EXECUTION_FROZEN','Request rework or resume active execution before changing milestones');
 const m=await tx.installationMilestone.findFirst({where:{id:milestoneId,jobId:id}});if(!m)throw new ApiError(404,'NOT_FOUND','Milestone not found');
 if(input.responsibleUserId&&!await tx.user.count({where:{id:input.responsibleUserId,isActive:true}}))throw new ApiError(422,'INVALID_ASSIGNEE','Responsible user is inactive');
 if(input.responsibleUserId&&input.responsibleUserId!==row.coordinatorId&&!await tx.installationAssignment.count({where:{jobId:id,userId:input.responsibleUserId,user:{isActive:true}}}))throw new ApiError(422,'MILESTONE_ASSIGNEE','Responsible user must be active coordinator or assigned technician');
 if(user.role!=='ADMIN'&&input.responsibleUserId!==m.responsibleUserId)throw new ApiError(403,'ADMIN_REQUIRED','ADMIN assigns milestone responsibility');
 if(input.plannedStartAt&&input.plannedEndAt&&new Date(input.plannedEndAt)<new Date(input.plannedStartAt))throw new ApiError(422,'INVALID_DATES','Milestone end precedes start');
 await evidence(tx,id,input.evidenceIds);
 if(input.status==='NOT_APPLICABLE'){admin(user);if(m.required)throw new ApiError(422,'REQUIRED_MILESTONE','Required milestone cannot be waived');}
 if(['IN_PROGRESS','COMPLETED'].includes(input.status)){
  if(!['IN_PROGRESS','REWORK_REQUIRED'].includes(row.status))throw new ApiError(409,'EXECUTION_NOT_STARTED','Execute milestones only in active/rework installation');
  await ready(tx,row);
 }
 if(input.status==='COMPLETED'&&(!Object.values(input.checks).every(Boolean)||!input.evidenceIds.length||!input.responsibleUserId||await blockingIssues(tx,id)))throw new ApiError(409,'MILESTONE_CHECKS_REQUIRED','Complete checks, responsibility, evidence and blocking-issue resolution');
 const result=await tx.installationMilestone.update({where:{id:milestoneId},data:{status:input.status,responsibleUserId:input.responsibleUserId,plannedStartAt:input.plannedStartAt?new Date(input.plannedStartAt):null,plannedEndAt:input.plannedEndAt?new Date(input.plannedEndAt):null,checks:json(input.checks),completionNotes:input.completionNotes,evidenceIds:input.evidenceIds,actualStartAt:input.status==='IN_PROGRESS'||input.status==='COMPLETED'?(m.actualStartAt??new Date()):null,actualEndAt:input.status==='COMPLETED'?new Date():null}});
 return {milestone:result,job:publicJob(await saveJob(tx,user,row,{},'MILESTONE_UPDATED',input.reason,{before:m,after:result},true))};
});}
export function install(user:Principal,id:string,input:z.infer<typeof v.install>){return installationAtomic(async tx=>{
 const row=await requireJob(tx,user,id,input.version,true);if(!['IN_PROGRESS','REWORK_REQUIRED'].includes(row.status))throw new ApiError(409,'EXECUTION_NOT_STARTED','Install equipment only during active/rework execution');
 await ready(tx,row);await evidence(tx,id,input.evidenceIds);
 const e=await tx.installationEquipment.findFirst({where:{id:input.equipmentId,jobId:id},include:{serials:true}});if(!e)throw new ApiError(404,'NOT_FOUND','Equipment not found');
 const q=new Decimal(input.installedQuantity);
 if(q.lte(0)||q.lt(e.installedQuantity)||q.gt(e.receivedQuantity))throw new ApiError(422,'INSTALLED_QUANTITY','Cumulative installed quantity must be positive, nondecreasing and no greater than verified usable receipt');
 if((['PCS','SET','PAIR'].includes(e.unit)||e.serializationRequired)&&!q.isInteger())throw new ApiError(422,'FRACTIONAL_EQUIPMENT','Counted installed equipment requires whole quantity');
 if(e.serializationRequired){
  if(!q.eq(input.installedSerialIds.length)||input.installedSerialIds.some(s=>!e.serials.some(r=>r.serialUnitId===s&&r.received&&!r.damaged))||e.serials.some(s=>s.installedAt&&!input.installedSerialIds.includes(s.serialUnitId)))throw new ApiError(422,'INSTALLED_SERIAL_MISMATCH','Installed serials must be the exact cumulative verified usable set, retaining earlier installed units');
  for(const serial of e.serials.filter(s=>input.installedSerialIds.includes(s.serialUnitId)&&!s.installedAt))await tx.installationEquipmentSerial.update({where:{id:serial.id},data:{installedAt:new Date(),installedLocation:input.installedLocation,installerId:user.id}});
 }else if(input.installedSerialIds.length)throw new ApiError(422,'UNEXPECTED_SERIALS','Nonserialized equipment cannot select serials');
 const equipment=await tx.installationEquipment.update({where:{id:e.id},data:{installedQuantity:q,installedLocation:input.installedLocation,installedAt:new Date(),installerId:user.id,notes:input.notes}});
 return {equipment,job:publicJob(await saveJob(tx,user,row,{},'EQUIPMENT_INSTALLED',input.reason,{before:e,after:equipment,installedSerialIds:input.installedSerialIds,evidenceIds:input.evidenceIds},true))};
});}
export function reportIssue(user:Principal,id:string,input:z.infer<typeof v.issue>){return installationAtomic(async tx=>{
 const row=await requireJob(tx,user,id,input.version,true);await evidence(tx,id,input.evidenceIds);
 if(input.milestoneId&&!await tx.installationMilestone.count({where:{id:input.milestoneId,jobId:id}}))throw new ApiError(422,'ISSUE_OWNERSHIP','Milestone belongs to another job');
 if(input.equipmentId&&!await tx.installationEquipment.count({where:{id:input.equipmentId,jobId:id}}))throw new ApiError(422,'ISSUE_OWNERSHIP','Equipment belongs to another job');
 if(input.serialUnitId&&!await tx.installationEquipmentSerial.count({where:{serialUnitId:input.serialUnitId,equipment:{jobId:id,...(input.equipmentId?{id:input.equipmentId}:{})}}}))throw new ApiError(422,'ISSUE_OWNERSHIP','Serial is not part of the selected job/equipment');
 if(await tx.installationIssue.count({where:{jobId:id}})>=500)throw new ApiError(409,'RECORD_LIMIT','At most 500 issues per job');
 const {version:_v,reason,...fields}=input;
 const issue=await tx.installationIssue.create({data:{...fields,jobId:id,reportedById:user.id,blocking:input.blocking||['HIGH','CRITICAL'].includes(input.severity)}});
 return {issue,job:publicJob(await saveJob(tx,user,row,{},'ISSUE_REPORTED',reason,{issue},true))};
});}
export function resolveIssue(user:Principal,id:string,issueId:string,input:z.infer<typeof v.resolve>){return installationAtomic(async tx=>{
 const row=await requireJob(tx,user,id,input.version,true);const issue=await tx.installationIssue.findFirst({where:{id:issueId,jobId:id}});if(!issue)throw new ApiError(404,'NOT_FOUND','Issue not found');
 if(['HIGH','CRITICAL'].includes(issue.severity)||issue.blocking)admin(user);
 await evidence(tx,id,input.evidenceIds);
 const current=await tx.installationIssue.update({where:{id:issueId},data:{status:input.status,resolution:input.resolution,resolvedById:input.status==='RESOLVED'?user.id:null,resolvedAt:input.status==='RESOLVED'?new Date():null,evidenceIds:input.evidenceIds}});
 return {issue:current,job:publicJob(await saveJob(tx,user,row,{},'ISSUE_UPDATED',input.reason,{before:issue,after:current},true))};
});}
