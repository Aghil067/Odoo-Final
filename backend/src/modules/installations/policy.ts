import { InstallationMilestoneType,InstallationTestType,type InstallationJob } from '@prisma/client';
import type { Transaction } from '../../lib/db.js';
import { ApiError } from '../../lib/http.js';
import { z } from 'zod';
import { exactHandoff,blockingIssues } from './common.js';
import * as v from './validation.js';
export function validateTestPlan(plan:z.infer<typeof v.requirements>,categories:string[]){
 const types=Object.values(InstallationTestType);
 if(plan.length!==types.length||types.some(type=>!plan.some(r=>r.type===type)))throw new ApiError(422,'TEST_PLAN_INCOMPLETE','Provide all nine test definitions and their real requirements basis');
 for(const r of plan){
  const required=r.type==='BATTERY'?categories.includes('BATTERY'):r.type==='MOUNTING_VERIFICATION'?categories.includes('MOUNTING_STRUCTURE'):true;
  if(required&&!r.required)throw new ApiError(422,'REQUIRED_TEST','Required design test cannot be disabled');
  if(r.type==='BATTERY'&&!categories.includes('BATTERY')&&r.required)throw new ApiError(422,'BATTERY_NOT_APPLICABLE','A design without batteries must not require battery testing');
 }
}
export function requiredMilestones(categories:string[]){return Object.values(InstallationMilestoneType).map(type=>({type,required:type==='BATTERY'?categories.includes('BATTERY'):type==='MOUNTING_STRUCTURE'?categories.includes('MOUNTING_STRUCTURE'):true}));}
export async function verifiedEquipment(tx:Transaction,row:InstallationJob,installed=false){
 const {dispatch}=await exactHandoff(tx,row);
 const equipment=await tx.installationEquipment.findMany({where:{jobId:row.id},include:{serials:{include:{serialUnit:true}}}});
 if(equipment.length!==dispatch.lines.length||!row.deliveryConfirmedAt)throw new ApiError(409,'SITE_RECEIPT_REQUIRED','Confirm a full physical site receipt separately from dispatch');
 for(const e of equipment){
  const line=dispatch.lines.find(l=>l.id===e.dispatchLineId);
  if(!line||line.returnedQuantity.gt(0)||!e.receivedQuantity.eq(e.dispatchedQuantity)||e.damagedQuantity.gt(0)||!line.quantity.eq(e.dispatchedQuantity)||(installed&&!e.installedQuantity.eq(e.dispatchedQuantity)))throw new ApiError(409,'EQUIPMENT_NOT_RECONCILED','Every dispatched component must be fully verified usable at site and installed before completion');
  if(e.serializationRequired){
   if(e.serials.length!==line.serialUnitIds.length||!e.receivedQuantity.eq(e.serials.filter(s=>s.received&&!s.damaged).length)||e.serials.some(s=>!line.serialUnitIds.includes(s.serialUnitId)||s.serialUnit.componentId!==e.componentId||s.serialUnit.dispatchLineId!==line.id||s.serialUnit.state!=='DISPATCHED'||!s.received||s.damaged||(installed&&!s.installedAt)))throw new ApiError(409,'SERIAL_NOT_RECONCILED','Reconcile the exact dispatched serial identities, live states and installed records');
  }
 }
 return equipment;
}
export async function ready(tx:Transaction,row:InstallationJob){
 await verifiedEquipment(tx,row);
 const record=await tx.installationReadiness.findFirst({where:{jobId:row.id},orderBy:{jobVersion:'desc'}});
 if(!record||!Object.values(v.readinessChecklist.parse(record.checklist)).every(Boolean)||record.outstandingIssues||!record.evidenceIds.length)throw new ApiError(409,'SITE_NOT_READY','Complete every readiness/safety/conditional-work check with evidence and no outstanding readiness issue');
 if(await blockingIssues(tx,row.id))throw new ApiError(409,'BLOCKING_ISSUES','Resolve blocking/high/critical issues before execution or commissioning');
 return record;
}
export async function workComplete(tx:Transaction,row:InstallationJob){
 await ready(tx,row);await verifiedEquipment(tx,row,true);
 if(!row.actualStartAt||!row.completionNotes)throw new ApiError(409,'COMPLETION_INCOMPLETE','Start work and record completion notes');
 const milestones=await tx.installationMilestone.findMany({where:{jobId:row.id}});
 if(milestones.some(m=>m.required&&m.status!=='COMPLETED'))throw new ApiError(409,'MILESTONES_INCOMPLETE','Complete every required milestone');
}
export async function commissioningReady(tx:Transaction,row:InstallationJob){
 await workComplete(tx,row);
 const requirements=v.requirements.parse(row.testRequirements);
 const records=await tx.installationTest.findMany({where:{jobId:row.id,executionRevision:row.executionRevision},orderBy:{jobVersion:'desc'}});
 for(const requirement of requirements){
  const test=records.find(t=>t.type===requirement.type);
  if(requirement.required&&(!test||!test.applicable||test.result!=='PASS'))throw new ApiError(409,'TESTS_INCOMPLETE','Every required test needs a current-execution PASS');
  if(test&&test.applicable&&test.result!=='PASS')throw new ApiError(409,'TEST_FAILED','Resolve the latest failed/unverified test before commissioning');
 }
 if(!await tx.installationAttachment.count({where:{jobId:row.id,category:'COMPLETION'}}))throw new ApiError(409,'COMPLETION_EVIDENCE_REQUIRED','Upload private completion evidence');
}
export const attachmentPublic={id:true,jobId:true,milestoneId:true,issueId:true,category:true,fileName:true,mimeType:true,sizeBytes:true,sha256:true,uploaderId:true,createdAt:true} as const;
export async function snapshot(tx:Transaction,id:string){
 const row=await tx.installationJob.findUniqueOrThrow({where:{id},include:{assignments:true,milestones:true,equipment:{include:{serials:{include:{serialUnit:{select:{id:true,serialNumber:true,componentId:true,receivedAt:true,receiptOperationId:true}}}}}},issues:true,tests:{orderBy:{jobVersion:'desc'}},receipts:{orderBy:{jobVersion:'desc'}},readiness:{orderBy:{jobVersion:'desc'}},attachments:{select:attachmentPublic}}});
 return row;
}
export function publicJob<T extends InstallationJob>(row:T){const{handoffSnapshot:_private,...publicFields}=row;return publicFields;}
