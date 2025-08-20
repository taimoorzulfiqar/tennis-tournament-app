import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is required in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkVerificationStatus() {
  try {
    console.log('🔍 Checking verification_status column...');

    // Try to query the verification_status column
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, verification_status')
      .limit(1);

    if (error) {
      if (error.message.includes('verification_status')) {
        console.error('❌ verification_status column does not exist!');
        console.log('\n📝 Please run the following SQL in your Supabase SQL editor:');
        console.log('\n-- Add verification_status column');
        console.log('ALTER TABLE profiles ADD COLUMN verification_status TEXT NOT NULL CHECK (verification_status IN (\'pending\', \'approved\', \'rejected\')) DEFAULT \'approved\';');
        console.log('\n-- Update existing users');
        console.log('UPDATE profiles SET verification_status = \'approved\' WHERE verification_status IS NULL;');
        console.log('\n-- Add index');
        console.log('CREATE INDEX IF NOT EXISTS idx_profiles_verification_status ON profiles(verification_status);');
      } else {
        console.error('❌ Error checking verification_status:', error.message);
      }
      return;
    }

    console.log('✅ verification_status column exists!');
    console.log('📊 Sample data:', data);

    // Check if all users have verification_status
    const { data: allUsers, error: allUsersError } = await supabase
      .from('profiles')
      .select('id, email, verification_status');

    if (allUsersError) {
      console.error('❌ Error fetching all users:', allUsersError.message);
      return;
    }

    const usersWithoutStatus = allUsers.filter(user => !user.verification_status);
    
    if (usersWithoutStatus.length > 0) {
      console.log(`⚠️  Found ${usersWithoutStatus.length} users without verification_status:`);
      usersWithoutStatus.forEach(user => {
        console.log(`   - ${user.email} (ID: ${user.id})`);
      });
      console.log('\n📝 Run this SQL to fix:');
      console.log('UPDATE profiles SET verification_status = \'approved\' WHERE verification_status IS NULL;');
    } else {
      console.log('✅ All users have verification_status set!');
    }

  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
}

checkVerificationStatus();
