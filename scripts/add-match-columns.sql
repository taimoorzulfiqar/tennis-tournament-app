-- Add all missing columns to matches table
-- Run this in your Supabase SQL Editor

-- Add games_per_set column with default value of 6
ALTER TABLE matches 
ADD COLUMN IF NOT EXISTS games_per_set INTEGER DEFAULT 6;

-- Add sets_per_match column with default value of 3
ALTER TABLE matches 
ADD COLUMN IF NOT EXISTS sets_per_match INTEGER DEFAULT 3;

-- Add player1_score column with default value of 0
ALTER TABLE matches 
ADD COLUMN IF NOT EXISTS player1_score INTEGER DEFAULT 0;

-- Add player2_score column with default value of 0
ALTER TABLE matches 
ADD COLUMN IF NOT EXISTS player2_score INTEGER DEFAULT 0;

-- Add winner_id column (nullable)
ALTER TABLE matches 
ADD COLUMN IF NOT EXISTS winner_id UUID REFERENCES profiles(id);

-- Add status column with default value of 'scheduled'
ALTER TABLE matches 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed'));

-- Update existing matches to have default values
UPDATE matches 
SET 
  games_per_set = COALESCE(games_per_set, 6),
  sets_per_match = COALESCE(sets_per_match, 3),
  player1_score = COALESCE(player1_score, 0),
  player2_score = COALESCE(player2_score, 0),
  status = COALESCE(status, 'scheduled')
WHERE 
  games_per_set IS NULL 
  OR sets_per_match IS NULL 
  OR player1_score IS NULL 
  OR player2_score IS NULL 
  OR status IS NULL;

-- Verify the changes
SELECT 
  id,
  tournament_id,
  player1_id,
  player2_id,
  games_per_set,
  sets_per_match,
  court,
  start_time,
  player1_score,
  player2_score,
  winner_id,
  status,
  created_at
FROM matches 
LIMIT 5;
