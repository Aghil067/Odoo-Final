BEGIN;
-- CreateEnum
CREATE TYPE "TechnicianEmploymentStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ENDED');

-- CreateEnum
CREATE TYPE "TechnicianVerification" AS ENUM ('DECLARED', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "WorkforcePurpose" AS ENUM ('SURVEY', 'PV_INSTALLATION', 'INVERTER', 'BATTERY', 'COMMISSIONING');

-- CreateEnum
CREATE TYPE "TechnicianLeaveStatus" AS ENUM ('REQUESTED', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "TechnicianProfile" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "employeeCode" VARCHAR(64) NOT NULL,
    "contactPhone" VARCHAR(40),
    "emergencyContact" JSONB,
    "baseLocation" VARCHAR(300),
    "employmentStatus" "TechnicianEmploymentStatus" NOT NULL DEFAULT 'ACTIVE',
    "joinedAt" TIMESTAMPTZ(3) NOT NULL,
    "experienceMonths" INTEGER NOT NULL DEFAULT 0,
    "specializations" TEXT[],
    "maxActiveAssignments" INTEGER NOT NULL,
    "minimumRestMinutes" INTEGER NOT NULL,
    "enforceScheduling" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "privateNotes" VARCHAR(2000),
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "TechnicianProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillCatalog" (
    "id" UUID NOT NULL,
    "code" VARCHAR(64) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "description" VARCHAR(2000),
    "mandatoryFor" "WorkforcePurpose"[],
    "minimumLevel" INTEGER NOT NULL DEFAULT 1,
    "requiresCertification" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "SkillCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TechnicianSkill" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "skillId" UUID NOT NULL,
    "level" INTEGER NOT NULL,
    "experienceMonths" INTEGER NOT NULL,
    "verification" "TechnicianVerification" NOT NULL DEFAULT 'DECLARED',
    "verifiedById" UUID,
    "verifiedAt" TIMESTAMPTZ(3),
    "evidenceReference" VARCHAR(500),
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "TechnicianSkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TechnicianCertification" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "skillId" UUID NOT NULL,
    "provider" VARCHAR(160) NOT NULL,
    "certificateNumber" VARCHAR(160) NOT NULL,
    "issuedAt" TIMESTAMPTZ(3) NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "evidenceReference" VARCHAR(500) NOT NULL,
    "verification" "TechnicianVerification" NOT NULL DEFAULT 'DECLARED',
    "verifiedById" UUID,
    "verifiedAt" TIMESTAMPTZ(3),
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "TechnicianCertification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TechnicianTeam" (
    "id" UUID NOT NULL,
    "code" VARCHAR(64) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "leadId" UUID,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "TechnicianTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TechnicianTeamMembership" (
    "id" UUID NOT NULL,
    "teamId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "startedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMPTZ(3),

    CONSTRAINT "TechnicianTeamMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TechnicianWorkSchedule" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "timezone" VARCHAR(100) NOT NULL,
    "effectiveFrom" TIMESTAMPTZ(3) NOT NULL,
    "effectiveTo" TIMESTAMPTZ(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TechnicianWorkSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TechnicianShift" (
    "id" UUID NOT NULL,
    "scheduleId" UUID NOT NULL,
    "weekday" INTEGER NOT NULL,
    "startMinute" INTEGER NOT NULL,
    "endMinute" INTEGER NOT NULL,
    "breakStartMinute" INTEGER,
    "breakEndMinute" INTEGER,

    CONSTRAINT "TechnicianShift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TechnicianCalendarException" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "startsAt" TIMESTAMPTZ(3) NOT NULL,
    "endsAt" TIMESTAMPTZ(3) NOT NULL,
    "kind" VARCHAR(30) NOT NULL,
    "reason" VARCHAR(500) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "TechnicianCalendarException_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TechnicianLeave" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "startsAt" TIMESTAMPTZ(3) NOT NULL,
    "endsAt" TIMESTAMPTZ(3) NOT NULL,
    "category" VARCHAR(30) NOT NULL,
    "privateNotes" VARCHAR(500),
    "status" "TechnicianLeaveStatus" NOT NULL DEFAULT 'REQUESTED',
    "reviewedById" UUID,
    "reviewedAt" TIMESTAMPTZ(3),
    "decisionNotes" VARCHAR(500),
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TechnicianLeave_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TechnicianWorkforceAudit" (
    "id" UUID NOT NULL,
    "actorId" UUID NOT NULL,
    "subjectUserId" UUID,
    "teamId" UUID,
    "entityId" UUID NOT NULL,
    "event" VARCHAR(60) NOT NULL,
    "reason" VARCHAR(2000) NOT NULL,
    "details" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TechnicianWorkforceAudit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TechnicianProfile_userId_key" ON "TechnicianProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TechnicianProfile_employeeCode_key" ON "TechnicianProfile"("employeeCode");

-- CreateIndex
CREATE UNIQUE INDEX "SkillCatalog_code_key" ON "SkillCatalog"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TechnicianSkill_userId_skillId_key" ON "TechnicianSkill"("userId", "skillId");

-- CreateIndex
CREATE INDEX "TechnicianCertification_userId_skillId_expiresAt_idx" ON "TechnicianCertification"("userId", "skillId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "TechnicianCertification_userId_provider_certificateNumber_key" ON "TechnicianCertification"("userId", "provider", "certificateNumber");

-- CreateIndex
CREATE UNIQUE INDEX "TechnicianTeam_code_key" ON "TechnicianTeam"("code");

-- CreateIndex
CREATE INDEX "TechnicianTeamMembership_teamId_endedAt_idx" ON "TechnicianTeamMembership"("teamId", "endedAt");

-- CreateIndex
CREATE INDEX "TechnicianTeamMembership_userId_endedAt_idx" ON "TechnicianTeamMembership"("userId", "endedAt");

-- CreateIndex
CREATE INDEX "TechnicianWorkSchedule_userId_effectiveFrom_effectiveTo_idx" ON "TechnicianWorkSchedule"("userId", "effectiveFrom", "effectiveTo");

-- CreateIndex
CREATE UNIQUE INDEX "TechnicianShift_scheduleId_weekday_startMinute_key" ON "TechnicianShift"("scheduleId", "weekday", "startMinute");

-- CreateIndex
CREATE INDEX "TechnicianCalendarException_userId_startsAt_endsAt_idx" ON "TechnicianCalendarException"("userId", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "TechnicianLeave_userId_startsAt_endsAt_status_idx" ON "TechnicianLeave"("userId", "startsAt", "endsAt", "status");

-- CreateIndex
CREATE INDEX "TechnicianWorkforceAudit_subjectUserId_createdAt_idx" ON "TechnicianWorkforceAudit"("subjectUserId", "createdAt");

-- CreateIndex
CREATE INDEX "TechnicianWorkforceAudit_teamId_createdAt_idx" ON "TechnicianWorkforceAudit"("teamId", "createdAt");

-- AddForeignKey
ALTER TABLE "TechnicianProfile" ADD CONSTRAINT "TechnicianProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechnicianSkill" ADD CONSTRAINT "TechnicianSkill_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechnicianSkill" ADD CONSTRAINT "TechnicianSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "SkillCatalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechnicianSkill" ADD CONSTRAINT "TechnicianSkill_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechnicianCertification" ADD CONSTRAINT "TechnicianCertification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechnicianCertification" ADD CONSTRAINT "TechnicianCertification_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "SkillCatalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechnicianCertification" ADD CONSTRAINT "TechnicianCertification_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechnicianTeam" ADD CONSTRAINT "TechnicianTeam_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechnicianTeamMembership" ADD CONSTRAINT "TechnicianTeamMembership_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "TechnicianTeam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechnicianTeamMembership" ADD CONSTRAINT "TechnicianTeamMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechnicianWorkSchedule" ADD CONSTRAINT "TechnicianWorkSchedule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechnicianShift" ADD CONSTRAINT "TechnicianShift_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "TechnicianWorkSchedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechnicianCalendarException" ADD CONSTRAINT "TechnicianCalendarException_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechnicianLeave" ADD CONSTRAINT "TechnicianLeave_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechnicianLeave" ADD CONSTRAINT "TechnicianLeave_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechnicianWorkforceAudit" ADD CONSTRAINT "TechnicianWorkforceAudit_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechnicianWorkforceAudit" ADD CONSTRAINT "TechnicianWorkforceAudit_subjectUserId_fkey" FOREIGN KEY ("subjectUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- M06 known-interval safeguards; M02/M05 remain authoritative assignment owners.
ALTER TABLE "TechnicianProfile" ADD CONSTRAINT "TechnicianProfile_values_check" CHECK ("version">0 AND "experienceMonths" BETWEEN 0 AND 960 AND "maxActiveAssignments" BETWEEN 1 AND 100 AND "minimumRestMinutes" BETWEEN 0 AND 1440 AND ("emergencyContact" IS NULL OR jsonb_typeof("emergencyContact")='object'));
ALTER TABLE "SkillCatalog" ADD CONSTRAINT "SkillCatalog_values_check" CHECK ("version">0 AND "minimumLevel" BETWEEN 1 AND 5);
ALTER TABLE "TechnicianSkill" ADD CONSTRAINT "TechnicianSkill_values_check" CHECK ("level" BETWEEN 1 AND 5 AND "experienceMonths" BETWEEN 0 AND 960 AND (("verification"='VERIFIED' AND "verifiedById" IS NOT NULL AND "verifiedAt" IS NOT NULL AND "evidenceReference" IS NOT NULL) OR ("verification"<>'VERIFIED' AND "verifiedById" IS NULL AND "verifiedAt" IS NULL)));
ALTER TABLE "TechnicianCertification" ADD CONSTRAINT "TechnicianCertification_values_check" CHECK ("version">0 AND "expiresAt">"issuedAt" AND (("verification"='VERIFIED' AND "verifiedById" IS NOT NULL AND "verifiedAt" IS NOT NULL) OR ("verification"<>'VERIFIED' AND "verifiedById" IS NULL AND "verifiedAt" IS NULL)));
ALTER TABLE "TechnicianTeam" ADD CONSTRAINT "TechnicianTeam_version_check" CHECK ("version">0);
ALTER TABLE "TechnicianTeamMembership" ADD CONSTRAINT "TechnicianTeamMembership_dates_check" CHECK ("endedAt" IS NULL OR "endedAt">="startedAt");
ALTER TABLE "TechnicianWorkSchedule" ADD CONSTRAINT "TechnicianWorkSchedule_dates_check" CHECK ("effectiveTo">"effectiveFrom");
ALTER TABLE "TechnicianShift" ADD CONSTRAINT "TechnicianShift_values_check" CHECK ("weekday" BETWEEN 0 AND 6 AND "startMinute">=0 AND "endMinute"<=1440 AND "startMinute"<"endMinute" AND (("breakStartMinute" IS NULL AND "breakEndMinute" IS NULL) OR ("breakStartMinute" IS NOT NULL AND "breakEndMinute" IS NOT NULL AND "startMinute"<"breakStartMinute" AND "breakStartMinute"<"breakEndMinute" AND "breakEndMinute"<"endMinute")));
ALTER TABLE "TechnicianCalendarException" ADD CONSTRAINT "TechnicianCalendarException_values_check" CHECK ("endsAt">"startsAt" AND "version">0 AND "kind" IN ('HOLIDAY','NONWORKING','ADMIN_BLOCK'));
ALTER TABLE "TechnicianLeave" ADD CONSTRAINT "TechnicianLeave_values_check" CHECK ("endsAt">"startsAt" AND "version">0 AND "category" IN ('PERSONAL','MEDICAL','EMERGENCY','UNAVAILABLE'));
-- btree_gist is already a prerequisite of the unchanged M02 migration.
ALTER TABLE "TechnicianTeamMembership" ADD CONSTRAINT "TechnicianTeamMembership_no_overlap" EXCLUDE USING gist ("userId" WITH =,tstzrange("startedAt","endedAt",'[)') WITH &&);
ALTER TABLE "TechnicianWorkSchedule" ADD CONSTRAINT "TechnicianWorkSchedule_no_overlap" EXCLUDE USING gist ("userId" WITH =,tstzrange("effectiveFrom","effectiveTo",'[)') WITH &&) WHERE ("isActive");
ALTER TABLE "TechnicianShift" ADD CONSTRAINT "TechnicianShift_no_overlap" EXCLUDE USING gist ("scheduleId" WITH =,"weekday" WITH =,int4range("startMinute","endMinute",'[)') WITH &&);
ALTER TABLE "TechnicianLeave" ADD CONSTRAINT "TechnicianLeave_no_overlap" EXCLUDE USING gist ("userId" WITH =,tstzrange("startsAt","endsAt",'[)') WITH &&) WHERE ("status" IN ('REQUESTED','APPROVED'));
ALTER TABLE "TechnicianCalendarException" ADD CONSTRAINT "TechnicianCalendarException_no_overlap" EXCLUDE USING gist ("userId" WITH =,tstzrange("startsAt","endsAt",'[)') WITH &&) WHERE ("isActive");
CREATE FUNCTION "m06_has_work"(technician_id uuid,starts_at timestamptz,ends_at timestamptz) RETURNS boolean LANGUAGE sql AS $$
 SELECT EXISTS(SELECT 1 FROM "SiteSurvey" WHERE "assignedToId"=technician_id AND "status" IN ('SCHEDULED','IN_PROGRESS') AND "scheduledAt"<ends_at AND "scheduledEndAt">starts_at)
 OR EXISTS(SELECT 1 FROM "InstallationAssignment" a JOIN "InstallationJob" j ON j."id"=a."jobId" WHERE a."userId"=technician_id AND j."status" NOT IN ('COMMISSIONED','CANCELED') AND j."plannedStartAt"<ends_at AND j."plannedEndAt">starts_at);
$$;
CREATE FUNCTION "m06_assert_interval"(technician_id uuid,starts_at timestamptz,ends_at timestamptz,exclude_survey uuid DEFAULT NULL,exclude_job uuid DEFAULT NULL) RETURNS void LANGUAGE plpgsql AS $$
DECLARE p "TechnicianProfile"%ROWTYPE; rest interval; assignments bigint;
BEGIN
 PERFORM 1 FROM "User" WHERE "id"=technician_id AND "role"='TECHNICIAN' AND "isActive" FOR UPDATE;
 IF NOT FOUND OR starts_at IS NULL OR ends_at IS NULL OR starts_at>=ends_at THEN RAISE EXCEPTION 'Active technician and explicit positive assignment window required' USING ERRCODE='23514'; END IF;
 SELECT * INTO p FROM "TechnicianProfile" WHERE "userId"=technician_id;
 IF FOUND AND (NOT p."isActive" OR p."employmentStatus"<>'ACTIVE') THEN RAISE EXCEPTION 'Technician profile is inactive' USING ERRCODE='23514'; END IF;
 rest:=make_interval(mins=>coalesce(p."minimumRestMinutes",0));
 IF EXISTS(SELECT 1 FROM "SiteSurvey" s WHERE s."assignedToId"=technician_id AND s."id" IS DISTINCT FROM exclude_survey AND s."status" IN ('SCHEDULED','IN_PROGRESS') AND s."scheduledAt"<ends_at+rest AND s."scheduledEndAt">starts_at-rest)
 OR EXISTS(SELECT 1 FROM "InstallationAssignment" a JOIN "InstallationJob" j ON j."id"=a."jobId" WHERE a."userId"=technician_id AND j."id" IS DISTINCT FROM exclude_job AND j."status" NOT IN ('COMMISSIONED','CANCELED') AND j."plannedStartAt"<ends_at+rest AND j."plannedEndAt">starts_at-rest)
 OR EXISTS(SELECT 1 FROM "TechnicianLeave" WHERE "userId"=technician_id AND "status"='APPROVED' AND "startsAt"<ends_at AND "endsAt">starts_at)
 OR EXISTS(SELECT 1 FROM "TechnicianCalendarException" WHERE "userId"=technician_id AND "isActive" AND "startsAt"<ends_at AND "endsAt">starts_at)
 THEN RAISE EXCEPTION 'Cross-module assignment/leave/rest conflict' USING ERRCODE='23514'; END IF;
 IF p."enforceScheduling" THEN
  SELECT (SELECT count(*) FROM "SiteSurvey" WHERE "assignedToId"=technician_id AND "id" IS DISTINCT FROM exclude_survey AND "status" IN ('REQUESTED','SCHEDULED','IN_PROGRESS','SUBMITTED','REVISION_REQUIRED'))+(SELECT count(*) FROM "InstallationAssignment" a JOIN "InstallationJob" j ON j."id"=a."jobId" WHERE a."userId"=technician_id AND j."id" IS DISTINCT FROM exclude_job AND j."status" NOT IN ('COMMISSIONED','CANCELED')) INTO assignments;
  IF assignments>=p."maxActiveAssignments" THEN RAISE EXCEPTION 'Managed technician capacity exceeded' USING ERRCODE='23514'; END IF;
 END IF;
END;
$$;
CREATE FUNCTION "m06_survey_schedule_guard"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW."assignedToId" IS NOT NULL THEN
  IF EXISTS(SELECT 1 FROM "TechnicianProfile" WHERE "userId"=NEW."assignedToId" AND (NOT "isActive" OR "employmentStatus"<>'ACTIVE')) THEN RAISE EXCEPTION 'Inactive workforce profile cannot receive survey assignments' USING ERRCODE='23514'; END IF;
  IF NEW."status" IN ('SCHEDULED','IN_PROGRESS') AND (TG_OP='INSERT' OR ROW(NEW."assignedToId",NEW."scheduledAt",NEW."scheduledEndAt",NEW."status") IS DISTINCT FROM ROW(OLD."assignedToId",OLD."scheduledAt",OLD."scheduledEndAt",OLD."status")) THEN PERFORM "m06_assert_interval"(NEW."assignedToId",NEW."scheduledAt",NEW."scheduledEndAt",NEW."id",NULL); END IF;
 END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER "SiteSurvey_workforce" BEFORE INSERT OR UPDATE ON "SiteSurvey" FOR EACH ROW EXECUTE FUNCTION "m06_survey_schedule_guard"();
CREATE FUNCTION "m06_installation_assignment_guard"() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE j "InstallationJob"%ROWTYPE;
BEGIN
 SELECT * INTO j FROM "InstallationJob" WHERE "id"=NEW."jobId";
 IF j."status" NOT IN ('COMMISSIONED','CANCELED') THEN PERFORM "m06_assert_interval"(NEW."userId",j."plannedStartAt",j."plannedEndAt",NULL,j."id"); END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER "InstallationAssignment_workforce" BEFORE INSERT OR UPDATE ON "InstallationAssignment" FOR EACH ROW EXECUTE FUNCTION "m06_installation_assignment_guard"();
CREATE FUNCTION "m06_installation_window_guard"() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE technician_id uuid;
BEGIN
 IF NEW."status" NOT IN ('COMMISSIONED','CANCELED') AND ROW(NEW."plannedStartAt",NEW."plannedEndAt") IS DISTINCT FROM ROW(OLD."plannedStartAt",OLD."plannedEndAt") THEN
  FOR technician_id IN SELECT "userId" FROM "InstallationAssignment" WHERE "jobId"=NEW."id" ORDER BY "userId" LOOP PERFORM "m06_assert_interval"(technician_id,NEW."plannedStartAt",NEW."plannedEndAt",NULL,NEW."id"); END LOOP;
 END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER "InstallationJob_workforce" BEFORE UPDATE ON "InstallationJob" FOR EACH ROW EXECUTE FUNCTION "m06_installation_window_guard"();
CREATE FUNCTION "m06_unavailability_guard"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Cancel workforce periods; do not delete history' USING ERRCODE='23514'; END IF;
 PERFORM 1 FROM "User" WHERE "id"=NEW."userId" AND "role"='TECHNICIAN' FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Existing technician identity required' USING ERRCODE='23514'; END IF;
 IF TG_OP='UPDATE' AND (NEW."id"<>OLD."id" OR NEW."userId"<>OLD."userId" OR NEW."version"<>OLD."version"+1 OR ROW(NEW."startsAt",NEW."endsAt") IS DISTINCT FROM ROW(OLD."startsAt",OLD."endsAt")) THEN RAISE EXCEPTION 'Immutable period identity or stale version' USING ERRCODE='23514'; END IF;
 IF TG_TABLE_NAME='TechnicianLeave' THEN
  IF TG_OP='INSERT' AND NEW."status"<>'REQUESTED' THEN RAISE EXCEPTION 'Request leave before review' USING ERRCODE='23514'; END IF;
  IF TG_OP='UPDATE' AND NOT ((OLD."status"='REQUESTED' AND NEW."status" IN ('APPROVED','REJECTED','CANCELLED')) OR (OLD."status"='APPROVED' AND NEW."status"='CANCELLED' AND OLD."startsAt">now())) THEN RAISE EXCEPTION 'Invalid leave transition' USING ERRCODE='23514'; END IF;
  IF NEW."status"='APPROVED' THEN
   IF NOT EXISTS(SELECT 1 FROM "User" WHERE "id"=NEW."reviewedById" AND "isActive" AND "role"='ADMIN') OR "m06_has_work"(NEW."userId",NEW."startsAt",NEW."endsAt") THEN RAISE EXCEPTION 'Leave requires active ADMIN and explicit resolution of committed assignments' USING ERRCODE='23514'; END IF;
  END IF;
 ELSE
  IF NEW."isActive" AND "m06_has_work"(NEW."userId",NEW."startsAt",NEW."endsAt") THEN RAISE EXCEPTION 'Blocking period conflicts with committed work' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER "TechnicianLeave_guard" BEFORE INSERT OR UPDATE OR DELETE ON "TechnicianLeave" FOR EACH ROW EXECUTE FUNCTION "m06_unavailability_guard"();
CREATE TRIGGER "TechnicianCalendarException_guard" BEFORE INSERT OR UPDATE OR DELETE ON "TechnicianCalendarException" FOR EACH ROW EXECUTE FUNCTION "m06_unavailability_guard"();
CREATE FUNCTION "m06_profile_guard"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Deactivate profiles; preserve workforce history' USING ERRCODE='23514'; END IF;
 PERFORM 1 FROM "User" WHERE "id"=NEW."userId" AND "role"='TECHNICIAN' FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Profile must extend an existing technician' USING ERRCODE='23514'; END IF;
 IF TG_OP='UPDATE' AND (NEW."id"<>OLD."id" OR NEW."userId"<>OLD."userId" OR NEW."employeeCode"<>OLD."employeeCode" OR NEW."version"<>OLD."version"+1) THEN RAISE EXCEPTION 'Immutable profile identity or stale version' USING ERRCODE='23514'; END IF;
 IF (NOT NEW."isActive" OR NEW."employmentStatus"<>'ACTIVE') AND (EXISTS(SELECT 1 FROM "SiteSurvey" WHERE "assignedToId"=NEW."userId" AND "status" IN ('REQUESTED','SCHEDULED','IN_PROGRESS','SUBMITTED','REVISION_REQUIRED')) OR EXISTS(SELECT 1 FROM "InstallationAssignment" a JOIN "InstallationJob" j ON j."id"=a."jobId" WHERE a."userId"=NEW."userId" AND j."status" NOT IN ('COMMISSIONED','CANCELED')) OR EXISTS(SELECT 1 FROM "TechnicianTeamMembership" WHERE "userId"=NEW."userId" AND "endedAt" IS NULL)) THEN RAISE EXCEPTION 'Resolve assignments/team membership before deactivation' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER "TechnicianProfile_guard" BEFORE INSERT OR UPDATE OR DELETE ON "TechnicianProfile" FOR EACH ROW EXECUTE FUNCTION "m06_profile_guard"();
CREATE FUNCTION "m06_team_guard"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Deactivate teams instead of deleting history' USING ERRCODE='23514'; END IF;
 IF NEW."id"<>OLD."id" OR NEW."code"<>OLD."code" OR NEW."version"<>OLD."version"+1 THEN RAISE EXCEPTION 'Immutable team identity or stale version' USING ERRCODE='23514'; END IF;
 IF NEW."leadId" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "TechnicianTeamMembership" m JOIN "User" u ON u."id"=m."userId" JOIN "TechnicianProfile" p ON p."userId"=u."id" WHERE m."teamId"=NEW."id" AND m."userId"=NEW."leadId" AND m."endedAt" IS NULL AND u."role"='TECHNICIAN' AND u."isActive" AND p."isActive" AND p."employmentStatus"='ACTIVE') THEN RAISE EXCEPTION 'Lead must be an active eligible team member' USING ERRCODE='23514'; END IF;
 IF NOT NEW."isActive" AND (NEW."leadId" IS NOT NULL OR EXISTS(SELECT 1 FROM "TechnicianTeamMembership" WHERE "teamId"=NEW."id" AND "endedAt" IS NULL)) THEN RAISE EXCEPTION 'Close team memberships/lead before deactivation; source assignments stay unchanged' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER "TechnicianTeam_guard" BEFORE UPDATE OR DELETE ON "TechnicianTeam" FOR EACH ROW EXECUTE FUNCTION "m06_team_guard"();
CREATE FUNCTION "m06_membership_guard"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Close memberships rather than delete them' USING ERRCODE='23514'; END IF;
 PERFORM 1 FROM "User" WHERE "id"=NEW."userId" AND "isActive" AND "role"='TECHNICIAN' FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Active technician required' USING ERRCODE='23514'; END IF;
 IF TG_OP='INSERT' AND NOT EXISTS(SELECT 1 FROM "TechnicianTeam" t JOIN "TechnicianProfile" p ON p."userId"=NEW."userId" WHERE t."id"=NEW."teamId" AND t."isActive" AND p."isActive" AND p."employmentStatus"='ACTIVE') THEN RAISE EXCEPTION 'Join an active team with an active profile' USING ERRCODE='23514'; END IF;
 IF TG_OP='UPDATE' AND (ROW(NEW."id",NEW."teamId",NEW."userId",NEW."startedAt") IS DISTINCT FROM ROW(OLD."id",OLD."teamId",OLD."userId",OLD."startedAt") OR OLD."endedAt" IS NOT NULL OR NEW."endedAt" IS NULL OR EXISTS(SELECT 1 FROM "TechnicianTeam" WHERE "id"=NEW."teamId" AND "leadId"=NEW."userId")) THEN RAISE EXCEPTION 'Only close current nonlead membership' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER "TechnicianTeamMembership_guard" BEFORE INSERT OR UPDATE OR DELETE ON "TechnicianTeamMembership" FOR EACH ROW EXECUTE FUNCTION "m06_membership_guard"();
CREATE FUNCTION "m06_no_delete"() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Workforce history cannot be deleted' USING ERRCODE='23514'; END; $$;
CREATE TRIGGER "TechnicianWorkforceAudit_immutable" BEFORE UPDATE OR DELETE ON "TechnicianWorkforceAudit" FOR EACH ROW EXECUTE FUNCTION "m06_no_delete"();
CREATE TRIGGER "TechnicianSkill_no_delete" BEFORE DELETE ON "TechnicianSkill" FOR EACH ROW EXECUTE FUNCTION "m06_no_delete"();
CREATE TRIGGER "TechnicianCertification_no_delete" BEFORE DELETE ON "TechnicianCertification" FOR EACH ROW EXECUTE FUNCTION "m06_no_delete"();
CREATE TRIGGER "SkillCatalog_no_delete" BEFORE DELETE ON "SkillCatalog" FOR EACH ROW EXECUTE FUNCTION "m06_no_delete"();
CREATE TRIGGER "TechnicianShift_immutable" BEFORE UPDATE OR DELETE ON "TechnicianShift" FOR EACH ROW EXECUTE FUNCTION "m06_no_delete"();
CREATE FUNCTION "m06_schedule_guard"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='DELETE' OR (to_jsonb(NEW)-'isActive') IS DISTINCT FROM (to_jsonb(OLD)-'isActive') OR NOT OLD."isActive" OR NEW."isActive" THEN RAISE EXCEPTION 'Archive schedules and create replacement records; never rewrite effective history' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER "TechnicianWorkSchedule_guard" BEFORE UPDATE OR DELETE ON "TechnicianWorkSchedule" FOR EACH ROW EXECUTE FUNCTION "m06_schedule_guard"();
CREATE FUNCTION "m06_user_guard"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF OLD."role"='TECHNICIAN' AND (NEW."role"<>OLD."role" OR NOT NEW."isActive") AND (EXISTS(SELECT 1 FROM "SiteSurvey" WHERE "assignedToId"=OLD."id" AND "status" IN ('REQUESTED','SCHEDULED','IN_PROGRESS','SUBMITTED','REVISION_REQUIRED')) OR EXISTS(SELECT 1 FROM "InstallationAssignment" a JOIN "InstallationJob" j ON j."id"=a."jobId" WHERE a."userId"=OLD."id" AND j."status" NOT IN ('COMMISSIONED','CANCELED')) OR EXISTS(SELECT 1 FROM "TechnicianTeamMembership" WHERE "userId"=OLD."id" AND "endedAt" IS NULL)) THEN RAISE EXCEPTION 'Resolve technician assignments/team membership before disabling or changing role' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER "User_workforce_obligations" BEFORE UPDATE OF "role","isActive" ON "User" FOR EACH ROW EXECUTE FUNCTION "m06_user_guard"();
CREATE FUNCTION "m06_qualification_guard"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM "User" WHERE "id"=NEW."userId" AND "role"='TECHNICIAN') THEN RAISE EXCEPTION 'Qualification must belong to technician identity' USING ERRCODE='23514'; END IF;
 IF NEW."verification"='VERIFIED' AND NOT EXISTS(SELECT 1 FROM "User" WHERE "id"=NEW."verifiedById" AND "role"='ADMIN' AND "isActive") THEN RAISE EXCEPTION 'Only active ADMIN verification satisfies workforce qualifications' USING ERRCODE='23514'; END IF;
 IF TG_OP='UPDATE' AND ROW(NEW."id",NEW."userId",NEW."skillId") IS DISTINCT FROM ROW(OLD."id",OLD."userId",OLD."skillId") THEN RAISE EXCEPTION 'Qualification identity is immutable' USING ERRCODE='23514'; END IF;
 IF TG_TABLE_NAME='TechnicianCertification' THEN
 IF TG_OP='UPDATE' AND (NEW."version"<>OLD."version"+1 OR (to_jsonb(NEW)-ARRAY['version','verification','verifiedById','verifiedAt']) IS DISTINCT FROM (to_jsonb(OLD)-ARRAY['version','verification','verifiedById','verifiedAt'])) THEN RAISE EXCEPTION 'Only versioned certification verification changes are allowed' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER "TechnicianSkill_guard" BEFORE INSERT OR UPDATE ON "TechnicianSkill" FOR EACH ROW EXECUTE FUNCTION "m06_qualification_guard"();
CREATE TRIGGER "TechnicianCertification_guard" BEFORE INSERT OR UPDATE ON "TechnicianCertification" FOR EACH ROW EXECUTE FUNCTION "m06_qualification_guard"();
CREATE FUNCTION "m06_catalog_guard"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='UPDATE' AND (NEW."id"<>OLD."id" OR NEW."code"<>OLD."code" OR NEW."version"<>OLD."version"+1) THEN RAISE EXCEPTION 'Immutable catalog code or stale version' USING ERRCODE='23514'; END IF;
 IF EXISTS(SELECT 1 FROM "TechnicianProfile" WHERE "enforceScheduling") AND (TG_OP='UPDATE' OR cardinality(NEW."mandatoryFor")>0) THEN RAISE EXCEPTION 'Resolve managed profile policy before changing mandatory catalog requirements' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER "SkillCatalog_guard" BEFORE INSERT OR UPDATE ON "SkillCatalog" FOR EACH ROW EXECUTE FUNCTION "m06_catalog_guard"();
COMMIT;
