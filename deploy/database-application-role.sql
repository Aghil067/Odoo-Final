-- Operator-run psql configuration, after migrations, in a dedicated database.
-- Execute as the migration owner/DBA, never through the application connection.
-- https://www.postgresql.org/docs/18/sql-grant.html
\set ON_ERROR_STOP on
BEGIN;
DO $$
DECLARE application_role record; application_table record;
BEGIN
 SELECT * INTO application_role FROM pg_roles WHERE rolname='solar_app';
 IF NOT FOUND THEN
  CREATE ROLE solar_app LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS CONNECTION LIMIT 20;
 ELSIF application_role.rolsuper OR application_role.rolcreatedb OR application_role.rolcreaterole
    OR application_role.rolreplication OR application_role.rolbypassrls OR NOT application_role.rolcanlogin THEN
  RAISE EXCEPTION 'Existing solar_app role is not a restricted application login; inspect it explicitly';
 END IF;
 IF EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace JOIN pg_roles r ON r.oid=c.relowner WHERE r.rolname='solar_app' AND n.nspname='public')
    OR EXISTS(SELECT 1 FROM pg_namespace n JOIN pg_roles r ON r.oid=n.nspowner WHERE r.rolname='solar_app' AND n.nspname='public')
    OR EXISTS(SELECT 1 FROM pg_database d JOIN pg_roles r ON r.oid=d.datdba WHERE r.rolname='solar_app' AND d.datname=current_database())
    OR EXISTS(SELECT 1 FROM pg_auth_members m JOIN pg_roles r ON r.oid=m.member WHERE r.rolname='solar_app') THEN
  RAISE EXCEPTION 'Application role must not own schema objects or inherit other roles';
 END IF;
 EXECUTE format('GRANT CONNECT ON DATABASE %I TO solar_app',current_database());
 GRANT USAGE ON SCHEMA public TO solar_app;
 REVOKE CREATE ON SCHEMA public FROM solar_app;
 IF has_schema_privilege('solar_app','public','CREATE') THEN
  RAISE EXCEPTION 'Application inherits schema creation authority; inspect PUBLIC/schema ownership explicitly';
 END IF;
 FOR application_table IN SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename<>'_prisma_migrations' LOOP
  EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO solar_app',application_table.tablename);
 END LOOP;
 GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO solar_app;
 -- Never grant DDL, trigger management, TRUNCATE or migration metadata writes.
 IF to_regclass('public._prisma_migrations') IS NOT NULL THEN
  REVOKE ALL ON TABLE public._prisma_migrations FROM solar_app;
  IF has_table_privilege('solar_app','public._prisma_migrations','INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER') THEN
   RAISE EXCEPTION 'Application inherits migration-metadata write authority; inspect database grants explicitly';
  END IF;
 END IF;
END;
$$;
COMMIT;
-- Set the password interactively so it is absent from SQL, history and logs.
\password solar_app
-- Re-run the grant section as the migration owner after additive schema changes.
