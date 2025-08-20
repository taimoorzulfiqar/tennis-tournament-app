import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tournamentAPI, matchAPI, leaderboardAPI } from '@/lib/api';
import { CreateTournamentData, CreateMatchData, UpdateMatchScoreData } from '@/types';

export const useTournaments = () => {
  const queryClient = useQueryClient();

  const { data: tournaments = [], isLoading } = useQuery({
    queryKey: ['tournaments'],
    queryFn: tournamentAPI.getTournaments,
  });

  const createTournamentMutation = useMutation({
    mutationFn: tournamentAPI.createTournament,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
    },
  });

  return {
    tournaments,
    isLoading,
    createTournament: createTournamentMutation.mutate,
    isCreating: createTournamentMutation.isPending,
  };
};

export const useTournament = (tournamentId: string) => {
  const queryClient = useQueryClient();

  const { data: tournament, isLoading } = useQuery({
    queryKey: ['tournament', tournamentId],
    queryFn: () => tournamentAPI.getTournament(tournamentId),
    enabled: !!tournamentId,
  });

  const { data: players = [], isLoading: playersLoading } = useQuery({
    queryKey: ['tournament', tournamentId, 'players'],
    queryFn: () => tournamentAPI.getTournamentPlayers(tournamentId),
    enabled: !!tournamentId,
  });

  const { data: matches = [], isLoading: matchesLoading } = useQuery({
    queryKey: ['tournament', tournamentId, 'matches'],
    queryFn: () => matchAPI.getMatches(tournamentId),
    enabled: !!tournamentId,
  });

  const { data: leaderboard = [], isLoading: leaderboardLoading } = useQuery({
    queryKey: ['tournament', tournamentId, 'leaderboard'],
    queryFn: () => leaderboardAPI.getLeaderboard(tournamentId),
    enabled: !!tournamentId,
  });

  const createMatchMutation = useMutation({
    mutationFn: matchAPI.createMatch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId, 'matches'] });
    },
  });

  const updateMatchScoreMutation = useMutation({
    mutationFn: ({ matchId, scoreData }: { matchId: string; scoreData: UpdateMatchScoreData }) =>
      matchAPI.updateMatchScore(matchId, scoreData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId, 'matches'] });
      queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId, 'leaderboard'] });
    },
  });

  return {
    tournament,
    players,
    matches,
    leaderboard,
    isLoading: isLoading || playersLoading || matchesLoading || leaderboardLoading,
    createMatch: createMatchMutation.mutate,
    updateMatchScore: updateMatchScoreMutation.mutate,
    isCreatingMatch: createMatchMutation.isPending,
    isUpdatingScore: updateMatchScoreMutation.isPending,
  };
};
