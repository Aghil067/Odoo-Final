import express,{Router,type Request,type Response} from 'express';
import { rateLimit } from 'express-rate-limit';
import { env } from '../../config/env.js';
import { ApiError,success } from '../../lib/http.js';
import {actor,authenticate,allowRoles,requireCsrf} from '../auth/auth.js';
import { LocalSurveyStorage,type SurveyStorage } from '../surveys/storage.js';
import * as v from './validation.js';
import * as jobs from './job.service.js';
import * as execution from './execution.service.js';
import * as review from './review.service.js';
import * as read from './read.service.js';
import * as files from './attachments.service.js';
export function createInstallationRouter(storage:SurveyStorage=new LocalSurveyStorage(env.INSTALLATION_STORAGE_DIR,env.INSTALLATION_MAX_FILE_BYTES)){
 const router=Router();router.use(authenticate,allowRoles('ADMIN','TECHNICIAN','SALES','WAREHOUSE','FINANCE'),requireCsrf);
 const id=(req:Request)=>v.path.parse(req.params).id;
 const list=(res:Response,r:{data:unknown;pagination:unknown})=>success(res,r.data,200,{pagination:r.pagination});
 const editors=allowRoles('ADMIN','TECHNICIAN');
 router.get('/summary',async(req,res)=>{v.page.pick({}).parse(req.query);return success(res,await read.summary(actor(req)));});
 router.get('/',async(req,res)=>list(res,await read.listJobs(actor(req),v.list.parse(req.query))));
 router.post('/',allowRoles('ADMIN'),async(req,res)=>success(res,await jobs.createJob(actor(req),v.create.parse(req.body)),201));
 router.get('/:id',async(req,res)=>success(res,await read.detail(actor(req),id(req))));
 router.patch('/:id',editors,async(req,res)=>success(res,await jobs.updateJob(actor(req),id(req),v.patch.parse(req.body))));
 router.post('/:id/assign',allowRoles('ADMIN'),async(req,res)=>success(res,await jobs.assign(actor(req),id(req),v.assign.parse(req.body))));
 router.post('/:id/site-readiness',editors,async(req,res)=>success(res,await execution.siteReadiness(actor(req),id(req),v.readiness.parse(req.body))));
 router.post('/:id/confirm-receipt',editors,async(req,res)=>success(res,await execution.confirmReceipt(actor(req),id(req),v.receipt.parse(req.body))));
 router.post('/:id/equipment/verify',editors,async(req,res)=>success(res,await execution.confirmReceipt(actor(req),id(req),v.receipt.parse(req.body))));
 router.post('/:id/equipment/install',editors,async(req,res)=>success(res,await execution.install(actor(req),id(req),v.install.parse(req.body))));
 router.get('/:id/equipment-reference',allowRoles('ADMIN','WAREHOUSE'),async(req,res)=>success(res,await read.warehouseEquipment(actor(req),id(req))));
 for(const action of ['start','hold','resume','submit-completion','begin-testing','cancel','request-rework'] as const)router.post(`/:id/${action}`,editors,async(req,res)=>success(res,await jobs.transition(actor(req),id(req),action,v.command.parse(req.body))));
 for(const kind of ['milestones','equipment','issues','tests','attachments','history','receipts','readiness','reviews'] as const)router.get(`/:id/${kind}`,async(req,res)=>list(res,await read.collection(actor(req),id(req),v.page.parse(req.query),kind)));
 router.put('/:id/milestones/:milestoneId',editors,async(req,res)=>{const p=v.milestonePath.parse(req.params);return success(res,await execution.milestone(actor(req),p.id,p.milestoneId,v.milestone.parse(req.body)));});
 router.post('/:id/issues',editors,async(req,res)=>success(res,await execution.reportIssue(actor(req),id(req),v.issue.parse(req.body)),201));
 router.patch('/:id/issues/:issueId',editors,async(req,res)=>{const p=v.issuePath.parse(req.params);return success(res,await execution.resolveIssue(actor(req),p.id,p.issueId,v.resolve.parse(req.body)));});
 router.post('/:id/tests',editors,async(req,res)=>success(res,await review.recordTest(actor(req),id(req),v.test.parse(req.body)),201));
 router.post('/:id/submit-commissioning',editors,async(req,res)=>success(res,await review.submitCommissioning(actor(req),id(req),v.command.parse(req.body))));
 router.post('/:id/review',allowRoles('ADMIN'),async(req,res)=>success(res,await review.review(actor(req),id(req),v.review.parse(req.body))));
 router.get('/:id/commissioned',async(req,res)=>success(res,await review.commissioned(actor(req),id(req))));
 const raw=express.raw({type:['image/jpeg','image/png','application/pdf'],limit:env.INSTALLATION_MAX_FILE_BYTES,inflate:false});
 router.post('/:id/attachments',editors,rateLimit({windowMs:15*60000,limit:10,standardHeaders:'draft-8',legacyHeaders:false,handler:(_req,_res,next)=>next(new ApiError(429,'RATE_LIMITED','Too many installation uploads'))}),async(req,_res,next)=>{
  const input=v.upload.parse(req.query);await files.preflight(actor(req),id(req),input.version);
  if(!req.is(['image/jpeg','image/png','application/pdf']))throw new ApiError(415,'UNSUPPORTED_MEDIA_TYPE','Upload raw JPEG/PNG/PDF bytes');next();
 },(req,res,next)=>raw(req,res,(error:unknown)=>{
  if(error){const type=typeof error==='object'&&error!==null&&'type' in error?error.type:undefined;return next(new ApiError(type==='entity.too.large'?413:415,type==='entity.too.large'?'FILE_TOO_LARGE':'INVALID_UPLOAD_BODY','Upload exceeds limits or uses unsupported encoding'));}next();
 }),async(req,res)=>{
  if(!Buffer.isBuffer(req.body))throw new ApiError(422,'BINARY_FILE_REQUIRED','Send raw file bytes');
  const mime=req.get('Content-Type')!.split(';')[0]!.trim().toLowerCase();return success(res,await files.upload(actor(req),id(req),v.upload.parse(req.query),req.body,mime,storage),201);
 });
 router.get('/:id/attachments/:attachmentId/download',async(req,res)=>{const p=v.attachmentPath.parse(req.params);const file=await files.download(actor(req),p.id,p.attachmentId,storage);res.setHeader('Content-Type',file.mimeType);res.setHeader('Content-Disposition',`attachment; filename="${file.fileName}"`);res.setHeader('Content-Security-Policy',"sandbox; default-src 'none'");return res.status(200).send(file.bytes);});
 router.use((_req,_res,next)=>next(new ApiError(404,'NOT_FOUND','Installation endpoint not found')));
 return router;
}
