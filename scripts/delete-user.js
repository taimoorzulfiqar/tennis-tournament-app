const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is required in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deleteUser() {
  try {
    const userEmail = process.argv[2];
    
    if (!userEmail) {
      console.error('❌ Please provide a user email');
      console.log('Usage: node scripts/delete-user.js <email>');
      process.exit(1);
    }

    console.log('🗑️  Deleting user:', userEmail);

    // First, get the user from auth system
    console.log('1. Finding user in auth system...');
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserByEmail(userEmail);

    if (authError) {
      console.error('❌ Error finding auth user:', authError.message);
      return;
    }

    if (!authUser.user) {
      console.error('❌ User not found in auth system');
      return;
    }

    console.log('✅ Found auth user:', authUser.user.id);

    // Delete from profiles table
    console.log('2. Deleting from profiles table...');
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', authUser.user.id);

    if (profileError) {
      console.error('❌ Error deleting profile:', profileError.message);
      return;
    }

    console.log('✅ Profile deleted successfully');

    // Delete from auth system
    console.log('3. Deleting from auth system...');
    const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(authUser.user.id);

    if (deleteAuthError) {
      console.error('❌ Error deleting auth user:', deleteAuthError.message);
      return;
    }

    console.log('✅ Auth user deleted successfully');

    console.log('\n🎉 User deleted successfully from both database and auth system!');
    console.log('📧 Email:', userEmail);
    console.log('🆔 User ID:', authUser.user.id);

  } catch (error) {
    console.error('❌ Deletion failed:', error.message);
  }
}

deleteUser();
