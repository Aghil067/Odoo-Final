# Backend database design index — M01 + M02

Canonical model: `backend/prisma/schema.prisma`. Canonical deployment history: `backend/prisma/migrations`. Use PostgreSQL; Prisma Client/CLI remain pinned together at 6.19.3. Existing migrations are preserved and must run in order after operator review; neither was applied by this work.

M01 owns User/Session, Customer, Site, Lead, LeadActivity and LeadStatusHistory. [M01 technical documentation](../modules/M01_CRM_TECHNICAL_DOCUMENTATION.md) describes these fields, contact normalization, decimal amounts, ownership and SERIALIZABLE transactions.

M02 adds SiteSurvey, RoofAssessment, ElectricalAssessment, SurveyAttachment, SurveyStatusHistory and SurveyReview. [M02 technical documentation](../modules/M02_SITE_SURVEY_TECHNICAL_DOCUMENTATION.md) contains the ER diagram, field rules and approval lifecycle. Each survey references existing customer/site/lead/user records; the composite Lead FK fixes lead/site/customer identity. There is no second User table or new Role value.

`20261031000200_m02_site_survey` adds one existing-Lead composite unique index and new M02 tables/enums/indexes only. Additional SQL enables btree_gist and supplies one-active-per-lead, one-running-visit, appointment-range exclusion, draft/terminal guards and append-only review/history/evidence metadata. M01's pg_trgm setup and additional CHECK constraints remain untouched. All new CRM/survey deletion relations are restrictive.

Every mutation carries optimistic version and commits audit/history atomically through existing serializable transactions. Approval snapshots preserve the reviewed content and selected master-data versions; reassessment uses a new linked row. File bytes live in a private adapter, not PostgreSQL; metadata includes a digest but excludes public storage URLs.

SQL triggers/exclusion constraints cannot be fully represented or validated by Prisma 6's schema DSL. Retain the custom SQL in later migration reviews; do not regenerate/replace migration history, run db push to discard it, reset a database or treat static validation as proof of execution. M03 has no tables here and must later reference an eligible approved survey/version/review through its guarded handoff.
