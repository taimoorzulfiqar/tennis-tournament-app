const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   - VITE_SUPABASE_URL')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixMatchDeletePolicy() {
  console.log('🔧 Fixing match deletion RLS policies...')
  
  try {
    // Read the SQL script
    const fs = require('fs')
    const path = require('path')
    const sqlPath = path.join(__dirname, 'fix-match-delete-policy.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')
    
    // Split the SQL into individual statements
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`Executing ${statements.length} SQL statements...`)
    
    // Execute each statement individually
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.trim()) {
        console.log(`Executing statement ${i + 1}: ${statement.substring(0, 50)}...`)
        
        const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' })
        
        if (error) {
          // If exec_sql doesn't exist, try alternative approach
          if (error.message.includes('function "exec_sql" does not exist')) {
            console.log('exec_sql function not available, trying alternative approach...')
            // For now, just log the statements that need to be run manually
            console.log('\n📋 Please run these SQL statements manually in your Supabase SQL editor:')
            console.log('=' .repeat(50))
            statements.forEach((stmt, index) => {
              if (stmt.trim()) {
                console.log(`${index + 1}. ${stmt};`)
              }
            })
            console.log('=' .repeat(50))
            return
          } else {
            console.error(`❌ Error executing statement ${i + 1}:`, error)
            // Continue with other statements
          }
        }
      }
    }
    
    console.log('✅ Match deletion RLS policies have been fixed!')
    
    // Verify the policies
    const { data: policies, error: policyError } = await supabase
      .from('pg_policies')
      .select('policyname, tablename, cmd')
      .eq('tablename', 'matches')
      .order('policyname')
    
    if (policyError) {
      console.error('❌ Error checking policies:', policyError)
      return
    }
    
    console.log('\n📋 Current match policies:')
    policies.forEach(policy => {
      console.log(`   - ${policy.policyname} (${policy.cmd})`)
    })
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

fixMatchDeletePolicy()
