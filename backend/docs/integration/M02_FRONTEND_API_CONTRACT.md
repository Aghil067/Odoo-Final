# M02 frontend API contract — Abisha

This contract describes the implemented backend, not a new frontend. All examples are illustrative documentation; no example accounts, sites, surveys or uploaded files are created by this project or its verification. Run backend commands from `backend/`.

## Authentication, transport and roles

Base path: `/api/surveys`. Reuse M01 login/session flow, browser `credentials:'include'` or Axios `withCredentials:true`. Every POST/PATCH/PUT requires the configured trusted Origin and `X-CSRF-Token` from login or `/api/auth/me`. JSON actions require `Content-Type:application/json`; **only attachment POST accepts raw binary**. Do not send frontend-only role names or remembered-login fields to authentication. No refresh-token endpoint is implemented.

Roles are uppercase backend values. ADMIN requests/assigns/schedules/cancels/reviews; SALES requests initial surveys for its permitted leads and reads their survey data; TECHNICIAN performs field work only when explicitly assigned by ADMIN. Other roles are denied. ADMIN cannot submit field findings in place of the assigned technician. The existing eight lowercase frontend roles remain a separate integration mismatch; no automatic `surveyor`→TECHNICIAN or `admin` privilege mapping exists.

Lists default page=1/pageSize=20, max pageSize=100, max page=100000. Unknown request/query keys are rejected; query values are strings. Lists sort createdAt descending then id descending, except the surveyor picker (name/id ascending) and availability appointments (scheduledAt/id ascending). Empty list has totalItems=0,totalPages=0. Dates require ISO8601 timezone/offset; output timestamps are UTC. Numeric decimal inputs/outputs use strings, except integer versions/durations/counts. Omit PATCH fields to retain them; use null only on nullable fields. All mutable actions require the latest survey version.

## Enums and exact JSON interfaces

```ts
type UUID = string;
type ISODateTime = string;
type DecimalString = string;
type SurveyStatus = 'REQUESTED'|'SCHEDULED'|'IN_PROGRESS'|'SUBMITTED'|'REVISION_REQUIRED'|'APPROVED'|'REJECTED'|'CANCELED';
type VisitStatus = 'NOT_SCHEDULED'|'CONFIRMED'|'IN_PROGRESS'|'COMPLETED'|'CANCELED';
type SurveyEvent = 'REQUESTED'|'ASSIGNED'|'SCHEDULED'|'RESCHEDULED'|'STARTED'|'UPDATED'|'ROOF_UPDATED'|'ELECTRICAL_UPDATED'|'ATTACHMENT_ADDED'|'SUBMITTED'|'REVIEWED'|'CANCELED';
type RoofType = 'RCC'|'METAL'|'TILE'|'OTHER';
type ShadingLevel = 'NONE'|'LOW'|'MODERATE'|'HIGH';
type Accessibility = 'ACCESSIBLE'|'RESTRICTED'|'UNSAFE'|'UNKNOWN';
type RoofCondition = 'GOOD'|'FAIR'|'POOR'|'UNKNOWN';
type GridConnection = 'CONNECTED'|'NOT_CONNECTED'|'UNKNOWN';
type SupplyPhase = 'SINGLE_PHASE'|'THREE_PHASE'|'UNKNOWN';
type Suitability = 'UNASSESSED'|'SUITABLE'|'CONDITIONALLY_SUITABLE'|'NOT_SUITABLE';
type SystemType = 'ON_GRID'|'OFF_GRID'|'UNDECIDED';
type AttachmentCategory = 'ROOF_PHOTO'|'METER_PHOTO'|'PANEL_PHOTO'|'SITE_LAYOUT'|'SUPPORTING_FILE';
type ReviewDecision = 'APPROVED'|'REVISION_REQUIRED'|'REJECTED';
type Role = 'ADMIN'|'SALES'|'TECHNICIAN'|'WAREHOUSE'|'SUPPORT'|'FINANCE';
type Json = null|boolean|number|string|Json[]|{[key:string]:Json};
interface PublicUser {id:UUID; name:string; email:string; role:Role}
interface Pagination {page:number; pageSize:number; totalItems:number; totalPages:number}
interface Success<T> {data:T}
interface Page<T> {data:T[]; pagination:Pagination}
interface Failure {error:{code:string; message:string; details?:{field:string;message:string}[];requestId:UUID}}
interface Survey {
  id:UUID; reference:string; leadId:UUID; siteId:UUID; customerId:UUID;
  assessmentNumber:number; previousSurveyId:UUID|null; requestedById:UUID; assignedToId:UUID|null;
  status:SurveyStatus; visitStatus:VisitStatus; requestNotes:string; assignmentNotes:string|null;
  scheduledAt:ISODateTime|null; scheduledEndAt:ISODateTime|null; expectedDurationMinutes:number|null;
  startedAt:ISODateTime|null; submittedAt:ISODateTime|null;
  requestedCapacityKw:DecimalString|null; recommendedCapacityKw:DecimalString|null;
  recommendedSystemType:SystemType; suitability:Suitability; infeasibilityReason:string|null;
  additionalWorkRequired:string|null; technicalAssumptions:string|null; feasibilityNotes:string|null;
  approvedVersion:number|null; version:number; createdAt:ISODateTime; updatedAt:ISODateTime;
}
interface RoofFields {
  roofType:RoofType; roofTypeDetails:string|null; usableAreaSqm:DecimalString;
  azimuthDegrees:DecimalString; tiltDegrees:DecimalString; shadingLevel:ShadingLevel;
  shadingObservations:string; nearbyObstructions:string; mountingSpaceSqm:DecimalString;
  accessibility:Accessibility; accessibilityNotes:string; visibleCondition:RoofCondition;
  conditionNotes:string; mountingConcerns:string; structuralNotes:string;
  specialistVerificationRequired:boolean; recommendations:string;
}
interface ElectricalFields {
  gridConnection:GridConnection; supplyPhase:SupplyPhase; meterDetails:string|null;
  panelPresent:boolean; panelObservations:string; approximateCableRunMeters:DecimalString|null;
  earthingObservations:string; inverterPlacementOptions:string; batteryPlacementConsiderations:string|null;
  safetyConcerns:string; safetyVerificationRequired:boolean; gridSuitabilityObservations:string; additionalNotes:string;
}
interface RoofAssessment extends RoofFields {id:UUID;surveyId:UUID;createdAt:ISODateTime;updatedAt:ISODateTime}
interface ElectricalAssessment extends ElectricalFields {id:UUID;surveyId:UUID;createdAt:ISODateTime;updatedAt:ISODateTime}
interface Attachment {
  id:UUID;surveyId:UUID;uploaderId:UUID;category:AttachmentCategory;
  fileName:string;mimeType:string;sizeBytes:number;sha256:string;createdAt:ISODateTime;
}
interface CustomerForVisit {id:UUID;reference:string;name:string;phone:string}
interface SiteForVisit {
  id:UUID;customerId:UUID;name:string;addressLine1:string;addressLine2:string|null;
  city:string;state:string;postalCode:string;country:string;landmark:string|null;
  latitude:DecimalString|null;longitude:DecimalString|null;propertyNotes:string|null;version:number;
}
interface SurveySnapshot extends Survey {
  customer:CustomerForVisit;site:SiteForVisit;
  roofAssessment:RoofAssessment|null;electricalAssessment:ElectricalAssessment|null;attachments:Attachment[];
}
interface Checklist {
  roofReviewed:boolean;electricalReviewed:boolean;evidenceReviewed:boolean;
  assumptionsReviewed:boolean;limitationsAcknowledged:boolean;conditionalWorkAcknowledged:boolean;
}
interface Review {
  id:UUID;surveyId:UUID;reviewerId:UUID;decision:ReviewDecision;surveyVersion:number;
  notes:string;checklist:Checklist|Record<string,never>;snapshot:SurveySnapshot;createdAt:ISODateTime;
}
interface History {
  id:UUID;surveyId:UUID;actorId:UUID;event:SurveyEvent;fromStatus:SurveyStatus|null;toStatus:SurveyStatus;
  surveyVersion:number;reason:string;details:Json;createdAt:ISODateTime;actor:PublicUser;
}
interface SurveyDetail extends Survey {
  customer:CustomerForVisit;site:SiteForVisit;lead:{id:UUID;reference:string;status:string};
  assignedTo:PublicUser|null;requestedBy:PublicUser;
  roofAssessment:RoofAssessment|null;electricalAssessment:ElectricalAssessment|null;
  reassessment:{id:UUID;reference:string;assessmentNumber:number;status:SurveyStatus}|null;
  counts:{attachments:number;history:number;reviews:number};
}
interface ApprovedSurvey {
  surveyId:UUID;reference:string;leadId:UUID;siteId:UUID;customerId:UUID;assessmentNumber:number;
  approvedVersion:number;reviewId:UUID;reviewerId:UUID;approvedAt:ISODateTime;
  recommendedCapacityKw:DecimalString|null;recommendedSystemType:SystemType;suitability:Suitability;
  additionalWorkRequired:string|null;technicalAssumptions:string|null;
  approvalChecklist:Checklist|Record<string,never>;snapshot:SurveySnapshot;
  approvalScope:'INTERNAL_PRELIMINARY_FEASIBILITY';
}
interface Summary {
  asOf:ISODateTime;totalSurveys:number;pendingReview:number;approved:number;revisionRequired:number;unassigned:number;
  byStatus:{status:SurveyStatus;count:number}[];
}
interface Availability {
  surveyor:PublicUser;from:ISODateTime;to:ISODateTime;available:boolean;ongoingVisits:number;activeWorkload:number;
  appointments:Page<{id:UUID;reference:string;status:SurveyStatus;scheduledAt:ISODateTime|null;scheduledEndAt:ISODateTime|null;expectedDurationMinutes:number|null}>;
}
```

## Requests, endpoints and permissions

Every path below is prefixed `/api/surveys`. All paths with `:id` require a real visible UUID. Field-edit and upload permissions always require the assigned TECHNICIAN in IN_PROGRESS or REVISION_REQUIRED. Scope: ADMIN all, SALES current M01 lead scope, TECHNICIAN assigned only.

| Method/path | Input | Success `data` | Permission |
|---|---|---|---|
| POST `/` | `{leadId,siteId,requestNotes,previousSurveyId?}` | Survey, 201 | ADMIN/SALES initial; ADMIN reassessment |
| GET `/` | paging + filters below | `(Survey & {assignedTo:PublicUser|null})[]`, top-level pagination | Scoped read |
| GET `/:id` | none | SurveyDetail | Scoped read |
| PATCH `/:id` | `{version,...feasibilityFields}` | Survey | Assigned field editor |
| POST `/:id/assign` | `{version,assignedToId,assignmentNotes?:string|null,reason}` | Survey | ADMIN |
| POST `/:id/schedule` | `{version,scheduledAt,expectedDurationMinutes,reason}` | Survey | ADMIN |
| POST `/:id/start` | `{version,reason}` | Survey | Assigned TECHNICIAN, scheduled window |
| POST `/:id/submit` | `{version,reason}` | Survey | Assigned field editor |
| POST `/:id/review` | `{version,decision,notes,checklist?:Checklist}` | `{survey:Survey,review:Review}` | ADMIN, SUBMITTED only |
| POST `/:id/cancel` | `{version,reason}` | Survey | ADMIN, active only |
| PUT `/:id/roof-assessment` | `{version,...RoofFields}` (all fields required) | `{assessment:RoofAssessment,surveyVersion:number}` | Assigned field editor |
| PUT `/:id/electrical-assessment` | `{version,...ElectricalFields}` (all fields required) | `{assessment:ElectricalAssessment,surveyVersion:number}` | Assigned field editor |
| POST `/:id/attachments` | Query `{version,category,fileName}` + raw file bytes | `{attachment:Attachment,surveyVersion:number}`, 201 | Assigned field editor |
| GET `/:id/attachments` | paging | Attachment[] + pagination | Scoped read |
| GET `/:id/attachments/:attachmentId/download` | none | Binary bytes, forced download | Scoped read of matching survey/file |
| GET `/:id/history` | paging | History[] + pagination | Scoped read |
| GET `/:id/reviews` | paging | `(Review & {reviewer:PublicUser})[]` + pagination | Scoped read |
| GET `/:id/approved` | none | ApprovedSurvey | Scoped read + handoff eligibility |
| GET `/summary` | none | Summary | Scoped read |
| GET `/availability` | `{surveyorId,from,to,page?,pageSize?}` | Availability | ADMIN or TECHNICIAN self |
| GET `/surveyors` | paging | PublicUser[] + pagination, active TECHNICIAN only | ADMIN |

All successes except create/upload return 200; failures follow M01 Failure. No generic state PATCH, DELETE, automatic notification or public attachment URL exists. `GET /:id` returns assessments and related **counts**, not unbounded history/review/attachment arrays; fetch the paginated collections separately.

List filters: `status`, `leadId`, `siteId`, `customerId`, `assignedToId`, `q` (reference, site name or lead reference), plus page/pageSize. Filters intersect with scope. Query strings must use the documented casing. Availability requires both offset timestamps with to>from and a maximum 31-day interval; it paginates overlapping SCHEDULED/IN_PROGRESS appointments. `available=false` also when an ongoing visit lies outside the requested planned interval, to avoid suggesting an overrun is finished. This is not a shift/leave calendar or booking guarantee.

Feasibility PATCH fields (all optional individually; at least one required besides version): `recommendedCapacityKw:string|null`, `recommendedSystemType:SystemType`, `suitability:Suitability`, `infeasibilityReason:string|null`, `additionalWorkRequired:string|null`, `technicalAssumptions:string|null`, `feasibilityNotes:string|null`. Lead/customer/site/requestedCapacityKw, ownership, version increment, status and timestamps cannot be client-modified.

## Validation and UI rules

- Nonempty trimmed text is required for observations; if none are observed, the surveyor must record that honestly rather than the UI generating an answer. Most observation fields allow 5000 characters; request/assignment/reason/infeasibility/meter/OTHER construction/accessibility notes allow 2000. Whole JSON request is capped at 32 KiB. Null is explicit unknown/cleared data; empty strings are invalid.
- Capacity is positive, <=9999999.999; area is 0..1000000 m² with mounting<=usable; azimuth 0..359.999 (north=0, clockwise); tilt 0..90; cable run is null or 0..100000 m. All are canonical decimal strings with <=3 fractional digits, no exponent/negative/commas/leading zeros. These broad range checks do not certify engineering correctness. Decimal outputs may omit trailing zeros.
- OTHER roof needs details. Connected grid needs meter details. Roof/electrical PUT are full replacements: all nullable fields must explicitly be null when unknown/not applicable, rather than omitted.
- Start is allowed only in the confirmed appointment window. Duration is an integer 15..480; schedules must be future dates. Reassignment/rescheduling always requires a reason.
- Submission needs complete assessments, decided suitability/system, assumptions/feasibility notes, positive capacity/roof/mounting for suitable sites, reason for NOT_SUITABLE, battery considerations for OFF_GRID, and required photos.
- Roof photo is always required; connected grid additionally requires meter photo; panelPresent additionally requires panel photo. Layout/support files are optional.
- Approval requires complete findings, a suitable/conditional site, and roof/electrical/evidence/assumptions/limitations checklist acknowledgements. Conditional work requires its own acknowledgement and description. Structural/electrical specialist flags, HIGH shading, inaccessible/unknown access, poor/unknown roof condition or ON_GRID without known grid connection require CONDITIONALLY_SUITABLE treatment. No approval claims external permission or certified testing.
- Requests must start from a lead already SURVEY_REQUESTED; QUALIFIED is insufficient. Existing survey history locks that lead's site. Active surveys prevent changing the lead out of SURVEY_REQUESTED.
- Valid graph: REQUESTED→SCHEDULED/CANCELED; SCHEDULED→IN_PROGRESS/CANCELED; IN_PROGRESS→SUBMITTED/CANCELED; SUBMITTED→APPROVED/REVISION_REQUIRED/REJECTED/CANCELED; REVISION_REQUIRED→SCHEDULED/SUBMITTED/CANCELED. Terminal rows cannot change. Field editing is allowed only IN_PROGRESS/REVISION_REQUIRED.

## JSON examples and response shapes

Use actual IDs returned by M01 and `/surveyors`. These UUIDs, dates and notes illustrate the contract; they are not seeded data. Replace schedule times with future instants at use time and use each latest returned version rather than assuming the illustrative sequence still applies.

### Request and read a survey

POST `/api/surveys`:

```json
{"leadId":"11111111-1111-4111-8111-111111111111","siteId":"22222222-2222-4222-8222-222222222222","requestNotes":"Customer confirmed access for a preliminary feasibility visit."}
```

201 response `Success<Survey>`:

```json
{
  "data": {
    "id":"33333333-3333-4333-8333-333333333333","reference":"SUR-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    "leadId":"11111111-1111-4111-8111-111111111111","siteId":"22222222-2222-4222-8222-222222222222","customerId":"44444444-4444-4444-8444-444444444444",
    "assessmentNumber":1,"previousSurveyId":null,"requestedById":"55555555-5555-4555-8555-555555555555","assignedToId":null,
    "status":"REQUESTED","visitStatus":"NOT_SCHEDULED","requestNotes":"Customer confirmed access for a preliminary feasibility visit.","assignmentNotes":null,
    "scheduledAt":null,"scheduledEndAt":null,"expectedDurationMinutes":null,"startedAt":null,"submittedAt":null,
    "requestedCapacityKw":"5","recommendedCapacityKw":null,"recommendedSystemType":"UNDECIDED","suitability":"UNASSESSED",
    "infeasibilityReason":null,"additionalWorkRequired":null,"technicalAssumptions":null,"feasibilityNotes":null,"approvedVersion":null,"version":1,
    "createdAt":"2026-10-31T08:00:00.000Z","updatedAt":"2026-10-31T08:00:00.000Z"
  }
}
```

GET `/:id` returns those same scalar fields plus SurveyDetail's customer/site/lead, safe assigned/requesting user, assessments, reassessment pointer and counts. A new survey has `roofAssessment:null`, `electricalAssessment:null`, `reassessment:null` and `counts:{attachments:0,history:1,reviews:0}`. List response adds assignedTo to each Survey row:

```json
{"data":[],"pagination":{"page":1,"pageSize":20,"totalItems":0,"totalPages":0}}
```

### Assignment, scheduling and start

ADMIN POST `/:id/assign`:

```json
{"version":1,"assignedToId":"66666666-6666-4666-8666-666666666666","assignmentNotes":"Coordinate roof access with the customer.","reason":"Assign field visit to an available technician."}
```

ADMIN POST `/:id/schedule`:

```json
{"version":2,"scheduledAt":"2026-11-02T10:00:00+05:30","expectedDurationMinutes":90,"reason":"Customer confirmed the visit slot."}
```

Both return the complete `Success<Survey>` shape above with changed fields/current version. Schedule sets status=SCHEDULED, visitStatus=CONFIRMED, scheduledAt=`2026-11-02T04:30:00.000Z`, scheduledEndAt=`2026-11-02T06:00:00.000Z`, duration=90, version=3. To reschedule, send this same endpoint with current version, a new future slot and reason; history retains the prior slot. To reassign, use assign with current version and another active technician UUID; it checks overlap at the existing slot.

Assigned TECHNICIAN POST `/:id/start` during that window:

```json
{"version":3,"reason":"Arrived at the property and began the field survey."}
```

Returns complete `Success<Survey>` with status=IN_PROGRESS, visitStatus=IN_PROGRESS, server startedAt and version=4.

### Roof assessment

PUT `/:id/roof-assessment` (illustrative observations only):

```json
{
  "version":4,"roofType":"RCC","roofTypeDetails":null,"usableAreaSqm":"80","azimuthDegrees":"180","tiltDegrees":"5",
  "shadingLevel":"LOW","shadingObservations":"A nearby tree casts limited edge shade during the observed visit.",
  "nearbyObstructions":"Water tank located along the northern edge.","mountingSpaceSqm":"65",
  "accessibility":"ACCESSIBLE","accessibilityNotes":"Permanent stair access is available.","visibleCondition":"FAIR",
  "conditionNotes":"Minor surface wear observed; no certification performed.","mountingConcerns":"Keep access paths clear.",
  "structuralNotes":"Visual observations only; specialist verification required before final design.",
  "specialistVerificationRequired":true,"recommendations":"Arrange structural review before final mounting design."
}
```

Response is `{"data":{"assessment":RoofAssessment,"surveyVersion":5}}`. Assessment includes all RoofFields above (without request version) plus generated id, surveyId, createdAt and updatedAt. There is no claim of a structural load test.

### Electrical assessment

PUT `/:id/electrical-assessment`:

```json
{
  "version":5,"gridConnection":"CONNECTED","supplyPhase":"SINGLE_PHASE","meterDetails":"Meter position and displayed identifier recorded during the visit.",
  "panelPresent":true,"panelObservations":"Panel location accessible for visual inspection.","approximateCableRunMeters":"22.5",
  "earthingObservations":"Existing conductor visible; certified testing has not been performed.","inverterPlacementOptions":"Sheltered utility-wall position for later design review.",
  "batteryPlacementConsiderations":null,"safetyConcerns":"Electrical verification remains necessary before installation.",
  "safetyVerificationRequired":true,"gridSuitabilityObservations":"Existing connection observed; utility permissions not assessed.",
  "additionalNotes":"Preliminary visual observations only."
}
```

Response is `{"data":{"assessment":ElectricalAssessment,"surveyVersion":6}}`, with the same generated metadata pattern. OFF_GRID later requires nonnull batteryPlacementConsiderations before submission.

### Preliminary feasibility

PATCH `/:id`:

```json
{
  "version":6,"recommendedCapacityKw":"5","recommendedSystemType":"ON_GRID","suitability":"CONDITIONALLY_SUITABLE",
  "infeasibilityReason":null,"additionalWorkRequired":"Specialist structural and electrical verification before final design and installation.",
  "technicalAssumptions":"Capacity is a surveyor recommendation, subject to specialist checks and M03 design; no universal roof-area formula used.",
  "feasibilityNotes":"Proceed to internal review with the stated conditions."
}
```

Returns complete `Success<Survey>` with these saved fields and version=7. It does not calculate capacity or a BOM.

### Evidence upload and retrieval

Upload raw bytes from a browser File object (no FormData):

```ts
const query = new URLSearchParams({version:String(currentVersion),category:'ROOF_PHOTO',fileName:file.name});
const response = await fetch(`${apiBase}/surveys/${surveyId}/attachments?${query}`, {
  method:'POST',credentials:'include',
  headers:{'Content-Type':file.type,'X-CSRF-Token':csrfToken},body:file,
});
const result = await response.json(); // handle error statuses before reading data
// result.data = {attachment: Attachment, surveyVersion: number}
```

MIME values: image/jpeg (.jpg/.jpeg), image/png (.png), application/pdf (.pdf). PDF is allowed only for SITE_LAYOUT/SUPPORTING_FILE. Names are 5–100 safe ASCII characters, begin alphanumeric, contain no paths/colon/quotes or double dots. Default max size is 5 MiB; configured ceiling is 10 MiB. No compression is accepted. 25 attachments maximum per assessment. Every successful upload increments version, so await each response before sending the next file.

Example 201 response (size/digest illustrative):

```json
{
  "data": {
    "attachment": {
      "id":"77777777-7777-4777-8777-777777777777","surveyId":"33333333-3333-4333-8333-333333333333",
      "uploaderId":"66666666-6666-4666-8666-666666666666","category":"ROOF_PHOTO","fileName":"roof.jpg","mimeType":"image/jpeg",
      "sizeBytes":102400,"sha256":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","createdAt":"2026-11-02T05:00:00.000Z"
    },
    "surveyVersion":8
  }
}
```

After applicable meter/panel uploads, use the latest returned version. GET `/:id/attachments` returns paginated metadata without storageKey. GET `/:id/attachments/:attachmentId/download` uses cookie authentication and returns bytes, not a JSON envelope; use a credentialed fetch/blob/download link. Do not expose a guessed filesystem path or public static URL. There is no attachment-delete API; an unsuitable upload can be explained with a new valid supporting file and review notes, subject to the 25-file cap.

### Submit, review and revisions

With all three example photos uploaded sequentially, the illustrative version would be 10. POST `/:id/submit`:

```json
{"version":10,"reason":"Field observations and applicable photographs are ready for internal review."}
```

Returns `Success<Survey>` with SUBMITTED/COMPLETED, server submittedAt and version=11. No field edits/uploads are allowed while submitted.

ADMIN POST `/:id/review`:

```json
{
  "version":11,"decision":"APPROVED","notes":"Internal conditional feasibility approved; specialist work remains required before design/installation.",
  "checklist":{"roofReviewed":true,"electricalReviewed":true,"evidenceReviewed":true,"assumptionsReviewed":true,"limitationsAcknowledged":true,"conditionalWorkAcknowledged":true}
}
```

Response is `Success<{survey:Survey,review:Review}>`: survey.status=APPROVED, survey.version=12, approvedVersion=11; review.decision=APPROVED, review.surveyVersion=11 and its immutable snapshot is the submitted SurveySnapshot at version=11. The review includes generated ID, reviewer ID, server time, full notes and the exact checklist.

For corrections use the same endpoint while SUBMITTED with `{"version":11,"decision":"REVISION_REQUIRED","notes":"Clarify mounting clearances and provide an updated panel observation."}`. A persisted review/snapshot is returned and the survey enters REVISION_REQUIRED. Assigned technician may correct findings and resubmit, or ADMIN may schedule a revisit. REJECTED uses the same review schema with a nonempty explanation; it is terminal.

Cancel any active survey as ADMIN with `{"version":3,"reason":"Customer requested cancellation of this visit."}` at POST `/:id/cancel`. The complete Survey response has CANCELED visit/status and incremented version; history remains. A canceled appointment no longer blocks booking. Versions above represent alternative example flows, not operations to run sequentially without re-reading.

### Reassessment and stable M03 handoff

After a terminal assessment, ADMIN may POST `/api/surveys` with the original lead/site and its latest survey ID:

```json
{"leadId":"11111111-1111-4111-8111-111111111111","siteId":"22222222-2222-4222-8222-222222222222","previousSurveyId":"33333333-3333-4333-8333-333333333333","requestNotes":"Site conditions changed; a new assessment is required."}
```

Returns a new Survey ID, assessmentNumber=2, previousSurveyId referencing the prior record, status REQUESTED, version=1, empty findings and no approval. It does not copy old evidence or alter old approved records. A new chain member immediately prevents the predecessor being used as the current M03 handoff, even while the new assessment awaits approval.

GET `/:id/approved` returns `Success<ApprovedSurvey>` only for the latest approved survey, with an active customer and a lead still SURVEY_REQUESTED. Persist surveyId+approvedVersion+reviewId for later integration. `approvalScope` is always INTERNAL_PRELIMINARY_FEASIBILITY; consume additionalWorkRequired and snapshot flags as conditions, not completion certificates. GET history/reviews is for audit, not evidence that a pending/rejected successor is approved. M03 itself is not implemented.

### Summary, history and availability

GET `/summary` on an empty scoped dataset:

```json
{"data":{"asOf":"2026-10-31T08:00:00.000Z","totalSurveys":0,"pendingReview":0,"approved":0,"revisionRequired":0,"unassigned":0,"byStatus":[]}}
```

Metrics count all visible assessment records, including terminal historical versions. `unassigned` counts active records without a surveyor. No fake KPI values or timeline entries are inserted.

GET `/:id/history?page=1&pageSize=20` returns Page<History>; mutation details include real assignee/slot changes, changed field names, attachment ID/hash or review ID. History's surveyVersion is the resulting row version; Review's surveyVersion is the reviewed submitted content version.

GET `/availability?surveyorId=<uuid>&from=2026-11-02T04%3A30%3A00Z&to=2026-11-02T06%3A00%3A00Z&page=1&pageSize=20` returns Availability. With no bookings/ongoing work it contains `available:true`, `ongoingVisits:0`, `activeWorkload:0`, `appointments:{data:[],pagination:{page:1,pageSize:20,totalItems:0,totalPages:0}}` and the real selected surveyor/from/to. `/surveyors` supplies real directory IDs to ADMIN; no fabricated surveyors exist.

## Error handling

```json
{"error":{"code":"SURVEYOR_BUSY","message":"Confirmed survey appointments cannot overlap","requestId":"88888888-8888-4888-8888-888888888888"}}
```

Use HTTP status/code rather than parsing message text. 400: unreadable upload body or malformed JSON; 401: login/session; 403: role/CSRF/origin/self-review; 404: missing/inaccessible survey/file; 409: state/version/conflict/immutable/ineligible handoff; 422: input/completeness/evidence; 413: oversized upload; 415: unsupported media or compression; 429: rate limit. On 409 refresh and let the user decide; do not silently overwrite findings or retry an unknown-outcome write. Uploads can fail because the version changed during transfer; fetch the current survey before another attempt. Display the actual workflow status and never synthesize approval from a frontend checkbox.
