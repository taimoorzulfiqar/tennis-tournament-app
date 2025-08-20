import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: 'master' | 'admin' | 'player'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role: 'master' | 'admin' | 'player'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: 'master' | 'admin' | 'player'
          created_at?: string
          updated_at?: string
        }
      }
      tournaments: {
        Row: {
          id: string
          name: string
          description: string | null
          start_date: string
          end_date: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          start_date: string
          end_date?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          start_date?: string
          end_date?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      tournament_players: {
        Row: {
          id: string
          tournament_id: string
          player_id: string
          created_at: string
        }
        Insert: {
          id?: string
          tournament_id: string
          player_id: string
          created_at?: string
        }
        Update: {
          id?: string
          tournament_id?: string
          player_id?: string
          created_at?: string
        }
      }
      matches: {
        Row: {
          id: string
          tournament_id: string
          player1_id: string
          player2_id: string
          court: string | null
          games_per_set: number
          sets_per_match: number
          winner_id: string | null
          status: 'scheduled' | 'in_progress' | 'completed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tournament_id: string
          player1_id: string
          player2_id: string
          court?: string | null
          games_per_set?: number
          sets_per_match?: number
          winner_id?: string | null
          status?: 'scheduled' | 'in_progress' | 'completed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tournament_id?: string
          player1_id?: string
          player2_id?: string
          court?: string | null
          games_per_set?: number
          sets_per_match?: number
          winner_id?: string | null
          status?: 'scheduled' | 'in_progress' | 'completed'
          created_at?: string
          updated_at?: string
        }
      }
      match_sets: {
        Row: {
          id: string
          match_id: string
          set_number: number
          player1_games: number
          player2_games: number
          winner_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          match_id: string
          set_number: number
          player1_games?: number
          player2_games?: number
          winner_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          match_id?: string
          set_number?: number
          player1_games?: number
          player2_games?: number
          winner_id?: string | null
          created_at?: string
        }
      }
    }
    Functions: {
      get_tournament_leaderboard: {
        Args: {
          tournament_id: string
        }
        Returns: {
          player_id: string
          player_name: string
          games_won: number
          matches_played: number
          rank: number
        }[]
      }
      determine_match_winner: {
        Args: {
          match_uuid: string
        }
        Returns: string | null
      }
    }
  }
}
