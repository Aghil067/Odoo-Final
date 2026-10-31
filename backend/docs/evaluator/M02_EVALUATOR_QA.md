# M02 evaluator questions and answers

These answers refer to the actual backend code and migration. Schema generation/validation and compilation are static evidence, not a claim that runtime/database behavior has been tested.

1. **What does a site survey achieve?** It records site-specific roof/electrical observations, supporting evidence and preliminary suitability before final system configuration. It is the technical assessment after M01 sales qualification, not installation or government approval.

2. **Why is a QUALIFIED lead insufficient to create a survey?** M01 explicitly has a SURVEY_REQUESTED state. `createSurvey` requires that state, an active customer and the exact existing installation site, making the handoff intentional rather than treating commercial qualification as technical approval.

3. **How do you prevent surveying a different customer's site?** The service checks the scoped lead and matching site ID. The database independently references Lead using `(leadId,siteId,customerId)` and Site using `(siteId,customerId)` with restrictive FKs. The customer identity is derived server-side.

4. **Why six new tables instead of a large JSON-only survey?** SiteSurvey holds workflow, RoofAssessment/ElectricalAssessment hold typed one-to-one findings, SurveyAttachment stores evidence metadata, SurveyStatusHistory stores audit events, and SurveyReview preserves decisions/snapshots. Typed relational fields support validation/constraints and queries; JSON is used deliberately for immutable review snapshots and structured event details.

5. **What are primary and foreign keys doing here?** UUID primary keys uniquely identify rows; FKs guarantee related User, Lead, Site, Customer and survey records exist. Composite FKs enforce shared ownership, not just existence. Restrictive delete behavior preserves business history.

6. **Why Prisma rather than just handwritten SQL or a query builder?** Prisma generates typed model APIs and ordinary migrations from the schema. SQL still matters for integrity and concurrency. The custom migration uses PostgreSQL exclusion indexes/triggers that Prisma's schema DSL cannot express; a query builder alone would not provide those invariants either.

7. **How are surveyors authorized without a SURVEYOR role?** ADMIN assigns an existing active TECHNICIAN user to a survey. That technician may access only assigned survey data and field operations. ADMIN coordinates/reviews and SALES requests scoped surveys. No frontend role renaming grants backend privileges and no new User table is created.

8. **Can a technician read every CRM customer now?** No. General M01 CRM routes remain ADMIN/SALES only. M02 returns only visit-needed customer contact/address data for assigned surveys and does not expose unrestricted leads, customer emails/CRM notes or credentials.

9. **Can an administrator alter the technician's assessment and approve it?** These APIs deny ADMIN field editing/submission; field work is assigned TECHNICIAN-only. ADMIN reviews submitted findings. The SQL review guard also requires an independent active ADMIN and rejects the assignee as reviewer.

10. **How are transitions controlled?** `surveyTransitions` lists valid next states. Dedicated scheduling/start/submit/review/cancel endpoints enforce command-specific roles and requirements. SQL repeats the state graph. There is no generic status PATCH that can skip the workflow.

11. **What happens when changes are requested?** REVISION_REQUIRED unlocks findings for the assigned technician. They may correct and resubmit or ADMIN may schedule a revisit. The earlier reviewer decision/snapshot remains immutable, so the revision does not erase what was reviewed previously.

12. **How do reassessments preserve approved records?** APPROVED/REJECTED/CANCELED are terminal and immutable. ADMIN creates a new SiteSurvey referencing the latest terminal previousSurveyId and next assessmentNumber. Unique predecessor/sequence constraints prevent branching. The original roof/electrical findings, evidence and reviews stay intact.

13. **How is appointment overlap checked?** The service checks start<otherEnd and end>otherStart. PostgreSQL independently excludes equal surveyor IDs with intersecting timestamptz ranges for SCHEDULED/IN_PROGRESS using btree_gist and GiST. Application-only read-then-book checks would be unsafe under concurrency.

14. **Why half-open time ranges?** `[start,end)` includes the start and excludes the end, so a 10:00–11:00 visit and 11:00–12:00 visit do not overlap. All inputs include timezone and are converted to UTC instants.

15. **What if a visit overruns its planned end?** It remains IN_PROGRESS. Another visit cannot start while any visit for that technician is ongoing; a partial unique index independently enforces one running visit. Availability is conservative while an ongoing visit exists. There is no automatic extension/travel optimizer.

16. **What does availability actually mean?** It reports confirmed planned conflicts, actual ongoing visits and active assigned workload in a bounded interval. It does not assert shift/leave/travel availability or reserve the slot. Schedule creation repeats checks and uses SQL constraints.

17. **How do concurrent edits avoid lost updates?** Every mutation supplies the current version. `requireSurvey` checks it and `saveSurvey` conditionally updates exactly one matching row, increments version and appends history in the same SERIALIZABLE transaction. Conflicts return 409; clients must re-read and decide.

18. **What is atomic about review?** The review row with snapshot/checklist/notes and the survey's decision transition commit together. Failed state/version/constraint checks roll the complete operation back. No approved row is committed without its linked review decision through this service.

19. **Why does approvedVersion differ from survey.version?** A submitted content version N is reviewed. The decision itself increments the mutable row to N+1, while approvedVersion and Review.surveyVersion remain N, identifying exactly the content approved. M03 should persist surveyId+approvedVersion+reviewId, not guess from a current counter.

20. **What roof measurements are stored and how are they validated?** Decimal usable/mounting area, azimuth, tilt, construction, shading, obstructions, accessibility and visible condition, plus concerns/notes. Mounting area cannot exceed usable area; azimuth is 0–<360° clockwise from north and tilt 0–90°. Range checks are sanity bounds, not engineering certification.

21. **Can a form certify structural safety?** No. The surveyor records visual observations and specialistVerificationRequired. If unresolved, approval must be conditional with explicit additional work and acknowledgement. The system neither calculates load-bearing capacity nor claims specialist work is complete.

22. **How is estimated solar capacity calculated?** It is not calculated by a universal formula here. Requested capacity is snapshotted from M01; recommended capacity is a surveyor-entered decimal recommendation under documented assumptions. M03 owns final design/component selection/BOM.

23. **What does the electrical assessment prove?** It records observed grid connection/phase/meter/panel/earthing/cable route/inverter/battery/safety information. Unknown fields are explicit where allowed. It does not certify electrical tests, DISCOM/net-metering authorization or commissioning.

24. **Which evidence is required?** A roof photograph always; meter photograph if the grid is CONNECTED; panel photograph if panelPresent. Roof/electrical findings and preliminary feasibility must also be complete before submission. Approval additionally checks suitability and the review checklist.

25. **Can an infeasible or incomplete survey be approved?** No. `checkApprovable` re-runs completeness, rejects NOT_SUITABLE and requires five main checklist acknowledgements. Structural/electrical flags, HIGH shade and other unresolved concerns force conditional suitability, work description and conditional acknowledgement.

26. **Why raw binary uploads rather than base64 in JSON?** Raw requests avoid base64 size overhead and let a route-specific parser enforce a bounded file payload after authentication/ownership checks. JSON remains capped at 32 KiB. Multipart and arbitrary archives/documents are intentionally not accepted.

27. **How are files validated?** The service checks safe filename, extension, declared MIME, JPEG/PNG/PDF signature, category, maximum bytes and per-survey count. Photo categories disallow PDFs. These checks do not replace malware scanning/full semantic validation, which is a production requirement noted explicitly.

28. **Where are files stored?** Private configurable local storage outside the frontend repository by default, using generated UUID keys, mode-0700 directories and mode-0600 exclusive files. PostgreSQL stores only metadata/digest. Windows also requires correct ACLs; production needs a durable protected volume and coordinated backups.

29. **How is retrieval protected?** The API authenticates the session, applies survey scope, checks the attachment belongs to that survey, validates private key containment/non-symlink file access and verifies length/digest. It returns a forced attachment with sandbox/no-sniff headers, not an anonymous filesystem URL.

30. **Are files and database metadata one transaction?** No; local filesystem and PostgreSQL cannot share that atomic boundary. Files are written privately first, metadata/history/version commit atomically, known rollbacks discard only the newly created file, and unknown commit outcomes retain it for reconciliation. Process crashes/partial writes can leave orphans, so retention/reconciliation and quotas are documented operational work.

31. **Why are CSRF and Origin checks still needed?** Browsers automatically attach session cookies. All unsafe requests, including binary uploads and PUT, require trusted Origin and the per-session CSRF token; credentialed CORS is restricted. A valid file or UUID alone never proves permission.

32. **How does M03 avoid mistaking old approval for current approval?** It must use `GET /surveys/:id/approved`, which checks APPROVED, matching persisted review/version, no successor, active customer and eligible lead. Historical snapshots remain audit records; they do not approve a pending/rejected reassessment.

33. **How are dashboards generated?** Scoped PostgreSQL groupBy/count queries in one snapshot. Empty results produce zeros/empty arrays. Counts include historical survey assessment records, so a prior approved survey remains historical even when superseded.

34. **Why block M01 site changes after surveys exist?** Otherwise an old survey could appear to concern a different location. The service gives a clear conflict and the composite FK uses ON UPDATE RESTRICT. A new physical site needs a separate lead. M01 customer/site descriptions remain editable, while decision snapshots preserve the actual reviewed details/versions.

35. **What database features are not visible in Prisma schema validation?** Custom CHECKs, partial unique/exclusion indexes and PL/pgSQL triggers live in the migration SQL. Prisma validation accepts model structure but does not execute that SQL or verify extension permissions; a live PostgreSQL migration/concurrency check remains pending approval.

36. **What was actually verified?** Client generation, schema validation, strict TypeScript compilation and production build, with source/migration review. No server, database migrations, runtime tests, browser, fake data or uploads were executed. No M03 code was implemented.
