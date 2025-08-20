-- Update matches table to support multiple sets
-- Run this in your Supabase SQL Editor

-- First, let's create a new table to store set scores
CREATE TABLE IF NOT EXISTS match_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  set_number INTEGER NOT NULL CHECK (set_number > 0),
  player1_games INTEGER DEFAULT 0 CHECK (player1_games >= 0),
  player2_games INTEGER DEFAULT 0 CHECK (player2_games >= 0),
  winner_id UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(match_id, set_number)
);

-- Create indexes for match_sets
CREATE INDEX IF NOT EXISTS idx_match_sets_match_id ON match_sets(match_id);
CREATE INDEX IF NOT EXISTS idx_match_sets_set_number ON match_sets(set_number);

-- Enable RLS for match_sets
ALTER TABLE match_sets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for match_sets
CREATE POLICY "Users can view match sets for matches they have access to" ON match_sets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM matches 
      WHERE matches.id = match_sets.match_id
    )
  );

CREATE POLICY "Admins can insert match sets" ON match_sets
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'master')
    )
  );

CREATE POLICY "Admins can update match sets" ON match_sets
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'master')
    )
  );

CREATE POLICY "Admins can delete match sets" ON match_sets
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'master')
    )
  );

-- Create a function to determine match winner based on sets
CREATE OR REPLACE FUNCTION determine_match_winner(match_uuid UUID)
RETURNS UUID AS $$
DECLARE
  player1_sets_won INTEGER := 0;
  player2_sets_won INTEGER := 0;
  match_record RECORD;
  set_record RECORD;
BEGIN
  -- Get match details
  SELECT * INTO match_record FROM matches WHERE id = match_uuid;
  
  -- Count sets won by each player based on winner_id
  FOR set_record IN 
    SELECT * FROM match_sets 
    WHERE match_id = match_uuid 
    ORDER BY set_number
  LOOP
    IF set_record.winner_id = match_record.player1_id THEN
      player1_sets_won := player1_sets_won + 1;
    ELSIF set_record.winner_id = match_record.player2_id THEN
      player2_sets_won := player2_sets_won + 1;
    END IF;
  END LOOP;
  
  -- Determine winner based on sets won
  IF player1_sets_won > player2_sets_won THEN
    RETURN match_record.player1_id;
  ELSIF player2_sets_won > player1_sets_won THEN
    RETURN match_record.player2_id;
  ELSE
    -- If sets are tied, return null (no winner)
    RETURN NULL;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create a function to determine set winner based on games
CREATE OR REPLACE FUNCTION determine_set_winner(set_uuid UUID)
RETURNS UUID AS $$
DECLARE
  set_record RECORD;
  match_record RECORD;
BEGIN
  -- Get set details
  SELECT * INTO set_record FROM match_sets WHERE id = set_uuid;
  
  -- Get match details
  SELECT * INTO match_record FROM matches WHERE id = set_record.match_id;
  
  -- Determine set winner based on games won
  IF set_record.player1_games > set_record.player2_games THEN
    RETURN match_record.player1_id;
  ELSIF set_record.player2_games > set_record.player1_games THEN
    RETURN match_record.player2_id;
  ELSE
    -- If games are tied, return null (no winner)
    RETURN NULL;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create a function to update set winner when games are updated
CREATE OR REPLACE FUNCTION update_set_winner()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the winner_id in the match_sets table
  UPDATE match_sets 
  SET winner_id = determine_set_winner(NEW.id)
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a function to update match winner when sets are updated
CREATE OR REPLACE FUNCTION update_match_winner()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the winner_id in the matches table
  UPDATE matches 
  SET winner_id = determine_match_winner(NEW.match_id)
  WHERE id = NEW.match_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update set winner when games are modified
CREATE TRIGGER trigger_update_set_winner
  AFTER INSERT OR UPDATE ON match_sets
  FOR EACH ROW
  EXECUTE FUNCTION update_set_winner();

-- Create trigger to automatically update match winner when sets are modified
CREATE TRIGGER trigger_update_match_winner
  AFTER INSERT OR UPDATE OR DELETE ON match_sets
  FOR EACH ROW
  EXECUTE FUNCTION update_match_winner();

-- For backward compatibility, let's also create a view that shows total scores
CREATE OR REPLACE VIEW match_totals AS
SELECT 
  m.id,
  m.tournament_id,
  m.player1_id,
  m.player2_id,
  m.court,
  m.games_per_set,
  m.sets_per_match,
  m.status,
  m.winner_id,
  m.created_at,
  m.updated_at,
  COALESCE(SUM(ms.player1_games), 0) as player1_total_games,
  COALESCE(SUM(ms.player2_games), 0) as player2_total_games,
  COUNT(ms.id) as sets_played
FROM matches m
LEFT JOIN match_sets ms ON m.id = ms.match_id
GROUP BY m.id, m.tournament_id, m.player1_id, m.player2_id, m.court, 
         m.games_per_set, m.sets_per_match, m.status, m.winner_id, 
         m.created_at, m.updated_at;

-- Show the current structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'matches' 
AND table_schema = 'public'
ORDER BY ordinal_position;
