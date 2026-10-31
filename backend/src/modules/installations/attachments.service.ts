import { createHash } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { ApiError } from '../../lib/http.js';
import type { Principal } from '../auth/auth.js';
import type { SurveyStorage } from '../surveys/storage.js';
import { validateFile } from '../surveys/attachments.service.js';
import { installationAtomic,requireJob,saveJob } from './common.js';
import {attachmentPublic} from './policy.js';
import * as v from './validation.js';
const hash=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
export function preflight(user:Principal,id:string,version:number){return installationAtomic(async tx=>{
 await requireJob(tx,user,id,version,true);
 if(await tx.installationAttachment.count({where:{jobId:id}})>=50)throw new ApiError(409,'ATTACHMENT_LIMIT','At most 50 evidence objects per installation');
});}
export async function upload(user:Principal,id:string,input:z.infer<typeof v.upload>,bytes:Buffer,mime:string,storage:SurveyStorage){
 await preflight(user,id,input.version);
 const extension=validateFile(bytes,mime,input.fileName,'SUPPORTING_FILE');
 const stored=await storage.put(bytes,extension);
 try{return await installationAtomic(async tx=>{
  const row=await requireJob(tx,user,id,input.version,true);
  if(await tx.installationAttachment.count({where:{jobId:id}})>=50)throw new ApiError(409,'ATTACHMENT_LIMIT','At most 50 evidence objects per installation');
  if(input.milestoneId&&!await tx.installationMilestone.count({where:{id:input.milestoneId,jobId:id}}))throw new ApiError(422,'EVIDENCE_OWNERSHIP','Milestone belongs to another job');
  if(input.issueId&&!await tx.installationIssue.count({where:{id:input.issueId,jobId:id}}))throw new ApiError(422,'EVIDENCE_OWNERSHIP','Issue belongs to another job');
  const attachment=await tx.installationAttachment.create({data:{jobId:id,milestoneId:input.milestoneId,issueId:input.issueId,category:input.category,fileName:input.fileName,mimeType:mime,sizeBytes:bytes.length,sha256:hash(bytes),storageKey:stored.key,uploaderId:user.id},select:attachmentPublic});
  const job=await saveJob(tx,user,row,{},'ATTACHMENT_ADDED',input.reason,{attachmentId:attachment.id,sha256:attachment.sha256});
  return {attachment,jobVersion:job.version};
 });}catch(error){
  const rolledBack=error instanceof ApiError||(error instanceof Prisma.PrismaClientKnownRequestError&&['P2002','P2003','P2004','P2025','P2034'].includes(error.code));
  if(rolledBack)await stored.discard().catch(()=>console.error(JSON.stringify({event:'installation_upload_cleanup_failed'})));
  else console.error(JSON.stringify({event:'installation_upload_reconciliation_required'}));
  throw error;
 }
}
export async function download(user:Principal,id:string,attachmentId:string,storage:SurveyStorage){
 const file=await installationAtomic(async tx=>{
  await requireJob(tx,user,id);if(user.role==='FINANCE')throw new ApiError(403,'COMPLETION_SUMMARY_ONLY','FINANCE has no private evidence download permission');
  const row=await tx.installationAttachment.findFirst({where:{id:attachmentId,jobId:id}});if(!row)throw new ApiError(404,'ATTACHMENT_NOT_FOUND','Attachment not found');return row;
 });
 const bytes=await storage.read(file.storageKey);
 if(bytes.length!==file.sizeBytes||hash(bytes)!==file.sha256)throw new ApiError(409,'STORAGE_INTEGRITY_ERROR','Private file differs from recorded digest');
 return {bytes,fileName:file.fileName,mimeType:file.mimeType};
}
