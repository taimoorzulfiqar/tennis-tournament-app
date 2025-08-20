const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is required in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkProfiles() {
  try {
    console.log('🔍 Checking profiles...');
    
    const masterEmail = 'taimoorzulfiqar97@gmail.com';
    
    // Get all profiles
    console.log('1. Getting all profiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*');
    
    if (profilesError) {
      console.error('❌ Error getting profiles:', profilesError.message);
      return;
    }
    
    console.log('📋 All profiles:');
    profiles.forEach(profile => {
      console.log(`- ID: ${profile.id}, Email: ${profile.email}, Role: ${profile.role}, Name: ${profile.full_name}`);
    });
    
    // Get auth user
    console.log('\n2. Getting auth user...');
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error getting auth users:', authError.message);
      return;
    }
    
    const authUser = users.find(user => user.email === masterEmail);
    
    if (authUser) {
      console.log(`✅ Auth user found: ${authUser.id}`);
      
      // Check if there's a profile with this ID
      const profileWithAuthId = profiles.find(p => p.id === authUser.id);
      if (profileWithAuthId) {
        console.log('✅ Profile exists with auth user ID');
      } else {
        console.log('❌ No profile with auth user ID');
      }
      
      // Check if there's a profile with this email
      const profileWithEmail = profiles.find(p => p.email === masterEmail);
      if (profileWithEmail) {
        console.log(`⚠️  Profile exists with email but different ID: ${profileWithEmail.id}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
}

checkProfiles();
