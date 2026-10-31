BEGIN;
-- CreateEnum
CREATE TYPE "FinanceCurrency" AS ENUM ('INR', 'USD', 'EUR', 'GBP');

-- CreateEnum
CREATE TYPE "FinanceLineKind" AS ENUM ('COMPONENT', 'INSTALLATION_LABOR', 'SERVICE_LABOR', 'TRANSPORT', 'OTHER_FEE');

-- CreateEnum
CREATE TYPE "FinanceQuoteKind" AS ENUM ('INSTALLATION', 'SERVICE');

-- CreateEnum
CREATE TYPE "FinanceQuoteStatus" AS ENUM ('DRAFT', 'SUBMITTED_FOR_APPROVAL', 'APPROVED', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CANCELLED', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "FinanceInvoiceStatus" AS ENUM ('DRAFT', 'ISSUED', 'VOIDED');

-- CreateEnum
CREATE TYPE "FinancePaymentStatus" AS ENUM ('RECORDED', 'PENDING_VERIFICATION', 'VERIFIED', 'REJECTED', 'REVERSED');

-- CreateEnum
CREATE TYPE "FinancePaymentMethod" AS ENUM ('BANK_TRANSFER', 'UPI', 'CASH', 'CARD', 'CHEQUE', 'OTHER');

-- CreateEnum
CREATE TYPE "FinanceApprovalStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'RECORDED', 'ISSUED', 'REQUESTED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "FinanceEntityKind" AS ENUM ('QUOTATION', 'ORDER', 'INVOICE', 'PAYMENT', 'CREDIT_NOTE', 'REFUND', 'EXPENSE', 'SERVICE_CHARGE');

-- CreateEnum
CREATE TYPE "FinanceEvidenceType" AS ENUM ('CUSTOMER_ACCEPTANCE', 'PAYMENT_PROOF', 'CREDIT_SUPPORT', 'REFUND_PROOF', 'EXPENSE_RECEIPT', 'SERVICE_CHARGE_SUPPORT', 'OTHER');

-- CreateTable
CREATE TABLE "FinanceAccessGrant" (
    "id" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "grantedById" UUID NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinanceAccessGrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancePriceBook" (
    "id" UUID NOT NULL,
    "reference" VARCHAR(64) NOT NULL,
    "revision" INTEGER NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "lineCount" INTEGER NOT NULL,
    "currency" "FinanceCurrency" NOT NULL,
    "effectiveFrom" TIMESTAMPTZ(3) NOT NULL,
    "effectiveTo" TIMESTAMPTZ(3),
    "discountApprovalPercent" DECIMAL(7,4) NOT NULL,
    "approvalThresholdAmount" DECIMAL(24,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "publishedById" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinancePriceBook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancePriceBookLine" (
    "id" UUID NOT NULL,
    "priceBookId" UUID NOT NULL,
    "code" VARCHAR(64) NOT NULL,
    "kind" "FinanceLineKind" NOT NULL,
    "componentId" UUID,
    "description" VARCHAR(2000) NOT NULL,
    "unit" VARCHAR(40) NOT NULL,
    "unitPrice" DECIMAL(18,4) NOT NULL,
    "estimatedUnitCost" DECIMAL(18,4),
    "costSourceNotes" VARCHAR(2000),

    CONSTRAINT "FinancePriceBookLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinanceTaxRule" (
    "id" UUID NOT NULL,
    "reference" VARCHAR(64) NOT NULL,
    "revision" INTEGER NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "currency" "FinanceCurrency" NOT NULL,
    "ratePercent" DECIMAL(7,4) NOT NULL,
    "inclusive" BOOLEAN NOT NULL,
    "jurisdictionNotes" VARCHAR(3000) NOT NULL,
    "effectiveFrom" TIMESTAMPTZ(3) NOT NULL,
    "effectiveTo" TIMESTAMPTZ(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "publishedById" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinanceTaxRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinanceQuotation" (
    "id" UUID NOT NULL,
    "reference" VARCHAR(60) NOT NULL,
    "seriesId" UUID NOT NULL,
    "revision" INTEGER NOT NULL DEFAULT 1,
    "previousId" UUID,
    "commercialKey" VARCHAR(180) NOT NULL,
    "kind" "FinanceQuoteKind" NOT NULL,
    "customerId" UUID NOT NULL,
    "siteId" UUID NOT NULL,
    "leadId" UUID NOT NULL,
    "configurationId" UUID,
    "configurationApprovedVersion" INTEGER,
    "configurationReviewId" UUID,
    "bomId" UUID,
    "bomVersion" INTEGER,
    "serviceChargeId" UUID,
    "priceBookId" UUID NOT NULL,
    "currency" "FinanceCurrency" NOT NULL,
    "sourceSnapshot" JSONB NOT NULL,
    "pricingSnapshot" JSONB NOT NULL,
    "submittedSnapshot" JSONB,
    "reviewSnapshot" JSONB,
    "subtotal" DECIMAL(24,2) NOT NULL,
    "discountAmount" DECIMAL(24,2) NOT NULL,
    "taxableAmount" DECIMAL(24,2) NOT NULL,
    "taxAmount" DECIMAL(24,2) NOT NULL,
    "totalAmount" DECIMAL(24,2) NOT NULL,
    "estimatedCost" DECIMAL(24,2),
    "estimatedMargin" DECIMAL(24,2),
    "sensitivePricing" BOOLEAN NOT NULL,
    "validUntil" TIMESTAMPTZ(3) NOT NULL,
    "terms" VARCHAR(5000) NOT NULL,
    "status" "FinanceQuoteStatus" NOT NULL DEFAULT 'DRAFT',
    "preparedById" UUID NOT NULL,
    "approvedById" UUID,
    "submittedAt" TIMESTAMPTZ(3),
    "approvedAt" TIMESTAMPTZ(3),
    "sentAt" TIMESTAMPTZ(3),
    "acceptedAt" TIMESTAMPTZ(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "FinanceQuotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinanceQuotationLine" (
    "id" UUID NOT NULL,
    "quotationId" UUID NOT NULL,
    "priceBookLineId" UUID NOT NULL,
    "taxRuleId" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "kind" "FinanceLineKind" NOT NULL,
    "description" VARCHAR(2000) NOT NULL,
    "unit" VARCHAR(40) NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "unitPrice" DECIMAL(18,4) NOT NULL,
    "extendedPrice" DECIMAL(24,2) NOT NULL,
    "enteredDiscount" DECIMAL(24,2) NOT NULL,
    "subtotal" DECIMAL(24,2) NOT NULL,
    "discountAmount" DECIMAL(24,2) NOT NULL,
    "taxableAmount" DECIMAL(24,2) NOT NULL,
    "taxAmount" DECIMAL(24,2) NOT NULL,
    "totalAmount" DECIMAL(24,2) NOT NULL,
    "estimatedCost" DECIMAL(24,2),
    "taxSnapshot" JSONB NOT NULL,

    CONSTRAINT "FinanceQuotationLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinanceSalesOrder" (
    "id" UUID NOT NULL,
    "reference" VARCHAR(60) NOT NULL,
    "quotationId" UUID NOT NULL,
    "commercialKey" VARCHAR(180) NOT NULL,
    "installationId" UUID,
    "customerId" UUID NOT NULL,
    "siteId" UUID NOT NULL,
    "currency" "FinanceCurrency" NOT NULL,
    "totalAmount" DECIMAL(24,2) NOT NULL,
    "snapshot" JSONB NOT NULL,
    "acceptedAt" TIMESTAMPTZ(3) NOT NULL,
    "authorizedById" UUID NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinanceSalesOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinanceInvoice" (
    "id" UUID NOT NULL,
    "reference" VARCHAR(60) NOT NULL,
    "orderId" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "siteId" UUID NOT NULL,
    "currency" "FinanceCurrency" NOT NULL,
    "subtotal" DECIMAL(24,2) NOT NULL,
    "discountAmount" DECIMAL(24,2) NOT NULL,
    "taxableAmount" DECIMAL(24,2) NOT NULL,
    "taxAmount" DECIMAL(24,2) NOT NULL,
    "totalAmount" DECIMAL(24,2) NOT NULL,
    "dueAt" TIMESTAMPTZ(3) NOT NULL,
    "notes" VARCHAR(5000) NOT NULL,
    "termsSnapshot" JSONB NOT NULL,
    "status" "FinanceInvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" UUID NOT NULL,
    "issuedById" UUID,
    "issuedAt" TIMESTAMPTZ(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinanceInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinanceInvoiceLine" (
    "id" UUID NOT NULL,
    "invoiceId" UUID NOT NULL,
    "quotationLineId" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "subtotal" DECIMAL(24,2) NOT NULL,
    "discountAmount" DECIMAL(24,2) NOT NULL,
    "taxableAmount" DECIMAL(24,2) NOT NULL,
    "taxAmount" DECIMAL(24,2) NOT NULL,
    "totalAmount" DECIMAL(24,2) NOT NULL,

    CONSTRAINT "FinanceInvoiceLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancePayment" (
    "id" UUID NOT NULL,
    "reference" VARCHAR(60) NOT NULL,
    "customerId" UUID NOT NULL,
    "currency" "FinanceCurrency" NOT NULL,
    "amount" DECIMAL(24,2) NOT NULL,
    "method" "FinancePaymentMethod" NOT NULL,
    "externalReference" VARCHAR(160) NOT NULL,
    "paidAt" TIMESTAMPTZ(3) NOT NULL,
    "notes" VARCHAR(2000) NOT NULL,
    "status" "FinancePaymentStatus" NOT NULL DEFAULT 'RECORDED',
    "recordedById" UUID NOT NULL,
    "verifiedById" UUID,
    "verifiedAt" TIMESTAMPTZ(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinancePayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancePaymentAllocation" (
    "id" UUID NOT NULL,
    "paymentId" UUID NOT NULL,
    "invoiceId" UUID NOT NULL,
    "amount" DECIMAL(24,2) NOT NULL,
    "actorId" UUID NOT NULL,
    "operationId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinancePaymentAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinanceAllocationRelease" (
    "id" UUID NOT NULL,
    "allocationId" UUID NOT NULL,
    "amount" DECIMAL(24,2) NOT NULL,
    "actorId" UUID NOT NULL,
    "operationId" UUID NOT NULL,
    "reason" VARCHAR(2000) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinanceAllocationRelease_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinanceCreditNote" (
    "id" UUID NOT NULL,
    "reference" VARCHAR(60) NOT NULL,
    "customerId" UUID NOT NULL,
    "invoiceId" UUID NOT NULL,
    "currency" "FinanceCurrency" NOT NULL,
    "amount" DECIMAL(24,2) NOT NULL,
    "taxAmount" DECIMAL(24,2),
    "taxableAmount" DECIMAL(24,2),
    "adjustmentReason" VARCHAR(3000) NOT NULL,
    "status" "FinanceApprovalStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" UUID NOT NULL,
    "approvedById" UUID,
    "approvedAt" TIMESTAMPTZ(3),
    "issuedAt" TIMESTAMPTZ(3),
    "snapshot" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinanceCreditNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinanceRefund" (
    "id" UUID NOT NULL,
    "reference" VARCHAR(60) NOT NULL,
    "customerId" UUID NOT NULL,
    "paymentId" UUID NOT NULL,
    "currency" "FinanceCurrency" NOT NULL,
    "amount" DECIMAL(24,2) NOT NULL,
    "refundReason" VARCHAR(3000) NOT NULL,
    "status" "FinanceApprovalStatus" NOT NULL DEFAULT 'REQUESTED',
    "requestedById" UUID NOT NULL,
    "approvedById" UUID,
    "approvedAt" TIMESTAMPTZ(3),
    "completedById" UUID,
    "completedAt" TIMESTAMPTZ(3),
    "transferReference" VARCHAR(160),
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinanceRefund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinanceExpense" (
    "id" UUID NOT NULL,
    "reference" VARCHAR(60) NOT NULL,
    "customerId" UUID,
    "installationId" UUID,
    "serviceTicketId" UUID,
    "category" VARCHAR(60) NOT NULL,
    "description" VARCHAR(3000) NOT NULL,
    "vendorOrPayee" VARCHAR(300) NOT NULL,
    "amount" DECIMAL(24,2) NOT NULL,
    "currency" "FinanceCurrency" NOT NULL,
    "incurredAt" TIMESTAMPTZ(3) NOT NULL,
    "costBasis" VARCHAR(40) NOT NULL DEFAULT 'NET_ACTUAL_COST',
    "status" "FinanceApprovalStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" UUID NOT NULL,
    "approvedById" UUID,
    "approvedAt" TIMESTAMPTZ(3),
    "recordedAt" TIMESTAMPTZ(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinanceExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinanceServiceCharge" (
    "id" UUID NOT NULL,
    "reference" VARCHAR(60) NOT NULL,
    "customerId" UUID NOT NULL,
    "serviceTicketId" UUID NOT NULL,
    "description" VARCHAR(3000) NOT NULL,
    "allowedKinds" "FinanceLineKind"[],
    "proposedAmount" DECIMAL(24,2) NOT NULL,
    "currency" "FinanceCurrency" NOT NULL,
    "sourceSnapshot" JSONB NOT NULL,
    "status" "FinanceApprovalStatus" NOT NULL DEFAULT 'DRAFT',
    "requestedById" UUID NOT NULL,
    "approvedById" UUID,
    "approvedAt" TIMESTAMPTZ(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinanceServiceCharge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinanceOperation" (
    "id" UUID NOT NULL,
    "idempotencyKey" VARCHAR(100) NOT NULL,
    "kind" VARCHAR(60) NOT NULL,
    "requestHash" CHAR(64) NOT NULL,
    "actorId" UUID NOT NULL,
    "actorRole" "Role" NOT NULL,
    "reason" VARCHAR(2000) NOT NULL,
    "result" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinanceOperation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinanceHistory" (
    "id" UUID NOT NULL,
    "entityKind" "FinanceEntityKind" NOT NULL,
    "entityId" UUID NOT NULL,
    "quotationId" UUID,
    "orderId" UUID,
    "invoiceId" UUID,
    "paymentId" UUID,
    "creditNoteId" UUID,
    "refundId" UUID,
    "expenseId" UUID,
    "serviceChargeId" UUID,
    "actorId" UUID NOT NULL,
    "operationId" UUID,
    "version" INTEGER NOT NULL,
    "event" VARCHAR(60) NOT NULL,
    "fromStatus" VARCHAR(40),
    "toStatus" VARCHAR(40) NOT NULL,
    "reason" VARCHAR(3000) NOT NULL,
    "details" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinanceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinanceEvidence" (
    "id" UUID NOT NULL,
    "ownerVersion" INTEGER NOT NULL,
    "customerId" UUID,
    "quotationId" UUID,
    "paymentId" UUID,
    "creditNoteId" UUID,
    "refundId" UUID,
    "expenseId" UUID,
    "serviceChargeId" UUID,
    "type" "FinanceEvidenceType" NOT NULL,
    "fileName" VARCHAR(160) NOT NULL,
    "mimeType" VARCHAR(100) NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "sha256" CHAR(64) NOT NULL,
    "storageKey" VARCHAR(100) NOT NULL,
    "uploaderId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinanceEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FinanceAccessGrant_customerId_userId_key" ON "FinanceAccessGrant"("customerId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "FinancePriceBook_reference_revision_key" ON "FinancePriceBook"("reference", "revision");

-- CreateIndex
CREATE UNIQUE INDEX "FinancePriceBookLine_priceBookId_code_key" ON "FinancePriceBookLine"("priceBookId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "FinancePriceBookLine_priceBookId_componentId_key" ON "FinancePriceBookLine"("priceBookId", "componentId");

-- CreateIndex
CREATE UNIQUE INDEX "FinanceTaxRule_reference_revision_key" ON "FinanceTaxRule"("reference", "revision");

-- CreateIndex
CREATE UNIQUE INDEX "FinanceQuotation_reference_key" ON "FinanceQuotation"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "FinanceQuotation_previousId_key" ON "FinanceQuotation"("previousId");

-- CreateIndex
CREATE INDEX "FinanceQuotation_customerId_status_createdAt_id_idx" ON "FinanceQuotation"("customerId", "status", "createdAt", "id");

-- CreateIndex
CREATE UNIQUE INDEX "FinanceQuotation_seriesId_revision_key" ON "FinanceQuotation"("seriesId", "revision");

-- CreateIndex
CREATE UNIQUE INDEX "FinanceQuotationLine_quotationId_position_key" ON "FinanceQuotationLine"("quotationId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "FinanceQuotationLine_quotationId_priceBookLineId_key" ON "FinanceQuotationLine"("quotationId", "priceBookLineId");

-- CreateIndex
CREATE UNIQUE INDEX "FinanceSalesOrder_reference_key" ON "FinanceSalesOrder"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "FinanceSalesOrder_quotationId_key" ON "FinanceSalesOrder"("quotationId");

-- CreateIndex
CREATE UNIQUE INDEX "FinanceSalesOrder_commercialKey_key" ON "FinanceSalesOrder"("commercialKey");

-- CreateIndex
CREATE INDEX "FinanceSalesOrder_customerId_createdAt_id_idx" ON "FinanceSalesOrder"("customerId", "createdAt", "id");

-- CreateIndex
CREATE UNIQUE INDEX "FinanceInvoice_reference_key" ON "FinanceInvoice"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "FinanceInvoice_orderId_key" ON "FinanceInvoice"("orderId");

-- CreateIndex
CREATE INDEX "FinanceInvoice_customerId_status_dueAt_id_idx" ON "FinanceInvoice"("customerId", "status", "dueAt", "id");

-- CreateIndex
CREATE UNIQUE INDEX "FinanceInvoiceLine_invoiceId_quotationLineId_key" ON "FinanceInvoiceLine"("invoiceId", "quotationLineId");

-- CreateIndex
CREATE UNIQUE INDEX "FinanceInvoiceLine_invoiceId_position_key" ON "FinanceInvoiceLine"("invoiceId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "FinancePayment_reference_key" ON "FinancePayment"("reference");

-- CreateIndex
CREATE INDEX "FinancePayment_customerId_status_createdAt_id_idx" ON "FinancePayment"("customerId", "status", "createdAt", "id");

-- CreateIndex
CREATE UNIQUE INDEX "FinancePayment_customerId_method_externalReference_key" ON "FinancePayment"("customerId", "method", "externalReference");

-- CreateIndex
CREATE INDEX "FinancePaymentAllocation_paymentId_invoiceId_idx" ON "FinancePaymentAllocation"("paymentId", "invoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "FinancePaymentAllocation_operationId_invoiceId_key" ON "FinancePaymentAllocation"("operationId", "invoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "FinanceAllocationRelease_operationId_allocationId_key" ON "FinanceAllocationRelease"("operationId", "allocationId");

-- CreateIndex
CREATE UNIQUE INDEX "FinanceCreditNote_reference_key" ON "FinanceCreditNote"("reference");

-- CreateIndex
CREATE INDEX "FinanceCreditNote_invoiceId_status_idx" ON "FinanceCreditNote"("invoiceId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "FinanceRefund_reference_key" ON "FinanceRefund"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "FinanceRefund_transferReference_key" ON "FinanceRefund"("transferReference");

-- CreateIndex
CREATE INDEX "FinanceRefund_paymentId_status_idx" ON "FinanceRefund"("paymentId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "FinanceExpense_reference_key" ON "FinanceExpense"("reference");

-- CreateIndex
CREATE INDEX "FinanceExpense_customerId_status_incurredAt_id_idx" ON "FinanceExpense"("customerId", "status", "incurredAt", "id");

-- CreateIndex
CREATE UNIQUE INDEX "FinanceServiceCharge_reference_key" ON "FinanceServiceCharge"("reference");

-- CreateIndex
CREATE INDEX "FinanceServiceCharge_customerId_status_createdAt_id_idx" ON "FinanceServiceCharge"("customerId", "status", "createdAt", "id");

-- CreateIndex
CREATE UNIQUE INDEX "FinanceOperation_idempotencyKey_key" ON "FinanceOperation"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "FinanceHistory_entityId_version_key" ON "FinanceHistory"("entityId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "FinanceEvidence_storageKey_key" ON "FinanceEvidence"("storageKey");

-- CreateIndex
CREATE INDEX "FinanceEvidence_customerId_createdAt_id_idx" ON "FinanceEvidence"("customerId", "createdAt", "id");

-- AddForeignKey
ALTER TABLE "FinanceAccessGrant" ADD CONSTRAINT "FinanceAccessGrant_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceAccessGrant" ADD CONSTRAINT "FinanceAccessGrant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceAccessGrant" ADD CONSTRAINT "FinanceAccessGrant_grantedById_fkey" FOREIGN KEY ("grantedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancePriceBook" ADD CONSTRAINT "FinancePriceBook_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancePriceBookLine" ADD CONSTRAINT "FinancePriceBookLine_priceBookId_fkey" FOREIGN KEY ("priceBookId") REFERENCES "FinancePriceBook"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancePriceBookLine" ADD CONSTRAINT "FinancePriceBookLine_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "SolarComponent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceTaxRule" ADD CONSTRAINT "FinanceTaxRule_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceQuotation" ADD CONSTRAINT "FinanceQuotation_previousId_fkey" FOREIGN KEY ("previousId") REFERENCES "FinanceQuotation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceQuotation" ADD CONSTRAINT "FinanceQuotation_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceQuotation" ADD CONSTRAINT "FinanceQuotation_siteId_customerId_fkey" FOREIGN KEY ("siteId", "customerId") REFERENCES "Site"("id", "customerId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceQuotation" ADD CONSTRAINT "FinanceQuotation_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceQuotation" ADD CONSTRAINT "FinanceQuotation_configurationId_fkey" FOREIGN KEY ("configurationId") REFERENCES "SolarConfiguration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceQuotation" ADD CONSTRAINT "FinanceQuotation_configurationReviewId_fkey" FOREIGN KEY ("configurationReviewId") REFERENCES "SolarConfigurationReview"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceQuotation" ADD CONSTRAINT "FinanceQuotation_bomId_fkey" FOREIGN KEY ("bomId") REFERENCES "BillOfMaterials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceQuotation" ADD CONSTRAINT "FinanceQuotation_serviceChargeId_fkey" FOREIGN KEY ("serviceChargeId") REFERENCES "FinanceServiceCharge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceQuotation" ADD CONSTRAINT "FinanceQuotation_priceBookId_fkey" FOREIGN KEY ("priceBookId") REFERENCES "FinancePriceBook"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceQuotation" ADD CONSTRAINT "FinanceQuotation_preparedById_fkey" FOREIGN KEY ("preparedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceQuotation" ADD CONSTRAINT "FinanceQuotation_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceQuotationLine" ADD CONSTRAINT "FinanceQuotationLine_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "FinanceQuotation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceQuotationLine" ADD CONSTRAINT "FinanceQuotationLine_priceBookLineId_fkey" FOREIGN KEY ("priceBookLineId") REFERENCES "FinancePriceBookLine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceQuotationLine" ADD CONSTRAINT "FinanceQuotationLine_taxRuleId_fkey" FOREIGN KEY ("taxRuleId") REFERENCES "FinanceTaxRule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceSalesOrder" ADD CONSTRAINT "FinanceSalesOrder_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "FinanceQuotation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceSalesOrder" ADD CONSTRAINT "FinanceSalesOrder_installationId_fkey" FOREIGN KEY ("installationId") REFERENCES "InstallationJob"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceSalesOrder" ADD CONSTRAINT "FinanceSalesOrder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceSalesOrder" ADD CONSTRAINT "FinanceSalesOrder_siteId_customerId_fkey" FOREIGN KEY ("siteId", "customerId") REFERENCES "Site"("id", "customerId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceSalesOrder" ADD CONSTRAINT "FinanceSalesOrder_authorizedById_fkey" FOREIGN KEY ("authorizedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceInvoice" ADD CONSTRAINT "FinanceInvoice_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "FinanceSalesOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceInvoice" ADD CONSTRAINT "FinanceInvoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceInvoice" ADD CONSTRAINT "FinanceInvoice_siteId_customerId_fkey" FOREIGN KEY ("siteId", "customerId") REFERENCES "Site"("id", "customerId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceInvoice" ADD CONSTRAINT "FinanceInvoice_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceInvoice" ADD CONSTRAINT "FinanceInvoice_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceInvoiceLine" ADD CONSTRAINT "FinanceInvoiceLine_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "FinanceInvoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceInvoiceLine" ADD CONSTRAINT "FinanceInvoiceLine_quotationLineId_fkey" FOREIGN KEY ("quotationLineId") REFERENCES "FinanceQuotationLine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancePayment" ADD CONSTRAINT "FinancePayment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancePayment" ADD CONSTRAINT "FinancePayment_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancePayment" ADD CONSTRAINT "FinancePayment_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancePaymentAllocation" ADD CONSTRAINT "FinancePaymentAllocation_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "FinancePayment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancePaymentAllocation" ADD CONSTRAINT "FinancePaymentAllocation_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "FinanceInvoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancePaymentAllocation" ADD CONSTRAINT "FinancePaymentAllocation_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancePaymentAllocation" ADD CONSTRAINT "FinancePaymentAllocation_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "FinanceOperation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceAllocationRelease" ADD CONSTRAINT "FinanceAllocationRelease_allocationId_fkey" FOREIGN KEY ("allocationId") REFERENCES "FinancePaymentAllocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceAllocationRelease" ADD CONSTRAINT "FinanceAllocationRelease_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceAllocationRelease" ADD CONSTRAINT "FinanceAllocationRelease_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "FinanceOperation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceCreditNote" ADD CONSTRAINT "FinanceCreditNote_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceCreditNote" ADD CONSTRAINT "FinanceCreditNote_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "FinanceInvoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceCreditNote" ADD CONSTRAINT "FinanceCreditNote_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceCreditNote" ADD CONSTRAINT "FinanceCreditNote_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceRefund" ADD CONSTRAINT "FinanceRefund_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceRefund" ADD CONSTRAINT "FinanceRefund_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "FinancePayment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceRefund" ADD CONSTRAINT "FinanceRefund_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceRefund" ADD CONSTRAINT "FinanceRefund_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceRefund" ADD CONSTRAINT "FinanceRefund_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceExpense" ADD CONSTRAINT "FinanceExpense_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceExpense" ADD CONSTRAINT "FinanceExpense_installationId_fkey" FOREIGN KEY ("installationId") REFERENCES "InstallationJob"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceExpense" ADD CONSTRAINT "FinanceExpense_serviceTicketId_fkey" FOREIGN KEY ("serviceTicketId") REFERENCES "ServiceTicket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceExpense" ADD CONSTRAINT "FinanceExpense_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceExpense" ADD CONSTRAINT "FinanceExpense_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceServiceCharge" ADD CONSTRAINT "FinanceServiceCharge_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceServiceCharge" ADD CONSTRAINT "FinanceServiceCharge_serviceTicketId_fkey" FOREIGN KEY ("serviceTicketId") REFERENCES "ServiceTicket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceServiceCharge" ADD CONSTRAINT "FinanceServiceCharge_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceServiceCharge" ADD CONSTRAINT "FinanceServiceCharge_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceOperation" ADD CONSTRAINT "FinanceOperation_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceHistory" ADD CONSTRAINT "FinanceHistory_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "FinanceQuotation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceHistory" ADD CONSTRAINT "FinanceHistory_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "FinanceSalesOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceHistory" ADD CONSTRAINT "FinanceHistory_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "FinanceInvoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceHistory" ADD CONSTRAINT "FinanceHistory_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "FinancePayment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceHistory" ADD CONSTRAINT "FinanceHistory_creditNoteId_fkey" FOREIGN KEY ("creditNoteId") REFERENCES "FinanceCreditNote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceHistory" ADD CONSTRAINT "FinanceHistory_refundId_fkey" FOREIGN KEY ("refundId") REFERENCES "FinanceRefund"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceHistory" ADD CONSTRAINT "FinanceHistory_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "FinanceExpense"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceHistory" ADD CONSTRAINT "FinanceHistory_serviceChargeId_fkey" FOREIGN KEY ("serviceChargeId") REFERENCES "FinanceServiceCharge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceHistory" ADD CONSTRAINT "FinanceHistory_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceHistory" ADD CONSTRAINT "FinanceHistory_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "FinanceOperation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceEvidence" ADD CONSTRAINT "FinanceEvidence_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceEvidence" ADD CONSTRAINT "FinanceEvidence_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "FinanceQuotation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceEvidence" ADD CONSTRAINT "FinanceEvidence_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "FinancePayment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceEvidence" ADD CONSTRAINT "FinanceEvidence_creditNoteId_fkey" FOREIGN KEY ("creditNoteId") REFERENCES "FinanceCreditNote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceEvidence" ADD CONSTRAINT "FinanceEvidence_refundId_fkey" FOREIGN KEY ("refundId") REFERENCES "FinanceRefund"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceEvidence" ADD CONSTRAINT "FinanceEvidence_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "FinanceExpense"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceEvidence" ADD CONSTRAINT "FinanceEvidence_serviceChargeId_fkey" FOREIGN KEY ("serviceChargeId") REFERENCES "FinanceServiceCharge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceEvidence" ADD CONSTRAINT "FinanceEvidence_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- M09 invariants. Earlier migrations and business records are not rewritten.
ALTER TABLE "FinancePriceBook" ADD CONSTRAINT "FinancePriceBook_values" CHECK ("version">0 AND "revision">0 AND "lineCount" BETWEEN 1 AND 150 AND "discountApprovalPercent" BETWEEN 0 AND 100 AND "approvalThresholdAmount" BETWEEN 0 AND 9999999999999999999999.99 AND ("effectiveTo" IS NULL OR "effectiveTo">"effectiveFrom"));
ALTER TABLE "FinancePriceBookLine" ADD CONSTRAINT "FinancePriceBookLine_values" CHECK (("kind"='COMPONENT')=("componentId" IS NOT NULL) AND "unitPrice" BETWEEN 0 AND 99999999999999.9999 AND (("estimatedUnitCost" IS NULL)=("costSourceNotes" IS NULL)) AND ("estimatedUnitCost" IS NULL OR ("estimatedUnitCost" BETWEEN 0 AND 99999999999999.9999 AND length(btrim("costSourceNotes"))>0)));
ALTER TABLE "FinanceTaxRule" ADD CONSTRAINT "FinanceTaxRule_values" CHECK ("version">0 AND "revision">0 AND "ratePercent" BETWEEN 0 AND 100 AND ("effectiveTo" IS NULL OR "effectiveTo">"effectiveFrom"));
ALTER TABLE "FinanceQuotation" ADD CONSTRAINT "FinanceQuotation_values" CHECK ("version">0 AND "revision">0 AND "subtotal" BETWEEN 0 AND 9999999999999999999999.99 AND "discountAmount" BETWEEN 0 AND "subtotal" AND "taxAmount" BETWEEN 0 AND 9999999999999999999999.99 AND "taxableAmount"="subtotal"-"discountAmount" AND "totalAmount"="taxableAmount"+"taxAmount" AND "totalAmount">0 AND (("estimatedCost" IS NULL AND "estimatedMargin" IS NULL AND "sensitivePricing") OR ("estimatedCost" BETWEEN 0 AND 9999999999999999999999.99 AND "estimatedMargin" IS NOT NULL AND "estimatedMargin"="taxableAmount"-"estimatedCost")) AND (("kind"='INSTALLATION' AND "configurationId" IS NOT NULL AND "configurationApprovedVersion" IS NOT NULL AND "configurationReviewId" IS NOT NULL AND "bomId" IS NOT NULL AND "bomVersion" IS NOT NULL AND "serviceChargeId" IS NULL) OR ("kind"='SERVICE' AND "configurationId" IS NULL AND "configurationApprovedVersion" IS NULL AND "configurationReviewId" IS NULL AND "bomId" IS NULL AND "bomVersion" IS NULL AND "serviceChargeId" IS NOT NULL)) AND jsonb_typeof("sourceSnapshot")='object' AND jsonb_typeof("pricingSnapshot")='object');
CREATE UNIQUE INDEX "FinanceQuotation_one_accepted_project" ON "FinanceQuotation"("commercialKey") WHERE "status"='ACCEPTED';
ALTER TABLE "FinanceQuotationLine" ADD CONSTRAINT "FinanceQuotationLine_values" CHECK ("quantity">0 AND "quantity"<=999999999.999 AND "unitPrice" BETWEEN 0 AND 99999999999999.9999 AND "position">=0 AND "subtotal">=0 AND "enteredDiscount" BETWEEN 0 AND "extendedPrice" AND "discountAmount" BETWEEN 0 AND "subtotal" AND "taxableAmount"="subtotal"-"discountAmount" AND "taxAmount">=0 AND "totalAmount"="taxableAmount"+"taxAmount");
ALTER TABLE "FinanceInvoice" ADD CONSTRAINT "FinanceInvoice_values" CHECK ("version">0 AND "subtotal" BETWEEN 0 AND 9999999999999999999999.99 AND "discountAmount" BETWEEN 0 AND "subtotal" AND "taxAmount" BETWEEN 0 AND 9999999999999999999999.99 AND "taxableAmount"="subtotal"-"discountAmount" AND "totalAmount"="taxableAmount"+"taxAmount" AND "totalAmount">0 AND ("status"<>'ISSUED' OR ("issuedAt" IS NOT NULL AND "issuedById" IS NOT NULL)));
ALTER TABLE "FinanceInvoiceLine" ADD CONSTRAINT "FinanceInvoiceLine_values" CHECK ("position">=0 AND "subtotal">=0 AND "discountAmount" BETWEEN 0 AND "subtotal" AND "taxableAmount"="subtotal"-"discountAmount" AND "taxAmount">=0 AND "totalAmount"="taxableAmount"+"taxAmount");
ALTER TABLE "FinancePayment" ADD CONSTRAINT "FinancePayment_values" CHECK ("version">0 AND "amount">0 AND "amount"<=9999999999999999999999.99 AND "paidAt">='1900-01-01' AND ("status" NOT IN ('VERIFIED','REVERSED') OR ("verifiedById" IS NOT NULL AND "verifiedAt" IS NOT NULL AND "verifiedById"<>"recordedById")));
ALTER TABLE "FinancePaymentAllocation" ADD CONSTRAINT "FinancePaymentAllocation_amount" CHECK ("amount">0 AND "amount"<=9999999999999999999999.99);
ALTER TABLE "FinanceAllocationRelease" ADD CONSTRAINT "FinanceAllocationRelease_amount" CHECK ("amount">0 AND "amount"<=9999999999999999999999.99);
ALTER TABLE "FinanceCreditNote" ADD CONSTRAINT "FinanceCreditNote_values" CHECK ("version">0 AND "amount">0 AND "amount"<=9999999999999999999999.99 AND "status" IN ('DRAFT','SUBMITTED','APPROVED','REJECTED','ISSUED','CANCELLED') AND ("status"<>'ISSUED' OR ("issuedAt" IS NOT NULL AND "taxAmount" IS NOT NULL AND "taxableAmount" IS NOT NULL AND "taxAmount">=0 AND "taxableAmount">=0 AND "amount"="taxableAmount"+"taxAmount")));
ALTER TABLE "FinanceRefund" ADD CONSTRAINT "FinanceRefund_values" CHECK ("version">0 AND "amount">0 AND "amount"<=9999999999999999999999.99 AND "status" IN ('REQUESTED','APPROVED','REJECTED','COMPLETED','CANCELLED') AND ("status" NOT IN ('APPROVED','COMPLETED') OR ("approvedAt" IS NOT NULL AND "approvedById" IS NOT NULL AND "approvedById"<>"requestedById")) AND ("status"<>'COMPLETED' OR ("completedAt" IS NOT NULL AND "completedAt">="approvedAt" AND "completedById" IS NOT NULL AND "completedById"<>"requestedById" AND "transferReference" IS NOT NULL)));
ALTER TABLE "FinanceExpense" ADD CONSTRAINT "FinanceExpense_values" CHECK ("version">0 AND "amount">0 AND "amount"<=9999999999999999999999.99 AND "status" IN ('DRAFT','SUBMITTED','APPROVED','REJECTED','RECORDED','CANCELLED') AND "costBasis"='NET_ACTUAL_COST' AND "category" IN ('LABOR','TRANSPORT','EQUIPMENT_COST','CONSUMABLES','SERVICE_EXPENSE','REIMBURSEMENT','OFFICE','OTHER') AND ("status"<>'RECORDED' OR "recordedAt" IS NOT NULL));
ALTER TABLE "FinanceServiceCharge" ADD CONSTRAINT "FinanceServiceCharge_values" CHECK ("version">0 AND "proposedAmount">0 AND "proposedAmount"<=9999999999999999999999.99 AND "status" IN ('DRAFT','SUBMITTED','APPROVED','REJECTED','CANCELLED') AND cardinality("allowedKinds") BETWEEN 1 AND 3 AND "allowedKinds"<@ARRAY['SERVICE_LABOR','TRANSPORT','OTHER_FEE']::"FinanceLineKind"[] AND jsonb_typeof("sourceSnapshot")='object');
ALTER TABLE "FinanceHistory" ADD CONSTRAINT "FinanceHistory_owner" CHECK ("version">0 AND num_nonnulls("quotationId","orderId","invoiceId","paymentId","creditNoteId","refundId","expenseId","serviceChargeId")=1 AND "entityId"=coalesce("quotationId","orderId","invoiceId","paymentId","creditNoteId","refundId","expenseId","serviceChargeId") AND (("entityKind"='QUOTATION' AND "quotationId" IS NOT NULL) OR ("entityKind"='ORDER' AND "orderId" IS NOT NULL) OR ("entityKind"='INVOICE' AND "invoiceId" IS NOT NULL) OR ("entityKind"='PAYMENT' AND "paymentId" IS NOT NULL) OR ("entityKind"='CREDIT_NOTE' AND "creditNoteId" IS NOT NULL) OR ("entityKind"='REFUND' AND "refundId" IS NOT NULL) OR ("entityKind"='EXPENSE' AND "expenseId" IS NOT NULL) OR ("entityKind"='SERVICE_CHARGE' AND "serviceChargeId" IS NOT NULL)) AND jsonb_typeof("details")='object');
ALTER TABLE "FinanceEvidence" ADD CONSTRAINT "FinanceEvidence_owner_values" CHECK ("ownerVersion">0 AND num_nonnulls("quotationId","paymentId","creditNoteId","refundId","expenseId","serviceChargeId")=1 AND "sizeBytes" BETWEEN 1 AND 10485760 AND "mimeType" IN ('image/jpeg','image/png','application/pdf') AND "storageKey" ~ '^[a-f0-9-]{36}\.(jpg|png|pdf)$' AND "sha256" ~ '^[a-f0-9]{64}$');

CREATE FUNCTION "m09_immutable"() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Historical finance records cannot be updated or deleted' USING ERRCODE='23514';END; $$;
CREATE TRIGGER "FinancePriceBookLine_immutable" BEFORE UPDATE OR DELETE ON "FinancePriceBookLine" FOR EACH ROW EXECUTE FUNCTION "m09_immutable"();
CREATE TRIGGER "FinanceInvoiceLine_immutable" BEFORE UPDATE OR DELETE ON "FinanceInvoiceLine" FOR EACH ROW EXECUTE FUNCTION "m09_immutable"();
CREATE TRIGGER "FinancePaymentAllocation_immutable" BEFORE UPDATE OR DELETE ON "FinancePaymentAllocation" FOR EACH ROW EXECUTE FUNCTION "m09_immutable"();
CREATE TRIGGER "FinanceAllocationRelease_immutable" BEFORE UPDATE OR DELETE ON "FinanceAllocationRelease" FOR EACH ROW EXECUTE FUNCTION "m09_immutable"();
CREATE TRIGGER "FinanceHistory_immutable" BEFORE UPDATE OR DELETE ON "FinanceHistory" FOR EACH ROW EXECUTE FUNCTION "m09_immutable"();
CREATE TRIGGER "FinanceEvidence_immutable" BEFORE UPDATE OR DELETE ON "FinanceEvidence" FOR EACH ROW EXECUTE FUNCTION "m09_immutable"();

CREATE FUNCTION "m09_allocation_remaining"(allocation_id uuid) RETURNS numeric LANGUAGE sql STABLE AS $$ SELECT a."amount"-coalesce((SELECT sum("amount") FROM "FinanceAllocationRelease" WHERE "allocationId"=a."id"),0) FROM "FinancePaymentAllocation" a WHERE a."id"=allocation_id; $$;
CREATE FUNCTION "m09_assert_invoice_funds"(invoice_id uuid) RETURNS void LANGUAGE plpgsql AS $$
DECLARE i "FinanceInvoice"%ROWTYPE; credits numeric; tax_credits numeric; net_credits numeric; paid numeric;
BEGIN
 SELECT * INTO i FROM "FinanceInvoice" WHERE "id"=invoice_id;IF NOT FOUND THEN RETURN;END IF;
 SELECT coalesce(sum("amount"),0),coalesce(sum("taxAmount"),0),coalesce(sum("taxableAmount"),0) INTO credits,tax_credits,net_credits FROM "FinanceCreditNote" WHERE "invoiceId"=i."id" AND "status"='ISSUED';
 SELECT coalesce(sum("m09_allocation_remaining"("id")),0) INTO paid FROM "FinancePaymentAllocation" WHERE "invoiceId"=i."id";
 IF credits>i."totalAmount" OR tax_credits>i."taxAmount" OR net_credits>i."taxableAmount" OR paid<0 OR paid>i."totalAmount"-credits OR (i."status"<>'ISSUED' AND (paid<>0 OR credits<>0)) THEN RAISE EXCEPTION 'Invoice credit/payment limits violated' USING ERRCODE='23514';END IF;
 IF EXISTS(SELECT 1 FROM "FinancePaymentAllocation" a JOIN "FinancePayment" p ON p."id"=a."paymentId" WHERE a."invoiceId"=i."id" AND (p."customerId"<>i."customerId" OR p."currency"<>i."currency" OR "m09_allocation_remaining"(a."id")<0 OR ("m09_allocation_remaining"(a."id")>0 AND p."status"<>'VERIFIED'))) THEN RAISE EXCEPTION 'Allocation must share customer/currency and verified funds, with bounded releases' USING ERRCODE='23514';END IF;
END; $$;
CREATE FUNCTION "m09_assert_payment_funds"(payment_id uuid) RETURNS void LANGUAGE plpgsql AS $$
DECLARE p "FinancePayment"%ROWTYPE; paid numeric; refunds numeric;
BEGIN
 SELECT * INTO p FROM "FinancePayment" WHERE "id"=payment_id;IF NOT FOUND THEN RETURN;END IF;
 SELECT coalesce(sum("m09_allocation_remaining"("id")),0) INTO paid FROM "FinancePaymentAllocation" WHERE "paymentId"=p."id";
 SELECT coalesce(sum("amount"),0) INTO refunds FROM "FinanceRefund" WHERE "paymentId"=p."id" AND "status" IN ('APPROVED','COMPLETED');
 IF paid<0 OR refunds<0 OR paid+refunds>p."amount" OR (p."status"<>'VERIFIED' AND (paid<>0 OR refunds<>0)) THEN RAISE EXCEPTION 'Verified payment allocation/refund capacity violated' USING ERRCODE='23514';END IF;
 IF EXISTS(SELECT 1 FROM "FinancePaymentAllocation" a WHERE a."paymentId"=p."id" AND "m09_allocation_remaining"(a."id")<0) OR EXISTS(SELECT 1 FROM "FinanceRefund" WHERE "paymentId"=p."id" AND ("customerId"<>p."customerId" OR "currency"<>p."currency")) THEN RAISE EXCEPTION 'Refund/release source ownership violated' USING ERRCODE='23514';END IF;
END; $$;
CREATE FUNCTION "m09_funds_deferred"() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE n jsonb:=to_jsonb(NEW); invoice_id uuid; payment_id uuid;
BEGIN
 IF TG_TABLE_NAME='FinanceInvoice' THEN invoice_id:=(n->>'id')::uuid;
 ELSIF TG_TABLE_NAME='FinancePayment' THEN payment_id:=(n->>'id')::uuid;
 ELSIF TG_TABLE_NAME='FinanceAllocationRelease' THEN SELECT "invoiceId","paymentId" INTO invoice_id,payment_id FROM "FinancePaymentAllocation" WHERE "id"=(n->>'allocationId')::uuid;
 ELSE invoice_id:=(n->>'invoiceId')::uuid;payment_id:=(n->>'paymentId')::uuid;END IF;
 IF invoice_id IS NOT NULL THEN PERFORM "m09_assert_invoice_funds"(invoice_id);END IF;IF payment_id IS NOT NULL THEN PERFORM "m09_assert_payment_funds"(payment_id);END IF;RETURN NEW;
END; $$;
CREATE CONSTRAINT TRIGGER "FinanceInvoice_funds" AFTER INSERT OR UPDATE ON "FinanceInvoice" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION "m09_funds_deferred"();
CREATE CONSTRAINT TRIGGER "FinancePayment_funds" AFTER INSERT OR UPDATE ON "FinancePayment" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION "m09_funds_deferred"();
CREATE CONSTRAINT TRIGGER "FinancePaymentAllocation_funds" AFTER INSERT ON "FinancePaymentAllocation" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION "m09_funds_deferred"();
CREATE CONSTRAINT TRIGGER "FinanceAllocationRelease_funds" AFTER INSERT ON "FinanceAllocationRelease" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION "m09_funds_deferred"();
CREATE CONSTRAINT TRIGGER "FinanceCreditNote_funds" AFTER INSERT OR UPDATE ON "FinanceCreditNote" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION "m09_funds_deferred"();
CREATE CONSTRAINT TRIGGER "FinanceRefund_funds" AFTER INSERT OR UPDATE ON "FinanceRefund" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION "m09_funds_deferred"();

CREATE FUNCTION "m09_catalog"() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE n jsonb:=to_jsonb(NEW); o jsonb:=to_jsonb(OLD); previous_revision integer;
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Deactivate pricing; preserve published history' USING ERRCODE='23514';END IF;
 IF TG_OP='UPDATE' THEN
  IF (n-ARRAY['isActive','version']) IS DISTINCT FROM (o-ARRAY['isActive','version']) OR (n->>'version')::int<>(o->>'version')::int+1 OR NOT (o->>'isActive')::boolean OR (n->>'isActive')::boolean THEN RAISE EXCEPTION 'Published pricing/tax terms immutable; only versioned deactivation allowed' USING ERRCODE='23514';END IF;
 ELSE
  IF NOT EXISTS(SELECT 1 FROM "User" WHERE "id"=(n->>'publishedById')::uuid AND "isActive" AND "role"='ADMIN') THEN RAISE EXCEPTION 'Active ADMIN publishes explicit pricing/tax terms' USING ERRCODE='23514';END IF;
  IF TG_TABLE_NAME='FinancePriceBook' THEN SELECT coalesce(max("revision"),0) INTO previous_revision FROM "FinancePriceBook" WHERE "reference"=n->>'reference';ELSE SELECT coalesce(max("revision"),0) INTO previous_revision FROM "FinanceTaxRule" WHERE "reference"=n->>'reference';END IF;
  IF (n->>'revision')::int<>previous_revision+1 OR (n->>'version')::int<>1 THEN RAISE EXCEPTION 'Publish next immutable pricing revision' USING ERRCODE='23514';END IF;
 END IF;RETURN NEW;
END; $$;
CREATE TRIGGER "FinancePriceBook_guard" BEFORE INSERT OR UPDATE OR DELETE ON "FinancePriceBook" FOR EACH ROW EXECUTE FUNCTION "m09_catalog"();
CREATE TRIGGER "FinanceTaxRule_guard" BEFORE INSERT OR UPDATE OR DELETE ON "FinanceTaxRule" FOR EACH ROW EXECUTE FUNCTION "m09_catalog"();
CREATE FUNCTION "m09_book_count"() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE book_id uuid; expected integer;
BEGIN
 IF TG_TABLE_NAME='FinancePriceBook' THEN book_id:=NEW."id";ELSE book_id:=NEW."priceBookId";END IF;SELECT "lineCount" INTO expected FROM "FinancePriceBook" WHERE "id"=book_id;
 IF (SELECT count(*) FROM "FinancePriceBookLine" WHERE "priceBookId"=book_id)<>expected THEN RAISE EXCEPTION 'Published price-book line set is sealed' USING ERRCODE='23514';END IF;RETURN NEW;
END; $$;
CREATE CONSTRAINT TRIGGER "FinancePriceBook_sealed" AFTER INSERT ON "FinancePriceBook" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION "m09_book_count"();
CREATE CONSTRAINT TRIGGER "FinancePriceBookLine_sealed" AFTER INSERT ON "FinancePriceBookLine" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION "m09_book_count"();

CREATE FUNCTION "m09_quote_line"() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE q "FinanceQuotation"%ROWTYPE; p "FinancePriceBookLine"%ROWTYPE; tax "FinanceTaxRule"%ROWTYPE; ext numeric; tax_before numeric; discounted numeric; taxable numeric; tax_after numeric; owner_id uuid;
BEGIN
 IF TG_OP='DELETE' THEN owner_id:=OLD."quotationId";ELSE owner_id:=NEW."quotationId";END IF;SELECT * INTO q FROM "FinanceQuotation" WHERE "id"=owner_id;
 IF q."status"<>'DRAFT' THEN RAISE EXCEPTION 'Submitted/sent/accepted quotation lines are immutable' USING ERRCODE='23514';END IF;IF TG_OP='DELETE' THEN RETURN OLD;END IF;IF TG_OP='UPDATE' THEN RAISE EXCEPTION 'Replace draft selections with audited parent version change' USING ERRCODE='23514';END IF;
 SELECT * INTO p FROM "FinancePriceBookLine" WHERE "id"=NEW."priceBookLineId";SELECT * INTO tax FROM "FinanceTaxRule" WHERE "id"=NEW."taxRuleId";
 IF ROW((NEW."taxSnapshot"->>'id')::uuid,(NEW."taxSnapshot"->>'ratePercent')::numeric,(NEW."taxSnapshot"->>'inclusive')::boolean,NEW."taxSnapshot"->>'currency',NEW."taxSnapshot"->>'name') IS DISTINCT FROM ROW(tax."id",tax."ratePercent",tax."inclusive",tax."currency"::text,tax."name") THEN RAISE EXCEPTION 'Tax snapshot must preserve configured identity/rate/basis/currency/name' USING ERRCODE='23514';END IF;
 IF p."priceBookId"<>q."priceBookId" OR tax."currency"<>q."currency" OR NOT tax."isActive" OR tax."effectiveFrom">clock_timestamp() OR tax."effectiveTo"<=clock_timestamp() OR NEW."kind"<>p."kind" OR NEW."unitPrice"<>p."unitPrice" OR NEW."unit"<>p."unit" OR NEW."description"<>p."description" THEN RAISE EXCEPTION 'Quotation requires exact configured selling-price/tax identity' USING ERRCODE='23514';END IF;
 IF p."kind"='COMPONENT' AND NOT EXISTS(SELECT 1 FROM "BOMLine" WHERE "bomId"=q."bomId" AND "componentId"=p."componentId" AND "quantity"=NEW."quantity" AND "unit"::text=NEW."unit") THEN RAISE EXCEPTION 'Quote exact approved BOM quantities/units, not purchase cost as selling price' USING ERRCODE='23514';END IF;
 IF q."kind"='SERVICE' AND (p."kind"='COMPONENT' OR NOT EXISTS(SELECT 1 FROM "FinanceServiceCharge" WHERE "id"=q."serviceChargeId" AND p."kind"=ANY("allowedKinds"))) THEN RAISE EXCEPTION 'Pending service parts cannot become billable consumed equipment' USING ERRCODE='23514';END IF;
 IF q."kind"='INSTALLATION' AND p."kind"='SERVICE_LABOR' THEN RAISE EXCEPTION 'Installation uses installation labor pricing' USING ERRCODE='23514';END IF;
 ext:=round(NEW."quantity"*NEW."unitPrice",2);discounted:=ext-NEW."enteredDiscount";
 IF tax."inclusive" THEN tax_before:=round(ext-ext/(1+tax."ratePercent"/100),2);tax_after:=round(discounted-discounted/(1+tax."ratePercent"/100),2);taxable:=discounted-tax_after;
 ELSE tax_before:=0;tax_after:=round(discounted*tax."ratePercent"/100,2);taxable:=discounted;END IF;
 IF ROW(NEW."extendedPrice",NEW."subtotal",NEW."discountAmount",NEW."taxableAmount",NEW."taxAmount",NEW."totalAmount") IS DISTINCT FROM ROW(ext,ext-tax_before,ext-tax_before-taxable,taxable,tax_after,taxable+tax_after) OR NEW."estimatedCost" IS DISTINCT FROM (CASE WHEN p."estimatedUnitCost" IS NOT NULL THEN round(NEW."quantity"*p."estimatedUnitCost",2) ELSE NULL END) THEN RAISE EXCEPTION 'Decimal line calculation/rounding mismatch' USING ERRCODE='23514';END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER "FinanceQuotationLine_guard" BEFORE INSERT OR UPDATE OR DELETE ON "FinanceQuotationLine" FOR EACH ROW EXECUTE FUNCTION "m09_quote_line"();

CREATE FUNCTION "m09_document_totals"() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE n jsonb:=coalesce(to_jsonb(NEW),to_jsonb(OLD)); owner_id uuid; q "FinanceQuotation"%ROWTYPE; i "FinanceInvoice"%ROWTYPE; totals record; book "FinancePriceBook"%ROWTYPE; sensitive boolean;
BEGIN
 IF TG_TABLE_NAME IN ('FinanceQuotation','FinanceQuotationLine') THEN
  owner_id:=CASE WHEN TG_TABLE_NAME='FinanceQuotation' THEN (n->>'id')::uuid ELSE (n->>'quotationId')::uuid END;SELECT * INTO q FROM "FinanceQuotation" WHERE "id"=owner_id;
  SELECT coalesce(sum("subtotal"),0) subtotal,coalesce(sum("discountAmount"),0) discount,coalesce(sum("taxableAmount"),0) taxable,coalesce(sum("taxAmount"),0) tax,coalesce(sum("totalAmount"),0) total,CASE WHEN count(*)=count("estimatedCost") THEN sum("estimatedCost") ELSE NULL END cost,count(*) lines INTO totals FROM "FinanceQuotationLine" WHERE "quotationId"=owner_id;
  IF totals.lines<1 OR totals.lines>150 OR ROW(q."subtotal",q."discountAmount",q."taxableAmount",q."taxAmount",q."totalAmount",q."estimatedCost") IS DISTINCT FROM ROW(totals.subtotal,totals.discount,totals.taxable,totals.tax,totals.total,totals.cost) THEN RAISE EXCEPTION 'Quotation header must match immutable priced lines' USING ERRCODE='23514';END IF;
  IF q."kind"='INSTALLATION' AND EXISTS(SELECT 1 FROM "BOMLine" b WHERE b."bomId"=q."bomId" AND NOT EXISTS(SELECT 1 FROM "FinanceQuotationLine" l JOIN "FinancePriceBookLine" p ON p."id"=l."priceBookLineId" WHERE l."quotationId"=q."id" AND p."kind"='COMPONENT' AND p."componentId"=b."componentId" AND l."quantity"=b."quantity" AND l."unit"=b."unit"::text)) THEN RAISE EXCEPTION 'Quotation must price every approved BOM component' USING ERRCODE='23514';END IF;
  SELECT * INTO book FROM "FinancePriceBook" WHERE "id"=q."priceBookId";
  IF EXISTS(SELECT 1 FROM "FinanceQuotationLine" l JOIN "FinancePriceBookLine" p ON p."id"=l."priceBookLineId" WHERE l."quotationId"=q."id" AND p."kind"='COMPONENT' GROUP BY p."componentId" HAVING count(*)>1) THEN RAISE EXCEPTION 'Price each approved BOM component exactly once' USING ERRCODE='23514';END IF;
  sensitive:=totals.cost IS NULL OR totals.taxable-totals.cost<0 OR totals.total>book."approvalThresholdAmount" OR EXISTS(SELECT 1 FROM "FinanceQuotationLine" WHERE "quotationId"=q."id" AND "extendedPrice">0 AND "enteredDiscount"/"extendedPrice"*100>book."discountApprovalPercent");
  IF q."sensitivePricing" IS DISTINCT FROM sensitive THEN RAISE EXCEPTION 'Sensitive-pricing approval flag must follow configured thresholds/uncertainty' USING ERRCODE='23514';END IF;
 ELSE
  owner_id:=CASE WHEN TG_TABLE_NAME='FinanceInvoice' THEN (n->>'id')::uuid ELSE (n->>'invoiceId')::uuid END;SELECT * INTO i FROM "FinanceInvoice" WHERE "id"=owner_id;
  SELECT coalesce(sum("subtotal"),0) subtotal,coalesce(sum("discountAmount"),0) discount,coalesce(sum("taxableAmount"),0) taxable,coalesce(sum("taxAmount"),0) tax,coalesce(sum("totalAmount"),0) total,count(*) lines INTO totals FROM "FinanceInvoiceLine" WHERE "invoiceId"=owner_id;
  IF ROW(i."subtotal",i."discountAmount",i."taxableAmount",i."taxAmount",i."totalAmount") IS DISTINCT FROM ROW(totals.subtotal,totals.discount,totals.taxable,totals.tax,totals.total) OR totals.lines<>(SELECT count(*) FROM "FinanceQuotationLine" WHERE "quotationId"=(SELECT "quotationId" FROM "FinanceSalesOrder" WHERE "id"=i."orderId")) THEN RAISE EXCEPTION 'Invoice must preserve full accepted order line totals' USING ERRCODE='23514';END IF;
 END IF;IF TG_OP='DELETE' THEN RETURN OLD;ELSE RETURN NEW;END IF;
END; $$;
CREATE CONSTRAINT TRIGGER "FinanceQuotation_totals" AFTER INSERT OR UPDATE ON "FinanceQuotation" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION "m09_document_totals"();
CREATE CONSTRAINT TRIGGER "FinanceQuotationLine_totals" AFTER INSERT OR DELETE ON "FinanceQuotationLine" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION "m09_document_totals"();
CREATE CONSTRAINT TRIGGER "FinanceInvoice_totals" AFTER INSERT OR UPDATE ON "FinanceInvoice" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION "m09_document_totals"();
CREATE CONSTRAINT TRIGGER "FinanceInvoiceLine_totals" AFTER INSERT ON "FinanceInvoiceLine" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION "m09_document_totals"();

CREATE FUNCTION "m09_service_source"(ticket_id uuid,snapshot jsonb) RETURNS void LANGUAGE plpgsql AS $$
DECLARE t "ServiceTicket"%ROWTYPE; review_id uuid;
BEGIN
 SELECT * INTO t FROM "ServiceTicket" WHERE "id"=ticket_id;SELECT "id" INTO review_id FROM "ServiceClosureReview" WHERE "ticketId"=ticket_id ORDER BY "ticketVersion" DESC LIMIT 1;
 IF t."status" IS DISTINCT FROM 'CLOSED' OR review_id IS NULL OR (snapshot->>'executionRevision')::int IS DISTINCT FROM t."executionRevision" OR (snapshot->>'closureReviewId')::uuid IS DISTINCT FROM review_id THEN RAISE EXCEPTION 'Service billing source must preserve exact current closure cycle/review' USING ERRCODE='23514';END IF;
END; $$;
CREATE FUNCTION "m09_quote_source"(quotation_id uuid) RETURNS void LANGUAGE plpgsql AS $$
DECLARE q "FinanceQuotation"%ROWTYPE; c "SolarConfiguration"%ROWTYPE; s "SiteSurvey"%ROWTYPE; b "BillOfMaterials"%ROWTYPE; charge "FinanceServiceCharge"%ROWTYPE; j "InstallationJob"%ROWTYPE; expected_key text;
BEGIN
 SELECT * INTO q FROM "FinanceQuotation" WHERE "id"=quotation_id;
 IF q."kind"='INSTALLATION' THEN
  SELECT * INTO c FROM "SolarConfiguration" WHERE "id"=q."configurationId";SELECT * INTO b FROM "BillOfMaterials" WHERE "id"=q."bomId";SELECT * INTO s FROM "SiteSurvey" WHERE "id"=c."approvedSurveyId";
  IF c."status" IS DISTINCT FROM 'APPROVED' OR c."approvedVersion" IS DISTINCT FROM q."configurationApprovedVersion" OR ROW(c."customerId",c."siteId",c."leadId") IS DISTINCT FROM ROW(q."customerId",q."siteId",q."leadId") OR b."configurationId" IS DISTINCT FROM c."id" OR b."version" IS DISTINCT FROM q."bomVersion" OR b."status" IS DISTINCT FROM 'APPROVED' OR NOT EXISTS(SELECT 1 FROM "SolarConfigurationReview" WHERE "id"=q."configurationReviewId" AND "configurationId"=c."id" AND "configurationVersion"=c."approvedVersion" AND "decision"='APPROVED') OR EXISTS(SELECT 1 FROM "SolarConfiguration" WHERE "previousConfigurationId"=c."id") THEN RAISE EXCEPTION 'Exact current approved configuration/BOM/review required for quotation' USING ERRCODE='23514';END IF;
  IF s."status" IS DISTINCT FROM 'APPROVED' OR s."approvedVersion" IS DISTINCT FROM c."approvedSurveyVersion" OR NOT EXISTS(SELECT 1 FROM "SurveyReview" WHERE "id"=c."surveyReviewId" AND "surveyId"=s."id" AND "surveyVersion"=c."approvedSurveyVersion" AND "decision"='APPROVED') OR EXISTS(SELECT 1 FROM "SiteSurvey" WHERE "previousSurveyId"=s."id") OR EXISTS(SELECT 1 FROM "Customer" WHERE "id"=q."customerId" AND "isArchived") OR NOT EXISTS(SELECT 1 FROM "Lead" WHERE "id"=q."leadId" AND "status"='SURVEY_REQUESTED') THEN RAISE EXCEPTION 'M02 feasibility handoff is stale/ineligible' USING ERRCODE='23514';END IF;
  expected_key:='INSTALLATION:'||q."leadId"::text||':'||q."siteId"::text;
 ELSE
  SELECT * INTO charge FROM "FinanceServiceCharge" WHERE "id"=q."serviceChargeId";SELECT j0.* INTO j FROM "InstallationJob" j0 JOIN "ServiceTicket" t ON t."installationId"=j0."id" WHERE t."id"=charge."serviceTicketId";
  IF charge."status" IS DISTINCT FROM 'APPROVED' OR ROW(j."customerId",j."siteId",j."leadId") IS DISTINCT FROM ROW(q."customerId",q."siteId",q."leadId") OR q."currency"<>charge."currency" OR q."totalAmount">charge."proposedAmount" THEN RAISE EXCEPTION 'Service quote needs independently approved same-project currency/gross ceiling' USING ERRCODE='23514';END IF;
  PERFORM "m09_service_source"(charge."serviceTicketId",charge."sourceSnapshot");expected_key:='SERVICE:'||charge."id"::text;
 END IF;
 IF q."commercialKey" IS DISTINCT FROM expected_key THEN RAISE EXCEPTION 'Canonical commercial identity required' USING ERRCODE='23514';END IF;
END; $$;
CREATE FUNCTION "m09_entity"() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE n jsonb:=to_jsonb(NEW); o jsonb:=to_jsonb(OLD); before_status text:=o->>'status'; after_status text:=n->>'status'; field text; protected_fields text[]; state_ok boolean:=true; parent_customer uuid; parent_currency "FinanceCurrency";
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Never delete financial documents; use audited correction' USING ERRCODE='23514';END IF;
 IF TG_OP='INSERT' THEN
  IF (n->>'version')::int<>1 THEN RAISE EXCEPTION 'Create initial financial version1' USING ERRCODE='23514';END IF;
  IF TG_TABLE_NAME IN ('FinanceQuotation','FinanceInvoice','FinanceCreditNote','FinanceExpense','FinanceServiceCharge') AND after_status<>'DRAFT' OR TG_TABLE_NAME='FinancePayment' AND after_status<>'RECORDED' OR TG_TABLE_NAME='FinanceRefund' AND after_status<>'REQUESTED' THEN RAISE EXCEPTION 'Create draft/recorded/requested documents, never fabricated approvals' USING ERRCODE='23514';END IF;
 ELSE
  IF NEW."id"<>OLD."id" OR NEW."version"<>OLD."version"+1 THEN RAISE EXCEPTION 'Immutable financial identity or stale version' USING ERRCODE='23514';END IF;
 END IF;
 protected_fields:=ARRAY['id','reference','customerId','currency','createdAt'];
 IF TG_TABLE_NAME='FinanceQuotation' THEN
  protected_fields:=protected_fields||ARRAY['seriesId','revision','previousId','commercialKey','kind','siteId','leadId','configurationId','configurationApprovedVersion','configurationReviewId','bomId','bomVersion','serviceChargeId','priceBookId','sourceSnapshot','preparedById'];
  IF TG_OP='UPDATE' AND before_status<>'DRAFT' THEN protected_fields:=protected_fields||ARRAY['pricingSnapshot','subtotal','discountAmount','taxableAmount','taxAmount','totalAmount','estimatedCost','estimatedMargin','sensitivePricing','validUntil','terms'];END IF;
  IF TG_OP='UPDATE' THEN
   state_ok:=after_status=before_status OR CASE before_status WHEN 'DRAFT' THEN after_status IN ('SUBMITTED_FOR_APPROVAL','CANCELLED','EXPIRED','SUPERSEDED') WHEN 'SUBMITTED_FOR_APPROVAL' THEN after_status IN ('APPROVED','REJECTED','CANCELLED','EXPIRED','SUPERSEDED') WHEN 'APPROVED' THEN after_status IN ('SENT','CANCELLED','EXPIRED','SUPERSEDED') WHEN 'SENT' THEN after_status IN ('ACCEPTED','CANCELLED','EXPIRED','SUPERSEDED') WHEN 'REJECTED' THEN after_status IN ('SUPERSEDED','CANCELLED','EXPIRED') WHEN 'EXPIRED' THEN after_status='SUPERSEDED' ELSE false END;
   IF before_status IN ('ACCEPTED','SUPERSEDED','CANCELLED') THEN state_ok:=false;END IF;
   IF before_status<>'DRAFT' THEN protected_fields:=protected_fields||ARRAY['submittedSnapshot','submittedAt'];END IF;
   IF before_status<>'SUBMITTED_FOR_APPROVAL' THEN protected_fields:=protected_fields||ARRAY['reviewSnapshot','approvedById','approvedAt'];END IF;
   IF before_status<>'APPROVED' THEN protected_fields:=protected_fields||ARRAY['sentAt'];END IF;IF before_status<>'SENT' THEN protected_fields:=protected_fields||ARRAY['acceptedAt'];END IF;
  END IF;
  IF TG_OP='INSERT' AND NOT EXISTS(SELECT 1 FROM "FinancePriceBook" WHERE "id"=NEW."priceBookId" AND "currency"=NEW."currency" AND "isActive" AND "effectiveFrom"<=clock_timestamp() AND ("effectiveTo" IS NULL OR "effectiveTo">clock_timestamp())) THEN RAISE EXCEPTION 'Explicit effective selling-price book required' USING ERRCODE='23514';END IF;
  IF TG_OP='UPDATE' AND before_status='DRAFT' AND after_status='SUBMITTED_FOR_APPROVAL' AND (NOT EXISTS(SELECT 1 FROM "FinancePriceBook" WHERE "id"=NEW."priceBookId" AND "isActive" AND "effectiveFrom"<=clock_timestamp() AND ("effectiveTo" IS NULL OR "effectiveTo">clock_timestamp())) OR EXISTS(SELECT 1 FROM "FinanceQuotationLine" l JOIN "FinanceTaxRule" t ON t."id"=l."taxRuleId" WHERE l."quotationId"=NEW."id" AND (NOT t."isActive" OR t."effectiveFrom">clock_timestamp() OR t."effectiveTo"<=clock_timestamp()))) THEN RAISE EXCEPTION 'Refresh inactive/ineffective draft pricing/tax selections before submission' USING ERRCODE='23514';END IF;
  IF after_status='SUBMITTED_FOR_APPROVAL' AND (jsonb_typeof(NEW."submittedSnapshot") IS DISTINCT FROM 'object' OR NEW."submittedAt" IS NULL) THEN RAISE EXCEPTION 'Freeze exact submitted quotation snapshot' USING ERRCODE='23514';END IF;
  IF after_status IN ('APPROVED','SENT','ACCEPTED') AND (NEW."approvedById" IS NULL OR NEW."approvedAt" IS NULL OR NEW."approvedById"=NEW."preparedById" OR jsonb_typeof(NEW."reviewSnapshot") IS DISTINCT FROM 'object') THEN RAISE EXCEPTION 'Independent quotation pricing approval required' USING ERRCODE='23514';END IF;
  IF after_status='SENT' AND (NEW."sentAt" IS NULL OR NEW."sentAt"<NEW."approvedAt" OR NEW."sentAt">clock_timestamp()) THEN RAISE EXCEPTION 'Record actual sending separately, not generated communication' USING ERRCODE='23514';END IF;
  IF after_status='ACCEPTED' AND (NEW."acceptedAt" IS NULL OR NEW."acceptedAt"<NEW."sentAt" OR NEW."acceptedAt">clock_timestamp() OR NOT EXISTS(SELECT 1 FROM "FinanceEvidence" WHERE "quotationId"=NEW."id" AND "type"='CUSTOMER_ACCEPTANCE')) THEN RAISE EXCEPTION 'Explicit evidence-backed customer acceptance required' USING ERRCODE='23514';END IF;
  IF (TG_OP='INSERT' OR (after_status IS DISTINCT FROM before_status AND after_status IN ('SUBMITTED_FOR_APPROVAL','APPROVED','SENT','ACCEPTED'))) AND NEW."validUntil"<=clock_timestamp() THEN RAISE EXCEPTION 'Expired quotation cannot progress commercially' USING ERRCODE='23514';END IF;
 ELSIF TG_TABLE_NAME='FinanceInvoice' THEN
  protected_fields:=protected_fields||ARRAY['orderId','siteId','subtotal','discountAmount','taxableAmount','taxAmount','totalAmount','termsSnapshot','createdById'];
  IF TG_OP='UPDATE' THEN
   IF before_status<>'DRAFT' THEN protected_fields:=protected_fields||ARRAY['dueAt','notes','issuedById','issuedAt'];END IF;
   state_ok:=before_status<>'VOIDED' AND (after_status=before_status OR before_status='DRAFT' AND after_status IN ('ISSUED','VOIDED') OR before_status='ISSUED' AND after_status='VOIDED');
  END IF;
  IF NOT EXISTS(SELECT 1 FROM "FinanceSalesOrder" r JOIN "FinanceQuotation" q ON q."id"=r."quotationId" WHERE r."id"=NEW."orderId" AND q."status"='ACCEPTED' AND r."customerId"=NEW."customerId" AND r."siteId"=NEW."siteId" AND r."currency"=NEW."currency" AND ROW(q."subtotal",q."discountAmount",q."taxableAmount",q."taxAmount",q."totalAmount")=ROW(NEW."subtotal",NEW."discountAmount",NEW."taxableAmount",NEW."taxAmount",NEW."totalAmount")) THEN RAISE EXCEPTION 'Invoice preserves full accepted commercial order, not arbitrary balance' USING ERRCODE='23514';END IF;
  IF after_status='VOIDED' AND (EXISTS(SELECT 1 FROM "FinancePaymentAllocation" WHERE "invoiceId"=NEW."id") OR EXISTS(SELECT 1 FROM "FinanceCreditNote" WHERE "invoiceId"=NEW."id")) THEN RAISE EXCEPTION 'Referenced/paid invoices require explicit corrections, not void' USING ERRCODE='23514';END IF;
  IF after_status='ISSUED' AND before_status='DRAFT' AND NEW."dueAt"<=clock_timestamp() THEN RAISE EXCEPTION 'Issue with explicit future due time' USING ERRCODE='23514';END IF;
 ELSIF TG_TABLE_NAME='FinancePayment' THEN
  protected_fields:=protected_fields||ARRAY['amount','method','externalReference','paidAt','notes','recordedById'];
  IF NEW."paidAt">clock_timestamp() THEN RAISE EXCEPTION 'Only observed manual receipts' USING ERRCODE='23514';END IF;
  IF TG_OP='UPDATE' THEN
   state_ok:=before_status NOT IN ('REJECTED','REVERSED') AND (after_status=before_status OR before_status='RECORDED' AND after_status='PENDING_VERIFICATION' OR before_status='PENDING_VERIFICATION' AND after_status IN ('VERIFIED','REJECTED') OR before_status='VERIFIED' AND after_status='REVERSED');
   IF before_status<>'PENDING_VERIFICATION' THEN protected_fields:=protected_fields||ARRAY['verifiedById','verifiedAt'];END IF;
  END IF;
  IF after_status IN ('PENDING_VERIFICATION','VERIFIED') AND NOT EXISTS(SELECT 1 FROM "FinanceEvidence" WHERE "paymentId"=NEW."id" AND "type"='PAYMENT_PROOF') THEN RAISE EXCEPTION 'Receipt proof is mandatory before verification/allocation' USING ERRCODE='23514';END IF;
  IF after_status='REVERSED' AND EXISTS(SELECT 1 FROM "FinanceRefund" WHERE "paymentId"=NEW."id" AND "status" IN ('REQUESTED','APPROVED','COMPLETED')) THEN RAISE EXCEPTION 'Preserve refund commitments before payment record reversal' USING ERRCODE='23514';END IF;
 ELSIF TG_TABLE_NAME='FinanceCreditNote' THEN
  protected_fields:=protected_fields||ARRAY['invoiceId','amount','adjustmentReason','createdById','snapshot'];
  SELECT "customerId","currency" INTO parent_customer,parent_currency FROM "FinanceInvoice" WHERE "id"=NEW."invoiceId";
  IF NEW."customerId" IS DISTINCT FROM parent_customer OR NEW."currency" IS DISTINCT FROM parent_currency OR NOT EXISTS(SELECT 1 FROM "FinanceInvoice" WHERE "id"=NEW."invoiceId" AND "status"='ISSUED') THEN RAISE EXCEPTION 'Credit must reference exact issued customer/currency obligation' USING ERRCODE='23514';END IF;
  IF TG_OP='UPDATE' THEN
   state_ok:=before_status NOT IN ('REJECTED','CANCELLED','ISSUED') AND (after_status=before_status OR before_status='DRAFT' AND after_status IN ('SUBMITTED','CANCELLED') OR before_status='SUBMITTED' AND after_status IN ('APPROVED','REJECTED','CANCELLED') OR before_status='APPROVED' AND after_status IN ('ISSUED','CANCELLED'));
   IF before_status<>'SUBMITTED' THEN protected_fields:=protected_fields||ARRAY['approvedById','approvedAt'];END IF;IF NOT (before_status='APPROVED' AND after_status='ISSUED') THEN protected_fields:=protected_fields||ARRAY['taxAmount','taxableAmount','issuedAt'];END IF;
  END IF;
 ELSIF TG_TABLE_NAME='FinanceRefund' THEN
  protected_fields:=protected_fields||ARRAY['paymentId','amount','refundReason','requestedById'];SELECT "customerId","currency" INTO parent_customer,parent_currency FROM "FinancePayment" WHERE "id"=NEW."paymentId";
  IF NEW."customerId" IS DISTINCT FROM parent_customer OR NEW."currency" IS DISTINCT FROM parent_currency THEN RAISE EXCEPTION 'Refund must retain original receipt owner/currency' USING ERRCODE='23514';END IF;
  IF TG_OP='UPDATE' THEN
   state_ok:=before_status IN ('REQUESTED','APPROVED') AND (after_status=before_status OR before_status='REQUESTED' AND after_status IN ('APPROVED','REJECTED','CANCELLED') OR before_status='APPROVED' AND after_status IN ('COMPLETED','CANCELLED'));
   IF before_status<>'REQUESTED' THEN protected_fields:=protected_fields||ARRAY['approvedById','approvedAt'];END IF;IF NOT (before_status='APPROVED' AND after_status='COMPLETED') THEN protected_fields:=protected_fields||ARRAY['completedById','completedAt','transferReference'];END IF;
  END IF;
  IF after_status='COMPLETED' AND (NEW."completedAt">clock_timestamp() OR NOT EXISTS(SELECT 1 FROM "FinanceEvidence" WHERE "refundId"=NEW."id" AND "type"='REFUND_PROOF')) THEN RAISE EXCEPTION 'Refund completion needs actual proof/time, never implies automatic money sent' USING ERRCODE='23514';END IF;
 ELSIF TG_TABLE_NAME='FinanceExpense' THEN
  protected_fields:=protected_fields||ARRAY['installationId','serviceTicketId','category','description','vendorOrPayee','amount','incurredAt','costBasis','createdById'];
  IF NEW."incurredAt">clock_timestamp() THEN RAISE EXCEPTION 'Actual incurred costs only, not planned assignment labor' USING ERRCODE='23514';END IF;
  IF NEW."installationId" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "InstallationJob" WHERE "id"=NEW."installationId" AND "customerId"=NEW."customerId") OR NEW."serviceTicketId" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "ServiceTicket" WHERE "id"=NEW."serviceTicketId" AND "customerId"=NEW."customerId" AND "installationId"=NEW."installationId") OR NEW."installationId" IS NULL AND NEW."serviceTicketId" IS NULL AND NEW."customerId" IS NOT NULL THEN RAISE EXCEPTION 'Expense source ownership must match actual project/service or explicit office scope' USING ERRCODE='23514';END IF;
  IF TG_OP='UPDATE' THEN
   state_ok:=before_status NOT IN ('REJECTED','CANCELLED','RECORDED') AND (after_status=before_status OR before_status='DRAFT' AND after_status IN ('SUBMITTED','CANCELLED') OR before_status='SUBMITTED' AND after_status IN ('APPROVED','REJECTED','CANCELLED') OR before_status='APPROVED' AND after_status IN ('RECORDED','CANCELLED'));
   IF before_status<>'SUBMITTED' THEN protected_fields:=protected_fields||ARRAY['approvedById','approvedAt'];END IF;IF NOT (before_status='APPROVED' AND after_status='RECORDED') THEN protected_fields:=protected_fields||ARRAY['recordedAt'];END IF;
  END IF;
 ELSE
  protected_fields:=protected_fields||ARRAY['serviceTicketId','description','allowedKinds','proposedAmount','sourceSnapshot','requestedById'];
  IF NOT EXISTS(SELECT 1 FROM "ServiceTicket" WHERE "id"=NEW."serviceTicketId" AND "customerId"=NEW."customerId") THEN RAISE EXCEPTION 'Service billing request must belong to actual customer ticket' USING ERRCODE='23514';END IF;
  IF TG_OP='UPDATE' THEN
   state_ok:=before_status NOT IN ('REJECTED','CANCELLED') AND (after_status=before_status OR before_status='DRAFT' AND after_status IN ('SUBMITTED','CANCELLED') OR before_status='SUBMITTED' AND after_status IN ('APPROVED','REJECTED','CANCELLED') OR before_status='APPROVED' AND after_status='CANCELLED');
   IF before_status<>'SUBMITTED' THEN protected_fields:=protected_fields||ARRAY['approvedById','approvedAt'];END IF;
  END IF;
  IF TG_OP='INSERT' OR (after_status IS DISTINCT FROM before_status AND after_status IN ('SUBMITTED','APPROVED')) THEN PERFORM "m09_service_source"(NEW."serviceTicketId",NEW."sourceSnapshot");END IF;
  IF after_status='CANCELLED' AND EXISTS(SELECT 1 FROM "FinanceQuotation" WHERE "serviceChargeId"=NEW."id" AND "status"='ACCEPTED') THEN RAISE EXCEPTION 'Accepted commercial commitment prevents source charge cancellation' USING ERRCODE='23514';END IF;
 END IF;
 IF NOT coalesce(state_ok,false) THEN RAISE EXCEPTION 'Invalid/terminal financial lifecycle transition' USING ERRCODE='23514';END IF;
 IF TG_OP='UPDATE' THEN FOREACH field IN ARRAY protected_fields LOOP IF n->field IS DISTINCT FROM o->field THEN RAISE EXCEPTION 'Immutable financial terms or source identity: %',field USING ERRCODE='23514';END IF;END LOOP;END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER "FinanceQuotation_state" BEFORE INSERT OR UPDATE OR DELETE ON "FinanceQuotation" FOR EACH ROW EXECUTE FUNCTION "m09_entity"();
CREATE TRIGGER "FinanceInvoice_state" BEFORE INSERT OR UPDATE OR DELETE ON "FinanceInvoice" FOR EACH ROW EXECUTE FUNCTION "m09_entity"();
CREATE TRIGGER "FinancePayment_state" BEFORE INSERT OR UPDATE OR DELETE ON "FinancePayment" FOR EACH ROW EXECUTE FUNCTION "m09_entity"();
CREATE TRIGGER "FinanceCreditNote_state" BEFORE INSERT OR UPDATE OR DELETE ON "FinanceCreditNote" FOR EACH ROW EXECUTE FUNCTION "m09_entity"();
CREATE TRIGGER "FinanceRefund_state" BEFORE INSERT OR UPDATE OR DELETE ON "FinanceRefund" FOR EACH ROW EXECUTE FUNCTION "m09_entity"();
CREATE TRIGGER "FinanceExpense_state" BEFORE INSERT OR UPDATE OR DELETE ON "FinanceExpense" FOR EACH ROW EXECUTE FUNCTION "m09_entity"();
CREATE TRIGGER "FinanceServiceCharge_state" BEFORE INSERT OR UPDATE OR DELETE ON "FinanceServiceCharge" FOR EACH ROW EXECUTE FUNCTION "m09_entity"();

CREATE FUNCTION "m09_quote_source_deferred"() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF TG_OP='INSERT' OR (NEW."status" IS DISTINCT FROM OLD."status" AND NEW."status" IN ('SUBMITTED_FOR_APPROVAL','APPROVED','SENT','ACCEPTED')) THEN PERFORM "m09_quote_source"(NEW."id");END IF;RETURN NEW;END; $$;
CREATE CONSTRAINT TRIGGER "FinanceQuotation_source" AFTER INSERT OR UPDATE ON "FinanceQuotation" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION "m09_quote_source_deferred"();

CREATE FUNCTION "m09_order"() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE q "FinanceQuotation"%ROWTYPE; j "InstallationJob"%ROWTYPE;
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Accepted commercial order history is immutable' USING ERRCODE='23514';END IF;
 SELECT * INTO q FROM "FinanceQuotation" WHERE "id"=NEW."quotationId";
 IF q."status" IS DISTINCT FROM 'ACCEPTED' OR ROW(NEW."customerId",NEW."siteId",NEW."currency",NEW."commercialKey",NEW."totalAmount",NEW."acceptedAt") IS DISTINCT FROM ROW(q."customerId",q."siteId",q."currency",q."commercialKey",q."totalAmount",q."acceptedAt") THEN RAISE EXCEPTION 'Order requires exact evidence-backed accepted quotation revision' USING ERRCODE='23514';END IF;
 IF TG_OP='INSERT' AND NEW."version"<>1 THEN RAISE EXCEPTION 'Create initial order version1' USING ERRCODE='23514';END IF;
 IF TG_OP='UPDATE' AND ((to_jsonb(NEW)-ARRAY['installationId','version']) IS DISTINCT FROM (to_jsonb(OLD)-ARRAY['installationId','version']) OR OLD."installationId" IS NOT NULL OR NEW."installationId" IS NULL OR NEW."version"<>OLD."version"+1) THEN RAISE EXCEPTION 'Only establish optional commercial installation link once, preserving financial terms' USING ERRCODE='23514';END IF;
 IF NEW."installationId" IS NOT NULL THEN
  SELECT * INTO j FROM "InstallationJob" WHERE "id"=NEW."installationId";
  IF ROW(j."customerId",j."siteId",j."leadId") IS DISTINCT FROM ROW(q."customerId",q."siteId",q."leadId") OR (q."kind"='INSTALLATION' AND ROW(j."configurationId",j."configurationApprovedVersion",j."configurationReviewId",j."bomId",j."bomVersion") IS DISTINCT FROM ROW(q."configurationId",q."configurationApprovedVersion",q."configurationReviewId",q."bomId",q."bomVersion")) OR (q."kind"='SERVICE' AND NOT EXISTS(SELECT 1 FROM "FinanceServiceCharge" c JOIN "ServiceTicket" t ON t."id"=c."serviceTicketId" WHERE c."id"=q."serviceChargeId" AND t."installationId"=j."id")) THEN RAISE EXCEPTION 'Optional link must preserve exact M05 source identity; no historical rewrites' USING ERRCODE='23514';END IF;
 ELSIF q."kind"='SERVICE' THEN RAISE EXCEPTION 'Service order retains actual service installation identity' USING ERRCODE='23514';END IF;RETURN NEW;
END; $$;
CREATE TRIGGER "FinanceSalesOrder_guard" BEFORE INSERT OR UPDATE OR DELETE ON "FinanceSalesOrder" FOR EACH ROW EXECUTE FUNCTION "m09_order"();
CREATE FUNCTION "m09_invoice_line"() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE q "FinanceQuotationLine"%ROWTYPE;
BEGIN
 SELECT * INTO q FROM "FinanceQuotationLine" WHERE "id"=NEW."quotationLineId";
 IF NOT EXISTS(SELECT 1 FROM "FinanceInvoice" i JOIN "FinanceSalesOrder" o ON o."id"=i."orderId" WHERE i."id"=NEW."invoiceId" AND i."status"='DRAFT' AND o."quotationId"=q."quotationId") OR ROW(NEW."position",NEW."subtotal",NEW."discountAmount",NEW."taxableAmount",NEW."taxAmount",NEW."totalAmount") IS DISTINCT FROM ROW(q."position",q."subtotal",q."discountAmount",q."taxableAmount",q."taxAmount",q."totalAmount") THEN RAISE EXCEPTION 'Invoice line must preserve exact accepted quotation financial terms' USING ERRCODE='23514';END IF;RETURN NEW;
END; $$;
CREATE TRIGGER "FinanceInvoiceLine_source" BEFORE INSERT ON "FinanceInvoiceLine" FOR EACH ROW EXECUTE FUNCTION "m09_invoice_line"();

CREATE FUNCTION "m09_access"() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Revoke customer finance access, never delete audit context' USING ERRCODE='23514';END IF;
 IF NOT EXISTS(SELECT 1 FROM "User" WHERE "id"=NEW."grantedById" AND "isActive" AND "role"='ADMIN') OR (NEW."isActive" AND NOT EXISTS(SELECT 1 FROM "User" WHERE "id"=NEW."userId" AND "isActive" AND "role"='FINANCE')) THEN RAISE EXCEPTION 'ADMIN grants explicit customer finance scope to active FINANCE' USING ERRCODE='23514';END IF;
 IF TG_OP='INSERT' AND NEW."version"<>1 OR TG_OP='UPDATE' AND (NEW."version"<>OLD."version"+1 OR ROW(NEW."id",NEW."customerId",NEW."userId",NEW."createdAt") IS DISTINCT FROM ROW(OLD."id",OLD."customerId",OLD."userId",OLD."createdAt")) THEN RAISE EXCEPTION 'Immutable grant identity or stale version' USING ERRCODE='23514';END IF;RETURN NEW;END; $$;
CREATE TRIGGER "FinanceAccessGrant_guard" BEFORE INSERT OR UPDATE OR DELETE ON "FinanceAccessGrant" FOR EACH ROW EXECUTE FUNCTION "m09_access"();
CREATE FUNCTION "m09_operation"() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Financial operation audit cannot be deleted' USING ERRCODE='23514';END IF;
 IF TG_OP='UPDATE' AND (OLD."result"<>'{}'::jsonb OR (to_jsonb(NEW)-'result') IS DISTINCT FROM (to_jsonb(OLD)-'result')) THEN RAISE EXCEPTION 'Only initial financial operation result finalization allowed' USING ERRCODE='23514';END IF;
 IF TG_OP='INSERT' AND NOT EXISTS(SELECT 1 FROM "User" WHERE "id"=NEW."actorId" AND "isActive" AND "role"=NEW."actorRole" AND "role" IN ('ADMIN','FINANCE','SALES','SUPPORT')) THEN RAISE EXCEPTION 'Current active finance actor/role required' USING ERRCODE='23514';END IF;RETURN NEW;END; $$;
CREATE TRIGGER "FinanceOperation_guard" BEFORE INSERT OR UPDATE OR DELETE ON "FinanceOperation" FOR EACH ROW EXECUTE FUNCTION "m09_operation"();
CREATE FUNCTION "m09_operation_final"() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF EXISTS(SELECT 1 FROM "FinanceOperation" WHERE "id"=NEW."id" AND "result"='{}'::jsonb) THEN RAISE EXCEPTION 'Operation must finalize atomically with result' USING ERRCODE='23514';END IF;RETURN NEW;END; $$;
CREATE CONSTRAINT TRIGGER "FinanceOperation_final" AFTER INSERT ON "FinanceOperation" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION "m09_operation_final"();

CREATE FUNCTION "m09_actor_scope"(actor_id uuid,entity_kind text,entity jsonb) RETURNS void LANGUAGE plpgsql AS $$
DECLARE actor_role "Role"; customer_id uuid:=(entity->>'customerId')::uuid;
BEGIN
 SELECT "role" INTO actor_role FROM "User" WHERE "id"=actor_id AND "isActive";IF NOT FOUND THEN RAISE EXCEPTION 'Active financial actor required' USING ERRCODE='23514';END IF;
 IF actor_role='ADMIN' THEN RETURN;
 ELSIF actor_role='FINANCE' THEN
  IF customer_id IS NOT NULL AND EXISTS(SELECT 1 FROM "FinanceAccessGrant" WHERE "customerId"=customer_id AND "userId"=actor_id AND "isActive") THEN RETURN;END IF;
  IF customer_id IS NULL AND entity_kind='EXPENSE' AND (entity->>'createdById')::uuid=actor_id THEN RETURN;END IF;
 ELSIF actor_role='SALES' AND entity_kind IN ('QUOTATION','ORDER','INVOICE') THEN
  IF EXISTS(SELECT 1 FROM "Customer" c WHERE c."id"=customer_id AND (c."createdById"=actor_id OR EXISTS(SELECT 1 FROM "Lead" l WHERE l."customerId"=c."id" AND (l."assignedToId"=actor_id OR (l."assignedToId" IS NULL AND l."createdById"=actor_id))))) THEN RETURN;END IF;
 ELSIF actor_role='SUPPORT' AND entity_kind='SERVICE_CHARGE' THEN
  IF EXISTS(SELECT 1 FROM "ServiceTicket" t JOIN "ServiceAccessGrant" a ON a."installationId"=t."installationId" WHERE t."id"=(entity->>'serviceTicketId')::uuid AND a."userId"=actor_id AND a."role"='SUPPORT' AND a."isActive") THEN RETURN;END IF;
 END IF;RAISE EXCEPTION 'Financial actor lacks explicit customer/source scope' USING ERRCODE='23514';
END; $$;
CREATE FUNCTION "m09_entity_audit"() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE n jsonb:=to_jsonb(NEW); o jsonb:=to_jsonb(OLD); kind text; h "FinanceHistory"%ROWTYPE; actor_role "Role"; author_id uuid; from_status text; to_status text:=coalesce(n->>'status','CONFIRMED'); checks jsonb;
BEGIN
 kind:=CASE TG_TABLE_NAME WHEN 'FinanceQuotation' THEN 'QUOTATION' WHEN 'FinanceSalesOrder' THEN 'ORDER' WHEN 'FinanceInvoice' THEN 'INVOICE' WHEN 'FinancePayment' THEN 'PAYMENT' WHEN 'FinanceCreditNote' THEN 'CREDIT_NOTE' WHEN 'FinanceRefund' THEN 'REFUND' WHEN 'FinanceExpense' THEN 'EXPENSE' ELSE 'SERVICE_CHARGE' END;
 SELECT * INTO h FROM "FinanceHistory" WHERE "entityId"=NEW."id" AND "entityKind"::text=kind AND "version"=NEW."version";
 IF NOT FOUND OR h."toStatus"<>to_status THEN RAISE EXCEPTION 'Atomic exact-version financial audit is mandatory' USING ERRCODE='23514';END IF;
 from_status:=CASE WHEN TG_OP='INSERT' THEN NULL ELSE coalesce(o->>'status','CONFIRMED') END;
 IF h."fromStatus" IS DISTINCT FROM from_status THEN RAISE EXCEPTION 'Financial transition history must retain previous status' USING ERRCODE='23514';END IF;
 PERFORM "m09_actor_scope"(h."actorId",kind,n);SELECT "role" INTO actor_role FROM "User" WHERE "id"=h."actorId";
 IF h."operationId" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "FinanceOperation" WHERE "id"=h."operationId" AND "actorId"=h."actorId" AND "actorRole"=actor_role) THEN RAISE EXCEPTION 'Financial history actor must match original command actor/role' USING ERRCODE='23514';END IF;
 author_id:=coalesce((n->>'preparedById')::uuid,(n->>'createdById')::uuid,(n->>'recordedById')::uuid,(n->>'requestedById')::uuid,(n->>'authorizedById')::uuid);
 IF TG_OP='INSERT' AND author_id IS DISTINCT FROM h."actorId" THEN RAISE EXCEPTION 'Financial creator must be actual authenticated actor' USING ERRCODE='23514';END IF;
 IF to_status IS DISTINCT FROM from_status THEN
  IF kind='QUOTATION' AND to_status IN ('APPROVED','REJECTED') THEN
   IF h."actorId"=author_id OR EXISTS(SELECT 1 FROM "FinanceHistory" WHERE "quotationId"=NEW."id" AND "actorId"=h."actorId" AND "event"='DRAFT_UPDATED') OR actor_role NOT IN ('ADMIN','FINANCE') OR ((n->>'sensitivePricing')::boolean AND actor_role<>'ADMIN') THEN RAISE EXCEPTION 'Independent qualified pricing review required; sensitive prices require ADMIN' USING ERRCODE='23514';END IF;
   checks:=n->'reviewSnapshot'->'checklist';
   IF (n->'reviewSnapshot'->>'reviewerId')::uuid IS DISTINCT FROM h."actorId" OR (n->'reviewSnapshot'->>'submittedVersion')::int IS DISTINCT FROM OLD."version" OR n->'reviewSnapshot'->>'decision' IS DISTINCT FROM to_status OR (to_status='APPROVED' AND (n->>'approvedById')::uuid IS DISTINCT FROM h."actorId") THEN RAISE EXCEPTION 'Quotation review must preserve exact reviewer/decision/submitted version' USING ERRCODE='23514';END IF;
  ELSIF kind='PAYMENT' AND to_status IN ('VERIFIED','REJECTED') THEN
   IF h."actorId"=author_id OR actor_role NOT IN ('ADMIN','FINANCE') THEN RAISE EXCEPTION 'Independent manual receipt verification required' USING ERRCODE='23514';END IF;
   IF to_status='VERIFIED' AND ((n->>'verifiedById')::uuid IS DISTINCT FROM h."actorId" OR NOT coalesce((h."details"->'checklist') @> '{"payerVerified":true,"amountVerified":true,"evidenceReviewed":true}'::jsonb,false)) THEN RAISE EXCEPTION 'Actual verifier and all receipt checks required' USING ERRCODE='23514';END IF;
  ELSIF kind IN ('CREDIT_NOTE','EXPENSE','SERVICE_CHARGE','REFUND') AND to_status IN ('APPROVED','REJECTED') THEN
   IF h."actorId"=author_id OR (kind IN ('CREDIT_NOTE','EXPENSE','REFUND') AND actor_role<>'ADMIN') OR actor_role NOT IN ('ADMIN','FINANCE') THEN RAISE EXCEPTION 'Independent ADMIN high-risk approval or scoped service financial review required' USING ERRCODE='23514';END IF;
   IF to_status='APPROVED' AND ((n->>'approvedById')::uuid IS DISTINCT FROM h."actorId" OR n->>'approvedAt' IS NULL) THEN RAISE EXCEPTION 'Persist exact approval actor/time' USING ERRCODE='23514';END IF;checks:=h."details"->'checklist';
  END IF;
  IF kind IN ('QUOTATION','CREDIT_NOTE','EXPENSE','SERVICE_CHARGE','REFUND') AND to_status='APPROVED' AND NOT coalesce(checks @> '{"sourceReviewed":true,"pricingReviewed":true,"evidenceReviewed":true,"termsReviewed":true}'::jsonb,false) THEN RAISE EXCEPTION 'All explicit financial review checks required' USING ERRCODE='23514';END IF;
  IF kind='INVOICE' AND to_status='ISSUED' AND (actor_role NOT IN ('ADMIN','FINANCE') OR (n->>'issuedById')::uuid IS DISTINCT FROM h."actorId") THEN RAISE EXCEPTION 'Authorized actual invoice issuer required' USING ERRCODE='23514';END IF;
  IF kind='INVOICE' AND to_status='VOIDED' AND (actor_role<>'ADMIN' OR (from_status='ISSUED' AND (o->>'issuedById')::uuid=h."actorId")) THEN RAISE EXCEPTION 'Independent ADMIN voiding required for issued invoice' USING ERRCODE='23514';END IF;
  IF kind='PAYMENT' AND to_status='REVERSED' AND (actor_role<>'ADMIN' OR h."actorId"=author_id) THEN RAISE EXCEPTION 'Independent ADMIN receipt reversal required' USING ERRCODE='23514';END IF;
  IF kind='REFUND' AND to_status='COMPLETED' AND (actor_role NOT IN ('ADMIN','FINANCE') OR h."actorId"=author_id OR (n->>'completedById')::uuid IS DISTINCT FROM h."actorId") THEN RAISE EXCEPTION 'Independent observed refund completion required' USING ERRCODE='23514';END IF;
 END IF;RETURN NEW;
END; $$;
CREATE CONSTRAINT TRIGGER "FinanceQuotation_audit" AFTER INSERT OR UPDATE ON "FinanceQuotation" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION "m09_entity_audit"();
CREATE CONSTRAINT TRIGGER "FinanceSalesOrder_audit" AFTER INSERT OR UPDATE ON "FinanceSalesOrder" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION "m09_entity_audit"();
CREATE CONSTRAINT TRIGGER "FinanceInvoice_audit" AFTER INSERT OR UPDATE ON "FinanceInvoice" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION "m09_entity_audit"();
CREATE CONSTRAINT TRIGGER "FinancePayment_audit" AFTER INSERT OR UPDATE ON "FinancePayment" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION "m09_entity_audit"();
CREATE CONSTRAINT TRIGGER "FinanceCreditNote_audit" AFTER INSERT OR UPDATE ON "FinanceCreditNote" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION "m09_entity_audit"();
CREATE CONSTRAINT TRIGGER "FinanceRefund_audit" AFTER INSERT OR UPDATE ON "FinanceRefund" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION "m09_entity_audit"();
CREATE CONSTRAINT TRIGGER "FinanceExpense_audit" AFTER INSERT OR UPDATE ON "FinanceExpense" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION "m09_entity_audit"();
CREATE CONSTRAINT TRIGGER "FinanceServiceCharge_audit" AFTER INSERT OR UPDATE ON "FinanceServiceCharge" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION "m09_entity_audit"();

CREATE FUNCTION "m09_evidence"() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE kind text; owner_id uuid; entity jsonb; expected_type text;
BEGIN
 IF NEW."quotationId" IS NOT NULL THEN kind:='QUOTATION';owner_id:=NEW."quotationId";SELECT to_jsonb(q) INTO entity FROM "FinanceQuotation" q WHERE "id"=owner_id;expected_type:='CUSTOMER_ACCEPTANCE';
 ELSIF NEW."paymentId" IS NOT NULL THEN kind:='PAYMENT';owner_id:=NEW."paymentId";SELECT to_jsonb(p) INTO entity FROM "FinancePayment" p WHERE "id"=owner_id;expected_type:='PAYMENT_PROOF';
 ELSIF NEW."creditNoteId" IS NOT NULL THEN kind:='CREDIT_NOTE';owner_id:=NEW."creditNoteId";SELECT to_jsonb(c) INTO entity FROM "FinanceCreditNote" c WHERE "id"=owner_id;expected_type:='CREDIT_SUPPORT';
 ELSIF NEW."refundId" IS NOT NULL THEN kind:='REFUND';owner_id:=NEW."refundId";SELECT to_jsonb(r) INTO entity FROM "FinanceRefund" r WHERE "id"=owner_id;expected_type:='REFUND_PROOF';
 ELSIF NEW."expenseId" IS NOT NULL THEN kind:='EXPENSE';owner_id:=NEW."expenseId";SELECT to_jsonb(e) INTO entity FROM "FinanceExpense" e WHERE "id"=owner_id;expected_type:='EXPENSE_RECEIPT';
 ELSE kind:='SERVICE_CHARGE';owner_id:=NEW."serviceChargeId";SELECT to_jsonb(c) INTO entity FROM "FinanceServiceCharge" c WHERE "id"=owner_id;expected_type:='SERVICE_CHARGE_SUPPORT';END IF;
 IF entity IS NULL OR (entity->>'customerId')::uuid IS DISTINCT FROM NEW."customerId" OR (entity->>'version')::int<>NEW."ownerVersion" OR (NEW."type"::text<>expected_type AND NEW."type"<>'OTHER') THEN RAISE EXCEPTION 'Evidence must retain exact owner/customer/category/version' USING ERRCODE='23514';END IF;
 IF NOT ((kind='QUOTATION' AND entity->>'status' IN ('DRAFT','SUBMITTED_FOR_APPROVAL','APPROVED','SENT')) OR (kind='PAYMENT' AND entity->>'status' IN ('RECORDED','PENDING_VERIFICATION','VERIFIED')) OR (kind IN ('CREDIT_NOTE','EXPENSE','SERVICE_CHARGE') AND entity->>'status' IN ('DRAFT','SUBMITTED')) OR (kind='REFUND' AND entity->>'status' IN ('REQUESTED','APPROVED'))) THEN RAISE EXCEPTION 'Financial evidence owner is frozen' USING ERRCODE='23514';END IF;
 PERFORM "m09_actor_scope"(NEW."uploaderId",kind,entity);RETURN NEW;
END; $$;
CREATE TRIGGER "FinanceEvidence_owner" BEFORE INSERT ON "FinanceEvidence" FOR EACH ROW EXECUTE FUNCTION "m09_evidence"();
CREATE FUNCTION "m09_evidence_audit"() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE owner_id uuid:=coalesce(NEW."quotationId",NEW."paymentId",NEW."creditNoteId",NEW."refundId",NEW."expenseId",NEW."serviceChargeId"); owner_version int;
BEGIN
 SELECT "version" INTO owner_version FROM (
 SELECT "id","version" FROM "FinanceQuotation" WHERE "id"=NEW."quotationId"
 UNION ALL SELECT "id","version" FROM "FinancePayment" WHERE "id"=NEW."paymentId"
 UNION ALL SELECT "id","version" FROM "FinanceCreditNote" WHERE "id"=NEW."creditNoteId"
 UNION ALL SELECT "id","version" FROM "FinanceRefund" WHERE "id"=NEW."refundId"
 UNION ALL SELECT "id","version" FROM "FinanceExpense" WHERE "id"=NEW."expenseId"
 UNION ALL SELECT "id","version" FROM "FinanceServiceCharge" WHERE "id"=NEW."serviceChargeId") parent;
 IF owner_version IS NULL OR owner_version<NEW."ownerVersion"+1 THEN RAISE EXCEPTION 'Evidence must advance its actual owner version' USING ERRCODE='23514';END IF;
 IF NOT EXISTS(SELECT 1 FROM "FinanceHistory" WHERE "entityId"=owner_id AND "version"=NEW."ownerVersion"+1 AND "event"='EVIDENCE_ADDED' AND "actorId"=NEW."uploaderId" AND ("details"->>'evidenceId')::uuid=NEW."id") THEN RAISE EXCEPTION 'Private financial evidence requires atomic versioned audit' USING ERRCODE='23514';END IF;RETURN NEW;END; $$;
CREATE CONSTRAINT TRIGGER "FinanceEvidence_audit" AFTER INSERT ON "FinanceEvidence" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION "m09_evidence_audit"();

CREATE FUNCTION "m09_ledger_audit"() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE invoice_id uuid; payment_id uuid;
BEGIN
 IF TG_TABLE_NAME='FinancePaymentAllocation' THEN invoice_id:=NEW."invoiceId";payment_id:=NEW."paymentId";
 ELSE SELECT "invoiceId","paymentId" INTO invoice_id,payment_id FROM "FinancePaymentAllocation" WHERE "id"=NEW."allocationId";END IF;
 IF NOT EXISTS(SELECT 1 FROM "FinanceOperation" o JOIN "User" u ON u."id"=o."actorId" WHERE o."id"=NEW."operationId" AND o."actorId"=NEW."actorId" AND u."isActive" AND u."role" IN ('ADMIN','FINANCE')) OR NOT EXISTS(SELECT 1 FROM "FinanceHistory" WHERE "invoiceId"=invoice_id AND "operationId"=NEW."operationId" AND "actorId"=NEW."actorId") OR NOT EXISTS(SELECT 1 FROM "FinanceHistory" WHERE "paymentId"=payment_id AND "operationId"=NEW."operationId" AND "actorId"=NEW."actorId") THEN RAISE EXCEPTION 'Allocation/release needs both versioned invoice and payment audit' USING ERRCODE='23514';END IF;RETURN NEW;
END; $$;
CREATE CONSTRAINT TRIGGER "FinancePaymentAllocation_audit" AFTER INSERT ON "FinancePaymentAllocation" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION "m09_ledger_audit"();
CREATE CONSTRAINT TRIGGER "FinanceAllocationRelease_audit" AFTER INSERT ON "FinanceAllocationRelease" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION "m09_ledger_audit"();

CREATE FUNCTION "m09_credit_tax"() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE i "FinanceInvoice"%ROWTYPE; previous_gross numeric; previous_tax numeric; expected_tax numeric; remaining_net numeric; minimum_tax numeric; maximum_tax numeric;
BEGIN
 IF NEW."status"='ISSUED' AND OLD."status"='APPROVED' THEN
  SELECT * INTO i FROM "FinanceInvoice" WHERE "id"=NEW."invoiceId";SELECT coalesce(sum("amount"),0),coalesce(sum("taxAmount"),0) INTO previous_gross,previous_tax FROM "FinanceCreditNote" WHERE "invoiceId"=NEW."invoiceId" AND "id"<>NEW."id" AND "status"='ISSUED';
  remaining_net:=i."totalAmount"-i."taxAmount"-(previous_gross-previous_tax);minimum_tax:=greatest(0,NEW."amount"-remaining_net);maximum_tax:=least(NEW."amount",i."taxAmount"-previous_tax);
  expected_tax:=CASE WHEN previous_gross+NEW."amount"=i."totalAmount" THEN i."taxAmount"-previous_tax ELSE least(greatest(round(NEW."amount"*i."taxAmount"/i."totalAmount",2),minimum_tax),maximum_tax) END;
  IF NEW."taxAmount" IS DISTINCT FROM expected_tax OR NEW."taxableAmount" IS DISTINCT FROM NEW."amount"-expected_tax THEN RAISE EXCEPTION 'Credit uses documented original-tax proportional/final-remainder arithmetic' USING ERRCODE='23514';END IF;
 END IF;RETURN NEW;END; $$;
CREATE TRIGGER "FinanceCreditNote_tax" BEFORE UPDATE ON "FinanceCreditNote" FOR EACH ROW EXECUTE FUNCTION "m09_credit_tax"();
COMMIT;
