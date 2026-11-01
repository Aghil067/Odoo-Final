import {getData,getPage,postData,unsupported} from '../../../services/apiClient';
import {mapLead,type LeadRecord} from './enquiryService';
import type {FollowUp,FollowUpFilters,FollowUpFormData,CompleteFollowUpData,RescheduleFollowUpData} from '../types/followUp.types';
function map(r:LeadRecord):FollowUp{if(!r.nextFollowUpAt)unsupported('A lead without a scheduled follow-up');const l=mapLead(r);return {id:r.id,version:r.version,followUpId:r.reference,customerId:r.customerId,customerName:l.customerName,enquiryId:r.id,enquiryRef:r.reference,assignedTo:r.assignedToId??'',assignedToName:l.assignedToName,followUpDate:r.nextFollowUpAt!,followUpTime:new Date(r.nextFollowUpAt!).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',hour12:false}),type:'unspecified',status:'pending',createdAt:r.createdAt,updatedAt:r.updatedAt};}
function version(v?:number){if(!v)unsupported('Changing a follow-up without its loaded lead version');return v;}
interface ActionResult{lead:LeadRecord;activity:{id:string;createdAt:string};scheduledFor:string}
async function action(id:string,body:unknown,status:FollowUp['status']){const r=await postData<ActionResult>(`/leads/${id}/follow-up`,body);return {...map({...r.lead,nextFollowUpAt:r.scheduledFor}),status};}
async function list(f:FollowUpFilters={},customerId?:string){if(f.status&&f.status!=='pending')unsupported('Separate completed/cancelled follow-up entities; use lead activity history');const r=await getPage<LeadRecord>('/leads',{customerId,q:f.search||undefined,assignedToId:f.assignedTo||undefined,followUp:f.dateFilter&&f.dateFilter!=='all'?f.dateFilter:'scheduled',page:f.page??1,pageSize:f.pageSize??10});return {data:r.data.map(map),total:r.total};}
export const followUpService={list,
 async getByLeadId(id:string){const row=await getData<LeadRecord>(`/leads/${id}`);return row.nextFollowUpAt&&!['LOST','DISQUALIFIED'].includes(row.status)?[map(row)]:[];},
 async getByCustomerId(id:string){return (await list({pageSize:100},id)).data;},
 async create(data:FollowUpFormData){if(!data.enquiryId)unsupported('Follow-ups without a selected customer lead');return action(data.enquiryId,{version:version(data.version),action:data.reschedule?'RESCHEDULE':'SCHEDULE',scheduledAt:new Date(data.followUpDate+'T'+data.followUpTime).toISOString(),notes:`${data.type}: ${data.notes||'Follow-up requested'}`},'pending');},
 async update():Promise<FollowUp>{return unsupported('Unversioned follow-up edits; use reschedule');},
 async complete(id:string,data:CompleteFollowUpData):Promise<FollowUp>{return action(id,{version:version(data.version),action:'COMPLETE',scheduledAt:null,notes:data.outcomeNote},'completed');},
 async reschedule(id:string,data:RescheduleFollowUpData){return action(id,{version:version(data.version),action:'RESCHEDULE',scheduledAt:new Date(data.followUpDate+'T'+data.followUpTime).toISOString(),notes:data.notes||'User requested rescheduling'},'pending');},
 async cancel(id:string,v?:number){return action(id,{version:version(v),action:'CANCEL',scheduledAt:null,notes:'User canceled the current follow-up'},'cancelled');},
 async getDashboardStats(){const r=await getData<{scheduledFollowUps:number;overdueFollowUps:{total:number};upcomingFollowUps:{total:number}}>('/crm/summary');return {pending:r.scheduledFollowUps,overdue:r.overdueFollowUps.total,upcoming:r.upcomingFollowUps.total,total:r.scheduledFollowUps,completed:null};}
};
