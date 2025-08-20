-- Check the current structure of the matches table
-- Run this in your Supabase SQL Editor to see what columns exist

-- Show table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'matches' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show sample data
SELECT * FROM matches LIMIT 3;

-- Count total matches
SELECT COUNT(*) as total_matches FROM matches;
