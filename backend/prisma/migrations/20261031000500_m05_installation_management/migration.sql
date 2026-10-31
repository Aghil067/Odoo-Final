BEGIN;
-- CreateEnum
CREATE TYPE "InstallationStatus" AS ENUM ('PLANNED', 'SITE_READY', 'IN_PROGRESS', 'ON_HOLD', 'WORK_COMPLETED', 'TESTING', 'COMMISSIONING_REVIEW', 'COMMISSIONED', 'REWORK_REQUIRED', 'CANCELED');

-- CreateEnum
CREATE TYPE "InstallationMilestoneType" AS ENUM ('SITE_PREPARATION', 'MOUNTING_STRUCTURE', 'SOLAR_PANELS', 'INVERTER', 'BATTERY', 'DC_WIRING', 'AC_WIRING', 'EARTHING_PROTECTION', 'SYSTEM_CONFIGURATION', 'FINAL_INSPECTION');

-- CreateEnum
CREATE TYPE "InstallationMilestoneStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'NOT_APPLICABLE');

-- CreateEnum
CREATE TYPE "InstallationIssueType" AS ENUM ('EQUIPMENT_MISSING', 'EQUIPMENT_DAMAGED', 'SITE_ACCESS', 'ROOF_MOUNTING', 'ELECTRICAL_SAFETY', 'DESIGN_MISMATCH', 'WEATHER_DELAY', 'OTHER');

-- CreateEnum
CREATE TYPE "InstallationSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "InstallationTestType" AS ENUM ('VISUAL_INSPECTION', 'MOUNTING_VERIFICATION', 'POLARITY', 'EARTHING', 'INSULATION', 'INVERTER_STARTUP', 'PROTECTION_DEVICES', 'BATTERY', 'FUNCTIONAL_SYSTEM');

-- CreateEnum
CREATE TYPE "InstallationTestResult" AS ENUM ('PASS', 'FAIL', 'NEEDS_REVIEW');

-- CreateEnum
CREATE TYPE "InstallationReviewDecision" AS ENUM ('APPROVED', 'REWORK_REQUIRED');

-- CreateTable
CREATE TABLE "InstallationJob" (
    "id" UUID NOT NULL,
    "reference" VARCHAR(60) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "customerId" UUID NOT NULL,
    "siteId" UUID NOT NULL,
    "leadId" UUID NOT NULL,
    "configurationId" UUID NOT NULL,
    "configurationApprovedVersion" INTEGER NOT NULL,
    "configurationReviewId" UUID NOT NULL,
    "bomId" UUID NOT NULL,
    "bomVersion" INTEGER NOT NULL,
    "reservationId" UUID NOT NULL,
    "dispatchId" UUID NOT NULL,
    "handoffSnapshot" JSONB NOT NULL,
    "testRequirements" JSONB NOT NULL,
    "status" "InstallationStatus" NOT NULL DEFAULT 'PLANNED',
    "resumeStatus" "InstallationStatus",
    "plannedStartAt" TIMESTAMPTZ(3) NOT NULL,
    "plannedEndAt" TIMESTAMPTZ(3) NOT NULL,
    "actualStartAt" TIMESTAMPTZ(3),
    "actualEndAt" TIMESTAMPTZ(3),
    "deliveryConfirmedAt" TIMESTAMPTZ(3),
    "commissionedAt" TIMESTAMPTZ(3),
    "coordinatorId" UUID NOT NULL,
    "createdById" UUID NOT NULL,
    "siteReadinessNotes" VARCHAR(5000),
    "safetyNotes" VARCHAR(5000),
    "completionNotes" VARCHAR(5000),
    "version" INTEGER NOT NULL DEFAULT 1,
    "executionRevision" INTEGER NOT NULL DEFAULT 1,
    "approvedVersion" INTEGER,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "InstallationJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstallationAssignment" (
    "id" UUID NOT NULL,
    "jobId" UUID NOT NULL,
    "userId" UUID NOT NULL,

    CONSTRAINT "InstallationAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstallationMilestone" (
    "id" UUID NOT NULL,
    "jobId" UUID NOT NULL,
    "type" "InstallationMilestoneType" NOT NULL,
    "required" BOOLEAN NOT NULL,
    "status" "InstallationMilestoneStatus" NOT NULL DEFAULT 'PENDING',
    "responsibleUserId" UUID,
    "plannedStartAt" TIMESTAMPTZ(3),
    "plannedEndAt" TIMESTAMPTZ(3),
    "actualStartAt" TIMESTAMPTZ(3),
    "actualEndAt" TIMESTAMPTZ(3),
    "checks" JSONB NOT NULL,
    "completionNotes" VARCHAR(5000),
    "evidenceIds" UUID[],
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "InstallationMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstallationEquipment" (
    "id" UUID NOT NULL,
    "jobId" UUID NOT NULL,
    "dispatchLineId" UUID NOT NULL,
    "componentId" UUID NOT NULL,
    "unit" "SolarUnit" NOT NULL,
    "serializationRequired" BOOLEAN NOT NULL,
    "dispatchedQuantity" DECIMAL(18,3) NOT NULL,
    "receivedQuantity" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "damagedQuantity" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "installedQuantity" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "installedLocation" VARCHAR(1000),
    "installedAt" TIMESTAMPTZ(3),
    "installerId" UUID,
    "notes" VARCHAR(5000),

    CONSTRAINT "InstallationEquipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstallationEquipmentSerial" (
    "id" UUID NOT NULL,
    "equipmentId" UUID NOT NULL,
    "serialUnitId" UUID NOT NULL,
    "received" BOOLEAN NOT NULL DEFAULT false,
    "damaged" BOOLEAN NOT NULL DEFAULT false,
    "installedAt" TIMESTAMPTZ(3),
    "installedLocation" VARCHAR(1000),
    "installerId" UUID,

    CONSTRAINT "InstallationEquipmentSerial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstallationIssue" (
    "id" UUID NOT NULL,
    "jobId" UUID NOT NULL,
    "type" "InstallationIssueType" NOT NULL,
    "severity" "InstallationSeverity" NOT NULL,
    "blocking" BOOLEAN NOT NULL DEFAULT true,
    "description" VARCHAR(5000) NOT NULL,
    "milestoneId" UUID,
    "equipmentId" UUID,
    "serialUnitId" UUID,
    "reportedById" UUID NOT NULL,
    "reportedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    "resolution" VARCHAR(5000),
    "resolvedById" UUID,
    "resolvedAt" TIMESTAMPTZ(3),
    "evidenceIds" UUID[],

    CONSTRAINT "InstallationIssue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstallationAttachment" (
    "id" UUID NOT NULL,
    "jobId" UUID NOT NULL,
    "milestoneId" UUID,
    "issueId" UUID,
    "category" VARCHAR(40) NOT NULL,
    "fileName" VARCHAR(160) NOT NULL,
    "mimeType" VARCHAR(100) NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "sha256" CHAR(64) NOT NULL,
    "storageKey" VARCHAR(100) NOT NULL,
    "uploaderId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InstallationAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstallationTest" (
    "id" UUID NOT NULL,
    "jobId" UUID NOT NULL,
    "type" "InstallationTestType" NOT NULL,
    "applicable" BOOLEAN NOT NULL,
    "result" "InstallationTestResult" NOT NULL,
    "observations" VARCHAR(5000) NOT NULL,
    "measurement" DECIMAL(24,6),
    "unit" VARCHAR(40),
    "requirementsBasis" VARCHAR(2000) NOT NULL,
    "notApplicableReason" VARCHAR(2000),
    "notes" VARCHAR(5000),
    "testerId" UUID NOT NULL,
    "testedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "executionRevision" INTEGER NOT NULL,
    "jobVersion" INTEGER NOT NULL,
    "evidenceIds" UUID[],

    CONSTRAINT "InstallationTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstallationCommissioningReview" (
    "id" UUID NOT NULL,
    "jobId" UUID NOT NULL,
    "jobVersion" INTEGER NOT NULL,
    "reviewerId" UUID NOT NULL,
    "decision" "InstallationReviewDecision" NOT NULL,
    "checklist" JSONB NOT NULL,
    "notes" VARCHAR(5000) NOT NULL,
    "snapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InstallationCommissioningReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstallationStatusHistory" (
    "id" UUID NOT NULL,
    "jobId" UUID NOT NULL,
    "actorId" UUID NOT NULL,
    "event" VARCHAR(60) NOT NULL,
    "fromStatus" "InstallationStatus",
    "toStatus" "InstallationStatus" NOT NULL,
    "jobVersion" INTEGER NOT NULL,
    "reason" VARCHAR(2000) NOT NULL,
    "details" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InstallationStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstallationReceipt" (
    "id" UUID NOT NULL,
    "jobId" UUID NOT NULL,
    "actorId" UUID NOT NULL,
    "receivedAt" TIMESTAMPTZ(3) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "jobVersion" INTEGER NOT NULL,
    "notes" VARCHAR(5000) NOT NULL,
    "snapshot" JSONB NOT NULL,
    "evidenceIds" UUID[],

    CONSTRAINT "InstallationReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstallationReadiness" (
    "id" UUID NOT NULL,
    "jobId" UUID NOT NULL,
    "actorId" UUID NOT NULL,
    "checklist" JSONB NOT NULL,
    "notes" VARCHAR(5000) NOT NULL,
    "conditionalWorkResolution" VARCHAR(5000) NOT NULL,
    "outstandingIssues" VARCHAR(5000),
    "evidenceIds" UUID[],
    "jobVersion" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InstallationReadiness_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InstallationJob_reference_key" ON "InstallationJob"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "InstallationJob_reservationId_key" ON "InstallationJob"("reservationId");

-- CreateIndex
CREATE UNIQUE INDEX "InstallationJob_dispatchId_key" ON "InstallationJob"("dispatchId");

-- CreateIndex
CREATE INDEX "InstallationJob_status_plannedStartAt_idx" ON "InstallationJob"("status", "plannedStartAt");

-- CreateIndex
CREATE INDEX "InstallationJob_leadId_siteId_idx" ON "InstallationJob"("leadId", "siteId");

-- CreateIndex
CREATE INDEX "InstallationJob_coordinatorId_status_idx" ON "InstallationJob"("coordinatorId", "status");

-- CreateIndex
CREATE INDEX "InstallationAssignment_userId_jobId_idx" ON "InstallationAssignment"("userId", "jobId");

-- CreateIndex
CREATE UNIQUE INDEX "InstallationAssignment_jobId_userId_key" ON "InstallationAssignment"("jobId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "InstallationMilestone_jobId_type_key" ON "InstallationMilestone"("jobId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "InstallationMilestone_id_jobId_key" ON "InstallationMilestone"("id", "jobId");

-- CreateIndex
CREATE UNIQUE INDEX "InstallationEquipment_dispatchLineId_key" ON "InstallationEquipment"("dispatchLineId");

-- CreateIndex
CREATE UNIQUE INDEX "InstallationEquipment_jobId_componentId_key" ON "InstallationEquipment"("jobId", "componentId");

-- CreateIndex
CREATE UNIQUE INDEX "InstallationEquipment_id_jobId_key" ON "InstallationEquipment"("id", "jobId");

-- CreateIndex
CREATE UNIQUE INDEX "InstallationEquipmentSerial_serialUnitId_key" ON "InstallationEquipmentSerial"("serialUnitId");

-- CreateIndex
CREATE INDEX "InstallationEquipmentSerial_equipmentId_idx" ON "InstallationEquipmentSerial"("equipmentId");

-- CreateIndex
CREATE INDEX "InstallationIssue_jobId_status_severity_idx" ON "InstallationIssue"("jobId", "status", "severity");

-- CreateIndex
CREATE UNIQUE INDEX "InstallationIssue_id_jobId_key" ON "InstallationIssue"("id", "jobId");

-- CreateIndex
CREATE UNIQUE INDEX "InstallationAttachment_storageKey_key" ON "InstallationAttachment"("storageKey");

-- CreateIndex
CREATE INDEX "InstallationAttachment_jobId_createdAt_idx" ON "InstallationAttachment"("jobId", "createdAt");

-- CreateIndex
CREATE INDEX "InstallationTest_jobId_type_executionRevision_jobVersion_idx" ON "InstallationTest"("jobId", "type", "executionRevision", "jobVersion");

-- CreateIndex
CREATE UNIQUE INDEX "InstallationTest_jobId_jobVersion_key" ON "InstallationTest"("jobId", "jobVersion");

-- CreateIndex
CREATE UNIQUE INDEX "InstallationCommissioningReview_jobId_jobVersion_key" ON "InstallationCommissioningReview"("jobId", "jobVersion");

-- CreateIndex
CREATE UNIQUE INDEX "InstallationStatusHistory_jobId_jobVersion_key" ON "InstallationStatusHistory"("jobId", "jobVersion");

-- CreateIndex
CREATE UNIQUE INDEX "InstallationReceipt_jobId_jobVersion_key" ON "InstallationReceipt"("jobId", "jobVersion");

-- CreateIndex
CREATE UNIQUE INDEX "InstallationReadiness_jobId_jobVersion_key" ON "InstallationReadiness"("jobId", "jobVersion");

-- AddForeignKey
ALTER TABLE "InstallationJob" ADD CONSTRAINT "InstallationJob_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallationJob" ADD CONSTRAINT "InstallationJob_siteId_customerId_fkey" FOREIGN KEY ("siteId", "customerId") REFERENCES "Site"("id", "customerId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallationJob" ADD CONSTRAINT "InstallationJob_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallationJob" ADD CONSTRAINT "InstallationJob_configurationId_fkey" FOREIGN KEY ("configurationId") REFERENCES "SolarConfiguration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallationJob" ADD CONSTRAINT "InstallationJob_bomId_fkey" FOREIGN KEY ("bomId") REFERENCES "BillOfMaterials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallationJob" ADD CONSTRAINT "InstallationJob_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "StockReservation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallationJob" ADD CONSTRAINT "InstallationJob_dispatchId_fkey" FOREIGN KEY ("dispatchId") REFERENCES "StockDispatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallationJob" ADD CONSTRAINT "InstallationJob_coordinatorId_fkey" FOREIGN KEY ("coordinatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallationJob" ADD CONSTRAINT "InstallationJob_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallationAssignment" ADD CONSTRAINT "InstallationAssignment_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "InstallationJob"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallationAssignment" ADD CONSTRAINT "InstallationAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallationMilestone" ADD CONSTRAINT "InstallationMilestone_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "InstallationJob"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallationMilestone" ADD CONSTRAINT "InstallationMilestone_responsibleUserId_fkey" FOREIGN KEY ("responsibleUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallationEquipment" ADD CONSTRAINT "InstallationEquipment_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "InstallationJob"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallationEquipment" ADD CONSTRAINT "InstallationEquipment_dispatchLineId_fkey" FOREIGN KEY ("dispatchLineId") REFERENCES "StockDispatchLine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallationEquipment" ADD CONSTRAINT "InstallationEquipment_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "SolarComponent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallationEquipment" ADD CONSTRAINT "InstallationEquipment_installerId_fkey" FOREIGN KEY ("installerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallationEquipmentSerial" ADD CONSTRAINT "InstallationEquipmentSerial_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "InstallationEquipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallationEquipmentSerial" ADD CONSTRAINT "InstallationEquipmentSerial_serialUnitId_fkey" FOREIGN KEY ("serialUnitId") REFERENCES "InventorySerialUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallationEquipmentSerial" ADD CONSTRAINT "InstallationEquipmentSerial_installerId_fkey" FOREIGN KEY ("installerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallationIssue" ADD CONSTRAINT "InstallationIssue_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "InstallationJob"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallationIssue" ADD CONSTRAINT "InstallationIssue_milestoneId_jobId_fkey" FOREIGN KEY ("milestoneId", "jobId") REFERENCES "InstallationMilestone"("id", "jobId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallationIssue" ADD CONSTRAINT "InstallationIssue_equipmentId_jobId_fkey" FOREIGN KEY ("equipmentId", "jobId") REFERENCES "InstallationEquipment"("id", "jobId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallationIssue" ADD CONSTRAINT "InstallationIssue_serialUnitId_fkey" FOREIGN KEY ("serialUnitId") REFERENCES "InventorySerialUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallationIssue" ADD CONSTRAINT "InstallationIssue_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallationIssue" ADD CONSTRAINT "InstallationIssue_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallationAttachment" ADD CONSTRAINT "InstallationAttachment_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "InstallationJob"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallationAttachment" ADD CONSTRAINT "InstallationAttachment_milestoneId_jobId_fkey" FOREIGN KEY ("milestoneId", "jobId") REFERENCES "InstallationMilestone"("id", "jobId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallationAttachment" ADD CONSTRAINT "InstallationAttachment_issueId_jobId_fkey" FOREIGN KEY ("issueId", "jobId") REFERENCES "InstallationIssue"("id", "jobId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallationAttachment" ADD CONSTRAINT "InstallationAttachment_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallationTest" ADD CONSTRAINT "InstallationTest_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "InstallationJob"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallationTest" ADD CONSTRAINT "InstallationTest_testerId_fkey" FOREIGN KEY ("testerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallationCommissioningReview" ADD CONSTRAINT "InstallationCommissioningReview_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "InstallationJob"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallationCommissioningReview" ADD CONSTRAINT "InstallationCommissioningReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallationStatusHistory" ADD CONSTRAINT "InstallationStatusHistory_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "InstallationJob"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallationStatusHistory" ADD CONSTRAINT "InstallationStatusHistory_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallationReceipt" ADD CONSTRAINT "InstallationReceipt_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "InstallationJob"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallationReceipt" ADD CONSTRAINT "InstallationReceipt_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallationReadiness" ADD CONSTRAINT "InstallationReadiness_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "InstallationJob"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallationReadiness" ADD CONSTRAINT "InstallationReadiness_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- M05 constraints and defensive guards. No existing business rows are rewritten.
ALTER TABLE "InstallationJob" ADD CONSTRAINT "InstallationJob_values_check" CHECK (
 "version">0 AND "executionRevision">0 AND "configurationApprovedVersion">0 AND "bomVersion">0 AND "plannedEndAt">="plannedStartAt"
 AND ("actualEndAt" IS NULL OR ("actualStartAt" IS NOT NULL AND "actualEndAt">="actualStartAt"))
 AND (("status"='ON_HOLD')=("resumeStatus" IS NOT NULL))
 AND (("status"='COMMISSIONED' AND "approvedVersion"="version"-1 AND "approvedVersion" IS NOT NULL AND "commissionedAt" IS NOT NULL) OR ("status"<>'COMMISSIONED' AND "approvedVersion" IS NULL AND "commissionedAt" IS NULL))
 AND jsonb_typeof("handoffSnapshot")='object' AND jsonb_typeof("testRequirements")='array');
CREATE UNIQUE INDEX "InstallationJob_one_project" ON "InstallationJob"("leadId","siteId") WHERE "status"<>'CANCELED';
ALTER TABLE "InstallationEquipment" ADD CONSTRAINT "InstallationEquipment_quantities_check" CHECK (
 "dispatchedQuantity">0 AND "receivedQuantity">=0 AND "damagedQuantity">=0 AND "receivedQuantity"+"damagedQuantity"<="dispatchedQuantity"
 AND "installedQuantity">=0 AND "installedQuantity"<="receivedQuantity"
 AND (NOT "serializationRequired" OR "unit"='PCS')
 AND ("unit" NOT IN ('PCS','SET','PAIR') OR ("dispatchedQuantity"=round("dispatchedQuantity",0) AND "receivedQuantity"=round("receivedQuantity",0) AND "damagedQuantity"=round("damagedQuantity",0) AND "installedQuantity"=round("installedQuantity",0)))
 AND ("installedQuantity"=0 OR ("installedAt" IS NOT NULL AND "installerId" IS NOT NULL AND "installedLocation" IS NOT NULL)));
ALTER TABLE "InstallationEquipmentSerial" ADD CONSTRAINT "InstallationEquipmentSerial_installed_check" CHECK (
 NOT ("received" AND "damaged") AND ("installedAt" IS NULL OR ("received" AND NOT "damaged" AND "installerId" IS NOT NULL AND "installedLocation" IS NOT NULL)));
ALTER TABLE "InstallationIssue" ADD CONSTRAINT "InstallationIssue_status_check" CHECK (
 ("severity" NOT IN ('HIGH','CRITICAL') OR "blocking") AND (("status"='OPEN' AND "resolvedAt" IS NULL AND "resolvedById" IS NULL) OR ("status"='RESOLVED' AND "resolvedAt" IS NOT NULL AND "resolvedById" IS NOT NULL AND length(btrim("resolution"))>0)));
ALTER TABLE "InstallationAttachment" ADD CONSTRAINT "InstallationAttachment_values_check" CHECK ("sizeBytes">0 AND "sizeBytes"<=10485760 AND "mimeType" IN ('image/jpeg','image/png','application/pdf') AND "storageKey" ~ '^[a-f0-9-]{36}\.(jpg|png|pdf)$');
ALTER TABLE "InstallationTest" ADD CONSTRAINT "InstallationTest_values_check" CHECK ("jobVersion">0 AND "executionRevision">0 AND (("measurement" IS NULL)=("unit" IS NULL)) AND length(btrim("requirementsBasis"))>0 AND ("applicable" OR ("notApplicableReason" IS NOT NULL AND "result"='NEEDS_REVIEW' AND "measurement" IS NULL)));
CREATE FUNCTION "m05_immutable"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Installation audit/evidence is immutable' USING ERRCODE='23514'; END;
$$;
CREATE TRIGGER "InstallationStatusHistory_immutable" BEFORE UPDATE OR DELETE ON "InstallationStatusHistory" FOR EACH ROW EXECUTE FUNCTION "m05_immutable"();
CREATE TRIGGER "InstallationCommissioningReview_immutable" BEFORE UPDATE OR DELETE ON "InstallationCommissioningReview" FOR EACH ROW EXECUTE FUNCTION "m05_immutable"();
CREATE TRIGGER "InstallationTest_immutable" BEFORE UPDATE OR DELETE ON "InstallationTest" FOR EACH ROW EXECUTE FUNCTION "m05_immutable"();
CREATE TRIGGER "InstallationReceipt_immutable" BEFORE UPDATE OR DELETE ON "InstallationReceipt" FOR EACH ROW EXECUTE FUNCTION "m05_immutable"();
CREATE TRIGGER "InstallationReadiness_immutable" BEFORE UPDATE OR DELETE ON "InstallationReadiness" FOR EACH ROW EXECUTE FUNCTION "m05_immutable"();
CREATE TRIGGER "InstallationAttachment_immutable" BEFORE UPDATE OR DELETE ON "InstallationAttachment" FOR EACH ROW EXECUTE FUNCTION "m05_immutable"();
CREATE FUNCTION "m05_job_guard"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Installation history cannot be deleted' USING ERRCODE='23514'; END IF;
 IF TG_OP='INSERT' THEN
  IF NEW."status"<>'PLANNED' OR NEW."version"<>1 OR NEW."executionRevision"<>1 THEN RAISE EXCEPTION 'Create planned jobs at version one' USING ERRCODE='23514'; END IF;
  IF NOT EXISTS(SELECT 1 FROM "StockDispatch" d JOIN "StockReservation" r ON r."id"=d."reservationId" JOIN "SolarConfiguration" c ON c."id"=r."configurationId" JOIN "BillOfMaterials" b ON b."id"=r."bomId" WHERE d."id"=NEW."dispatchId" AND d."status"='POSTED' AND r."id"=NEW."reservationId" AND r."status"='DISPATCHED' AND c."status"='APPROVED' AND b."status"='APPROVED' AND ROW(c."id",c."customerId",c."siteId",c."leadId",c."approvedVersion",r."configurationReviewId",b."id",b."version") IS NOT DISTINCT FROM ROW(NEW."configurationId",NEW."customerId",NEW."siteId",NEW."leadId",NEW."configurationApprovedVersion",NEW."configurationReviewId",NEW."bomId",NEW."bomVersion")) THEN RAISE EXCEPTION 'Installation must use the same approved dispatched project identity' USING ERRCODE='23514'; END IF;
 ELSE
  IF OLD."status" IN ('COMMISSIONED','CANCELED') THEN RAISE EXCEPTION 'Terminal installations are immutable' USING ERRCODE='23514'; END IF;
  IF ROW(NEW."id",NEW."reference",NEW."customerId",NEW."siteId",NEW."leadId",NEW."configurationId",NEW."configurationApprovedVersion",NEW."configurationReviewId",NEW."bomId",NEW."bomVersion",NEW."reservationId",NEW."dispatchId",NEW."handoffSnapshot",NEW."createdById",NEW."createdAt") IS DISTINCT FROM ROW(OLD."id",OLD."reference",OLD."customerId",OLD."siteId",OLD."leadId",OLD."configurationId",OLD."configurationApprovedVersion",OLD."configurationReviewId",OLD."bomId",OLD."bomVersion",OLD."reservationId",OLD."dispatchId",OLD."handoffSnapshot",OLD."createdById",OLD."createdAt") OR NEW."version"<>OLD."version"+1 OR NEW."executionRevision" NOT IN (OLD."executionRevision",OLD."executionRevision"+1) THEN RAISE EXCEPTION 'Immutable installation identity or stale version' USING ERRCODE='23514'; END IF;
  IF OLD."actualStartAt" IS NOT NULL AND NEW."testRequirements" IS DISTINCT FROM OLD."testRequirements" THEN RAISE EXCEPTION 'Test plan is frozen after execution begins' USING ERRCODE='23514'; END IF;
  IF NEW."status" IS DISTINCT FROM OLD."status" AND NOT (
   (OLD."status"='PLANNED' AND NEW."status" IN ('SITE_READY','CANCELED')) OR
   (OLD."status"='SITE_READY' AND NEW."status" IN ('PLANNED','IN_PROGRESS','CANCELED')) OR
   (OLD."status"='IN_PROGRESS' AND NEW."status" IN ('ON_HOLD','WORK_COMPLETED')) OR
   (OLD."status"='ON_HOLD' AND NEW."status" IN ('IN_PROGRESS','TESTING','WORK_COMPLETED','REWORK_REQUIRED','CANCELED')) OR
   (OLD."status"='WORK_COMPLETED' AND NEW."status" IN ('TESTING','ON_HOLD','REWORK_REQUIRED')) OR
   (OLD."status"='TESTING' AND NEW."status" IN ('COMMISSIONING_REVIEW','ON_HOLD','REWORK_REQUIRED')) OR
   (OLD."status"='COMMISSIONING_REVIEW' AND NEW."status" IN ('COMMISSIONED','REWORK_REQUIRED')) OR
   (OLD."status"='REWORK_REQUIRED' AND NEW."status" IN ('IN_PROGRESS','ON_HOLD','WORK_COMPLETED'))
  ) THEN RAISE EXCEPTION 'Invalid installation transition' USING ERRCODE='23514'; END IF;
  IF OLD."status"='COMMISSIONING_REVIEW' AND (NEW."status" NOT IN ('COMMISSIONED','REWORK_REQUIRED') OR NOT EXISTS(SELECT 1 FROM "InstallationCommissioningReview" WHERE "jobId"=OLD."id" AND "jobVersion"=OLD."version" AND "decision"::text=CASE NEW."status" WHEN 'COMMISSIONED' THEN 'APPROVED' ELSE 'REWORK_REQUIRED' END)) THEN RAISE EXCEPTION 'Frozen submitted job requires independent persisted review' USING ERRCODE='23514'; END IF;
 END IF;
 IF NEW."status"='CANCELED' AND EXISTS(SELECT 1 FROM "InstallationEquipment" WHERE "jobId"=NEW."id" AND "installedQuantity">0) THEN RAISE EXCEPTION 'Cancellation cannot orphan installed equipment' USING ERRCODE='23514'; END IF;
 IF NEW."status" IN ('SITE_READY','IN_PROGRESS','WORK_COMPLETED','TESTING','COMMISSIONING_REVIEW','COMMISSIONED') THEN
  IF NEW."deliveryConfirmedAt" IS NULL OR EXISTS(SELECT 1 FROM "InstallationEquipment" WHERE "jobId"=NEW."id" AND ("receivedQuantity"<>"dispatchedQuantity" OR "damagedQuantity">0)) OR EXISTS(SELECT 1 FROM "StockDispatchLine" WHERE "dispatchId"=NEW."dispatchId" AND "returnedQuantity">0) THEN RAISE EXCEPTION 'Full verified usable site receipt is required' USING ERRCODE='23514'; END IF;
 END IF;
 IF NEW."status"='COMMISSIONED' THEN
  IF NEW."actualStartAt" IS NULL OR NEW."actualEndAt" IS NULL OR NEW."completionNotes" IS NULL OR EXISTS(SELECT 1 FROM "InstallationMilestone" WHERE "jobId"=NEW."id" AND "required" AND "status"<>'COMPLETED') OR EXISTS(SELECT 1 FROM "InstallationEquipment" WHERE "jobId"=NEW."id" AND "installedQuantity"<>"dispatchedQuantity") OR EXISTS(SELECT 1 FROM "InstallationIssue" WHERE "jobId"=NEW."id" AND "status"='OPEN' AND ("blocking" OR "severity" IN ('HIGH','CRITICAL'))) THEN RAISE EXCEPTION 'Installation completion checks are unresolved' USING ERRCODE='23514'; END IF;
  IF EXISTS(SELECT 1 FROM jsonb_array_elements(NEW."testRequirements") requirement LEFT JOIN LATERAL (SELECT * FROM "InstallationTest" WHERE "jobId"=NEW."id" AND "executionRevision"=NEW."executionRevision" AND "type"::text=requirement->>'type' ORDER BY "jobVersion" DESC LIMIT 1) t ON true WHERE ((requirement->>'required')::boolean AND (t."id" IS NULL OR NOT t."applicable" OR t."result"<>'PASS')) OR (t."applicable" AND t."result"<>'PASS')) THEN RAISE EXCEPTION 'Current required tests must pass' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER "InstallationJob_guard" BEFORE INSERT OR UPDATE OR DELETE ON "InstallationJob" FOR EACH ROW EXECUTE FUNCTION "m05_job_guard"();
CREATE FUNCTION "m05_child_guard"() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE job_id uuid; parent_status "InstallationStatus";
BEGIN
 IF TG_OP='DELETE' THEN job_id:=OLD."jobId"; ELSE job_id:=NEW."jobId"; END IF;
 SELECT "status" INTO parent_status FROM "InstallationJob" WHERE "id"=job_id FOR UPDATE;
 IF NOT FOUND OR parent_status IN ('COMMISSIONED','CANCELED','COMMISSIONING_REVIEW') THEN RAISE EXCEPTION 'Installation children are frozen' USING ERRCODE='23514'; END IF;
 IF TG_OP='UPDATE' AND (NEW."id"<>OLD."id" OR NEW."jobId"<>OLD."jobId") THEN RAISE EXCEPTION 'Installation child ownership is immutable' USING ERRCODE='23514'; END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END;
$$;
CREATE TRIGGER "InstallationAssignment_job" BEFORE INSERT OR UPDATE OR DELETE ON "InstallationAssignment" FOR EACH ROW EXECUTE FUNCTION "m05_child_guard"();
CREATE TRIGGER "InstallationMilestone_job" BEFORE INSERT OR UPDATE OR DELETE ON "InstallationMilestone" FOR EACH ROW EXECUTE FUNCTION "m05_child_guard"();
CREATE TRIGGER "InstallationEquipment_job" BEFORE INSERT OR UPDATE OR DELETE ON "InstallationEquipment" FOR EACH ROW EXECUTE FUNCTION "m05_child_guard"();
CREATE TRIGGER "InstallationIssue_job" BEFORE INSERT OR UPDATE OR DELETE ON "InstallationIssue" FOR EACH ROW EXECUTE FUNCTION "m05_child_guard"();
CREATE TRIGGER "InstallationAttachment_job" BEFORE INSERT ON "InstallationAttachment" FOR EACH ROW EXECUTE FUNCTION "m05_child_guard"();
CREATE TRIGGER "InstallationTest_job" BEFORE INSERT ON "InstallationTest" FOR EACH ROW EXECUTE FUNCTION "m05_child_guard"();
CREATE TRIGGER "InstallationReceipt_job" BEFORE INSERT ON "InstallationReceipt" FOR EACH ROW EXECUTE FUNCTION "m05_child_guard"();
CREATE TRIGGER "InstallationReadiness_job" BEFORE INSERT ON "InstallationReadiness" FOR EACH ROW EXECUTE FUNCTION "m05_child_guard"();
CREATE FUNCTION "m05_equipment_guard"() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE line "StockDispatchLine"%ROWTYPE;
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Installation equipment cannot be deleted/substituted' USING ERRCODE='23514'; END IF;
 SELECT * INTO line FROM "StockDispatchLine" WHERE "id"=NEW."dispatchLineId" FOR UPDATE;
 IF NOT FOUND OR NEW."receivedQuantity"+NEW."damagedQuantity">line."quantity"-line."returnedQuantity" OR NOT EXISTS(SELECT 1 FROM "InstallationJob" j JOIN "StockReservationLine" r ON r."id"=line."reservationLineId" WHERE j."id"=NEW."jobId" AND j."dispatchId"=line."dispatchId" AND r."componentId"=NEW."componentId" AND NEW."dispatchedQuantity"=line."quantity") THEN RAISE EXCEPTION 'Equipment must retain exact unreturned dispatch ownership/quantity' USING ERRCODE='23514'; END IF;
 IF TG_OP='UPDATE' AND (ROW(NEW."jobId",NEW."dispatchLineId",NEW."componentId",NEW."dispatchedQuantity",NEW."serializationRequired",NEW."unit") IS DISTINCT FROM ROW(OLD."jobId",OLD."dispatchLineId",OLD."componentId",OLD."dispatchedQuantity",OLD."serializationRequired",OLD."unit") OR NEW."installedQuantity"<OLD."installedQuantity") THEN RAISE EXCEPTION 'Equipment substitution/removal requires a separate corrective workflow' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER "InstallationEquipment_guard" BEFORE INSERT OR UPDATE OR DELETE ON "InstallationEquipment" FOR EACH ROW EXECUTE FUNCTION "m05_equipment_guard"();
CREATE FUNCTION "m05_serial_guard"() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE e "InstallationEquipment"%ROWTYPE; parent_status "InstallationStatus";
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Installed serial trace cannot be deleted' USING ERRCODE='23514'; END IF;
 SELECT * INTO e FROM "InstallationEquipment" WHERE "id"=NEW."equipmentId";
 SELECT "status" INTO parent_status FROM "InstallationJob" WHERE "id"=e."jobId" FOR UPDATE;
 IF NOT FOUND OR parent_status IN ('COMMISSIONED','CANCELED','COMMISSIONING_REVIEW') THEN RAISE EXCEPTION 'Installation serials are frozen' USING ERRCODE='23514'; END IF;
 IF NOT e."serializationRequired" OR NOT EXISTS(SELECT 1 FROM "StockDispatchLine" d JOIN "InventorySerialUnit" s ON s."id"=NEW."serialUnitId" WHERE d."id"=e."dispatchLineId" AND s."id"=ANY(d."serialUnitIds") AND s."componentId"=e."componentId") THEN RAISE EXCEPTION 'Serial must belong to the original dispatch/component' USING ERRCODE='23514'; END IF;
 IF TG_OP='UPDATE' AND (NEW."id"<>OLD."id" OR NEW."equipmentId"<>OLD."equipmentId" OR NEW."serialUnitId"<>OLD."serialUnitId" OR (OLD."installedAt" IS NOT NULL AND NEW IS DISTINCT FROM OLD)) THEN RAISE EXCEPTION 'Installed serial identity/placement is immutable; no substitution workflow exists' USING ERRCODE='23514'; END IF;
 IF (NEW."received" OR NEW."damaged" OR NEW."installedAt" IS NOT NULL) AND NOT EXISTS(SELECT 1 FROM "InventorySerialUnit" WHERE "id"=NEW."serialUnitId" AND "dispatchLineId"=e."dispatchLineId" AND "state"='DISPATCHED') THEN RAISE EXCEPTION 'Returned/transferred serial cannot be installed/received' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER "InstallationEquipmentSerial_guard" BEFORE INSERT OR UPDATE OR DELETE ON "InstallationEquipmentSerial" FOR EACH ROW EXECUTE FUNCTION "m05_serial_guard"();
CREATE FUNCTION "m05_serial_reconcile"() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE equipment_id uuid; e "InstallationEquipment"%ROWTYPE; received bigint; damaged bigint; installed bigint;
BEGIN
 IF TG_TABLE_NAME='InstallationEquipment' THEN equipment_id:=NEW."id"; ELSE equipment_id:=NEW."equipmentId"; END IF;
 SELECT * INTO e FROM "InstallationEquipment" WHERE "id"=equipment_id;
 IF e."serializationRequired" THEN
  SELECT count(*) FILTER(WHERE "received"),count(*) FILTER(WHERE "damaged"),count(*) FILTER(WHERE "installedAt" IS NOT NULL) INTO received,damaged,installed FROM "InstallationEquipmentSerial" WHERE "equipmentId"=e."id";
  IF ROW(e."receivedQuantity",e."damagedQuantity",e."installedQuantity") IS DISTINCT FROM ROW(received::numeric,damaged::numeric,installed::numeric) THEN RAISE EXCEPTION 'Installation serial counts must match cumulative equipment quantities' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NULL;
END;
$$;
CREATE CONSTRAINT TRIGGER "InstallationEquipment_reconcile" AFTER INSERT OR UPDATE ON "InstallationEquipment" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION "m05_serial_reconcile"();
CREATE CONSTRAINT TRIGGER "InstallationEquipmentSerial_reconcile" AFTER INSERT OR UPDATE ON "InstallationEquipmentSerial" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION "m05_serial_reconcile"();
CREATE FUNCTION "m05_review_guard"() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE j "InstallationJob"%ROWTYPE;
BEGIN
 SELECT * INTO j FROM "InstallationJob" WHERE "id"=NEW."jobId" FOR UPDATE;
 IF NOT FOUND OR j."status"<>'COMMISSIONING_REVIEW' OR j."version"<>NEW."jobVersion" OR j."createdById"=NEW."reviewerId" OR EXISTS(SELECT 1 FROM "InstallationStatusHistory" WHERE "jobId"=j."id" AND "actorId"=NEW."reviewerId" AND "event"<>'REVIEWED') OR NOT EXISTS(SELECT 1 FROM "User" WHERE "id"=NEW."reviewerId" AND "role"='ADMIN' AND "isActive") THEN RAISE EXCEPTION 'Current submitted version requires an independent active ADMIN reviewer' USING ERRCODE='23514'; END IF;
 IF NEW."decision"='APPROVED' AND NOT (NEW."checklist" @> '{"siteReceiptVerified":true,"milestonesReviewed":true,"equipmentReconciled":true,"testsReviewed":true,"conditionsAddressed":true,"evidenceReviewed":true,"internalScopeAcknowledged":true}'::jsonb) THEN RAISE EXCEPTION 'Complete independent commissioning checklist' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER "InstallationCommissioningReview_guard" BEFORE INSERT ON "InstallationCommissioningReview" FOR EACH ROW EXECUTE FUNCTION "m05_review_guard"();
-- M05 does not edit M04 history. It blocks stock returns from orphaning installed equipment.
CREATE FUNCTION "m05_installed_return_guard"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW."returnedQuantity">OLD."returnedQuantity" AND EXISTS(SELECT 1 FROM "InstallationEquipment" WHERE "dispatchLineId"=OLD."id" AND "installedQuantity">0) THEN RAISE EXCEPTION 'Installed equipment requires an explicit corrective removal workflow before warehouse return' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER "StockDispatchLine_installed_protection" BEFORE UPDATE ON "StockDispatchLine" FOR EACH ROW EXECUTE FUNCTION "m05_installed_return_guard"();
CREATE FUNCTION "m05_installed_inventory_serial_guard"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF ROW(NEW."state",NEW."dispatchLineId",NEW."componentId",NEW."serialNumber") IS DISTINCT FROM ROW(OLD."state",OLD."dispatchLineId",OLD."componentId",OLD."serialNumber") AND EXISTS(SELECT 1 FROM "InstallationEquipmentSerial" WHERE "serialUnitId"=OLD."id" AND "installedAt" IS NOT NULL) THEN RAISE EXCEPTION 'Installed serial requires an explicit corrective removal workflow' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER "InventorySerialUnit_installed_protection" BEFORE UPDATE ON "InventorySerialUnit" FOR EACH ROW EXECUTE FUNCTION "m05_installed_inventory_serial_guard"();
COMMIT;
