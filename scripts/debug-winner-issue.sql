-- Debug script to check winner_id issue
-- Run this in your Supabase SQL Editor

-- 1. Check if winner_id column exists
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'matches' 
AND column_name = 'winner_id'
AND table_schema = 'public';

-- 2. Check all completed matches and their winner_id values
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
WHERE status = 'completed'
ORDER BY created_at DESC;

-- 3. Check if there are any completed matches without winner_id
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
WHERE status = 'completed' 
AND winner_id IS NULL
ORDER BY created_at DESC;

-- 4. Check recent matches to see the pattern
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
LIMIT 10;
