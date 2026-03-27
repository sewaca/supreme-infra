-- Migration: Fix rating mock data for test user 550e8400-e29b-41d4-a716-446655440000
--
-- XP formula: (average_grade * 200) + (unlocked_achievements * 50) + (streak_days * 10)
-- Calculation: (4.75 * 200) + (4 * 50) + (15 * 10) = 950 + 200 + 150 = 1300 XP
-- Level thresholds: novice(0) beginner(100) intermediate(300) advanced(600) expert(1000) master(1500) legend(2500)
-- At 1300 XP -> level: expert

UPDATE rating_level
SET level = 'expert', current_xp = 1300
WHERE user_id = '550e8400-e29b-41d4-a716-446655440000';

-- Adjust achievement progress values to reflect semantic max_progress per type:
--   boolean achievements (group_leader): max_progress=1
--   percentage/count achievements (top_1_percent, first_try, etc.): max_progress=100
-- No changes needed — existing seeds already use max_progress=100 for locked
-- and max_progress=1 for unlocked boolean achievements.

-- Update streak to current values (streak of 15 is consistent with +150 XP above)
UPDATE streak
SET current = 15, best = 28
WHERE user_id = '550e8400-e29b-41d4-a716-446655440000';
