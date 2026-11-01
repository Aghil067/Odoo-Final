import {apiClient,getData,getPage,postData,patchData,uploadEvidence,type Envelope} from '../../../services/apiClient';
export const installationStates=['PLANNED','SITE_READY','IN_PROGRESS','ON_HOLD','WORK_COMPLETED','TESTING','COMMISSIONING_REVIEW','COMMISSIONED','REWORK_REQUIRED','CANCELED'] as const;
export const installationTestTypes=['VISUAL_INSPECTION','MOUNTING_VERIFICATION','POLARITY','EARTHING','INSULATION','INVERTER_STARTUP','PROTECTION_DEVICES','BATTERY','FUNCTIONAL_SYSTEM'] as const;
export type TestType=typeof installationTestTypes[number];
export interface TestRequirement {type:TestType;required:boolean;basis:string;measurementRequired:boolean;unit:string|null}
export interface InstallationUser {id:string;name:string;role:string}
export interface InstallationMilestone {id:string;type:string;required:boolean;status:string;responsibleUserId:string|null;plannedStartAt:string|null;plannedEndAt:string|null;actualStartAt:string|null;actualEndAt:string|null;completionNotes:string|null;checks:Record<string,boolean>;evidenceIds:string[]}
export interface InstallationEquipment {id:string;componentId:string;component?:{id:string;name:string;sku:string;category:string};dispatchLineId:string;unit:string;serializationRequired:boolean;dispatchedQuantity:string;receivedQuantity:string;damagedQuantity:string;installedQuantity:string;installedLocation:string|null;notes:string|null;serials:{id:string;serialUnitId:string;received:boolean;damaged:boolean;installedAt:string|null;serialUnit:{serialNumber:string;state:string}}[]}
export interface InstallationJob {id:string;reference:string;name:string;status:typeof installationStates[number];version:number;executionRevision:number;customerId:string;siteId:string;leadId:string;configurationId:string;configurationApprovedVersion:number;configurationReviewId:string;bomId:string;bomVersion:number;reservationId:string;dispatchId:string;coordinatorId:string;createdById:string;plannedStartAt:string;plannedEndAt:string;actualStartAt:string|null;actualEndAt:string|null;deliveryConfirmedAt:string|null;commissionedAt:string|null;siteReadinessNotes:string|null;safetyNotes:string|null;completionNotes:string|null;testRequirements:TestRequirement[];assignments?:{userId:string;user:InstallationUser}[];milestones?:InstallationMilestone[];equipment?:InstallationEquipment[]}
export interface InstallationAttachment {id:string;category:string;fileName:string;mimeType:string;sizeBytes:number;sha256:string;createdAt:string}
export interface InstallationIssue {id:string;type:string;severity:string;blocking:boolean;description:string;status:string;resolution:string|null;reportedAt:string;milestoneId:string|null;equipmentId:string|null;serialUnitId:string|null;evidenceIds:string[]}
export interface InstallationTest {id:string;type:TestType;applicable:boolean;result:string;observations:string;measurement:string|null;unit:string|null;requirementsBasis:string;testedAt:string;executionRevision:number;evidenceIds:string[]}
export interface InstallationHistory {id:string;event:string;actorId:string;fromStatus:string|null;toStatus:string;jobVersion:number;reason:string;createdAt:string}
export interface CommissionedInstallation {jobId:string;reference:string;customerId:string;siteId:string;leadId:string;dispatchReference:string;commissioningReviewId:string;commissioningDate:string;deliveryConfirmedAt:string;scope:string;externalGridAuthorization:string;warrantyStartDate:string;completionNotes:string;equipment:InstallationEquipment[];testSummary:InstallationTest[];completionEvidence:InstallationAttachment[];outstandingNonblockingIssues:InstallationIssue[]}
type Paging={page?:number;pageSize?:number};
export const installationClient={
 list:(query:Paging&{q?:string;status?:string;customerId?:string;siteId?:string;leadId?:string}={})=>getPage<InstallationJob>('/installations',query),
 detail:(id:string)=>getData<InstallationJob>(`/installations/${id}`),
 summary:()=>getData<{byStatus:{status:string;_count:{_all:number}}[];blockingOpenIssues:number}>('/installations/summary'),
 assignees:(role:'ADMIN'|'TECHNICIAN',query:Paging&{q?:string})=>getPage<InstallationUser>('/installations/assignees',{...query,role}),
 create:(data:unknown)=>postData<InstallationJob>('/installations',data),
 update:(id:string,data:unknown)=>patchData<InstallationJob>(`/installations/${id}`,data),
 command:(id:string,action:string,data:unknown)=>postData<InstallationJob|{job:InstallationJob}>(`/installations/${id}/${action}`,data),
 collection:<T>(id:string,kind:string,page=1)=>getPage<T>(`/installations/${id}/${kind}`,{page,pageSize:20}),
 milestone:async(id:string,milestoneId:string,data:unknown)=>(await apiClient.put<Envelope<{job:InstallationJob;milestone:InstallationMilestone}>>(`/installations/${id}/milestones/${milestoneId}`,data)).data.data,
 resolve:(id:string,issueId:string,data:unknown)=>patchData<{job:InstallationJob;issue:InstallationIssue}>(`/installations/${id}/issues/${issueId}`,data),
 upload:(id:string,file:File,params:Record<string,string|number>)=>uploadEvidence<{attachment:InstallationAttachment;jobVersion:number}>(`/installations/${id}/attachments`,file,params),
 download:async(id:string,file:InstallationAttachment)=>{const r=await apiClient.get<Blob>(`/installations/${id}/attachments/${file.id}/download`,{responseType:'blob'});const url=URL.createObjectURL(r.data),a=document.createElement('a');a.href=url;a.download=file.fileName;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);},
 commissioned:(id:string)=>getData<CommissionedInstallation>(`/installations/${id}/commissioned`)
};
