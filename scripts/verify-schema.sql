-- Verify that the new schema has been applied correctly
-- Run this in your Supabase SQL Editor

-- Check if match_sets table exists
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_name = 'match_sets' 
AND table_schema = 'public';

-- Check matches table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'matches' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check match_sets table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'match_sets' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if the function exists
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_name = 'determine_match_winner' 
AND routine_schema = 'public';

-- Check if the trigger exists
SELECT 
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_update_match_winner' 
AND trigger_schema = 'public';

-- Test the functions with sample data (if any exist)
SELECT 
  id,
  player1_id,
  player2_id,
  determine_match_winner(id) as calculated_winner,
  winner_id as stored_winner
FROM matches 
LIMIT 5;

-- Test set winner determination (if any sets exist)
SELECT 
  ms.id,
  ms.set_number,
  ms.player1_games,
  ms.player2_games,
  ms.winner_id as set_winner,
  determine_set_winner(ms.id) as calculated_set_winner
FROM match_sets ms
LIMIT 5;
