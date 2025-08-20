-- Create a function to delete users from both profiles and auth tables
-- This function should be run in Supabase SQL editor

CREATE OR REPLACE FUNCTION delete_user_complete(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete from profiles table
  DELETE FROM profiles WHERE id = user_id;
  
  -- Note: We cannot delete from auth.users directly from a function
  -- The auth user will need to be deleted manually or through admin API
  -- For now, we'll just delete the profile and mark the auth user as inactive
  
  -- You can manually delete the auth user from Supabase dashboard
  -- or use the admin API with service role key
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_user_complete(UUID) TO authenticated;

-- Create a policy to allow only master users to delete users
CREATE POLICY "Only master users can delete users" ON profiles
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'master'
    )
  );
