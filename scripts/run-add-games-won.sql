-- Run this script to add games_won column to profiles table
-- This should be run in your Supabase SQL editor

-- First, add the games_won column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'games_won'
    ) THEN
        ALTER TABLE profiles ADD COLUMN games_won INTEGER DEFAULT 0;
    END IF;
END $$;

-- Now update existing profiles with games won from their matches
UPDATE profiles 
SET games_won = COALESCE(
  (SELECT SUM(
    CASE 
      WHEN m.player1_id = p.id THEN m.player1_score
      WHEN m.player2_id = p.id THEN m.player2_score
      ELSE 0
    END
  )
  FROM matches m 
  WHERE m.status = 'completed' 
    AND (m.player1_id = p.id OR m.player2_id = p.id)), 
  0
);
