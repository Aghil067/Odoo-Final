# Backend API contracts index

- [M01 frontend API contract](../integration/M01_FRONTEND_API_CONTRACT.md): `/api/auth`, customer/site/lead CRUD and CRM summary. Existing payload/enum/error conventions remain in force.
- [M02 frontend API contract](../integration/M02_FRONTEND_API_CONTRACT.md): `/api/surveys`, lifecycle, findings, availability, private evidence and versioned approval handoff.
- [M03 frontend API contract](../integration/M03_FRONTEND_API_CONTRACT.md): `/api/solar`, component/template catalog, versioned configurations, exact material BOM and independent review. Depends on M02 PR #2; future-tense M03 statements below record the original boundary.

Both modules use the existing database-backed HttpOnly cookie, exact trusted Origin, per-session CSRF header on unsafe methods, strict Zod validation, `{data:...}` success, top-level list pagination and `{error:{code,message,details?,requestId}}` failures. M02 adds PUT and a narrowly scoped binary upload exception; it does not broaden general CRM permissions. Binary attachment retrieval is the explicit non-JSON response.

M02 adds M01 conflict guards: SURVEY_SITE_LOCKED when changing a surveyed lead's site, ACTIVE_SURVEY_EXISTS when leaving SURVEY_REQUESTED with active surveys. M02 requires that state before request creation and derives identity/capacity from M01, rather than trusting posted customer data.

The future M03 consumer must fetch `/api/surveys/:id/approved`, retain `{surveyId,approvedVersion,reviewId}` and respect recommendation conditions/assumptions. It cannot infer approval from status text supplied by React or an old audit snapshot. No M03 endpoint, design/BOM calculation, token refresh endpoint or frontend adapter is introduced.

The existing frontend's eight lowercase roles/provisional auth interfaces still require explicit alignment with the six uppercase backend roles and real cookie/CSRF response envelopes. See `docs/M02_BACKEND_HANDOFF.md`; do not grant backend privileges by renaming roles in the UI.

M03 reuses `requireApprovedSurvey(tx,user,id)` inside its own write transaction; existing M02 GET `/approved` payload/authorization is unchanged. M03 state/cost/compatibility fields are server controlled, Decimal strings are required, and `/api/solar/configurations/:id/approved` exposes only a current eligible approved revision/BOM reference. No M04 stock operation or frontend rewrite is introduced.
