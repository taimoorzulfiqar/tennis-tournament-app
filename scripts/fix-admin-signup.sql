-- Fix admin sign up issue by modifying RLS policies
-- This script allows new users to insert their own profile during sign-up

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Master users can insert profiles" ON profiles;

-- Create a new policy that allows users to insert their own profile
CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT WITH CHECK (
        -- Allow if the user is inserting their own profile (auth.uid() = id)
        auth.uid() = id
        OR
        -- Allow master users to insert any profile
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'master'
        )
    );

-- Also ensure we have a policy for updating verification status
DROP POLICY IF EXISTS "Master users can update verification status" ON profiles;

CREATE POLICY "Master users can update verification status" ON profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'master'
        )
    );

-- Ensure users can update their own profile
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Ensure users can view all profiles
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;

CREATE POLICY "Profiles are viewable by everyone" ON profiles
    FOR SELECT USING (true);

-- Ensure master users can delete profiles
DROP POLICY IF EXISTS "Master users can delete profiles" ON profiles;

CREATE POLICY "Master users can delete profiles" ON profiles
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'master'
        )
    );

-- Add verification_status column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'verification_status') THEN
        ALTER TABLE profiles ADD COLUMN verification_status TEXT NOT NULL CHECK (verification_status IN ('pending', 'approved', 'rejected')) DEFAULT 'approved';
    END IF;
END $$;

-- Update existing users to have 'approved' status if they don't have it
UPDATE profiles SET verification_status = 'approved' WHERE verification_status IS NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_verification_status ON profiles(verification_status);

PRINT '✅ Admin sign up RLS policies have been fixed!';
PRINT '📝 New users can now create their own profiles during sign-up.';
PRINT '🔐 Master users can still manage all profiles.';
