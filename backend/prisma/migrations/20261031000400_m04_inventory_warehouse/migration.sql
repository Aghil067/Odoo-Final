BEGIN;
-- CreateEnum
CREATE TYPE "StockMovementType" AS ENUM ('OPENING_BALANCE', 'RECEIPT', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT', 'RESERVATION', 'RESERVATION_RELEASE', 'DISPATCH', 'RETURN', 'TRANSFER_IN', 'TRANSFER_OUT', 'INSPECTION_RELEASE', 'QUARANTINE_DISPOSAL');

-- CreateEnum
CREATE TYPE "InventorySerialState" AS ENUM ('AVAILABLE', 'RESERVED', 'DISPATCHED', 'QUARANTINED', 'RETIRED');

-- CreateEnum
CREATE TYPE "StockReservationStatus" AS ENUM ('ACTIVE', 'RELEASED', 'CANCELLED', 'DISPATCHED');

-- CreateTable
CREATE TABLE "Warehouse" (
    "id" UUID NOT NULL,
    "code" VARCHAR(64) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "address" VARCHAR(2000) NOT NULL,
    "contactName" VARCHAR(160),
    "contactPhone" VARCHAR(40),
    "contactEmail" VARCHAR(254),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Warehouse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryOperation" (
    "id" UUID NOT NULL,
    "idempotencyKey" VARCHAR(100) NOT NULL,
    "kind" VARCHAR(40) NOT NULL,
    "reference" VARCHAR(100) NOT NULL,
    "requestHash" CHAR(64) NOT NULL,
    "actorId" UUID NOT NULL,
    "reason" VARCHAR(2000) NOT NULL,
    "payload" JSONB NOT NULL,
    "result" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryOperation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryBalance" (
    "id" UUID NOT NULL,
    "componentId" UUID NOT NULL,
    "warehouseId" UUID NOT NULL,
    "serializationRequired" BOOLEAN NOT NULL,
    "onHandQuantity" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "reservedQuantity" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "quarantinedQuantity" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "reorderLevel" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "reorderQuantity" DECIMAL(18,3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "lastMovementAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "InventoryBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockMovement" (
    "id" UUID NOT NULL,
    "operationId" UUID NOT NULL,
    "balanceId" UUID NOT NULL,
    "type" "StockMovementType" NOT NULL,
    "quantity" DECIMAL(18,3) NOT NULL,
    "onHandBefore" DECIMAL(18,3) NOT NULL,
    "onHandAfter" DECIMAL(18,3) NOT NULL,
    "reservedBefore" DECIMAL(18,3) NOT NULL,
    "reservedAfter" DECIMAL(18,3) NOT NULL,
    "quarantinedBefore" DECIMAL(18,3) NOT NULL,
    "quarantinedAfter" DECIMAL(18,3) NOT NULL,
    "reservationLineId" UUID,
    "dispatchLineId" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventorySerialUnit" (
    "id" UUID NOT NULL,
    "serialNumber" VARCHAR(160) NOT NULL,
    "componentId" UUID NOT NULL,
    "warehouseId" UUID NOT NULL,
    "state" "InventorySerialState" NOT NULL DEFAULT 'AVAILABLE',
    "receiptOperationId" UUID NOT NULL,
    "receivedAt" TIMESTAMPTZ(3) NOT NULL,
    "reservationLineId" UUID,
    "dispatchLineId" UUID,
    "version" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "InventorySerialUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventorySerialEvent" (
    "id" UUID NOT NULL,
    "serialUnitId" UUID NOT NULL,
    "operationId" UUID NOT NULL,
    "movementId" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "fromState" "InventorySerialState",
    "toState" "InventorySerialState" NOT NULL,
    "fromWarehouseId" UUID,
    "toWarehouseId" UUID NOT NULL,
    "reservationLineId" UUID,
    "dispatchLineId" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventorySerialEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockReservation" (
    "id" UUID NOT NULL,
    "reference" VARCHAR(100) NOT NULL,
    "configurationId" UUID NOT NULL,
    "bomId" UUID NOT NULL,
    "configurationVersion" INTEGER NOT NULL,
    "configurationReviewId" UUID NOT NULL,
    "bomVersion" INTEGER NOT NULL,
    "handoffSnapshot" JSONB NOT NULL,
    "warehouseId" UUID NOT NULL,
    "operationId" UUID NOT NULL,
    "status" "StockReservationStatus" NOT NULL DEFAULT 'ACTIVE',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "StockReservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockReservationLine" (
    "serialUnitIds" UUID[] NOT NULL,
    "id" UUID NOT NULL,
    "reservationId" UUID NOT NULL,
    "bomLineId" UUID NOT NULL,
    "componentId" UUID NOT NULL,
    "quantity" DECIMAL(18,3) NOT NULL,

    CONSTRAINT "StockReservationLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockDispatch" (
    "id" UUID NOT NULL,
    "reference" VARCHAR(100) NOT NULL,
    "reservationId" UUID NOT NULL,
    "warehouseId" UUID NOT NULL,
    "operationId" UUID NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'POSTED',
    "dispatchedAt" TIMESTAMPTZ(3) NOT NULL,
    "notes" VARCHAR(2000),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockDispatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockDispatchLine" (
    "serialUnitIds" UUID[] NOT NULL,
    "id" UUID NOT NULL,
    "dispatchId" UUID NOT NULL,
    "reservationLineId" UUID NOT NULL,
    "quantity" DECIMAL(18,3) NOT NULL,
    "returnedQuantity" DECIMAL(18,3) NOT NULL DEFAULT 0,

    CONSTRAINT "StockDispatchLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockTransfer" (
    "id" UUID NOT NULL,
    "operationId" UUID NOT NULL,
    "sourceWarehouseId" UUID NOT NULL,
    "destinationWarehouseId" UUID NOT NULL,
    "componentId" UUID NOT NULL,
    "quantity" DECIMAL(18,3) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Warehouse_code_key" ON "Warehouse"("code");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryOperation_idempotencyKey_key" ON "InventoryOperation"("idempotencyKey");

-- CreateIndex
CREATE INDEX "InventoryOperation_actorId_createdAt_idx" ON "InventoryOperation"("actorId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryOperation_kind_reference_key" ON "InventoryOperation"("kind", "reference");

-- CreateIndex
CREATE INDEX "InventoryBalance_warehouseId_componentId_idx" ON "InventoryBalance"("warehouseId", "componentId");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryBalance_componentId_warehouseId_key" ON "InventoryBalance"("componentId", "warehouseId");

-- CreateIndex
CREATE INDEX "StockMovement_balanceId_createdAt_idx" ON "StockMovement"("balanceId", "createdAt");

-- CreateIndex
CREATE INDEX "StockMovement_operationId_idx" ON "StockMovement"("operationId");

-- CreateIndex
CREATE UNIQUE INDEX "InventorySerialUnit_serialNumber_key" ON "InventorySerialUnit"("serialNumber");

-- CreateIndex
CREATE INDEX "InventorySerialUnit_warehouseId_componentId_state_idx" ON "InventorySerialUnit"("warehouseId", "componentId", "state");

-- CreateIndex
CREATE INDEX "InventorySerialUnit_reservationLineId_idx" ON "InventorySerialUnit"("reservationLineId");

-- CreateIndex
CREATE INDEX "InventorySerialUnit_dispatchLineId_idx" ON "InventorySerialUnit"("dispatchLineId");

-- CreateIndex
CREATE INDEX "InventorySerialEvent_operationId_idx" ON "InventorySerialEvent"("operationId");

-- CreateIndex
CREATE UNIQUE INDEX "InventorySerialEvent_serialUnitId_version_key" ON "InventorySerialEvent"("serialUnitId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "StockReservation_reference_key" ON "StockReservation"("reference");

-- CreateIndex
CREATE INDEX "StockReservation_configurationId_status_idx" ON "StockReservation"("configurationId", "status");

-- CreateIndex
CREATE INDEX "StockReservation_warehouseId_status_idx" ON "StockReservation"("warehouseId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "StockReservationLine_reservationId_componentId_key" ON "StockReservationLine"("reservationId", "componentId");

-- CreateIndex
CREATE UNIQUE INDEX "StockReservationLine_reservationId_bomLineId_key" ON "StockReservationLine"("reservationId", "bomLineId");

-- CreateIndex
CREATE UNIQUE INDEX "StockDispatch_reference_key" ON "StockDispatch"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "StockDispatch_reservationId_key" ON "StockDispatch"("reservationId");

-- CreateIndex
CREATE UNIQUE INDEX "StockDispatchLine_reservationLineId_key" ON "StockDispatchLine"("reservationLineId");

-- CreateIndex
CREATE INDEX "StockDispatchLine_dispatchId_idx" ON "StockDispatchLine"("dispatchId");

-- CreateIndex
CREATE UNIQUE INDEX "StockTransfer_operationId_key" ON "StockTransfer"("operationId");

-- AddForeignKey
ALTER TABLE "InventoryOperation" ADD CONSTRAINT "InventoryOperation_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryBalance" ADD CONSTRAINT "InventoryBalance_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "SolarComponent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryBalance" ADD CONSTRAINT "InventoryBalance_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "InventoryOperation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_balanceId_fkey" FOREIGN KEY ("balanceId") REFERENCES "InventoryBalance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_reservationLineId_fkey" FOREIGN KEY ("reservationLineId") REFERENCES "StockReservationLine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_dispatchLineId_fkey" FOREIGN KEY ("dispatchLineId") REFERENCES "StockDispatchLine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventorySerialUnit" ADD CONSTRAINT "InventorySerialUnit_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "SolarComponent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventorySerialUnit" ADD CONSTRAINT "InventorySerialUnit_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventorySerialUnit" ADD CONSTRAINT "InventorySerialUnit_receiptOperationId_fkey" FOREIGN KEY ("receiptOperationId") REFERENCES "InventoryOperation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventorySerialUnit" ADD CONSTRAINT "InventorySerialUnit_reservationLineId_fkey" FOREIGN KEY ("reservationLineId") REFERENCES "StockReservationLine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventorySerialUnit" ADD CONSTRAINT "InventorySerialUnit_dispatchLineId_fkey" FOREIGN KEY ("dispatchLineId") REFERENCES "StockDispatchLine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventorySerialEvent" ADD CONSTRAINT "InventorySerialEvent_serialUnitId_fkey" FOREIGN KEY ("serialUnitId") REFERENCES "InventorySerialUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventorySerialEvent" ADD CONSTRAINT "InventorySerialEvent_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "InventoryOperation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventorySerialEvent" ADD CONSTRAINT "InventorySerialEvent_movementId_fkey" FOREIGN KEY ("movementId") REFERENCES "StockMovement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockReservation" ADD CONSTRAINT "StockReservation_configurationId_fkey" FOREIGN KEY ("configurationId") REFERENCES "SolarConfiguration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockReservation" ADD CONSTRAINT "StockReservation_bomId_fkey" FOREIGN KEY ("bomId") REFERENCES "BillOfMaterials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockReservation" ADD CONSTRAINT "StockReservation_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockReservation" ADD CONSTRAINT "StockReservation_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "InventoryOperation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockReservationLine" ADD CONSTRAINT "StockReservationLine_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "StockReservation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockReservationLine" ADD CONSTRAINT "StockReservationLine_bomLineId_fkey" FOREIGN KEY ("bomLineId") REFERENCES "BOMLine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockReservationLine" ADD CONSTRAINT "StockReservationLine_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "SolarComponent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockDispatch" ADD CONSTRAINT "StockDispatch_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "StockReservation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockDispatch" ADD CONSTRAINT "StockDispatch_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockDispatch" ADD CONSTRAINT "StockDispatch_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "InventoryOperation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockDispatchLine" ADD CONSTRAINT "StockDispatchLine_dispatchId_fkey" FOREIGN KEY ("dispatchId") REFERENCES "StockDispatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockDispatchLine" ADD CONSTRAINT "StockDispatchLine_reservationLineId_fkey" FOREIGN KEY ("reservationLineId") REFERENCES "StockReservationLine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransfer" ADD CONSTRAINT "StockTransfer_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "InventoryOperation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransfer" ADD CONSTRAINT "StockTransfer_sourceWarehouseId_fkey" FOREIGN KEY ("sourceWarehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransfer" ADD CONSTRAINT "StockTransfer_destinationWarehouseId_fkey" FOREIGN KEY ("destinationWarehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransfer" ADD CONSTRAINT "StockTransfer_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "SolarComponent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- M04 stock invariants. Generated DDL above is additive; no migration is applied here.
ALTER TABLE "InventoryBalance" ADD CONSTRAINT "InventoryBalance_quantities_check" CHECK (
 "onHandQuantity">=0 AND "reservedQuantity">=0 AND "reservedQuantity"<="onHandQuantity" AND "quarantinedQuantity">=0
 AND "reorderLevel">=0 AND ("reorderQuantity" IS NULL OR "reorderQuantity">0) AND "version">0);
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_quantities_check" CHECK (
 "quantity">0 AND "onHandBefore">=0 AND "onHandAfter">=0 AND "reservedBefore">=0 AND "reservedAfter">=0
 AND "reservedBefore"<="onHandBefore" AND "reservedAfter"<="onHandAfter" AND "quarantinedBefore">=0 AND "quarantinedAfter">=0);
ALTER TABLE "StockReservationLine" ADD CONSTRAINT "StockReservationLine_quantity_check" CHECK ("quantity">0);
ALTER TABLE "StockDispatchLine" ADD CONSTRAINT "StockDispatchLine_quantity_check" CHECK ("quantity">0 AND "returnedQuantity">=0 AND "returnedQuantity"<="quantity");
ALTER TABLE "StockTransfer" ADD CONSTRAINT "StockTransfer_quantity_check" CHECK ("quantity">0 AND "sourceWarehouseId"<>"destinationWarehouseId");
ALTER TABLE "StockDispatch" ADD CONSTRAINT "StockDispatch_status_check" CHECK ("status"='POSTED');
ALTER TABLE "InventorySerialUnit" ADD CONSTRAINT "InventorySerialUnit_state_check" CHECK (
 "version">0 AND length(btrim("serialNumber"))>0 AND "serialNumber"=upper(btrim("serialNumber")) AND
 (("state"='RESERVED' AND "reservationLineId" IS NOT NULL AND "dispatchLineId" IS NULL)
 OR ("state"='DISPATCHED' AND "reservationLineId" IS NOT NULL AND "dispatchLineId" IS NOT NULL)
 OR ("state"='QUARANTINED' AND "reservationLineId" IS NULL)
 OR ("state" IN ('AVAILABLE','RETIRED') AND "reservationLineId" IS NULL AND "dispatchLineId" IS NULL)));
CREATE UNIQUE INDEX "StockReservation_one_committed_configuration" ON "StockReservation"("configurationId") WHERE "status" IN ('ACTIVE','DISPATCHED');

CREATE FUNCTION "m04_immutable"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Inventory audit records are immutable; post a compensating operation' USING ERRCODE='23514'; END;
$$;
CREATE TRIGGER "StockMovement_immutable" BEFORE UPDATE OR DELETE ON "StockMovement" FOR EACH ROW EXECUTE FUNCTION "m04_immutable"();
CREATE TRIGGER "InventorySerialEvent_immutable" BEFORE UPDATE OR DELETE ON "InventorySerialEvent" FOR EACH ROW EXECUTE FUNCTION "m04_immutable"();
CREATE TRIGGER "StockTransfer_immutable" BEFORE UPDATE OR DELETE ON "StockTransfer" FOR EACH ROW EXECUTE FUNCTION "m04_immutable"();
CREATE TRIGGER "StockDispatch_immutable" BEFORE UPDATE OR DELETE ON "StockDispatch" FOR EACH ROW EXECUTE FUNCTION "m04_immutable"();
CREATE TRIGGER "StockReservationLine_immutable" BEFORE UPDATE OR DELETE ON "StockReservationLine" FOR EACH ROW EXECUTE FUNCTION "m04_immutable"();
CREATE FUNCTION "m04_operation_guard"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Operations are immutable' USING ERRCODE='23514'; END IF;
 IF TG_OP='UPDATE' AND (OLD."result"<>'{}'::jsonb OR (to_jsonb(NEW)-'result') IS DISTINCT FROM (to_jsonb(OLD)-'result')) THEN RAISE EXCEPTION 'Only initial operation result finalization is allowed' USING ERRCODE='23514'; END IF;
 IF TG_OP='INSERT' AND NOT EXISTS(SELECT 1 FROM "User" WHERE "id"=NEW."actorId" AND "isActive" AND "role" IN ('ADMIN','WAREHOUSE')) THEN RAISE EXCEPTION 'Active inventory actor required' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER "InventoryOperation_guard" BEFORE INSERT OR UPDATE OR DELETE ON "InventoryOperation" FOR EACH ROW EXECUTE FUNCTION "m04_operation_guard"();
CREATE FUNCTION "m04_balance_guard"() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE c "SolarComponent"%ROWTYPE;
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Balance identity cannot be deleted' USING ERRCODE='23514'; END IF;
 SELECT * INTO c FROM "SolarComponent" WHERE "id"=NEW."componentId";
 IF NOT FOUND OR NEW."serializationRequired"<>c."serializationRequired" THEN RAISE EXCEPTION 'Catalog serialization policy mismatch' USING ERRCODE='23514'; END IF;
 IF (c."unit" IN ('PCS','SET','PAIR') OR c."serializationRequired") AND
 (NEW."onHandQuantity"<>round(NEW."onHandQuantity",0) OR NEW."reservedQuantity"<>round(NEW."reservedQuantity",0) OR NEW."quarantinedQuantity"<>round(NEW."quarantinedQuantity",0) OR NEW."reorderLevel"<>round(NEW."reorderLevel",0) OR NEW."reorderQuantity"<>round(NEW."reorderQuantity",0)) THEN RAISE EXCEPTION 'Counted equipment requires whole quantities' USING ERRCODE='23514'; END IF;
 IF c."serializationRequired" AND c."unit"<>'PCS' THEN RAISE EXCEPTION 'Serialized units must use PCS' USING ERRCODE='23514'; END IF;
 IF TG_OP='INSERT' THEN
  IF NEW."onHandQuantity"<>0 OR NEW."reservedQuantity"<>0 OR NEW."quarantinedQuantity"<>0 OR NEW."version"<>1 THEN RAISE EXCEPTION 'Initialize empty balances only; post stock using ledger' USING ERRCODE='23514'; END IF;
 ELSE
  IF ROW(NEW."id",NEW."componentId",NEW."warehouseId",NEW."serializationRequired",NEW."createdAt") IS DISTINCT FROM ROW(OLD."id",OLD."componentId",OLD."warehouseId",OLD."serializationRequired",OLD."createdAt") OR NEW."version"<>OLD."version"+1 THEN RAISE EXCEPTION 'Balance identity/version mismatch' USING ERRCODE='23514'; END IF;
  IF pg_trigger_depth()<2 AND ROW(NEW."onHandQuantity",NEW."reservedQuantity",NEW."quarantinedQuantity",NEW."lastMovementAt") IS DISTINCT FROM ROW(OLD."onHandQuantity",OLD."reservedQuantity",OLD."quarantinedQuantity",OLD."lastMovementAt") THEN RAISE EXCEPTION 'Quantity changes require a ledger posting' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER "InventoryBalance_guard" BEFORE INSERT OR UPDATE OR DELETE ON "InventoryBalance" FOR EACH ROW EXECUTE FUNCTION "m04_balance_guard"();
CREATE FUNCTION "m04_ledger_post"() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE b "InventoryBalance"%ROWTYPE; h int:=0; r int:=0; q int:=0; c "SolarComponent"%ROWTYPE;
BEGIN
 SELECT * INTO b FROM "InventoryBalance" WHERE "id"=NEW."balanceId" FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Missing inventory balance' USING ERRCODE='23514'; END IF;
 SELECT * INTO c FROM "SolarComponent" WHERE "id"=b."componentId";
 IF ROW(NEW."onHandBefore",NEW."reservedBefore",NEW."quarantinedBefore") IS DISTINCT FROM ROW(b."onHandQuantity",b."reservedQuantity",b."quarantinedQuantity") THEN RAISE EXCEPTION 'Stale ledger balance snapshot' USING ERRCODE='23514'; END IF;
 IF (c."unit" IN ('PCS','SET','PAIR') OR c."serializationRequired") AND NEW."quantity"<>round(NEW."quantity",0) THEN RAISE EXCEPTION 'Fractional counted stock' USING ERRCODE='23514'; END IF;
 CASE NEW."type"
 WHEN 'OPENING_BALANCE' THEN h:=1;
 WHEN 'RECEIPT' THEN h:=1;
 WHEN 'ADJUSTMENT_IN' THEN h:=1;
 WHEN 'ADJUSTMENT_OUT' THEN h:=-1;
 WHEN 'RESERVATION' THEN r:=1;
 WHEN 'RESERVATION_RELEASE' THEN r:=-1;
 WHEN 'DISPATCH' THEN h:=-1; r:=-1;
 WHEN 'RETURN' THEN q:=1;
 WHEN 'TRANSFER_IN' THEN h:=1;
 WHEN 'TRANSFER_OUT' THEN h:=-1;
 WHEN 'INSPECTION_RELEASE' THEN h:=1; q:=-1;
 WHEN 'QUARANTINE_DISPOSAL' THEN q:=-1;
 END CASE;
 IF NEW."type"='OPENING_BALANCE' AND EXISTS(SELECT 1 FROM "StockMovement" WHERE "balanceId"=b."id") THEN RAISE EXCEPTION 'Opening already posted' USING ERRCODE='23514'; END IF;
 IF ROW(NEW."onHandAfter",NEW."reservedAfter",NEW."quarantinedAfter") IS DISTINCT FROM ROW(b."onHandQuantity"+h*NEW."quantity",b."reservedQuantity"+r*NEW."quantity",b."quarantinedQuantity"+q*NEW."quantity") THEN RAISE EXCEPTION 'Movement delta does not match type' USING ERRCODE='23514'; END IF;
 IF NEW."reservationLineId" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "StockReservationLine" l JOIN "StockReservation" s ON s."id"=l."reservationId" WHERE l."id"=NEW."reservationLineId" AND l."componentId"=b."componentId" AND (NEW."type"='RETURN' OR s."warehouseId"=b."warehouseId")) THEN RAISE EXCEPTION 'Movement reservation ownership mismatch' USING ERRCODE='23514'; END IF;
 IF NEW."dispatchLineId" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "StockDispatchLine" WHERE "id"=NEW."dispatchLineId" AND "reservationLineId"=NEW."reservationLineId") THEN RAISE EXCEPTION 'Movement dispatch ownership mismatch' USING ERRCODE='23514'; END IF;
 UPDATE "InventoryBalance" SET "onHandQuantity"=NEW."onHandAfter","reservedQuantity"=NEW."reservedAfter","quarantinedQuantity"=NEW."quarantinedAfter","version"="version"+1,"lastMovementAt"=NEW."createdAt","updatedAt"=now() WHERE "id"=b."id";
 RETURN NEW;
END;
$$;
CREATE TRIGGER "StockMovement_post" BEFORE INSERT ON "StockMovement" FOR EACH ROW EXECUTE FUNCTION "m04_ledger_post"();
CREATE FUNCTION "m04_serial_guard"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Serial traceability cannot be deleted' USING ERRCODE='23514'; END IF;
 IF NOT EXISTS(SELECT 1 FROM "SolarComponent" WHERE "id"=NEW."componentId" AND "serializationRequired") THEN RAISE EXCEPTION 'Serial requires a serialized catalog component' USING ERRCODE='23514'; END IF;
 IF TG_OP='INSERT' THEN
  IF NEW."state"<>'AVAILABLE' OR NEW."version"<>1 THEN RAISE EXCEPTION 'Receive available serials at version one' USING ERRCODE='23514'; END IF;
 ELSE
  IF ROW(NEW."id",NEW."componentId",NEW."serialNumber",NEW."receiptOperationId",NEW."receivedAt") IS DISTINCT FROM ROW(OLD."id",OLD."componentId",OLD."serialNumber",OLD."receiptOperationId",OLD."receivedAt") OR NEW."version"<>OLD."version"+1 THEN RAISE EXCEPTION 'Immutable serial identity or stale version' USING ERRCODE='23514'; END IF;
  IF NOT ((OLD."state"='AVAILABLE' AND NEW."state" IN ('AVAILABLE','RESERVED','RETIRED')) OR (OLD."state"='RESERVED' AND NEW."state" IN ('AVAILABLE','DISPATCHED')) OR (OLD."state"='DISPATCHED' AND NEW."state"='QUARANTINED') OR (OLD."state"='QUARANTINED' AND NEW."state" IN ('AVAILABLE','RETIRED'))) THEN RAISE EXCEPTION 'Invalid serial lifecycle transition' USING ERRCODE='23514'; END IF;
  IF OLD."warehouseId"<>NEW."warehouseId" AND NOT ((OLD."state"='AVAILABLE' AND NEW."state"='AVAILABLE') OR (OLD."state"='DISPATCHED' AND NEW."state"='QUARANTINED')) THEN RAISE EXCEPTION 'Reserved serials cannot transfer' USING ERRCODE='23514'; END IF;
 END IF;
 IF NEW."reservationLineId" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "StockReservationLine" l JOIN "StockReservation" s ON s."id"=l."reservationId" WHERE l."id"=NEW."reservationLineId" AND l."componentId"=NEW."componentId" AND s."warehouseId"=NEW."warehouseId") THEN RAISE EXCEPTION 'Invalid serial reservation ownership' USING ERRCODE='23514'; END IF;
 IF NEW."dispatchLineId" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "StockDispatchLine" d JOIN "StockReservationLine" l ON l."id"=d."reservationLineId" WHERE d."id"=NEW."dispatchLineId" AND l."componentId"=NEW."componentId" AND (NEW."state"<>'DISPATCHED' OR d."reservationLineId"=NEW."reservationLineId")) THEN RAISE EXCEPTION 'Invalid serial dispatch ownership' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER "InventorySerialUnit_guard" BEFORE INSERT OR UPDATE OR DELETE ON "InventorySerialUnit" FOR EACH ROW EXECUTE FUNCTION "m04_serial_guard"();
CREATE FUNCTION "m04_serial_audit_check"() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE s "InventorySerialUnit"%ROWTYPE;
BEGIN
 SELECT * INTO s FROM "InventorySerialUnit" WHERE "id"=NEW."id";
 IF NOT EXISTS(SELECT 1 FROM "InventorySerialEvent" e JOIN "StockMovement" m ON m."id"=e."movementId" JOIN "InventoryBalance" b ON b."id"=m."balanceId" WHERE e."serialUnitId"=s."id" AND e."version"=s."version" AND e."toState"=s."state" AND e."toWarehouseId"=s."warehouseId" AND e."reservationLineId" IS NOT DISTINCT FROM s."reservationLineId" AND e."dispatchLineId" IS NOT DISTINCT FROM s."dispatchLineId" AND e."operationId"=m."operationId" AND b."componentId"=s."componentId" AND b."warehouseId"=s."warehouseId") THEN RAISE EXCEPTION 'Serial changes require matching immutable movement history' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END;
$$;
CREATE CONSTRAINT TRIGGER "InventorySerialUnit_audit" AFTER INSERT OR UPDATE ON "InventorySerialUnit" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION "m04_serial_audit_check"();
CREATE FUNCTION "m04_stock_consistency"() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE b "InventoryBalance"%ROWTYPE; usable bigint; held bigint; quarantined bigint; allocated numeric;
BEGIN
 SELECT * INTO b FROM "InventoryBalance" WHERE "id"=NEW."id";
 IF b."serializationRequired" THEN
  SELECT count(*) FILTER(WHERE "state" IN ('AVAILABLE','RESERVED')),count(*) FILTER(WHERE "state"='RESERVED'),count(*) FILTER(WHERE "state"='QUARANTINED') INTO usable,held,quarantined FROM "InventorySerialUnit" WHERE "componentId"=b."componentId" AND "warehouseId"=b."warehouseId";
  IF ROW(b."onHandQuantity",b."reservedQuantity",b."quarantinedQuantity") IS DISTINCT FROM ROW(usable::numeric,held::numeric,quarantined::numeric) THEN RAISE EXCEPTION 'Serialized counts do not reconcile with stock' USING ERRCODE='23514'; END IF;
 END IF;
 SELECT coalesce(sum(l."quantity"),0) INTO allocated FROM "StockReservationLine" l JOIN "StockReservation" r ON r."id"=l."reservationId" WHERE l."componentId"=b."componentId" AND r."warehouseId"=b."warehouseId" AND r."status"='ACTIVE';
 IF b."reservedQuantity"<>allocated THEN RAISE EXCEPTION 'Reserved balance must reconcile with active allocations' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END;
$$;
CREATE CONSTRAINT TRIGGER "InventoryBalance_reconcile" AFTER INSERT OR UPDATE ON "InventoryBalance" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION "m04_stock_consistency"();
CREATE FUNCTION "m04_warehouse_guard"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Deactivate warehouses instead' USING ERRCODE='23514'; END IF;
 IF NEW."id"<>OLD."id" OR NEW."code"<>OLD."code" OR NEW."version"<>OLD."version"+1 THEN RAISE EXCEPTION 'Warehouse identity/version conflict' USING ERRCODE='23514'; END IF;
 IF NOT NEW."isActive" AND (EXISTS(SELECT 1 FROM "InventoryBalance" WHERE "warehouseId"=OLD."id" AND ("onHandQuantity">0 OR "reservedQuantity">0 OR "quarantinedQuantity">0)) OR EXISTS(SELECT 1 FROM "StockReservation" WHERE "warehouseId"=OLD."id" AND "status"='ACTIVE')) THEN RAISE EXCEPTION 'Warehouse has outstanding stock obligations' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER "Warehouse_guard" BEFORE UPDATE OR DELETE ON "Warehouse" FOR EACH ROW EXECUTE FUNCTION "m04_warehouse_guard"();
CREATE FUNCTION "m04_catalog_serial_policy"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW."serializationRequired"<>OLD."serializationRequired" AND EXISTS(SELECT 1 FROM "InventoryBalance" WHERE "componentId"=OLD."id") THEN RAISE EXCEPTION 'Serialization policy is frozen after inventory initialization; use a distinct catalog SKU' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER "SolarComponent_inventory_policy" BEFORE UPDATE ON "SolarComponent" FOR EACH ROW EXECUTE FUNCTION "m04_catalog_serial_policy"();
CREATE FUNCTION "m04_reservation_guard"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Reservation history cannot be deleted' USING ERRCODE='23514'; END IF;
 IF TG_OP='INSERT' THEN
  IF NEW."status"<>'ACTIVE' OR NEW."version"<>1 OR NOT EXISTS(SELECT 1 FROM "SolarConfiguration" c JOIN "BillOfMaterials" b ON b."configurationId"=c."id" JOIN "SolarConfigurationReview" r ON r."configurationId"=c."id" AND r."configurationVersion"=c."approvedVersion" WHERE c."id"=NEW."configurationId" AND b."id"=NEW."bomId" AND b."version"=NEW."bomVersion" AND b."status"='APPROVED' AND c."status"='APPROVED' AND c."approvedVersion"=NEW."configurationVersion" AND r."id"=NEW."configurationReviewId" AND r."decision"='APPROVED' AND NOT EXISTS(SELECT 1 FROM "SolarConfiguration" n WHERE n."previousConfigurationId"=c."id")) THEN RAISE EXCEPTION 'Exact approved BOM/configuration required' USING ERRCODE='23514'; END IF;
 ELSE
  IF (to_jsonb(NEW)-ARRAY['status','version','updatedAt']) IS DISTINCT FROM (to_jsonb(OLD)-ARRAY['status','version','updatedAt']) OR OLD."status"<>'ACTIVE' OR NEW."status" NOT IN ('RELEASED','CANCELLED','DISPATCHED') OR NEW."version"<>OLD."version"+1 THEN RAISE EXCEPTION 'Invalid reservation transition' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER "StockReservation_guard" BEFORE INSERT OR UPDATE OR DELETE ON "StockReservation" FOR EACH ROW EXECUTE FUNCTION "m04_reservation_guard"();
CREATE FUNCTION "m04_dispatch_line_guard"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Dispatch history cannot be deleted' USING ERRCODE='23514'; END IF;
 IF TG_OP='UPDATE' AND ((to_jsonb(NEW)-'returnedQuantity') IS DISTINCT FROM (to_jsonb(OLD)-'returnedQuantity') OR NEW."returnedQuantity"<OLD."returnedQuantity") THEN RAISE EXCEPTION 'Only cumulative returns may update a dispatch line' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER "StockDispatchLine_guard" BEFORE UPDATE OR DELETE ON "StockDispatchLine" FOR EACH ROW EXECUTE FUNCTION "m04_dispatch_line_guard"();
-- A posted operation cannot be reused to append further stock effects.
CREATE FUNCTION "m04_movement_operation_guard"() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE o "InventoryOperation"%ROWTYPE;
BEGIN
 SELECT * INTO o FROM "InventoryOperation" WHERE "id"=NEW."operationId";
 IF NOT FOUND OR o."result"<>'{}'::jsonb THEN RAISE EXCEPTION 'Post movements only during initial atomic operation' USING ERRCODE='23514'; END IF;
 IF NOT ((o."kind"='RECEIPT' AND NEW."type"='RECEIPT') OR (o."kind"='ADJUSTMENT' AND NEW."type" IN ('OPENING_BALANCE','ADJUSTMENT_IN','ADJUSTMENT_OUT','INSPECTION_RELEASE','QUARANTINE_DISPOSAL')) OR (o."kind"='TRANSFER' AND NEW."type" IN ('TRANSFER_IN','TRANSFER_OUT')) OR (o."kind"='RESERVATION' AND NEW."type"='RESERVATION') OR (o."kind" IN ('RESERVATION_RELEASE','RESERVATION_CANCEL') AND NEW."type"='RESERVATION_RELEASE') OR (o."kind"='DISPATCH' AND NEW."type"='DISPATCH') OR (o."kind"='RETURN' AND NEW."type"='RETURN')) THEN RAISE EXCEPTION 'Movement kind does not match operation' USING ERRCODE='23514'; END IF;
 IF o."kind"='ADJUSTMENT' AND NOT EXISTS(SELECT 1 FROM "User" WHERE "id"=o."actorId" AND "role"='ADMIN' AND "isActive") THEN RAISE EXCEPTION 'Adjustments require active admin' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER "StockMovement_operation" BEFORE INSERT ON "StockMovement" FOR EACH ROW EXECUTE FUNCTION "m04_movement_operation_guard"();
CREATE FUNCTION "m04_movement_serial_check"() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE b "InventoryBalance"%ROWTYPE; n bigint;
BEGIN
 SELECT * INTO b FROM "InventoryBalance" WHERE "id"=NEW."balanceId";
 IF b."serializationRequired" AND NEW."type"<>'TRANSFER_OUT' THEN
  SELECT count(*) INTO n FROM "InventorySerialEvent" WHERE "movementId"=NEW."id";
  IF n<>NEW."quantity" THEN RAISE EXCEPTION 'Movement requires exactly one matching event per serialized unit' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NULL;
END;
$$;
CREATE CONSTRAINT TRIGGER "StockMovement_serial_count" AFTER INSERT ON "StockMovement" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION "m04_movement_serial_check"();
CREATE FUNCTION "m04_serial_event_guard"() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE m "StockMovement"%ROWTYPE; s "InventorySerialUnit"%ROWTYPE;
BEGIN
 SELECT * INTO m FROM "StockMovement" WHERE "id"=NEW."movementId";
 SELECT * INTO s FROM "InventorySerialUnit" WHERE "id"=NEW."serialUnitId";
 IF NOT FOUND OR NEW."version"<>s."version" OR NEW."toState"<>s."state" OR NEW."toWarehouseId"<>s."warehouseId" OR NEW."operationId"<>m."operationId" OR NOT EXISTS(SELECT 1 FROM "InventoryOperation" WHERE "id"=NEW."operationId" AND "result"='{}'::jsonb) THEN RAISE EXCEPTION 'Serial event must match initial atomic operation' USING ERRCODE='23514'; END IF;
 IF NOT ((m."type" IN ('RECEIPT','OPENING_BALANCE','ADJUSTMENT_IN') AND NEW."fromState" IS NULL AND NEW."toState"='AVAILABLE' AND NEW."version"=1) OR (m."type" IN ('ADJUSTMENT_OUT','QUARANTINE_DISPOSAL') AND NEW."toState"='RETIRED') OR (m."type"='RESERVATION' AND NEW."fromState"='AVAILABLE' AND NEW."toState"='RESERVED') OR (m."type"='RESERVATION_RELEASE' AND NEW."fromState"='RESERVED' AND NEW."toState"='AVAILABLE') OR (m."type"='DISPATCH' AND NEW."fromState"='RESERVED' AND NEW."toState"='DISPATCHED') OR (m."type"='RETURN' AND NEW."fromState"='DISPATCHED' AND NEW."toState"='QUARANTINED') OR (m."type"='TRANSFER_IN' AND NEW."fromState"='AVAILABLE' AND NEW."toState"='AVAILABLE') OR (m."type"='INSPECTION_RELEASE' AND NEW."fromState"='QUARANTINED' AND NEW."toState"='AVAILABLE')) THEN RAISE EXCEPTION 'Serial transition does not match movement' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER "InventorySerialEvent_guard" BEFORE INSERT ON "InventorySerialEvent" FOR EACH ROW EXECUTE FUNCTION "m04_serial_event_guard"();
COMMIT;
