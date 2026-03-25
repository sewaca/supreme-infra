-- Migration: fix recipe_likes.user_id column type from INTEGER to UUID
--
-- The column was originally created as INTEGER when user IDs were numeric.
-- core-auth uses UUIDs, so this column must be UUID.
--
-- This migration truncates recipe_likes (no production data, only test data)
-- and recreates the column with the correct type.
-- Run on: core_recipes_bff_db

-- Drop existing constraints/indexes that reference user_id
ALTER TABLE recipe_likes DROP CONSTRAINT IF EXISTS unique_user_recipe;
DROP INDEX IF EXISTS idx_recipe_likes_user_id;

-- Recreate the column as UUID (truncate first since integer values can't be cast to UUID)
TRUNCATE TABLE recipe_likes;
ALTER TABLE recipe_likes DROP COLUMN user_id;
ALTER TABLE recipe_likes ADD COLUMN user_id UUID NOT NULL;

-- Restore constraints and indexes
ALTER TABLE recipe_likes ADD CONSTRAINT unique_user_recipe UNIQUE (user_id, recipe_id);
CREATE INDEX idx_recipe_likes_user_id ON recipe_likes(user_id);
