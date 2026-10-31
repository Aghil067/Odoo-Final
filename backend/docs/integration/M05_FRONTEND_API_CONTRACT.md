# M05 frontend API contract

Base `/api/installations`. Backend-only: existing React pages/services remain unchanged. M04 PR #4 is merged, so M05 depends on its schema/services and targets main. All JSON writes are strict; unknown fields are rejected. UUID IDs, decimal-string quantities/measurements, ISO timestamps, existing uppercase roles and response envelopes are used.

## Transport and access

Reuse existing login/me/logout, HttpOnly cookie (`credentials:'include'` or withCredentials), trusted Origin and X-CSRF-Token. JSON mutations use Content-Type application/json, max32KiB. Raw attachment upload is the explicit binary exception. No localStorage bearer token/new auth flow exists.

A=ADMIN; E=ADMIN or assigned TECHNICIAN; P=A/assigned TECHNICIAN/scoped SALES; F=FINANCE commissioned-only summaries. WAREHOUSE has only the equipment-reference route. SUPPORT has no M05 permission. SALES uses M01 lead scope; TECHNICIAN uses the job's explicit InstallationAssignment, not global technician access or M02 assignment. ADMIN maps to installation-manager coordination; independent ADMIN reviews. This is not M06 workforce scheduling.

Success `{data:T}`; paged lists `{data:T[],pagination:{page,pageSize,totalItems,totalPages}}`; errors `{error:{code,message,details?:{field,message}[],requestId}}`. Creation POST and issue/test/upload creation return201; other writes200. Every JSON mutation after creation requires the current integer job version and a nonblank reason; no idempotency header/body key is implemented. A stale repeat fails409. After uncertain network outcome re-read history/job before deliberately retrying. Never infer a stock mutation from M05 commands.

## Exact 36-route inventory

| Method/path (relative to base) | Access | Request/result |
|---|---|---|
| GET /summary | P,F | no query → scoped counts by status and blocking open issue count |
| GET / | P,F | page,pageSize,q,status,customerId,leadId,siteId → Job[] |
| POST / | A | CreateJob → Job |
| GET /:id | P,F | → Job; P additionally assignments/milestones/equipment; no private original handoff snapshot |
| PATCH /:id | E | PatchJob → Job |
| POST /:id/assign | A | Assign → Job |
| POST /:id/site-readiness | E | ReadinessCommand → Job |
| POST /:id/confirm-receipt | E | ReceiptCommand → {job,receipt} |
| POST /:id/equipment/verify | E | exact alias of confirm-receipt; same body/history/version rules |
| POST /:id/equipment/install | E | InstallCommand → {job,equipment} |
| GET /:id/equipment-reference | A,WAREHOUSE | limited dispatch/reservation/job status and equipment quantities/serial verification; no customer/site notes or files |
| POST /:id/start | E | Command → Job; SITE_READY or REWORK_REQUIRED → IN_PROGRESS |
| POST /:id/hold | E | Command → Job; remembers prior execution/testing/work/rework state |
| POST /:id/resume | E | Command → Job; restores saved state after readiness check |
| POST /:id/submit-completion | E | Command → Job; IN_PROGRESS/REWORK_REQUIRED → WORK_COMPLETED |
| POST /:id/begin-testing | E | Command → Job; WORK_COMPLETED → TESTING |
| POST /:id/request-rework | E | Command → Job; WORK_COMPLETED/TESTING/ON_HOLD → REWORK_REQUIRED |
| POST /:id/cancel | A | Command → Job; planned/ready/held only and zero installed equipment |
| GET /:id/milestones | P | page,pageSize → Milestone[] |
| GET /:id/equipment | P | page,pageSize → Equipment[] with serial verification/current serial number/state |
| GET /:id/issues | P | page,pageSize → Issue[] |
| GET /:id/tests | P | page,pageSize → Test[] newest jobVersion first |
| GET /:id/attachments | P | page,pageSize → Attachment[] safe metadata |
| GET /:id/history | P | page,pageSize → History[] newest jobVersion first |
| GET /:id/receipts | P | page,pageSize → Receipt[] immutable cumulative verification snapshots |
| GET /:id/readiness | P | page,pageSize → Readiness[] immutable check snapshots |
| GET /:id/reviews | A | page,pageSize → Review[] full immutable snapshots |
| PUT /:id/milestones/:milestoneId | E | MilestoneCommand → {job,milestone} |
| POST /:id/issues | E | IssueCommand → {job,issue} |
| PATCH /:id/issues/:issueId | E; A for blocking/HIGH/CRITICAL | ResolveCommand → {job,issue} |
| POST /:id/tests | E; A for N/A | TestCommand → {job,test} |
| POST /:id/submit-commissioning | E | Command → Job; TESTING → COMMISSIONING_REVIEW |
| POST /:id/review | independent A | ReviewCommand → {job,review} |
| GET /:id/commissioned | P,F | → CommissionedHandoff |
| POST /:id/attachments | E | raw binary + UploadQuery → {attachment,jobVersion} |
| GET /:id/attachments/:attachmentId/download | P | private bytes; forced attachment download |

List defaults page1/pageSize20; maxpage100000/pageSize100. q(max160) searches reference/name. Unknown list filters are rejected; detail routes do not use query filters. Summary takes no filters. F sees only COMMISSIONED list/job and approved handoff, not child collections/downloads. WAREHOUSE cannot use general job lists/details. All nested IDs must belong to the requested job.

## Types

```ts
type UUID=string;type DecimalString=string;type ISO=string;
type Json=null|string|number|boolean|Json[]|{[key:string]:Json};
type Status='PLANNED'|'SITE_READY'|'IN_PROGRESS'|'ON_HOLD'|'WORK_COMPLETED'|'TESTING'|'COMMISSIONING_REVIEW'|'COMMISSIONED'|'REWORK_REQUIRED'|'CANCELED';
type MilestoneType='SITE_PREPARATION'|'MOUNTING_STRUCTURE'|'SOLAR_PANELS'|'INVERTER'|'BATTERY'|'DC_WIRING'|'AC_WIRING'|'EARTHING_PROTECTION'|'SYSTEM_CONFIGURATION'|'FINAL_INSPECTION';
type MilestoneStatus='PENDING'|'IN_PROGRESS'|'COMPLETED'|'NOT_APPLICABLE';
type IssueType='EQUIPMENT_MISSING'|'EQUIPMENT_DAMAGED'|'SITE_ACCESS'|'ROOF_MOUNTING'|'ELECTRICAL_SAFETY'|'DESIGN_MISMATCH'|'WEATHER_DELAY'|'OTHER';
type Severity='LOW'|'MEDIUM'|'HIGH'|'CRITICAL';
type TestType='VISUAL_INSPECTION'|'MOUNTING_VERIFICATION'|'POLARITY'|'EARTHING'|'INSULATION'|'INVERTER_STARTUP'|'PROTECTION_DEVICES'|'BATTERY'|'FUNCTIONAL_SYSTEM';
type TestResult='PASS'|'FAIL'|'NEEDS_REVIEW';
type Decision='APPROVED'|'REWORK_REQUIRED';
type Category='SITE_READINESS'|'SITE_RECEIPT'|'MILESTONE'|'ISSUE'|'TEST'|'COMPLETION'|'SUPPORTING_FILE';
interface Command{version:number;reason:string}
interface TestRequirement{type:TestType;required:boolean;basis:string;measurementRequired:boolean;unit:string|null}
interface CreateJob{name:string;dispatchId:UUID;reservationId:UUID;configurationId:UUID;configurationApprovedVersion:number;configurationReviewId:UUID;bomId:UUID;bomVersion:number;coordinatorId:UUID;technicianIds:UUID[];plannedStartAt:ISO;plannedEndAt:ISO;siteReadinessNotes?:string|null;safetyNotes?:string|null;testRequirements:TestRequirement[];reason:string}
interface Job{id:UUID;reference:string;name:string;customerId:UUID;siteId:UUID;leadId:UUID;configurationId:UUID;configurationApprovedVersion:number;configurationReviewId:UUID;bomId:UUID;bomVersion:number;reservationId:UUID;dispatchId:UUID;testRequirements:TestRequirement[];status:Status;resumeStatus:Status|null;plannedStartAt:ISO;plannedEndAt:ISO;actualStartAt:ISO|null;actualEndAt:ISO|null;deliveryConfirmedAt:ISO|null;commissionedAt:ISO|null;coordinatorId:UUID;createdById:UUID;siteReadinessNotes:string|null;safetyNotes:string|null;completionNotes:string|null;version:number;executionRevision:number;approvedVersion:number|null;createdAt:ISO;updatedAt:ISO}
type PatchJob=Command&Partial<Pick<CreateJob,'name'|'plannedStartAt'|'plannedEndAt'|'siteReadinessNotes'|'safetyNotes'|'testRequirements'>>&{completionNotes?:string|null};
interface Assign extends Command{coordinatorId:UUID;technicianIds:UUID[]}
interface ReadinessChecklist{siteAccessConfirmed:boolean;installationAreaAccessible:boolean;roofSiteConditionChecked:boolean;safetyMeasuresAvailable:boolean;surveyLimitationsReviewed:boolean;conditionalWorkAddressed:boolean}
interface ReadinessCommand extends Command{checklist:ReadinessChecklist;notes:string;conditionalWorkResolution:string;outstandingIssues:string|null;evidenceIds:UUID[]}
interface Readiness{id:UUID;jobId:UUID;actorId:UUID;checklist:ReadinessChecklist;notes:string;conditionalWorkResolution:string;outstandingIssues:string|null;evidenceIds:UUID[];jobVersion:number;createdAt:ISO}
interface ReceiptLine{equipmentId:UUID;receivedQuantity:DecimalString;damagedQuantity:DecimalString;receivedSerialIds:UUID[];damagedSerialIds:UUID[]}
interface ReceiptCommand extends Command{receivedAt:ISO;notes:string;evidenceIds:UUID[];lines:ReceiptLine[]}
interface Receipt{id:UUID;jobId:UUID;actorId:UUID;receivedAt:ISO;createdAt:ISO;jobVersion:number;notes:string;snapshot:ReceiptLine[];evidenceIds:UUID[]}
interface MilestoneChecks{approvedDesignFollowed:boolean;safetyChecked:boolean;evidenceReviewed:boolean}
interface MilestoneCommand extends Command{status:MilestoneStatus;responsibleUserId:UUID|null;plannedStartAt:ISO|null;plannedEndAt:ISO|null;checks:MilestoneChecks;completionNotes:string;evidenceIds:UUID[]}
interface Milestone{id:UUID;jobId:UUID;type:MilestoneType;required:boolean;status:MilestoneStatus;responsibleUserId:UUID|null;plannedStartAt:ISO|null;plannedEndAt:ISO|null;actualStartAt:ISO|null;actualEndAt:ISO|null;checks:MilestoneChecks;completionNotes:string|null;evidenceIds:UUID[];updatedAt:ISO}
interface Equipment{id:UUID;jobId:UUID;dispatchLineId:UUID;componentId:UUID;unit:'PCS'|'M'|'SET'|'PAIR'|'KG';serializationRequired:boolean;dispatchedQuantity:DecimalString;receivedQuantity:DecimalString;damagedQuantity:DecimalString;installedQuantity:DecimalString;installedLocation:string|null;installedAt:ISO|null;installerId:UUID|null;notes:string|null;serials?:EquipmentSerial[]}
interface EquipmentSerial{id:UUID;equipmentId:UUID;serialUnitId:UUID;received:boolean;damaged:boolean;installedAt:ISO|null;installedLocation:string|null;installerId:UUID|null;serialUnit?:{serialNumber:string;state?:string;receivedAt?:ISO;receiptOperationId?:UUID}}
interface InstallCommand extends Command{equipmentId:UUID;installedQuantity:DecimalString;installedSerialIds:UUID[];installedLocation:string;notes:string;evidenceIds:UUID[]}
interface IssueCommand extends Command{type:IssueType;severity:Severity;blocking:boolean;description:string;milestoneId?:UUID|null;equipmentId?:UUID|null;serialUnitId?:UUID|null;evidenceIds:UUID[]}
interface ResolveCommand extends Command{status:'OPEN'|'RESOLVED';resolution:string;evidenceIds:UUID[]}
interface Issue{id:UUID;jobId:UUID;type:IssueType;severity:Severity;blocking:boolean;description:string;milestoneId:UUID|null;equipmentId:UUID|null;serialUnitId:UUID|null;reportedById:UUID;reportedAt:ISO;status:'OPEN'|'RESOLVED';resolution:string|null;resolvedById:UUID|null;resolvedAt:ISO|null;evidenceIds:UUID[]}
interface TestCommand extends Command{type:TestType;applicable:boolean;result:TestResult;observations:string;measurement:DecimalString|null;unit:string|null;requirementsBasis:string;notApplicableReason:string|null;notes:string|null;evidenceIds:UUID[]}
interface Test extends Omit<TestCommand,'version'|'reason'>{id:UUID;jobId:UUID;testerId:UUID;testedAt:ISO;executionRevision:number;jobVersion:number}
interface ReviewChecklist{siteReceiptVerified:boolean;milestonesReviewed:boolean;equipmentReconciled:boolean;testsReviewed:boolean;conditionsAddressed:boolean;evidenceReviewed:boolean;internalScopeAcknowledged:boolean}
interface ReviewCommand extends Command{decision:Decision;checklist:ReviewChecklist;notes:string}
interface Review{id:UUID;jobId:UUID;jobVersion:number;reviewerId:UUID;decision:Decision;checklist:ReviewChecklist;notes:string;snapshot:Json;createdAt:ISO}
interface Attachment{id:UUID;jobId:UUID;milestoneId:UUID|null;issueId:UUID|null;category:Category;fileName:string;mimeType:'image/jpeg'|'image/png'|'application/pdf';sizeBytes:number;sha256:string;uploaderId:UUID;createdAt:ISO}
interface UploadQuery extends Command{category:Category;fileName:string;milestoneId?:UUID;issueId?:UUID}
interface History{id:UUID;jobId:UUID;actorId:UUID;event:string;fromStatus:Status|null;toStatus:Status;jobVersion:number;reason:string;details:Json;createdAt:ISO}
interface CommissionedHandoff{jobId:UUID;reference:string;customerId:UUID;siteId:UUID;leadId:UUID;configurationId:UUID;configurationApprovedVersion:number;configurationReviewId:UUID;bomId:UUID;bomVersion:number;reservationId:UUID;dispatchId:UUID;dispatchReference:string;commissioningReviewId:UUID;commissioningDate:ISO;deliveryConfirmedAt:ISO;actualWorkStartAt:ISO;actualWorkEndAt:ISO;equipment:Equipment[];testSummary:Test[];outstandingNonblockingIssues:Issue[];completionEvidence:Pick<Attachment,'id'|'fileName'|'mimeType'|'sizeBytes'|'sha256'|'createdAt'>[];completionNotes:string;scope:'INTERNAL_COMMISSIONING_NOT_REGULATORY_CERTIFICATION';externalGridAuthorization:'NOT_RECORDED';warrantyStartDate:'NOT_DETERMINED_BY_M05'}
```

Job detail enriches `assignments:[{id,jobId,userId,user:{id,name,role,isActive}}]`, milestones and equipment for P; mutation job responses are scalar Job. Review snapshot is a frozen internal complete job graph and remains ADMIN-only. Raw original handoffSnapshot and private storage keys are omitted from normal job/file metadata. All timestamps named jobVersion in child append-only records refer to the content version before that command increments the job's public version; history's jobVersion is the resulting public version. ApprovedVersion references the reviewed version; terminal job version is approvedVersion+1.

## Workflow and validation

Create requires every original BOM component already dispatched, exact configuration/BOM/approval/review/reservation identity, active ADMIN coordinator and active TECHNICIAN IDs. Identity is derived server-side. Plan date order is validated. Supply all nine test requirements with real basis text; no default manufacturer facts/thresholds are inserted. Core tests cannot be waived; battery is not required without batteries; mounting verification depends on the BOM. Test plan freezes on first start. ADMIN changes dates/test plan; other note edits may be made by E while editable.

Upload evidence first, using each returned jobVersion for the next write. Record cumulative receipt for every equipment line, including zeros/shortages. receivedQuantity means **usable verified** quantity; damagedQuantity is separate. Usable+damaged <= dispatched−returned. receivedAt must be between warehouse dispatch and now. Exact original received/damaged serial IDs are disjoint. Missing/damaged equipment creates HIGH blocking issues. Updating a receipt never silently resolves an earlier issue; authorized explicit resolution/evidence is required. Full usable receipt sets deliveryConfirmedAt; partial later verification clears it. Receipt/update is allowed before start or on hold.

Readiness needs all checks true, outstandingIssues=null, evidence and conditionalWorkResolution. Explain actual resolution of applicable survey conditions, or explicitly why no condition applies. Job moves PLANNED→SITE_READY only when receipt/readiness and issue gates all pass. Start/resume rechecks live eligibility and receipt/serial state. Dispatch alone never confirms site delivery.

Milestone plans/statuses are edited with the entire MilestoneCommand body, including nullable plan/responsible fields. Battery/mounting required flags derive from BOM and cannot be lowered. ADMIN assigns responsibility and may mark optional milestones N/A with notes; E completes actual work only IN_PROGRESS/REWORK_REQUIRED, with all checks true, evidence, responsible user and no blockers. Work-completed/testing/held milestones require explicit rework/resume before changes. Notes on pending plans describe planned checks; they do not imply completion.

Equipment install supplies cumulative installed quantity and cumulative installed serial set. It cannot decrease, exceed usable receipt or discard an earlier installed serial. Serialized IDs must be the exact original dispatched, verified usable records. Nonserialized arrays are empty. New serial installations retain their first actor/time/location; no relocation/substitution/uninstall workflow exists. Installation quantities for consumables mean used/installed material; this full-BOM version has no spare/unconsumed allocation workflow.

Issue severity HIGH/CRITICAL always blocks, even if blocking=false was posted. Other severities may explicitly block. ADMIN resolves/reopens blocking/HIGH/CRITICAL issues; assigned E may update nonblocking low/medium ones. Original description/type/severity/ownership are retained; PATCH changes resolution/status/evidence and audit records old/new values. Jobs never automatically close issues.

Record completionNotes before submit-completion. Complete all required milestones and full equipment installation, then enter WORK_COMPLETED and begin-testing. Tests only in TESTING, with evidence, actual observations and exact stored requirementsBasis. Measurements are strings with units, required only when the plan says so; no automatic threshold evaluation occurs. Applicable tests use PASS/FAIL/NEEDS_REVIEW; optional N/A requires ADMIN, rationale, null measurement/unit and NEEDS_REVIEW. No fabricated values or PASS for N/A.

Execution edits (receipt/readiness/equipment/milestone/issues/job content/explicit rework) increment executionRevision. All prior tests become stale; rerun required tests after the final change. Attachment/assignment changes increment public version but do not invalidate tests by themselves. Latest applicable failures block commissioning, even for optional tests. Upload a COMPLETION evidence object, submit-commissioning, then the job freezes. A different ADMIN with no nonreview contribution approves/requires rework on the exact submitted version. Commissioned/canceled jobs cannot be edited or reopened. Cancellation requires ADMIN and no installed equipment; one dispatch/serial claim is retained forever.

## Binary uploads and examples

POST `/:id/attachments?version=4&reason=...&category=SITE_RECEIPT&fileName=receipt.jpg` sends raw bytes, Content-Type image/jpeg, cookie, trusted Origin and X-CSRF-Token. Encode query values. version is coerced from its query string; all other JSON command versions are numbers. Optional milestoneId/issueId must belong to the job. JPEG/PNG/PDF only; filename uses bounded ASCII-safe characters. Default5MiB/max10MiB,50 files/job,10 uploads/15min. Unsupported compression fails. No multipart/base64/public URL is accepted. Filenames/MIME/signatures/digest are validated, but signatures are not malware protection. Protected downloads use cookies/scoped permissions and forced attachment headers. Store only metadata IDs in UI; never expose local storage paths.

Illustrative shape fragments below use placeholders; they are not seeded IDs, records or measured values.

```json
{"version":8,"reason":"Record observed site receipt","receivedAt":"2026-10-31T10:00:00Z","notes":"Actual site observation and document references","evidenceIds":["job attachment UUID"],"lines":[{"equipmentId":"job equipment UUID","receivedQuantity":"1","damagedQuantity":"0","receivedSerialIds":["original dispatched serial UUID"],"damagedSerialIds":[]}]}
```

```json
{"data":{"job":{"id":"job UUID","status":"SITE_READY","version":9,"executionRevision":3,"deliveryConfirmedAt":"2026-10-31T10:00:00Z","otherFields":"See Job interface"},"receipt":{"id":"receipt UUID","jobId":"job UUID","actorId":"actor UUID","receivedAt":"2026-10-31T10:00:00Z","jobVersion":8,"snapshot":[{"equipmentId":"equipment UUID","receivedQuantity":"1","damagedQuantity":"0","receivedSerialIds":["serial UUID"],"damagedSerialIds":[]}],"evidenceIds":["attachment UUID"],"notes":"Actual site observation","createdAt":"recording timestamp"}}}
```

```json
{"version":20,"reason":"Record actual installed quantity","equipmentId":"job equipment UUID","installedQuantity":"1","installedSerialIds":["verified original serial UUID"],"installedLocation":"Actual observed location","notes":"Work observation","evidenceIds":["job attachment UUID"]}
```

Example review shape: `{version,reason,decision:'APPROVED',notes,checklist:{siteReceiptVerified:true,milestonesReviewed:true,equipmentReconciled:true,testsReviewed:true,conditionsAddressed:true,evidenceReviewed:true,internalScopeAcknowledged:true}}`. All fields are required; checkbox values attest internal review, not utility/structural/regulatory approval.

Common failures: 422 VALIDATION_ERROR/EVIDENCE_OWNERSHIP/TEST_PLAN_INCOMPLETE/REQUIRED_TEST/RECEIPT_SERIAL_MISMATCH/INSTALLED_QUANTITY/TEST_MEASUREMENT_REQUIRED; 409 VERSION_CONFLICT/CONCURRENT_UPDATE/DUPLICATE_VALUE/DISPATCH_HANDOFF_MISMATCH/DISPATCH_INCOMPLETE/SITE_NOT_READY/EQUIPMENT_NOT_RECONCILED/BLOCKING_ISSUES/MILESTONES_INCOMPLETE/TESTS_INCOMPLETE/TEST_FAILED/INSTALLATION_FROZEN/INSTALLED_EQUIPMENT_LOCK/INSTALLATION_CONSTRAINT/RECORD_LIMIT; 403 INDEPENDENT_REVIEW_REQUIRED/ADMIN_REQUIRED/CSRF_FAILED/ORIGIN_FORBIDDEN. Validation details identify fields. An example error is `{"error":{"code":"VERSION_CONFLICT","message":"Job changed; refresh and use the current version","requestId":"request UUID"}}`.

Bounds: IDs/technician/serial/evidence arrays max100; evidence mandatory on receipt/readiness/install/tests/issue resolution and completed milestones; reason/basis max2000, notes/observations max5000, location max1000. Per job: 50 files,100 receipts,100 readiness records,500 issues,500 tests. Large serial jobs/snapshots may hit existing transaction timeout; no hidden batching is performed.

## Frontend and downstream handoff

React mocks currently use lowercase draft/scheduled/completed/verified states, product IDs, number quantities, arbitrary material issues, team/workforce/calendar/time tracking, photo URLs and customer sign-off assumptions. Backend uses immutable M04 dispatch identity, uppercase execution states, exact serial UUIDs, private binary attachments, independent review and Decimal strings. Do not map verified/completed directly to commissioning approval. No frontend file is edited; Abisha must adapt services deliberately.

GET /:id/commissioned is the stable approved handoff for later M07/M08, preserving original component/serial identities, separate delivery/work/commissioning timestamps, tests, notes and evidence metadata. Historical approval remains readable after future design revisions. No warranty start date, service ticket, billing event, utility permission or regulatory certificate is created. M05 does not implement M06 or any later backend module.
