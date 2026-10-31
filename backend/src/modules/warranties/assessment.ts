import {Prisma} from '@prisma/client';
import {ApiError} from '../../lib/http.js';
import {createHash} from 'node:crypto';
import type {Transaction} from '../../lib/db.js';
import type {WarrantyClaim,WarrantyAssessmentResult} from '@prisma/client';
import {z} from 'zod';
import {installedIdentity,type Finding} from './eligibility.js';
import {today} from './dates.js';
import * as v from './validation.js';
export async function assess(tx:Transaction,row:WarrantyClaim,attestation:z.infer<typeof v.assessment>['attestation']){
 const reg=await tx.warrantyRegistration.findUniqueOrThrow({where:{id:row.registrationId}}),p=await tx.warrantyPolicyVersion.findUniqueOrThrow({where:{policyId_version:{policyId:reg.policyId,version:reg.policyVersion}}}),findings:Finding[]=[];
 const add=(code:string,message:string,kind:Finding['kind'])=>findings.push({code,message,kind});
 const evidence=await tx.warrantyEvidence.findMany({where:{registrationId:reg.id,OR:[{claimId:null},{claimId:row.id}]},select:{id:true,documentType:true,sha256:true},take:101,orderBy:{id:'asc'}});
 const previous=await tx.warrantyClaim.findMany({where:{registrationId:reg.id,id:{not:row.id}},select:{id:true,status:true,version:true},take:101,orderBy:{id:'asc'}});
 const responses=await tx.warrantyProviderResponse.findMany({where:{claimId:row.id},orderBy:{claimVersion:'desc'},take:51});
 if(['VOIDED','REJECTED'].includes(reg.status))add('REGISTRATION_INVALID','Registration was voided/rejected; investigation may continue but coverage cannot be presumed','BLOCKER');
 else if(reg.status!=='ACTIVE'||!reg.verifiedStartDate||!reg.expiresAt)add('REGISTRATION_NOT_ACTIVE','Registration has no verified active coverage dates','EVIDENCE');
 if(!row.failureDate)add('FAILURE_DATE_UNKNOWN','Observed failure/discovery date needs evidence','EVIDENCE');
 else if(row.failureDate>today())add('FUTURE_FAILURE_DATE','Failure date cannot be future','BLOCKER');
 else if(reg.verifiedStartDate&&reg.expiresAt&&(row.failureDate<reg.verifiedStartDate||row.failureDate>=reg.expiresAt))add('FAILURE_OUTSIDE_COVERAGE','Reported failure date is outside the original start-inclusive/expiry-exclusive period','BLOCKER');
 for(const type of p.claimRequiredDocuments)if(!evidence.some(e=>e.documentType===type))add('CLAIM_DOCUMENT_MISSING',`Claim requires ${type}`,'EVIDENCE');
 if(p.requiresProviderRegistration&&(!reg.providerRegistrationReference||!reg.providerRegisteredAt))add('PROVIDER_REGISTRATION_UNKNOWN','Provider registration fact is missing','EVIDENCE');
 try{const identity=await installedIdentity(tx,reg.installationId,reg.policyId,reg.policyVersion,reg.equipmentId,reg.serialUnitId);if(identity.coverageKey!==reg.coverageKey||identity.handoff.commissioningReviewId!==reg.commissioningReviewId)add('IDENTITY_MISMATCH','Original installation/equipment identity does not reconcile','BLOCKER');}catch(error){if(!(error instanceof ApiError)&&!(error instanceof Prisma.PrismaClientKnownRequestError&&error.code==='P2025'))throw error;add('INSTALLATION_IDENTITY_UNVERIFIED','Commissioned installation/serial handoff cannot be established','MANUAL');}
 if(!attestation.identityConfirmed||!attestation.reportedDateVerified||!attestation.documentsReviewed||!attestation.installationReviewed)add('REVIEW_ATTESTATION_REQUIRED','Qualified human must inspect identity, failure-date evidence, documents and installation context','MANUAL');
 if(p.exclusions&&attestation.exclusionApplies===null)add('EXCLUSIONS_NEED_REVIEW','Free-text exclusions are not automatically interpreted','MANUAL');
 if(attestation.exclusionApplies===true)add('EXCLUSION_RECORDED','Reviewer records an applicable exclusion','BLOCKER');
 if(p.claimConditions&&attestation.conditionsSatisfied===null)add('CONDITIONS_NEED_REVIEW','Policy conditions require explicit human review','MANUAL');
 if(attestation.conditionsSatisfied===false)add('CONDITIONS_NOT_SATISFIED','Reviewer records unmet claim conditions','BLOCKER');
 if(previous.length&&!attestation.previousClaimsReviewed)add('RELATED_CLAIMS_REVIEW','Previous related claims require human review; no invented claim-limit rule','MANUAL');
 if(responses.length&&!attestation.providerResponseReviewed)add('PROVIDER_RESPONSE_REVIEW','Provider response requires human interpretation','MANUAL');
 if(responses[0]?.response==='DENIED')add('PROVIDER_DENIAL_RECORDED','Latest recorded provider decision is denial; it remains distinct from internal assessment','MANUAL');
 if(evidence.length>100||previous.length>100||responses.length>50)add('ASSESSMENT_DATA_LIMIT','Case exceeds bounded automatic assessment scope','MANUAL');
 const result:WarrantyAssessmentResult=findings.some(f=>f.kind==='BLOCKER')?'NOT_ELIGIBLE':findings.some(f=>f.kind==='EVIDENCE')?'NEEDS_EVIDENCE':findings.length?'NEEDS_MANUAL_REVIEW':'POTENTIALLY_ELIGIBLE';
 const factsKey=createHash('sha256').update(JSON.stringify({registrationId:reg.id,registrationVersion:reg.version,contentRevision:row.contentRevision,policyVersion:reg.policyVersion,evidence,previous,responses:responses.map(p=>p.id)})).digest('hex');
 return {result,findings,factsKey,rulesSnapshot:{policyVersion:reg.policyVersion,policy:p,registrationStatus:reg.status,verifiedStartDate:reg.verifiedStartDate,expiresAt:reg.expiresAt,failureDate:row.failureDate,evidence,relatedClaims:previous,providerResponseIds:responses.map(p=>p.id),factsKey,scope:'ADVISORY_NOT_BINDING_PROVIDER_DECISION'},reg,policy:p,latestProviderResponse:responses[0]??null};
}
