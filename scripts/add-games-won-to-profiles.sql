-- Add games_won column to profiles table
ALTER TABLE profiles ADD COLUMN games_won INTEGER DEFAULT 0;

-- Update existing profiles with games won from their matches
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
