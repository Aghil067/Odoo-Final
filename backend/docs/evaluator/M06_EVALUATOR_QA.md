# M06 evaluator Q&A

1. **What is M06's purpose?** Central workforce profiles, qualifications, teams, calendars, leave, explainable availability, source assignment visibility and real workload reporting.
2. **Does M06 create new login identities?** No. It extends existing TECHNICIAN User identities through a one-to-one profile. Existing trusted provisioning scripts still create accounts.
3. **Can M06 change backend roles or passwords?** No API performs those actions or exposes password/session hashes.
4. **Was M05 merged before branching?** Yes, PR #5 merged at 03aa124; M06 branches from main and depends on M01–M05.
5. **Who owns survey assignments?** M02 SiteSurvey, including appointment/status/visit history. M06 checks eligibility without replacing that record.
6. **Who owns installation assignments?** M05 InstallationAssignment and InstallationJob. M06 reads and coordinates them; it does not replace authorization, execution or commissioning.
7. **Is there a competing workforce booking table?** No. Known interval conflicts are queried directly across authoritative M02/M05 records, under shared User locking and Serializable transactions.
8. **How are overlapping surveys prevented?** Existing M02 exclusions remain, plus the shared coordinator checks cross-module work, rest, leave and blocks before confirmed scheduling/start.
9. **How are overlapping installations prevented?** Every individual assignment holds its actual job planned interval against other nonterminal jobs and surveys.
10. **Does an installation planning span equal worked hours?** No. It is a conservative exclusive hold because M05 has no exact per-technician work sessions. Night/weekend span is not claimed as labor.
11. **What happens to untimed survey requests?** They create uncertainty, not an invented whole-day booking or duration. Managed decisions require resolving that uncertainty.
12. **What happens to overdue ongoing work?** It is reported as unknown/needs review rather than inventing an end time or assuming the worker is free.
13. **Which availability states exist?** AVAILABLE, PARTIALLY_AVAILABLE, BUSY, ON_LEAVE, OFF_SHIFT, INACTIVE, UNKNOWN and NEEDS_REVIEW, with reasons and evidence-backed intervals.
14. **When is partial availability returned?** Known free shift intervals cover only part of the requested window. It is not guessed from a status label.
15. **When does missing data become AVAILABLE?** It does not. Missing profile/calendar/purpose policy, DST ambiguity, untimed/overdue work or data limits prevent a positive committable result.
16. **Why default to monitor mode?** Legacy M02/M05 users have no M06 profile/calendar by default. Existing known-conflict safeguards apply, but full managed policy is explicitly configured/enabled rather than fabricated on migration.
17. **What does managed mode add?** Complete known calendar, verified required qualifications/certificate validity, count capacity and no unresolved timing/data uncertainty for new staffing.
18. **Can managed surveys cross shift breaks?** A survey requires full free shift coverage, so a window through a break/off-shift gap is not committable.
19. **Can multi-day installation planning include off-shift gaps?** Yes under the explicit coarse planning policy, with complete calendar knowledge and some working coverage but no other blockers. The entire planning span still blocks competing work. Actual attendance/session enforcement is not implemented.
20. **How are time zones handled?** Explicit IANA zones for local weekly calendars; UTC instants for boundaries, leave and source work. Machine timezone is not assumed.
21. **What happens at DST gaps/folds?** Local boundaries are round-tripped to UTC candidates. Missing/multiple matches are uncertain, not silently normalized. Runtime timezone-boundary verification remains required.
22. **Are overnight shifts allowed?** Represent them as separate weekday segments with explicit minute bounds. No ambiguous end-before-start arithmetic is accepted.
23. **How are public holidays managed?** ADMIN records explicit nonworking exceptions. No national holiday calendar or automatic local law is invented.
24. **How do rest periods work?** Configured minimumRestMinutes expands known commitment bounds. Shift breaks are separately excluded. No universal legal rest minimum is asserted.
25. **How are qualifications verified?** ADMIN records verification with trusted evidence references; own declarations remain DECLARED and cannot edit an existing verified skill.
26. **Can expired certification satisfy a requirement?** No. It must be VERIFIED and cover the entire requested start/end period, with the right skill ID.
27. **Does recording a skill grant electrical licensing?** No. M06 tracks internal evidence/eligibility policy and does not grant external regulatory authority.
28. **What if mandatory qualification policy is absent?** The purpose reports QUALIFICATION_POLICY_MISSING/NEEDS_REVIEW and cannot produce a managed eligible recommendation.
29. **Why lock catalog policy while profiles are managed?** To avoid silently invalidating current staffing through policy edits. ADMIN must explicitly coordinate resolution/disable/reconfigure/re-enable; upcoming work is revalidated.
30. **Can technicians join multiple active teams?** No. One active membership per technician is enforced through nonoverlapping membership periods; historical membership is retained.
31. **How is team lead eligibility checked?** The lead must be an active TECHNICIAN with active profile and current membership in that active team.
32. **Does removing a team member revoke installation access?** No. M05 authorization remains controlled by InstallationAssignment; team removal closes only membership history.
33. **Does a teammate's assignment reserve every team member?** No. Only explicit individual source assignments create obligations; membership is not invented team-wide work.
34. **Can team/profile deactivation silently cancel work?** No. Team deactivation requires closed members/lead; profile/User deactivation requires resolved active source/team obligations. No reassignment is automatic.
35. **What leave lifecycle is supported?** REQUESTED to APPROVED/REJECTED/CANCELLED; approved leave may cancel before it starts. History/date facts are retained.
36. **What if approved leave conflicts with committed work?** Approval is rejected; an authorized human must first reschedule/reassign actual M02/M05 work. Emergency blocks follow the same obligation rule.
37. **Are leave dates silently edited?** No. Requests are immutable date/category facts with controlled state/version transitions; overlapping pending/approved periods are rejected.
38. **Who can see private employment/medical details?** ADMIN and the technician's own permitted records. Profile private ADMIN notes are omitted for self reads; SALES gets redacted survey-scoped availability only.
39. **Do WAREHOUSE/FINANCE/SUPPORT have broad workforce access?** No M06 workflow justifies it in this version, so those roles are denied.
40. **How are simultaneous requests handled?** Existing Serializable transactions, shared User row locks, expected versions, source trigger checks and exclusion constraints reject conflicting supported writes. Some requests may roll back/deadlock and need deliberate refresh/retry.
41. **Has concurrency been proven by tests?** No. Schema generation/validation, compilation/build and SQL/source review are static; actual races, triggers, rollback and timeout behavior remain unverified.
42. **How are recommendations ranked?** Eligible first, then fewer active assignments, greater actual experience and stable UUID, deterministically within the selected page. They never auto-assign or claim routing optimization.
43. **How is utilization calculated?** It is not fabricated: utilizationPercent and actualWorkedHours remain null. Planned survey minutes use real scheduled bounds; installation spans are not labor hours.
44. **Do completed assignment counts measure individual performance?** They are labeled final-assignee proxies only, not labor productivity, attendance or service-task completion.
45. **What are the main limits and remaining work?** No actual session/attendance/travel optimizer, global recommendation ranking, HR file upload or automatic holiday feed; bounded query windows and transaction timeouts; staged legacy adoption; separate authorized DB/API/security/DST/concurrency verification before live use. No M07+ backend is implemented.
