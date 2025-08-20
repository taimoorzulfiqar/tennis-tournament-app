-- Add games_per_set and sets_per_match columns to matches table
-- Run this in your Supabase SQL editor

-- Add games_per_set column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'matches' AND column_name = 'games_per_set') THEN
        ALTER TABLE matches ADD COLUMN games_per_set INTEGER NOT NULL DEFAULT 6;
    END IF;
END $$;

-- Add sets_per_match column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'matches' AND column_name = 'sets_per_match') THEN
        ALTER TABLE matches ADD COLUMN sets_per_match INTEGER NOT NULL DEFAULT 3;
    END IF;
END $$;

-- Update existing matches to have default values
UPDATE matches SET games_per_set = 6 WHERE games_per_set IS NULL;
UPDATE matches SET sets_per_match = 3 WHERE sets_per_match IS NULL;
