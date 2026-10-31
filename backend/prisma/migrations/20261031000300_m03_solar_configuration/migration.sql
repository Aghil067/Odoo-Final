-- Additive M03 migration. Requires the M02 migration; generated offline, not applied.
BEGIN;

-- CreateEnum
CREATE TYPE "SolarComponentCategory" AS ENUM ('SOLAR_PANEL', 'INVERTER', 'BATTERY', 'CHARGE_CONTROLLER', 'MOUNTING_STRUCTURE', 'DC_CABLE', 'AC_CABLE', 'CONNECTOR', 'COMBINER_BOX', 'ISOLATOR', 'SURGE_PROTECTION', 'EARTHING', 'OTHER');

-- CreateEnum
CREATE TYPE "SolarUnit" AS ENUM ('PCS', 'M', 'SET', 'PAIR', 'KG');

-- CreateEnum
CREATE TYPE "SolarConfigurationStatus" AS ENUM ('DRAFT', 'READY_FOR_REVIEW', 'REVISION_REQUIRED', 'APPROVED', 'REJECTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SolarPhase" AS ENUM ('SINGLE_PHASE', 'THREE_PHASE');

-- CreateEnum
CREATE TYPE "SolarReviewDecision" AS ENUM ('APPROVED', 'REVISION_REQUIRED', 'REJECTED');

-- CreateTable
CREATE TABLE "SolarComponent" (
    "id" UUID NOT NULL,
    "sku" VARCHAR(64) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "category" "SolarComponentCategory" NOT NULL,
    "manufacturer" VARCHAR(160),
    "modelNumber" VARCHAR(160),
    "description" VARCHAR(2000),
    "specifications" JSONB NOT NULL,
    "specificationSource" VARCHAR(2000),
    "unit" "SolarUnit" NOT NULL,
    "unitCost" DECIMAL(18,4) NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "warrantyMonths" INTEGER,
    "serializationRequired" BOOLEAN NOT NULL DEFAULT false,
    "lastChangeReason" VARCHAR(2000) NOT NULL DEFAULT 'Catalog created',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "SolarComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SolarSystemTemplate" (
    "id" UUID NOT NULL,
    "code" VARCHAR(64) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "description" VARCHAR(2000),
    "systemType" "SystemType" NOT NULL,
    "nominalCapacityKw" DECIMAL(10,3) NOT NULL,
    "minimumCapacityKw" DECIMAL(10,3) NOT NULL,
    "maximumCapacityKw" DECIMAL(10,3) NOT NULL,
    "validationPolicy" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "SolarSystemTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SolarTemplateComponent" (
    "id" UUID NOT NULL,
    "templateId" UUID NOT NULL,
    "componentId" UUID NOT NULL,
    "defaultQuantity" DECIMAL(12,3) NOT NULL,
    "unit" "SolarUnit" NOT NULL,
    "required" BOOLEAN NOT NULL,
    "notes" VARCHAR(1000),
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "SolarTemplateComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SolarTemplateRevision" (
    "id" UUID NOT NULL,
    "templateId" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "actorId" UUID NOT NULL,
    "snapshot" JSONB NOT NULL,
    "reason" VARCHAR(2000) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SolarTemplateRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SolarConfiguration" (
    "id" UUID NOT NULL,
    "reference" VARCHAR(40) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "seriesId" UUID NOT NULL,
    "revisionNumber" INTEGER NOT NULL DEFAULT 1,
    "previousConfigurationId" UUID,
    "leadId" UUID NOT NULL,
    "siteId" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "approvedSurveyId" UUID NOT NULL,
    "approvedSurveyVersion" INTEGER NOT NULL,
    "surveyReviewId" UUID NOT NULL,
    "surveySnapshot" JSONB NOT NULL,
    "templateId" UUID,
    "templateVersion" INTEGER,
    "templateSnapshot" JSONB,
    "systemType" "SystemType" NOT NULL,
    "outputPhase" "SolarPhase" NOT NULL,
    "targetCapacityKw" DECIMAL(10,3) NOT NULL,
    "calculatedDcCapacityKw" DECIMAL(24,6),
    "inverterAcCapacityKw" DECIMAL(24,6),
    "batteryNominalEnergyKwh" DECIMAL(24,6),
    "status" "SolarConfigurationStatus" NOT NULL DEFAULT 'DRAFT',
    "technicalAssumptions" VARCHAR(5000) NOT NULL,
    "conditionalWorkRequirements" VARCHAR(5000),
    "validationPolicy" JSONB NOT NULL,
    "electricalDesign" JSONB NOT NULL,
    "validationReport" JSONB NOT NULL,
    "createdById" UUID NOT NULL,
    "reviewerId" UUID,
    "approvedVersion" INTEGER,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "SolarConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillOfMaterials" (
    "id" UUID NOT NULL,
    "reference" VARCHAR(40) NOT NULL,
    "configurationId" UUID NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "SolarConfigurationStatus" NOT NULL DEFAULT 'DRAFT',
    "totalEstimatedMaterialCost" DECIMAL(24,2) NOT NULL DEFAULT 0,
    "currency" CHAR(3) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "BillOfMaterials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BOMLine" (
    "id" UUID NOT NULL,
    "bomId" UUID NOT NULL,
    "componentId" UUID NOT NULL,
    "componentVersion" INTEGER NOT NULL,
    "skuSnapshot" VARCHAR(64) NOT NULL,
    "descriptionSnapshot" VARCHAR(2400) NOT NULL,
    "componentSnapshot" JSONB NOT NULL,
    "category" "SolarComponentCategory" NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "unit" "SolarUnit" NOT NULL,
    "unitCostSnapshot" DECIMAL(18,4) NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "lineTotal" DECIMAL(24,2) NOT NULL,
    "technicalNotes" VARCHAR(1000),
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BOMLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SolarConfigurationHistory" (
    "id" UUID NOT NULL,
    "configurationId" UUID NOT NULL,
    "actorId" UUID NOT NULL,
    "event" VARCHAR(40) NOT NULL,
    "fromStatus" "SolarConfigurationStatus",
    "toStatus" "SolarConfigurationStatus" NOT NULL,
    "version" INTEGER NOT NULL,
    "reason" VARCHAR(2000) NOT NULL,
    "details" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SolarConfigurationHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SolarConfigurationReview" (
    "id" UUID NOT NULL,
    "configurationId" UUID NOT NULL,
    "reviewerId" UUID NOT NULL,
    "decision" "SolarReviewDecision" NOT NULL,
    "configurationVersion" INTEGER NOT NULL,
    "notes" VARCHAR(5000) NOT NULL,
    "checklist" JSONB NOT NULL,
    "snapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SolarConfigurationReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SolarComponent_sku_key" ON "SolarComponent"("sku");

-- CreateIndex
CREATE INDEX "SolarComponent_category_isActive_idx" ON "SolarComponent"("category", "isActive");

-- CreateIndex
CREATE INDEX "SolarComponent_createdById_idx" ON "SolarComponent"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "SolarSystemTemplate_code_key" ON "SolarSystemTemplate"("code");

-- CreateIndex
CREATE INDEX "SolarSystemTemplate_systemType_isActive_idx" ON "SolarSystemTemplate"("systemType", "isActive");

-- CreateIndex
CREATE INDEX "SolarSystemTemplate_createdById_idx" ON "SolarSystemTemplate"("createdById");

-- CreateIndex
CREATE INDEX "SolarTemplateComponent_componentId_idx" ON "SolarTemplateComponent"("componentId");

-- CreateIndex
CREATE UNIQUE INDEX "SolarTemplateComponent_templateId_componentId_key" ON "SolarTemplateComponent"("templateId", "componentId");

-- CreateIndex
CREATE UNIQUE INDEX "SolarTemplateComponent_templateId_position_key" ON "SolarTemplateComponent"("templateId", "position");

-- CreateIndex
CREATE INDEX "SolarTemplateRevision_actorId_idx" ON "SolarTemplateRevision"("actorId");

-- CreateIndex
CREATE UNIQUE INDEX "SolarTemplateRevision_templateId_version_key" ON "SolarTemplateRevision"("templateId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "SolarConfiguration_reference_key" ON "SolarConfiguration"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "SolarConfiguration_previousConfigurationId_key" ON "SolarConfiguration"("previousConfigurationId");

-- CreateIndex
CREATE INDEX "SolarConfiguration_leadId_idx" ON "SolarConfiguration"("leadId");

-- CreateIndex
CREATE INDEX "SolarConfiguration_siteId_idx" ON "SolarConfiguration"("siteId");

-- CreateIndex
CREATE INDEX "SolarConfiguration_customerId_idx" ON "SolarConfiguration"("customerId");

-- CreateIndex
CREATE INDEX "SolarConfiguration_approvedSurveyId_leadId_siteId_customerI_idx" ON "SolarConfiguration"("approvedSurveyId", "leadId", "siteId", "customerId");

-- CreateIndex
CREATE INDEX "SolarConfiguration_surveyReviewId_approvedSurveyId_approved_idx" ON "SolarConfiguration"("surveyReviewId", "approvedSurveyId", "approvedSurveyVersion");

-- CreateIndex
CREATE INDEX "SolarConfiguration_templateId_templateVersion_idx" ON "SolarConfiguration"("templateId", "templateVersion");

-- CreateIndex
CREATE INDEX "SolarConfiguration_status_createdAt_id_idx" ON "SolarConfiguration"("status", "createdAt", "id");

-- CreateIndex
CREATE INDEX "SolarConfiguration_createdById_idx" ON "SolarConfiguration"("createdById");

-- CreateIndex
CREATE INDEX "SolarConfiguration_reviewerId_idx" ON "SolarConfiguration"("reviewerId");

-- CreateIndex
CREATE UNIQUE INDEX "SolarConfiguration_seriesId_revisionNumber_key" ON "SolarConfiguration"("seriesId", "revisionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "BillOfMaterials_reference_key" ON "BillOfMaterials"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "BillOfMaterials_configurationId_key" ON "BillOfMaterials"("configurationId");

-- CreateIndex
CREATE INDEX "BOMLine_componentId_idx" ON "BOMLine"("componentId");

-- CreateIndex
CREATE UNIQUE INDEX "BOMLine_bomId_componentId_key" ON "BOMLine"("bomId", "componentId");

-- CreateIndex
CREATE UNIQUE INDEX "BOMLine_bomId_position_key" ON "BOMLine"("bomId", "position");

-- CreateIndex
CREATE INDEX "SolarConfigurationHistory_actorId_idx" ON "SolarConfigurationHistory"("actorId");

-- CreateIndex
CREATE UNIQUE INDEX "SolarConfigurationHistory_configurationId_version_key" ON "SolarConfigurationHistory"("configurationId", "version");

-- CreateIndex
CREATE INDEX "SolarConfigurationReview_reviewerId_idx" ON "SolarConfigurationReview"("reviewerId");

-- CreateIndex
CREATE UNIQUE INDEX "SolarConfigurationReview_configurationId_configurationVersi_key" ON "SolarConfigurationReview"("configurationId", "configurationVersion");

-- CreateIndex
CREATE UNIQUE INDEX "SiteSurvey_id_leadId_siteId_customerId_key" ON "SiteSurvey"("id", "leadId", "siteId", "customerId");

-- CreateIndex
CREATE UNIQUE INDEX "SurveyReview_id_surveyId_surveyVersion_key" ON "SurveyReview"("id", "surveyId", "surveyVersion");

-- AddForeignKey
ALTER TABLE "SolarComponent" ADD CONSTRAINT "SolarComponent_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolarSystemTemplate" ADD CONSTRAINT "SolarSystemTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolarTemplateComponent" ADD CONSTRAINT "SolarTemplateComponent_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "SolarSystemTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolarTemplateComponent" ADD CONSTRAINT "SolarTemplateComponent_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "SolarComponent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolarTemplateRevision" ADD CONSTRAINT "SolarTemplateRevision_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "SolarSystemTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolarTemplateRevision" ADD CONSTRAINT "SolarTemplateRevision_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolarConfiguration" ADD CONSTRAINT "SolarConfiguration_previousConfigurationId_fkey" FOREIGN KEY ("previousConfigurationId") REFERENCES "SolarConfiguration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolarConfiguration" ADD CONSTRAINT "SolarConfiguration_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "SolarConfiguration" ADD CONSTRAINT "SolarConfiguration_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "SolarConfiguration" ADD CONSTRAINT "SolarConfiguration_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "SolarConfiguration" ADD CONSTRAINT "SolarConfiguration_approvedSurveyId_leadId_siteId_customer_fkey" FOREIGN KEY ("approvedSurveyId", "leadId", "siteId", "customerId") REFERENCES "SiteSurvey"("id", "leadId", "siteId", "customerId") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "SolarConfiguration" ADD CONSTRAINT "SolarConfiguration_surveyReviewId_approvedSurveyId_approve_fkey" FOREIGN KEY ("surveyReviewId", "approvedSurveyId", "approvedSurveyVersion") REFERENCES "SurveyReview"("id", "surveyId", "surveyVersion") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "SolarConfiguration" ADD CONSTRAINT "SolarConfiguration_templateId_templateVersion_fkey" FOREIGN KEY ("templateId", "templateVersion") REFERENCES "SolarTemplateRevision"("templateId", "version") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "SolarConfiguration" ADD CONSTRAINT "SolarConfiguration_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolarConfiguration" ADD CONSTRAINT "SolarConfiguration_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillOfMaterials" ADD CONSTRAINT "BillOfMaterials_configurationId_fkey" FOREIGN KEY ("configurationId") REFERENCES "SolarConfiguration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BOMLine" ADD CONSTRAINT "BOMLine_bomId_fkey" FOREIGN KEY ("bomId") REFERENCES "BillOfMaterials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BOMLine" ADD CONSTRAINT "BOMLine_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "SolarComponent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolarConfigurationHistory" ADD CONSTRAINT "SolarConfigurationHistory_configurationId_fkey" FOREIGN KEY ("configurationId") REFERENCES "SolarConfiguration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolarConfigurationHistory" ADD CONSTRAINT "SolarConfigurationHistory_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolarConfigurationReview" ADD CONSTRAINT "SolarConfigurationReview_configurationId_fkey" FOREIGN KEY ("configurationId") REFERENCES "SolarConfiguration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolarConfigurationReview" ADD CONSTRAINT "SolarConfigurationReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "SolarComponent" ADD CONSTRAINT "SolarComponent_values_check" CHECK (
  "version" > 0 AND "unitCost" >= 0 AND "currency" IN ('INR','USD','EUR','GBP')
  AND ("warrantyMonths" IS NULL OR "warrantyMonths" BETWEEN 0 AND 600)
  AND jsonb_typeof("specifications") = 'object'
  AND ("category" NOT IN ('SOLAR_PANEL','INVERTER','BATTERY','CHARGE_CONTROLLER') OR "unit" = 'PCS')
);
ALTER TABLE "SolarSystemTemplate" ADD CONSTRAINT "SolarSystemTemplate_values_check" CHECK (
  "version" > 0 AND "systemType" IN ('ON_GRID','OFF_GRID') AND "minimumCapacityKw" > 0
  AND "minimumCapacityKw" <= "nominalCapacityKw" AND "nominalCapacityKw" <= "maximumCapacityKw"
  AND jsonb_typeof("validationPolicy") = 'object'
);
ALTER TABLE "SolarTemplateComponent" ADD CONSTRAINT "SolarTemplateComponent_values_check" CHECK (
  "defaultQuantity" > 0 AND "position" >= 0
  AND ("unit" NOT IN ('PCS','SET','PAIR') OR "defaultQuantity" = round("defaultQuantity", 0))
);
ALTER TABLE "SolarTemplateRevision" ADD CONSTRAINT "SolarTemplateRevision_values_check" CHECK ("version" > 0 AND jsonb_typeof("snapshot") = 'object' AND length(btrim("reason")) > 0);
ALTER TABLE "SolarConfiguration" ADD CONSTRAINT "SolarConfiguration_values_check" CHECK (
  "version" > 0 AND "revisionNumber" > 0 AND "approvedSurveyVersion" > 0
  AND "systemType" IN ('ON_GRID','OFF_GRID') AND "targetCapacityKw" > 0
  AND "calculatedDcCapacityKw" >= 0 AND "inverterAcCapacityKw" >= 0
  AND ("batteryNominalEnergyKwh" IS NULL OR "batteryNominalEnergyKwh" >= 0)
  AND (("templateId" IS NULL) = ("templateVersion" IS NULL))
  AND (("templateId" IS NULL) = ("templateSnapshot" IS NULL))
  AND ("templateSnapshot" IS NULL OR jsonb_typeof("templateSnapshot") = 'object')
  AND jsonb_typeof("surveySnapshot") = 'object' AND jsonb_typeof("validationPolicy") = 'object'
  AND jsonb_typeof("electricalDesign") = 'object' AND jsonb_typeof("validationReport") = 'object'
  AND (("status" = 'APPROVED' AND "approvedVersion" IS NOT NULL AND "approvedVersion" = "version" - 1 AND "reviewerId" IS NOT NULL)
    OR ("status" <> 'APPROVED' AND "approvedVersion" IS NULL))
);
ALTER TABLE "BillOfMaterials" ADD CONSTRAINT "BillOfMaterials_values_check" CHECK ("version" > 0 AND "totalEstimatedMaterialCost" >= 0 AND "currency" IN ('INR','USD','EUR','GBP'));
ALTER TABLE "BOMLine" ADD CONSTRAINT "BOMLine_values_check" CHECK (
  "componentVersion" > 0 AND "position" >= 0 AND "quantity" > 0 AND "unitCostSnapshot" >= 0
  AND "lineTotal" = round("quantity" * "unitCostSnapshot", 2) AND "currency" IN ('INR','USD','EUR','GBP')
  AND ("unit" NOT IN ('PCS','SET','PAIR') OR "quantity" = round("quantity", 0))
  AND ("category" NOT IN ('SOLAR_PANEL','INVERTER','BATTERY','CHARGE_CONTROLLER') OR "unit" = 'PCS')
  AND jsonb_typeof("componentSnapshot") = 'object'
);
ALTER TABLE "SolarConfigurationHistory" ADD CONSTRAINT "SolarConfigurationHistory_values_check" CHECK ("version" > 0 AND length(btrim("reason")) > 0 AND jsonb_typeof("details") = 'object');
ALTER TABLE "SolarConfigurationReview" ADD CONSTRAINT "SolarConfigurationReview_values_check" CHECK ("configurationVersion" > 0 AND length(btrim("notes")) > 0 AND jsonb_typeof("snapshot") = 'object' AND jsonb_typeof("checklist") = 'object');

CREATE FUNCTION "m03_append_only"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'M03 snapshots and review history are append-only' USING ERRCODE = '23514'; END;
$$;
CREATE TRIGGER "SolarTemplateRevision_append_only" BEFORE UPDATE OR DELETE ON "SolarTemplateRevision" FOR EACH ROW EXECUTE FUNCTION "m03_append_only"();
CREATE TRIGGER "SolarConfigurationHistory_append_only" BEFORE UPDATE OR DELETE ON "SolarConfigurationHistory" FOR EACH ROW EXECUTE FUNCTION "m03_append_only"();
CREATE TRIGGER "SolarConfigurationReview_append_only" BEFORE UPDATE OR DELETE ON "SolarConfigurationReview" FOR EACH ROW EXECUTE FUNCTION "m03_append_only"();

CREATE FUNCTION "m03_catalog_guard"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'Archive catalog definitions instead of deleting' USING ERRCODE = '23514'; END IF;
  IF TG_OP = 'UPDATE' THEN
    IF NEW."version" <> OLD."version" + 1 OR NEW."id" <> OLD."id" OR NEW."createdById" <> OLD."createdById" THEN
      RAISE EXCEPTION 'Catalog mutation requires one version increment and fixed identity' USING ERRCODE = '23514';
    END IF;
    IF TG_TABLE_NAME = 'SolarComponent' THEN
      IF ROW(to_jsonb(NEW)->'sku',to_jsonb(NEW)->'category',to_jsonb(NEW)->'unit') IS DISTINCT FROM ROW(to_jsonb(OLD)->'sku',to_jsonb(OLD)->'category',to_jsonb(OLD)->'unit') THEN RAISE EXCEPTION 'Component code/category/unit are immutable' USING ERRCODE = '23514'; END IF;
    ELSIF to_jsonb(NEW)->'code' IS DISTINCT FROM to_jsonb(OLD)->'code' THEN
      RAISE EXCEPTION 'Template code is immutable' USING ERRCODE = '23514';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER "SolarComponent_guard" BEFORE UPDATE OR DELETE ON "SolarComponent" FOR EACH ROW EXECUTE FUNCTION "m03_catalog_guard"();
CREATE TRIGGER "SolarSystemTemplate_guard" BEFORE UPDATE OR DELETE ON "SolarSystemTemplate" FOR EACH ROW EXECUTE FUNCTION "m03_catalog_guard"();

CREATE FUNCTION "m03_configuration_guard"() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE prior "SolarConfiguration"%ROWTYPE;
BEGIN
  IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'Configuration history cannot be hard deleted' USING ERRCODE = '23514'; END IF;
  IF TG_OP = 'UPDATE' THEN
    IF OLD."status" IN ('APPROVED','ARCHIVED') THEN RAISE EXCEPTION 'Approved/archived configurations are immutable; create a revision' USING ERRCODE = '23514'; END IF;
    IF ROW(NEW."id",NEW."reference",NEW."seriesId",NEW."revisionNumber",NEW."previousConfigurationId",NEW."leadId",NEW."siteId",NEW."customerId",NEW."approvedSurveyId",NEW."approvedSurveyVersion",NEW."surveyReviewId",NEW."surveySnapshot",NEW."templateId",NEW."templateVersion",NEW."templateSnapshot",NEW."systemType",NEW."outputPhase",NEW."createdById") IS DISTINCT FROM
       ROW(OLD."id",OLD."reference",OLD."seriesId",OLD."revisionNumber",OLD."previousConfigurationId",OLD."leadId",OLD."siteId",OLD."customerId",OLD."approvedSurveyId",OLD."approvedSurveyVersion",OLD."surveyReviewId",OLD."surveySnapshot",OLD."templateId",OLD."templateVersion",OLD."templateSnapshot",OLD."systemType",OLD."outputPhase",OLD."createdById") THEN
      RAISE EXCEPTION 'Configuration identity and approval/template snapshots are immutable' USING ERRCODE = '23514';
    END IF;
    -- Initial calculations are materialized before the first audit event, inside creation.
    IF NEW."version" <> OLD."version" + 1 AND NOT (OLD."version" = 1 AND NEW."version" = 1 AND NOT EXISTS (SELECT 1 FROM "SolarConfigurationHistory" WHERE "configurationId" = OLD."id")) THEN
      RAISE EXCEPTION 'Stale configuration version' USING ERRCODE = '23514';
    END IF;
    IF NEW."status" IS DISTINCT FROM OLD."status" AND NOT (
      (OLD."status" = 'DRAFT' AND NEW."status" IN ('READY_FOR_REVIEW','ARCHIVED')) OR
      (OLD."status" = 'REVISION_REQUIRED' AND NEW."status" IN ('READY_FOR_REVIEW','ARCHIVED')) OR
      (OLD."status" = 'READY_FOR_REVIEW' AND NEW."status" IN ('APPROVED','REVISION_REQUIRED','REJECTED','ARCHIVED')) OR
      (OLD."status" = 'REJECTED' AND NEW."status" = 'ARCHIVED')
    ) THEN RAISE EXCEPTION 'Invalid configuration transition' USING ERRCODE = '23514'; END IF;
    IF NEW."status" IS DISTINCT FROM OLD."status" AND NEW."status" IN ('APPROVED','REVISION_REQUIRED','REJECTED') AND NOT EXISTS (
      SELECT 1 FROM "SolarConfigurationReview" WHERE "configurationId" = OLD."id" AND "configurationVersion" = OLD."version" AND "decision"::text = NEW."status"::text AND "reviewerId" = NEW."reviewerId"
    ) THEN RAISE EXCEPTION 'Persist an independent review decision before transition' USING ERRCODE = '23514'; END IF;
  ELSE
    IF NEW."status" <> 'DRAFT' OR NEW."version" <> 1 THEN RAISE EXCEPTION 'Create DRAFT at version one' USING ERRCODE = '23514'; END IF;
    IF NEW."previousConfigurationId" IS NOT NULL THEN
      SELECT * INTO prior FROM "SolarConfiguration" WHERE "id" = NEW."previousConfigurationId";
      IF NOT FOUND OR prior."status" NOT IN ('APPROVED','REJECTED','ARCHIVED') OR ROW(prior."seriesId",prior."leadId",prior."siteId",prior."customerId",prior."revisionNumber" + 1) IS DISTINCT FROM ROW(NEW."seriesId",NEW."leadId",NEW."siteId",NEW."customerId",NEW."revisionNumber") THEN RAISE EXCEPTION 'Invalid configuration revision chain' USING ERRCODE = '23514'; END IF;
    ELSIF NEW."revisionNumber" <> 1 THEN RAISE EXCEPTION 'Initial revision must be one' USING ERRCODE = '23514'; END IF;
  END IF;
  IF NEW."status" <> 'ARCHIVED' THEN
    IF NOT EXISTS (SELECT 1 FROM "SiteSurvey" s JOIN "SurveyReview" r ON r."id" = NEW."surveyReviewId" AND r."surveyId" = s."id" AND r."surveyVersion" = NEW."approvedSurveyVersion"
      JOIN "Lead" l ON l."id" = s."leadId" JOIN "Customer" c ON c."id" = s."customerId"
      WHERE s."id" = NEW."approvedSurveyId" AND s."status" = 'APPROVED' AND s."approvedVersion" = NEW."approvedSurveyVersion" AND r."decision" = 'APPROVED'
      AND l."status" = 'SURVEY_REQUESTED' AND NOT c."isArchived" AND NOT EXISTS (SELECT 1 FROM "SiteSurvey" newer WHERE newer."previousSurveyId" = s."id")) THEN
      RAISE EXCEPTION 'The latest eligible approved survey and review are required' USING ERRCODE = '23514';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER "SolarConfiguration_guard" BEFORE INSERT OR UPDATE OR DELETE ON "SolarConfiguration" FOR EACH ROW EXECUTE FUNCTION "m03_configuration_guard"();

CREATE FUNCTION "m03_bom_guard"() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE parent "SolarConfiguration"%ROWTYPE;
BEGIN
  IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'BOM headers cannot be hard deleted' USING ERRCODE = '23514'; END IF;
  SELECT * INTO parent FROM "SolarConfiguration" WHERE "id" = NEW."configurationId" FOR UPDATE;
  IF NOT FOUND OR NEW."status" <> parent."status" THEN RAISE EXCEPTION 'BOM must belong to the current configuration revision/status' USING ERRCODE = '23514'; END IF;
  IF TG_OP = 'UPDATE' THEN
    IF OLD."status" = 'APPROVED' THEN RAISE EXCEPTION 'Approved BOM is immutable' USING ERRCODE = '23514'; END IF;
    IF ROW(NEW."id",NEW."reference",NEW."configurationId",NEW."currency") IS DISTINCT FROM ROW(OLD."id",OLD."reference",OLD."configurationId",OLD."currency") THEN RAISE EXCEPTION 'BOM identity/currency cannot change' USING ERRCODE = '23514'; END IF;
    IF parent."status" NOT IN ('DRAFT','REVISION_REQUIRED') AND ROW(NEW."version",NEW."totalEstimatedMaterialCost") IS DISTINCT FROM ROW(OLD."version",OLD."totalEstimatedMaterialCost") THEN RAISE EXCEPTION 'Only editable drafts may recalculate a BOM' USING ERRCODE = '23514'; END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER "BillOfMaterials_guard" BEFORE INSERT OR UPDATE OR DELETE ON "BillOfMaterials" FOR EACH ROW EXECUTE FUNCTION "m03_bom_guard"();

CREATE FUNCTION "m03_bom_line_guard"() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE owner_id uuid; parent_status "SolarConfigurationStatus";
BEGIN
  IF TG_OP = 'DELETE' THEN owner_id := OLD."bomId"; ELSE owner_id := NEW."bomId"; END IF;
  SELECT c."status" INTO parent_status FROM "BillOfMaterials" b JOIN "SolarConfiguration" c ON c."id" = b."configurationId" WHERE b."id" = owner_id FOR UPDATE OF c;
  IF NOT FOUND OR parent_status NOT IN ('DRAFT','REVISION_REQUIRED') THEN RAISE EXCEPTION 'BOM lines are editable only in draft/revision' USING ERRCODE = '23514'; END IF;
  IF TG_OP = 'UPDATE' AND NEW."bomId" <> OLD."bomId" THEN RAISE EXCEPTION 'BOM ownership is immutable' USING ERRCODE = '23514'; END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER "BOMLine_guard" BEFORE INSERT OR UPDATE OR DELETE ON "BOMLine" FOR EACH ROW EXECUTE FUNCTION "m03_bom_line_guard"();

CREATE FUNCTION "m03_review_guard"() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE parent "SolarConfiguration"%ROWTYPE;
BEGIN
  SELECT * INTO parent FROM "SolarConfiguration" WHERE "id" = NEW."configurationId" FOR UPDATE;
  IF NOT FOUND OR parent."status" <> 'READY_FOR_REVIEW' OR parent."version" <> NEW."configurationVersion" THEN RAISE EXCEPTION 'Review the current submitted revision only' USING ERRCODE = '23514'; END IF;
  IF parent."createdById" = NEW."reviewerId" OR EXISTS (SELECT 1 FROM "SolarConfigurationHistory" WHERE "configurationId" = parent."id" AND "actorId" = NEW."reviewerId" AND "event" IN ('CREATED','DRAFT_UPDATED','BOM_UPDATED','BOM_REFRESHED'))
    OR NOT EXISTS (SELECT 1 FROM "User" WHERE "id" = NEW."reviewerId" AND "role" = 'ADMIN' AND "isActive") THEN RAISE EXCEPTION 'Independent active ADMIN reviewer required' USING ERRCODE = '23514'; END IF;
  IF NEW."decision" = 'APPROVED' THEN
    IF NEW."snapshot"->'validationReport'->>'blockingErrors' IS DISTINCT FROM '0' OR NOT (NEW."checklist" @> '{"compatibilityReviewed":true,"costingReviewed":true,"assumptionsReviewed":true,"surveyConditionsAcknowledged":true,"designLimitationsAcknowledged":true}'::jsonb) THEN RAISE EXCEPTION 'Approval requires resolved blocking errors and a complete checklist' USING ERRCODE = '23514'; END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER "SolarConfigurationReview_guard" BEFORE INSERT ON "SolarConfigurationReview" FOR EACH ROW EXECUTE FUNCTION "m03_review_guard"();

COMMIT;
