# M07 warranty API contract

Base `/api/warranties`. This describes the implemented router, not a proposed UI. React files are unchanged. All identifiers are UUIDs. Decimal quantities serialize as strings; instants as ISO strings, civil dates as midnight-UTC ISO responses and `YYYY-MM-DD` requests. Never derive entitlement from a frontend component label or mock duration.

## Authentication, scope and transport

Use existing database-backed HttpOnly session cookie (`credentials: 'include'`). Unsafe methods require the existing trusted Origin and session CSRF header `X-CSRF-Token`. Reuse the M01 auth contract; no new login/token/role exists. JSON writes are strict objects: unknown keys fail. Every JSON command requires unique `idempotencyKey` and nonempty `reason`; after creation also send the current entity `version`. Same actor, action, target and parsed payload/key returns the original frozen result, after current authorization is checked; changed payload or actor conflicts. Refresh after a409; deliberately changed commands need a new key. Replay results can be older than current detail responses.

Success is `{data: T}`. Ordinary list responses are `{data: T[], pagination: {page,pageSize,totalItems,totalPages}}`. Context/eligibility responses deliberately nest their `data` and pagination inside the outer success `data`. Errors reuse `{error:{code,message,details?,requestId}}`; handle401,403,404,409,413,415,422,429. Creations, policy versions, assessments, provider responses and uploads return201; other JSON successes200. Protected downloads return binary200.

| Backend role | M07 access |
|---|---|
| ADMIN | Policies, grants, all cases; independent registration approval and final claim decisions. |
| SUPPORT | Case operations only for installations with an active ADMIN-issued grant; claim reviewer operations also require responsible-reviewer assignment. Policies may be read. |
| SALES | Eligibility/coverage summaries only through existing M01 project scope; no private claim bodies/documents. |
| TECHNICIAN | Eligibility/coverage summaries only for actual M05 assigned jobs; no case writes or technical-observation endpoint. M06 profile/team membership alone grants no access. |
| FINANCE | `/outcomes` only: approved outcome references, no reimbursement or case documents. |
| WAREHOUSE | No M07 routes; use existing authorized M04 lookup. |

Frontend lowercase/provisional roles must be mapped from the authenticated backend role; a UI label cannot grant privileges. No customer public portal is introduced.

## Exact routes (51)

Paths below are relative to base. `P` = optional `page` (default1) and `pageSize` (default20, maximum100). All list query objects reject unknown keys. `C` denotes command body below; collection reads always use P.

| Method/path | Request / result |
|---|---|
| POST `/policies` | PolicyCreate -> `{policy,revision}`. ADMIN. |
| GET `/policies` | P, optional q -> header list. ADMIN/SUPPORT. |
| GET `/policies/:id` | -> `{policy,currentRevision}`. |
| PATCH `/policies/:id` | C + name -> header. ADMIN; terms cannot be patched. |
| GET `/policies/:id/versions` | P -> immutable PolicyTerms revisions. |
| POST `/policies/:id/versions` | C + all PolicyTerms -> `{policy,revision}`. ADMIN; version is header optimistic version. |
| POST `/policies/:id/deactivate` | C -> header. ADMIN. |
| GET `/access` | P, optional installationId -> grants including safe user id/name/role/isActive. ADMIN. |
| POST `/installations/:id/access` | `{userId,idempotencyKey,reason}` -> support grant. ADMIN. |
| POST `/access/:id/revoke` | C -> grant; version belongs to grant. ADMIN. |
| POST `/registrations` | RegistrationCreate -> registration. |
| GET `/registrations` | P, optional q,installationId,policyId,status,effective,sort -> registrations. |
| GET `/registrations/:id` | -> registration with effectiveStatus. |
| PATCH `/registrations/:id` | RegistrationPatch -> registration; draft/evidence only. |
| GET `/registrations/:id/activation` | -> Activation; no state change. |
| POST `/registrations/:id/submit` | C -> `{registration,activation:{findings,startDate,expiryDate,startRule,calendarSemantics}}`; pending evidence or review. |
| POST `/registrations/:id/review` | RegistrationReview -> `{registration,decision}`. Independent ADMIN. |
| POST `/registrations/:id/void` | C -> registration. ADMIN; explicit historical decision. |
| GET `/installations/:id/eligibility` | P, required policyId, optional unregistered=`true`/`false` -> Eligibility. Summary scope. |
| GET `/installations/:id/coverage` | P -> CoverageContext. Summary scope. |
| GET `/coverage/:id` | id = original serial-unit UUID, P -> CoverageContext scoped to serial. |
| POST `/claims` | ClaimCreate -> claim; uncertainty may be investigated. |
| GET `/claims` | P, optional q,installationId,claimStatus -> claims. |
| GET `/claims/:id` | -> `{claim,registration,latestAssessment}`. |
| PATCH `/claims/:id` | C + failureDate + investigationNotes -> claim. |
| POST `/claims/:id/assign` | C + reviewerId -> claim. ADMIN; active ADMIN or granted SUPPORT. |
| POST `/claims/:id/start-review` | C -> claim. Assigned reviewer/ADMIN. |
| POST `/claims/:id/request-evidence` | C -> claim. Assigned reviewer/ADMIN. |
| POST `/claims/:id/await-provider` | C -> claim. Assigned reviewer/ADMIN. |
| POST `/claims/:id/cancel` | C -> claim. Submitter or reviewer. |
| POST `/claims/:id/assess` | AssessmentInput -> `{claim,assessment}`. UNDER_REVIEW; reviewer. |
| POST `/claims/:id/review` | ClaimReview -> `{claim,decision}`; advisory reviewer or independent ADMIN for final decision. |
| POST `/claims/:id/submit-provider` | C + providerClaimReference + evidenceIds -> claim; records existing communication, sends nothing. |
| POST `/claims/:id/provider-response` | ProviderInput -> `{claim,response}`. |
| POST `/claims/:id/resolve` | C + resolution + evidenceIds -> claim. |
| POST `/claims/:id/close` | C -> claim. |
| GET `/registrations/:id/evidence` | P -> evidence metadata. |
| GET `/registrations/:id/history` | P -> registration-only history. |
| GET `/registrations/:id/decisions` | P -> registration-only immutable decisions. |
| GET `/claims/:id/evidence` | P -> that claim's evidence metadata. |
| GET `/claims/:id/history` | P -> that claim's history. |
| GET `/claims/:id/decisions` | P -> that claim's immutable decisions. |
| POST `/registrations/:id/evidence` | Raw file + UploadQuery -> `{evidence,ownerVersion}`. |
| POST `/claims/:id/evidence` | Raw file + UploadQuery -> `{evidence,ownerVersion}`. |
| GET `/claims/:id/assessments` | P -> immutable assessment list. |
| GET `/claims/:id/provider-responses` | P -> immutable recorded provider responses. |
| GET `/evidence/:evidenceId/download` | Protected binary; case permission required. |
| GET `/summary` | No query -> MonitoringSummary. |
| GET `/expiring` | Registration filters + optional days1..365(default30) -> registration list. |
| GET `/pending` | Registration filters -> draft/pending-evidence/pending-review list. |
| GET `/outcomes` | P -> approved outcome references; top-level financialSideEffects=`NONE`. ADMIN/FINANCE. |

Registration filters: `status` is persisted RegistrationStatus, `effective` is ACTIVE/EXPIRED/NOT_STARTED, `sort` is newest(default) or expiry. q searches reference. Claim filter `claimStatus` is ClaimStatus. `/summary` has cumulative30/60/90-day expiry counts, not disjoint buckets. `/expiring` returns currently active periods only; reminders are candidates, not delivered notifications.

## TypeScript wire types

```ts
type UUID = string;
type CivilDate = string; // input YYYY-MM-DD, year >=1900
type Instant = string;
type Json = null | boolean | number | string | Json[] | {[key:string]:Json};
type CoverageType = 'MANUFACTURER_PRODUCT'|'MANUFACTURER_PERFORMANCE'|'INSTALLER_WORKMANSHIP'|'EXTENDED_COVERAGE';
type ProviderType = 'MANUFACTURER'|'INSTALLER'|'THIRD_PARTY';
type StartRule = 'DELIVERY_DATE'|'INSTALLATION_COMPLETION_DATE'|'COMMISSIONING_DATE'|'MANUFACTURER_REGISTRATION_DATE'|'PURCHASE_DATE'|'MANUAL_VERIFIED_DATE';
type RegistrationStatus = 'DRAFT'|'PENDING_EVIDENCE'|'PENDING_REVIEW'|'ACTIVE'|'REJECTED'|'VOIDED';
type ClaimStatus = 'SUBMITTED'|'UNDER_REVIEW'|'EVIDENCE_REQUIRED'|'ELIGIBLE'|'INELIGIBLE'|'SUBMITTED_TO_PROVIDER'|'PROVIDER_RESPONSE_PENDING'|'APPROVED'|'DENIED'|'RESOLVED'|'CLOSED'|'CANCELLED';
type AssessmentResult = 'POTENTIALLY_ELIGIBLE'|'NOT_ELIGIBLE'|'NEEDS_EVIDENCE'|'NEEDS_MANUAL_REVIEW';
type DocumentType = 'WARRANTY_CERTIFICATE'|'MANUFACTURER_REGISTRATION'|'PURCHASE_PROOF'|'DELIVERY_PROOF'|'INSTALLATION_COMPLETION'|'CLAIM_PHOTO'|'INVESTIGATION_REPORT'|'PROVIDER_RESPONSE'|'OTHER';
type ComponentCategory = 'SOLAR_PANEL'|'INVERTER'|'BATTERY'|'CHARGE_CONTROLLER'|'MOUNTING_STRUCTURE'|'DC_CABLE'|'AC_CABLE'|'CONNECTOR'|'COMBINER_BOX'|'ISOLATOR'|'SURGE_PROTECTION'|'EARTHING'|'OTHER';
interface C { version:number; idempotencyKey:string; reason:string }
interface PolicyTerms {
 coverageType:CoverageType; providerType:ProviderType; providerName:string;
 applicableComponentId:UUID|null; applicableCategory:ComponentCategory|null;
 duration:number; durationUnit:'DAYS'|'MONTHS'|'YEARS'; startRule:StartRule;
 coverageDescription:string; exclusions:string|null; claimConditions:string|null;
 requiredDocuments:DocumentType[]; claimRequiredDocuments:DocumentType[];
 requiresProviderRegistration:boolean; registrationDeadlineDays:number|null;
 effectiveFrom:CivilDate; effectiveTo:CivilDate|null; backdatingReason:string|null;
}
type PolicyCreate = PolicyTerms & {reference:string;name:string;idempotencyKey:string;reason:string};
interface PolicyHeader {id:UUID;reference:string;name:string;currentVersion:number;isActive:boolean;version:number;createdById:UUID;createdAt:Instant;updatedAt:Instant}
type PolicyRevision = PolicyTerms & {id:UUID;policyId:UUID;version:number;publicationReason:string;publishedById:UUID;createdAt:Instant};
interface RegistrationCreate {installationId:UUID;policyId:UUID;policyVersion:number;equipmentId:UUID|null;serialUnitId:UUID|null;idempotencyKey:string;reason:string}
interface RegistrationPatch extends C {proposedStartDate:CivilDate|null;dateSourceNotes:string|null;providerRegistrationReference:string|null;providerRegisteredAt:CivilDate|null}
interface RegistrationReview extends C {decision:'ACTIVE'|'REJECTED';notes:string;checklist:{identityVerified:boolean;policyTermsVerified:boolean;startEvidenceVerified:boolean;requiredDocumentsVerified:boolean;providerRegistrationVerified:boolean}}
interface Registration {
 id:UUID;reference:string;customerId:UUID;siteId:UUID;installationId:UUID;commissioningReviewId:UUID;
 policyId:UUID;policyVersion:number;coverageType:CoverageType;equipmentId:UUID|null;componentId:UUID|null;serialUnitId:UUID|null;
 coverageQuantity:string;coverageKey:string;policySnapshot:Json;status:RegistrationStatus;
 proposedStartDate:Instant|null;dateSourceNotes:string|null;providerRegistrationReference:string|null;providerRegisteredAt:Instant|null;
 verifiedStartDate:Instant|null;expiresAt:Instant|null;registeredById:UUID;approvedById:UUID|null;approvedVersion:number|null;activatedAt:Instant|null;
 version:number;createdAt:Instant;updatedAt:Instant;effectiveStatus?:RegistrationStatus|'EXPIRED'|'NOT_STARTED'|'NEEDS_REVIEW';
}
interface Finding {code:string;message:string;kind:'BLOCKER'|'EVIDENCE'|'MANUAL'}
interface Activation {registrationId:UUID;findings:Finding[];startRule:StartRule;candidateStart:Instant|null;candidateExpiry:Instant|null;calendarSemantics:string}
interface ClaimCreate {registrationId:UUID;reportedIssue:string;failureDate:CivilDate|null;claimType:string;priority:'LOW'|'NORMAL'|'HIGH'|'URGENT';idempotencyKey:string;reason:string}
interface Claim extends ClaimCreate {id:UUID;reference:string;submittedById:UUID;status:ClaimStatus;responsibleReviewerId:UUID|null;providerClaimReference:string|null;investigationNotes:string|null;finalDecision:string|null;decisionDate:Instant|null;resolution:string|null;resolvedAt:Instant|null;version:number;contentRevision:number;createdAt:Instant;updatedAt:Instant}
// Claim response does not echo command-only idempotencyKey/reason; failureDate is an ISO date/null in responses.
type ClaimRecord = Omit<Claim,'idempotencyKey'|'reason'>;
interface Attestation {identityConfirmed:boolean;reportedDateVerified:boolean;documentsReviewed:boolean;installationReviewed:boolean;previousClaimsReviewed:boolean;providerResponseReviewed:boolean;exclusionApplies:boolean|null;conditionsSatisfied:boolean|null}
interface AssessmentInput extends C {notes:string;attestation:Attestation}
interface ClaimReview extends C {decision:'ELIGIBLE'|'INELIGIBLE'|'APPROVED'|'DENIED';notes:string;checklist:{assessmentReviewed:boolean;identityReviewed:boolean;termsReviewed:boolean;providerDecisionReviewed:boolean}}
interface ProviderInput extends C {providerReference:string;response:'APPROVED'|'DENIED'|'EVIDENCE_REQUIRED'|'INFORMATION';respondedAt:CivilDate;notes:string;evidenceIds:UUID[]}
interface UploadQuery {version:number;reason:string;documentType:DocumentType;fileName:string}
interface Evidence {id:UUID;registrationId:UUID;claimId:UUID|null;documentType:DocumentType;fileName:string;mimeType:string;sizeBytes:number;sha256:string;uploaderId:UUID;createdAt:Instant}
interface Pagination {page:number;pageSize:number;totalItems:number;totalPages:number}
interface Eligibility {installationId:UUID;policyId:UUID;policyVersion:number;policyActive:boolean;data:{coverageKey:string;equipmentId:UUID|null;componentId:UUID|null;serialUnitId:UUID|null;quantity:string;existingRegistration:{id:UUID;coverageKey:string;status:RegistrationStatus}|null;canRegister:boolean;activation:string}[];pagination:Pagination;scope:string}
type CoverageItem = Pick<Registration,'id'|'reference'|'customerId'|'siteId'|'installationId'|'commissioningReviewId'|'policyId'|'policyVersion'|'coverageType'|'equipmentId'|'componentId'|'serialUnitId'|'coverageQuantity'|'status'|'verifiedStartDate'|'expiresAt'|'activatedAt'|'policySnapshot'|'effectiveStatus'>;
interface CoverageContext {installationId:UUID;data:CoverageItem[];pagination:Pagination;claimHistory:Pick<ClaimRecord,'id'|'reference'|'status'|'createdAt'|'finalDecision'|'decisionDate'|'resolvedAt'>[];claimHistoryTruncated:boolean;limitations:string[];notificationDelivery:'NOT_IMPLEMENTED'}
interface MonitoringSummary {active:number;expired:number;expiring30:number;expiring60:number;expiring90:number;awaitingEvidence:number;awaitingReview:number;openClaims:number;awaitingProvider:number;asOf:Instant;notificationDelivery:'NOT_IMPLEMENTED'}
```

Server-managed fields cannot be posted. Nullable fields shown in inputs are mandatory keys with `null` when unknown. Policy references normalize uppercase. Workmanship requires INSTALLER provider with both target fields null; other policies require exactly one component/category target. Durations are explicit positive integers bounded36600 days/1200 months/100 years; these bounds are not recommended promises. Policy coverage/provider kinds cannot change between revisions. Earlier effective dates require ADMIN backdatingReason. EffectiveTo is exclusive. Deactivation prevents new registrations/activation, preserving existing dates/claims; old drafts need void/recreate against a current revision.

## Registration, start evidence and lifecycle

Use commissioned eligibility for a chosen policy; `canRegister` means identity/duplicate candidate only, not activation approval. Serialized registrations use exact M05 installed equipment + M04 original serial UUID and quantity1. Nonserialized registrations cover the entire installed line quantity; no user quantity or artificial serial. Workmanship uses project identity, both equipment/serial null, quantity1.

Creation -> DRAFT. Editable DRAFT/PENDING_EVIDENCE -> submit -> PENDING_EVIDENCE when findings remain, otherwise PENDING_REVIEW. Independent ADMIN review -> ACTIVE or REJECTED. Explicit ADMIN void -> VOIDED from any nonvoid registration. No silent reopening. All activation checks must be true for ACTIVE, including provider verification when not applicable (reviewer confirms nonapplicability). Active original terms/dates/approval freeze; append-only evidence can be added. Rejected/voided evidence is frozen. Duplicate policy+project+serial/full-line/workmanship identities are blocked except rejected/voided history.

Selected COMMISSIONING_DATE uses exact approved M05 commissioning; INSTALLATION_COMPLETION_DATE uses recorded actual work end. DELIVERY_DATE requires proposedStartDate + DELIVERY_PROOF + dateSourceNotes, never warehouse dispatch/site-receipt inference. PURCHASE_DATE requires PURCHASE_PROOF; MANUAL_VERIFIED_DATE requires OTHER evidence; both need proposed date and notes. MANUFACTURER_REGISTRATION_DATE requires providerRegisteredAt + confirmation + notes. Provider-registration-required policies additionally need provider reference/date/confirmation and deadline compliance. Missing evidence leaves dates unverified. Recorded actual dates cannot be future.

Coverage uses UTC civil days `[verifiedStartDate, expiresAt)`; day addition is calendar days, month/year addition clamps to final valid day (2024-02-29 +1year ->2025-02-28; January31 +1month -> February28/29). This convention is explicit and may require business/provider review for local or inclusive wording. No universal jurisdiction/technical certification is claimed. EXPIRED is derived at read time; no expiry scheduler mutates status.

## Claim transitions and decisions

```text
SUBMITTED -> UNDER_REVIEW | CANCELLED
UNDER_REVIEW -> EVIDENCE_REQUIRED | ELIGIBLE | INELIGIBLE | APPROVED | DENIED | CANCELLED
EVIDENCE_REQUIRED -> UNDER_REVIEW | CANCELLED
ELIGIBLE -> SUBMITTED_TO_PROVIDER | APPROVED | DENIED | EVIDENCE_REQUIRED | CANCELLED
INELIGIBLE -> UNDER_REVIEW | CLOSED | CANCELLED
SUBMITTED_TO_PROVIDER -> PROVIDER_RESPONSE_PENDING | CANCELLED
PROVIDER_RESPONSE_PENDING -> UNDER_REVIEW | EVIDENCE_REQUIRED | CANCELLED
APPROVED -> RESOLVED
DENIED | RESOLVED -> CLOSED
CLOSED | CANCELLED -> terminal
```

Start-review/request-evidence/await-provider/cancel are explicit actions, never arbitrary status PATCH. Claim authors may correct their own submitted/evidence-required facts; reviewers may edit investigation facts in supported investigation states. Assessments require UNDER_REVIEW and return `{claim,assessment}`; the assessment has `{id,claimId,claimVersion,contentRevision,result,policyVersion,rulesSnapshot,findings,attestation,notes,assessorId,createdAt}`. Human attestation is needed for free-text exclusions/conditions and installation review. Related claims are shown as findings, with no fabricated claim limit. False/unknown checks yield blockers/manual findings. Unknown failureDate permits investigation, not automatic eligibility. A failure within original coverage can be assessed after today's expiry.

Assessments are advisory. A decision needs a current assessment, four checked review items, matching contentRevision and recomputed facts fingerprint. Registration evidence/version, related-claim state, provider response or case-evidence changes require reassessment. Final APPROVED/DENIED requires ADMIN distinct from submitter. External-provider approval requires a separately recorded latest provider APPROVED response. Provider responses require real prior submission reference, same-claim evidence and observed response date. Recording a response does not make the same internal decision. `resolve` records documented fulfillment of an approved case, without performing repair/payment/stock operations. CLOSED/CANCELLED are immutable. Assessment records use `assessorId` (not a display name). Provider records use `recordedById` and `claimVersion`. History records include actorId/operationId/event/fromStatus/toStatus/reason/details/version/time; decisions include reviewerId/operationId/decision/checklist/snapshot/reviewedVersion/time.

## Examples (templates, no seeded data)

```ts
// Replace placeholders with authorized existing UUIDs and generated request keys.
await fetch('/api/warranties/registrations', {
 method:'POST', credentials:'include',
 headers:{'Content-Type':'application/json','X-CSRF-Token':csrf},
 body:JSON.stringify({installationId,policyId,policyVersion,equipmentId,serialUnitId,
   idempotencyKey:crypto.randomUUID(),reason:'Register documented commissioned equipment'})
});
// Example shape of an incomplete activation response:
// {data:{registrationId,findings:[/* actual server explanations */],startRule:'DELIVERY_DATE',
// candidateStart:null,candidateExpiry:null,calendarSemantics:/* actual server convention */}}
await fetch(`/api/warranties/claims/${claimId}/start-review`, {
 method:'POST',credentials:'include',headers:{'Content-Type':'application/json','X-CSRF-Token':csrf},
 body:JSON.stringify({version,idempotencyKey:crypto.randomUUID(),reason:'Begin documented investigation'})
});
// Read cumulative expirations or exact-policy unregistered identities:
// GET /api/warranties/expiring?days=60&sort=expiry&page=1&pageSize=20
// GET /api/warranties/installations/<job UUID>/eligibility?policyId=<policy UUID>&unregistered=true
```

## Evidence transport and UI differences

POST evidence sends **raw JPEG/PNG/PDF bytes**, matching Content-Type; not multipart, base64 or JSON. URL query must include version, reason, documentType, fileName (URL encode). Safe filenames allow letters/digits/spaces/underscore/dot/hyphen with supported extension, at most160 characters. Default size5MiB, configurable maximum10MiB. No compressed body. Ten uploads/15minutes; at most50 files per exact registration owner or exact claim owner. Signature validation and SHA-256 integrity are not malware scanning. Downloads require case authorization and use forced attachment/CSP; no public storage key/path is returned. Fetch current owner version after upload (owner version/history advances); binary uploads do not accept JSON idempotency keys. On uncertain response inspect metadata before retrying.

Existing React warranty mocks use local records, provisional IDs/statuses/durations and role names. Replace deliberate service calls with these envelopes and server identities; remove assumed start dates/universal promises, simulated provider approvals, local expiry totals and fabricated reminder delivery. Separate policy product/performance/workmanship cards, draft evidence/review, advisory assessment, provider response and independent final decision. Do not silently map mock coverage to ACTIVE, mutate dates, display sensitive cases to sales/technicians or create service/finance workflows. Context claim history is capped100 and flags truncation; case collections are separately paginated. Eligibility scan is capped5000 per policy/project; assessments/related claims100 and provider responses50 with explicit review findings at bounds. This module sends no email/SMS and creates no M08 ticket.
