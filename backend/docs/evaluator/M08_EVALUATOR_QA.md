# M08 evaluator questions and answers

These answers describe actual source/static review. They are not executed API or database claims.

1. **What does M08 own?** Post-commissioning tickets, service assignments/visits, observations, repairs, maintenance, operational SLA facts, feedback and closure history.
2. **What remains outside scope?** Stock fulfillment, warranty decisions, finance/billing, analytics backend, notification delivery, public customer portal and frontend edits.
3. **Why is the PR stacked?** M06 PR6 and M07 PR7 remain unmerged; M08 branches from latest M07 and targets that feature branch.
4. **Does it overwrite newer frontend work in main?** No. Main's finance/dashboard frontend commits remain separate and must be preserved when dependencies eventually integrate.
5. **Can an incomplete installation become a service ticket?** No. Actual M05 commissioned job and approved review are required; incomplete work remains an installation issue.
6. **Can a posted customer/site be fabricated?** Creation derives them from the commissioned source, with composite FK and SQL identity checks.
7. **How is equipment validated?** The target must be actually installed in that job; serialized equipment requires the exact original M04/M05 serial UUID.
8. **Can the original target be edited later?** No; another target needs another ticket, preserving commissioning/serial history.
9. **Are multiple complaints about the same equipment allowed?** Yes; unique command keys suppress retries, not legitimate independent complaints.
10. **Is a customer report treated as a diagnosis?** No. reportedIssue/description and technician observed symptoms/method/findings are separate records.
11. **How does triage work?** Authorized coordinator explicitly classifies category/priority, impact, owner, safety, troubleshooting, skill/check requirements and escalation.
12. **Does CRITICAL imply an automatic electrical instruction?** No; it flags safety, requires human review/physical checks and managed verified staffing, not hazardous instructions.
13. **Can a safety flag silently disappear?** No; triage/escalation preserves it, and escalation invalidates previous safety review.
14. **Can priority change during active work?** Yes via explicit escalation with reason/impact; original SLA targets remain.
15. **Is internal safety review a certification?** No; ADMIN records an internal attestation, not a license/grid authorization.
16. **Can status be patched arbitrarily?** No; named actions use one central ticket transition graph, expected version and history.
17. **What distinguishes resolution and closure?** Resolution records technical completion; closure needs customer acknowledgement and independent ADMIN review.
18. **How are holds handled?** Three explicit waiting/hold states preserve heldFrom, require no active visits and continue SLA clock.
19. **What prevents canceling away physical work?** Active visits, running repairs and pending parts must be explicitly disposed first; history remains.
20. **What happens on reopening?** ADMIN reason starts a new executionRevision; prior checks/evidence/feedback/reviews remain historical, original SLA/first response survive.
21. **Who is a service technician?** Existing active TECHNICIAN User; no separate login/profile master is created.
22. **Does a team automatically grant service access?** No; actual M08 assignment is authoritative. M06 team metadata does not expand scope or crews.
23. **How is assignment history preserved?** Old row ends with timestamp; new row records assigner/time. Active visits must be disposed before reassignment.
24. **Who acknowledges assignment?** The actual assigned TECHNICIAN, never SUPPORT impersonation.
25. **Is an untimed assignment confirmed availability?** No; M06 treats untimed service obligations as uncertainty/capacity, and timing is checked when scheduling.
26. **Which calendars are used?** Actual M06 effective schedules/shifts/leave/blocks and existing qualification policies, without a second calendar.
27. **What conflicts are detected?** M02 surveys, M05 installation spans, M08 visits, required rest, leave/blocks, capacity and overdue service work.
28. **What changes in M06?** SERVICE purpose, actual service source queries/counts/uncertainty, canonical configured-skill checks and future-commitment revalidation.
29. **Are managed service windows coarse installation holds?** No. Managed service requires the entire positive window confirmed, up to7days.
30. **What if qualifications/calendar policy is unknown?** Managed scheduling blocks; legacy planning needs explicit uncertainty acknowledgement and cannot be used for safety-related cases.
31. **Are unknown legacy windows labeled confirmed?** No; scheduling snapshot records confirmedAvailability=false and the human acknowledgement.
32. **Can workforce edits invalidate future service visits silently?** Existing M06 transactions revalidate future service commitments; SQL companion guards cover shared-source conflicts and active obligations.
33. **How are simultaneous bookings protected?** Serializable transactions, User locks, GiST active-visit exclusion and one-running-visit uniqueness complement application checks. Runtime races remain unverified.
34. **Are scheduled hours treated as actual labor?** No; arrival/departure are recorded server times and actual duration is derived only from them. Workload actualWorkedHours remains null.
35. **Can a denied-access visit be recorded?** Yes; attempted attendance records DENIED, no technical work and mandatory follow-up, without invented diagnosis.
36. **Can a started visit be rescheduled/cancelled?** No; record actual departure/outcome, then plan follow-up. Unstarted visits may reschedule/cancel with history.
37. **What happens if a visit overruns?** Existing observations/checkout can be recorded; new repair cannot start beyond booked end. A separately qualified follow-up is required.
38. **How are diagnosis revisions retained?** Immutable rows with same-visit/cycle supersedesId; old findings are never destructively overwritten.
39. **Are measurements fabricated or thresholded universally?** No; signed decimal values, units and optional requirement references are human-recorded, with uncertainty.
40. **How is manufacturer confirmation represented?** It is never inferred by M08; diagnosis findings do not claim external acceptance.
41. **When can a repair complete?** After recorded start, explicit observed outcome and evidence; follow-up remains a blocker until explicit rework is completed.
42. **How does rework preserve history?** ADMIN moves completed follow-up action to a current running visit through named rework, retaining before/after ticket audit.
43. **Can component replacement execute now?** No; M04 lacks service spare-part dispatch/replacement contract, so execution is explicitly blocked.
44. **What parts workflow exists?** Pending Decimal component requests, scoped warehouse visibility and explicit ADMIN cancellation with disposition only.
45. **Does canceling a part request mean it was consumed/returned?** No. No stock ledger, consumption, shipment, return or serial ownership is changed.
46. **How does warranty context work?** The actual actor calls M07's transaction-aware scoped coverage reader; creation/triage stores traceable context used.
47. **Does service assignment imply M07 case permission?** No; separate M07 scope remains. Missing permission is unavailable context, not no warranty.
48. **Can a service ticket link a warranty claim?** Yes at creation, with separate M07 case authority and exact project/item ownership; no automatic claim transition.
49. **Does active warranty guarantee free repair?** No. Coverage context/terms/limitations are advisory service context; provider/internal claim decisions remain M07.
50. **How are mandatory checks selected?** Explicit triage/maintenance configuration plus physical safety/function/cleanup defaults where applicable; battery checks are selected only if relevant.
51. **Can NOT_APPLICABLE waive a required check?** No; required checks need PASS. Optional checks may record justified nonapplicability.
52. **How are equal-timestamp check results ordered?** Immutable logical ticketVersion, not random ID or timestamp ties; latest feedback uses the same principle.
53. **What is required for resolution?** Actual first response, no unresolved active/follow-up/parts work, completed visit when required, latest follow-up clear, current evidence, safety review and all required PASS checks.
54. **Is customer acceptance fabricated?** No. Authorized staff records observed post-resolution response, source, actor, attestation and optional evidence/rating; there is no fake signature.
55. **Who closes a ticket?** ADMIN who has not recorded its technical resolution, after latest acknowledgement and four review checks; exact-version snapshot is immutable.
56. **Are SLA targets universal?** No; ADMIN configures immutable policy revisions, effective category/priority and explicit response/resolution minutes.
57. **What SLA clock is implemented?** Elapsed UTC from original opening, with no weekend/holiday/business-hours/pause adjustment. Holds/reopens do not reset it.
58. **Is triage automatically first response?** No. An explicit observed communication timestamp is recorded once; unconfigured SLA returns null, not compliance.
59. **How are preventive intervals chosen?** ADMIN sets explicit intervalDays/checklist, never guessed manufacturer requirements.
60. **How are duplicate maintenance tickets prevented?** Idempotent command plus one unfinished occurrence/plan and unique plan/due identity.
61. **When does the next maintenance interval begin?** Recorded actual occurrence completion plus configured UTC intervalDays, only after technical ticket resolution/closure.
62. **Can canceled maintenance be rescheduled?** Yes: cancel actual ticket, finalize canceled occurrence, then explicitly select a new due instant. Original occurrence remains.
63. **What does due maintenance/reminder query send?** Nothing. It returns actual due candidates; scheduler/email/SMS delivery is not implemented.
64. **How are files private?** Auth/CSRF/exact ticket ownership, safe bounded raw JPEG/PNG/PDF, opaque keys, SHA-256, protected integrity downloads and sandbox attachment headers.
65. **Do signatures scan malware?** No. Approved scanning/ACLs/retention/backups and reconciliation remain operational work.
66. **What happens after upload rollback?** Known rollback discards the creation receipt's own object; uncertain DB outcome retains it and logs reconciliation need.
67. **How does idempotency survive lost responses?** Actor-bound global unique key/hash freezes result; current authorization precedes replay, changed payload conflicts. Upload uses version/metadata inspection.
68. **What can SALES/WAREHOUSE/FINANCE read?** M01-scoped ticket summaries, explicitly granted pending-parts references, or closed outcome references respectively; no unrelated private case documents.
69. **What passed verification?** Prisma generation/validation, strict backend typecheck/build, offline SQL generation and source/Git checks; the configured root command also returned success, but full frontend project typecheck/build is not claimed.
70. **What is not runtime verified?** Custom SQL/PLpgSQL execution, scheduling races/deadlocks/rollback/timeouts, calendar/qualification boundaries, storage/permissions/CSRF and real API/frontend integration. No migrations/server/sample records/runtime tests ran.
