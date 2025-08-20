import { supabase } from './supabase';
import { 
  User, 
  Tournament, 
  Match, 
  LeaderboardEntry,
  CreateTournamentData,
  CreateMatchData,
  UpdateMatchScoreData 
} from '@/types';

// Auth API
export const authAPI = {
  signUp: async (email: string, password: string, fullName: string, role: 'admin' | 'player') => {
    console.log('API: Starting sign up for:', email);
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.log('API: Sign up auth error:', error);
      throw error;
    }

    console.log('API: Auth user created:', data.user?.id);

    if (data.user) {
      console.log('API: Creating profile for user:', data.user.id);
      
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          email,
          full_name: fullName,
          role,
        });

      if (profileError) {
        console.log('API: Profile creation error:', profileError);
        // Don't throw error here, just log it
        // The profile can be created later via admin script
        console.log('API: Profile creation failed, but auth user was created');
      } else {
        console.log('API: Profile created successfully');
      }
    }

    console.log('API: Sign up completed');
    return data;
  },

  signIn: async (email: string, password: string) => {
    console.log('API: Attempting sign in for:', email);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.log('API: Sign in error:', error);
      throw error;
    }
    
    console.log('API: Sign in successful:', data);
    return data;
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  getCurrentUser: async (): Promise<User | null> => {
    console.log('API: Getting current user...');
    const { data: { user } } = await supabase.auth.getUser();
    
    console.log('API: Auth user:', user);
    
    if (!user) {
      console.log('API: No auth user found');
      return null;
    }

    console.log('API: Fetching profile for user ID:', user.id);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.log('API: Profile fetch error:', error);
      throw error;
    }
    
    console.log('API: Profile found:', data);
    return data;
  },
};

// Tournament API
export const tournamentAPI = {
  createTournament: async (tournamentData: CreateTournamentData): Promise<Tournament> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .insert({
        name: tournamentData.name,
        description: tournamentData.description,
        start_date: tournamentData.start_date,
        end_date: tournamentData.end_date,
        created_by: user.id,
      })
      .select()
      .single();

    if (tournamentError) throw tournamentError;

    // Add players to tournament
    if (tournamentData.players.length > 0) {
      const playerEntries = tournamentData.players.map(playerId => ({
        tournament_id: tournament.id,
        player_id: playerId,
      }));

      const { error: playersError } = await supabase
        .from('tournament_players')
        .insert(playerEntries);

      if (playersError) throw playersError;
    }

    return tournament;
  },

  getTournaments: async (): Promise<Tournament[]> => {
    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  getTournament: async (id: string): Promise<Tournament> => {
    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  getTournamentPlayers: async (tournamentId: string): Promise<User[]> => {
    const { data, error } = await supabase
      .from('tournament_players')
      .select(`
        player_id,
        profiles (*)
      `)
      .eq('tournament_id', tournamentId);

    if (error) throw error;
    return data.map(item => item.profiles);
  },
};

// Match API
export const matchAPI = {
  createMatch: async (matchData: CreateMatchData): Promise<Match> => {
    const { data, error } = await supabase
      .from('matches')
      .insert({
        tournament_id: matchData.tournament_id,
        player1_id: matchData.player1_id,
        player2_id: matchData.player2_id,
        court: matchData.court,
        scheduled_time: matchData.scheduled_time,
        player1_games_won: 0,
        player2_games_won: 0,
        status: 'scheduled',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  getMatches: async (tournamentId: string): Promise<Match[]> => {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('tournament_id', tournamentId)
      .order('scheduled_time', { ascending: true });

    if (error) throw error;
    return data;
  },

  updateMatchScore: async (matchId: string, scoreData: UpdateMatchScoreData): Promise<Match> => {
    const { player1_games_won, player2_games_won } = scoreData;
    
    // Determine winner (first to 6 games)
    let winner_id = null;
    let status: 'scheduled' | 'in_progress' | 'completed' = 'in_progress';
    
    if (player1_games_won >= 6 || player2_games_won >= 6) {
      status = 'completed';
      winner_id = player1_games_won >= 6 ? scoreData.player1_id : scoreData.player2_id;
    }

    const { data, error } = await supabase
      .from('matches')
      .update({
        player1_games_won,
        player2_games_won,
        winner_id,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', matchId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

// Leaderboard API
export const leaderboardAPI = {
  getLeaderboard: async (tournamentId: string): Promise<LeaderboardEntry[]> => {
    const { data, error } = await supabase.rpc('get_tournament_leaderboard', {
      tournament_id: tournamentId,
    });

    if (error) throw error;
    return data;
  },
};

// User API
export const userAPI = {
  getUsers: async (): Promise<User[]> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  getPlayers: async (): Promise<User[]> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .in('role', ['player', 'admin'])
      .order('full_name', { ascending: true });

    if (error) throw error;
    return data;
  },

  createUser: async (userData: { 
    email: string; 
    full_name: string; 
    password: string;
    role: 'admin' | 'player' 
  }): Promise<User> => {
    // First, create the auth user using signUp
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          full_name: userData.full_name,
          role: userData.role,
        }
      }
    });

    if (authError) {
      console.error('Auth creation error:', authError);
      throw new Error(authError.message);
    }

    if (!authData.user) {
      throw new Error('Failed to create auth user');
    }

    // Then create the profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: userData.email,
        full_name: userData.full_name,
        role: userData.role,
      })
      .select()
      .single();

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // If profile creation fails, we should clean up the auth user
      // But we can't do that from client side, so we'll just throw the error
      throw new Error(profileError.message);
    }

    return profileData;
  },

  updateProfile: async (userId: string, updates: Partial<User>): Promise<User> => {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  updatePassword: async (passwordData: {
    currentPassword: string;
    newPassword: string;
  }): Promise<void> => {
    // First, verify the current password by attempting to sign in
    const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
      email: (await supabase.auth.getUser()).data.user?.email || '',
      password: passwordData.currentPassword,
    });

    if (signInError) {
      throw new Error('Current password is incorrect');
    }

    if (!user) {
      throw new Error('User not found');
    }

    // Update the password
    const { error: updateError } = await supabase.auth.updateUser({
      password: passwordData.newPassword,
    });

    if (updateError) {
      throw new Error(updateError.message);
    }
  },
};
