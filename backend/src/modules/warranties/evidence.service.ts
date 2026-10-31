import {createHash} from 'node:crypto';
import {Prisma} from '@prisma/client';
import {z} from 'zod';
import {ApiError} from '../../lib/http.js';
import type {Principal} from '../auth/auth.js';
import type {SurveyStorage} from '../surveys/storage.js';
import {validateFile} from '../surveys/attachments.service.js';
import {caseWorker,warrantyAtomic,registration,claim,saveRegistration,saveClaim,evidencePublic} from './common.js';
import * as v from './validation.js';
const hash=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
export async function preflight(user:Principal,id:string,version:number,parent:'registration'|'claim'){
 caseWorker(user);return warrantyAtomic(async tx=>{const owner=parent==='registration'?await registration(tx,user,id,version):await claim(tx,user,id,version);if(parent==='registration'?['REJECTED','VOIDED'].includes(owner.status):['CLOSED','CANCELLED'].includes(owner.status))throw new ApiError(409,'WARRANTY_EVIDENCE_FROZEN','Terminal owner cannot accept evidence');const regId=parent==='registration'?id:(owner as Awaited<ReturnType<typeof claim>>).registrationId;if(await tx.warrantyEvidence.count({where:{registrationId:regId,claimId:parent==='claim'?id:null}})>=50)throw new ApiError(409,'EVIDENCE_LIMIT','At most50 private objects per registration or claim');});
}
export async function upload(user:Principal,id:string,input:z.infer<typeof v.upload>,bytes:Buffer,mime:string,parent:'registration'|'claim',storage:SurveyStorage){
 await preflight(user,id,input.version,parent);const extension=validateFile(bytes,mime,input.fileName,'SUPPORTING_FILE'),stored=await storage.put(bytes,extension);
 try{return await warrantyAtomic(async tx=>{
  const owner=parent==='registration'?await registration(tx,user,id,input.version):await claim(tx,user,id,input.version);
  if(parent==='registration'?['REJECTED','VOIDED'].includes(owner.status):['CLOSED','CANCELLED'].includes(owner.status))throw new ApiError(409,'WARRANTY_EVIDENCE_FROZEN','Terminal owner cannot accept evidence');
  const regId=parent==='registration'?id:(owner as Awaited<ReturnType<typeof claim>>).registrationId;
  if(await tx.warrantyEvidence.count({where:{registrationId:regId,claimId:parent==='claim'?id:null}})>=50)throw new ApiError(409,'EVIDENCE_LIMIT','At most50 objects per exact owner');
  const evidence=await tx.warrantyEvidence.create({data:{registrationId:regId,claimId:parent==='claim'?id:null,documentType:input.documentType,fileName:input.fileName,mimeType:mime,sizeBytes:bytes.length,sha256:hash(bytes),storageKey:stored.key,uploaderId:user.id},select:evidencePublic});
  const ownerVersion=parent==='registration'?(await saveRegistration(tx,user,owner as Awaited<ReturnType<typeof registration>>,{},'EVIDENCE_ADDED',input.reason,{evidenceId:evidence.id,sha256:evidence.sha256})).version:(await saveClaim(tx,user,owner as Awaited<ReturnType<typeof claim>>,{},'EVIDENCE_ADDED',input.reason,{evidenceId:evidence.id,sha256:evidence.sha256},undefined,true)).version;
  return {evidence,ownerVersion};
 });}catch(error){const rolledBack=error instanceof ApiError||(error instanceof Prisma.PrismaClientKnownRequestError&&['P2002','P2003','P2004','P2025','P2034'].includes(error.code));if(rolledBack)await stored.discard().catch(()=>console.error(JSON.stringify({event:'warranty_upload_cleanup_failed'})));else console.error(JSON.stringify({event:'warranty_upload_reconciliation_required'}));throw error;}
}
export async function download(user:Principal,evidenceId:string,storage:SurveyStorage){
 caseWorker(user);const file=await warrantyAtomic(async tx=>{const e=await tx.warrantyEvidence.findUniqueOrThrow({where:{id:evidenceId}});await registration(tx,user,e.registrationId);if(e.claimId)await claim(tx,user,e.claimId);return e;});const bytes=await storage.read(file.storageKey);if(bytes.length!==file.sizeBytes||hash(bytes)!==file.sha256)throw new ApiError(409,'STORAGE_INTEGRITY_ERROR','Evidence content differs from recorded checksum');return {bytes,mimeType:file.mimeType,fileName:file.fileName};
}
