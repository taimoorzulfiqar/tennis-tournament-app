export interface User {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: 'master' | 'admin' | 'player';
  created_at: string;
  updated_at: string;
}

export interface Tournament {
  id: string;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Match {
  id: string;
  tournament_id: string;
  player1_id: string;
  player2_id: string;
  court: string;
  scheduled_time: string;
  player1_games_won: number;
  player2_games_won: number;
  winner_id: string | null;
  status: 'scheduled' | 'in_progress' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface TournamentPlayer {
  id: string;
  tournament_id: string;
  player_id: string;
  created_at: string;
}

export interface LeaderboardEntry {
  player_id: string;
  player_name: string;
  total_games_won: number;
  matches_played: number;
  wins: number;
  losses: number;
}

export interface CreateTournamentData {
  name: string;
  description?: string;
  start_date: string;
  end_date?: string;
  players: string[];
}

export interface CreateMatchData {
  tournament_id: string;
  player1_id: string;
  player2_id: string;
  court: string;
  scheduled_time: string;
}

export interface UpdateMatchScoreData {
  match_id: string;
  player1_games_won: number;
  player2_games_won: number;
}
