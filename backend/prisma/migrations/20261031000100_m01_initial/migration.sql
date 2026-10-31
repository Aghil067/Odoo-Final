-- M01 initial migration. Generated offline; not applied by the implementation agent.
-- Run only after reviewing the target database and granting extension privileges.
BEGIN;

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'SALES', 'TECHNICIAN', 'WAREHOUSE', 'SUPPORT', 'FINANCE');

-- CreateEnum
CREATE TYPE "CustomerType" AS ENUM ('INDIVIDUAL', 'BUSINESS');

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('WEBSITE', 'PHONE', 'WALK_IN', 'REFERRAL', 'OTHER');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'SURVEY_REQUESTED', 'LOST', 'DISQUALIFIED');

-- CreateEnum
CREATE TYPE "LeadPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "SystemType" AS ENUM ('ON_GRID', 'OFF_GRID', 'UNDECIDED');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('CALL', 'EMAIL', 'MEETING', 'NOTE', 'FOLLOW_UP');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" UUID NOT NULL,
    "tokenHash" CHAR(64) NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" UUID NOT NULL,
    "reference" VARCHAR(40) NOT NULL,
    "type" "CustomerType" NOT NULL DEFAULT 'INDIVIDUAL',
    "name" VARCHAR(160) NOT NULL,
    "phone" VARCHAR(40) NOT NULL,
    "normalizedPhone" VARCHAR(16) NOT NULL,
    "email" VARCHAR(254),
    "companyName" VARCHAR(160),
    "notes" VARCHAR(5000),
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMPTZ(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Site" (
    "id" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "addressLine1" VARCHAR(250) NOT NULL,
    "addressLine2" VARCHAR(250),
    "city" VARCHAR(100) NOT NULL,
    "state" VARCHAR(100) NOT NULL,
    "postalCode" VARCHAR(20) NOT NULL,
    "country" CHAR(2) NOT NULL,
    "landmark" VARCHAR(250),
    "propertyNotes" VARCHAR(5000),
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Site_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" UUID NOT NULL,
    "reference" VARCHAR(40) NOT NULL,
    "customerId" UUID NOT NULL,
    "siteId" UUID NOT NULL,
    "source" "LeadSource" NOT NULL,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "priority" "LeadPriority" NOT NULL DEFAULT 'MEDIUM',
    "requestedCapacityKw" DECIMAL(10,3),
    "preferredSystemType" "SystemType" NOT NULL DEFAULT 'UNDECIDED',
    "monthlyElectricityBill" DECIMAL(14,2),
    "assignedToId" UUID,
    "createdById" UUID NOT NULL,
    "qualificationNotes" VARCHAR(5000),
    "nextFollowUpAt" TIMESTAMPTZ(3),
    "closedReason" VARCHAR(2000),
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadActivity" (
    "id" UUID NOT NULL,
    "leadId" UUID NOT NULL,
    "actorId" UUID NOT NULL,
    "type" "ActivityType" NOT NULL,
    "description" VARCHAR(5000) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadStatusHistory" (
    "id" UUID NOT NULL,
    "leadId" UUID NOT NULL,
    "actorId" UUID NOT NULL,
    "fromStatus" "LeadStatus",
    "toStatus" "LeadStatus" NOT NULL,
    "reason" VARCHAR(2000),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_reference_key" ON "Customer"("reference");

-- CreateIndex
CREATE INDEX "Customer_normalizedPhone_idx" ON "Customer"("normalizedPhone");

-- CreateIndex
CREATE INDEX "Customer_email_idx" ON "Customer"("email");

-- CreateIndex
CREATE INDEX "Customer_createdById_isArchived_idx" ON "Customer"("createdById", "isArchived");

-- CreateIndex
CREATE INDEX "Customer_isArchived_createdAt_id_idx" ON "Customer"("isArchived", "createdAt", "id");

-- CreateIndex
CREATE INDEX "Customer_type_idx" ON "Customer"("type");

-- CreateIndex
CREATE INDEX "Customer_name_idx" ON "Customer" USING GIN ("name" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "Customer_reference_idx" ON "Customer" USING GIN ("reference" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "Customer_companyName_idx" ON "Customer" USING GIN ("companyName" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "Site_customerId_createdAt_id_idx" ON "Site"("customerId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "Site_name_idx" ON "Site" USING GIN ("name" gin_trgm_ops);

-- CreateIndex
CREATE UNIQUE INDEX "Site_id_customerId_key" ON "Site"("id", "customerId");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_reference_key" ON "Lead"("reference");

-- CreateIndex
CREATE INDEX "Lead_customerId_idx" ON "Lead"("customerId");

-- CreateIndex
CREATE INDEX "Lead_siteId_customerId_idx" ON "Lead"("siteId", "customerId");

-- CreateIndex
CREATE INDEX "Lead_status_createdAt_id_idx" ON "Lead"("status", "createdAt", "id");

-- CreateIndex
CREATE INDEX "Lead_assignedToId_status_idx" ON "Lead"("assignedToId", "status");

-- CreateIndex
CREATE INDEX "Lead_createdById_idx" ON "Lead"("createdById");

-- CreateIndex
CREATE INDEX "Lead_source_idx" ON "Lead"("source");

-- CreateIndex
CREATE INDEX "Lead_priority_idx" ON "Lead"("priority");

-- CreateIndex
CREATE INDEX "Lead_nextFollowUpAt_idx" ON "Lead"("nextFollowUpAt");

-- CreateIndex
CREATE INDEX "Lead_reference_idx" ON "Lead" USING GIN ("reference" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "Lead_qualificationNotes_idx" ON "Lead" USING GIN ("qualificationNotes" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "LeadActivity_leadId_createdAt_id_idx" ON "LeadActivity"("leadId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "LeadActivity_actorId_idx" ON "LeadActivity"("actorId");

-- CreateIndex
CREATE INDEX "LeadStatusHistory_leadId_createdAt_id_idx" ON "LeadStatusHistory"("leadId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "LeadStatusHistory_actorId_idx" ON "LeadStatusHistory"("actorId");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Site" ADD CONSTRAINT "Site_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_siteId_customerId_fkey" FOREIGN KEY ("siteId", "customerId") REFERENCES "Site"("id", "customerId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadActivity" ADD CONSTRAINT "LeadActivity_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadActivity" ADD CONSTRAINT "LeadActivity_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadStatusHistory" ADD CONSTRAINT "LeadStatusHistory_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadStatusHistory" ADD CONSTRAINT "LeadStatusHistory_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Additional invariants not represented by Prisma's schema DSL.
ALTER TABLE "User" ADD CONSTRAINT "User_email_lowercase_check" CHECK ("email" = lower("email"));
ALTER TABLE "Session" ADD CONSTRAINT "Session_expiry_check" CHECK ("expiresAt" > "createdAt");
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_version_check" CHECK ("version" > 0);
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_email_lowercase_check" CHECK ("email" IS NULL OR "email" = lower("email"));
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_normalized_phone_check" CHECK ("normalizedPhone" ~ '^\+[1-9][0-9]{1,14}$');
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_archival_check" CHECK (
  ("isArchived" AND "archivedAt" IS NOT NULL) OR (NOT "isArchived" AND "archivedAt" IS NULL)
);
ALTER TABLE "Site" ADD CONSTRAINT "Site_version_check" CHECK ("version" > 0);
ALTER TABLE "Site" ADD CONSTRAINT "Site_coordinate_pair_check" CHECK (("latitude" IS NULL) = ("longitude" IS NULL));
ALTER TABLE "Site" ADD CONSTRAINT "Site_latitude_check" CHECK ("latitude" BETWEEN -90 AND 90);
ALTER TABLE "Site" ADD CONSTRAINT "Site_longitude_check" CHECK ("longitude" BETWEEN -180 AND 180);
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_version_check" CHECK ("version" > 0);
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_capacity_check" CHECK ("requestedCapacityKw" > 0);
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_bill_check" CHECK ("monthlyElectricityBill" >= 0);
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_closed_state_check" CHECK (
  ("status" IN ('LOST', 'DISQUALIFIED') AND "closedReason" IS NOT NULL AND length(btrim("closedReason")) > 0 AND "nextFollowUpAt" IS NULL)
  OR ("status" NOT IN ('LOST', 'DISQUALIFIED') AND "closedReason" IS NULL)
);

COMMIT;
