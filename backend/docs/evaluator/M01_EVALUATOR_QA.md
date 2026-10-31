# M01 evaluator questions and answers

These answers describe the code in this repository. Static checks are recorded separately; database/runtime behavior has not been tested in this session.

1. **What real business problem does M01 solve?** It turns customer enquiries into traceable sales leads, preserving contact information, multiple installation addresses, salesperson ownership, follow-up schedules and qualification history before a site survey is requested.

2. **Why separate Customer, Site and Lead?** A customer is a person/business, a site is one physical address, and a lead is one sales enquiry. One customer can have many sites and many enquiries without copying master contact information into every row. This is relational normalization.

3. **What is Prisma, and how is it different from a query builder?** Prisma uses a declarative schema to generate typed model APIs and supports schema migrations and relations. A query builder primarily helps compose SQL-shaped queries. Both ultimately use the database; neither eliminates the need to understand SQL, constraints, query plans or transaction isolation.

4. **Where is SQL in this project?** The initial migration contains CREATE TYPE, CREATE TABLE, CREATE INDEX, foreign-key and CHECK DDL. Prisma translates service queries into parameterized SQL at runtime. This project does not concatenate user strings into raw SQL.

5. **What is a primary key? Why UUIDs?** It uniquely identifies a row. UUIDs allow independent identifier generation without exposing sequential counts. They are not an authorization mechanism; record-scoped access still checks every ID.

6. **Why a separate customer reference?** `CUS-<uuid>` is a unique public reference, while the UUID primary key is used for relations. The lead uses `LED-<uuid>`. Neither is a count or sequential business number.

7. **What does a foreign key protect?** It prevents a child referencing a nonexistent parent. Lead.customerId references Customer; Lead also uses `(siteId,customerId)` to reference Site's composite unique key, so another customer's site cannot be attached even by direct SQL.

8. **Why validate site ownership in both service and database?** The service gives a meaningful 422 error, while the composite foreign key independently guarantees persistent integrity if another code path bypasses the HTTP validation.

9. **Why not make phone unique?** Families and businesses can share a contact number. `normalizePhone` stores a canonical E.164 number for matching, while `duplicateWarnings` warns without merging or rejecting distinct people. Warnings only expose records the caller can see.

10. **What does normalization mean here?** Database normalization separates customer/site/enquiry entities to reduce duplication and update anomalies. Phone normalization is a different concept: canonicalizing representations of the same number using country-aware metadata.

11. **How are money and capacity represented?** PostgreSQL numeric/Prisma Decimal: bill `(14,2)`, capacity `(10,3)`. JSON inputs/outputs use decimal strings to avoid binary floating-point rounding. Zero bill is valid; capacity must be positive. Currency conversion is outside M01.

12. **What are indexes and why these indexes?** They accelerate selected reads at a storage/write cost. This schema indexes ownership, normalized contact values, status, source, assignment, follow-up dates and timeline relations; `pg_trgm` GIN indexes support key contains/ILIKE searches. Tiny searches or unindexed fields can still scan; no runtime performance claim is made.

13. **Why a service layer?** Controllers parse HTTP input and format output; services enforce ownership, transitions, assignment, archive restrictions and transactions. These business rules are not scattered among route callbacks or trusted to the React UI.

14. **How are valid lead transitions enforced?** `transitions` in `leads.service.ts` explicitly lists allowed next states. NEW cannot jump straight to SURVEY_REQUESTED. QUALIFIED requires stored notes. Only ADMIN can reopen LOST/DISQUALIFIED to CONTACTED, with a reason.

15. **Is QUALIFIED a technically approved solar site?** No. It is sales qualification. SURVEY_REQUESTED indicates the next workflow request. M02 must later capture technical findings and approval independently; M01 has no Survey model.

16. **Why do status update and history insertion use one transaction?** They form one business operation. Committing only the lead would lose its audit trail; committing only history would describe a change that never happened. `changeStatus` commits both or rolls both back.

17. **What happens if two users update the same lead?** Both supply a version. Services check it and include it in the update predicate; successful writes increment it. SERIALIZABLE transactions abort incompatible concurrent operations. A stale version or serialization conflict is reported, never silently overwritten. The client must refresh before deciding whether to retry.

18. **Why SERIALIZABLE as well as a version?** The version protects a particular editable row. Serializable isolation also covers relationships/checks: for example, one request archiving a customer while another creates/reopens a lead. It can also give summary and list counts a consistent snapshot, at the cost of possible 409 conflicts under contention.

19. **How does login work?** A provisioned user supplies credentials; `verifyPassword` uses salted scrypt and timing-safe comparison. The server creates a random 256-bit token, stores only its SHA-256 hash in Session, and sends the raw token in an HttpOnly cookie. Each authenticated request verifies expiry, active state and current role.

20. **Why hash passwords rather than encrypt them?** Password verification should not require recovering the original password. A salted, resource-intensive scrypt derivation slows offline guessing. Each password has a random salt. A leaked database should not directly reveal credentials.

21. **Why hash session tokens with SHA-256 rather than scrypt?** Session tokens are generated with high entropy, unlike human passwords. A fast one-way digest is appropriate for looking up a random bearer credential while avoiding plaintext token storage.

22. **What is authentication versus authorization?** Authentication identifies the user from a valid session. Authorization decides whether that user's role and record ownership permit this action. Being logged in does not grant all customer data.

23. **How is horizontal access prevented?** `leadScope` and `customerScope` constrain every CRM service read/write and dashboard query. SALES sees own assigned leads or own unassigned leads; permitted customer/site access follows explicit creation/assignment policy. Inaccessible IDs return 404. ADMIN has full CRM scope.

24. **How do technician, support, warehouse and finance users access CRM?** They can authenticate but are denied direct CRM routes. Their later modules must define narrow workflow-specific access. M01 does not invent technician-job relations just to grant broad access.

25. **What protects cookie authentication from CSRF?** All writes require exact trusted Origin and JSON, including login. Authenticated writes also require a per-session CSRF token in a custom header. The token can be retrieved from login or `/me`; it is derived from the raw session token and checked timing-safely. SameSite cookies and restricted credentialed CORS add protection.

26. **What does logout do?** It deletes the current Session row and clears the cookie with matching options. The token no longer works. Other device sessions remain valid until revoked/expired. Absolute expiry is eight hours by default and configurable within 1–24 hours.

27. **How is the first admin safely created?** A trusted operator explicitly runs `bootstrap:admin` using temporary environment credentials. The script validates them, hashes the password and uses a serializable check/create transaction. It refuses if any admin already exists, and has no public bootstrap endpoint or default password. It was not executed during implementation.

28. **How can an admin assign a real salesperson if no user-registration endpoint exists?** The database operator provisions actual users with `user:create` after bootstrap. ADMIN uses `/crm/salespeople` to select an active SALES UUID. The assignment service verifies role and active status and saves an audit NOTE.

29. **Why archive rather than delete?** Customer-linked sites, enquiries and history are business records. Archival preserves references and blocks writes. It is refused while any active lead exists. Database restrictive foreign keys provide a further guard against accidental hard deletion. Archival is not privacy erasure.

30. **Why distinguish POST, GET and PATCH?** GET reads without business side effects. POST creates a resource or executes a domain command such as assignment/status change. PATCH changes only supplied editable fields and requires a version. There is no PUT replacement or CRM DELETE route.

31. **How is request validation done?** Strict Zod schemas bound strings, reject unknown keys, validate UUIDs/enums/country/phone/date/decimals and coordinates, and require current versions. Server-selected ownership, status, actors and timestamps cannot be supplied in generic PATCH bodies. Creation defaults are not applied to omitted PATCH fields.

32. **How does pagination work?** Lists default to page 1 and 20 records, cap at 100 and return data plus totalItems/totalPages. Ordering uses a timestamp and UUID tie-breaker. Detail pages preview only 20 related items and provide counts plus paginated endpoints; no fabricated timeline entries are added.

33. **How are dashboard numbers calculated?** PostgreSQL count/groupBy queries within the user's scope. Empty data returns zero/empty arrays. Upcoming means open leads due within seven rolling days; overdue means due before now. `qualifiedEver/totalLeads*100` derives qualification conversion from actual status history, counting each lead once.

34. **Does creating a FOLLOW_UP activity schedule a reminder?** No. An activity records an interaction. PATCH nextFollowUpAt changes the schedule and appends a real scheduling activity. There is no email/SMS reminder worker in M01.

35. **What error does the frontend get?** Consistent `{error:{code,message,details?,requestId}}` with meaningful status: 401 login, 403 access/CSRF, 404 missing/inaccessible, 409 conflict, 422 validation, 429 rate limit. Unexpected errors hide stacks/SQL and logs avoid credentials/PII.

36. **How are duplicate POST requests handled?** There is no idempotency-key implementation. A create request with an unknown network outcome must be reconciled through fetch/search before retrying; phone warnings are not deduplication. Versioned edits reject reused stale versions.

37. **What is guaranteed by static verification?** Schema validation proves Prisma accepts the model; client generation produces its typed API; TypeScript/build check compilation. They do not prove PostgreSQL migration execution, real authentication/cookies, runtime authorization or concurrency behavior. Those need explicitly approved runtime tests later.

38. **What remains before production?** Apply the reviewed migration, provision real users, configure HTTPS/origins/proxy, approve runtime/database security tests, share rate limits across instances, schedule expired-session cleanup, establish backup/PII retention and consider password recovery/MFA. No unverified behavior is claimed as tested.
