const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testMasterUser() {
  try {
    console.log('🧪 Testing master user setup...');
    
    const masterEmail = 'taimoorzulfiqar97@gmail.com';
    const masterPassword = 'TechPM@321';
    
    // Test 1: Check if user exists in auth
    console.log('\n1. Checking auth user...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('❌ Auth error:', authError.message);
    } else if (user) {
      console.log('✅ Auth user found:', user.email);
    } else {
      console.log('⚠️  No auth user found');
    }
    
    // Test 2: Try to sign in
    console.log('\n2. Testing sign in...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: masterEmail,
      password: masterPassword,
    });
    
    if (signInError) {
      console.log('❌ Sign in error:', signInError.message);
    } else {
      console.log('✅ Sign in successful:', signInData.user.email);
    }
    
    // Test 3: Check profile
    console.log('\n3. Checking profile...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', masterEmail)
      .single();
    
    if (profileError) {
      console.log('❌ Profile error:', profileError.message);
    } else {
      console.log('✅ Profile found:', {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        role: profile.role
      });
    }
    
    // Test 4: Sign out
    await supabase.auth.signOut();
    console.log('\n4. Signed out');
    
    console.log('\n🎉 Test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testMasterUser();
