-- Test script for Foreign Data Wrapper setup
-- Run this script after database initialization to verify FDW is working correctly

-- ============================================================================
-- 1. Check FDW Extension
-- ============================================================================
SELECT 
  extname as "Extension Name",
  extversion as "Version"
FROM pg_extension 
WHERE extname = 'postgres_fdw';
-- Expected: 1 row with postgres_fdw

-- ============================================================================
-- 2. Check Foreign Server
-- ============================================================================
SELECT 
  srvname as "Server Name",
  srvoptions as "Options"
FROM pg_foreign_server 
WHERE srvname = 'auth_server';
-- Expected: 1 row with auth_server

-- ============================================================================
-- 3. Check User Mapping
-- ============================================================================
SELECT 
  usename as "User",
  srvname as "Server",
  umoptions as "Options"
FROM pg_user_mappings 
WHERE srvname = 'auth_server';
-- Expected: 1 row with current user mapping

-- ============================================================================
-- 4. Check Foreign Table
-- ============================================================================
SELECT 
  foreign_table_schema as "Schema",
  foreign_table_name as "Table Name",
  foreign_server_name as "Server"
FROM information_schema.foreign_tables 
WHERE foreign_table_name = 'users';
-- Expected: 1 row with users table

-- ============================================================================
-- 5. Test Foreign Table Access
-- ============================================================================
-- This should return users from core-auth-bff database
SELECT 
  id,
  email,
  name,
  role,
  created_at
FROM users
ORDER BY id
LIMIT 5;
-- Expected: List of users (admin, moderator, user)

-- ============================================================================
-- 6. Test Validation Trigger - Valid User
-- ============================================================================
-- First, get a valid user_id
DO $$
DECLARE
  valid_user_id INTEGER;
BEGIN
  SELECT id INTO valid_user_id FROM users LIMIT 1;
  
  -- Try to insert a like with valid user_id
  INSERT INTO recipe_likes (user_id, recipe_id, liked_at)
  VALUES (valid_user_id, 1, NOW())
  ON CONFLICT (user_id, recipe_id) DO NOTHING;
  
  RAISE NOTICE 'Successfully inserted like with user_id: %', valid_user_id;
END $$;
-- Expected: Success message

-- ============================================================================
-- 7. Test Validation Trigger - Invalid User
-- ============================================================================
-- This should fail with error
DO $$
BEGIN
  INSERT INTO recipe_likes (user_id, recipe_id, liked_at)
  VALUES (999999, 1, NOW());
  
  RAISE EXCEPTION 'ERROR: Validation should have failed!';
EXCEPTION
  WHEN OTHERS THEN
    IF SQLERRM LIKE '%does not exist%' THEN
      RAISE NOTICE 'Validation working correctly: %', SQLERRM;
    ELSE
      RAISE;
    END IF;
END $$;
-- Expected: Notice about validation working correctly

-- ============================================================================
-- 8. Test Views with User Data
-- ============================================================================
-- Test published_recipes_with_users view
SELECT 
  id,
  title,
  author,
  author_name,
  author_email,
  author_role
FROM published_recipes_with_users
LIMIT 5;
-- Expected: Recipes with user information

-- Test recipe_likes_with_users view
SELECT 
  id,
  recipe_id,
  user_id,
  user_name,
  user_email,
  liked_at
FROM recipe_likes_with_users
LIMIT 5;
-- Expected: Likes with user information

-- ============================================================================
-- 9. Test JOIN Performance
-- ============================================================================
EXPLAIN ANALYZE
SELECT 
  r.id,
  r.title,
  r.author,
  u.name as author_name,
  u.email as author_email,
  COUNT(l.id) as likes_count
FROM published_recipes r
LEFT JOIN users u ON r.author_user_id = u.id
LEFT JOIN recipe_likes l ON l.recipe_id = r.id
WHERE r.difficulty = 'easy'
GROUP BY r.id, r.title, r.author, u.name, u.email
LIMIT 10;
-- Expected: Query plan with execution time

-- ============================================================================
-- 10. Test Cross-Database Consistency
-- ============================================================================
-- Count users in foreign table
SELECT COUNT(*) as "Users Count" FROM users;

-- Count recipes with valid author_user_id
SELECT COUNT(*) as "Recipes with Authors" 
FROM published_recipes 
WHERE author_user_id IS NOT NULL;

-- Count recipes with invalid author_user_id (should be 0)
SELECT COUNT(*) as "Recipes with Invalid Authors"
FROM published_recipes r
WHERE r.author_user_id IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = r.author_user_id);
-- Expected: 0

-- ============================================================================
-- Summary
-- ============================================================================
SELECT 
  'FDW Setup' as "Test Category",
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgres_fdw') 
    THEN '✅ PASS' 
    ELSE '❌ FAIL' 
  END as "Extension",
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_foreign_server WHERE srvname = 'auth_server') 
    THEN '✅ PASS' 
    ELSE '❌ FAIL' 
  END as "Server",
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.foreign_tables WHERE foreign_table_name = 'users') 
    THEN '✅ PASS' 
    ELSE '❌ FAIL' 
  END as "Foreign Table",
  CASE 
    WHEN EXISTS (SELECT 1 FROM users LIMIT 1) 
    THEN '✅ PASS' 
    ELSE '❌ FAIL' 
  END as "Data Access";

