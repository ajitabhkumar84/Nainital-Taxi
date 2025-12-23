-- ============================================================================
-- COMPLETE CLEANUP SCRIPT - Removes ALL custom database objects
-- ============================================================================
-- This is a nuclear option that removes everything in the public schema
-- WARNING: This will delete ALL your data and custom objects!
-- ============================================================================

-- Drop ALL tables in public schema
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop all tables
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public')
    LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;

    -- Drop all types
    FOR r IN (SELECT typname FROM pg_type WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public') AND typtype = 'e')
    LOOP
        EXECUTE 'DROP TYPE IF EXISTS public.' || quote_ident(r.typname) || ' CASCADE';
    END LOOP;

    -- Drop all functions
    FOR r IN (SELECT proname, oidvectortypes(proargtypes) as argtypes
              FROM pg_proc
              WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public'))
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS public.' || quote_ident(r.proname) || '(' || r.argtypes || ') CASCADE';
    END LOOP;

    RAISE NOTICE 'Complete database cleanup finished!';
    RAISE NOTICE 'All tables, types, and functions have been removed.';
    RAISE NOTICE 'You can now run schema_final.sql';
END $$;
