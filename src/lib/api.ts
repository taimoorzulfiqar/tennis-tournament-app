import { supabase } from './supabase'
import { User, Tournament, Match, LeaderboardEntry, CreateUserDTO, UpdateProfileDTO, UpdatePasswordDTO, CreateTournamentDTO, CreateMatchDTO, UpdateMatchScoreDTO } from '../types'

// Auth API
export const authAPI = {
  signUp: async (email: string, password: string, full_name: string, role: 'admin' | 'player'): Promise<User> => {
    console.log('API: Signing up user:', { email, full_name, role })
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) {
      console.error('API: Auth signup error:', authError)
      throw new Error(authError.message)
    }

    if (!authData.user) {
      throw new Error('No user data returned from signup')
    }

    console.log('API: Auth user created:', authData.user.id)

    // Create profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email,
        full_name,
        role,
      })
      .select()
      .single()

    if (profileError) {
      console.error('API: Profile creation error:', profileError)
      throw new Error(profileError.message)
    }

    console.log('API: Profile created:', profileData)
    return profileData
  },

  signIn: async (email: string, password: string): Promise<User> => {
    console.log('API: Signing in user:', email)
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('API: Sign in error:', error)
      throw new Error(error.message)
    }

    if (!data.user) {
      throw new Error('No user data returned from sign in')
    }

    console.log('API: Auth user signed in:', data.user.id)

    // Get profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (profileError) {
      console.error('API: Profile fetch error:', profileError)
      throw new Error(profileError.message)
    }

    console.log('API: Profile fetched:', profile)
    return profile
  },

  signOut: async (): Promise<void> => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      throw new Error(error.message)
    }
  },

  getCurrentUser: async (): Promise<User | null> => {
    console.log('API: Getting current user...')
    
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.error('API: Auth user fetch error:', authError)
      return null
    }

    if (!authUser) {
      console.log('API: No auth user found')
      return null
    }

    console.log('API: Auth user:', authUser)

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single()

    if (profileError) {
      console.error('API: Profile fetch error:', profileError)
      return null
    }

    console.log('API: Profile fetched:', profile)
    return profile
  },
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

    if (error) throw new Error(error.message)
    return data
  },

  getPlayers: async (): Promise<User[]> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'player')
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return data
  },

  createUser: async (userData: CreateUserDTO): Promise<User> => {
    console.log('API: Creating user:', userData)
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
    })

    if (authError) {
      console.error('API: Auth signup error:', authError)
      throw new Error(authError.message)
    }

    if (!authData.user) {
      throw new Error('No user data returned from signup')
    }

    console.log('API: Auth user created:', authData.user.id)

    // Create profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: userData.email,
        full_name: userData.full_name,
        role: userData.role,
      })
      .select()
      .single()

    if (profileError) {
      console.error('API: Profile creation error:', profileError)
      throw new Error(profileError.message)
    }

    console.log('API: Profile created:', profileData)
    return profileData
  },

  updateProfile: async (userId: string, updates: UpdateProfileDTO): Promise<User> => {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  },

  updatePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    // First verify current password
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No authenticated user')

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: currentPassword,
    })

    if (signInError) {
      throw new Error('Current password is incorrect')
    }

    // Update password
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) throw new Error(error.message)
  },

  deleteUser: async (userId: string): Promise<void> => {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (error) throw new Error(error.message)
  },
}
