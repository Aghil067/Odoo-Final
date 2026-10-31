# M08 service and maintenance frontend contract

Base `/api/service`. This is the actual backend router; React is unchanged. M08 is stacked on unmerged M07 (and inherited M06), not a frontend task-store replacement built into React.

## Sessions, scope, commands and wire format

Reuse M01 database-backed HttpOnly cookies with `credentials:'include'`, trusted Origin and unsafe-method `X-CSRF-Token`. No customer portal, new role or bearer token exists. Every JSON body is strict: unknown fields fail422. UUIDs refer to persisted records; quantities are Decimal strings. Request timestamps require ISO8601 with offset; response dates/times are UTC ISO strings. Customer/site/commissioned identity, actual attendance, state, audit actors and versions are server-controlled.

JSON commands require nonempty `idempotencyKey` and `reason`. Subsequent writes require current **ticket version**, plus visitVersion/repairVersion/partVersion for child changes. Plan commands instead use current plan version; grant revocation/reactivation uses grant version (new grant requires version:null). Duplicate same key/actor/action/target/parsed body returns its original frozen result after current authorization, even if the result's version is old. Changed body/actor conflicts409. Concurrent unique-key races may also return409: reread and deliberately retry. Use a new key only for a changed intentional command. Refresh detail after replay. Binary uploads use ticket version, without JSON idempotency.

Normal success `{data:T}`. Ordinary list endpoints return `{data:T[],pagination:{page,pageSize,totalItems,totalPages}}`; default page1/pageSize20, maximum100. Workload/parts-requests/outcomes deliberately return their own context object inside outer `data`, including nested data/pagination and limitations. Download is binary200. Creation/upload/diagnosis/repair/checklist/feedback/SLA/maintenance generation endpoints return201; other JSON responses200. Errors follow `{error:{code,message,details?,requestId}}`.

| Backend role | Authority |
|---|---|
| ADMIN | Configuration, explicit project grants, coordination/attested field records, safety review, independent closure and reopening, maintenance. |
| SUPPORT | Create/coordinate tickets only through active M08 project grant. No policy/maintenance/final closure permission, no impersonating a technician for diagnosis/repair. |
| TECHNICIAN | Current explicitly assigned tickets and own visits; acknowledge own assignment, field observations/repair/checklist/evidence. M06 team/profile alone grants no ticket scope. Current assignment ends at closure/cancellation; no broad historical-ticket access is inferred. |
| SALES | Limited ticket list/summary through M01 lead scope; no ticket detail, diagnosis, private evidence or warranty case files. |
| WAREHOUSE | `/parts-requests` only through explicit M08 project grant; no fulfillment write or technical case access. |
| FINANCE | `/outcomes` only: closed approved-summary references; no invoice/payment workflow or private evidence. |

M08 grants bind to the role at issuance; a changed warehouse/support role requires explicit ADMIN regrant with current grant version. M08 grants are distinct from M07 grants. M07 warranty context still requires its existing ADMIN/SUPPORT-grant/M05-assignment scope. A service assignment does not silently authorize private warranty cases. Missing M07 permission returns `M07_SCOPE_UNAVAILABLE_NOT_NO_COVERAGE`. Claim linking at creation additionally requires M07 case authority and exact project/item identity. Frontend role labels must derive from authenticated uppercase roles, never grant backend privileges.

## All 63 actual routes

Paths are relative to base. `P` means page/pageSize. `C` means `{version,idempotencyKey,reason}`. `childId` is a visit, repair, part, evidence or maintenance-occurrence UUID as indicated. Collection ownership is always ticket-bound.

| Method/path | Input -> success data |
|---|---|
| POST `/installations/:id/access` | `{userId,version:null|number,idempotencyKey,reason}` -> M08 grant; ADMIN; active SUPPORT/WAREHOUSE. |
| GET `/access` | P, optional installationId -> current grants; ADMIN. |
| POST `/access/:id/revoke` | C -> grant; ADMIN. |
| POST `/tickets` | TicketCreate -> Ticket. |
| GET `/tickets` | TicketQuery -> paged tickets; SALES gets Summary only. |
| GET `/tickets/:id` | -> Ticket + sla. |
| PATCH `/tickets/:id` | C + description -> Ticket; OPEN/REOPENED only. |
| POST `/tickets/:id/triage` | Triage -> Ticket; OPEN/REOPENED/TRIAGED only. |
| POST `/tickets/:id/escalate` | C + priority,customerImpact,safetyConcern,escalationReason -> Ticket. |
| POST `/tickets/:id/safety-review` | C + notes,evidenceIds(nonempty) -> Ticket; ADMIN. |
| POST `/tickets/:id/response` | C + observedAt,channel,notes,evidenceIds -> Ticket; records first actual response once. |
| POST `/tickets/:id/assign` | C + userId -> `{ticket,assignment}`. |
| POST `/tickets/:id/acknowledge` | C -> Ticket; assigned TECHNICIAN only. |
| POST `/tickets/:id/hold` | C + status(ON_HOLD/WAITING_FOR_CUSTOMER/WAITING_FOR_PARTS) -> Ticket. |
| POST `/tickets/:id/resume` | C -> Ticket; restores heldFrom. |
| POST `/tickets/:id/resolve` | C + resolutionNotes,evidenceIds(nonempty) -> Ticket. |
| POST `/tickets/:id/close` | Closure -> `{ticket,review}`; independent ADMIN. |
| POST `/tickets/:id/reopen` | C -> Ticket; ADMIN; new execution cycle. |
| POST `/tickets/:id/cancel` | C -> Ticket; dispose of active/pending work first. |
| POST `/tickets/:id/feedback` | Feedback -> `{ticket,feedback}`; resolved ticket only. |
| GET `/tickets/:id/warranty` | -> `{current,capturedContext,limitations}`. |
| GET `/tickets/:id/availability` | `{userId,from,to}` query -> redacted M06 availability. |
| POST `/tickets/:id/visits` | VisitCreate -> `{ticket,visit}`. |
| PATCH `/tickets/:id/visits/:childId` | VisitCreate + visitVersion -> `{ticket,visit}`; reschedule same assignment before start. |
| POST `/tickets/:id/visits/:childId/start` | C + visitVersion,siteAccess,safetyMeasuresVerified,evidenceIds(nonempty) -> `{ticket,visit}`. |
| POST `/tickets/:id/visits/:childId/complete` | C + visitVersion,workPerformed,outcome,followUpRequired,evidenceIds(nonempty) -> `{ticket,visit}`. |
| POST `/tickets/:id/visits/:childId/cancel` | C + visitVersion -> `{ticket,visit}`; unstarted only, coordinator. |
| POST `/tickets/:id/diagnoses` | Diagnosis -> `{ticket,diagnosis}`; assigned field technician/ADMIN. |
| POST `/tickets/:id/repairs` | RepairCreate -> `{ticket,repair}`. |
| POST `/tickets/:id/repairs/:childId/start` | C + repairVersion -> `{ticket,repair}`. |
| POST `/tickets/:id/repairs/:childId/complete` | C + repairVersion,outcome,followUpRequired,evidenceIds(nonempty) -> `{ticket,repair}`. |
| POST `/tickets/:id/repairs/:childId/cancel` | C + repairVersion -> `{ticket,repair}`; planned only, coordinator. |
| POST `/tickets/:id/repairs/:childId/rework` | C + repairVersion,visitId -> `{ticket,repair}`; ADMIN, completed follow-up action moved to current running visit; old facts remain in history. |
| POST `/tickets/:id/parts` | C + componentId,quantity,purpose -> `{ticket,part}`. |
| POST `/tickets/:id/parts/:childId/cancel` | C + partVersion,dispositionNotes -> `{ticket,part}`; ADMIN. |
| POST `/tickets/:id/checklist` | C + key,result,notes,evidenceIds -> `{ticket,item}`; append-only result. |
| GET `/tickets/:id/visits` | P -> visits; TECHNICIAN own only. |
| GET `/tickets/:id/assignments` | P -> immutable-identity assignment history. |
| GET `/tickets/:id/diagnoses` | P -> diagnosis revisions; TECHNICIAN own visits only. |
| GET `/tickets/:id/repairs` | P -> repairs; TECHNICIAN own visits only. |
| GET `/tickets/:id/parts` | P -> pending/cancelled part requests. |
| GET `/tickets/:id/checklist` | P -> check history, grouped by executionRevision/key; highest ticketVersion is current result. |
| GET `/tickets/:id/evidence` | P -> safe metadata, never storageKey. |
| GET `/tickets/:id/history` | P -> versioned audit. |
| GET `/tickets/:id/feedback` | P -> attested responses; coordinator only. |
| GET `/tickets/:id/reviews` | P -> immutable closure snapshots; coordinator only. |
| POST `/tickets/:id/evidence` | UploadQuery + raw bytes -> `{evidence,ticketVersion}`. |
| GET `/tickets/:id/evidence/:childId/download` | -> protected binary forced attachment. |
| POST `/sla/policies` | SlaCreate -> immutable policy revision; ADMIN. |
| GET `/sla/policies` | P -> policies; coordinator. |
| GET `/sla` | TicketQuery -> ticket list with computed sla; coordinator. |
| POST `/maintenance/plans` | PlanCreate -> Plan; ADMIN. |
| GET `/maintenance/plans` | P -> plans; ADMIN. |
| PATCH `/maintenance/plans/:id` | C + status,nextDueAt -> `{before,plan}`; ADMIN; no unfinished occurrence. |
| GET `/maintenance/plans/:id/occurrences` | P -> occurrences; ADMIN. |
| GET `/maintenance/due` | P -> ACTIVE plans due now/overdue; ADMIN. |
| POST `/maintenance/plans/:id/generate-ticket` | C + slaPolicyId,priority -> `{plan,occurrence,ticket}`; ADMIN. |
| POST `/maintenance/plans/:id/complete` | C + occurrenceId,completionNotes -> `{plan,occurrence,calendarSemantics,notificationDelivery}`; ADMIN. |
| POST `/maintenance/plans/:id/occurrences/:childId/cancel` | C -> `{plan,occurrence,nextStep}` after explicit ticket cancellation; ADMIN. |
| GET `/summary` | No query -> scoped real counts/asOf/notificationDelivery. |
| GET `/technician-workload` | P -> nested `{data,pagination,actualWorkedHours:null,limitations}`. |
| GET `/parts-requests` | P -> nested `{data,pagination,stockFulfillment}`; scoped WAREHOUSE/ADMIN. |
| GET `/outcomes` | P -> nested `{data,pagination,billing:'NOT_IMPLEMENTED'}`; FINANCE/ADMIN. |

TicketQuery allows P plus optional q(reference search),status,priority,category,installationId,technicianId and sort(newest default/responseDue/resolutionDue). Unknown query keys fail422 on list/upload/window routes. There is no customer-name full-text filter, arbitrary state PATCH, parts usage/stock issue endpoint, service billing or notification sender. Multiple genuine complaints per item are allowed; idempotency prevents duplicate retries, not distinct tickets.

## TypeScript inputs and core records

```ts
type UUID=string; type Timestamp=string; type DecimalString=string;
type Json=null|boolean|number|string|Json[]|{[key:string]:Json};
type Category='PANEL_ISSUE'|'INVERTER_ISSUE'|'BATTERY_ISSUE'|'WIRING_ISSUE'|'PERFORMANCE_ISSUE'|'SYSTEM_OFFLINE'|'PREVENTIVE_MAINTENANCE'|'GENERAL_SUPPORT'|'OTHER';
type Priority='LOW'|'MEDIUM'|'HIGH'|'CRITICAL';
type TicketStatus='OPEN'|'TRIAGED'|'ASSIGNED'|'VISIT_SCHEDULED'|'IN_PROGRESS'|'WAITING_FOR_CUSTOMER'|'WAITING_FOR_PARTS'|'ON_HOLD'|'REOPENED'|'RESOLVED'|'CLOSED'|'CANCELLED';
type VisitStatus='SCHEDULED'|'IN_PROGRESS'|'COMPLETED'|'CANCELLED';
type RepairType='INSPECTION'|'CLEANING'|'CONFIGURATION'|'WIRING_REPAIR'|'COMPONENT_REPAIR'|'COMPONENT_REPLACEMENT'|'TESTING'|'OTHER';
type RepairStatus='PLANNED'|'IN_PROGRESS'|'COMPLETED'|'CANCELLED';
type EvidenceType='FAULT_PHOTO'|'TECHNICIAN_NOTES'|'TEST_REPORT'|'REPAIR_PHOTO'|'CUSTOMER_ACKNOWLEDGEMENT'|'REPLACEMENT_DOCUMENTATION'|'OTHER';
type CheckKey='SITE_SAFETY'|'VISUAL_INSPECTION'|'PANEL_CONDITION'|'INVERTER_STATUS'|'WIRING_PROTECTION'|'BATTERY_CONDITION'|'SYSTEM_FUNCTIONALITY'|'CUSTOMER_COMMUNICATION'|'FINAL_CLEANUP';
interface Create {idempotencyKey:string;reason:string}
interface C extends Create {version:number}
interface TicketCreate extends Create {installationId:UUID;equipmentId:UUID|null;serialUnitId:UUID|null;warrantyClaimId:UUID|null;reportedIssue:string;description:string;category:Category;priority:Priority;channel:string;slaPolicyId:UUID|null}
interface Triage extends C {category:Category;priority:Priority;supportOwnerId:UUID;customerImpact:string;safetyConcern:boolean;safetyReviewed:boolean;requiresVisit:boolean;troubleshootingNotes:string;escalationReason:string|null;requiredSkillIds:UUID[];requiredChecks:CheckKey[];slaPolicyId:UUID|null}
interface VisitCreate extends C {assignmentId:UUID;scheduledStartAt:Timestamp;scheduledEndAt:Timestamp;legacyUncertaintyAcknowledged:boolean;schedulingNotes:string}
interface Diagnosis extends C {visitId:UUID;supersedesId:UUID|null;reportedSymptom:string;observedSymptom:string;method:string;measurements:{name:string;value:DecimalString;unit:string;requirementReference:string|null}[];finding:string;probableCause:string|null;uncertainty:string;evidenceIds:UUID[]}
interface RepairCreate extends C {visitId:UUID;type:RepairType;description:string;evidenceIds:UUID[]}
interface Closure extends C {notes:string;checklist:{mandatoryWorkReviewed:boolean;customerResponseReviewed:boolean;evidenceReviewed:boolean;safetyReviewed:boolean}}
interface Feedback extends C {acknowledged:boolean;rating:number|null;comments:string|null;source:string;observedAt:Timestamp;attestation:string;evidenceIds:UUID[]}
interface SlaCreate extends Create {reference:string;revision:number;category:Category;priority:Priority;firstResponseMinutes:number;resolutionMinutes:number;effectiveFrom:Timestamp;effectiveTo:Timestamp|null;clock:'ELAPSED_UTC_NO_PAUSE';terms:string}
interface PlanCreate extends Create {reference:string;installationId:UUID;category:string;intervalDays:number;effectiveAt:Timestamp;nextDueAt:Timestamp;requiredChecks:CheckKey[]}
interface UploadQuery {version:number;reason:string;type:EvidenceType;visitId?:UUID;fileName:string}
interface Ticket {
 id:UUID;reference:string;customerId:UUID;siteId:UUID;installationId:UUID;equipmentId:UUID|null;serialUnitId:UUID|null;warrantyClaimId:UUID|null;
 reportedIssue:string;description:string;category:Category;priority:Priority;channel:string;status:TicketStatus;heldFrom:TicketStatus|null;
 supportOwnerId:UUID|null;customerImpact:string|null;safetyConcern:boolean;safetyReviewedAt:Timestamp|null;requiresVisit:boolean;troubleshootingNotes:string|null;escalationReason:string|null;
 requiredSkillIds:UUID[];requiredChecks:CheckKey[];resolutionNotes:string|null;createdById:UUID;openedAt:Timestamp;firstResponseAt:Timestamp|null;resolvedAt:Timestamp|null;closedAt:Timestamp|null;
 slaPolicyId:UUID|null;slaSnapshot:Json;firstResponseDueAt:Timestamp|null;resolutionDueAt:Timestamp|null;version:number;executionRevision:number;createdAt:Timestamp;updatedAt:Timestamp;sla?:SlaStatus;
}
interface SlaStatus {configured:boolean;clock:string;firstResponseDueAt:Timestamp|null;resolutionDueAt:Timestamp|null;firstResponseAt:Timestamp|null;resolvedAt:Timestamp|null;firstResponseBreached:boolean|null;resolutionBreached:boolean|null;cancelled:boolean;pauseSemantics:'NONE_HOLDS_CONTINUE_CLOCK';asOf:Timestamp}
interface Assignment {id:UUID;ticketId:UUID;userId:UUID;assignedById:UUID;assignedAt:Timestamp;acknowledgedAt:Timestamp|null;endedAt:Timestamp|null;version:number}
interface Visit {id:UUID;ticketId:UUID;assignmentId:UUID;userId:UUID;scheduledStartAt:Timestamp;scheduledEndAt:Timestamp;arrivedAt:Timestamp|null;departedAt:Timestamp|null;status:VisitStatus;siteAccess:'UNKNOWN'|'CONFIRMED'|'DENIED';workPerformed:string|null;outcome:string|null;followUpRequired:boolean;schedulingSnapshot:Json;executionRevision:number;version:number;createdAt:Timestamp}
interface PartRequest {id:UUID;ticketId:UUID;componentId:UUID;quantity:DecimalString;purpose:string;status:'PENDING_HANDOFF'|'CANCELLED';dispositionNotes:string|null;version:number;createdAt:Timestamp}
interface Evidence {id:UUID;ticketId:UUID;visitId:UUID|null;type:EvidenceType;fileName:string;mimeType:string;sizeBytes:number;sha256:string;uploaderId:UUID;executionRevision:number;createdAt:Timestamp}
interface Plan {id:UUID;reference:string;installationId:UUID;category:string;intervalDays:number;effectiveAt:Timestamp;nextDueAt:Timestamp;requiredChecks:CheckKey[];status:'ACTIVE'|'PAUSED'|'CANCELLED';createdById:UUID;version:number;createdAt:Timestamp}
interface Occurrence {id:UUID;planId:UUID;dueAt:Timestamp;ticketId:UUID;completedAt:Timestamp|null;completionNotes:string|null;cancelledAt:Timestamp|null;cancellationNotes:string|null}
```

All nullable input keys shown are mandatory keys; use null when unknown. Evidence IDs are unique, maximum30/command. Measured values are signed decimal strings up to12 integer/6 fraction digits; parts quantities positive with maximum15 integer/3 fraction digits. These are recorded observations, not generated performance values or universal electrical thresholds. Diagnosis response adds id/ticketId/technicianId/executionRevision/createdAt; technicianId is actual assigned worker, actor remains in history. Repair response adds id/ticketId/technicianId/status/startedAt/completedAt/outcome/followUpRequired/executionRevision/version/createdAt. Checklist adds id/actorId/executionRevision/ticketVersion/createdAt; feedback adds id/recordedById/executionRevision/ticketVersion/createdAt. Closure review stores id/ticketId/ticketVersion/reviewerId/checklist/notes/snapshot/createdAt. History includes actorId/operationId/version/event/fromStatus/toStatus/reason/details/time. No input can set those authority fields.

## Ticket and visit behavior

```text
OPEN | REOPENED -> TRIAGED | CANCELLED
TRIAGED -> ASSIGNED | RESOLVED | a hold | CANCELLED
ASSIGNED -> VISIT_SCHEDULED | RESOLVED | a hold | CANCELLED
VISIT_SCHEDULED -> IN_PROGRESS | ASSIGNED(after last scheduled cancellation) | a hold | CANCELLED
IN_PROGRESS -> VISIT_SCHEDULED | RESOLVED | a hold | CANCELLED
a hold -> saved heldFrom state via resume | CANCELLED
RESOLVED -> CLOSED | REOPENED
CLOSED -> REOPENED; CANCELLED -> terminal
```

Hold/cancel require no active visits; cancel also requires disposed running repair/pending parts work. A hold never pauses SLA. Triage is controlled classification, not verified diagnosis; CRITICAL implies safety concern, physical visit and required safety checks. Flagged concerns cannot be silently cleared. Escalation resets safety review and preserves original SLA. ADMIN safety review is internal evidence/attestation, not electrical certification or permission to energize.

Assignments preserve old rows, require existing active TECHNICIAN, active workforce profile when present and configured triage qualifications. Availability remains unconfirmed until a timed visit is validated. Technician acknowledges before scheduling. Reassignment requires all current visits completed/cancelled. One current assignment per ticket; multiple visits allowed, up to100/ticket. Team membership is not assignment. SUPPORT cannot impersonate technician acknowledgement.

Visits: SCHEDULED -> rescheduled SCHEDULED / IN_PROGRESS / CANCELLED; IN_PROGRESS -> COMPLETED; terminal visit rows freeze. Scheduling is future, positive, at most7days. M06 checks survey/installation/service overlap/rest/leave/blocks/capacity/skills/calendars; managed service visits require the whole interval confirmed. Missing SERVICE qualification policy/calendar blocks managed planning. Legacy planning is explicitly uncertain and requires acknowledgement/notes; safety-related cases require managed verified staffing. M06 catalog now accepts SERVICE (maximum6 distinct purposes). Unscheduled service assignments are uncertainty; overdue running visits block new commitments. No automatic staffing/team expansion occurs.

Start records server arrival within the booked window, not GPS proof. siteAccess CONFIRMED requires safetyMeasuresVerified true; DENIED records attempted access and permits no diagnosis/repair. Denied visits complete with follow-up required. Own worker/ADMIN records departure, actual work and explicit outcome/evidence; confirmed visits require observed diagnosis and disposed repair actions. Scheduled duration never becomes actual labor. New repair work revalidates M06/triage qualifications and cannot start after booked end; observed departure/outcomes remain recordable after overrun/qualification expiry. An overrun needs actual checkout and separately planned follow-up, not fabricated rescheduling of attendance.

Diagnosis revisions append immutable rows using supersedesId from the same visit/cycle. The ticket's installed target applies to all its diagnosis/repair records. Use a separate ticket for another target, never rewrite original commissioning. Repair lifecycle: PLANNED -> IN_PROGRESS -> COMPLETED; PLANNED -> CANCELLED. Completed follow-up work may be explicitly reworked by ADMIN into a current running follow-up visit, preserving before/after history. Completion requires explicit outcome and evidence. COMPONENT_REPLACEMENT cannot start/complete because M04 lacks service fulfillment. No removed/installed replacement serial is invented.

Technical resolution needs first actual customer response, current-cycle completed visit when required, latest visit without follow-up, no active visit, no unresolved repair/follow-up or pending part handoff, current evidence, human safety review when flagged and PASS for every required check. NOT_APPLICABLE is only for optional checks, with notes; it cannot waive mandatory safety/work. Select battery checks explicitly only when applicable. Feedback is staff-attested observed customer response after resolution, not a signature. Closure needs latest acknowledgement, all four review checks and ADMIN who did not record technical resolution. Resolution never closes automatically.

Reopening requires ADMIN/reason, clears current resolution/closure and increments executionRevision. Prior visits/feedback/checks/evidence/reviews remain historical; current-cycle checks/evidence are required again. Original first response/SLA clock remain. Finalized completed maintenance tickets cannot reopen; create a new complaint. Cancelled maintenance occurrences finalize separately after ticket cancellation; reschedule plan to a new due instant before regenerating.

## Warranty, stock, SLA and maintenance

Warranty response `current` is `{capturedAt,context,authority}` or `{capturedAt,context:null,limitation}`. Authorized context reuses M07 installation/serial coverage, frozen policies/periods, effective status and limited history/truncation signal. Creation/triage store the exact context used; capturedContext is hidden without current M07 permission. Active coverage is not guaranteed fault acceptance; M08 never creates/transitions claims or reads private M07 evidence through this endpoint.

Part requests only record component, Decimal quantity and purpose as PENDING_HANDOFF; ADMIN may cancel with explicit disposition. No ServicePartUsage, stock decrement, fabricated dispatch/return, fulfillment status or replacement installation exists. `/parts-requests` exposes minimal scoped requests. An outstanding request blocks resolution; cancellation is an explicit human decision, not stock receipt/consumption. Actual physical spare-part fulfillment needs a separately authorized M04 extension.

SLA policies are immutable explicit reference/revision rows. Targets/effective periods are ADMIN-configured, not universal. Response1..525600minutes, resolution at least response and at most5256000minutes. Clock is elapsed UTC, continuous across weekends, holidays, holds and reopens; business-hours/DST/pause clocks are unsupported. Due times start at original server openedAt, including late explicit policy binding. Reclassification/escalation retains original configured targets/snapshot. First response is an explicitly attested communication timestamp, not triage time. Breach uses actual response/resolution or current time; unconfigured returns null, not compliance. Cancelled is separately flagged and excluded from unresolved summary. No SLA jobs/notifications run.

Maintenance uses explicit intervalDays1..3650 and required checklist, never inferred manufacturer obligations. One unfinished occurrence/plan and unique plan+due time prevent duplicate ticket generation. Commands are explicit/idempotent; due queries schedule nothing. Completion requires actual resolved/closed ticket and mandatory checks; nextDueAt = recorded completion + configured intervalDays in UTC. Pause/reschedule/cancel only without unfinished occurrence; cancelled plan terminal. No automatic future visit, scheduler or reminder delivery. Responsibility is assigned through actual generated ticket, without a separate team calendar.

## Examples and uploads

```ts
// Replace placeholders with existing authorized IDs and current versions; creates no sample data here.
const request: TicketCreate={installationId,equipmentId,serialUnitId,warrantyClaimId:null,
 reportedIssue:'Customer reports intermittent shutdown',description:'Unverified customer observations supplied to support',
 category:'INVERTER_ISSUE',priority:'MEDIUM',channel:'PHONE',slaPolicyId:null,
 idempotencyKey:crypto.randomUUID(),reason:'Record actual customer complaint'};
await fetch('/api/service/tickets',{method:'POST',credentials:'include',
 headers:{'Content-Type':'application/json','X-CSRF-Token':csrf},body:JSON.stringify(request)});
// Response envelope: {data:{id,reference,customerId,siteId,installationId,...,status:'OPEN',version:1,executionRevision:1}}
// GET /api/service/tickets?status=WAITING_FOR_PARTS&page=1&pageSize=20&sort=resolutionDue
// Unconfigured SLA: {configured:false,clock:'UNCONFIGURED',firstResponseDueAt:null,
// resolutionDueAt:null,firstResponseBreached:null,resolutionBreached:null,...}
const params=new URLSearchParams({version:String(version),reason:'Attach observed fault evidence',
 type:'FAULT_PHOTO',visitId,fileName:file.name});
await fetch(`/api/service/tickets/${ticketId}/evidence?${params}`,{method:'POST',credentials:'include',
 headers:{'Content-Type':file.type,'X-CSRF-Token':csrf},body:file});
```

Upload is raw JPEG/PNG/PDF bytes, not multipart/base64/JSON. Default5MiB, configurable up to10MiB, no compressed encoding; safe filename ≤160characters. Ten uploads/15minutes, maximum100 objects/ticket. MIME/signature/checksum are not malware scanning. TECHNICIAN must name own visit; coordinator may upload general ticket files. After resolution only coordinator CUSTOMER_ACKNOWLEDGEMENT evidence is allowed; CLOSED/CANCELLED freeze. Referenced IDs must belong to current cycle and exact visit for technical diagnosis/repair/start/complete. Download is private, integrity-checked forced attachment/CSP sandbox. No public filesystem URL/storageKey is returned. On uncertain upload outcome inspect metadata/version before retrying; unknown DB commit retains object for reconciliation.

Important errors: SERVICE_TRANSITION, VERSION_CONFLICT, IDEMPOTENCY_CONFLICT, SERVICE_INSTALLED_EQUIPMENT, SERVICE_SERIAL_IDENTITY, SERVICE_WARRANTY_CLAIM_SCOPE, SERVICE_SLA_POLICY, SERVICE_ACTIVE_VISIT, SERVICE_ASSIGNMENT_ACK, SERVICE_LEGACY_UNCERTAINTY, SERVICE_REQUIRED_QUALIFICATION, WORKFORCE_BUSY/UNAVAILABLE/ELIGIBILITY/OVERDUE_SERVICE, SERVICE_SAFETY_REVIEW, SERVICE_VISIT_OVERRUN, SERVICE_REPLACEMENT_UNSUPPORTED, SERVICE_MANDATORY_WORK, SERVICE_CUSTOMER_ACK_REQUIRED, SERVICE_INDEPENDENT_CLOSURE, SERVICE_EVIDENCE_OWNER, SERVICE_MAINTENANCE_DUPLICATE, SERVICE_CONSTRAINT and standard401/403/404/413/415/422/429. SQL/serialization/unique conflicts require deliberate refresh, not automatic status mutation.

## Differences from existing frontend mocks

Frontend local `serviceTicketService`/task/resolution stores, provisional IDs, lowercase enums, local denormalized customer copies, progressPercent, string photo URLs, simulated warranty indicator, spare-part usage and signaturePlaceholder are not server authority. Map to the real ticket + historical assignment + multiple visits model, fetch real masters, use exact enums/versions/envelopes and protected file fetches. Do not label expired coverage automatically chargeable, active coverage automatically accepted, or scheduled hours actual work. No independent task master, universal service rates, payment/replacement integration or fabricated manufacturer diagnosis is provided. No React file was edited.

M08 warranty selection retains exact selected equipment/original serial plus project workmanship context; it never treats workmanship as guaranteed equipment-failure coverage. Whole-project tickets use project context. The internal coverage reader accepts this optional filter without changing existing M07 public endpoint behavior. Capture is capped100 matching registrations and exposes coverageTruncated; existing context pagination/claim-history truncation remain explicit.
