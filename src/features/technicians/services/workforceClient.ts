import {apiClient,getData,getPage,postData,patchData,type Envelope} from '../../../services/apiClient';
export interface WorkforceUser {id:string;name:string;isActive:boolean;technicianProfile:WorkforceProfile|null}
export interface WorkforceProfile {id:string;userId:string;version:number;employeeCode:string;contactPhone:string|null;emergencyContact:{name:string;relationship:string;phone:string}|null;baseLocation:string|null;employmentStatus:string;joinedAt:string;experienceMonths:number;specializations:string[];maxActiveAssignments:number;minimumRestMinutes:number;enforceScheduling:boolean;isActive:boolean;privateNotes?:string|null}
export interface SkillCatalog {id:string;version:number;code:string;name:string;description:string|null;mandatoryFor:string[];minimumLevel:number;requiresCertification:boolean;isActive:boolean}
export interface WorkforceSkill {id:string;skillId:string;level:number;experienceMonths:number;verification:string;evidenceReference:string|null;skill:SkillCatalog}
export interface WorkforceCertification {id:string;version:number;skillId:string;provider:string;certificateNumber:string;issuedAt:string;expiresAt:string;verification:string;evidenceReference:string}
export interface WorkforceShift {id?:string;weekday:number;startMinute:number;endMinute:number;breakStartMinute:number|null;breakEndMinute:number|null}
export interface WorkforceSchedule {id:string;timezone:string;effectiveFrom:string;effectiveTo:string;isActive:boolean;shifts:WorkforceShift[]}
export interface WorkforceException {id:string;version:number;startsAt:string;endsAt:string;kind:string;isActive:boolean;reason:string}
export interface WorkforceLeave {id:string;userId:string;version:number;startsAt:string;endsAt:string;category:string;status:string;privateNotes:string|null;decisionNotes:string|null}
export interface WorkforceTeam {id:string;version:number;code:string;name:string;leadId:string|null;isActive:boolean}
export interface TeamMember {id:string;userId:string;startedAt:string;endedAt:string|null;user:{id:string;name:string;isActive:boolean}}
export interface WorkforceAssignment {id:string;reference?:string;assignedToId?:string;userId?:string;status?:string;scheduledAt?:string|null;scheduledEndAt?:string|null;job?:{id:string;reference:string;status:string;plannedStartAt:string;plannedEndAt:string}}
export interface WorkforceAvailability {userId:string;name:string;from:string;to:string;status:string;reasons:string[];managed:boolean;committable:boolean;coarseInstallationCommittable?:boolean;shiftMinutes?:number;availableShiftMinutes?:number;plannedOccupiedShiftMinutes?:number;freeIntervals:{from:string;to:string}[];activeAssignmentCount?:number;untimedOrOverdueAssignmentCount?:number;conflicts?:{kind:string;id:string;reference:string;from:string;to:string}[];missingQualifications?:{skillId:string;code:string;certificationRequired:boolean}[];utilizationPercent?:null}
export interface WorkforceWorkload {id:string;name:string;activeSurveyAssignments:number;activeInstallationAssignments:number;approvedSurveysAsFinalAssignee:number;commissionedJobsAsFinalAssignee:number;plannedSurveyMinutes:number|null;actualWorkedHours:null;utilizationPercent:null;performanceScope:string}
type Paging={page?:number;pageSize?:number};
export const workforceClient={
 list:(q:Paging&{q?:string}={})=>getPage<WorkforceUser>('/technicians',q),
 detail:(id:string)=>getData<{user:{id:string;name:string;isActive:boolean;role:string};profile:WorkforceProfile|null}>(`/technicians/${id}`),
 createProfile:(id:string,body:unknown)=>postData<WorkforceProfile>(`/technicians/${id}/profile`,body),
 updateProfile:(id:string,body:unknown)=>patchData<WorkforceProfile>(`/technicians/${id}/profile`,body),
 catalog:(q:Paging&{q?:string}={})=>getPage<SkillCatalog>('/technicians/skills/catalog',q),
 createSkill:(body:unknown)=>postData<SkillCatalog>('/technicians/skills/catalog',body),
 updateSkill:(id:string,body:unknown)=>patchData<SkillCatalog>(`/technicians/skills/catalog/${id}`,body),
 collection:<T>(id:string,kind:string,page=1)=>getPage<T>(`/technicians/${id}/${kind}`,{page,pageSize:20}),
 skill:(id:string,body:unknown)=>postData<{skill:WorkforceSkill;profileVersion:number}>(`/technicians/${id}/skills`,body),
 certification:(id:string,body:unknown)=>postData<{certification:WorkforceCertification;profileVersion:number}>(`/technicians/${id}/certifications`,body),
 reviewCertification:(id:string,certificateId:string,body:unknown)=>patchData<WorkforceCertification>(`/technicians/${id}/certifications/${certificateId}`,body),
 schedule:async(id:string,body:unknown)=>(await apiClient.put<Envelope<{schedule:WorkforceSchedule;profileVersion:number}>>(`/technicians/${id}/schedule`,body)).data.data,
 exception:(id:string,body:unknown)=>postData<WorkforceException>(`/technicians/${id}/exceptions`,body),
 cancelException:(id:string,exceptionId:string,body:unknown)=>postData<WorkforceException>(`/technicians/${id}/exceptions/${exceptionId}/cancel`,body),
 leaves:(q:Paging&{userId?:string}={})=>getPage<WorkforceLeave>('/technicians/leaves',q),
 requestLeave:(body:unknown)=>postData<WorkforceLeave>('/technicians/leaves',body),
 reviewLeave:(id:string,body:unknown)=>postData<WorkforceLeave>(`/technicians/leaves/${id}/review`,body),
 cancelLeave:(id:string,body:unknown)=>postData<WorkforceLeave>(`/technicians/leaves/${id}/cancel`,body),
 teams:(q:Paging={})=>getPage<WorkforceTeam>('/technicians/teams',q),
 team:async(id:string,page=1)=>(await apiClient.get<Envelope<{team:WorkforceTeam;data:TeamMember[];pagination:{page:number;pageSize:number;totalItems:number;totalPages:number}}>>(`/technicians/teams/${id}`,{params:{page,pageSize:20}})).data.data,
 createTeam:(body:unknown)=>postData<WorkforceTeam>('/technicians/teams',body),
 updateTeam:(id:string,body:unknown)=>patchData<WorkforceTeam>(`/technicians/teams/${id}`,body),
 addMember:(id:string,body:unknown)=>postData<unknown>(`/technicians/teams/${id}/members`,body),
 removeMember:(id:string,userId:string,body:unknown)=>postData<unknown>(`/technicians/teams/${id}/members/${userId}/remove`,body),
 assignments:(kind:'SURVEY'|'INSTALLATION',q:Paging&{userId?:string}={})=>getPage<WorkforceAssignment>('/technicians/assignments',{...q,kind}),
 workload:(q:Paging&{userId?:string}={})=>getPage<WorkforceWorkload>('/technicians/workload',q),
 availability:(q:Paging&{from:string;to:string;purpose:string})=>getPage<WorkforceAvailability>('/technicians/availability',q),
 summary:()=>getData<{activeTechnicians:number;unprofiledTechnicians:number;managedTechnicians:number;activeTeams:number;scheduledSurveys:number;assignedInstallations:number;unassignedInstallations:number;upcomingApprovedLeaves:number;expiredVerifiedCertifications:number;actualWorkedHours:null;utilizationPercent:null}>('/technicians/summary')
};
