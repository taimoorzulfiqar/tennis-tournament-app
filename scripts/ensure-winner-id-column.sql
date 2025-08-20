-- Ensure winner_id column exists in matches table
-- Run this in your Supabase SQL Editor

-- Add winner_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'matches' 
        AND column_name = 'winner_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE matches ADD COLUMN winner_id UUID REFERENCES profiles(id);
        RAISE NOTICE 'Added winner_id column to matches table';
    ELSE
        RAISE NOTICE 'winner_id column already exists in matches table';
    END IF;
END $$;

-- Verify the column exists
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'matches' 
AND column_name = 'winner_id'
AND table_schema = 'public';

-- Show current matches with winner_id
SELECT 
  id,
  tournament_id,
  player1_id,
  player2_id,
  player1_score,
  player2_score,
  winner_id,
  status,
  created_at
FROM matches 
ORDER BY created_at DESC
LIMIT 5;
