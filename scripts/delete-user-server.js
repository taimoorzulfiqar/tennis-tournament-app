const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function deleteUser(userId) {
  try {
    console.log('Server: Deleting user:', userId)
    
    // First, delete from profiles table
    console.log('Server: Deleting from profiles table...')
    const { error: deleteProfileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (deleteProfileError) {
      console.error('Server: Error deleting profile:', deleteProfileError)
      throw new Error(deleteProfileError.message)
    }

    console.log('Server: Profile deleted successfully')
    
    // Then, delete from auth users (requires service role key)
    console.log('Server: Deleting from auth users...')
    const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(userId)
    
    if (deleteAuthError) {
      console.error('Server: Error deleting auth user:', deleteAuthError)
      throw new Error(deleteAuthError.message)
    }

    console.log('Server: Auth user deleted successfully')
    console.log('Server: User completely deleted from both tables')
    
  } catch (error) {
    console.error('Server: Delete user operation failed:', error)
    throw error
  }
}

// If running directly, expect userId as command line argument
if (require.main === module) {
  const userId = process.argv[2]
  if (!userId) {
    console.error('Please provide a user ID as an argument')
    process.exit(1)
  }
  
  deleteUser(userId)
    .then(() => {
      console.log('User deletion completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('User deletion failed:', error)
      process.exit(1)
    })
}

module.exports = { deleteUser }
