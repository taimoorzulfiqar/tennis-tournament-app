# Admin Sign Up Fix Guide

## Problem
When trying to sign up as an admin, you get "sign up failed" error. This is caused by Row Level Security (RLS) policies in Supabase that prevent new users from creating their own profiles.

## Root Cause
The current RLS policy only allows users with the 'master' role to insert profiles:
```sql
CREATE POLICY "Master users can insert profiles" ON profiles
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'master'
        )
    );
```

This creates a chicken-and-egg problem: new users can't create their profile because they don't have a profile yet.

## Solution

### Option 1: Run the SQL Fix (Recommended)

1. **Go to your Supabase Dashboard**
   - Navigate to your Supabase project
   - Go to the SQL Editor

2. **Run the Fix SQL**
   Copy and paste the following SQL into the SQL Editor and run it:

```sql
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
```

### Option 2: Use the Script (Alternative)

If you prefer to use a script:

1. **Ensure you have the required environment variables:**
   ```bash
   VITE_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

2. **Run the fix script:**
   ```bash
   node scripts/fix-admin-signup.js
   ```

## What the Fix Does

1. **Replaces the restrictive policy** with a new one that allows:
   - Users to insert their own profile (auth.uid() = id)
   - Master users to insert any profile

2. **Ensures all necessary policies exist** for:
   - Profile updates
   - Profile viewing
   - Profile deletion (by master users)
   - Verification status updates

3. **Adds verification_status column** if it doesn't exist

4. **Updates existing users** to have proper verification status

## Security Considerations

- ✅ New users can only create their own profile
- ✅ Master users retain full control over all profiles
- ✅ Users can only update their own profile
- ✅ Master users can manage verification status
- ✅ All profiles are viewable (needed for the app functionality)

## Testing the Fix

After applying the fix:

1. **Try signing up as an admin** with a new email
2. **Check the Supabase dashboard** to see if the profile was created
3. **Verify the verification status** is set to 'pending' for admin users

## Troubleshooting

If you still encounter issues:

1. **Check the browser console** for specific error messages
2. **Verify the RLS policies** in Supabase dashboard under Authentication > Policies
3. **Ensure the verification_status column exists** in the profiles table
4. **Check that your Supabase environment variables are correct**

## Additional Notes

- Admin users will have `verification_status = 'pending'` and need approval from a master user
- Player users will have `verification_status = 'approved'` automatically
- The fix maintains security while allowing the sign-up process to work
