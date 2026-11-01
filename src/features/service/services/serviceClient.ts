import {apiClient,getData,getPage,postData,patchData,uploadEvidence} from '../../../services/apiClient';
export const serviceStates=['OPEN','TRIAGED','ASSIGNED','VISIT_SCHEDULED','IN_PROGRESS','WAITING_FOR_CUSTOMER','WAITING_FOR_PARTS','ON_HOLD','REOPENED','RESOLVED','CLOSED','CANCELLED'];
export const serviceCategories=['PANEL_ISSUE','INVERTER_ISSUE','BATTERY_ISSUE','WIRING_ISSUE','PERFORMANCE_ISSUE','SYSTEM_OFFLINE','PREVENTIVE_MAINTENANCE','GENERAL_SUPPORT','OTHER'];
export const servicePriorities=['LOW','MEDIUM','HIGH','CRITICAL'];
export const serviceChecks=['SITE_SAFETY','VISUAL_INSPECTION','PANEL_CONDITION','INVERTER_STATUS','WIRING_PROTECTION','BATTERY_CONDITION','SYSTEM_FUNCTIONALITY','CUSTOMER_COMMUNICATION','FINAL_CLEANUP'];
export const serviceEvidenceTypes=['FAULT_PHOTO','TECHNICIAN_NOTES','TEST_REPORT','REPAIR_PHOTO','CUSTOMER_ACKNOWLEDGEMENT','REPLACEMENT_DOCUMENTATION','OTHER'];
export interface ServiceInstallation {id:string;name:string;reference:string;customerId:string;siteId:string}
export interface ServicePerson {id:string;name:string;role:string}
export interface ServiceEquipment {id:string;componentId:string;unit:string;installedQuantity:string;serializationRequired:boolean;component:{id:string;name:string;sku:string};serials:{serialUnitId:string;serialUnit:{serialNumber:string}}[]}
export interface ServiceSlaPolicy {id:string;reference:string;revision:number;category:string;priority:string;firstResponseMinutes:number;resolutionMinutes:number;effectiveFrom:string;effectiveTo:string|null;clock:string;terms:string}
export interface ServiceSla {configured:boolean;clock:string;firstResponseDueAt:string|null;resolutionDueAt:string|null;firstResponseAt:string|null;resolvedAt:string|null;firstResponseBreached:boolean|null;resolutionBreached:boolean|null;cancelled:boolean;pauseSemantics:string;asOf:string}
export interface ServiceTicket {id:string;reference:string;installationId:string;customerId:string;siteId:string;equipmentId:string|null;serialUnitId:string|null;warrantyClaimId:string|null;reportedIssue:string;description:string;category:string;priority:string;channel:string;status:string;supportOwnerId:string|null;customerImpact:string|null;safetyConcern:boolean;safetyReviewedAt:string|null;requiresVisit:boolean;troubleshootingNotes:string|null;escalationReason:string|null;requiredSkillIds:string[];requiredChecks:string[];resolutionNotes:string|null;openedAt:string;firstResponseAt:string|null;resolvedAt:string|null;closedAt:string|null;slaPolicyId:string|null;version:number;executionRevision:number;sla?:ServiceSla}
export interface ServiceAssignment {user?:{id:string;name:string};id:string;ticketId:string;userId:string;version:number;assignedAt:string;acknowledgedAt:string|null;endedAt:string|null}
export interface ServiceVisit {assignment?:{user:{id:string;name:string}};id:string;ticketId:string;assignmentId:string;userId:string;version:number;status:string;scheduledStartAt:string;scheduledEndAt:string;arrivedAt:string|null;departedAt:string|null;siteAccess:string|null;workPerformed:string|null;outcome:string|null;followUpRequired:boolean;executionRevision:number}
export interface ServiceEvidence {id:string;ticketId:string;visitId:string|null;type:string;fileName:string;mimeType:string;sizeBytes:number;sha256:string;createdAt:string;executionRevision:number}
export interface ServiceDiagnosis {id:string;visitId:string;reportedSymptom:string;observedSymptom:string;method:string;measurements:{name:string;value:string;unit:string;requirementReference:string|null}[];finding:string;probableCause:string|null;uncertainty:string;executionRevision:number;createdAt:string}
export interface ServiceRepair {id:string;visitId:string;version:number;type:string;description:string;status:string;startedAt:string|null;completedAt:string|null;outcome:string|null;followUpRequired:boolean;technicianId:string;executionRevision:number}
export interface ServicePart {id:string;ticketId:string;componentId:string;quantity:string;purpose:string;status:string;version:number;dispositionNotes:string|null;createdAt:string}
export interface ServiceChecklist {id:string;key:string;result:string;notes:string;actorId:string;ticketVersion:number;executionRevision:number;createdAt:string}
export interface ServiceMaintenancePlan {id:string;reference:string;installationId:string;category:string;intervalDays:number;effectiveAt:string;nextDueAt:string;requiredChecks:string[];status:string;version:number}
export interface ServiceOccurrence {ticket?:{id:string;reference:string;status:string};id:string;planId:string;ticketId:string;dueAt:string;completedAt:string|null;cancelledAt:string|null;completionNotes:string|null;cancellationNotes:string|null}
type Page={page?:number;pageSize?:number};
type Query=Page&{q?:string;status?:string;priority?:string;category?:string;installationId?:string;technicianId?:string;sort?:string};
export const serviceClient={
 installations:(q:Page&{q?:string}={})=>getPage<ServiceInstallation>('/service/installations',q),
 equipment:(id:string,q:Page={})=>getPage<ServiceEquipment>(`/service/installations/${id}/equipment`,q),
 people:(role:string,installationId?:string,q:Page&{q?:string}={})=>getPage<ServicePerson>('/service/people',{...q,role,installationId}),
 components:(q:Page&{q?:string}={})=>getPage<{id:string;name:string;sku:string;unit:string;category:string}>('/service/components',q),
 skills:(q:Page&{q?:string}={})=>getPage<{id:string;code:string;name:string;minimumLevel:number;requiresCertification:boolean}>('/service/skills',q),
 tickets:(q:Query={})=>getPage<ServiceTicket>('/service/tickets',q),
 workContext:(id:string)=>getData<{ticket:ServiceTicket;assignments:ServiceAssignment[];visits:ServiceVisit[];diagnoses:ServiceDiagnosis[];repairs:ServiceRepair[];evidence:ServiceEvidence[];scope:string}>(`/service/tickets/${id}/work-context`),
 detail:(id:string)=>getData<ServiceTicket>(`/service/tickets/${id}`),
 create:(body:unknown)=>postData<ServiceTicket>('/service/tickets',body),
 edit:(id:string,body:unknown)=>patchData<ServiceTicket>(`/service/tickets/${id}`,body),
 command:(id:string,action:string,body:unknown)=>postData<unknown>(`/service/tickets/${id}/${action}`,body),
 visit:(id:string,visitId:string,action:string,body:unknown)=>postData<unknown>(`/service/tickets/${id}/visits/${visitId}/${action}`,body),
 reschedule:(id:string,visitId:string,body:unknown)=>patchData<unknown>(`/service/tickets/${id}/visits/${visitId}`,body),
 repair:(id:string,repairId:string,action:string,body:unknown)=>postData<unknown>(`/service/tickets/${id}/repairs/${repairId}/${action}`,body),
 cancelPart:(id:string,partId:string,body:unknown)=>postData<unknown>(`/service/tickets/${id}/parts/${partId}/cancel`,body),
 collection:<T>(id:string,kind:string,page=1)=>getPage<T>(`/service/tickets/${id}/${kind}`,{page,pageSize:20}),
 warranty:(id:string)=>getData<{current:{context:{data:{id:string;reference:string;coverageType:string;effectiveStatus:string;verifiedStartDate:string|null;expiresAt:string|null}[]}|null;capturedAt:string;coverageTruncated?:boolean;limitation?:string};capturedContext:unknown;limitations:string[]}>(`/service/tickets/${id}/warranty`),
 availability:(id:string,q:{userId:string;from:string;to:string})=>getData<{userId:string;name:string;managed:boolean;committable:boolean;status:string;reasons:string[];from:string;to:string}>(`/service/tickets/${id}/availability`,{params:q}),
 upload:(id:string,file:File,params:Record<string,string|number>)=>uploadEvidence<{evidence:ServiceEvidence;ticketVersion:number}>(`/service/tickets/${id}/evidence`,file,params),
 download:async(id:string,file:ServiceEvidence)=>{const r=await apiClient.get<Blob>(`/service/tickets/${id}/evidence/${file.id}/download`,{responseType:'blob'});const url=URL.createObjectURL(r.data),a=document.createElement('a');a.href=url;a.download=file.fileName;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);},
 policies:(q:Page&{q?:string}={})=>getPage<ServiceSlaPolicy>('/service/sla/policies',q),
 createSla:(body:unknown)=>postData<ServiceSlaPolicy>('/service/sla/policies',body),
 plans:(q:Page={},due=false)=>getPage<ServiceMaintenancePlan>(due?'/service/maintenance/due':'/service/maintenance/plans',q),
 plan:(id:string)=>getData<ServiceMaintenancePlan>(`/service/maintenance/plans/${id}`),
 occurrences:(id:string,page=1)=>getPage<ServiceOccurrence>(`/service/maintenance/plans/${id}/occurrences`,{page,pageSize:20}),
 createPlan:(body:unknown)=>postData<ServiceMaintenancePlan>('/service/maintenance/plans',body),
 updatePlan:(id:string,body:unknown)=>patchData<unknown>(`/service/maintenance/plans/${id}`,body),
 planCommand:(id:string,action:string,body:unknown)=>postData<unknown>(`/service/maintenance/plans/${id}/${action}`,body),
 cancelOccurrence:(id:string,occurrenceId:string,body:unknown)=>postData<unknown>(`/service/maintenance/plans/${id}/occurrences/${occurrenceId}/cancel`,body),
 workload:(q:Page={})=>getData<{data:ServiceVisit[];pagination:{totalItems:number};actualWorkedHours:null;limitations:string}>('/service/technician-workload',{params:q}),
 summary:()=>getData<{open:number;resolved:number;closed:number;awaitingParts:number;overdueUnresolved:number;asOf:string;notificationDelivery:string}>('/service/summary'),
 grants:(installationId:string,page=1)=>getPage<{id:string;installationId:string;userId:string;role:string;isActive:boolean;version:number}>('/service/access',{installationId,page,pageSize:20}),
 grant:(id:string,body:unknown)=>postData<unknown>(`/service/installations/${id}/access`,body),
 revoke:(id:string,body:unknown)=>postData<unknown>(`/service/access/${id}/revoke`,body)
};
