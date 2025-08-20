-- Add verification_status column to profiles table
-- Run this in your Supabase SQL editor

-- Add verification_status column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'verification_status') THEN
        ALTER TABLE profiles ADD COLUMN verification_status TEXT NOT NULL CHECK (verification_status IN ('pending', 'approved', 'rejected')) DEFAULT 'approved';
    END IF;
END $$;

-- Update existing users to have 'approved' status
UPDATE profiles SET verification_status = 'approved' WHERE verification_status IS NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_verification_status ON profiles(verification_status);

-- Add RLS policies for verification status management
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Master users can delete profiles' AND tablename = 'profiles') THEN
        CREATE POLICY "Master users can delete profiles" ON profiles
            FOR DELETE USING (
                EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE id = auth.uid() AND role = 'master'
                )
            );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Master users can update verification status' AND tablename = 'profiles') THEN
        CREATE POLICY "Master users can update verification status" ON profiles
            FOR UPDATE USING (
                EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE id = auth.uid() AND role = 'master'
                )
            );
    END IF;
END $$;
