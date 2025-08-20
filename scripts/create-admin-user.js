const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is required in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAdminUser() {
  try {
    console.log('👤 Creating new admin user...');
    
    // Get user details from command line arguments or use defaults
    const userEmail = process.argv[2] || 'admin@example.com';
    const userPassword = process.argv[3] || 'password123';
    const userName = process.argv[4] || 'Admin User';
    const userRole = process.argv[5] || 'admin'; // 'admin' or 'player'

    console.log('📝 User details:');
    console.log('- Email:', userEmail);
    console.log('- Name:', userName);
    console.log('- Role:', userRole);

    console.log('\n1. Creating auth user...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userEmail,
      password: userPassword,
      email_confirm: true,
      user_metadata: {
        full_name: userName,
        role: userRole
      }
    });

    if (authError) {
      console.error('❌ Error creating auth user:', authError.message);
      return;
    }

    console.log('✅ Auth user created:', authData.user.id);

    console.log('\n2. Creating profile...');
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: userEmail,
        full_name: userName,
        role: userRole
      });

    if (profileError) {
      console.error('❌ Error creating profile:', profileError.message);
      return;
    }

    console.log('✅ Profile created successfully');

    console.log('\n🎉 User created successfully!');
    console.log('📧 Email:', userEmail);
    console.log('🔑 Password:', userPassword);
    console.log('👤 Role:', userRole);
    console.log('🆔 User ID:', authData.user.id);
    
    console.log('\n💡 The user can now sign in with these credentials!');

  } catch (error) {
    console.error('❌ Creation failed:', error.message);
  }
}

createAdminUser();
