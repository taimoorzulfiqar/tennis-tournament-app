export interface User {
  id: string
  email: string
  full_name: string | null
  role: 'master' | 'admin' | 'player'
  verification_status: 'pending' | 'approved' | 'rejected'
  created_at: string
  updated_at: string
}

export interface Tournament {
  id: string
  name: string
  description: string | null
  start_date: string
  end_date: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface Match {
  id: string
  tournament_id: string
  player1_id: string
  player2_id: string
  start_time: string
  court: string
  player1_score: number
  player2_score: number
  status: 'scheduled' | 'in_progress' | 'completed'
  created_at: string
  updated_at: string
}

export interface LeaderboardEntry {
  player_id: string
  player_name: string
  games_won: number
  rank: number
}

// Data transfer objects
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
  player1_id: string
  player2_id: string
  start_time: string
  court: string
}

export interface UpdateMatchScoreDTO {
  player1_score: number
  player2_score: number
}
