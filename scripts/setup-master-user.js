const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

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

async function setupMasterUser() {
  try {
    console.log('🔧 Setting up master user...');
    
    const masterEmail = 'taimoorzulfiqar97@gmail.com';
    const masterPassword = 'TechPM@321';
    const masterName = 'Taimoor Zulfiqar';
    
    // First, try to create the auth user
    console.log('📝 Creating auth user...');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: masterEmail,
      password: masterPassword,
      options: {
        data: {
          full_name: masterName,
          role: 'master'
        }
      }
    });
    
    if (signUpError) {
      if (signUpError.message.includes('already registered')) {
        console.log('⚠️  User already exists in auth system');
      } else {
        console.error('❌ Error creating auth user:', signUpError.message);
        return;
      }
    } else {
      console.log('✅ Auth user created successfully');
    }
    
    // Now try to sign in to get the user ID
    console.log('🔐 Testing sign in...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: masterEmail,
      password: masterPassword,
    });
    
    if (signInError) {
      console.error('❌ Error signing in:', signInError.message);
      console.log('💡 You may need to confirm your email first');
      return;
    }
    
    console.log('✅ Sign in successful');
    const userId = signInData.user.id;
    
    // Check if profile exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', masterEmail)
      .single();
    
    if (profileError && profileError.code !== 'PGRST116') {
      console.error('❌ Error checking profile:', profileError.message);
      return;
    }
    
    if (!profile) {
      console.log('📝 Creating profile...');
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: masterEmail,
          full_name: masterName,
          role: 'master'
        });
      
      if (insertError) {
        console.error('❌ Error creating profile:', insertError.message);
        return;
      }
      
      console.log('✅ Master user profile created successfully');
    } else {
      console.log('✅ Master user profile already exists');
      
      // Update the profile to ensure it has the correct role
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          role: 'master',
          full_name: masterName
        })
        .eq('id', userId);
      
      if (updateError) {
        console.error('❌ Error updating profile:', updateError.message);
      } else {
        console.log('✅ Profile updated with master role');
      }
    }
    
    await supabase.auth.signOut();
    
    console.log('\n🎉 Master user setup complete!');
    console.log('📧 Email:', masterEmail);
    console.log('🔑 Password:', masterPassword);
    console.log('👤 Role: master');
    console.log('\n💡 You can now sign in to the app with these credentials');
    console.log('⚠️  Note: You may need to confirm your email in Supabase dashboard first');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  }
}

setupMasterUser();
