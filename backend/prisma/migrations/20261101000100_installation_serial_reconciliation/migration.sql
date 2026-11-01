BEGIN;

-- Qualify serial columns so PostgreSQL cannot confuse them with PL/pgSQL
-- variables. Keep the original deferred reconciliation and quantity rules.
CREATE OR REPLACE FUNCTION "m05_serial_reconcile"() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
 equipment_id uuid;
 equipment_row "InstallationEquipment"%ROWTYPE;
 received_count bigint;
 damaged_count bigint;
 installed_count bigint;
BEGIN
 IF TG_TABLE_NAME='InstallationEquipment' THEN
  equipment_id:=NEW."id";
 ELSE
  equipment_id:=NEW."equipmentId";
 END IF;
 SELECT e.* INTO equipment_row FROM "InstallationEquipment" e WHERE e."id"=equipment_id;
 IF equipment_row."serializationRequired" THEN
  SELECT count(*) FILTER(WHERE s."received"),
         count(*) FILTER(WHERE s."damaged"),
         count(*) FILTER(WHERE s."installedAt" IS NOT NULL)
   INTO received_count,damaged_count,installed_count
   FROM "InstallationEquipmentSerial" s WHERE s."equipmentId"=equipment_row."id";
  IF ROW(equipment_row."receivedQuantity",equipment_row."damagedQuantity",equipment_row."installedQuantity")
     IS DISTINCT FROM ROW(received_count::numeric,damaged_count::numeric,installed_count::numeric) THEN
   RAISE EXCEPTION 'Installation serial counts must match cumulative equipment quantities' USING ERRCODE='23514';
  END IF;
 END IF;
 RETURN NULL;
END;
$$;

COMMIT;
