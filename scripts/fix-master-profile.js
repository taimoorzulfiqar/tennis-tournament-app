const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is required in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixMasterProfile() {
  try {
    console.log('🔧 Fixing master user profile...');
    
    const masterEmail = 'taimoorzulfiqar97@gmail.com';
    const masterName = 'Taimoor Zulfiqar';
    
    // First, get the auth user to get the correct ID
    console.log('1. Getting auth user...');
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error getting auth users:', authError.message);
      return;
    }
    
    const authUser = users.find(user => user.email === masterEmail);
    
    if (!authUser) {
      console.error('❌ Auth user not found');
      return;
    }
    
    console.log('✅ Auth user found:', authUser.id);
    
    // Check if profile exists
    console.log('2. Checking if profile exists...');
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();
    
    if (profileError && profileError.code === 'PGRST116') {
      console.log('⚠️  Profile does not exist, creating...');
      
      // Create the profile
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: authUser.id,
          email: masterEmail,
          full_name: masterName,
          role: 'master'
        });
      
      if (insertError) {
        console.error('❌ Error creating profile:', insertError.message);
        return;
      }
      
      console.log('✅ Master user profile created successfully');
    } else if (profileError) {
      console.error('❌ Error checking profile:', profileError.message);
      return;
    } else {
      console.log('✅ Profile already exists');
      
      // Update the profile to ensure it has the correct role
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          role: 'master',
          full_name: masterName
        })
        .eq('id', authUser.id);
      
      if (updateError) {
        console.error('❌ Error updating profile:', updateError.message);
      } else {
        console.log('✅ Profile updated with master role');
      }
    }
    
    console.log('🎉 Master user profile fixed!');
    
  } catch (error) {
    console.error('❌ Fix failed:', error.message);
  }
}

fixMasterProfile();
