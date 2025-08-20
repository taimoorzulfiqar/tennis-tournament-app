const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is required in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixAdminSignup() {
  try {
    console.log('🔧 Fixing admin sign up RLS policies...');
    
    // Read the SQL fix
    const fs = require('fs');
    const path = require('path');
    const sqlPath = path.join(__dirname, 'fix-admin-signup.sql');
    
    if (!fs.existsSync(sqlPath)) {
      console.error('❌ SQL file not found:', sqlPath);
      return;
    }
    
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📝 Executing SQL fix...');
    const { error } = await supabase.rpc('exec_sql', { sql: sqlContent });
    
    if (error) {
      // If RPC doesn't exist, we'll need to run this manually
      console.log('⚠️  RPC method not available. Please run the SQL manually in Supabase SQL editor.');
      console.log('\n📋 Copy and paste this SQL into your Supabase SQL editor:');
      console.log('\n' + '='.repeat(50));
      console.log(sqlContent);
      console.log('='.repeat(50));
      return;
    }
    
    console.log('✅ Admin sign up RLS policies have been fixed!');
    console.log('📝 New users can now create their own profiles during sign-up.');
    console.log('🔐 Master users can still manage all profiles.');
    
    // Test the fix by checking current policies
    console.log('\n🔍 Checking current policies...');
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('policyname, tablename')
      .eq('tablename', 'profiles');
    
    if (!policiesError && policies) {
      console.log('📋 Current profiles policies:');
      policies.forEach(policy => {
        console.log(`   - ${policy.policyname}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Fix failed:', error.message);
    console.log('\n📋 Please run the SQL manually in your Supabase SQL editor.');
  }
}

fixAdminSignup();
