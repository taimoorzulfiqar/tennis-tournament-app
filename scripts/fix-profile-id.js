const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is required in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixProfileId() {
  try {
    console.log('🔧 Fixing profile ID mismatch...');
    
    const masterEmail = 'taimoorzulfiqar97@gmail.com';
    const masterName = 'Taimoor Zulfiqar';
    
    // Get auth user
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
    
    // Delete the old profile with wrong ID
    console.log('2. Deleting old profile...');
    const { error: deleteError } = await supabase
      .from('profiles')
      .delete()
      .eq('email', masterEmail);
    
    if (deleteError) {
      console.error('❌ Error deleting old profile:', deleteError.message);
      return;
    }
    
    console.log('✅ Old profile deleted');
    
    // Create new profile with correct ID
    console.log('3. Creating new profile with correct ID...');
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: authUser.id,
        email: masterEmail,
        full_name: masterName,
        role: 'master'
      });
    
    if (insertError) {
      console.error('❌ Error creating new profile:', insertError.message);
      return;
    }
    
    console.log('✅ New profile created with correct ID');
    
    // Verify the fix
    console.log('4. Verifying fix...');
    const { data: newProfile, error: verifyError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();
    
    if (verifyError) {
      console.error('❌ Error verifying profile:', verifyError.message);
      return;
    }
    
    console.log('✅ Profile verified:', {
      id: newProfile.id,
      email: newProfile.email,
      role: newProfile.role,
      name: newProfile.full_name
    });
    
    console.log('🎉 Profile ID mismatch fixed!');
    
  } catch (error) {
    console.error('❌ Fix failed:', error.message);
  }
}

fixProfileId();
