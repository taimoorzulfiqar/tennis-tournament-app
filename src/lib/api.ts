import { supabase } from './supabase'
import { User, Tournament, Match, MatchSet, MatchWithSets, LeaderboardEntry, CreateUserDTO, UpdateProfileDTO, CreateTournamentDTO, CreateMatchDTO, UpdateMatchScoreDTO, UpdateMatchSetsDTO } from '../types'

// Auth API
export const authAPI = {
  signUp: async (email: string, password: string, full_name: string, role: 'admin' | 'player'): Promise<User> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      // Provide user-friendly error messages
      if (error.message.includes('already registered') || error.message.includes('already been registered')) {
        throw new Error('An account with this email address already exists. Please try signing in instead.')
      } else if (error.message.includes('password')) {
        throw new Error('Password must be at least 6 characters long.')
      } else if (error.message.includes('email')) {
        throw new Error('Please enter a valid email address.')
      } else {
        throw new Error(`Sign up failed: ${error.message}`)
      }
    }

    if (!data.user) throw new Error('Failed to create user')

    // Create profile with proper error handling
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: data.user.id,
        email,
        full_name,
        role,
        verification_status: role === 'admin' ? 'pending' : 'approved'
      })

    if (profileError) {
      console.error('Profile creation error:', profileError)
      // If profile creation fails, we should clean up the auth user
      // However, this requires admin privileges, so we'll just throw the error
      if (profileError.message.includes('duplicate key') || profileError.message.includes('already exists')) {
        throw new Error('An account with this email address already exists. Please try signing in instead.')
      } else {
        throw new Error(`Failed to create profile: ${profileError.message}`)
      }
    }

    return {
      id: data.user.id,
      email,
      full_name,
      role,
      verification_status: role === 'admin' ? 'pending' : 'approved',
      created_at: data.user.created_at,
      updated_at: data.user.updated_at
    }
  },

  signIn: async (email: string, password: string): Promise<User> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error

    if (!data.user) throw new Error('Failed to sign in')

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (profileError) throw profileError

    return profile
  },

  signOut: async (): Promise<void> => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  getCurrentUser: async (): Promise<User | null> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) throw error
    return profile
  }
}

// Tournament API
export const tournamentAPI = {
  getTournaments: async (): Promise<Tournament[]> => {
    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return data
  },

  getTournament: async (id: string): Promise<Tournament> => {
    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw new Error(error.message)
    return data
  },

  createTournament: async (tournament: CreateTournamentDTO, createdBy: string): Promise<Tournament> => {
    const { data, error } = await supabase
      .from('tournaments')
      .insert({
        ...tournament,
        created_by: createdBy,
      })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  },

  updateTournament: async (id: string, updates: Partial<Tournament>): Promise<Tournament> => {
    const { data, error } = await supabase
      .from('tournaments')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  },

  deleteTournament: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('tournaments')
      .delete()
      .eq('id', id)

    if (error) throw new Error(error.message)
  },

  addPlayerToTournament: async (tournamentId: string, playerId: string): Promise<void> => {
    const { error } = await supabase
      .from('tournament_players')
      .insert({
        tournament_id: tournamentId,
        player_id: playerId,
      })

    if (error) throw new Error(error.message)
  },

  removePlayerFromTournament: async (tournamentId: string, playerId: string): Promise<void> => {
    const { error } = await supabase
      .from('tournament_players')
      .delete()
      .eq('tournament_id', tournamentId)
      .eq('player_id', playerId)

    if (error) throw new Error(error.message)
  },

  getTournamentPlayers: async (tournamentId: string): Promise<User[]> => {
    const { data, error } = await supabase
      .from('tournament_players')
      .select(`
        player_id,
        profiles (*)
      `)
      .eq('tournament_id', tournamentId)

    if (error) throw new Error(error.message)
    return data.map((item: any) => item.profiles)
  },
}

// Match API
export const matchAPI = {
  getMatches: async (tournamentId?: string): Promise<MatchWithSets[]> => {
    let query = supabase
      .from('matches')
      .select(`
        *,
        match_sets (*)
      `)
      .order('created_at', { ascending: true })

    if (tournamentId) {
      query = query.eq('tournament_id', tournamentId)
    }

    const { data, error } = await query
    if (error) throw new Error(error.message)
    
    // Transform the data to match our interface
    return data.map((match: any) => ({
      ...match,
      sets: match.match_sets || []
    }))
  },

  getMatch: async (id: string): Promise<MatchWithSets> => {
    const { data, error } = await supabase
      .from('matches')
      .select(`
        *,
        match_sets (*)
      `)
      .eq('id', id)
      .single()

    if (error) throw new Error(error.message)
    
    return {
      ...data,
      sets: data.match_sets || []
    }
  },

  createMatch: async (match: CreateMatchDTO): Promise<MatchWithSets> => {
    // Prepare match data with defaults for missing columns
    const matchData = {
      tournament_id: match.tournament_id,
      player1_id: match.player1_id,
      player2_id: match.player2_id,
      court: match.court,
      player1_score: match.player1_score || 0,
      player2_score: match.player2_score || 0,
      games_per_set: match.games_per_set || 6,
      sets_per_match: match.sets_per_match || 3,
      status: 'scheduled'
    }
    
    const { data, error } = await supabase
      .from('matches')
      .insert(matchData)
      .select()
      .single()

    if (error) throw new Error(error.message)
    
    return {
      ...data,
      sets: []
    }
  },

  updateMatchSets: async (id: string, setsData: UpdateMatchSetsDTO): Promise<MatchWithSets> => {
    console.log('updateMatchSets called with:', { id, setsData })
    
    // First, delete existing sets for this match
    const { error: deleteError } = await supabase
      .from('match_sets')
      .delete()
      .eq('match_id', id)
    
    if (deleteError) {
      console.error('Error deleting existing sets:', deleteError)
      throw new Error(deleteError.message)
    }
    
    // Insert new sets
    if (setsData.sets.length > 0) {
      const setsToInsert = setsData.sets.map(set => ({
        match_id: id,
        set_number: set.set_number,
        player1_games: set.player1_games,
        player2_games: set.player2_games
      }))
      
      const { error: insertError } = await supabase
        .from('match_sets')
        .insert(setsToInsert)
      
      if (insertError) {
        console.error('Error inserting sets:', insertError)
        throw new Error(insertError.message)
      }
    }
    
    // Update match status to completed
    const { data, error } = await supabase
      .from('matches')
      .update({ status: 'completed' })
      .eq('id', id)
      .select(`
        *,
        match_sets (*)
      `)
      .single()

    if (error) {
      console.error('Error updating match:', error)
      throw new Error(error.message)
    }
    
    console.log('Match sets updated successfully:', data)
    return {
      ...data,
      sets: data.match_sets || []
    }
  },

  updateMatchScore: async (id: string, score: UpdateMatchScoreDTO): Promise<Match> => {
    console.log('updateMatchScore called with:', { id, score })
    const match = await matchAPI.getMatch(id)
    console.log('Retrieved match:', match)
    let winnerId = null
    
    // Set winner based on scores
    if (score.player1_score > score.player2_score) {
      winnerId = match.player1_id
    } else if (score.player2_score > score.player1_score) {
      winnerId = match.player2_id
    } else {
      // If scores are equal, default to player1 (or you could set to null)
      winnerId = match.player1_id
    }
    console.log('Winner determined:', winnerId, 'Player1 score:', score.player1_score, 'Player2 score:', score.player2_score)

    const updateData = {
      ...score,
      winner_id: winnerId,
      status: 'completed',
    }
    console.log('Updating match with data:', updateData)

    const { data, error } = await supabase
      .from('matches')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating match:', error)
      throw new Error(error.message)
    }
    
    console.log('Match updated successfully:', data)
    return data
  },

  updateMatch: async (id: string, updates: {
    player1_id: string
    player2_id: string
    games_per_set?: number
    sets_per_match?: number
    court?: string
    player1_score: number
    player2_score: number
  }): Promise<Match> => {
    // Filter out undefined values to avoid SQL errors
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    )
    
    const { data, error } = await supabase
      .from('matches')
      .update(cleanUpdates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  },

  updateMatchStatus: async (id: string, status: 'scheduled' | 'in_progress' | 'completed'): Promise<Match> => {
    const { data, error } = await supabase
      .from('matches')
      .update({ status })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  },

  deleteMatch: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('matches')
      .delete()
      .eq('id', id)

    if (error) throw new Error(error.message)
  },
}

// Leaderboard API
export const leaderboardAPI = {
  getLeaderboard: async (tournamentId: string): Promise<LeaderboardEntry[]> => {
    const { data, error } = await supabase
      .rpc('get_tournament_leaderboard', { tournament_id: tournamentId })

    if (error) throw new Error(error.message)
    return data
  },
}

// User API
export const userAPI = {
  getUsers: async (): Promise<User[]> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  createUser: async (userData: CreateUserDTO): Promise<User> => {
    // Create auth user
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
    })

    if (error) {
      // Provide user-friendly error messages
      if (error.message.includes('already registered') || error.message.includes('already been registered')) {
        throw new Error('An account with this email address already exists.')
      } else if (error.message.includes('password')) {
        throw new Error('Password must be at least 6 characters long.')
      } else if (error.message.includes('email')) {
        throw new Error('Please enter a valid email address.')
      } else {
        throw new Error(`Failed to create user: ${error.message}`)
      }
    }

    if (!data.user) throw new Error('Failed to create user')

    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: data.user.id,
        email: userData.email,
        full_name: userData.full_name,
        role: userData.role,
        verification_status: userData.role === 'admin' ? 'pending' : 'approved'
      })

    if (profileError) {
      if (profileError.message.includes('duplicate key') || profileError.message.includes('already exists')) {
        throw new Error('An account with this email address already exists.')
      } else {
        throw new Error(`Failed to create profile: ${profileError.message}`)
      }
    }

    return {
      id: data.user.id,
      email: userData.email,
      full_name: userData.full_name,
      role: userData.role,
      verification_status: userData.role === 'admin' ? 'pending' : 'approved',
      created_at: data.user.created_at,
      updated_at: data.user.updated_at
    }
  },

  updateProfile: async (userId: string, updates: UpdateProfileDTO): Promise<User> => {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  updateVerificationStatus: async (userId: string, updates: { verification_status: 'pending' | 'approved' | 'rejected' }): Promise<User> => {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  deleteUser: async (userId: string): Promise<void> => {
    console.log('API: Deleting user:', userId)
    
    try {
      // Delete from profiles table
      console.log('API: Deleting from profiles table...')
      const { error: deleteProfileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)

      if (deleteProfileError) {
        console.error('API: Error deleting profile:', deleteProfileError)
        throw new Error(deleteProfileError.message)
      }

      console.log('API: Profile deleted successfully from database')
      
      // Note: Auth user deletion requires service role key and admin privileges
      // The profile deletion prevents the user from accessing the app
      // The auth user will remain in Supabase but cannot log in
      console.log('API: User profile deleted. Auth user remains but cannot access the app.')
      
    } catch (error) {
      console.error('API: Delete user operation failed:', error)
      throw error
    }
  },
}
