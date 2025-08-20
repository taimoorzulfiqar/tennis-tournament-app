import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is required in your .env file');
  console.log('📝 To get this key:');
  console.log('1. Go to your Supabase dashboard');
  console.log('2. Navigate to Settings > API');
  console.log('3. Copy the "service_role" key (not the anon key)');
  console.log('4. Add it to your .env file as SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applySignupFix() {
  try {
    console.log('🔧 Applying signup fix...');
    
    // SQL commands to fix the RLS policies
    const fixSQL = `
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
    `;

    console.log('📝 Running SQL fix...');
    const { error } = await supabase.rpc('exec_sql', { sql: fixSQL });
    
    if (error) {
      console.error('❌ Error applying fix:', error.message);
      console.log('\n💡 Alternative: You can manually run the SQL in your Supabase dashboard:');
      console.log('1. Go to your Supabase dashboard');
      console.log('2. Navigate to SQL Editor');
      console.log('3. Copy and paste the SQL from scripts/fix-admin-signup.sql');
      console.log('4. Run the SQL');
      return;
    }

    console.log('✅ Signup fix applied successfully!');
    console.log('🎉 Users should now be able to sign up without issues.');
    
  } catch (error) {
    console.error('❌ Fix failed:', error.message);
    console.log('\n💡 Alternative: You can manually run the SQL in your Supabase dashboard:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the SQL from scripts/fix-admin-signup.sql');
    console.log('4. Run the SQL');
  }
}

applySignupFix();
