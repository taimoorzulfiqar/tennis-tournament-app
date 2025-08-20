import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTournaments } from '@/hooks/useTournaments';
import { LeaderboardEntry } from '@/types';
import { theme } from '@/lib/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LeaderboardScreen() {
  const { tournaments } = useTournaments();
  const [selectedTournament, setSelectedTournament] = useState<string | null>(
    tournaments[0]?.id || null
  );
  const insets = useSafeAreaInsets();

  const { leaderboard, isLoading } = useTournaments();

  const renderLeaderboardItem = ({ item, index }: { item: LeaderboardEntry; index: number }) => (
    <View style={styles.leaderboardItem}>
      <View style={styles.rankContainer}>
        <Text style={styles.rankText}>{index + 1}</Text>
        {index < 3 && (
          <Ionicons
            name="trophy"
            size={20}
            color={index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32'}
          />
        )}
      </View>
      
      <View style={styles.playerInfo}>
        <Text style={styles.playerName}>{item.player_name}</Text>
        <Text style={styles.playerStats}>
          {item.matches_played} matches • {item.wins}W {item.losses}L
        </Text>
      </View>
      
      <View style={styles.scoreContainer}>
        <Text style={styles.gamesWon}>{item.total_games_won}</Text>
        <Text style={styles.gamesLabel}>games</Text>
      </View>
    </View>
  );

  const renderTournamentSelector = () => (
    <View style={styles.tournamentSelector}>
      <Text style={styles.selectorTitle}>Select Tournament:</Text>
      <FlatList
        horizontal
        data={tournaments}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.tournamentButton,
              selectedTournament === item.id && styles.tournamentButtonActive,
            ]}
            onPress={() => setSelectedTournament(item.id)}
          >
            <Text
              style={[
                styles.tournamentButtonText,
                selectedTournament === item.id && styles.tournamentButtonTextActive,
              ]}
            >
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tournamentList}
      />
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <View style={styles.loadingIcon}>
            <Ionicons name="trophy" size={48} color={theme.colors.primary} />
          </View>
          <Text style={styles.loadingText}>Loading leaderboard...</Text>
        </View>
      </View>
    );
  }

  if (tournaments.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIcon}>
          <Ionicons name="trophy-outline" size={64} color={theme.colors.gray[400]} />
        </View>
        <Text style={styles.emptyTitle}>No Tournaments Available</Text>
        <Text style={styles.emptySubtitle}>
          Create a tournament to see the leaderboard
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderTournamentSelector()}
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Leaderboard</Text>
        <Text style={styles.headerSubtitle}>Ranked by games won</Text>
      </View>

      <FlatList
        data={leaderboard}
        renderItem={renderLeaderboardItem}
        keyExtractor={(item) => item.player_id}
        contentContainerStyle={[
          styles.listContainer,
          { 
            paddingBottom: Platform.OS === 'android' 
              ? 80 + Math.max(insets.bottom, 12) 
              : 60 + insets.bottom 
          }
        ]}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Ionicons name="people-outline" size={64} color={theme.colors.gray[400]} />
            </View>
            <Text style={styles.emptyTitle}>No Players Yet</Text>
            <Text style={styles.emptySubtitle}>
              Add players to this tournament to see the leaderboard
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingIcon: {
    marginBottom: theme.spacing.lg,
  },
  loadingText: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.gray[600],
  },
  tournamentSelector: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[200],
  },
  selectorTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing.md,
    color: theme.colors.black,
  },
  tournamentList: {
    paddingHorizontal: theme.spacing.xs,
  },
  tournamentButton: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    marginRight: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    borderWidth: 2,
    borderColor: theme.colors.gray[200],
    backgroundColor: theme.colors.surface,
  },
  tournamentButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  tournamentButtonText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.gray[600],
    fontWeight: theme.typography.fontWeight.medium,
  },
  tournamentButtonTextActive: {
    color: theme.colors.white,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  header: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[200],
  },
  headerTitle: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.black,
  },
  headerSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.gray[600],
    marginTop: theme.spacing.xs,
  },
  listContainer: {
    padding: theme.spacing.lg,
  },
  leaderboardItem: {
    backgroundColor: theme.colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.md,
  },
  rankContainer: {
    width: 48,
    alignItems: 'center',
    marginRight: theme.spacing.lg,
  },
  rankText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.black,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.black,
    marginBottom: theme.spacing.xs,
  },
  playerStats: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.gray[600],
  },
  scoreContainer: {
    alignItems: 'center',
  },
  gamesWon: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  gamesLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.gray[600],
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing['3xl'],
  },
  emptyIcon: {
    marginBottom: theme.spacing.lg,
  },
  emptyTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.gray[700],
    marginBottom: theme.spacing.sm,
  },
  emptySubtitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.gray[600],
    textAlign: 'center',
  },
});
