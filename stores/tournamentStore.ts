import { create } from 'zustand';
import { Tournament, Match, LeaderboardEntry } from '@/types';

interface TournamentState {
  currentTournament: Tournament | null;
  tournaments: Tournament[];
  matches: Match[];
  leaderboard: LeaderboardEntry[];
  setCurrentTournament: (tournament: Tournament | null) => void;
  setTournaments: (tournaments: Tournament[]) => void;
  setMatches: (matches: Match[]) => void;
  setLeaderboard: (leaderboard: LeaderboardEntry[]) => void;
  addTournament: (tournament: Tournament) => void;
  addMatch: (match: Match) => void;
  updateMatch: (matchId: string, updates: Partial<Match>) => void;
}

export const useTournamentStore = create<TournamentState>((set) => ({
  currentTournament: null,
  tournaments: [],
  matches: [],
  leaderboard: [],
  setCurrentTournament: (tournament) => set({ currentTournament: tournament }),
  setTournaments: (tournaments) => set({ tournaments }),
  setMatches: (matches) => set({ matches }),
  setLeaderboard: (leaderboard) => set({ leaderboard }),
  addTournament: (tournament) => 
    set((state) => ({ tournaments: [...state.tournaments, tournament] })),
  addMatch: (match) => 
    set((state) => ({ matches: [...state.matches, match] })),
  updateMatch: (matchId, updates) =>
    set((state) => ({
      matches: state.matches.map((match) =>
        match.id === matchId ? { ...match, ...updates } : match
      ),
    })),
}));
