-- Additive M02 migration, generated offline from the existing M01 Prisma schema.
-- Review before applying. No existing data is changed. PostgreSQL 15+ recommended.
BEGIN;
CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA public;

-- CreateEnum
CREATE TYPE "SurveyStatus" AS ENUM ('REQUESTED', 'SCHEDULED', 'IN_PROGRESS', 'SUBMITTED', 'REVISION_REQUIRED', 'APPROVED', 'REJECTED', 'CANCELED');

-- CreateEnum
CREATE TYPE "SurveyVisitStatus" AS ENUM ('NOT_SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELED');

-- CreateEnum
CREATE TYPE "SurveyEvent" AS ENUM ('REQUESTED', 'ASSIGNED', 'SCHEDULED', 'RESCHEDULED', 'STARTED', 'UPDATED', 'ROOF_UPDATED', 'ELECTRICAL_UPDATED', 'ATTACHMENT_ADDED', 'SUBMITTED', 'REVIEWED', 'CANCELED');

-- CreateEnum
CREATE TYPE "RoofType" AS ENUM ('RCC', 'METAL', 'TILE', 'OTHER');

-- CreateEnum
CREATE TYPE "ShadingLevel" AS ENUM ('NONE', 'LOW', 'MODERATE', 'HIGH');

-- CreateEnum
CREATE TYPE "RoofAccessibility" AS ENUM ('ACCESSIBLE', 'RESTRICTED', 'UNSAFE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "RoofCondition" AS ENUM ('GOOD', 'FAIR', 'POOR', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "GridConnection" AS ENUM ('CONNECTED', 'NOT_CONNECTED', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "SupplyPhase" AS ENUM ('SINGLE_PHASE', 'THREE_PHASE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "SiteSuitability" AS ENUM ('UNASSESSED', 'SUITABLE', 'CONDITIONALLY_SUITABLE', 'NOT_SUITABLE');

-- CreateEnum
CREATE TYPE "SurveyAttachmentCategory" AS ENUM ('ROOF_PHOTO', 'METER_PHOTO', 'PANEL_PHOTO', 'SITE_LAYOUT', 'SUPPORTING_FILE');

-- CreateEnum
CREATE TYPE "SurveyReviewDecision" AS ENUM ('APPROVED', 'REVISION_REQUIRED', 'REJECTED');

-- CreateTable
CREATE TABLE "SiteSurvey" (
    "id" UUID NOT NULL,
    "reference" VARCHAR(40) NOT NULL,
    "leadId" UUID NOT NULL,
    "siteId" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "assessmentNumber" INTEGER NOT NULL DEFAULT 1,
    "previousSurveyId" UUID,
    "requestedById" UUID NOT NULL,
    "assignedToId" UUID,
    "status" "SurveyStatus" NOT NULL DEFAULT 'REQUESTED',
    "visitStatus" "SurveyVisitStatus" NOT NULL DEFAULT 'NOT_SCHEDULED',
    "requestNotes" VARCHAR(2000) NOT NULL,
    "assignmentNotes" VARCHAR(2000),
    "scheduledAt" TIMESTAMPTZ(3),
    "scheduledEndAt" TIMESTAMPTZ(3),
    "expectedDurationMinutes" INTEGER,
    "startedAt" TIMESTAMPTZ(3),
    "submittedAt" TIMESTAMPTZ(3),
    "requestedCapacityKw" DECIMAL(10,3),
    "recommendedCapacityKw" DECIMAL(10,3),
    "recommendedSystemType" "SystemType" NOT NULL DEFAULT 'UNDECIDED',
    "suitability" "SiteSuitability" NOT NULL DEFAULT 'UNASSESSED',
    "infeasibilityReason" VARCHAR(2000),
    "additionalWorkRequired" VARCHAR(5000),
    "technicalAssumptions" VARCHAR(5000),
    "feasibilityNotes" VARCHAR(5000),
    "approvedVersion" INTEGER,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "SiteSurvey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoofAssessment" (
    "id" UUID NOT NULL,
    "surveyId" UUID NOT NULL,
    "roofType" "RoofType" NOT NULL,
    "roofTypeDetails" VARCHAR(2000),
    "usableAreaSqm" DECIMAL(12,3) NOT NULL,
    "azimuthDegrees" DECIMAL(6,3) NOT NULL,
    "tiltDegrees" DECIMAL(5,3) NOT NULL,
    "shadingLevel" "ShadingLevel" NOT NULL,
    "shadingObservations" VARCHAR(5000) NOT NULL,
    "nearbyObstructions" VARCHAR(5000) NOT NULL,
    "mountingSpaceSqm" DECIMAL(12,3) NOT NULL,
    "accessibility" "RoofAccessibility" NOT NULL,
    "accessibilityNotes" VARCHAR(2000) NOT NULL,
    "visibleCondition" "RoofCondition" NOT NULL,
    "conditionNotes" VARCHAR(5000) NOT NULL,
    "mountingConcerns" VARCHAR(5000) NOT NULL,
    "structuralNotes" VARCHAR(5000) NOT NULL,
    "specialistVerificationRequired" BOOLEAN NOT NULL,
    "recommendations" VARCHAR(5000) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "RoofAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ElectricalAssessment" (
    "id" UUID NOT NULL,
    "surveyId" UUID NOT NULL,
    "gridConnection" "GridConnection" NOT NULL,
    "supplyPhase" "SupplyPhase" NOT NULL,
    "meterDetails" VARCHAR(2000),
    "panelPresent" BOOLEAN NOT NULL,
    "panelObservations" VARCHAR(5000) NOT NULL,
    "approximateCableRunMeters" DECIMAL(10,3),
    "earthingObservations" VARCHAR(5000) NOT NULL,
    "inverterPlacementOptions" VARCHAR(5000) NOT NULL,
    "batteryPlacementConsiderations" VARCHAR(5000),
    "safetyConcerns" VARCHAR(5000) NOT NULL,
    "safetyVerificationRequired" BOOLEAN NOT NULL,
    "gridSuitabilityObservations" VARCHAR(5000) NOT NULL,
    "additionalNotes" VARCHAR(5000) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ElectricalAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SurveyAttachment" (
    "id" UUID NOT NULL,
    "surveyId" UUID NOT NULL,
    "uploaderId" UUID NOT NULL,
    "category" "SurveyAttachmentCategory" NOT NULL,
    "fileName" VARCHAR(100) NOT NULL,
    "mimeType" VARCHAR(50) NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "sha256" CHAR(64) NOT NULL,
    "storageKey" VARCHAR(80) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SurveyAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SurveyStatusHistory" (
    "id" UUID NOT NULL,
    "surveyId" UUID NOT NULL,
    "actorId" UUID NOT NULL,
    "event" "SurveyEvent" NOT NULL,
    "fromStatus" "SurveyStatus",
    "toStatus" "SurveyStatus" NOT NULL,
    "surveyVersion" INTEGER NOT NULL,
    "reason" VARCHAR(2000) NOT NULL,
    "details" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SurveyStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SurveyReview" (
    "id" UUID NOT NULL,
    "surveyId" UUID NOT NULL,
    "reviewerId" UUID NOT NULL,
    "decision" "SurveyReviewDecision" NOT NULL,
    "surveyVersion" INTEGER NOT NULL,
    "notes" VARCHAR(5000) NOT NULL,
    "checklist" JSONB NOT NULL,
    "snapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SurveyReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SiteSurvey_reference_key" ON "SiteSurvey"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "SiteSurvey_previousSurveyId_key" ON "SiteSurvey"("previousSurveyId");

-- CreateIndex
CREATE INDEX "SiteSurvey_customerId_idx" ON "SiteSurvey"("customerId");

-- CreateIndex
CREATE INDEX "SiteSurvey_siteId_customerId_idx" ON "SiteSurvey"("siteId", "customerId");

-- CreateIndex
CREATE INDEX "SiteSurvey_status_createdAt_id_idx" ON "SiteSurvey"("status", "createdAt", "id");

-- CreateIndex
CREATE INDEX "SiteSurvey_assignedToId_scheduledAt_idx" ON "SiteSurvey"("assignedToId", "scheduledAt");

-- CreateIndex
CREATE INDEX "SiteSurvey_requestedById_idx" ON "SiteSurvey"("requestedById");

-- CreateIndex
CREATE UNIQUE INDEX "SiteSurvey_leadId_assessmentNumber_key" ON "SiteSurvey"("leadId", "assessmentNumber");

-- CreateIndex
CREATE UNIQUE INDEX "RoofAssessment_surveyId_key" ON "RoofAssessment"("surveyId");

-- CreateIndex
CREATE UNIQUE INDEX "ElectricalAssessment_surveyId_key" ON "ElectricalAssessment"("surveyId");

-- CreateIndex
CREATE UNIQUE INDEX "SurveyAttachment_storageKey_key" ON "SurveyAttachment"("storageKey");

-- CreateIndex
CREATE INDEX "SurveyAttachment_surveyId_createdAt_id_idx" ON "SurveyAttachment"("surveyId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "SurveyAttachment_uploaderId_idx" ON "SurveyAttachment"("uploaderId");

-- CreateIndex
CREATE INDEX "SurveyStatusHistory_surveyId_createdAt_id_idx" ON "SurveyStatusHistory"("surveyId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "SurveyStatusHistory_actorId_idx" ON "SurveyStatusHistory"("actorId");

-- CreateIndex
CREATE INDEX "SurveyReview_reviewerId_idx" ON "SurveyReview"("reviewerId");

-- CreateIndex
CREATE UNIQUE INDEX "SurveyReview_surveyId_surveyVersion_key" ON "SurveyReview"("surveyId", "surveyVersion");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_id_siteId_customerId_key" ON "Lead"("id", "siteId", "customerId");

-- AddForeignKey
ALTER TABLE "SiteSurvey" ADD CONSTRAINT "SiteSurvey_leadId_siteId_customerId_fkey" FOREIGN KEY ("leadId", "siteId", "customerId") REFERENCES "Lead"("id", "siteId", "customerId") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "SiteSurvey" ADD CONSTRAINT "SiteSurvey_siteId_customerId_fkey" FOREIGN KEY ("siteId", "customerId") REFERENCES "Site"("id", "customerId") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "SiteSurvey" ADD CONSTRAINT "SiteSurvey_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "SiteSurvey" ADD CONSTRAINT "SiteSurvey_previousSurveyId_fkey" FOREIGN KEY ("previousSurveyId") REFERENCES "SiteSurvey"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "SiteSurvey" ADD CONSTRAINT "SiteSurvey_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteSurvey" ADD CONSTRAINT "SiteSurvey_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoofAssessment" ADD CONSTRAINT "RoofAssessment_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "SiteSurvey"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectricalAssessment" ADD CONSTRAINT "ElectricalAssessment_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "SiteSurvey"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyAttachment" ADD CONSTRAINT "SurveyAttachment_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "SiteSurvey"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyAttachment" ADD CONSTRAINT "SurveyAttachment_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyStatusHistory" ADD CONSTRAINT "SurveyStatusHistory_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "SiteSurvey"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyStatusHistory" ADD CONSTRAINT "SurveyStatusHistory_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyReview" ADD CONSTRAINT "SurveyReview_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "SiteSurvey"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyReview" ADD CONSTRAINT "SurveyReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CHECK, partial/exclusion indexes and triggers are explicit SQL because Prisma 6
-- cannot express these invariants in its schema DSL. Keep them in future migrations.
ALTER TABLE "SiteSurvey" ADD CONSTRAINT "SiteSurvey_numbers_check" CHECK (
  "version" > 0 AND "assessmentNumber" > 0 AND ("requestedCapacityKw" IS NULL OR "requestedCapacityKw" > 0)
  AND ("recommendedCapacityKw" IS NULL OR "recommendedCapacityKw" > 0)
);
ALTER TABLE "SiteSurvey" ADD CONSTRAINT "SiteSurvey_schedule_check" CHECK (
  ("scheduledAt" IS NULL AND "scheduledEndAt" IS NULL AND "expectedDurationMinutes" IS NULL)
  OR ("scheduledAt" IS NOT NULL AND "scheduledEndAt" IS NOT NULL AND "expectedDurationMinutes" IS NOT NULL AND "expectedDurationMinutes" BETWEEN 15 AND 480
    AND "scheduledEndAt" = "scheduledAt" + "expectedDurationMinutes" * INTERVAL '1 minute')
);
ALTER TABLE "SiteSurvey" ADD CONSTRAINT "SiteSurvey_visit_check" CHECK (
  ("status" <> 'SCHEDULED' OR ("assignedToId" IS NOT NULL AND "scheduledAt" IS NOT NULL AND "visitStatus" = 'CONFIRMED'))
  AND ("status" <> 'IN_PROGRESS' OR ("assignedToId" IS NOT NULL AND "scheduledAt" IS NOT NULL AND "startedAt" IS NOT NULL AND "visitStatus" = 'IN_PROGRESS'))
  AND ("status" NOT IN ('SUBMITTED', 'APPROVED', 'REJECTED') OR ("submittedAt" IS NOT NULL AND "visitStatus" = 'COMPLETED'))
  AND ("status" <> 'CANCELED' OR "visitStatus" = 'CANCELED')
);
ALTER TABLE "SiteSurvey" ADD CONSTRAINT "SiteSurvey_approval_check" CHECK (
  ("status" = 'APPROVED' AND "approvedVersion" IS NOT NULL AND "approvedVersion" > 0 AND "approvedVersion" < "version")
  OR ("status" <> 'APPROVED' AND "approvedVersion" IS NULL)
);
CREATE UNIQUE INDEX "SiteSurvey_one_active_per_lead" ON "SiteSurvey"("leadId")
  WHERE "status" IN ('REQUESTED', 'SCHEDULED', 'IN_PROGRESS', 'SUBMITTED', 'REVISION_REQUIRED');
CREATE UNIQUE INDEX "SiteSurvey_one_running_visit" ON "SiteSurvey"("assignedToId") WHERE "status" = 'IN_PROGRESS';
-- Half-open UTC ranges allow back-to-back appointments; canceled/completed slots do not block.
ALTER TABLE "SiteSurvey" ADD CONSTRAINT "SiteSurvey_no_overlap" EXCLUDE USING gist (
  "assignedToId" WITH =, tstzrange("scheduledAt", "scheduledEndAt", '[)') WITH &&
) WHERE ("status" IN ('SCHEDULED', 'IN_PROGRESS'));

ALTER TABLE "RoofAssessment" ADD CONSTRAINT "RoofAssessment_ranges_check" CHECK (
  "usableAreaSqm" BETWEEN 0 AND 1000000 AND "mountingSpaceSqm" BETWEEN 0 AND "usableAreaSqm"
  AND "azimuthDegrees" >= 0 AND "azimuthDegrees" < 360 AND "tiltDegrees" BETWEEN 0 AND 90
  AND ("roofType" <> 'OTHER' OR ("roofTypeDetails" IS NOT NULL AND length(btrim("roofTypeDetails")) > 0))
);
ALTER TABLE "ElectricalAssessment" ADD CONSTRAINT "ElectricalAssessment_ranges_check" CHECK (
  ("approximateCableRunMeters" IS NULL OR "approximateCableRunMeters" BETWEEN 0 AND 100000)
  AND ("gridConnection" <> 'CONNECTED' OR ("meterDetails" IS NOT NULL AND length(btrim("meterDetails")) > 0))
);
ALTER TABLE "SurveyAttachment" ADD CONSTRAINT "SurveyAttachment_file_check" CHECK (
  "sizeBytes" BETWEEN 1 AND 10485760 AND "mimeType" IN ('image/jpeg', 'image/png', 'application/pdf')
  AND "sha256" ~ '^[a-f0-9]{64}$' AND "storageKey" ~ '^[a-f0-9-]{36}\.(jpg|png|pdf)$'
  AND ("category" NOT IN ('ROOF_PHOTO', 'METER_PHOTO', 'PANEL_PHOTO') OR "mimeType" <> 'application/pdf')
);
ALTER TABLE "SurveyStatusHistory" ADD CONSTRAINT "SurveyStatusHistory_fields_check" CHECK ("surveyVersion" > 0 AND length(btrim("reason")) > 0);
ALTER TABLE "SurveyReview" ADD CONSTRAINT "SurveyReview_fields_check" CHECK (
  "surveyVersion" > 0 AND length(btrim("notes")) > 0 AND jsonb_typeof("checklist") = 'object' AND jsonb_typeof("snapshot") = 'object'
);

CREATE FUNCTION "m02_append_only"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'M02 audit and evidence metadata are append-only' USING ERRCODE = '23514';
END;
$$;
CREATE TRIGGER "SurveyStatusHistory_append_only" BEFORE UPDATE OR DELETE ON "SurveyStatusHistory" FOR EACH ROW EXECUTE FUNCTION "m02_append_only"();
CREATE TRIGGER "SurveyReview_append_only" BEFORE UPDATE OR DELETE ON "SurveyReview" FOR EACH ROW EXECUTE FUNCTION "m02_append_only"();
CREATE TRIGGER "SurveyAttachment_append_only" BEFORE UPDATE OR DELETE ON "SurveyAttachment" FOR EACH ROW EXECUTE FUNCTION "m02_append_only"();

CREATE FUNCTION "m02_guard_survey"() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE prior "SiteSurvey"%ROWTYPE;
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Survey history cannot be hard deleted' USING ERRCODE = '23514';
  END IF;
  IF TG_OP = 'UPDATE' THEN
    IF OLD."status" IN ('APPROVED', 'REJECTED', 'CANCELED') THEN
      RAISE EXCEPTION 'Terminal survey is immutable' USING ERRCODE = '23514';
    END IF;
    IF ROW(NEW."id", NEW."reference", NEW."leadId", NEW."siteId", NEW."customerId", NEW."previousSurveyId", NEW."assessmentNumber", NEW."requestedById", NEW."requestedCapacityKw", NEW."requestNotes")
      IS DISTINCT FROM ROW(OLD."id", OLD."reference", OLD."leadId", OLD."siteId", OLD."customerId", OLD."previousSurveyId", OLD."assessmentNumber", OLD."requestedById", OLD."requestedCapacityKw", OLD."requestNotes") THEN
      RAISE EXCEPTION 'Survey identity and request snapshot are immutable' USING ERRCODE = '23514';
    END IF;
    IF NEW."version" <> OLD."version" + 1 THEN
      RAISE EXCEPTION 'Survey updates require exactly one version increment' USING ERRCODE = '23514';
    END IF;
    IF NEW."status" IS DISTINCT FROM OLD."status" AND NOT (
      (OLD."status" = 'REQUESTED' AND NEW."status" IN ('SCHEDULED', 'CANCELED')) OR
      (OLD."status" = 'SCHEDULED' AND NEW."status" IN ('IN_PROGRESS', 'CANCELED')) OR
      (OLD."status" = 'IN_PROGRESS' AND NEW."status" IN ('SUBMITTED', 'CANCELED')) OR
      (OLD."status" = 'SUBMITTED' AND NEW."status" IN ('APPROVED', 'REVISION_REQUIRED', 'REJECTED', 'CANCELED')) OR
      (OLD."status" = 'REVISION_REQUIRED' AND NEW."status" IN ('SCHEDULED', 'SUBMITTED', 'CANCELED'))
    ) THEN RAISE EXCEPTION 'Invalid survey transition' USING ERRCODE = '23514'; END IF;
    IF NEW."status" IS DISTINCT FROM OLD."status" AND NEW."status" IN ('APPROVED', 'REVISION_REQUIRED', 'REJECTED') THEN
      IF NOT EXISTS (SELECT 1 FROM "SurveyReview" WHERE "surveyId" = NEW."id" AND "surveyVersion" = OLD."version" AND "decision"::text = NEW."status"::text) THEN
        RAISE EXCEPTION 'Review decision required before transition' USING ERRCODE = '23514';
      END IF;
    END IF;
  ELSE
    IF NEW."status" <> 'REQUESTED' OR NEW."version" <> 1 THEN
      RAISE EXCEPTION 'New surveys must start REQUESTED at version one' USING ERRCODE = '23514';
    END IF;
    IF NEW."previousSurveyId" IS NOT NULL THEN
      SELECT * INTO prior FROM "SiteSurvey" WHERE "id" = NEW."previousSurveyId";
      IF NOT FOUND OR prior."status" NOT IN ('APPROVED', 'REJECTED', 'CANCELED')
        OR ROW(prior."leadId", prior."siteId", prior."customerId", prior."assessmentNumber" + 1)
          IS DISTINCT FROM ROW(NEW."leadId", NEW."siteId", NEW."customerId", NEW."assessmentNumber") THEN
        RAISE EXCEPTION 'Invalid reassessment chain' USING ERRCODE = '23514';
      END IF;
    ELSIF NEW."assessmentNumber" <> 1 THEN
      RAISE EXCEPTION 'First survey assessment number must be one' USING ERRCODE = '23514';
    END IF;
  END IF;
  IF NEW."assignedToId" IS NOT NULL AND (TG_OP = 'INSERT' OR NEW."assignedToId" IS DISTINCT FROM OLD."assignedToId")
    AND NOT EXISTS (SELECT 1 FROM "User" WHERE "id" = NEW."assignedToId" AND "role" = 'TECHNICIAN' AND "isActive") THEN
    RAISE EXCEPTION 'Assigned surveyor must be an active TECHNICIAN' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER "SiteSurvey_guard" BEFORE INSERT OR UPDATE OR DELETE ON "SiteSurvey" FOR EACH ROW EXECUTE FUNCTION "m02_guard_survey"();

CREATE FUNCTION "m02_guard_field_write"() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE parent "SiteSurvey"%ROWTYPE;
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Field observations cannot be hard deleted' USING ERRCODE = '23514';
  END IF;
  IF TG_OP = 'UPDATE' AND NEW."surveyId" IS DISTINCT FROM OLD."surveyId" THEN
    RAISE EXCEPTION 'Assessment ownership is immutable' USING ERRCODE = '23514';
  END IF;
  SELECT * INTO parent FROM "SiteSurvey" WHERE "id" = NEW."surveyId" FOR UPDATE;
  IF NOT FOUND OR parent."status" NOT IN ('IN_PROGRESS', 'REVISION_REQUIRED') THEN
    RAISE EXCEPTION 'Field observations are editable only during a visit or revision' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER "RoofAssessment_guard" BEFORE INSERT OR UPDATE OR DELETE ON "RoofAssessment" FOR EACH ROW EXECUTE FUNCTION "m02_guard_field_write"();
CREATE TRIGGER "ElectricalAssessment_guard" BEFORE INSERT OR UPDATE OR DELETE ON "ElectricalAssessment" FOR EACH ROW EXECUTE FUNCTION "m02_guard_field_write"();
CREATE TRIGGER "SurveyAttachment_guard" BEFORE INSERT ON "SurveyAttachment" FOR EACH ROW EXECUTE FUNCTION "m02_guard_field_write"();

CREATE FUNCTION "m02_guard_review"() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE parent "SiteSurvey"%ROWTYPE;
BEGIN
  SELECT * INTO parent FROM "SiteSurvey" WHERE "id" = NEW."surveyId" FOR UPDATE;
  IF NOT FOUND OR parent."status" <> 'SUBMITTED' OR parent."version" <> NEW."surveyVersion" THEN
    RAISE EXCEPTION 'Review must reference the current submitted version' USING ERRCODE = '23514';
  END IF;
  IF NEW."reviewerId" = parent."assignedToId" OR NOT EXISTS (SELECT 1 FROM "User" WHERE "id" = NEW."reviewerId" AND "role" = 'ADMIN' AND "isActive") THEN
    RAISE EXCEPTION 'An active independent ADMIN must review the survey' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER "SurveyReview_guard" BEFORE INSERT ON "SurveyReview" FOR EACH ROW EXECUTE FUNCTION "m02_guard_review"();

COMMIT;
