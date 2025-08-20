-- Manual fix for match deletion RLS policies
-- Run this directly in your Supabase SQL editor

-- Step 1: Drop all existing policies on matches table
DROP POLICY IF EXISTS "Approved admins and masters can manage matches" ON matches;
DROP POLICY IF EXISTS "Matches are viewable by everyone" ON matches;
DROP POLICY IF EXISTS "Approved admins and masters can create matches" ON matches;
DROP POLICY IF EXISTS "Approved admins and masters can update matches" ON matches;
DROP POLICY IF EXISTS "Approved admins and masters can delete matches" ON matches;
DROP POLICY IF EXISTS "Users can view matches for tournaments they have access to" ON matches;
DROP POLICY IF EXISTS "Admins can insert matches" ON matches;
DROP POLICY IF EXISTS "Admins can update matches" ON matches;
DROP POLICY IF EXISTS "Admins can delete matches" ON matches;

-- Step 2: Create new specific policies
CREATE POLICY "Matches are viewable by everyone" ON matches
  FOR SELECT USING (true);

CREATE POLICY "Approved admins and masters can create matches" ON matches
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'master') 
      AND verification_status = 'approved'
    )
  );

CREATE POLICY "Approved admins and masters can update matches" ON matches
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'master') 
      AND verification_status = 'approved'
    )
  );

CREATE POLICY "Approved admins and masters can delete matches" ON matches
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'master') 
      AND verification_status = 'approved'
    )
  );

-- Step 3: Verify the policies were created
SELECT 
  policyname,
  tablename,
  cmd
FROM pg_policies 
WHERE tablename = 'matches'
ORDER BY policyname;
