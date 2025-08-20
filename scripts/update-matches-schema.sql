-- Update matches table schema to make court optional and remove start_time
-- This migration makes the court field optional and removes the start_time field

-- First, make the court field optional by allowing NULL values
ALTER TABLE matches ALTER COLUMN court DROP NOT NULL;

-- Remove the start_time column
ALTER TABLE matches DROP COLUMN IF EXISTS start_time;

-- Add a comment to document the change
COMMENT ON TABLE matches IS 'Matches table updated - court is now optional, start_time removed';
