-- Script to update FDW credentials after deployment
-- This should be run after both databases are deployed with proper secrets
--
-- Usage:
--   For Kubernetes:
--     kubectl exec -it postgresql-core-recipes-bff-0 -- \
--       psql -U core_recipes_bff_user -d core_recipes_bff_db \
--       -v auth_user="core_auth_bff_user" \
--       -v auth_password="$DB_PASSWORD" \
--       -f /path/to/setup-fdw-credentials.sql
--
--   For local development:
--     psql -h localhost -U postgres -d core_recipes_bff_db \
--       -v auth_user="postgres" \
--       -v auth_password="postgres" \
--       -f setup-fdw-credentials.sql

-- Drop existing user mapping if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_user_mappings 
    WHERE srvname = 'auth_server' 
    AND usename = current_user
  ) THEN
    EXECUTE 'DROP USER MAPPING FOR CURRENT_USER SERVER auth_server';
    RAISE NOTICE 'Dropped existing user mapping';
  END IF;
END $$;

-- Create new user mapping with provided credentials
DO $$
DECLARE
  fdw_user TEXT := :'auth_user';
  fdw_pass TEXT := :'auth_password';
BEGIN
  IF fdw_user IS NULL OR fdw_pass IS NULL THEN
    RAISE EXCEPTION 'Variables auth_user and auth_password must be set. Usage: psql -v auth_user="..." -v auth_password="..." -f setup-fdw-credentials.sql';
  END IF;

  EXECUTE format(
    'CREATE USER MAPPING FOR CURRENT_USER SERVER auth_server OPTIONS (user %L, password %L)',
    fdw_user,
    fdw_pass
  );
  
  RAISE NOTICE 'Created user mapping for FDW with user: %', fdw_user;
  RAISE NOTICE 'Testing connection...';
END $$;

-- Test the connection
DO $$
DECLARE
  user_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count FROM users;
  RAISE NOTICE 'Successfully connected to foreign users table. Found % users.', user_count;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to connect to foreign users table: %', SQLERRM;
    RAISE NOTICE 'Please verify:';
    RAISE NOTICE '  1. core-auth-bff database is running and accessible';
    RAISE NOTICE '  2. Credentials are correct';
    RAISE NOTICE '  3. Network connectivity between databases';
END $$;

-- Display current configuration
SELECT 
  'FDW Configuration' as "Status",
  srvname as "Server Name",
  srvoptions as "Server Options"
FROM pg_foreign_server 
WHERE srvname = 'auth_server';

SELECT 
  'User Mapping' as "Status",
  usename as "Local User",
  srvname as "Server",
  umoptions as "Options"
FROM pg_user_mappings 
WHERE srvname = 'auth_server';

