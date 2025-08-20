const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is required in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixUserProfile() {
  try {
    console.log('🔧 Fixing user profile...');
    
    const userEmail = 'taimoorzulfiqar1@gmail.com';
    const userName = 'Taimoor Zulfiqar 1'; // You can change this
    const userRole = 'player'; // You can change this to 'admin' if needed
    
    // Get the auth user
    console.log('1. Getting auth user...');
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error getting auth users:', authError.message);
      return;
    }
    
    const authUser = users.find(user => user.email === userEmail);
    
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
          email: userEmail,
          full_name: userName,
          role: userRole
        });
      
      if (insertError) {
        console.error('❌ Error creating profile:', insertError.message);
        return;
      }
      
      console.log('✅ User profile created successfully');
    } else if (profileError) {
      console.error('❌ Error checking profile:', profileError.message);
      return;
    } else {
      console.log('✅ Profile already exists');
      
      // Update the profile to ensure it has the correct data
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          role: userRole,
          full_name: userName
        })
        .eq('id', authUser.id);
      
      if (updateError) {
        console.error('❌ Error updating profile:', updateError.message);
      } else {
        console.log('✅ Profile updated');
      }
    }
    
    console.log('🎉 User profile fixed!');
    console.log('📧 Email:', userEmail);
    console.log('🔑 Password: (the one you used during sign-up)');
    console.log('👤 Role:', userRole);
    
  } catch (error) {
    console.error('❌ Fix failed:', error.message);
  }
}

fixUserProfile();
