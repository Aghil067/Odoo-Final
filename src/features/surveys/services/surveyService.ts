import {apiClient,getData,getPage,postData,patchData,uploadEvidence,unsupported} from '../../../services/apiClient';
import type {Survey,SurveyFilters,SurveyStatus} from '../types/survey.types';
export type SurveyState='REQUESTED'|'SCHEDULED'|'IN_PROGRESS'|'SUBMITTED'|'REVISION_REQUIRED'|'APPROVED'|'REJECTED'|'CANCELED';
export interface SurveyRecord {
 id:string;reference:string;version:number;status:SurveyState;customerId:string;siteId:string;leadId:string;
 customer?:{id:string;name:string;phone:string;email:string|null};site?:{id:string;name:string;addressLine1:string;city:string};
 assignedToId:string|null;assignedTo?:{id:string;name:string}|null;requestNotes:string;assignmentNotes:string|null;
 scheduledAt:string|null;scheduledEndAt:string|null;expectedDurationMinutes:number|null;startedAt:string|null;submittedAt:string|null;
 requestedCapacityKw:string|null;recommendedCapacityKw:string|null;recommendedSystemType:'ON_GRID'|'OFF_GRID'|'UNDECIDED';
 suitability:'UNASSESSED'|'SUITABLE'|'CONDITIONALLY_SUITABLE'|'NOT_SUITABLE';infeasibilityReason:string|null;additionalWorkRequired:string|null;technicalAssumptions:string|null;feasibilityNotes:string|null;
 roofAssessment?:Record<string,string|boolean|null>|null;electricalAssessment?:Record<string,string|boolean|null>|null;createdAt:string;updatedAt:string;
}
export interface SurveyFile {id:string;fileName:string;category:string;mimeType:string;sizeBytes:number;createdAt:string}
export interface SurveyEvent {id:string;event:string;reason:string;createdAt:string;fromStatus:string|null;toStatus:string;actor?:{name:string}}
export const surveyStates:Record<SurveyState,SurveyStatus>={REQUESTED:'requested',SCHEDULED:'scheduled',IN_PROGRESS:'in_progress',SUBMITTED:'submitted',REVISION_REQUIRED:'reinspection_required',APPROVED:'approved',REJECTED:'rejected',CANCELED:'cancelled'};
function mapSurvey(r:SurveyRecord):Survey{return {id:r.id,surveyId:r.reference,customerId:r.customerId,customerName:r.customer?.name??r.customerId,customerPhone:r.customer?.phone??'',customerEmail:r.customer?.email??undefined,enquiryId:r.leadId,siteId:r.siteId,siteName:r.site?.name??r.siteId,siteLocation:r.site?[r.site.addressLine1,r.site.city].join(', '):'',propertyType:null,scheduledDate:r.scheduledAt?new Date(r.scheduledAt).toLocaleDateString():'Not scheduled',preferredTime:r.scheduledAt?new Date(r.scheduledAt).toLocaleTimeString():'',assignedSurveyorId:r.assignedToId??'',assignedSurveyorName:r.assignedTo?.name??'Unassigned',priority:'unspecified',instructions:r.requestNotes,systemType:r.recommendedSystemType.toLowerCase() as Survey['systemType'],requestedCapacity:r.requestedCapacityKw?'custom':'unspecified',customRequestedCapacity:r.requestedCapacityKw??undefined,photos:[],status:surveyStates[r.status],approval:{approvalStatus:r.status==='APPROVED'?'approved':r.status==='REJECTED'?'rejected':r.status==='SUBMITTED'?'pending_approval':'not_submitted'},createdAt:r.createdAt,updatedAt:r.updatedAt};}
export const surveyService={
 async list(f:SurveyFilters={}){if(f.systemType||f.dateFrom||f.dateTo)unsupported('These survey filters');const requestedStatus=f.status||(f.approvalStatus==='approved'?'approved':f.approvalStatus==='rejected'?'rejected':f.approvalStatus==='pending_approval'?'submitted':undefined);const state=requestedStatus?Object.entries(surveyStates).find(([,v])=>v===requestedStatus)?.[0]:undefined;if(f.status&&!state)unsupported('This survey status filter');const r=await getPage<SurveyRecord>('/surveys',{q:f.search||undefined,customerId:f.customerId,status:state,assignedToId:f.surveyorId||undefined,page:f.page??1,pageSize:f.pageSize??10});return {data:r.data.map(mapSurvey),total:r.total};},
 getRecord:(id:string)=>getData<SurveyRecord>(`/surveys/${id}`),
 create:(data:{leadId:string;siteId:string;requestNotes:string;previousSurveyId?:string})=>postData<SurveyRecord>('/surveys',data),
 command:(id:string,action:'assign'|'schedule'|'start'|'submit'|'cancel',version:number,data:Record<string,unknown>)=>postData<SurveyRecord>(`/surveys/${id}/${action}`,{version,...data}),
 review:(id:string,version:number,data:{decision:string;notes:string;checklist:Record<string,boolean>})=>postData(`/surveys/${id}/review`,{version,...data}),
 feasibility:(id:string,version:number,data:Record<string,unknown>)=>patchData<SurveyRecord>(`/surveys/${id}`,{version,...data}),
 async assessment(id:string,kind:'roof'|'electrical',version:number,data:Record<string,unknown>){await apiClient.put(`/surveys/${id}/${kind}-assessment`,{version,...data});},
 files:(id:string,page=1)=>getPage<SurveyFile>(`/surveys/${id}/attachments`,{page,pageSize:20}),
 history:(id:string,page=1)=>getPage<SurveyEvent>(`/surveys/${id}/history`,{page,pageSize:20}),
 surveyors:()=>getPage<{id:string;name:string}>('/surveys/surveyors',{pageSize:100}),
 upload:(id:string,version:number,file:File,category:string)=>uploadEvidence(`/surveys/${id}/attachments`,file,{version,category,fileName:file.name}),
 async download(id:string,file:SurveyFile){const r=await apiClient.get(`/surveys/${id}/attachments/${file.id}/download`,{responseType:'blob'});const url=URL.createObjectURL(r.data);const a=document.createElement('a');a.href=url;a.download=file.fileName;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);},
 async getDashboardStats(){const r=await getData<{totalSurveys:number;byStatus:{status:SurveyState;count:number}[]}>('/surveys/summary');const count=(s:SurveyState)=>r.byStatus.find(x=>x.status===s)?.count??0;return {total:r.totalSurveys,pending:count('REQUESTED'),scheduled:count('SCHEDULED'),inProgress:count('IN_PROGRESS'),submitted:count('SUBMITTED'),approved:count('APPROVED'),rejected:count('REJECTED'),reinspection:count('REVISION_REQUIRED')};}
};
