import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is required in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testSignup() {
  try {
    console.log('🧪 Testing signup scenarios...\n');
    
    // Test 1: Different email, different password
    console.log('Test 1: Different email, different password');
    const test1Email = 'test1@example.com';
    const test1Password = 'password123';
    
    const { data: data1, error: error1 } = await supabase.auth.signUp({
      email: test1Email,
      password: test1Password,
    });
    
    if (error1) {
      console.log('❌ Test 1 failed:', error1.message);
    } else {
      console.log('✅ Test 1 passed: Auth user created');
      
      // Try to create profile
      const { error: profileError1 } = await supabase
        .from('profiles')
        .insert({
          id: data1.user.id,
          email: test1Email,
          full_name: 'Test User 1',
          role: 'player',
          verification_status: 'approved'
        });
      
      if (profileError1) {
        console.log('❌ Test 1 profile creation failed:', profileError1.message);
      } else {
        console.log('✅ Test 1 profile created successfully');
      }
    }
    
    console.log('');
    
    // Test 2: Different email, same password as test 1
    console.log('Test 2: Different email, same password as test 1');
    const test2Email = 'test2@example.com';
    const test2Password = 'password123'; // Same password as test 1
    
    const { data: data2, error: error2 } = await supabase.auth.signUp({
      email: test2Email,
      password: test2Password,
    });
    
    if (error2) {
      console.log('❌ Test 2 failed:', error2.message);
    } else {
      console.log('✅ Test 2 passed: Auth user created');
      
      // Try to create profile
      const { error: profileError2 } = await supabase
        .from('profiles')
        .insert({
          id: data2.user.id,
          email: test2Email,
          full_name: 'Test User 2',
          role: 'player',
          verification_status: 'approved'
        });
      
      if (profileError2) {
        console.log('❌ Test 2 profile creation failed:', profileError2.message);
      } else {
        console.log('✅ Test 2 profile created successfully');
      }
    }
    
    console.log('');
    
    // Test 3: Admin user with same password
    console.log('Test 3: Admin user with same password as test 1');
    const test3Email = 'admin@example.com';
    const test3Password = 'password123'; // Same password as test 1
    
    const { data: data3, error: error3 } = await supabase.auth.signUp({
      email: test3Email,
      password: test3Password,
    });
    
    if (error3) {
      console.log('❌ Test 3 failed:', error3.message);
    } else {
      console.log('✅ Test 3 passed: Auth user created');
      
      // Try to create profile
      const { error: profileError3 } = await supabase
        .from('profiles')
        .insert({
          id: data3.user.id,
          email: test3Email,
          full_name: 'Admin User',
          role: 'admin',
          verification_status: 'pending'
        });
      
      if (profileError3) {
        console.log('❌ Test 3 profile creation failed:', profileError3.message);
      } else {
        console.log('✅ Test 3 profile created successfully');
      }
    }
    
    console.log('\n🎯 Test Summary:');
    console.log('- If Test 1 passes but Test 2/3 fail, it might be a password-related issue');
    console.log('- If all auth users are created but profiles fail, it\'s likely an RLS policy issue');
    console.log('- If all tests pass, the issue might be intermittent or related to specific conditions');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testSignup();
