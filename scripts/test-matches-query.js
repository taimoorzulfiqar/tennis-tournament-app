const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testMatchesQuery() {
  try {
    console.log('Testing matches query...')
    
    // Test 1: Get all matches
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select('*')
      .order('created_at', { ascending: true })
    
    if (matchesError) {
      console.error('Error fetching matches:', matchesError)
      return
    }
    
    console.log('✅ Matches query successful')
    console.log(`Found ${matches.length} matches:`)
    matches.forEach((match, index) => {
      console.log(`${index + 1}. Match ID: ${match.id}`)
      console.log(`   Tournament: ${match.tournament_id}`)
      console.log(`   Players: ${match.player1_id} vs ${match.player2_id}`)
      console.log(`   Status: ${match.status}`)
      console.log(`   Created: ${match.created_at}`)
      console.log('---')
    })
    
    // Test 2: Get tournaments
    const { data: tournaments, error: tournamentsError } = await supabase
      .from('tournaments')
      .select('*')
    
    if (tournamentsError) {
      console.error('Error fetching tournaments:', tournamentsError)
      return
    }
    
    console.log(`✅ Found ${tournaments.length} tournaments`)
    
    // Test 3: Get players
    const { data: players, error: playersError } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'player')
    
    if (playersError) {
      console.error('Error fetching players:', playersError)
      return
    }
    
    console.log(`✅ Found ${players.length} players`)
    
  } catch (error) {
    console.error('Test failed:', error)
  }
}

testMatchesQuery()
