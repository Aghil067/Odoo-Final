import {apiClient,getData,getPage,postData,patchData,uploadEvidence} from '../../../services/apiClient';
export const warrantyDocuments=['WARRANTY_CERTIFICATE','MANUFACTURER_REGISTRATION','PURCHASE_PROOF','DELIVERY_PROOF','INSTALLATION_COMPLETION','CLAIM_PHOTO','INVESTIGATION_REPORT','PROVIDER_RESPONSE','OTHER'] as const;
export const registrationStates=['DRAFT','PENDING_EVIDENCE','PENDING_REVIEW','ACTIVE','REJECTED','VOIDED'];
export const claimStates=['SUBMITTED','UNDER_REVIEW','EVIDENCE_REQUIRED','ELIGIBLE','INELIGIBLE','SUBMITTED_TO_PROVIDER','PROVIDER_RESPONSE_PENDING','APPROVED','DENIED','RESOLVED','CLOSED','CANCELLED'];
export interface WarrantyPolicy {id:string;reference:string;name:string;version:number;currentVersion:number;isActive:boolean}
export interface WarrantyPolicyVersion {id:string;policyId:string;version:number;coverageType:string;providerType:string;providerName:string;applicableComponentId:string|null;applicableCategory:string|null;duration:number;durationUnit:string;startRule:string;coverageDescription:string;exclusions:string|null;claimConditions:string|null;requiredDocuments:string[];claimRequiredDocuments:string[];requiresProviderRegistration:boolean;registrationDeadlineDays:number|null;effectiveFrom:string;effectiveTo:string|null;backdatingReason:string|null;publicationReason:string}
export interface WarrantyInstallation {id:string;reference:string;name:string;customerId:string;siteId:string;commissionedAt:string;deliveryConfirmedAt:string|null}
export interface WarrantyRegistration {id:string;reference:string;installationId:string;customerId:string;siteId:string;policyId:string;policyVersion:number;coverageType:string;equipmentId:string|null;componentId:string|null;serialUnitId:string|null;coverageQuantity:string;status:string;effectiveStatus:string;version:number;proposedStartDate:string|null;dateSourceNotes:string|null;providerRegistrationReference:string|null;providerRegisteredAt:string|null;verifiedStartDate:string|null;expiresAt:string|null;activatedAt:string|null;registeredById:string;policySnapshot:WarrantyPolicyVersion&{policyName:string;policyReference:string}}
export interface WarrantyClaim {id:string;reference:string;registrationId:string;reportedIssue:string;failureDate:string|null;claimType:string;priority:string;status:string;version:number;contentRevision:number;submittedById:string;responsibleReviewerId:string|null;providerClaimReference:string|null;investigationNotes:string|null;finalDecision:string|null;decisionDate:string|null;resolution:string|null;resolvedAt:string|null;createdAt:string}
export interface WarrantyEvidence {id:string;documentType:string;fileName:string;mimeType:string;sizeBytes:number;sha256:string;createdAt:string}
export interface WarrantyAssessment {id:string;result:string;notes:string;claimVersion:number;contentRevision:number;findings:{code?:string;message?:string}[];createdAt:string}
export interface CoverageCandidate {component:{id:string;name:string;sku:string}|null;serialNumber:string|null;coverageKey:string;equipmentId:string|null;componentId:string|null;serialUnitId:string|null;quantity:string;canRegister:boolean;existingRegistration:{id:string;status:string}|null}
export interface WarrantyAccess {id:string;installationId:string;userId:string;version:number;isActive:boolean;user:{id:string;name:string;isActive:boolean;role:string}}
type Paging={page?:number;pageSize?:number};
type Query=Paging&{q?:string;installationId?:string;policyId?:string;status?:string;effective?:string;sort?:string};
export const warrantyClient={
 installations:(q:Paging&{q?:string}={})=>getPage<WarrantyInstallation>('/warranties/installations',q),
 assignees:(role:'ADMIN'|'SUPPORT',q:Paging&{q?:string}={})=>getPage<{id:string;name:string;role:string}>('/warranties/assignees',{...q,role}),
 policies:(q:Paging&{q?:string}={})=>getPage<WarrantyPolicy>('/warranties/policies',q),
 policy:(id:string)=>getData<{policy:WarrantyPolicy;currentRevision:WarrantyPolicyVersion}>(`/warranties/policies/${id}`),
 policyVersions:(id:string,page=1)=>getPage<WarrantyPolicyVersion>(`/warranties/policies/${id}/versions`,{page,pageSize:20}),
 createPolicy:(body:unknown)=>postData<{policy:WarrantyPolicy;revision:WarrantyPolicyVersion}>('/warranties/policies',body),
 publishPolicy:(id:string,body:unknown)=>postData<{policy:WarrantyPolicy;revision:WarrantyPolicyVersion}>(`/warranties/policies/${id}/versions`,body),
 policyCommand:(id:string,action:string,body:unknown)=>postData<WarrantyPolicy>(`/warranties/policies/${id}/${action}`,body),
 renamePolicy:(id:string,body:unknown)=>patchData<WarrantyPolicy>(`/warranties/policies/${id}`,body),
 registrations:(q:Query={},mode:'registrations'|'expiring'|'pending'='registrations',days?:number)=>getPage<WarrantyRegistration>('/warranties/'+mode,{...q,...(days?{days}:{})}),
 registration:(id:string)=>getData<WarrantyRegistration>(`/warranties/registrations/${id}`),
 activation:(id:string)=>getData<{findings:{code:string;message:string}[];startRule:string;candidateStart:string|null;candidateExpiry:string|null;calendarSemantics:string}>(`/warranties/registrations/${id}/activation`),
 createRegistration:(body:unknown)=>postData<WarrantyRegistration>('/warranties/registrations',body),
 editRegistration:(id:string,body:unknown)=>patchData<WarrantyRegistration>(`/warranties/registrations/${id}`,body),
 registrationCommand:(id:string,action:string,body:unknown)=>postData<unknown>(`/warranties/registrations/${id}/${action}`,body),
 eligibility:(id:string,policyId:string,page=1)=>getData<{installationId:string;policyId:string;policyVersion:number;policyActive:boolean;data:CoverageCandidate[];pagination:{totalItems:number};scope:string}>(`/warranties/installations/${id}/eligibility`,{params:{policyId,page,pageSize:20,unregistered:'false'}}),
 coverage:(id:string,page=1)=>getData<{data:WarrantyRegistration[];pagination:{totalItems:number};claimHistory:Pick<WarrantyClaim,'id'|'reference'|'status'|'createdAt'|'finalDecision'|'decisionDate'|'resolvedAt'>[];claimHistoryTruncated:boolean}>(`/warranties/installations/${id}/coverage`,{params:{page,pageSize:20}}),
 claims:(q:Paging&{q?:string;installationId?:string;claimStatus?:string}={})=>getPage<WarrantyClaim>('/warranties/claims',q),
 claim:(id:string)=>getData<{claim:WarrantyClaim;registration:WarrantyRegistration;latestAssessment:WarrantyAssessment|null}>(`/warranties/claims/${id}`),
 createClaim:(body:unknown)=>postData<WarrantyClaim>('/warranties/claims',body),
 editClaim:(id:string,body:unknown)=>patchData<WarrantyClaim>(`/warranties/claims/${id}`,body),
 claimCommand:(id:string,action:string,body:unknown)=>postData<unknown>(`/warranties/claims/${id}/${action}`,body),
 collection:<T>(id:string,parent:'registrations'|'claims',kind:string,page=1)=>getPage<T>(`/warranties/${parent}/${id}/${kind}`,{page,pageSize:20}),
 upload:(id:string,parent:'registrations'|'claims',file:File,params:Record<string,string|number>)=>uploadEvidence<{evidence:WarrantyEvidence;ownerVersion:number}>(`/warranties/${parent}/${id}/evidence`,file,params),
 download:async(file:WarrantyEvidence)=>{const response=await apiClient.get<Blob>(`/warranties/evidence/${file.id}/download`,{responseType:'blob'});const url=URL.createObjectURL(response.data),a=document.createElement('a');a.href=url;a.download=file.fileName;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);},
 access:(installationId:string,page=1)=>getPage<WarrantyAccess>('/warranties/access',{installationId,page,pageSize:20}),
 grant:(id:string,body:unknown)=>postData<WarrantyAccess>(`/warranties/installations/${id}/access`,body),
 revoke:(id:string,body:unknown)=>postData<WarrantyAccess>(`/warranties/access/${id}/revoke`,body),
 summary:()=>getData<{active:number;expired:number;expiring30:number;expiring60:number;expiring90:number;awaitingEvidence:number;awaitingReview:number;openClaims:number;awaitingProvider:number;asOf:string;notificationDelivery:string}>('/warranties/summary')
};
