# M06 frontend API contract

Base `/api/technicians`. M05 PR #5 merged before branching, so M06 targets main and requires M01–M05 schema. Existing frontend is preserved. Existing User is the identity; no registration/password/role-change endpoint is introduced. Trusted provisioning scripts remain the only account creation path.

## Authentication and privacy

Reuse login/me/logout, HttpOnly cookie (`credentials:'include'` / withCredentials), exact trusted Origin and X-CSRF-Token on all POST/PATCH/PUT. JSON writes only, max32KiB; unknown body/list-query fields rejected. Uppercase backend roles are ADMIN, TECHNICIAN, SALES, SUPPORT, WAREHOUSE, FINANCE. A=ADMIN; O=A or own TECHNICIAN; S=SALES limited availability with authorized surveyId. SUPPORT/WAREHOUSE/FINANCE have no M06 routes.

Profiles, emergency contacts, certificate numbers and leave notes are not public technician-directory data. TECHNICIAN reads own records only; privateNotes on profile is ADMIN-only. SALES availability omits unrelated source IDs/references, team/workload/qualification internals and private leave/employment fields. Audit reasons must be operational, not clinical detail. Evidence references are opaque references to an authorized private document system, not public URLs/files fetched by this API.

Responses `{data:T}`, list `{data:T[],pagination:{page,pageSize,totalItems,totalPages}}`, error `{error:{code,message,details?:{field,message}[],requestId}}`. Defaults page1/pageSize20; maxpage100000, ordinary pageSize100, computed availability/workload/assignments/leave/conflicts/recommendation lists max20. UTC ISO instants require explicit offset; local weekly shifts require explicit IANA timezone. Generic detail queries are unused. All IDs are UUIDs; :id in technician routes is **User.id**, not profile.id or an invented tech string.

## Exact 39 routes

| Method/path | Access | Body/query → response |
|---|---|---|
| GET / | O | page,pageSize,q(name) → {id,name,isActive,technicianProfile}[]; TECH own only |
| GET /me | TECHNICIAN | → {user:{id,name,isActive,role},profile:Profile|null} |
| GET /:id | O | → own/admin user/profile |
| POST /:id/profile | A | ProfileCreate → Profile; existing User required |
| PATCH /:id/profile | A | ProfilePatch → Profile |
| GET /skills/catalog | O | page,pageSize → SkillCatalog[]; TECH active only |
| POST /skills/catalog | A | CatalogCreate → SkillCatalog |
| PATCH /skills/catalog/:id | A | CatalogPatch → SkillCatalog |
| GET /:id/skills | O | page,pageSize → TechnicianSkill[] with skill catalog |
| POST /:id/skills | O | SkillCommand → {skill,profileVersion}; creates/updates one user/skill row |
| PATCH /:id/skills/:skillId | O | SkillCommand without skillId → same result; skillId is catalog ID |
| GET /:id/certifications | O | page,pageSize → Certification[] |
| POST /:id/certifications | O | CertificateCommand → {certification,profileVersion} |
| PATCH /:id/certifications/:certificationId | A | CertificateReview → Certification |
| GET /teams | O | page,pageSize → Team[]; TECH current team only |
| POST /teams | A | {code,name,reason} → Team; no lead until membership exists |
| GET /teams/:id | A/current member | page,pageSize → {team,data:Membership[],pagination} |
| PATCH /teams/:id | A | TeamPatch → Team |
| GET /teams/:id/history | A/current member | page,pageSize → {team,data:Audit[],pagination} |
| POST /teams/:id/members | A | {version,reason,userId} → {team,member} |
| POST /teams/:id/members/:userId/remove | A | Command → Team |
| GET /:id/schedule | O | page,pageSize → Schedule[] with shifts, including archived history |
| PUT /:id/schedule | A | ScheduleCommand → {schedule,profileVersion} |
| GET /:id/exceptions | O | page,pageSize → CalendarException[] |
| POST /:id/exceptions | A | ExceptionCommand → {exception,profileVersion} |
| POST /:id/exceptions/:exceptionId/cancel | A | Command → CalendarException |
| GET /:id/availability | O,S | from,to,purpose?,surveyId? → Availability |
| GET /availability | O,S | page,pageSize,from,to,purpose?,surveyId? → Availability[] |
| POST /availability/check | O,S | {userIds,from,to,purpose?,surveyId?} → Availability[]; O scope checked for every ID |
| GET /assignments | O | page,pageSize,userId?,kind=SURVEY/INSTALLATION required → authoritative source references |
| GET /leaves | O | page,pageSize,userId? → Leave[] |
| POST /leaves | O | LeaveCreate → Leave REQUESTED |
| POST /leaves/:id/review | A | LeaveReview → Leave |
| POST /leaves/:id/cancel | O for that leave | Command → Leave |
| GET /summary | A | no query → live workforce counts/skill coverage |
| GET /workload | O | page,pageSize,userId? → Workload[] |
| GET /conflicts | A | page,pageSize,from,to,purpose?,surveyId? → conflict/warning rows |
| GET /recommendations | A | page,pageSize,from,to,purpose?,teamId?,surveyId? → {data,pagination,rankingScope,automaticAssignment:false} |
| GET /:id/history | O | page,pageSize → sanitized Audit[] |

An ADMIN without TECHNICIAN role has no own technician identity for /me; use explicit user ID. Team detail/history has nested `{data:{team,data,pagination}}` envelope. Creation POSTs return201 except existing-data review/cancel/check commands200; all PATCH/PUT200. POST skills may upsert a declared row and still returns201. No delete route. No endpoint writes M02/M05 assignments directly: authorized staff use the existing owning-module endpoints after checking recommendations.

## Interfaces and enums

```ts
type UUID=string;type ISO=string;type Json=null|string|number|boolean|Json[]|{[k:string]:Json};
type Employment='ACTIVE'|'INACTIVE'|'ENDED';
type Verification='DECLARED'|'VERIFIED'|'REJECTED';
type Purpose='SURVEY'|'PV_INSTALLATION'|'INVERTER'|'BATTERY'|'COMMISSIONING';
type LeaveStatus='REQUESTED'|'APPROVED'|'REJECTED'|'CANCELLED';
type AvailabilityStatus='AVAILABLE'|'PARTIALLY_AVAILABLE'|'BUSY'|'ON_LEAVE'|'OFF_SHIFT'|'INACTIVE'|'UNKNOWN'|'NEEDS_REVIEW';
interface Command{version:number;reason:string}
interface ProfileCreate{employeeCode:string;contactPhone:string|null;emergencyContact:{name:string;relationship:string;phone:string}|null;baseLocation:string|null;employmentStatus:Employment;joinedAt:ISO;experienceMonths:number;specializations:string[];maxActiveAssignments:number;minimumRestMinutes:number;enforceScheduling?:boolean;isActive?:boolean;privateNotes:string|null;reason:string}
type ProfilePatch=Command&Partial<Omit<ProfileCreate,'employeeCode'|'reason'>>;
interface Profile extends Omit<ProfileCreate,'reason'>{id:UUID;userId:UUID;version:number;createdAt:ISO;updatedAt:ISO;enforceScheduling:boolean;isActive:boolean}
interface CatalogCreate{code:string;name:string;description:string|null;mandatoryFor:Purpose[];minimumLevel:number;requiresCertification:boolean;reason:string}
type CatalogPatch=Command&Partial<Omit<CatalogCreate,'code'|'reason'>>&{isActive?:boolean};
interface SkillCatalog extends Omit<CatalogCreate,'reason'>{id:UUID;version:number;isActive:boolean}
interface SkillCommand extends Command{skillId:UUID;level:number;experienceMonths:number;verification:Verification;evidenceReference:string|null}
interface TechnicianSkill{id:UUID;userId:UUID;skillId:UUID;level:number;experienceMonths:number;verification:Verification;verifiedById:UUID|null;verifiedAt:ISO|null;evidenceReference:string|null;updatedAt:ISO;skill?:SkillCatalog}
interface CertificateCommand extends Command{skillId:UUID;provider:string;certificateNumber:string;issuedAt:ISO;expiresAt:ISO;evidenceReference:string;verification:Verification}
interface CertificateReview extends Command{verification:Verification}
interface Certification extends Omit<CertificateCommand,'reason'>{id:UUID;userId:UUID;verifiedById:UUID|null;verifiedAt:ISO|null}
interface Team{id:UUID;code:string;name:string;leadId:UUID|null;isActive:boolean;version:number;createdAt:ISO;updatedAt:ISO}
interface TeamPatch extends Command{name?:string;leadId?:UUID|null;isActive?:boolean}
interface Membership{id:UUID;teamId:UUID;userId:UUID;startedAt:ISO;endedAt:ISO|null;user?:{id:UUID;name:string;isActive:boolean}}
interface Shift{weekday:number;startMinute:number;endMinute:number;breakStartMinute:number|null;breakEndMinute:number|null}
interface ScheduleCommand extends Command{replaceScheduleId?:UUID;timezone:string;effectiveFrom:ISO;effectiveTo:ISO;shifts:Shift[]}
interface Schedule{id:UUID;userId:UUID;timezone:string;effectiveFrom:ISO;effectiveTo:ISO;isActive:boolean;createdAt:ISO;shifts:(Shift&{id:UUID;scheduleId:UUID})[]}
interface ExceptionCommand extends Command{startsAt:ISO;endsAt:ISO;kind:'HOLIDAY'|'NONWORKING'|'ADMIN_BLOCK'}
interface CalendarException extends Omit<ExceptionCommand,'version'>{id:UUID;userId:UUID;version:number;isActive:boolean}
interface LeaveCreate{userId:UUID;startsAt:ISO;endsAt:ISO;category:'PERSONAL'|'MEDICAL'|'EMERGENCY'|'UNAVAILABLE';privateNotes:string|null;reason:string}
interface LeaveReview extends Command{decision:'APPROVED'|'REJECTED';decisionNotes:string}
interface Leave extends Omit<LeaveCreate,'reason'>{id:UUID;status:LeaveStatus;reviewedById:UUID|null;reviewedAt:ISO|null;decisionNotes:string|null;version:number;createdAt:ISO}
interface Window{from:ISO;to:ISO;purpose?:Purpose;surveyId?:UUID}
interface Availability{userId:UUID;name:string;from:ISO;to:ISO;purposes:Purpose[];status:AvailabilityStatus;reasons:string[];managed:boolean;committable:boolean;coarseInstallationCommittable:boolean;shiftMinutes:number;availableShiftMinutes:number;plannedOccupiedShiftMinutes:number;freeIntervals:{from:ISO;to:ISO}[];conflicts:{kind:'SURVEY'|'INSTALLATION';id:UUID;reference:string;from:ISO;to:ISO}[];missingQualifications:{skillId:UUID;code:string;certificationRequired:boolean}[];activeAssignmentCount:number;untimedOrOverdueAssignmentCount:number;teamMembership:{teamId:UUID}|null;teamObligationPolicy:'INDIVIDUAL_SOURCE_ASSIGNMENTS_ONLY';installationWindowPolicy:'EXCLUSIVE_PLANNING_SPAN_NOT_WORKED_HOURS';utilizationPercent:null}
type SalesAvailability=Pick<Availability,'userId'|'name'|'from'|'to'|'status'|'reasons'|'managed'|'committable'|'freeIntervals'>;
interface Audit{id:UUID;actorId:UUID;subjectUserId:UUID|null;teamId:UUID|null;entityId:UUID;event:string;reason:string;details:Json;createdAt:ISO}
interface SurveyAssignment{id:UUID;reference:string;assignedToId:UUID;status:string;scheduledAt:ISO|null;scheduledEndAt:ISO|null;expectedDurationMinutes:number|null}
interface InstallationAssignment{id:UUID;userId:UUID;job:{id:UUID;reference:string;status:string;plannedStartAt:ISO;plannedEndAt:ISO;actualStartAt:ISO|null;actualEndAt:ISO|null}}
interface Workload{ id:UUID;name:string;activeSurveyAssignments:number;activeInstallationAssignments:number;approvedSurveysAsFinalAssignee:number;commissionedJobsAsFinalAssignee:number;plannedSurveyMinutes:number|null;actualWorkedHours:null;utilizationPercent:null;performanceScope:'ASSIGNMENT_COUNTS_NOT_LABOR_PRODUCTIVITY'}
interface ConflictRow{userId:UUID;conflicts:{left:{kind:string;id:UUID};right:{kind:string;id:UUID};reason:'OVERLAP_OR_REST'}[];unavailabilityConflicts:{work:{kind:string;id:UUID};block:{kind:'APPROVED_LEAVE'|'CALENDAR_BLOCK';id:UUID}}[];eligibilityWarnings:string[];dataComplete:boolean}
interface Recommendation{userId:UUID;name:string;eligible:boolean;availabilityStatus:AvailabilityStatus;reasons:string[];activeAssignmentCount:number;experienceMonths:number|null}
interface Summary{activeTechnicians:number;unprofiledTechnicians:number;managedTechnicians:number;activeTeams:number;scheduledSurveys:number;assignedInstallations:number;unassignedInstallations:number;upcomingApprovedLeaves:number;expiredVerifiedCertifications:number;skillCoverage:{skillId:UUID;verification:Verification;_count:{_all:number}}[];actualWorkedHours:null;utilizationPercent:null}
```

Version meanings: ProfilePatch and SkillCommand/CertificateCommand/ScheduleCommand/ExceptionCommand use current **profile.version**. CertificateReview uses certification.version; exception cancel uses exception.version. Team/member actions use team.version. Leave review/cancel use leave.version. Catalog patch uses catalog.version. Every changed entity/action is audited in one Serializable transaction. Profile versions returned after skill/certificate creation/schedule/exception writes let the UI issue the next command. Certificate review and exception cancellation have separate own versions and do not claim the submitted profile version. After uncertain responses, refresh the target and history before retrying; there is no idempotency-key API.

## Scheduling and eligibility rules

Availability windows positive and max7 days. Query uses explicit from/to ISO offsets; purpose defaults SURVEY. S must provide a surveyId visible through existing M02 lead scope and purpose SURVEY. A can query organization-wide; TECH self only. Batch max30 IDs, computed pages max20. No private leave notes/categories or unrelated project references are exposed to S.

Weekly shift weekday0=Sunday..6=Saturday; minute0=00:00,1440=end of day. Overnight shifts split across weekdays. Optional breaks are strict interior start/end pairs; no overlapping shifts. Effective schedule positive/max366 days and active schedules may not overlap. Replace an old header with replaceScheduleId to preserve archived history. Dates are UTC instants; local weekly boundaries are interpreted using the supplied IANA zone. DST gap/fold ambiguity, missing effective coverage, missing profile or untimed/overdue work produces UNKNOWN. Rest expands known commitments by the configured minutes; no rest/legal minimum is fabricated.

Known M02 appointments and M05 assignment/job windows are read directly. Untimed survey requests do not reserve an invented whole day; they create an uncertainty warning. Installation windows are conservative full planning-span holds for each individually assigned technician, including gaps/nights for conflict detection. They are not worked hours. Coarse installation staffing can accept positive partial shift coverage only with complete known calendar and no other blockers; surveys require full shift coverage. This does not implement per-technician on-site session/attendance enforcement.

Default profile enforceScheduling=false is explicit legacy adoption. Existing source endpoints still reject known cross-module overlap/rest/approved leave/blocks and inactive profiles. Managed=true additionally requires known calendar, current mandatory verified skills/certifications and count capacity. Unmanaged/missing-data workers are never positive committable recommendations. Configure actual catalog requirements for every requested purpose, verify qualifications, configure calendar and resolve old commitments before enabling enforcement. Mandatory catalog policy cannot change while any profile is managed; explicit administrative policy resolution is required. No automatic reassignment or role change occurs.

Qualification levels1..5, experienceMonths0..960. VERIFIED skill requires ADMIN and nonempty trusted evidence reference; own declarations cannot edit previously verified skills. Certification must have issue<=now and expiry>issue; verification alone does not override expiry. To qualify it must cover the full requested start/end period, with status VERIFIED and matching catalog skill. Expired/unverified/rejected never satisfies required certification. Recording a qualification is not legal electrical licensing.

One active team per technician. Lead must be an eligible active member. Clear lead before removing that membership; end all memberships and clear lead before deactivation. No team action changes M05 authorization or turns all teammates into assignees. Team history is retained. Profiles/User cannot deactivate while active work/team obligations remain.

Leave pending/approved ranges cannot overlap. Only ADMIN reviews; approved leave/blocks cannot overlap committed M02/M05 work. Resolve source assignments first. Approved leave cancels only before it starts; dates/private category/notes are never silently rewritten. Medical details are not required; choose a category and minimal private operational note.

Capacity is **active assignment count**, not staff-hours. Recommendations sort eligible, fewer active assignments, more actual experience, stable UUID **within the page**. No global optimum/travel prediction or automatic assignment is claimed. Report utilization/actual worked hours remains null; completed counts mean final assignment records, not productivity attribution. Reports read PostgreSQL only, with no mock charts or fabricated quantities.

## Examples and errors

Illustrative shapes use placeholders, not seeded users or qualifications.

```json
{"version":3,"reason":"Publish actual weekly calendar","timezone":"Asia/Kolkata","effectiveFrom":"2026-11-01T00:00:00+05:30","effectiveTo":"2026-12-01T00:00:00+05:30","shifts":[{"weekday":1,"startMinute":540,"endMinute":1020,"breakStartMinute":780,"breakEndMinute":840}]}
```

```json
{"data":{"schedule":{"id":"schedule UUID","userId":"existing User UUID","timezone":"Asia/Kolkata","effectiveFrom":"2026-10-31T18:30:00.000Z","effectiveTo":"2026-11-30T18:30:00.000Z","isActive":true,"createdAt":"recording timestamp","shifts":[{"id":"shift UUID","scheduleId":"schedule UUID","weekday":1,"startMinute":540,"endMinute":1020,"breakStartMinute":780,"breakEndMinute":840}]},"profileVersion":4}}
```

Availability query: `GET /api/technicians/:userId/availability?from=2026-11-02T09:00:00%2B05:30&to=2026-11-02T10:00:00%2B05:30&purpose=SURVEY`. An incomplete adoption response contains `{"data":{"userId":"User UUID","status":"UNKNOWN","managed":false,"committable":false,"reasons":["PROFILE_MISSING","CALENDAR_INCOMPLETE","QUALIFICATION_POLICY_MISSING"],"freeIntervals":[],"otherFields":"See Availability interface"}}`; do not show a green available badge based only on zero conflicts.

Leave request shape: `{userId,startsAt,endsAt,category:'PERSONAL',privateNotes:null,reason}`. Review shape: `{version,reason,decision:'APPROVED',decisionNotes}`. A conflict error is `{"error":{"code":"COMMITTED_ASSIGNMENT_CONFLICT","message":"Explicitly reschedule/reassign actual M02/M05 work before approving leave","requestId":"request UUID"}}`.

Relevant errors: WORKFORCE_SCOPE/SURVEY_CONTEXT_REQUIRED/WORKFORCE_ADMIN_REQUIRED/SKILL_VERIFICATION_ADMIN (403); TECHNICIAN_NOT_FOUND/PROFILE_REQUIRED (404); VALIDATION_ERROR/INVALID_WORKFORCE_WINDOW/SHIFT_OVERLAP/CERTIFICATION_DATES/INVALID_JOIN_DATE (422); VERSION_CONFLICT/CONCURRENT_UPDATE/DUPLICATE_VALUE/WORKFORCE_BUSY/WORKFORCE_UNAVAILABLE/WORKFORCE_ELIGIBILITY/QUALIFICATION_POLICY_LOCKED/LEAVE_OVERLAP/SCHEDULE_OVERLAP/COMMITTED_ASSIGNMENT_CONFLICT/TEAM_OBLIGATIONS/TECHNICIAN_OBLIGATIONS/WORKFORCE_CONSTRAINT (409). Existing M02/M05 DB guard failures may retain their module constraint409 code. No raw SQL/private file path is returned.

## Existing frontend and integration differences

Current frontend uses a standalone mock Technician identity, lowercase skills/statuses/roles, in-memory leave and assignment stores, static dates, fabricated hours/performance/service-task counts, weekly labels/photo URLs and team-wide allocation assumptions. Backend requires existing User IDs, uppercase enums, explicit calendar instants/timezones, verified policy/evidence, privacy scope and source-owned M02/M05 assignments. Missing metrics remain null. No frontend code is edited.

M02 scheduling/start and M05 job creation/assignment/window edits now use transaction-aware staffing hooks. Original approval/visit/installation/commissioning/evidence/RBAC/history ownership stays intact. Existing M02 availability retains its fields with additive workforceStatus; available is stricter, and windows>7 days need review. Existing clients receive genuine409 when new cross-module conflicts/eligibility rules apply; no new source write body fields are required. Migration is additive and NOT APPLIED. SQL constraints, calendar/DST/race/rollback/CSRF/API behavior remain runtime-unverified. No M07+ backend is included.
