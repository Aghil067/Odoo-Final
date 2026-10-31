BEGIN;
-- CreateEnum
CREATE TYPE "WarrantyCoverageType" AS ENUM ('MANUFACTURER_PRODUCT', 'MANUFACTURER_PERFORMANCE', 'INSTALLER_WORKMANSHIP', 'EXTENDED_COVERAGE');

-- CreateEnum
CREATE TYPE "WarrantyProviderType" AS ENUM ('MANUFACTURER', 'INSTALLER', 'THIRD_PARTY');

-- CreateEnum
CREATE TYPE "WarrantyDurationUnit" AS ENUM ('DAYS', 'MONTHS', 'YEARS');

-- CreateEnum
CREATE TYPE "WarrantyStartRule" AS ENUM ('DELIVERY_DATE', 'INSTALLATION_COMPLETION_DATE', 'COMMISSIONING_DATE', 'MANUFACTURER_REGISTRATION_DATE', 'PURCHASE_DATE', 'MANUAL_VERIFIED_DATE');

-- CreateEnum
CREATE TYPE "WarrantyRegistrationStatus" AS ENUM ('DRAFT', 'PENDING_EVIDENCE', 'PENDING_REVIEW', 'ACTIVE', 'REJECTED', 'VOIDED');

-- CreateEnum
CREATE TYPE "WarrantyClaimStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'EVIDENCE_REQUIRED', 'ELIGIBLE', 'INELIGIBLE', 'SUBMITTED_TO_PROVIDER', 'PROVIDER_RESPONSE_PENDING', 'APPROVED', 'DENIED', 'RESOLVED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "WarrantyDocumentType" AS ENUM ('WARRANTY_CERTIFICATE', 'MANUFACTURER_REGISTRATION', 'PURCHASE_PROOF', 'DELIVERY_PROOF', 'INSTALLATION_COMPLETION', 'CLAIM_PHOTO', 'INVESTIGATION_REPORT', 'PROVIDER_RESPONSE', 'OTHER');

-- CreateEnum
CREATE TYPE "WarrantyAssessmentResult" AS ENUM ('POTENTIALLY_ELIGIBLE', 'NOT_ELIGIBLE', 'NEEDS_EVIDENCE', 'NEEDS_MANUAL_REVIEW');

-- CreateTable
CREATE TABLE "WarrantyPolicy" (
    "id" UUID NOT NULL,
    "reference" VARCHAR(64) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "currentVersion" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "WarrantyPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WarrantyPolicyVersion" (
    "id" UUID NOT NULL,
    "policyId" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "coverageType" "WarrantyCoverageType" NOT NULL,
    "providerType" "WarrantyProviderType" NOT NULL,
    "providerName" VARCHAR(200) NOT NULL,
    "applicableComponentId" UUID,
    "applicableCategory" "SolarComponentCategory",
    "duration" INTEGER NOT NULL,
    "durationUnit" "WarrantyDurationUnit" NOT NULL,
    "startRule" "WarrantyStartRule" NOT NULL,
    "coverageDescription" VARCHAR(5000) NOT NULL,
    "exclusions" VARCHAR(5000),
    "claimConditions" VARCHAR(5000),
    "requiredDocuments" "WarrantyDocumentType"[],
    "claimRequiredDocuments" "WarrantyDocumentType"[],
    "requiresProviderRegistration" BOOLEAN NOT NULL,
    "registrationDeadlineDays" INTEGER,
    "effectiveFrom" DATE NOT NULL,
    "effectiveTo" DATE,
    "backdatingReason" VARCHAR(2000),
    "publishedById" UUID NOT NULL,
    "publicationReason" VARCHAR(2000) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WarrantyPolicyVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WarrantyAccessGrant" (
    "id" UUID NOT NULL,
    "installationId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "grantedById" UUID NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "WarrantyAccessGrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WarrantyOperation" (
    "id" UUID NOT NULL,
    "idempotencyKey" VARCHAR(100) NOT NULL,
    "kind" VARCHAR(60) NOT NULL,
    "requestHash" CHAR(64) NOT NULL,
    "actorId" UUID NOT NULL,
    "reason" VARCHAR(2000) NOT NULL,
    "result" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WarrantyOperation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WarrantyRegistration" (
    "id" UUID NOT NULL,
    "reference" VARCHAR(60) NOT NULL,
    "coverageKey" VARCHAR(200) NOT NULL,
    "customerId" UUID NOT NULL,
    "siteId" UUID NOT NULL,
    "installationId" UUID NOT NULL,
    "commissioningReviewId" UUID NOT NULL,
    "policyId" UUID NOT NULL,
    "policyVersion" INTEGER NOT NULL,
    "coverageType" "WarrantyCoverageType" NOT NULL,
    "equipmentId" UUID,
    "componentId" UUID,
    "serialUnitId" UUID,
    "coverageQuantity" DECIMAL(18,3) NOT NULL,
    "policySnapshot" JSONB NOT NULL,
    "installationSnapshot" JSONB NOT NULL,
    "status" "WarrantyRegistrationStatus" NOT NULL DEFAULT 'DRAFT',
    "proposedStartDate" DATE,
    "dateSourceNotes" VARCHAR(3000),
    "providerRegistrationReference" VARCHAR(160),
    "providerRegisteredAt" DATE,
    "verifiedStartDate" DATE,
    "expiresAt" DATE,
    "registeredById" UUID NOT NULL,
    "approvedById" UUID,
    "approvedVersion" INTEGER,
    "activatedAt" TIMESTAMPTZ(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "WarrantyRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WarrantyClaim" (
    "id" UUID NOT NULL,
    "reference" VARCHAR(60) NOT NULL,
    "registrationId" UUID NOT NULL,
    "reportedIssue" VARCHAR(5000) NOT NULL,
    "failureDate" DATE,
    "claimType" VARCHAR(100) NOT NULL,
    "priority" VARCHAR(20) NOT NULL,
    "status" "WarrantyClaimStatus" NOT NULL DEFAULT 'SUBMITTED',
    "submittedById" UUID NOT NULL,
    "responsibleReviewerId" UUID,
    "providerClaimReference" VARCHAR(160),
    "investigationNotes" VARCHAR(5000),
    "finalDecision" VARCHAR(20),
    "decisionDate" TIMESTAMPTZ(3),
    "resolution" VARCHAR(5000),
    "resolvedAt" TIMESTAMPTZ(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "contentRevision" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "WarrantyClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WarrantyEvidence" (
    "id" UUID NOT NULL,
    "registrationId" UUID NOT NULL,
    "claimId" UUID,
    "documentType" "WarrantyDocumentType" NOT NULL,
    "fileName" VARCHAR(160) NOT NULL,
    "mimeType" VARCHAR(100) NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "sha256" CHAR(64) NOT NULL,
    "storageKey" VARCHAR(100) NOT NULL,
    "uploaderId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WarrantyEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WarrantyClaimAssessment" (
    "id" UUID NOT NULL,
    "claimId" UUID NOT NULL,
    "assessorId" UUID NOT NULL,
    "claimVersion" INTEGER NOT NULL,
    "contentRevision" INTEGER NOT NULL,
    "result" "WarrantyAssessmentResult" NOT NULL,
    "policyVersion" INTEGER NOT NULL,
    "rulesSnapshot" JSONB NOT NULL,
    "findings" JSONB NOT NULL,
    "attestation" JSONB NOT NULL,
    "notes" VARCHAR(5000) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WarrantyClaimAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WarrantyProviderResponse" (
    "id" UUID NOT NULL,
    "claimId" UUID NOT NULL,
    "recordedById" UUID NOT NULL,
    "providerReference" VARCHAR(160) NOT NULL,
    "response" VARCHAR(30) NOT NULL,
    "respondedAt" DATE NOT NULL,
    "notes" VARCHAR(5000) NOT NULL,
    "evidenceIds" UUID[],
    "claimVersion" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WarrantyProviderResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WarrantyHistory" (
    "id" UUID NOT NULL,
    "registrationId" UUID NOT NULL,
    "claimId" UUID,
    "entityKey" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "actorId" UUID NOT NULL,
    "operationId" UUID,
    "event" VARCHAR(60) NOT NULL,
    "fromStatus" VARCHAR(40),
    "toStatus" VARCHAR(40) NOT NULL,
    "reason" VARCHAR(2000) NOT NULL,
    "details" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WarrantyHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WarrantyDecision" (
    "id" UUID NOT NULL,
    "registrationId" UUID NOT NULL,
    "claimId" UUID,
    "entityKey" UUID NOT NULL,
    "reviewedVersion" INTEGER NOT NULL,
    "reviewerId" UUID NOT NULL,
    "operationId" UUID NOT NULL,
    "decision" VARCHAR(40) NOT NULL,
    "notes" VARCHAR(5000) NOT NULL,
    "checklist" JSONB NOT NULL,
    "snapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WarrantyDecision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WarrantyPolicy_reference_key" ON "WarrantyPolicy"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "WarrantyPolicyVersion_policyId_version_key" ON "WarrantyPolicyVersion"("policyId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "WarrantyAccessGrant_installationId_userId_key" ON "WarrantyAccessGrant"("installationId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "WarrantyOperation_idempotencyKey_key" ON "WarrantyOperation"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "WarrantyRegistration_reference_key" ON "WarrantyRegistration"("reference");

-- CreateIndex
CREATE INDEX "WarrantyRegistration_status_expiresAt_id_idx" ON "WarrantyRegistration"("status", "expiresAt", "id");

-- CreateIndex
CREATE INDEX "WarrantyRegistration_installationId_policyId_idx" ON "WarrantyRegistration"("installationId", "policyId");

-- CreateIndex
CREATE UNIQUE INDEX "WarrantyClaim_reference_key" ON "WarrantyClaim"("reference");

-- CreateIndex
CREATE INDEX "WarrantyClaim_status_createdAt_id_idx" ON "WarrantyClaim"("status", "createdAt", "id");

-- CreateIndex
CREATE UNIQUE INDEX "WarrantyClaim_id_registrationId_key" ON "WarrantyClaim"("id", "registrationId");

-- CreateIndex
CREATE UNIQUE INDEX "WarrantyEvidence_storageKey_key" ON "WarrantyEvidence"("storageKey");

-- CreateIndex
CREATE INDEX "WarrantyEvidence_registrationId_claimId_createdAt_idx" ON "WarrantyEvidence"("registrationId", "claimId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "WarrantyClaimAssessment_claimId_claimVersion_key" ON "WarrantyClaimAssessment"("claimId", "claimVersion");

-- CreateIndex
CREATE UNIQUE INDEX "WarrantyProviderResponse_claimId_claimVersion_key" ON "WarrantyProviderResponse"("claimId", "claimVersion");

-- CreateIndex
CREATE UNIQUE INDEX "WarrantyHistory_entityKey_version_key" ON "WarrantyHistory"("entityKey", "version");

-- CreateIndex
CREATE UNIQUE INDEX "WarrantyDecision_entityKey_reviewedVersion_key" ON "WarrantyDecision"("entityKey", "reviewedVersion");

-- AddForeignKey
ALTER TABLE "WarrantyPolicy" ADD CONSTRAINT "WarrantyPolicy_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarrantyPolicyVersion" ADD CONSTRAINT "WarrantyPolicyVersion_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "WarrantyPolicy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarrantyPolicyVersion" ADD CONSTRAINT "WarrantyPolicyVersion_applicableComponentId_fkey" FOREIGN KEY ("applicableComponentId") REFERENCES "SolarComponent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarrantyPolicyVersion" ADD CONSTRAINT "WarrantyPolicyVersion_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarrantyAccessGrant" ADD CONSTRAINT "WarrantyAccessGrant_installationId_fkey" FOREIGN KEY ("installationId") REFERENCES "InstallationJob"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarrantyAccessGrant" ADD CONSTRAINT "WarrantyAccessGrant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarrantyAccessGrant" ADD CONSTRAINT "WarrantyAccessGrant_grantedById_fkey" FOREIGN KEY ("grantedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarrantyOperation" ADD CONSTRAINT "WarrantyOperation_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarrantyRegistration" ADD CONSTRAINT "WarrantyRegistration_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarrantyRegistration" ADD CONSTRAINT "WarrantyRegistration_siteId_customerId_fkey" FOREIGN KEY ("siteId", "customerId") REFERENCES "Site"("id", "customerId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarrantyRegistration" ADD CONSTRAINT "WarrantyRegistration_installationId_fkey" FOREIGN KEY ("installationId") REFERENCES "InstallationJob"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarrantyRegistration" ADD CONSTRAINT "WarrantyRegistration_commissioningReviewId_fkey" FOREIGN KEY ("commissioningReviewId") REFERENCES "InstallationCommissioningReview"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarrantyRegistration" ADD CONSTRAINT "WarrantyRegistration_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "WarrantyPolicy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarrantyRegistration" ADD CONSTRAINT "WarrantyRegistration_policyId_policyVersion_fkey" FOREIGN KEY ("policyId", "policyVersion") REFERENCES "WarrantyPolicyVersion"("policyId", "version") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarrantyRegistration" ADD CONSTRAINT "WarrantyRegistration_equipmentId_installationId_fkey" FOREIGN KEY ("equipmentId", "installationId") REFERENCES "InstallationEquipment"("id", "jobId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarrantyRegistration" ADD CONSTRAINT "WarrantyRegistration_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "SolarComponent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarrantyRegistration" ADD CONSTRAINT "WarrantyRegistration_serialUnitId_fkey" FOREIGN KEY ("serialUnitId") REFERENCES "InventorySerialUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarrantyRegistration" ADD CONSTRAINT "WarrantyRegistration_registeredById_fkey" FOREIGN KEY ("registeredById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarrantyRegistration" ADD CONSTRAINT "WarrantyRegistration_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarrantyClaim" ADD CONSTRAINT "WarrantyClaim_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "WarrantyRegistration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarrantyClaim" ADD CONSTRAINT "WarrantyClaim_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarrantyClaim" ADD CONSTRAINT "WarrantyClaim_responsibleReviewerId_fkey" FOREIGN KEY ("responsibleReviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarrantyEvidence" ADD CONSTRAINT "WarrantyEvidence_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "WarrantyRegistration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarrantyEvidence" ADD CONSTRAINT "WarrantyEvidence_claimId_registrationId_fkey" FOREIGN KEY ("claimId", "registrationId") REFERENCES "WarrantyClaim"("id", "registrationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarrantyEvidence" ADD CONSTRAINT "WarrantyEvidence_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarrantyClaimAssessment" ADD CONSTRAINT "WarrantyClaimAssessment_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "WarrantyClaim"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarrantyClaimAssessment" ADD CONSTRAINT "WarrantyClaimAssessment_assessorId_fkey" FOREIGN KEY ("assessorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarrantyProviderResponse" ADD CONSTRAINT "WarrantyProviderResponse_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "WarrantyClaim"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarrantyProviderResponse" ADD CONSTRAINT "WarrantyProviderResponse_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarrantyHistory" ADD CONSTRAINT "WarrantyHistory_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "WarrantyRegistration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarrantyHistory" ADD CONSTRAINT "WarrantyHistory_claimId_registrationId_fkey" FOREIGN KEY ("claimId", "registrationId") REFERENCES "WarrantyClaim"("id", "registrationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarrantyHistory" ADD CONSTRAINT "WarrantyHistory_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarrantyHistory" ADD CONSTRAINT "WarrantyHistory_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "WarrantyOperation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarrantyDecision" ADD CONSTRAINT "WarrantyDecision_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "WarrantyRegistration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarrantyDecision" ADD CONSTRAINT "WarrantyDecision_claimId_registrationId_fkey" FOREIGN KEY ("claimId", "registrationId") REFERENCES "WarrantyClaim"("id", "registrationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarrantyDecision" ADD CONSTRAINT "WarrantyDecision_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarrantyDecision" ADD CONSTRAINT "WarrantyDecision_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "WarrantyOperation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- M07 invariants. Historical M01-M06 rows/migrations are not rewritten.
ALTER TABLE "WarrantyPolicy" ADD CONSTRAINT "WarrantyPolicy_values_check" CHECK ("version">0 AND "currentVersion">0);
ALTER TABLE "WarrantyPolicyVersion" ADD CONSTRAINT "WarrantyPolicyVersion_values_check" CHECK (
 "version">0 AND "duration">0 AND (("durationUnit"='DAYS' AND "duration"<=36600) OR ("durationUnit"='MONTHS' AND "duration"<=1200) OR ("durationUnit"='YEARS' AND "duration"<=100))
 AND ("effectiveTo" IS NULL OR "effectiveTo">"effectiveFrom") AND ("registrationDeadlineDays" IS NULL OR "registrationDeadlineDays" BETWEEN 0 AND 36500)
 AND (("coverageType"='INSTALLER_WORKMANSHIP' AND "providerType"='INSTALLER' AND "applicableComponentId" IS NULL AND "applicableCategory" IS NULL) OR ("coverageType"<>'INSTALLER_WORKMANSHIP' AND (("applicableComponentId" IS NULL)<>("applicableCategory" IS NULL))))
 AND ("coverageType" NOT IN ('MANUFACTURER_PRODUCT','MANUFACTURER_PERFORMANCE') OR "providerType"='MANUFACTURER'));
ALTER TABLE "WarrantyRegistration" ADD CONSTRAINT "WarrantyRegistration_values_check" CHECK (
 "version">0 AND "policyVersion">0 AND "coverageQuantity">0 AND jsonb_typeof("policySnapshot")='object' AND jsonb_typeof("installationSnapshot")='object'
 AND (("verifiedStartDate" IS NULL)=("expiresAt" IS NULL)) AND ("expiresAt" IS NULL OR "expiresAt">"verifiedStartDate")
 AND ("status"<>'ACTIVE' OR ("verifiedStartDate" IS NOT NULL AND "approvedVersion" IS NOT NULL AND "approvedById" IS NOT NULL AND "activatedAt" IS NOT NULL)));
CREATE UNIQUE INDEX "WarrantyRegistration_unique_coverage" ON "WarrantyRegistration"("coverageKey") WHERE "status" NOT IN ('REJECTED','VOIDED');
ALTER TABLE "WarrantyClaim" ADD CONSTRAINT "WarrantyClaim_values_check" CHECK ("version">0 AND "contentRevision">0 AND "priority" IN ('LOW','NORMAL','HIGH','URGENT') AND ("finalDecision" IS NULL OR "finalDecision" IN ('APPROVED','DENIED')) AND (("finalDecision" IS NULL)=("decisionDate" IS NULL)) AND ("status"<>'APPROVED' OR "finalDecision"='APPROVED') AND ("status"<>'DENIED' OR "finalDecision"='DENIED'));
ALTER TABLE "WarrantyEvidence" ADD CONSTRAINT "WarrantyEvidence_values_check" CHECK ("sizeBytes" BETWEEN 1 AND 10485760 AND "mimeType" IN ('image/jpeg','image/png','application/pdf') AND "storageKey" ~ '^[a-f0-9-]{36}\.(jpg|png|pdf)$');
ALTER TABLE "WarrantyProviderResponse" ADD CONSTRAINT "WarrantyProviderResponse_values_check" CHECK ("response" IN ('APPROVED','DENIED','EVIDENCE_REQUIRED','INFORMATION') AND "claimVersion">0);
ALTER TABLE "WarrantyClaimAssessment" ADD CONSTRAINT "WarrantyClaimAssessment_values_check" CHECK ("claimVersion">0 AND "contentRevision">0 AND "policyVersion">0 AND jsonb_typeof("rulesSnapshot")='object' AND jsonb_typeof("attestation")='object' AND jsonb_typeof("findings")='array');
ALTER TABLE "WarrantyHistory" ADD CONSTRAINT "WarrantyHistory_owner_check" CHECK ("version">0 AND "entityKey"=coalesce("claimId","registrationId") AND jsonb_typeof("details")='object');
ALTER TABLE "WarrantyDecision" ADD CONSTRAINT "WarrantyDecision_owner_check" CHECK ("reviewedVersion">0 AND "entityKey"=coalesce("claimId","registrationId") AND jsonb_typeof("snapshot")='object' AND jsonb_typeof("checklist")='object');
CREATE FUNCTION "m07_immutable"() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Warranty terms/evidence/decisions/history are immutable' USING ERRCODE='23514'; END; $$;
CREATE TRIGGER "WarrantyPolicyVersion_immutable" BEFORE UPDATE OR DELETE ON "WarrantyPolicyVersion" FOR EACH ROW EXECUTE FUNCTION "m07_immutable"();
CREATE TRIGGER "WarrantyEvidence_immutable" BEFORE UPDATE OR DELETE ON "WarrantyEvidence" FOR EACH ROW EXECUTE FUNCTION "m07_immutable"();
CREATE TRIGGER "WarrantyClaimAssessment_immutable" BEFORE UPDATE OR DELETE ON "WarrantyClaimAssessment" FOR EACH ROW EXECUTE FUNCTION "m07_immutable"();
CREATE TRIGGER "WarrantyProviderResponse_immutable" BEFORE UPDATE OR DELETE ON "WarrantyProviderResponse" FOR EACH ROW EXECUTE FUNCTION "m07_immutable"();
CREATE TRIGGER "WarrantyHistory_immutable" BEFORE UPDATE OR DELETE ON "WarrantyHistory" FOR EACH ROW EXECUTE FUNCTION "m07_immutable"();
CREATE TRIGGER "WarrantyDecision_immutable" BEFORE UPDATE OR DELETE ON "WarrantyDecision" FOR EACH ROW EXECUTE FUNCTION "m07_immutable"();
CREATE FUNCTION "m07_policy_guard"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Deactivate warranty policies instead of deleting history' USING ERRCODE='23514'; END IF;
 IF NEW."id"<>OLD."id" OR NEW."reference"<>OLD."reference" OR NEW."createdById"<>OLD."createdById" OR NEW."version"<>OLD."version"+1 OR NEW."currentVersion" NOT IN (OLD."currentVersion",OLD."currentVersion"+1) THEN RAISE EXCEPTION 'Immutable policy identity or stale header version' USING ERRCODE='23514'; END IF;
 IF NEW."currentVersion"<>OLD."currentVersion" AND NOT EXISTS(SELECT 1 FROM "WarrantyPolicyVersion" WHERE "policyId"=NEW."id" AND "version"=NEW."currentVersion") THEN RAISE EXCEPTION 'Publish immutable revision before advancing policy head' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER "WarrantyPolicy_guard" BEFORE UPDATE OR DELETE ON "WarrantyPolicy" FOR EACH ROW EXECUTE FUNCTION "m07_policy_guard"();
CREATE FUNCTION "m07_policy_version_guard"() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE p "WarrantyPolicy"%ROWTYPE;
BEGIN
 SELECT * INTO p FROM "WarrantyPolicy" WHERE "id"=NEW."policyId" FOR UPDATE;
 IF NOT FOUND OR NOT p."isActive" OR NOT EXISTS(SELECT 1 FROM "User" WHERE "id"=NEW."publishedById" AND "role"='ADMIN' AND "isActive") OR NOT ((NEW."version"=1 AND NOT EXISTS(SELECT 1 FROM "WarrantyPolicyVersion" WHERE "policyId"=p."id")) OR NEW."version"=p."currentVersion"+1) THEN RAISE EXCEPTION 'Publish current active policy through an active ADMIN' USING ERRCODE='23514'; END IF;
 IF NEW."effectiveFrom"<(now() AT TIME ZONE 'UTC')::date AND (NEW."backdatingReason" IS NULL OR length(btrim(NEW."backdatingReason"))=0) THEN RAISE EXCEPTION 'Explicit authorized retrospective-effect reason is required' USING ERRCODE='23514'; END IF;
 IF EXISTS(SELECT 1 FROM "WarrantyPolicyVersion" WHERE "policyId"=p."id" AND ("coverageType"<>NEW."coverageType" OR "providerType"<>NEW."providerType")) THEN RAISE EXCEPTION 'Different coverage/provider kind requires a distinct policy identity' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER "WarrantyPolicyVersion_guard" BEFORE INSERT ON "WarrantyPolicyVersion" FOR EACH ROW EXECUTE FUNCTION "m07_policy_version_guard"();
CREATE FUNCTION "m07_expiry"(start_date date,duration integer,unit text) RETURNS date LANGUAGE sql IMMUTABLE AS $$
 SELECT CASE unit WHEN 'DAYS' THEN start_date+duration WHEN 'MONTHS' THEN (start_date+make_interval(months=>duration))::date WHEN 'YEARS' THEN (start_date+make_interval(years=>duration))::date END;
$$;
CREATE FUNCTION "m07_registration_guard"() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE j "InstallationJob"%ROWTYPE; p "WarrantyPolicyVersion"%ROWTYPE; e "InstallationEquipment"%ROWTYPE; header "WarrantyPolicy"%ROWTYPE; expected_key text; source_date date;
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Void registrations; do not delete coverage history' USING ERRCODE='23514'; END IF;
 SELECT * INTO j FROM "InstallationJob" WHERE "id"=NEW."installationId";
 SELECT * INTO p FROM "WarrantyPolicyVersion" WHERE "policyId"=NEW."policyId" AND "version"=NEW."policyVersion";
 SELECT * INTO header FROM "WarrantyPolicy" WHERE "id"=NEW."policyId";
 IF j."status"<>'COMMISSIONED' OR ROW(j."customerId",j."siteId") IS DISTINCT FROM ROW(NEW."customerId",NEW."siteId") OR NEW."coverageType"<>p."coverageType" OR NOT EXISTS(SELECT 1 FROM "InstallationCommissioningReview" WHERE "id"=NEW."commissioningReviewId" AND "jobId"=j."id" AND "jobVersion"=j."approvedVersion" AND "decision"='APPROVED') THEN RAISE EXCEPTION 'Exact commissioned project/review identity required' USING ERRCODE='23514'; END IF;
 IF p."coverageType"='INSTALLER_WORKMANSHIP' THEN
  IF NEW."equipmentId" IS NOT NULL OR NEW."serialUnitId" IS NOT NULL OR NEW."componentId" IS NOT NULL OR NEW."coverageQuantity"<>1 THEN RAISE EXCEPTION 'Workmanship is distinct project/site coverage' USING ERRCODE='23514'; END IF;
  expected_key:=NEW."policyId"::text||':'||j."id"::text||':WORKMANSHIP';
 ELSE
  SELECT * INTO e FROM "InstallationEquipment" WHERE "id"=NEW."equipmentId" AND "jobId"=j."id";
  IF NOT FOUND OR e."installedQuantity"<=0 OR NEW."componentId" IS DISTINCT FROM e."componentId" OR (p."applicableComponentId" IS NOT NULL AND p."applicableComponentId"<>e."componentId") OR (p."applicableCategory" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "SolarComponent" WHERE "id"=e."componentId" AND "category"=p."applicableCategory")) THEN RAISE EXCEPTION 'Warranty target must match installed component and policy' USING ERRCODE='23514'; END IF;
  IF e."serializationRequired" THEN
   IF NEW."coverageQuantity"<>1 OR NOT EXISTS(SELECT 1 FROM "InstallationEquipmentSerial" WHERE "equipmentId"=e."id" AND "serialUnitId"=NEW."serialUnitId" AND "installedAt" IS NOT NULL) THEN RAISE EXCEPTION 'Exact installed original serial required' USING ERRCODE='23514'; END IF;
   expected_key:=NEW."policyId"::text||':'||j."id"::text||':SERIAL:'||NEW."serialUnitId"::text;
  ELSE
   IF NEW."serialUnitId" IS NOT NULL OR NEW."coverageQuantity"<>e."installedQuantity" THEN RAISE EXCEPTION 'Nonserialized policy covers full installed line quantity without invented serials' USING ERRCODE='23514'; END IF;
   expected_key:=NEW."policyId"::text||':'||j."id"::text||':EQUIPMENT:'||e."id"::text;
  END IF;
 END IF;
 IF NEW."coverageKey"<>expected_key THEN RAISE EXCEPTION 'Canonical exact policy/item coverage identity required' USING ERRCODE='23514'; END IF;
 IF TG_OP='INSERT' THEN
  IF NEW."status"<>'DRAFT' OR NEW."version"<>1 OR NOT header."isActive" OR header."currentVersion"<>NEW."policyVersion" OR NEW."verifiedStartDate" IS NOT NULL THEN RAISE EXCEPTION 'Create draft current-policy registration without invented activation dates' USING ERRCODE='23514'; END IF;
 ELSE
  IF OLD."status"='VOIDED' OR NEW."version"<>OLD."version"+1 OR ROW(NEW."id",NEW."reference",NEW."coverageKey",NEW."customerId",NEW."siteId",NEW."installationId",NEW."commissioningReviewId",NEW."policyId",NEW."policyVersion",NEW."coverageType",NEW."equipmentId",NEW."componentId",NEW."serialUnitId",NEW."coverageQuantity",NEW."policySnapshot",NEW."installationSnapshot",NEW."registeredById",NEW."createdAt") IS DISTINCT FROM ROW(OLD."id",OLD."reference",OLD."coverageKey",OLD."customerId",OLD."siteId",OLD."installationId",OLD."commissioningReviewId",OLD."policyId",OLD."policyVersion",OLD."coverageType",OLD."equipmentId",OLD."componentId",OLD."serialUnitId",OLD."coverageQuantity",OLD."policySnapshot",OLD."installationSnapshot",OLD."registeredById",OLD."createdAt") THEN RAISE EXCEPTION 'Immutable registration identity/snapshots or stale version' USING ERRCODE='23514'; END IF;
  IF NEW."status" IS DISTINCT FROM OLD."status" AND NOT ((OLD."status" IN ('DRAFT','PENDING_EVIDENCE') AND NEW."status" IN ('PENDING_EVIDENCE','PENDING_REVIEW','VOIDED')) OR (OLD."status"='PENDING_REVIEW' AND NEW."status" IN ('ACTIVE','REJECTED','VOIDED')) OR (OLD."status" IN ('ACTIVE','REJECTED') AND NEW."status"='VOIDED')) THEN RAISE EXCEPTION 'Invalid registration transition' USING ERRCODE='23514'; END IF;
  IF OLD."status" NOT IN ('DRAFT','PENDING_EVIDENCE') AND ROW(NEW."proposedStartDate",NEW."dateSourceNotes",NEW."providerRegistrationReference",NEW."providerRegisteredAt") IS DISTINCT FROM ROW(OLD."proposedStartDate",OLD."dateSourceNotes",OLD."providerRegistrationReference",OLD."providerRegisteredAt") THEN RAISE EXCEPTION 'Evidence dates/references freeze at submission; void/re-register explicitly' USING ERRCODE='23514'; END IF;
  IF OLD."status"='ACTIVE' AND ROW(NEW."verifiedStartDate",NEW."expiresAt",NEW."approvedVersion",NEW."approvedById",NEW."activatedAt") IS DISTINCT FROM ROW(OLD."verifiedStartDate",OLD."expiresAt",OLD."approvedVersion",OLD."approvedById",OLD."activatedAt") THEN RAISE EXCEPTION 'Activated dates and approval are immutable' USING ERRCODE='23514'; END IF;
  IF NEW."status"='ACTIVE' AND OLD."status"<>'ACTIVE' THEN
   IF NOT header."isActive" OR header."currentVersion"<>NEW."policyVersion" OR NEW."approvedVersion"<>OLD."version" OR NEW."approvedById"=NEW."registeredById" OR NOT EXISTS(SELECT 1 FROM "WarrantyDecision" WHERE "registrationId"=NEW."id" AND "claimId" IS NULL AND "reviewedVersion"=OLD."version" AND "decision"='ACTIVE' AND "reviewerId"=NEW."approvedById") THEN RAISE EXCEPTION 'Current-policy independent registration decision required' USING ERRCODE='23514'; END IF;
   source_date:=CASE p."startRule" WHEN 'COMMISSIONING_DATE' THEN (j."commissionedAt" AT TIME ZONE 'UTC')::date WHEN 'INSTALLATION_COMPLETION_DATE' THEN (j."actualEndAt" AT TIME ZONE 'UTC')::date WHEN 'MANUFACTURER_REGISTRATION_DATE' THEN NEW."providerRegisteredAt" ELSE NEW."proposedStartDate" END;
   IF source_date IS NULL OR NEW."verifiedStartDate" IS DISTINCT FROM source_date OR NEW."expiresAt" IS DISTINCT FROM "m07_expiry"(source_date,p."duration",p."durationUnit"::text) OR source_date>(now() AT TIME ZONE 'UTC')::date OR source_date<p."effectiveFrom" OR (p."effectiveTo" IS NOT NULL AND source_date>=p."effectiveTo") THEN RAISE EXCEPTION 'Verified start and calculated expiry must follow exact frozen policy/source' USING ERRCODE='23514'; END IF;
   IF (p."startRule"='DELIVERY_DATE' AND NOT EXISTS(SELECT 1 FROM "WarrantyEvidence" WHERE "registrationId"=NEW."id" AND "claimId" IS NULL AND "documentType"='DELIVERY_PROOF')) OR (p."startRule"='PURCHASE_DATE' AND NOT EXISTS(SELECT 1 FROM "WarrantyEvidence" WHERE "registrationId"=NEW."id" AND "claimId" IS NULL AND "documentType"='PURCHASE_PROOF')) OR (p."startRule"='MANUAL_VERIFIED_DATE' AND NOT EXISTS(SELECT 1 FROM "WarrantyEvidence" WHERE "registrationId"=NEW."id" AND "claimId" IS NULL AND "documentType"='OTHER')) THEN RAISE EXCEPTION 'External start rule requires its own reliable evidence, never dispatch/site receipt inference' USING ERRCODE='23514'; END IF;
   IF (p."requiresProviderRegistration" OR p."startRule"='MANUFACTURER_REGISTRATION_DATE') AND (NEW."providerRegistrationReference" IS NULL OR NEW."providerRegisteredAt" IS NULL OR NEW."providerRegisteredAt">(now() AT TIME ZONE 'UTC')::date OR NOT EXISTS(SELECT 1 FROM "WarrantyEvidence" WHERE "registrationId"=NEW."id" AND "claimId" IS NULL AND "documentType"='MANUFACTURER_REGISTRATION')) THEN RAISE EXCEPTION 'Provider registration date/reference/confirmation required' USING ERRCODE='23514'; END IF;
   IF p."registrationDeadlineDays" IS NOT NULL AND (CASE WHEN p."requiresProviderRegistration" OR p."startRule"='MANUFACTURER_REGISTRATION_DATE' THEN NEW."providerRegisteredAt" ELSE (NEW."createdAt" AT TIME ZONE 'UTC')::date END)>source_date+p."registrationDeadlineDays" THEN RAISE EXCEPTION 'Configured registration deadline missed' USING ERRCODE='23514'; END IF;
   IF EXISTS(SELECT 1 FROM unnest(p."requiredDocuments") doc WHERE NOT EXISTS(SELECT 1 FROM "WarrantyEvidence" WHERE "registrationId"=NEW."id" AND "claimId" IS NULL AND "documentType"=doc)) THEN RAISE EXCEPTION 'Policy registration documents missing' USING ERRCODE='23514'; END IF;
  END IF;
 END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER "WarrantyRegistration_guard" BEFORE INSERT OR UPDATE OR DELETE ON "WarrantyRegistration" FOR EACH ROW EXECUTE FUNCTION "m07_registration_guard"();
CREATE FUNCTION "m07_claim_guard"() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE reg "WarrantyRegistration"%ROWTYPE;
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Claim history cannot be deleted' USING ERRCODE='23514'; END IF;
 IF TG_OP='INSERT' THEN
  IF NEW."status"<>'SUBMITTED' OR NEW."version"<>1 OR NEW."contentRevision"<>1 THEN RAISE EXCEPTION 'Create submitted investigation, never automatic approval' USING ERRCODE='23514'; END IF;
 ELSE
  IF OLD."status" IN ('CLOSED','CANCELLED') OR NEW."version"<>OLD."version"+1 OR NEW."contentRevision" NOT IN (OLD."contentRevision",OLD."contentRevision"+1) OR ROW(NEW."id",NEW."reference",NEW."registrationId",NEW."reportedIssue",NEW."claimType",NEW."priority",NEW."submittedById",NEW."createdAt") IS DISTINCT FROM ROW(OLD."id",OLD."reference",OLD."registrationId",OLD."reportedIssue",OLD."claimType",OLD."priority",OLD."submittedById",OLD."createdAt") THEN RAISE EXCEPTION 'Immutable claim identity/facts, terminal state or stale version' USING ERRCODE='23514'; END IF;
  IF OLD."finalDecision" IS NOT NULL AND ROW(NEW."finalDecision",NEW."decisionDate",NEW."failureDate") IS DISTINCT FROM ROW(OLD."finalDecision",OLD."decisionDate",OLD."failureDate") THEN RAISE EXCEPTION 'Final decisions/failure evidence are immutable' USING ERRCODE='23514'; END IF;
  IF NEW."status" IS DISTINCT FROM OLD."status" AND NOT (
   (OLD."status"='SUBMITTED' AND NEW."status" IN ('UNDER_REVIEW','CANCELLED')) OR
   (OLD."status"='UNDER_REVIEW' AND NEW."status" IN ('EVIDENCE_REQUIRED','ELIGIBLE','INELIGIBLE','APPROVED','DENIED','CANCELLED')) OR
   (OLD."status"='EVIDENCE_REQUIRED' AND NEW."status" IN ('UNDER_REVIEW','CANCELLED')) OR
   (OLD."status"='ELIGIBLE' AND NEW."status" IN ('SUBMITTED_TO_PROVIDER','APPROVED','DENIED','EVIDENCE_REQUIRED','CANCELLED')) OR
   (OLD."status"='INELIGIBLE' AND NEW."status" IN ('CLOSED','UNDER_REVIEW','CANCELLED')) OR
   (OLD."status"='SUBMITTED_TO_PROVIDER' AND NEW."status" IN ('PROVIDER_RESPONSE_PENDING','CANCELLED')) OR
   (OLD."status"='PROVIDER_RESPONSE_PENDING' AND NEW."status" IN ('UNDER_REVIEW','EVIDENCE_REQUIRED','CANCELLED')) OR
   (OLD."status"='APPROVED' AND NEW."status"='RESOLVED') OR
   (OLD."status" IN ('DENIED','RESOLVED') AND NEW."status"='CLOSED')
  ) THEN RAISE EXCEPTION 'Invalid claim transition' USING ERRCODE='23514'; END IF;
  IF NEW."status" IS DISTINCT FROM OLD."status" AND NEW."status" IN ('ELIGIBLE','INELIGIBLE','APPROVED','DENIED') AND NOT EXISTS(SELECT 1 FROM "WarrantyDecision" WHERE "claimId"=OLD."id" AND "reviewedVersion"=OLD."version" AND "decision"=NEW."status"::text) THEN RAISE EXCEPTION 'Persist immutable human review before decision state' USING ERRCODE='23514'; END IF;
  IF NEW."status" IN ('APPROVED','DENIED') AND NEW."status" IS DISTINCT FROM OLD."status" THEN
   IF NEW."finalDecision"<>NEW."status"::text OR NOT EXISTS(SELECT 1 FROM "WarrantyDecision" d JOIN "User" u ON u."id"=d."reviewerId" WHERE d."claimId"=OLD."id" AND d."reviewedVersion"=OLD."version" AND d."decision"=NEW."status"::text AND u."role"='ADMIN' AND u."isActive" AND u."id"<>OLD."submittedById") THEN RAISE EXCEPTION 'Independent active ADMIN final decision required' USING ERRCODE='23514'; END IF;
   IF NEW."status"='APPROVED' THEN
    SELECT * INTO reg FROM "WarrantyRegistration" WHERE "id"=NEW."registrationId";
    IF (SELECT "result" FROM "WarrantyClaimAssessment" WHERE "claimId"=OLD."id" AND "contentRevision"=OLD."contentRevision" ORDER BY "claimVersion" DESC LIMIT 1) IS DISTINCT FROM 'POTENTIALLY_ELIGIBLE' THEN RAISE EXCEPTION 'Latest current-content assessment must support potential eligibility' USING ERRCODE='23514'; END IF;
    IF EXISTS(SELECT 1 FROM "WarrantyPolicyVersion" WHERE "policyId"=reg."policyId" AND "version"=reg."policyVersion" AND "providerType"<>'INSTALLER') AND (SELECT "response" FROM "WarrantyProviderResponse" WHERE "claimId"=OLD."id" ORDER BY "claimVersion" DESC LIMIT 1) IS DISTINCT FROM 'APPROVED' THEN RAISE EXCEPTION 'External provider approval must be recorded separately' USING ERRCODE='23514'; END IF;
    IF reg."status"<>'ACTIVE' OR NEW."failureDate" IS NULL OR NEW."failureDate"<reg."verifiedStartDate" OR NEW."failureDate">=reg."expiresAt" OR NOT EXISTS(SELECT 1 FROM "WarrantyClaimAssessment" WHERE "claimId"=OLD."id" AND "contentRevision"=OLD."contentRevision" AND "result"='POTENTIALLY_ELIGIBLE') THEN RAISE EXCEPTION 'Approval needs actual coverage and current-content assessment' USING ERRCODE='23514'; END IF;
   END IF;
  END IF;
 END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER "WarrantyClaim_guard" BEFORE INSERT OR UPDATE OR DELETE ON "WarrantyClaim" FOR EACH ROW EXECUTE FUNCTION "m07_claim_guard"();
CREATE FUNCTION "m07_operation_guard"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Idempotent warranty operation audit cannot be deleted' USING ERRCODE='23514'; END IF;
 IF TG_OP='UPDATE' AND (OLD."result"<>'{}'::jsonb OR (to_jsonb(NEW)-'result') IS DISTINCT FROM (to_jsonb(OLD)-'result')) THEN RAISE EXCEPTION 'Only initial operation result finalization is allowed' USING ERRCODE='23514'; END IF;
 IF TG_OP='INSERT' AND NOT EXISTS(SELECT 1 FROM "User" WHERE "id"=NEW."actorId" AND "isActive" AND "role" IN ('ADMIN','SUPPORT')) THEN RAISE EXCEPTION 'Authorized active warranty actor required' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER "WarrantyOperation_guard" BEFORE INSERT OR UPDATE OR DELETE ON "WarrantyOperation" FOR EACH ROW EXECUTE FUNCTION "m07_operation_guard"();
CREATE FUNCTION "m07_access_guard"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Revoke access; preserve grant history in operation audit' USING ERRCODE='23514'; END IF;
 IF NOT EXISTS(SELECT 1 FROM "User" WHERE "id"=NEW."grantedById" AND "role"='ADMIN' AND "isActive") OR (NEW."isActive" AND NOT EXISTS(SELECT 1 FROM "User" WHERE "id"=NEW."userId" AND "role"='SUPPORT' AND "isActive")) THEN RAISE EXCEPTION 'ADMIN grants explicit installation access to active SUPPORT' USING ERRCODE='23514'; END IF;
 IF TG_OP='UPDATE' AND (ROW(NEW."id",NEW."installationId",NEW."userId") IS DISTINCT FROM ROW(OLD."id",OLD."installationId",OLD."userId") OR NEW."version"<>OLD."version"+1) THEN RAISE EXCEPTION 'Immutable grant identity or stale version' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER "WarrantyAccessGrant_guard" BEFORE INSERT OR UPDATE OR DELETE ON "WarrantyAccessGrant" FOR EACH ROW EXECUTE FUNCTION "m07_access_guard"();
CREATE FUNCTION "m07_decision_guard"() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE reg "WarrantyRegistration"%ROWTYPE; c "WarrantyClaim"%ROWTYPE;
BEGIN
 SELECT * INTO reg FROM "WarrantyRegistration" WHERE "id"=NEW."registrationId" FOR UPDATE;
 IF NEW."claimId" IS NULL THEN
  IF NEW."reviewedVersion"<>reg."version" OR NOT EXISTS(SELECT 1 FROM "User" WHERE "id"=NEW."reviewerId" AND "role"='ADMIN' AND "isActive") THEN RAISE EXCEPTION 'Registration decision reviews exact version with ADMIN authority' USING ERRCODE='23514'; END IF;
  IF NEW."decision" IN ('ACTIVE','REJECTED') AND (reg."status"<>'PENDING_REVIEW' OR reg."registeredById"=NEW."reviewerId" OR EXISTS(SELECT 1 FROM "WarrantyHistory" WHERE "registrationId"=reg."id" AND "claimId" IS NULL AND "actorId"=NEW."reviewerId" AND "event"<>'REVIEWED')) THEN RAISE EXCEPTION 'Independent exact submitted registration review required' USING ERRCODE='23514'; END IF;
  IF NEW."decision"='ACTIVE' AND NOT (NEW."checklist" @> '{"identityVerified":true,"policyTermsVerified":true,"startEvidenceVerified":true,"requiredDocumentsVerified":true,"providerRegistrationVerified":true}'::jsonb) THEN RAISE EXCEPTION 'Verify all activation evidence checks' USING ERRCODE='23514'; END IF;
 ELSE
  SELECT * INTO c FROM "WarrantyClaim" WHERE "id"=NEW."claimId" FOR UPDATE;
  IF NEW."reviewedVersion"<>c."version" OR c."registrationId"<>reg."id" THEN RAISE EXCEPTION 'Decision must review exact claim/registration version' USING ERRCODE='23514'; END IF;
  IF NEW."decision" IN ('APPROVED','DENIED') AND (NEW."reviewerId"=c."submittedById" OR NOT EXISTS(SELECT 1 FROM "User" WHERE "id"=NEW."reviewerId" AND "role"='ADMIN' AND "isActive")) THEN RAISE EXCEPTION 'Independent ADMIN final claim decision required' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER "WarrantyDecision_guard" BEFORE INSERT ON "WarrantyDecision" FOR EACH ROW EXECUTE FUNCTION "m07_decision_guard"();
CREATE FUNCTION "m07_evidence_guard"() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE reg_status "WarrantyRegistrationStatus"; claim_status "WarrantyClaimStatus";
BEGIN
 PERFORM 1 FROM "WarrantyRegistration" WHERE "id"=NEW."registrationId" FOR UPDATE;
 IF NEW."claimId" IS NULL THEN SELECT "status" INTO reg_status FROM "WarrantyRegistration" WHERE "id"=NEW."registrationId" FOR UPDATE;IF reg_status IN ('REJECTED','VOIDED') THEN RAISE EXCEPTION 'Terminal registration evidence is frozen' USING ERRCODE='23514'; END IF;
 ELSE SELECT "status" INTO claim_status FROM "WarrantyClaim" WHERE "id"=NEW."claimId" AND "registrationId"=NEW."registrationId" FOR UPDATE;IF claim_status IN ('CLOSED','CANCELLED') THEN RAISE EXCEPTION 'Terminal claim evidence is frozen' USING ERRCODE='23514'; END IF; END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER "WarrantyEvidence_guard" BEFORE INSERT ON "WarrantyEvidence" FOR EACH ROW EXECUTE FUNCTION "m07_evidence_guard"();
COMMIT;
