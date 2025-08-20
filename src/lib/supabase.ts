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
          court: string
          start_time: string
          player1_score: number
          player2_score: number
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
          court: string
          start_time: string
          player1_score?: number
          player2_score?: number
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
          court?: string
          start_time?: string
          player1_score?: number
          player2_score?: number
          winner_id?: string | null
          status?: 'scheduled' | 'in_progress' | 'completed'
          created_at?: string
          updated_at?: string
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
    }
  }
}
