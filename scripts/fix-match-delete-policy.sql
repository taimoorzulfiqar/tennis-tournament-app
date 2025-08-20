-- Fix match deletion RLS policies
-- This script ensures that approved admins and masters can delete matches

-- Drop all existing policies that might be conflicting
DROP POLICY IF EXISTS "Approved admins and masters can manage matches" ON matches;
DROP POLICY IF EXISTS "Matches are viewable by everyone" ON matches;
DROP POLICY IF EXISTS "Approved admins and masters can create matches" ON matches;
DROP POLICY IF EXISTS "Approved admins and masters can update matches" ON matches;
DROP POLICY IF EXISTS "Approved admins and masters can delete matches" ON matches;
DROP POLICY IF EXISTS "Users can view matches for tournaments they have access to" ON matches;
DROP POLICY IF EXISTS "Admins can insert matches" ON matches;
DROP POLICY IF EXISTS "Admins can update matches" ON matches;
DROP POLICY IF EXISTS "Admins can delete matches" ON matches;

-- Create specific policies for each operation
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

-- Verify the policies were created
SELECT 
  policyname,
  tablename,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'matches'
ORDER BY policyname;
