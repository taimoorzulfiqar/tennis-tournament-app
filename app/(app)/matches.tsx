import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useTournaments } from '@/hooks/useTournaments';
import { useUsers } from '@/hooks/useUsers';
import { Match, User } from '@/types';

export default function MatchesScreen() {
  const { user } = useAuth();
  const { tournaments } = useTournaments();
  const { players } = useUsers();
  const [selectedTournament, setSelectedTournament] = useState<string | null>(
    tournaments[0]?.id || null
  );
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [player1Id, setPlayer1Id] = useState('');
  const [player2Id, setPlayer2Id] = useState('');
  const [court, setCourt] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [player1Games, setPlayer1Games] = useState('');
  const [player2Games, setPlayer2Games] = useState('');

  const { matches, isLoading, createMatch, updateMatchScore, isCreatingMatch, isUpdatingScore } = useTournaments();

  const handleCreateMatch = async () => {
    if (!player1Id || !player2Id || !court || !scheduledTime) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (player1Id === player2Id) {
      Alert.alert('Error', 'Please select different players');
      return;
    }

    try {
      await createMatch({
        tournament_id: selectedTournament!,
        player1_id: player1Id,
        player2_id: player2Id,
        court,
        scheduled_time: scheduledTime,
      });

      setShowCreateModal(false);
      setPlayer1Id('');
      setPlayer2Id('');
      setCourt('');
      setScheduledTime('');
      Alert.alert('Success', 'Match created successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleUpdateScore = async () => {
    if (!player1Games || !player2Games) {
      Alert.alert('Error', 'Please enter scores for both players');
      return;
    }

    const p1Games = parseInt(player1Games);
    const p2Games = parseInt(player2Games);

    if (isNaN(p1Games) || isNaN(p2Games)) {
      Alert.alert('Error', 'Please enter valid numbers');
      return;
    }

    try {
      await updateMatchScore({
        matchId: selectedMatch!.id,
        scoreData: {
          player1_games_won: p1Games,
          player2_games_won: p2Games,
        },
      });

      setShowScoreModal(false);
      setSelectedMatch(null);
      setPlayer1Games('');
      setPlayer2Games('');
      Alert.alert('Success', 'Score updated successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const getPlayerName = (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    return player?.full_name || 'Unknown Player';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#27ae60';
      case 'in_progress':
        return '#f39c12';
      default:
        return '#7f8c8d';
    }
  };

  const renderMatch = ({ item }: { item: Match }) => (
    <View style={styles.matchCard}>
      <View style={styles.matchHeader}>
        <Text style={styles.matchTime}>
          {new Date(item.scheduled_time).toLocaleString()}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status.replace('_', ' ')}</Text>
        </View>
      </View>

      <View style={styles.playersContainer}>
        <View style={styles.playerContainer}>
          <Text style={styles.playerName}>{getPlayerName(item.player1_id)}</Text>
          <Text style={styles.playerScore}>{item.player1_games_won}</Text>
        </View>
        
        <Text style={styles.vsText}>vs</Text>
        
        <View style={styles.playerContainer}>
          <Text style={styles.playerName}>{getPlayerName(item.player2_id)}</Text>
          <Text style={styles.playerScore}>{item.player2_games_won}</Text>
        </View>
      </View>

      <View style={styles.matchDetails}>
        <Text style={styles.courtText}>Court: {item.court}</Text>
        {item.winner_id && (
          <Text style={styles.winnerText}>
            Winner: {getPlayerName(item.winner_id)}
          </Text>
        )}
      </View>

      {(user?.role === 'admin' || user?.role === 'master') && item.status !== 'completed' && (
        <TouchableOpacity
          style={styles.updateScoreButton}
          onPress={() => {
            setSelectedMatch(item);
            setPlayer1Games(item.player1_games_won.toString());
            setPlayer2Games(item.player2_games_won.toString());
            setShowScoreModal(true);
          }}
        >
          <Text style={styles.updateScoreButtonText}>Update Score</Text>
        </TouchableOpacity>
      )}
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
      <View style={styles.centerContainer}>
        <Text>Loading matches...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderTournamentSelector()}
      
      {(user?.role === 'admin' || user?.role === 'master') && selectedTournament && (
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Ionicons name="add" size={24} color="white" />
          <Text style={styles.createButtonText}>Create Match</Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={matches}
        renderItem={renderMatch}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No matches found</Text>
          </View>
        }
      />

      {/* Create Match Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create Match</Text>
            <TouchableOpacity
              onPress={() => setShowCreateModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.sectionTitle}>Player 1</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {players.map((player) => (
                <TouchableOpacity
                  key={player.id}
                  style={[
                    styles.playerOption,
                    player1Id === player.id && styles.playerOptionSelected,
                  ]}
                  onPress={() => setPlayer1Id(player.id)}
                >
                  <Text style={styles.playerOptionText}>{player.full_name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.sectionTitle}>Player 2</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {players.map((player) => (
                <TouchableOpacity
                  key={player.id}
                  style={[
                    styles.playerOption,
                    player2Id === player.id && styles.playerOptionSelected,
                  ]}
                  onPress={() => setPlayer2Id(player.id)}
                >
                  <Text style={styles.playerOptionText}>{player.full_name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TextInput
              style={styles.input}
              placeholder="Court"
              value={court}
              onChangeText={setCourt}
            />

            <TextInput
              style={styles.input}
              placeholder="Scheduled Time (YYYY-MM-DD HH:MM)"
              value={scheduledTime}
              onChangeText={setScheduledTime}
            />

            <TouchableOpacity
              style={[styles.createButton, isCreatingMatch && styles.buttonDisabled]}
              onPress={handleCreateMatch}
              disabled={isCreatingMatch}
            >
              <Text style={styles.createButtonText}>
                {isCreatingMatch ? 'Creating...' : 'Create Match'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Update Score Modal */}
      <Modal
        visible={showScoreModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Update Score</Text>
            <TouchableOpacity
              onPress={() => setShowScoreModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.scoreContainer}>
              <View style={styles.scoreInput}>
                <Text style={styles.scoreLabel}>{getPlayerName(selectedMatch?.player1_id || '')}</Text>
                <TextInput
                  style={styles.scoreInputField}
                  placeholder="Games"
                  value={player1Games}
                  onChangeText={setPlayer1Games}
                  keyboardType="numeric"
                />
              </View>
              
              <Text style={styles.vsText}>vs</Text>
              
              <View style={styles.scoreInput}>
                <Text style={styles.scoreLabel}>{getPlayerName(selectedMatch?.player2_id || '')}</Text>
                <TextInput
                  style={styles.scoreInputField}
                  placeholder="Games"
                  value={player2Games}
                  onChangeText={setPlayer2Games}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.createButton, isUpdatingScore && styles.buttonDisabled]}
              onPress={handleUpdateScore}
              disabled={isUpdatingScore}
            >
              <Text style={styles.createButtonText}>
                {isUpdatingScore ? 'Updating...' : 'Update Score'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tournamentSelector: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  selectorTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#2c3e50',
  },
  tournamentList: {
    paddingHorizontal: 4,
  },
  tournamentButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  tournamentButtonActive: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  tournamentButtonText: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  tournamentButtonTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  createButton: {
    backgroundColor: '#3498db',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    margin: 16,
    borderRadius: 8,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  listContainer: {
    padding: 16,
  },
  matchCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  matchTime: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  playersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  playerContainer: {
    flex: 1,
    alignItems: 'center',
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  playerScore: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3498db',
  },
  vsText: {
    fontSize: 16,
    color: '#7f8c8d',
    marginHorizontal: 16,
  },
  matchDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  courtText: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  winnerText: {
    fontSize: 14,
    color: '#27ae60',
    fontWeight: '600',
  },
  updateScoreButton: {
    backgroundColor: '#f39c12',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 12,
  },
  updateScoreButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#2c3e50',
  },
  playerOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  playerOptionSelected: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  playerOptionText: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  scoreInput: {
    flex: 1,
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#2c3e50',
  },
  scoreInputField: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    textAlign: 'center',
    width: 80,
  },
  buttonDisabled: {
    backgroundColor: '#bdc3c7',
  },
});
