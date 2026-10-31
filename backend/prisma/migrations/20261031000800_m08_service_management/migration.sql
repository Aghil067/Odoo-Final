BEGIN;
-- CreateEnum
CREATE TYPE "ServiceTicketStatus" AS ENUM ('OPEN', 'TRIAGED', 'ASSIGNED', 'VISIT_SCHEDULED', 'IN_PROGRESS', 'WAITING_FOR_CUSTOMER', 'WAITING_FOR_PARTS', 'ON_HOLD', 'REOPENED', 'RESOLVED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ServiceCategory" AS ENUM ('PANEL_ISSUE', 'INVERTER_ISSUE', 'BATTERY_ISSUE', 'WIRING_ISSUE', 'PERFORMANCE_ISSUE', 'SYSTEM_OFFLINE', 'PREVENTIVE_MAINTENANCE', 'GENERAL_SUPPORT', 'OTHER');

-- CreateEnum
CREATE TYPE "ServicePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ServiceVisitStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ServiceRepairType" AS ENUM ('INSPECTION', 'CLEANING', 'CONFIGURATION', 'WIRING_REPAIR', 'COMPONENT_REPAIR', 'COMPONENT_REPLACEMENT', 'TESTING', 'OTHER');

-- CreateEnum
CREATE TYPE "ServiceRepairStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ServiceEvidenceType" AS ENUM ('FAULT_PHOTO', 'TECHNICIAN_NOTES', 'TEST_REPORT', 'REPAIR_PHOTO', 'CUSTOMER_ACKNOWLEDGEMENT', 'REPLACEMENT_DOCUMENTATION', 'OTHER');

-- AlterEnum
ALTER TYPE "WorkforcePurpose" ADD VALUE 'SERVICE';

-- CreateTable
CREATE TABLE "ServiceAccessGrant" (
    "id" UUID NOT NULL,
    "installationId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "role" "Role" NOT NULL,
    "grantedById" UUID NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceAccessGrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceOperation" (
    "id" UUID NOT NULL,
    "idempotencyKey" VARCHAR(100) NOT NULL,
    "kind" VARCHAR(60) NOT NULL,
    "requestHash" CHAR(64) NOT NULL,
    "actorId" UUID NOT NULL,
    "reason" VARCHAR(2000) NOT NULL,
    "result" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceOperation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceSlaPolicy" (
    "id" UUID NOT NULL,
    "reference" VARCHAR(64) NOT NULL,
    "revision" INTEGER NOT NULL,
    "category" "ServiceCategory" NOT NULL,
    "priority" "ServicePriority" NOT NULL,
    "firstResponseMinutes" INTEGER NOT NULL,
    "resolutionMinutes" INTEGER NOT NULL,
    "effectiveFrom" TIMESTAMPTZ(3) NOT NULL,
    "effectiveTo" TIMESTAMPTZ(3),
    "clock" VARCHAR(40) NOT NULL DEFAULT 'ELAPSED_UTC_NO_PAUSE',
    "terms" VARCHAR(5000) NOT NULL,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceSlaPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceTicket" (
    "id" UUID NOT NULL,
    "reference" VARCHAR(60) NOT NULL,
    "customerId" UUID NOT NULL,
    "siteId" UUID NOT NULL,
    "installationId" UUID NOT NULL,
    "equipmentId" UUID,
    "serialUnitId" UUID,
    "warrantyClaimId" UUID,
    "warrantySnapshot" JSONB NOT NULL,
    "reportedIssue" VARCHAR(300) NOT NULL,
    "description" VARCHAR(5000) NOT NULL,
    "category" "ServiceCategory" NOT NULL,
    "priority" "ServicePriority" NOT NULL,
    "channel" VARCHAR(80) NOT NULL,
    "status" "ServiceTicketStatus" NOT NULL DEFAULT 'OPEN',
    "heldFrom" "ServiceTicketStatus",
    "supportOwnerId" UUID,
    "customerImpact" VARCHAR(2000),
    "safetyConcern" BOOLEAN NOT NULL DEFAULT false,
    "safetyReviewedAt" TIMESTAMPTZ(3),
    "requiresVisit" BOOLEAN NOT NULL DEFAULT true,
    "troubleshootingNotes" VARCHAR(5000),
    "escalationReason" VARCHAR(2000),
    "requiredSkillIds" UUID[],
    "requiredChecks" TEXT[],
    "resolutionNotes" VARCHAR(5000),
    "createdById" UUID NOT NULL,
    "openedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "firstResponseAt" TIMESTAMPTZ(3),
    "resolvedAt" TIMESTAMPTZ(3),
    "closedAt" TIMESTAMPTZ(3),
    "slaPolicyId" UUID,
    "slaSnapshot" JSONB NOT NULL,
    "firstResponseDueAt" TIMESTAMPTZ(3),
    "resolutionDueAt" TIMESTAMPTZ(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "executionRevision" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ServiceTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceAssignment" (
    "id" UUID NOT NULL,
    "ticketId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "assignedById" UUID NOT NULL,
    "assignedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledgedAt" TIMESTAMPTZ(3),
    "endedAt" TIMESTAMPTZ(3),
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "ServiceAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceVisit" (
    "id" UUID NOT NULL,
    "ticketId" UUID NOT NULL,
    "assignmentId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "scheduledStartAt" TIMESTAMPTZ(3) NOT NULL,
    "scheduledEndAt" TIMESTAMPTZ(3) NOT NULL,
    "arrivedAt" TIMESTAMPTZ(3),
    "departedAt" TIMESTAMPTZ(3),
    "status" "ServiceVisitStatus" NOT NULL DEFAULT 'SCHEDULED',
    "siteAccess" VARCHAR(30) NOT NULL DEFAULT 'UNKNOWN',
    "workPerformed" VARCHAR(5000),
    "outcome" VARCHAR(2000),
    "followUpRequired" BOOLEAN NOT NULL DEFAULT false,
    "schedulingSnapshot" JSONB NOT NULL,
    "executionRevision" INTEGER NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceVisit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceDiagnosis" (
    "id" UUID NOT NULL,
    "ticketId" UUID NOT NULL,
    "visitId" UUID NOT NULL,
    "supersedesId" UUID,
    "reportedSymptom" VARCHAR(3000) NOT NULL,
    "observedSymptom" VARCHAR(3000) NOT NULL,
    "method" VARCHAR(2000) NOT NULL,
    "measurements" JSONB NOT NULL,
    "finding" VARCHAR(3000) NOT NULL,
    "probableCause" VARCHAR(2000),
    "uncertainty" VARCHAR(2000) NOT NULL,
    "evidenceIds" UUID[],
    "technicianId" UUID NOT NULL,
    "executionRevision" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceDiagnosis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceRepairAction" (
    "id" UUID NOT NULL,
    "ticketId" UUID NOT NULL,
    "visitId" UUID NOT NULL,
    "type" "ServiceRepairType" NOT NULL,
    "description" VARCHAR(5000) NOT NULL,
    "status" "ServiceRepairStatus" NOT NULL DEFAULT 'PLANNED',
    "startedAt" TIMESTAMPTZ(3),
    "completedAt" TIMESTAMPTZ(3),
    "outcome" VARCHAR(2000),
    "followUpRequired" BOOLEAN NOT NULL DEFAULT true,
    "evidenceIds" UUID[],
    "technicianId" UUID NOT NULL,
    "executionRevision" INTEGER NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceRepairAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServicePartRequest" (
    "id" UUID NOT NULL,
    "ticketId" UUID NOT NULL,
    "componentId" UUID NOT NULL,
    "quantity" DECIMAL(18,3) NOT NULL,
    "purpose" VARCHAR(2000) NOT NULL,
    "status" VARCHAR(30) NOT NULL DEFAULT 'PENDING_HANDOFF',
    "dispositionNotes" VARCHAR(2000),
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServicePartRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceChecklistItem" (
    "id" UUID NOT NULL,
    "ticketId" UUID NOT NULL,
    "key" VARCHAR(80) NOT NULL,
    "result" VARCHAR(30) NOT NULL,
    "notes" VARCHAR(2000) NOT NULL,
    "evidenceIds" UUID[],
    "actorId" UUID NOT NULL,
    "executionRevision" INTEGER NOT NULL,
    "ticketVersion" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceEvidence" (
    "id" UUID NOT NULL,
    "ticketId" UUID NOT NULL,
    "visitId" UUID,
    "type" "ServiceEvidenceType" NOT NULL,
    "fileName" VARCHAR(160) NOT NULL,
    "mimeType" VARCHAR(100) NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "sha256" CHAR(64) NOT NULL,
    "storageKey" VARCHAR(100) NOT NULL,
    "uploaderId" UUID NOT NULL,
    "executionRevision" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceCustomerFeedback" (
    "id" UUID NOT NULL,
    "ticketId" UUID NOT NULL,
    "acknowledged" BOOLEAN NOT NULL,
    "rating" INTEGER,
    "comments" VARCHAR(3000),
    "source" VARCHAR(200) NOT NULL,
    "observedAt" TIMESTAMPTZ(3) NOT NULL,
    "attestation" VARCHAR(2000) NOT NULL,
    "evidenceIds" UUID[],
    "recordedById" UUID NOT NULL,
    "executionRevision" INTEGER NOT NULL,
    "ticketVersion" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceCustomerFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceClosureReview" (
    "id" UUID NOT NULL,
    "ticketId" UUID NOT NULL,
    "ticketVersion" INTEGER NOT NULL,
    "reviewerId" UUID NOT NULL,
    "checklist" JSONB NOT NULL,
    "notes" VARCHAR(5000) NOT NULL,
    "snapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceClosureReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceTicketHistory" (
    "id" UUID NOT NULL,
    "ticketId" UUID NOT NULL,
    "actorId" UUID NOT NULL,
    "operationId" UUID,
    "version" INTEGER NOT NULL,
    "event" VARCHAR(60) NOT NULL,
    "fromStatus" "ServiceTicketStatus",
    "toStatus" "ServiceTicketStatus" NOT NULL,
    "reason" VARCHAR(2000) NOT NULL,
    "details" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceTicketHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceMaintenancePlan" (
    "id" UUID NOT NULL,
    "reference" VARCHAR(64) NOT NULL,
    "installationId" UUID NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "intervalDays" INTEGER NOT NULL,
    "effectiveAt" TIMESTAMPTZ(3) NOT NULL,
    "nextDueAt" TIMESTAMPTZ(3) NOT NULL,
    "requiredChecks" TEXT[],
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "createdById" UUID NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceMaintenancePlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceMaintenanceOccurrence" (
    "id" UUID NOT NULL,
    "planId" UUID NOT NULL,
    "dueAt" TIMESTAMPTZ(3) NOT NULL,
    "ticketId" UUID NOT NULL,
    "completedAt" TIMESTAMPTZ(3),
    "completionNotes" VARCHAR(2000),
    "cancelledAt" TIMESTAMPTZ(3),
    "cancellationNotes" VARCHAR(2000),

    CONSTRAINT "ServiceMaintenanceOccurrence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ServiceAccessGrant_installationId_userId_key" ON "ServiceAccessGrant"("installationId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceOperation_idempotencyKey_key" ON "ServiceOperation"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceSlaPolicy_reference_revision_key" ON "ServiceSlaPolicy"("reference", "revision");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceTicket_reference_key" ON "ServiceTicket"("reference");

-- CreateIndex
CREATE INDEX "ServiceTicket_status_priority_openedAt_id_idx" ON "ServiceTicket"("status", "priority", "openedAt", "id");

-- CreateIndex
CREATE INDEX "ServiceTicket_installationId_id_idx" ON "ServiceTicket"("installationId", "id");

-- CreateIndex
CREATE INDEX "ServiceTicket_resolutionDueAt_status_idx" ON "ServiceTicket"("resolutionDueAt", "status");

-- CreateIndex
CREATE INDEX "ServiceAssignment_userId_endedAt_idx" ON "ServiceAssignment"("userId", "endedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceAssignment_id_ticketId_userId_key" ON "ServiceAssignment"("id", "ticketId", "userId");

-- CreateIndex
CREATE INDEX "ServiceVisit_userId_status_scheduledStartAt_scheduledEndAt_idx" ON "ServiceVisit"("userId", "status", "scheduledStartAt", "scheduledEndAt");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceVisit_id_ticketId_key" ON "ServiceVisit"("id", "ticketId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceDiagnosis_supersedesId_key" ON "ServiceDiagnosis"("supersedesId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceDiagnosis_id_ticketId_key" ON "ServiceDiagnosis"("id", "ticketId");

-- CreateIndex
CREATE INDEX "ServiceChecklistItem_ticketId_executionRevision_key_created_idx" ON "ServiceChecklistItem"("ticketId", "executionRevision", "key", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceChecklistItem_ticketId_ticketVersion_key" ON "ServiceChecklistItem"("ticketId", "ticketVersion");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceEvidence_storageKey_key" ON "ServiceEvidence"("storageKey");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceCustomerFeedback_ticketId_ticketVersion_key" ON "ServiceCustomerFeedback"("ticketId", "ticketVersion");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceClosureReview_ticketId_ticketVersion_key" ON "ServiceClosureReview"("ticketId", "ticketVersion");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceTicketHistory_ticketId_version_key" ON "ServiceTicketHistory"("ticketId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceMaintenancePlan_reference_key" ON "ServiceMaintenancePlan"("reference");

-- CreateIndex
CREATE INDEX "ServiceMaintenancePlan_status_nextDueAt_id_idx" ON "ServiceMaintenancePlan"("status", "nextDueAt", "id");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceMaintenanceOccurrence_ticketId_key" ON "ServiceMaintenanceOccurrence"("ticketId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceMaintenanceOccurrence_planId_dueAt_key" ON "ServiceMaintenanceOccurrence"("planId", "dueAt");

-- AddForeignKey
ALTER TABLE "ServiceAccessGrant" ADD CONSTRAINT "ServiceAccessGrant_installationId_fkey" FOREIGN KEY ("installationId") REFERENCES "InstallationJob"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceAccessGrant" ADD CONSTRAINT "ServiceAccessGrant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceAccessGrant" ADD CONSTRAINT "ServiceAccessGrant_grantedById_fkey" FOREIGN KEY ("grantedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceOperation" ADD CONSTRAINT "ServiceOperation_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceSlaPolicy" ADD CONSTRAINT "ServiceSlaPolicy_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceTicket" ADD CONSTRAINT "ServiceTicket_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceTicket" ADD CONSTRAINT "ServiceTicket_siteId_customerId_fkey" FOREIGN KEY ("siteId", "customerId") REFERENCES "Site"("id", "customerId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceTicket" ADD CONSTRAINT "ServiceTicket_installationId_fkey" FOREIGN KEY ("installationId") REFERENCES "InstallationJob"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceTicket" ADD CONSTRAINT "ServiceTicket_equipmentId_installationId_fkey" FOREIGN KEY ("equipmentId", "installationId") REFERENCES "InstallationEquipment"("id", "jobId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceTicket" ADD CONSTRAINT "ServiceTicket_serialUnitId_fkey" FOREIGN KEY ("serialUnitId") REFERENCES "InventorySerialUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceTicket" ADD CONSTRAINT "ServiceTicket_warrantyClaimId_fkey" FOREIGN KEY ("warrantyClaimId") REFERENCES "WarrantyClaim"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceTicket" ADD CONSTRAINT "ServiceTicket_supportOwnerId_fkey" FOREIGN KEY ("supportOwnerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceTicket" ADD CONSTRAINT "ServiceTicket_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceTicket" ADD CONSTRAINT "ServiceTicket_slaPolicyId_fkey" FOREIGN KEY ("slaPolicyId") REFERENCES "ServiceSlaPolicy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceAssignment" ADD CONSTRAINT "ServiceAssignment_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "ServiceTicket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceAssignment" ADD CONSTRAINT "ServiceAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceAssignment" ADD CONSTRAINT "ServiceAssignment_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceVisit" ADD CONSTRAINT "ServiceVisit_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "ServiceTicket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceVisit" ADD CONSTRAINT "ServiceVisit_assignmentId_ticketId_userId_fkey" FOREIGN KEY ("assignmentId", "ticketId", "userId") REFERENCES "ServiceAssignment"("id", "ticketId", "userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceDiagnosis" ADD CONSTRAINT "ServiceDiagnosis_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "ServiceTicket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceDiagnosis" ADD CONSTRAINT "ServiceDiagnosis_visitId_ticketId_fkey" FOREIGN KEY ("visitId", "ticketId") REFERENCES "ServiceVisit"("id", "ticketId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceDiagnosis" ADD CONSTRAINT "ServiceDiagnosis_supersedesId_ticketId_fkey" FOREIGN KEY ("supersedesId", "ticketId") REFERENCES "ServiceDiagnosis"("id", "ticketId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceDiagnosis" ADD CONSTRAINT "ServiceDiagnosis_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRepairAction" ADD CONSTRAINT "ServiceRepairAction_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "ServiceTicket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRepairAction" ADD CONSTRAINT "ServiceRepairAction_visitId_ticketId_fkey" FOREIGN KEY ("visitId", "ticketId") REFERENCES "ServiceVisit"("id", "ticketId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRepairAction" ADD CONSTRAINT "ServiceRepairAction_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServicePartRequest" ADD CONSTRAINT "ServicePartRequest_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "ServiceTicket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServicePartRequest" ADD CONSTRAINT "ServicePartRequest_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "SolarComponent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceChecklistItem" ADD CONSTRAINT "ServiceChecklistItem_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "ServiceTicket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceChecklistItem" ADD CONSTRAINT "ServiceChecklistItem_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceEvidence" ADD CONSTRAINT "ServiceEvidence_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "ServiceTicket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceEvidence" ADD CONSTRAINT "ServiceEvidence_visitId_ticketId_fkey" FOREIGN KEY ("visitId", "ticketId") REFERENCES "ServiceVisit"("id", "ticketId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceEvidence" ADD CONSTRAINT "ServiceEvidence_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceCustomerFeedback" ADD CONSTRAINT "ServiceCustomerFeedback_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "ServiceTicket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceCustomerFeedback" ADD CONSTRAINT "ServiceCustomerFeedback_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceClosureReview" ADD CONSTRAINT "ServiceClosureReview_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "ServiceTicket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceClosureReview" ADD CONSTRAINT "ServiceClosureReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceTicketHistory" ADD CONSTRAINT "ServiceTicketHistory_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "ServiceTicket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceTicketHistory" ADD CONSTRAINT "ServiceTicketHistory_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceTicketHistory" ADD CONSTRAINT "ServiceTicketHistory_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "ServiceOperation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceMaintenancePlan" ADD CONSTRAINT "ServiceMaintenancePlan_installationId_fkey" FOREIGN KEY ("installationId") REFERENCES "InstallationJob"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceMaintenancePlan" ADD CONSTRAINT "ServiceMaintenancePlan_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceMaintenanceOccurrence" ADD CONSTRAINT "ServiceMaintenanceOccurrence_planId_fkey" FOREIGN KEY ("planId") REFERENCES "ServiceMaintenancePlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceMaintenanceOccurrence" ADD CONSTRAINT "ServiceMaintenanceOccurrence_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "ServiceTicket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- M08 guards. No prior migration is edited or business data rewritten.
ALTER TABLE "ServiceTicket" ADD CONSTRAINT "ServiceTicket_values" CHECK ("version">0 AND "executionRevision">0 AND ("firstResponseAt" IS NULL OR "firstResponseAt">="openedAt") AND ("resolvedAt" IS NULL OR "resolvedAt">="openedAt") AND ("closedAt" IS NULL OR ("resolvedAt" IS NOT NULL AND "closedAt">="resolvedAt")) AND ("status" NOT IN ('RESOLVED','CLOSED') OR ("resolvedAt" IS NOT NULL AND "resolutionNotes" IS NOT NULL)) AND ("status"<>'CLOSED' OR "closedAt" IS NOT NULL));
ALTER TABLE "ServiceVisit" ADD CONSTRAINT "ServiceVisit_values" CHECK ("version">0 AND "executionRevision">0 AND "scheduledEndAt">"scheduledStartAt" AND "scheduledEndAt"<="scheduledStartAt"+interval '7 days' AND ("departedAt" IS NULL OR ("arrivedAt" IS NOT NULL AND "departedAt">="arrivedAt")) AND ("status"<>'IN_PROGRESS' OR "arrivedAt" IS NOT NULL) AND ("status"<>'COMPLETED' OR ("departedAt" IS NOT NULL AND "outcome" IS NOT NULL AND "workPerformed" IS NOT NULL)));
ALTER TABLE "ServiceVisit" ADD CONSTRAINT "ServiceVisit_no_overlap" EXCLUDE USING gist ("userId" WITH =,tstzrange("scheduledStartAt","scheduledEndAt",'[)') WITH &&) WHERE ("status" IN ('SCHEDULED','IN_PROGRESS'));
CREATE UNIQUE INDEX "ServiceVisit_one_running" ON "ServiceVisit"("userId") WHERE "status"='IN_PROGRESS';
CREATE UNIQUE INDEX "ServiceAssignment_one_active" ON "ServiceAssignment"("ticketId") WHERE "endedAt" IS NULL;
ALTER TABLE "ServiceAssignment" ADD CONSTRAINT "ServiceAssignment_dates" CHECK ("version">0 AND ("acknowledgedAt" IS NULL OR "acknowledgedAt">="assignedAt") AND ("endedAt" IS NULL OR "endedAt">="assignedAt"));
ALTER TABLE "ServiceRepairAction" ADD CONSTRAINT "ServiceRepairAction_values" CHECK ("version">0 AND "executionRevision">0 AND ("completedAt" IS NULL OR ("startedAt" IS NOT NULL AND "completedAt">="startedAt")) AND ("status"<>'COMPLETED' OR ("completedAt" IS NOT NULL AND "outcome" IS NOT NULL)) AND ("type"<>'COMPONENT_REPLACEMENT' OR "status" IN ('PLANNED','CANCELLED')));
ALTER TABLE "ServicePartRequest" ADD CONSTRAINT "ServicePartRequest_pending_only" CHECK ("version">0 AND "quantity">0 AND "status" IN ('PENDING_HANDOFF','CANCELLED') AND ("status"<>'CANCELLED' OR "dispositionNotes" IS NOT NULL));
ALTER TABLE "ServiceEvidence" ADD CONSTRAINT "ServiceEvidence_values" CHECK ("sizeBytes" BETWEEN 1 AND 10485760 AND "mimeType" IN ('image/jpeg','image/png','application/pdf') AND "storageKey" ~ '^[a-f0-9-]{36}\.(jpg|png|pdf)$');
ALTER TABLE "ServiceChecklistItem" ADD CONSTRAINT "ServiceChecklistItem_result" CHECK ("result" IN ('PASS','FAIL','NOT_APPLICABLE'));
ALTER TABLE "ServiceCustomerFeedback" ADD CONSTRAINT "ServiceCustomerFeedback_rating" CHECK ("rating" IS NULL OR "rating" BETWEEN 1 AND 5);
ALTER TABLE "ServiceSlaPolicy" ADD CONSTRAINT "ServiceSlaPolicy_values" CHECK ("revision">0 AND "firstResponseMinutes" BETWEEN 1 AND 525600 AND "resolutionMinutes" BETWEEN "firstResponseMinutes" AND 5256000 AND "clock"='ELAPSED_UTC_NO_PAUSE' AND ("effectiveTo" IS NULL OR "effectiveTo">"effectiveFrom"));
ALTER TABLE "ServiceMaintenancePlan" ADD CONSTRAINT "ServiceMaintenancePlan_values" CHECK ("version">0 AND "intervalDays" BETWEEN 1 AND 3650 AND "nextDueAt">="effectiveAt" AND "status" IN ('ACTIVE','PAUSED','CANCELLED'));
ALTER TABLE "ServiceMaintenanceOccurrence" ADD CONSTRAINT "ServiceMaintenanceOccurrence_finalization" CHECK (NOT ("completedAt" IS NOT NULL AND "cancelledAt" IS NOT NULL) AND ("completedAt" IS NULL OR "completionNotes" IS NOT NULL) AND ("cancelledAt" IS NULL OR "cancellationNotes" IS NOT NULL));
CREATE UNIQUE INDEX "ServiceMaintenanceOccurrence_one_pending" ON "ServiceMaintenanceOccurrence"("planId") WHERE "completedAt" IS NULL AND "cancelledAt" IS NULL;

CREATE FUNCTION "m08_immutable"() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Service historical record is immutable' USING ERRCODE='23514'; END; $$;
CREATE TRIGGER "ServiceDiagnosis_immutable" BEFORE UPDATE OR DELETE ON "ServiceDiagnosis" FOR EACH ROW EXECUTE FUNCTION "m08_immutable"();
CREATE TRIGGER "ServiceEvidence_immutable" BEFORE UPDATE OR DELETE ON "ServiceEvidence" FOR EACH ROW EXECUTE FUNCTION "m08_immutable"();
CREATE TRIGGER "ServiceChecklistItem_immutable" BEFORE UPDATE OR DELETE ON "ServiceChecklistItem" FOR EACH ROW EXECUTE FUNCTION "m08_immutable"();
CREATE TRIGGER "ServiceCustomerFeedback_immutable" BEFORE UPDATE OR DELETE ON "ServiceCustomerFeedback" FOR EACH ROW EXECUTE FUNCTION "m08_immutable"();
CREATE TRIGGER "ServiceClosureReview_immutable" BEFORE UPDATE OR DELETE ON "ServiceClosureReview" FOR EACH ROW EXECUTE FUNCTION "m08_immutable"();
CREATE TRIGGER "ServiceTicketHistory_immutable" BEFORE UPDATE OR DELETE ON "ServiceTicketHistory" FOR EACH ROW EXECUTE FUNCTION "m08_immutable"();
CREATE TRIGGER "ServiceSlaPolicy_immutable" BEFORE UPDATE OR DELETE ON "ServiceSlaPolicy" FOR EACH ROW EXECUTE FUNCTION "m08_immutable"();

CREATE FUNCTION "m08_version"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Cancel or archive service work, never delete history' USING ERRCODE='23514'; END IF;
 IF TG_OP='UPDATE' AND (NEW."id"<>OLD."id" OR NEW."version"<>OLD."version"+1) THEN RAISE EXCEPTION 'Immutable service identity or stale version' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER "ServiceAccessGrant_version" BEFORE UPDATE OR DELETE ON "ServiceAccessGrant" FOR EACH ROW EXECUTE FUNCTION "m08_version"();
CREATE TRIGGER "ServiceMaintenancePlan_version" BEFORE UPDATE OR DELETE ON "ServiceMaintenancePlan" FOR EACH ROW EXECUTE FUNCTION "m08_version"();
CREATE TRIGGER "ServicePartRequest_version" BEFORE UPDATE OR DELETE ON "ServicePartRequest" FOR EACH ROW EXECUTE FUNCTION "m08_version"();

CREATE FUNCTION "m08_access"() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM "User" WHERE "id"=NEW."grantedById" AND "role"='ADMIN' AND "isActive") OR (NEW."isActive" AND NOT EXISTS(SELECT 1 FROM "User" WHERE "id"=NEW."userId" AND "role"=NEW."role" AND "role" IN ('SUPPORT','WAREHOUSE') AND "isActive")) THEN RAISE EXCEPTION 'ADMIN grants explicit project scope to active service support/warehouse' USING ERRCODE='23514'; END IF;
 IF TG_OP='UPDATE' AND ROW(NEW."installationId",NEW."userId",NEW."createdAt") IS DISTINCT FROM ROW(OLD."installationId",OLD."userId",OLD."createdAt") THEN RAISE EXCEPTION 'Grant ownership is immutable' USING ERRCODE='23514'; END IF;
 RETURN NEW; END; $$;
CREATE TRIGGER "ServiceAccessGrant_guard" BEFORE INSERT OR UPDATE ON "ServiceAccessGrant" FOR EACH ROW EXECUTE FUNCTION "m08_access"();
CREATE FUNCTION "m08_operation"() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Service operation audit cannot be deleted' USING ERRCODE='23514'; END IF;
 IF TG_OP='UPDATE' AND (OLD."result"<>'{}'::jsonb OR (to_jsonb(NEW)-'result') IS DISTINCT FROM (to_jsonb(OLD)-'result')) THEN RAISE EXCEPTION 'Finalize service operation result once' USING ERRCODE='23514'; END IF;
 IF TG_OP='INSERT' AND NOT EXISTS(SELECT 1 FROM "User" WHERE "id"=NEW."actorId" AND "isActive" AND "role" IN ('ADMIN','SUPPORT','TECHNICIAN')) THEN RAISE EXCEPTION 'Active service actor required' USING ERRCODE='23514'; END IF;
 RETURN NEW; END; $$;
CREATE TRIGGER "ServiceOperation_guard" BEFORE INSERT OR UPDATE OR DELETE ON "ServiceOperation" FOR EACH ROW EXECUTE FUNCTION "m08_operation"();

CREATE FUNCTION "m08_ticket"() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE j "InstallationJob"%ROWTYPE; e "InstallationEquipment"%ROWTYPE; policy "ServiceSlaPolicy"%ROWTYPE; k text; check_result text;
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Service ticket history cannot be deleted' USING ERRCODE='23514'; END IF;
 SELECT * INTO j FROM "InstallationJob" WHERE "id"=NEW."installationId";
 IF NOT FOUND OR j."status"<>'COMMISSIONED' OR ROW(j."customerId",j."siteId") IS DISTINCT FROM ROW(NEW."customerId",NEW."siteId") OR NOT EXISTS(SELECT 1 FROM "InstallationCommissioningReview" WHERE "jobId"=j."id" AND "jobVersion"=j."approvedVersion" AND "decision"='APPROVED') THEN RAISE EXCEPTION 'Exact commissioned service project required; incomplete work remains M05' USING ERRCODE='23514'; END IF;
 IF NEW."equipmentId" IS NULL THEN IF NEW."serialUnitId" IS NOT NULL THEN RAISE EXCEPTION 'Serial needs installed equipment' USING ERRCODE='23514'; END IF;
 ELSE
  SELECT * INTO e FROM "InstallationEquipment" WHERE "id"=NEW."equipmentId" AND "jobId"=j."id";
  IF NOT FOUND OR e."installedQuantity"<=0 OR (e."serializationRequired" AND NOT EXISTS(SELECT 1 FROM "InstallationEquipmentSerial" WHERE "equipmentId"=e."id" AND "serialUnitId"=NEW."serialUnitId" AND "installedAt" IS NOT NULL)) OR (NOT e."serializationRequired" AND NEW."serialUnitId" IS NOT NULL) THEN RAISE EXCEPTION 'Original installed equipment/serial identity required' USING ERRCODE='23514'; END IF;
 END IF;
 IF NEW."warrantyClaimId" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "WarrantyClaim" c JOIN "WarrantyRegistration" w ON w."id"=c."registrationId" WHERE c."id"=NEW."warrantyClaimId" AND w."installationId"=j."id" AND (w."equipmentId" IS NULL OR w."equipmentId"=NEW."equipmentId") AND (w."serialUnitId" IS NULL OR w."serialUnitId"=NEW."serialUnitId")) THEN RAISE EXCEPTION 'Claim link must share original project/item identity' USING ERRCODE='23514'; END IF;
 IF NEW."slaPolicyId" IS NOT NULL THEN
  SELECT * INTO policy FROM "ServiceSlaPolicy" WHERE "id"=NEW."slaPolicyId";
  IF NOT FOUND OR ((TG_OP='INSERT' OR OLD."slaPolicyId" IS NULL) AND (policy."category"<>NEW."category" OR policy."priority"<>NEW."priority")) OR policy."effectiveFrom">NEW."openedAt" OR (policy."effectiveTo" IS NOT NULL AND policy."effectiveTo"<=NEW."openedAt") OR NEW."firstResponseDueAt" IS DISTINCT FROM NEW."openedAt"+make_interval(mins=>policy."firstResponseMinutes") OR NEW."resolutionDueAt" IS DISTINCT FROM NEW."openedAt"+make_interval(mins=>policy."resolutionMinutes") THEN RAISE EXCEPTION 'Explicit original SLA policy/due calculation required' USING ERRCODE='23514'; END IF;
 ELSE IF NEW."firstResponseDueAt" IS NOT NULL OR NEW."resolutionDueAt" IS NOT NULL THEN RAISE EXCEPTION 'No SLA promise without configured policy' USING ERRCODE='23514'; END IF; END IF;
 IF TG_OP='INSERT' THEN
  IF NEW."version"<>1 OR NEW."executionRevision"<>1 OR NEW."status"<>'OPEN' OR NEW."resolvedAt" IS NOT NULL OR NEW."closedAt" IS NOT NULL OR NEW."firstResponseAt" IS NOT NULL THEN RAISE EXCEPTION 'Create observed open complaint, never fabricated completion' USING ERRCODE='23514'; END IF;
 ELSE
  IF NEW."version"<>OLD."version"+1 OR ROW(NEW."id",NEW."reference",NEW."customerId",NEW."siteId",NEW."installationId",NEW."equipmentId",NEW."serialUnitId",NEW."warrantyClaimId",NEW."reportedIssue",NEW."channel",NEW."createdById",NEW."openedAt",NEW."createdAt") IS DISTINCT FROM ROW(OLD."id",OLD."reference",OLD."customerId",OLD."siteId",OLD."installationId",OLD."equipmentId",OLD."serialUnitId",OLD."warrantyClaimId",OLD."reportedIssue",OLD."channel",OLD."createdById",OLD."openedAt",OLD."createdAt") OR NOT (OLD."requiredChecks"<@NEW."requiredChecks") THEN RAISE EXCEPTION 'Immutable service identity, required checks or stale version' USING ERRCODE='23514'; END IF;
  IF OLD."slaPolicyId" IS NOT NULL AND ROW(NEW."slaPolicyId",NEW."slaSnapshot",NEW."firstResponseDueAt",NEW."resolutionDueAt") IS DISTINCT FROM ROW(OLD."slaPolicyId",OLD."slaSnapshot",OLD."firstResponseDueAt",OLD."resolutionDueAt") THEN RAISE EXCEPTION 'Original SLA clock cannot be reset silently' USING ERRCODE='23514'; END IF;
  IF OLD."firstResponseAt" IS NOT NULL AND NEW."firstResponseAt" IS DISTINCT FROM OLD."firstResponseAt" THEN RAISE EXCEPTION 'Original first response is immutable' USING ERRCODE='23514'; END IF;
  IF OLD."status"='CANCELLED' OR (OLD."status"='CLOSED' AND NEW."status"<>'REOPENED') THEN RAISE EXCEPTION 'Terminal service work requires explicit reopen when supported' USING ERRCODE='23514'; END IF;
  IF NEW."status" IS DISTINCT FROM OLD."status" AND NOT (
   (OLD."status" IN ('OPEN','REOPENED') AND NEW."status" IN ('TRIAGED','CANCELLED')) OR
   (OLD."status"='TRIAGED' AND NEW."status" IN ('ASSIGNED','RESOLVED','ON_HOLD','WAITING_FOR_CUSTOMER','WAITING_FOR_PARTS','CANCELLED')) OR
   (OLD."status"='ASSIGNED' AND NEW."status" IN ('VISIT_SCHEDULED','RESOLVED','ON_HOLD','WAITING_FOR_CUSTOMER','WAITING_FOR_PARTS','CANCELLED')) OR
   (OLD."status"='VISIT_SCHEDULED' AND NEW."status" IN ('IN_PROGRESS','ASSIGNED','ON_HOLD','WAITING_FOR_CUSTOMER','WAITING_FOR_PARTS','CANCELLED')) OR
   (OLD."status"='IN_PROGRESS' AND NEW."status" IN ('VISIT_SCHEDULED','RESOLVED','ON_HOLD','WAITING_FOR_CUSTOMER','WAITING_FOR_PARTS','CANCELLED')) OR
   (OLD."status" IN ('ON_HOLD','WAITING_FOR_CUSTOMER','WAITING_FOR_PARTS') AND NEW."status" IN ('TRIAGED','ASSIGNED','IN_PROGRESS','REOPENED','VISIT_SCHEDULED','CANCELLED')) OR
   (OLD."status"='RESOLVED' AND NEW."status" IN ('CLOSED','REOPENED')) OR (OLD."status"='CLOSED' AND NEW."status"='REOPENED')
  ) THEN RAISE EXCEPTION 'Invalid service transition' USING ERRCODE='23514'; END IF;
  IF NEW."status"='REOPENED' AND NEW."status" IS DISTINCT FROM OLD."status" THEN
   IF NEW."executionRevision"<>OLD."executionRevision"+1 OR NEW."resolvedAt" IS NOT NULL OR NEW."closedAt" IS NOT NULL OR EXISTS(SELECT 1 FROM "ServiceMaintenanceOccurrence" WHERE "ticketId"=OLD."id" AND "completedAt" IS NOT NULL) THEN RAISE EXCEPTION 'Explicit fresh service cycle required; finalized maintenance is preserved' USING ERRCODE='23514'; END IF;
  ELSIF NEW."executionRevision"<>OLD."executionRevision" THEN RAISE EXCEPTION 'Only reopening increments execution cycle' USING ERRCODE='23514'; END IF;
  IF NEW."status" IN ('RESOLVED','CLOSED') AND NEW."status" IS DISTINCT FROM OLD."status" THEN
   IF NEW."firstResponseAt" IS NULL OR (NEW."safetyConcern" AND NEW."safetyReviewedAt" IS NULL) OR EXISTS(SELECT 1 FROM "ServiceVisit" WHERE "ticketId"=NEW."id" AND "status" IN ('SCHEDULED','IN_PROGRESS')) OR EXISTS(SELECT 1 FROM "ServicePartRequest" WHERE "ticketId"=NEW."id" AND "status"='PENDING_HANDOFF') OR EXISTS(SELECT 1 FROM "ServiceRepairAction" WHERE "ticketId"=NEW."id" AND "executionRevision"=NEW."executionRevision" AND ("status" IN ('PLANNED','IN_PROGRESS') OR ("status"='COMPLETED' AND "followUpRequired"))) THEN RAISE EXCEPTION 'Unresolved mandatory service work blocks resolution/closure' USING ERRCODE='23514'; END IF;
   IF NEW."requiresVisit" AND NOT EXISTS(SELECT 1 FROM "ServiceVisit" WHERE "ticketId"=NEW."id" AND "executionRevision"=NEW."executionRevision" AND "status"='COMPLETED') THEN RAISE EXCEPTION 'Actual completed service visit required' USING ERRCODE='23514'; END IF;
   IF coalesce((SELECT "followUpRequired" FROM "ServiceVisit" WHERE "ticketId"=NEW."id" AND "executionRevision"=NEW."executionRevision" AND "status"='COMPLETED' ORDER BY "departedAt" DESC,"id" DESC LIMIT 1),false) THEN RAISE EXCEPTION 'Follow-up visit remains outstanding' USING ERRCODE='23514'; END IF;
   FOREACH k IN ARRAY NEW."requiredChecks" LOOP SELECT "result" INTO check_result FROM "ServiceChecklistItem" WHERE "ticketId"=NEW."id" AND "executionRevision"=NEW."executionRevision" AND "key"=k ORDER BY "ticketVersion" DESC LIMIT 1;IF check_result IS NULL OR check_result<>'PASS' THEN RAISE EXCEPTION 'Required service check unresolved' USING ERRCODE='23514'; END IF;END LOOP;
   IF NOT EXISTS(SELECT 1 FROM "ServiceEvidence" WHERE "ticketId"=NEW."id" AND "executionRevision"=NEW."executionRevision") THEN RAISE EXCEPTION 'Actual completion evidence required' USING ERRCODE='23514'; END IF;
   IF NEW."status"='CLOSED' AND NOT EXISTS(SELECT 1 FROM "ServiceClosureReview" WHERE "ticketId"=NEW."id" AND "ticketVersion"=OLD."version") THEN RAISE EXCEPTION 'Immutable exact-version closure review required' USING ERRCODE='23514'; END IF;
  END IF;
 END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER "ServiceTicket_guard" BEFORE INSERT OR UPDATE OR DELETE ON "ServiceTicket" FOR EACH ROW EXECUTE FUNCTION "m08_ticket"();

-- All field children share exact ticket ownership; immutable metadata is insert-only.
CREATE FUNCTION "m08_child"() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE t "ServiceTicket"%ROWTYPE; visit "ServiceVisit"%ROWTYPE;
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Preserve service child history' USING ERRCODE='23514'; END IF;
 SELECT * INTO t FROM "ServiceTicket" WHERE "id"=NEW."ticketId" FOR UPDATE;
 IF t."status" IN ('CLOSED','CANCELLED') OR NEW."executionRevision"<>t."executionRevision" THEN RAISE EXCEPTION 'Current mutable service cycle required' USING ERRCODE='23514'; END IF;
 IF t."status"='RESOLVED' THEN
  IF TG_TABLE_NAME<>'ServiceEvidence' THEN RAISE EXCEPTION 'Resolved execution is frozen' USING ERRCODE='23514';END IF;
  IF NEW."type"<>'CUSTOMER_ACKNOWLEDGEMENT' THEN RAISE EXCEPTION 'Only additive customer acknowledgement evidence after resolution' USING ERRCODE='23514';END IF;
 END IF;
 IF TG_TABLE_NAME='ServiceChecklistItem' THEN IF NEW."ticketVersion"<>t."version" THEN RAISE EXCEPTION 'Exact-version service check required' USING ERRCODE='23514';END IF;END IF;
 IF TG_TABLE_NAME IN ('ServiceDiagnosis','ServiceRepairAction') THEN
  SELECT * INTO visit FROM "ServiceVisit" WHERE "id"=NEW."visitId" AND "ticketId"=t."id";
  IF NOT FOUND OR visit."status"<>'IN_PROGRESS' OR visit."siteAccess"<>'CONFIRMED' OR visit."executionRevision"<>t."executionRevision" OR NEW."technicianId"<>visit."userId" THEN
   IF TG_TABLE_NAME<>'ServiceRepairAction' OR TG_OP<>'UPDATE' THEN RAISE EXCEPTION 'Technical records require actual running assigned visit' USING ERRCODE='23514'; END IF;
   IF NEW."status"<>'CANCELLED' THEN RAISE EXCEPTION 'Only explicit cancellation of unstarted repair may occur outside running visit' USING ERRCODE='23514'; END IF;
  END IF;
 END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER "ServiceDiagnosis_owner" BEFORE INSERT ON "ServiceDiagnosis" FOR EACH ROW EXECUTE FUNCTION "m08_child"();
CREATE TRIGGER "ServiceRepairAction_owner" BEFORE INSERT OR UPDATE OR DELETE ON "ServiceRepairAction" FOR EACH ROW EXECUTE FUNCTION "m08_child"();
CREATE TRIGGER "ServiceEvidence_owner" BEFORE INSERT ON "ServiceEvidence" FOR EACH ROW EXECUTE FUNCTION "m08_child"();
CREATE TRIGGER "ServiceChecklistItem_owner" BEFORE INSERT ON "ServiceChecklistItem" FOR EACH ROW EXECUTE FUNCTION "m08_child"();

CREATE FUNCTION "m08_repair"() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF TG_OP='INSERT' THEN IF NEW."status"<>'PLANNED' OR NEW."version"<>1 THEN RAISE EXCEPTION 'Plan repair before execution' USING ERRCODE='23514'; END IF;
 ELSE
  IF NEW."version"<>OLD."version"+1 OR ROW(NEW."id",NEW."ticketId",NEW."type",NEW."description",NEW."executionRevision",NEW."createdAt") IS DISTINCT FROM ROW(OLD."id",OLD."ticketId",OLD."type",OLD."description",OLD."executionRevision",OLD."createdAt") OR NOT ((OLD."status"='PLANNED' AND NEW."status" IN ('IN_PROGRESS','CANCELLED')) OR (OLD."status"='IN_PROGRESS' AND NEW."status"='COMPLETED') OR (OLD."status"='COMPLETED' AND OLD."followUpRequired" AND NEW."status"='PLANNED')) THEN RAISE EXCEPTION 'Versioned explicit repair lifecycle required' USING ERRCODE='23514'; END IF;
 END IF;RETURN NEW;END; $$;
CREATE TRIGGER "ServiceRepairAction_state" BEFORE INSERT OR UPDATE ON "ServiceRepairAction" FOR EACH ROW EXECUTE FUNCTION "m08_repair"();
CREATE FUNCTION "m08_part"() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 PERFORM 1 FROM "ServiceTicket" WHERE "id"=NEW."ticketId" AND "status" NOT IN ('CLOSED','CANCELLED','RESOLVED') FOR UPDATE;IF NOT FOUND THEN RAISE EXCEPTION 'Mutable ticket required for parts request' USING ERRCODE='23514'; END IF;
 IF TG_OP='INSERT' THEN IF NEW."status"<>'PENDING_HANDOFF' THEN RAISE EXCEPTION 'Only pending M04 handoff supported' USING ERRCODE='23514'; END IF;
 ELSE IF (to_jsonb(NEW)-ARRAY['status','dispositionNotes','version']) IS DISTINCT FROM (to_jsonb(OLD)-ARRAY['status','dispositionNotes','version']) OR OLD."status"<>'PENDING_HANDOFF' OR NEW."status"<>'CANCELLED' THEN RAISE EXCEPTION 'Only explicit pending request cancellation supported, no stock fulfillment' USING ERRCODE='23514'; END IF;END IF;RETURN NEW;END; $$;
CREATE TRIGGER "ServicePartRequest_guard" BEFORE INSERT OR UPDATE ON "ServicePartRequest" FOR EACH ROW EXECUTE FUNCTION "m08_part"();

CREATE FUNCTION "m08_feedback_review"() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE t "ServiceTicket"%ROWTYPE;
BEGIN
 SELECT * INTO t FROM "ServiceTicket" WHERE "id"=NEW."ticketId" FOR UPDATE;
 IF t."status"<>'RESOLVED' THEN RAISE EXCEPTION 'Actual resolved ticket required for feedback/closure' USING ERRCODE='23514'; END IF;
 IF TG_TABLE_NAME='ServiceCustomerFeedback' THEN
  IF NEW."ticketVersion"<>t."version" OR NEW."executionRevision"<>t."executionRevision" OR NEW."observedAt"<t."resolvedAt" OR NEW."observedAt">now() THEN RAISE EXCEPTION 'Observed post-resolution customer response required' USING ERRCODE='23514'; END IF;
 ELSE
  IF NEW."ticketVersion"<>t."version" OR NOT EXISTS(SELECT 1 FROM "User" WHERE "id"=NEW."reviewerId" AND "role"='ADMIN' AND "isActive") OR EXISTS(SELECT 1 FROM "ServiceTicketHistory" WHERE "ticketId"=t."id" AND "event"='RESOLVED' AND "actorId"=NEW."reviewerId") OR NOT (NEW."checklist" @> '{"mandatoryWorkReviewed":true,"customerResponseReviewed":true,"evidenceReviewed":true,"safetyReviewed":true}'::jsonb) OR NOT coalesce((SELECT "acknowledged" FROM "ServiceCustomerFeedback" WHERE "ticketId"=t."id" AND "executionRevision"=t."executionRevision" ORDER BY "ticketVersion" DESC LIMIT 1),false) THEN RAISE EXCEPTION 'Independent ADMIN exact-version review and attested customer acknowledgement required' USING ERRCODE='23514'; END IF;
 END IF;RETURN NEW;END; $$;
CREATE TRIGGER "ServiceCustomerFeedback_guard" BEFORE INSERT ON "ServiceCustomerFeedback" FOR EACH ROW EXECUTE FUNCTION "m08_feedback_review"();
CREATE TRIGGER "ServiceClosureReview_guard" BEFORE INSERT ON "ServiceClosureReview" FOR EACH ROW EXECUTE FUNCTION "m08_feedback_review"();

-- M06 source extension: same shared User lock, no competing workforce calendar.
CREATE FUNCTION "m08_assert_service_conflicts"(technician_id uuid,starts_at timestamptz,ends_at timestamptz,exclude_visit uuid DEFAULT NULL,exclude_survey uuid DEFAULT NULL,exclude_job uuid DEFAULT NULL,exclude_ticket uuid DEFAULT NULL) RETURNS void LANGUAGE plpgsql AS $$
DECLARE p "TechnicianProfile"%ROWTYPE; rest interval; assignments bigint;
BEGIN
 PERFORM 1 FROM "User" WHERE "id"=technician_id AND "role"='TECHNICIAN' AND "isActive" FOR UPDATE;IF NOT FOUND THEN RAISE EXCEPTION 'Active technician required' USING ERRCODE='23514'; END IF;
 SELECT * INTO p FROM "TechnicianProfile" WHERE "userId"=technician_id;rest:=make_interval(mins=>coalesce(p."minimumRestMinutes",0));
 IF EXISTS(SELECT 1 FROM "ServiceVisit" WHERE "userId"=technician_id AND "id" IS DISTINCT FROM exclude_visit AND "status" IN ('SCHEDULED','IN_PROGRESS') AND (("scheduledStartAt"<ends_at+rest AND "scheduledEndAt">starts_at-rest) OR ("status"='IN_PROGRESS' AND "scheduledEndAt"<=starts_at))) THEN RAISE EXCEPTION 'Committed or overdue service work/rest conflict' USING ERRCODE='23514'; END IF;
 IF p."enforceScheduling" THEN
  SELECT (SELECT count(*) FROM "ServiceAssignment" a JOIN "ServiceTicket" t ON t."id"=a."ticketId" WHERE a."userId"=technician_id AND a."endedAt" IS NULL AND t."id" IS DISTINCT FROM exclude_ticket AND t."status" NOT IN ('RESOLVED','CLOSED','CANCELLED'))+(SELECT count(*) FROM "SiteSurvey" WHERE "assignedToId"=technician_id AND "id" IS DISTINCT FROM exclude_survey AND "status" IN ('REQUESTED','SCHEDULED','IN_PROGRESS','SUBMITTED','REVISION_REQUIRED'))+(SELECT count(*) FROM "InstallationAssignment" a JOIN "InstallationJob" j ON j."id"=a."jobId" WHERE a."userId"=technician_id AND j."id" IS DISTINCT FROM exclude_job AND j."status" NOT IN ('COMMISSIONED','CANCELED')) INTO assignments;
  IF assignments>=p."maxActiveAssignments" THEN RAISE EXCEPTION 'Managed cross-module capacity exceeded' USING ERRCODE='23514'; END IF;
 END IF;
END; $$;
CREATE FUNCTION "m08_visit"() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE t "ServiceTicket"%ROWTYPE; a "ServiceAssignment"%ROWTYPE;
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Preserve visits and actual attendance history' USING ERRCODE='23514'; END IF;
 SELECT * INTO t FROM "ServiceTicket" WHERE "id"=NEW."ticketId" FOR UPDATE;SELECT * INTO a FROM "ServiceAssignment" WHERE "id"=NEW."assignmentId";
 PERFORM 1 FROM "User" WHERE "id"=NEW."userId" FOR UPDATE;
 IF t."status" IN ('CLOSED','CANCELLED','RESOLVED') OR NEW."executionRevision"<>t."executionRevision" OR a."endedAt" IS NOT NULL OR a."acknowledgedAt" IS NULL THEN RAISE EXCEPTION 'Current acknowledged visit assignment required' USING ERRCODE='23514'; END IF;
 IF TG_OP='INSERT' THEN IF NEW."status"<>'SCHEDULED' OR NEW."version"<>1 OR NEW."arrivedAt" IS NOT NULL OR NEW."departedAt" IS NOT NULL THEN RAISE EXCEPTION 'Schedule before actual execution' USING ERRCODE='23514'; END IF;
 ELSE
  IF NEW."version"<>OLD."version"+1 OR ROW(NEW."id",NEW."ticketId",NEW."assignmentId",NEW."userId",NEW."executionRevision",NEW."createdAt") IS DISTINCT FROM ROW(OLD."id",OLD."ticketId",OLD."assignmentId",OLD."userId",OLD."executionRevision",OLD."createdAt") OR NOT ((OLD."status"='SCHEDULED' AND NEW."status" IN ('SCHEDULED','IN_PROGRESS','CANCELLED')) OR (OLD."status"='IN_PROGRESS' AND NEW."status"='COMPLETED')) THEN RAISE EXCEPTION 'Versioned visit lifecycle required' USING ERRCODE='23514'; END IF;
  IF OLD."status"='IN_PROGRESS' AND (NEW."arrivedAt" IS DISTINCT FROM OLD."arrivedAt" OR ROW(NEW."scheduledStartAt",NEW."scheduledEndAt") IS DISTINCT FROM ROW(OLD."scheduledStartAt",OLD."scheduledEndAt")) THEN RAISE EXCEPTION 'Actual started visit cannot be rescheduled or arrival rewritten' USING ERRCODE='23514'; END IF;
 END IF;
 IF NEW."status" IN ('SCHEDULED','IN_PROGRESS') THEN PERFORM "m06_assert_interval"(NEW."userId",NEW."scheduledStartAt",NEW."scheduledEndAt",NULL,NULL);PERFORM "m08_assert_service_conflicts"(NEW."userId",NEW."scheduledStartAt",NEW."scheduledEndAt",NEW."id",NULL,NULL,NEW."ticketId");END IF;
 IF NEW."status"='COMPLETED' AND (EXISTS(SELECT 1 FROM "ServiceRepairAction" WHERE "visitId"=NEW."id" AND "status" IN ('PLANNED','IN_PROGRESS')) OR (NEW."siteAccess"='CONFIRMED' AND NOT EXISTS(SELECT 1 FROM "ServiceDiagnosis" WHERE "visitId"=NEW."id")) OR (NEW."siteAccess"='DENIED' AND NOT NEW."followUpRequired")) THEN RAISE EXCEPTION 'Observed diagnosis and disposed repair work required before departure' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER "ServiceVisit_guard" BEFORE INSERT OR UPDATE OR DELETE ON "ServiceVisit" FOR EACH ROW EXECUTE FUNCTION "m08_visit"();
CREATE FUNCTION "m08_assignment"() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'End assignments; preserve service authorization history' USING ERRCODE='23514'; END IF;
 PERFORM 1 FROM "User" WHERE "id"=NEW."userId" AND "role"='TECHNICIAN' AND "isActive" FOR UPDATE;IF NOT FOUND THEN RAISE EXCEPTION 'Active original technician identity required' USING ERRCODE='23514'; END IF;
 IF TG_OP='UPDATE' AND (NEW."version"<>OLD."version"+1 OR OLD."endedAt" IS NOT NULL OR ROW(NEW."id",NEW."ticketId",NEW."userId",NEW."assignedById",NEW."assignedAt") IS DISTINCT FROM ROW(OLD."id",OLD."ticketId",OLD."userId",OLD."assignedById",OLD."assignedAt") OR (OLD."acknowledgedAt" IS NOT NULL AND NEW."acknowledgedAt" IS DISTINCT FROM OLD."acknowledgedAt")) THEN RAISE EXCEPTION 'Only acknowledge or end current immutable assignment identity' USING ERRCODE='23514'; END IF;
 IF NEW."endedAt" IS NOT NULL AND EXISTS(SELECT 1 FROM "ServiceVisit" WHERE "assignmentId"=NEW."id" AND "status" IN ('SCHEDULED','IN_PROGRESS')) THEN RAISE EXCEPTION 'Complete/cancel active visits before ending assignment' USING ERRCODE='23514'; END IF;RETURN NEW;END; $$;
CREATE TRIGGER "ServiceAssignment_guard" BEFORE INSERT OR UPDATE OR DELETE ON "ServiceAssignment" FOR EACH ROW EXECUTE FUNCTION "m08_assignment"();

CREATE OR REPLACE FUNCTION "m06_has_work"(technician_id uuid,starts_at timestamptz,ends_at timestamptz) RETURNS boolean LANGUAGE sql AS $$
 SELECT EXISTS(SELECT 1 FROM "SiteSurvey" WHERE "assignedToId"=technician_id AND "status" IN ('SCHEDULED','IN_PROGRESS') AND "scheduledAt"<ends_at AND "scheduledEndAt">starts_at)
 OR EXISTS(SELECT 1 FROM "InstallationAssignment" a JOIN "InstallationJob" j ON j."id"=a."jobId" WHERE a."userId"=technician_id AND j."status" NOT IN ('COMMISSIONED','CANCELED') AND j."plannedStartAt"<ends_at AND j."plannedEndAt">starts_at)
 OR EXISTS(SELECT 1 FROM "ServiceVisit" WHERE "userId"=technician_id AND "status" IN ('SCHEDULED','IN_PROGRESS') AND (("scheduledStartAt"<ends_at AND "scheduledEndAt">starts_at) OR ("status"='IN_PROGRESS' AND "scheduledEndAt"<=starts_at)));
$$;
CREATE FUNCTION "m08_survey_conflict"() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF NEW."assignedToId" IS NOT NULL AND NEW."status" IN ('SCHEDULED','IN_PROGRESS') AND (TG_OP='INSERT' OR ROW(NEW."assignedToId",NEW."scheduledAt",NEW."scheduledEndAt",NEW."status") IS DISTINCT FROM ROW(OLD."assignedToId",OLD."scheduledAt",OLD."scheduledEndAt",OLD."status")) THEN PERFORM "m08_assert_service_conflicts"(NEW."assignedToId",NEW."scheduledAt",NEW."scheduledEndAt",NULL,NEW."id",NULL);END IF;RETURN NEW;END; $$;
CREATE TRIGGER "SiteSurvey_service_conflicts" BEFORE INSERT OR UPDATE ON "SiteSurvey" FOR EACH ROW EXECUTE FUNCTION "m08_survey_conflict"();
CREATE FUNCTION "m08_installation_conflict"() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE j "InstallationJob"%ROWTYPE; tech uuid;
BEGIN
 IF TG_TABLE_NAME='InstallationAssignment' THEN SELECT * INTO j FROM "InstallationJob" WHERE "id"=NEW."jobId";IF j."status" NOT IN ('COMMISSIONED','CANCELED') THEN PERFORM "m08_assert_service_conflicts"(NEW."userId",j."plannedStartAt",j."plannedEndAt",NULL,NULL,j."id");END IF;
 ELSE IF NEW."status" NOT IN ('COMMISSIONED','CANCELED') AND ROW(NEW."plannedStartAt",NEW."plannedEndAt") IS DISTINCT FROM ROW(OLD."plannedStartAt",OLD."plannedEndAt") THEN FOR tech IN SELECT "userId" FROM "InstallationAssignment" WHERE "jobId"=NEW."id" ORDER BY "userId" LOOP PERFORM "m08_assert_service_conflicts"(tech,NEW."plannedStartAt",NEW."plannedEndAt",NULL,NULL,NEW."id");END LOOP;END IF;END IF;RETURN NEW;END; $$;
CREATE TRIGGER "InstallationAssignment_service_conflicts" BEFORE INSERT OR UPDATE ON "InstallationAssignment" FOR EACH ROW EXECUTE FUNCTION "m08_installation_conflict"();
CREATE TRIGGER "InstallationJob_service_conflicts" BEFORE UPDATE ON "InstallationJob" FOR EACH ROW EXECUTE FUNCTION "m08_installation_conflict"();
CREATE FUNCTION "m08_user_obligations"() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE who uuid;
BEGIN
 IF TG_TABLE_NAME='User' THEN who:=NEW."id";IF NEW."role"='TECHNICIAN' AND NEW."isActive" THEN RETURN NEW;END IF;
 ELSE who:=NEW."userId";IF NEW."isActive" AND NEW."employmentStatus"='ACTIVE' THEN RETURN NEW;END IF;END IF;
 IF EXISTS(SELECT 1 FROM "ServiceAssignment" WHERE "userId"=who AND "endedAt" IS NULL) THEN RAISE EXCEPTION 'Resolve active service assignments before disabling technician' USING ERRCODE='23514'; END IF;RETURN NEW;END; $$;
CREATE TRIGGER "User_service_obligations" BEFORE UPDATE OF "role","isActive" ON "User" FOR EACH ROW EXECUTE FUNCTION "m08_user_obligations"();
CREATE TRIGGER "TechnicianProfile_service_obligations" BEFORE UPDATE ON "TechnicianProfile" FOR EACH ROW EXECUTE FUNCTION "m08_user_obligations"();

CREATE FUNCTION "m08_occurrence"() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE p "ServiceMaintenancePlan"%ROWTYPE; t "ServiceTicket"%ROWTYPE;
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Preserve maintenance occurrences' USING ERRCODE='23514'; END IF;
 SELECT * INTO p FROM "ServiceMaintenancePlan" WHERE "id"=NEW."planId" FOR UPDATE;SELECT * INTO t FROM "ServiceTicket" WHERE "id"=NEW."ticketId";
 IF t."installationId"<>p."installationId" OR t."category"<>'PREVENTIVE_MAINTENANCE' THEN RAISE EXCEPTION 'Maintenance ticket must share project/category' USING ERRCODE='23514'; END IF;
 IF TG_OP='INSERT' THEN IF p."status"<>'ACTIVE' OR NEW."dueAt" IS DISTINCT FROM p."nextDueAt" OR NEW."completedAt" IS NOT NULL OR NEW."cancelledAt" IS NOT NULL THEN RAISE EXCEPTION 'Generate exact configured maintenance occurrence' USING ERRCODE='23514'; END IF;
 ELSE IF OLD."completedAt" IS NOT NULL OR OLD."cancelledAt" IS NOT NULL OR ROW(NEW."id",NEW."planId",NEW."ticketId",NEW."dueAt") IS DISTINCT FROM ROW(OLD."id",OLD."planId",OLD."ticketId",OLD."dueAt") OR (NEW."completedAt" IS NULL AND NEW."cancelledAt" IS NULL) OR (NEW."completedAt" IS NOT NULL AND t."status" NOT IN ('RESOLVED','CLOSED')) OR (NEW."cancelledAt" IS NOT NULL AND t."status"<>'CANCELLED') THEN RAISE EXCEPTION 'Finalize occurrence explicitly against actual ticket outcome' USING ERRCODE='23514'; END IF;END IF;RETURN NEW;END; $$;
CREATE TRIGGER "ServiceMaintenanceOccurrence_guard" BEFORE INSERT OR UPDATE OR DELETE ON "ServiceMaintenanceOccurrence" FOR EACH ROW EXECUTE FUNCTION "m08_occurrence"();
CREATE FUNCTION "m08_plan"() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM "InstallationJob" WHERE "id"=NEW."installationId" AND "status"='COMMISSIONED') OR (TG_OP='INSERT' AND NOT EXISTS(SELECT 1 FROM "User" WHERE "id"=NEW."createdById" AND "role"='ADMIN')) THEN RAISE EXCEPTION 'Explicit ADMIN commissioned maintenance plan required' USING ERRCODE='23514'; END IF;
 IF TG_OP='UPDATE' AND (OLD."status"='CANCELLED' OR ROW(NEW."id",NEW."reference",NEW."installationId",NEW."category",NEW."intervalDays",NEW."effectiveAt",NEW."requiredChecks",NEW."createdById",NEW."createdAt") IS DISTINCT FROM ROW(OLD."id",OLD."reference",OLD."installationId",OLD."category",OLD."intervalDays",OLD."effectiveAt",OLD."requiredChecks",OLD."createdById",OLD."createdAt") OR (ROW(NEW."status",NEW."nextDueAt") IS DISTINCT FROM ROW(OLD."status",OLD."nextDueAt") AND EXISTS(SELECT 1 FROM "ServiceMaintenanceOccurrence" WHERE "planId"=OLD."id" AND "completedAt" IS NULL AND "cancelledAt" IS NULL))) THEN RAISE EXCEPTION 'Preserve configured maintenance terms and dispose pending occurrence before plan changes' USING ERRCODE='23514'; END IF;
 RETURN NEW;END; $$;
CREATE TRIGGER "ServiceMaintenancePlan_guard" BEFORE INSERT OR UPDATE ON "ServiceMaintenancePlan" FOR EACH ROW EXECUTE FUNCTION "m08_plan"();
COMMIT;
