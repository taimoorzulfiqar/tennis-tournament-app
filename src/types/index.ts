export interface User {
  id: string
  email: string
  full_name: string
  phone?: string
  role: 'master' | 'admin' | 'player'
  verification_status: 'pending' | 'approved' | 'rejected'
  created_at: string
  updated_at: string
}

export interface Tournament {
  id: string
  name: string
  description?: string
  start_date: string
  end_date?: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface Match {
  id: string
  tournament_id: string
  player1_id?: string
  player2_id?: string
  player1_name?: string
  player2_name?: string
  court?: string
  player1_score: number
  player2_score: number
  winner_id?: string
  status: 'scheduled' | 'in_progress' | 'completed'
  detailed_score?: {
    player1_sets: (number | null)[]
    player2_sets: (number | null)[]
  }
  created_at: string
  updated_at: string
}

export interface LeaderboardEntry {
  player_id: string
  player_name: string
  games_won: number
  matches_played: number
  rank: number
}

export interface CreateUserDTO {
  email: string
  password: string
  full_name: string
  role: 'admin' | 'player'
}

export interface UpdateProfileDTO {
  full_name?: string
  phone?: string
}

export interface UpdateVerificationStatusDTO {
  verification_status: 'pending' | 'approved' | 'rejected'
}

export interface CreateTournamentDTO {
  name: string
  description?: string
  start_date: string
  end_date?: string
}

export interface CreateMatchDTO {
  tournament_id: string
  player1_id?: string
  player2_id?: string
  player1_name?: string
  player2_name?: string
  court?: string
  player1_score?: number
  player2_score?: number
}

export interface UpdateMatchScoreDTO {
  player1_score: number
  player2_score: number
}
