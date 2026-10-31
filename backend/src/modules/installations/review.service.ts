import { z } from 'zod';
import { ApiError } from '../../lib/http.js';
import type { Principal } from '../auth/auth.js';
import { admin,installationAtomic,requireJob,saveJob,evidence,json } from './common.js';
import { workComplete,commissioningReady,snapshot,publicJob } from './policy.js';
import * as v from './validation.js';
export function recordTest(user:Principal,id:string,input:z.infer<typeof v.test>){return installationAtomic(async tx=>{
 const row=await requireJob(tx,user,id,input.version,true);if(row.status!=='TESTING')throw new ApiError(409,'TESTING_NOT_STARTED','Record tests only after completed work enters TESTING');
 await workComplete(tx,row);await evidence(tx,id,input.evidenceIds);
 if(await tx.installationTest.count({where:{jobId:id}})>=500)throw new ApiError(409,'RECORD_LIMIT','At most 500 test records per installation');
 const requirement=v.requirements.parse(row.testRequirements).find(r=>r.type===input.type);
 if(!requirement)throw new ApiError(422,'TEST_NOT_PLANNED','Test must follow the approved installation test plan');
 if(input.requirementsBasis!==requirement.basis)throw new ApiError(422,'TEST_BASIS_MISMATCH','Use the exact recorded design/manufacturer requirements basis');
 if(!input.applicable){admin(user);if(requirement.required||!input.notApplicableReason||input.result!=='NEEDS_REVIEW'||input.measurement!==null||input.unit!==null)throw new ApiError(422,'TEST_NOT_APPLICABLE','Only optional tests can be marked not applicable, with rationale, no measurement and NEEDS_REVIEW result');}
 else{
  if(input.notApplicableReason!==null)throw new ApiError(422,'TEST_APPLICABILITY','Applicable tests cannot have a nonapplicability rationale');
  if((input.measurement===null)!==(input.unit===null)||(requirement.measurementRequired&&input.measurement===null)||(input.measurement!==null&&requirement.unit!==null&&input.unit!==requirement.unit))throw new ApiError(422,'TEST_MEASUREMENT_REQUIRED','Record the actual measurement/unit required by the plan');
 }
 const {version:_v,reason,...fields}=input;
 const test=await tx.installationTest.create({data:{...fields,jobId:id,testerId:user.id,executionRevision:row.executionRevision,jobVersion:row.version}});
 return {test,job:publicJob(await saveJob(tx,user,row,{},'TEST_RECORDED',reason,{testId:test.id,type:test.type,result:test.result,executionRevision:row.executionRevision}))};
});}
export function submitCommissioning(user:Principal,id:string,input:z.infer<typeof v.command>){return installationAtomic(async tx=>{
 const row=await requireJob(tx,user,id,input.version,true);if(row.status!=='TESTING')throw new ApiError(409,'TESTING_REQUIRED','Submit only from TESTING');
 await commissioningReady(tx,row);
 return publicJob(await saveJob(tx,user,row,{status:'COMMISSIONING_REVIEW'},'COMMISSIONING_SUBMITTED',input.reason));
});}
export function review(user:Principal,id:string,input:z.infer<typeof v.review>){return installationAtomic(async tx=>{
 admin(user);const row=await requireJob(tx,user,id,input.version);
 if(row.status!=='COMMISSIONING_REVIEW')throw new ApiError(409,'NOT_SUBMITTED','Review only the exact submitted job version');
 if(row.createdById===user.id||await tx.installationStatusHistory.count({where:{jobId:id,actorId:user.id,event:{not:'REVIEWED'}}}))throw new ApiError(403,'INDEPENDENT_REVIEW_REQUIRED','An independent ADMIN who did not create/change this job must review');
 if(input.decision==='APPROVED'){await commissioningReady(tx,row);if(!Object.values(input.checklist).every(Boolean))throw new ApiError(422,'REVIEW_CHECKLIST_REQUIRED','Acknowledge every commissioning review check');}
 const record=await tx.installationCommissioningReview.create({data:{jobId:id,jobVersion:row.version,reviewerId:user.id,decision:input.decision,checklist:json(input.checklist),notes:input.notes,snapshot:json(await snapshot(tx,id))}});
 const job=await saveJob(tx,user,row,{status:input.decision==='APPROVED'?'COMMISSIONED':'REWORK_REQUIRED',approvedVersion:input.decision==='APPROVED'?row.version:null,commissionedAt:input.decision==='APPROVED'?record.createdAt:null,actualEndAt:input.decision==='APPROVED'?row.actualEndAt:null},'REVIEWED',input.reason,{reviewId:record.id,decision:input.decision,notes:input.notes},input.decision==='REWORK_REQUIRED');
 return {job:publicJob(job),review:record};
});}
export function commissioned(user:Principal,id:string){return installationAtomic(async tx=>{
 const row=await requireJob(tx,user,id);
 if(row.status!=='COMMISSIONED'||row.approvedVersion===null)throw new ApiError(409,'NOT_COMMISSIONED','No approved internal commissioning handoff exists');
 const review=await tx.installationCommissioningReview.findUniqueOrThrow({where:{jobId_jobVersion:{jobId:id,jobVersion:row.approvedVersion}}});
 if(review.decision!=='APPROVED')throw new ApiError(409,'NOT_COMMISSIONED','Persisted review is not approval');
 const data=await tx.installationEquipment.findMany({where:{jobId:id},include:{serials:{where:{installedAt:{not:null}},include:{serialUnit:{select:{serialNumber:true,receivedAt:true,receiptOperationId:true}}}}}});
 const tests=await tx.installationTest.findMany({where:{jobId:id,executionRevision:row.executionRevision},orderBy:{jobVersion:'desc'}});
 return {jobId:id,reference:row.reference,customerId:row.customerId,siteId:row.siteId,leadId:row.leadId,configurationId:row.configurationId,configurationApprovedVersion:row.configurationApprovedVersion,configurationReviewId:row.configurationReviewId,bomId:row.bomId,bomVersion:row.bomVersion,reservationId:row.reservationId,dispatchId:row.dispatchId,dispatchReference:(await tx.stockDispatch.findUniqueOrThrow({where:{id:row.dispatchId}})).reference,commissioningReviewId:review.id,commissioningDate:row.commissionedAt,deliveryConfirmedAt:row.deliveryConfirmedAt,actualWorkStartAt:row.actualStartAt,actualWorkEndAt:row.actualEndAt,equipment:data,testSummary:tests.filter((t,i)=>tests.findIndex(other=>other.type===t.type)===i),outstandingNonblockingIssues:await tx.installationIssue.findMany({where:{jobId:id,status:'OPEN',blocking:false,severity:{in:['LOW','MEDIUM']}}}),completionEvidence:await tx.installationAttachment.findMany({where:{jobId:id,category:'COMPLETION'},select:{id:true,fileName:true,mimeType:true,sizeBytes:true,sha256:true,createdAt:true}}),completionNotes:row.completionNotes,scope:'INTERNAL_COMMISSIONING_NOT_REGULATORY_CERTIFICATION',externalGridAuthorization:'NOT_RECORDED',warrantyStartDate:'NOT_DETERMINED_BY_M05'};
});}
