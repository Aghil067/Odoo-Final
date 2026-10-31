# M07 evaluator questions and answers

These describe implemented source and static review, not executed database/API behavior.

1. **What does M07 own?** Explicit warranty policies, registrations, private evidence, investigated claims, immutable decisions and monitoring queries.
2. **What does it exclude?** Service jobs/repairs, finance/reimbursement, purchasing, replacement shipments, analytics and notification delivery.
3. **Why stack on M06?** PR6 remains unmerged; M07 retains its commits and targets its branch, avoiding a main PR that duplicates M06.
4. **Is the frontend changed?** No; the integration contract documents required deliberate adapters.
5. **Are new roles introduced?** No; existing session roles are reused.
6. **Who manages policies?** ADMIN; SUPPORT may read policies but cannot publish or backdate terms.
7. **Are panel durations universal?** No. Duration and start rule are explicit authorized policy terms, with no catalog-derived promise.
8. **Can product and performance coexist?** Yes, separate policies have separate coverage identities on the same installed serial.
9. **How is workmanship separate?** Installer/project/site registration, equipment/serial null, quantity1; it is not a component failure promise.
10. **How do policies target equipment?** Exactly one existing component or category; workmanship targets neither.
11. **Can old policy terms change?** Immutable version rows cannot be updated/deleted; new sequential revisions preserve original registrations.
12. **Can a policy change coverage/provider kind?** No; use a distinct policy reference for that kind.
13. **What does deactivation do?** Blocks new registration/activation, preserving existing historical coverage and claims.
14. **How is backdating controlled?** ADMIN must supply an explicit backdating reason for effectiveFrom before current UTC day.
15. **What proves installation identity?** M05's transaction-aware commissionedRecord helper validates commissioned job and immutable approved review.
16. **Does M07 impersonate an ADMIN for that handoff?** No; it applies its own explicit scope before calling the read-only helper.
17. **Can an unrelated serial be registered?** Exact installed M05 equipment/serial and original M04 identity must match.
18. **Does M07 modify dispatch or installation?** No business-record writes; M05 helper extraction preserves its existing HTTP authorization/payload.
19. **How are nonserialized quantities covered?** The whole actual installed line quantity, derived as Decimal; no partial split or fabricated serial.
20. **How are duplicates prevented?** Canonical policy/project/item coverageKey plus partial unique SQL index excludes only rejected/voided registrations.
21. **Does M04 dispatch prove delivery?** No; DELIVERY_DATE requires separate delivery proof, explicit proposed date and notes.
22. **Does M05 receipt automatically activate coverage?** No; site receipt and legal warranty start remain distinct.
23. **Does commissioning always start coverage?** Only a policy explicitly selecting COMMISSIONING_DATE uses that M05 timestamp.
24. **What happens with missing dates/documents?** Activation findings keep registration pending evidence with no invented verified start/expiry.
25. **How is manufacturer registration handled?** Required provider reference/date/confirmation and deadline checks; no simulated manufacturer submission.
26. **How does manual start verification work?** Proposed observed date, OTHER evidence and source notes plus independent approval.
27. **How is expiry calculated?** UTC civil calendar, start inclusive/expiry exclusive, month/year additions clamp to final valid day.
28. **What happens on leap anniversaries?** February29 plus one year becomes February28, explicitly documented for provider review.
29. **Is EXPIRED mutable persisted status?** No; derived from original dates and current UTC date.
30. **Who activates a registration?** Independent ADMIN, neither registrant nor previous nonreview contributor, approving exact pending version and five checks.
31. **Can active terms/dates be edited?** No; explicit void/re-registration preserves original decisions and claims. Additive evidence may advance version.
32. **Can uncertain claims be filed?** Yes; investigation permits missing failure dates or uncertain registration coverage without automatic approval.
33. **What inputs does assessment use?** Original policy/period, identity, reported failure, required evidence, provider registration, related claims and human review attestations.
34. **Are exclusions parsed into binding rules?** No; free-text exclusions/conditions require qualified human attestation.
35. **What are assessment results?** POTENTIALLY_ELIGIBLE, NOT_ELIGIBLE, NEEDS_EVIDENCE, NEEDS_MANUAL_REVIEW, with explicit findings and immutable rules snapshot.
36. **Does today's expiry deny an earlier failure?** No; observed failure date is checked against the original coverage interval.
37. **Are previous claims assigned invented limits?** No; they create review context and an attestation requirement.
38. **What prevents decisions on stale facts?** Content revision plus fingerprint over registration version, evidence digests, related claim versions and provider-response identities is recomputed.
39. **Who makes final decisions?** ADMIN distinct from claim submitter, with current assessment and all decision checks. SUPPORT reviewer may record advisory eligibility only.
40. **Is a provider response an internal approval?** No; immutable provider response and internal decision are separate records. External approval requires recorded provider approval.
41. **Does submit-provider actually send a message?** No; it records a prior authorized communication/reference and evidence, clearly labeled recorded-only.
42. **Can arbitrary status be patched?** No; central graph and explicit actions restrict transitions, with versioned append-only history.
43. **Can a closed case reopen?** CLOSED/CANCELLED are terminal. No silent reopening endpoint exists.
44. **What does resolve perform?** Records documented resolution of an approved claim; no repair, payment, inventory or workforce side effect.
45. **How is SUPPORT scoped?** Active ADMIN-issued per-installation grant; reviewer operations also require assigned responsibility or ADMIN.
46. **What do SALES/TECHNICIAN see?** Limited context through M01 project scope or actual M05 assignment; no private claim issue/files. M06 team/profile is not authorization.
47. **What can FINANCE/WAREHOUSE do?** FINANCE reads narrow approved outcomes only; WAREHOUSE uses M04 and has no M07 route access.
48. **How are files protected?** Auth/CSRF, exact owner checks, raw bounded safe JPEG/PNG/PDF, opaque keys, SHA-256 metadata, protected forced downloads with integrity checks.
49. **Does a signature check scan malware?** No; scanning, ACLs, retention, backups and orphan reconciliation remain operational requirements.
50. **What if upload transaction fails?** Known rollback discards only the just-created object; unknown commit outcome retains it and logs reconciliation need.
51. **How are retries handled?** Actor-bound global command key/hash, authorization before replay and frozen result; changed payload conflicts. Uploads use owner versions and metadata inspection.
52. **What lock order is used?** Registration before claim; Serializable transactions, conditional versions, uniqueness and immutable decisions complement it. Runtime races are not proven statically.
53. **What does expiry monitoring send?** Nothing; actual database candidate/count queries report notificationDelivery NOT_IMPLEMENTED.
54. **What does future M08 receive?** Read-only customer/site/project/review/item/original-serial context, policy descriptions/periods, limited claim history and limitations. It creates no ticket.
55. **What checks passed?** Prisma generation/validation, strict TypeScript typecheck, production backend build, offline schema diff and source/SQL/Git scope review.
56. **Was migration applied or runtime tested?** No. PostgreSQL trigger execution, calendar SQL parity, concurrency, storage, authorization/CSRF and real frontend/API integration remain unverified.
57. **What are practical bounds?** Fifty files/exact owner,100 claims/registration,100 assessments/claim,50 provider responses and5000 eligibility candidates, with explicit limit handling.
58. **Is the system ready to merge automatically?** No. Draft PR retains owner approval; M06 dependency and authorized runtime verification must be reviewed.
