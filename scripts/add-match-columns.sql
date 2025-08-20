-- Add missing columns to matches table
-- Run this in your Supabase SQL Editor

-- Add games_per_set column with default value of 6
ALTER TABLE matches 
ADD COLUMN IF NOT EXISTS games_per_set INTEGER DEFAULT 6;

-- Add sets_per_match column with default value of 3
ALTER TABLE matches 
ADD COLUMN IF NOT EXISTS sets_per_match INTEGER DEFAULT 3;

-- Update existing matches to have default values
UPDATE matches 
SET 
  games_per_set = COALESCE(games_per_set, 6),
  sets_per_match = COALESCE(sets_per_match, 3)
WHERE games_per_set IS NULL OR sets_per_match IS NULL;

-- Verify the changes
SELECT 
  id,
  player1_id,
  player2_id,
  games_per_set,
  sets_per_match,
  court,
  start_time,
  player1_score,
  player2_score
FROM matches 
LIMIT 5;
