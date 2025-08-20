const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is required in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createUser() {
  try {
    console.log('👤 Creating new user...');
    
    // User details - you can modify these
    const userEmail = 'player1@example.com';
    const userPassword = 'password123';
    const userName = 'Player One';
    const userRole = 'player'; // 'player' or 'admin'
    
    console.log('📝 User details:');
    console.log('- Email:', userEmail);
    console.log('- Name:', userName);
    console.log('- Role:', userRole);
    
    // Create auth user
    console.log('\n1. Creating auth user...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userEmail,
      password: userPassword,
      email_confirm: true, // Auto-confirm email
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
    
    // Create profile
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
    
  } catch (error) {
    console.error('❌ Creation failed:', error.message);
  }
}

createUser();
