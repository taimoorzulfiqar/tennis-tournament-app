-- Step 1: Add the games_won column
-- Run this first:
ALTER TABLE profiles ADD COLUMN games_won INTEGER DEFAULT 0;

-- Step 2: Update existing profiles with games won from their matches
-- Run this after Step 1:
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

-- Step 3: Verify the column was added (optional)
-- Run this to check:
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name = 'games_won';
