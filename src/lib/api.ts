import { supabase } from './supabase'
import { User, Tournament, Match, LeaderboardEntry, CreateUserDTO, UpdateProfileDTO, CreateTournamentDTO, CreateMatchDTO, UpdateMatchScoreDTO } from '../types'

// Auth API
export const authAPI = {
  signUp: async (email: string, password: string, full_name: string, role: 'admin' | 'player'): Promise<User> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) throw error

    if (!data.user) throw new Error('Failed to create user')

    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: data.user.id,
        email,
        full_name,
        role,
        verification_status: role === 'admin' ? 'pending' : 'approved'
      })

    if (profileError) throw profileError

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
  getMatches: async (tournamentId?: string): Promise<Match[]> => {
    let query = supabase
      .from('matches')
      .select('*')
      .order('start_time', { ascending: true })

    if (tournamentId) {
      query = query.eq('tournament_id', tournamentId)
    }

    const { data, error } = await query
    if (error) throw new Error(error.message)
    return data
  },

  getMatch: async (id: string): Promise<Match> => {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw new Error(error.message)
    return data
  },

  createMatch: async (match: CreateMatchDTO): Promise<Match> => {
    const { data, error } = await supabase
      .from('matches')
      .insert({
        ...match,
        player1_score: 0,
        player2_score: 0,
        status: 'scheduled',
      })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  },

  updateMatchScore: async (id: string, score: UpdateMatchScoreDTO): Promise<Match> => {
    const winnerId = score.player1_score > score.player2_score 
      ? (await matchAPI.getMatch(id)).player1_id 
      : (await matchAPI.getMatch(id)).player2_id

    const { data, error } = await supabase
      .from('matches')
      .update({
        ...score,
        winner_id: winnerId,
        status: 'completed',
      })
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

    if (error) throw error

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

    if (profileError) throw profileError

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
      // Delete from profiles table directly
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
      
    } catch (error) {
      console.error('API: Delete user operation failed:', error)
      throw error
    }
  },
}
