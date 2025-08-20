import React, { useState } from 'react'
import Layout from '../components/Layout'
import { useQuery } from '@tanstack/react-query'
import { leaderboardAPI, tournamentAPI, matchAPI, userAPI } from '../lib/api'

const Leaderboard: React.FC = () => {
  const [selectedTournament, setSelectedTournament] = useState<string>('')

  // Fetch tournaments
  const { data: tournaments, isLoading: tournamentsLoading } = useQuery({
    queryKey: ['tournaments'],
    queryFn: () => tournamentAPI.getTournaments(),
  })

  // Fetch matches for all tournaments
  const { data: allMatches, isLoading: matchesLoading } = useQuery({
    queryKey: ['matches'],
    queryFn: () => matchAPI.getMatches(),
  })

  // Fetch players
  const { data: players, isLoading: playersLoading } = useQuery({
    queryKey: ['players'],
    queryFn: async () => {
      const allUsers = await userAPI.getUsers()
      return allUsers.filter(u => u.role === 'player')
    },
  })

  const getPlayerName = (playerId: string) => {
    const player = players?.find(p => p.id === playerId)
    return player?.full_name || player?.email || 'Unknown Player'
  }

  // Calculate leaderboard based on games won
  const calculateLeaderboard = () => {
    if (!allMatches || !players) return []

    console.log('Leaderboard Debug - All matches:', allMatches)
    console.log('Leaderboard Debug - Players:', players)

    const playerStats: { [key: string]: { gamesWon: number, matchesPlayed: number } } = {}

    // Initialize player stats
    players.forEach(player => {
      playerStats[player.id] = { gamesWon: 0, matchesPlayed: 0 }
    })

    // Calculate games won from matches that have scores recorded
    allMatches.forEach(match => {
      console.log(`Leaderboard Debug - Match ${match.id}: status=${match.status}, player1_score=${match.player1_score}, player2_score=${match.player2_score}`)
      
      // Include matches that have scores recorded (not just completed ones)
      if (match.player1_score > 0 || match.player2_score > 0) {
        // Add games won by each player
        if (playerStats[match.player1_id]) {
          playerStats[match.player1_id].gamesWon += match.player1_score
          playerStats[match.player1_id].matchesPlayed += 1
        }
        if (playerStats[match.player2_id]) {
          playerStats[match.player2_id].gamesWon += match.player2_score
          playerStats[match.player2_id].matchesPlayed += 1
        }
      }
    })

    console.log('Leaderboard Debug - Player stats:', playerStats)

    // Convert to array and sort by games won
    return Object.entries(playerStats)
      .map(([playerId, stats]) => ({
        player_id: playerId,
        player_name: getPlayerName(playerId),
        player_email: players.find(p => p.id === playerId)?.email || '',
        games_won: stats.gamesWon,
        matches_played: stats.matchesPlayed
      }))
      .filter(entry => entry.matches_played > 0) // Only show players who have played matches
      .sort((a, b) => b.games_won - a.games_won) // Sort by games won (descending)
  }

  const leaderboard = calculateLeaderboard()

  if (tournamentsLoading || matchesLoading || playersLoading) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="spinner" style={{ margin: '0 auto 20px' }}></div>
          <p>Loading leaderboard...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--primary-color)', marginBottom: '24px' }}>
          Leaderboard
        </h1>

        {/* Debug Information */}
        <div className="card" style={{ marginBottom: '20px', backgroundColor: '#f8f9fa' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#666', margin: '0 0 12px 0' }}>
            Debug Information
          </h3>
          <div style={{ fontSize: '14px', color: '#666' }}>
            <p><strong>Total Matches:</strong> {allMatches?.length || 0}</p>
            <p><strong>Total Players:</strong> {players?.length || 0}</p>
            <p><strong>Leaderboard Entries:</strong> {leaderboard?.length || 0}</p>
            {allMatches && allMatches.length > 0 && (
              <div style={{ marginTop: '8px' }}>
                <p><strong>Match Statuses:</strong></p>
                <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                  {Array.from(new Set(allMatches.map(m => m.status))).map(status => (
                    <li key={status}>{status}: {allMatches.filter(m => m.status === status).length} matches</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {leaderboard && leaderboard.length > 0 ? (
          <div className="card">
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--primary-color)', margin: '0 0 20px 0' }}>
              Player Rankings (Based on Games Won)
            </h2>
            <div style={{ display: 'grid', gap: '12px' }}>
              {leaderboard.map((entry, index) => (
                <div key={entry.player_id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '16px',
                  backgroundColor: index === 0 ? '#fff3cd' : '#f8f9fa',
                  borderRadius: '8px',
                  border: index === 0 ? '2px solid #ffc107' : '1px solid #e9ecef'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: index === 0 ? '#ffc107' : '#6c757d',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    marginRight: '16px'
                  }}>
                    {index + 1}
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 4px 0', color: '#333' }}>
                      {entry.player_name}
                    </h4>
                    <p style={{ color: '#666', margin: 0, fontSize: '14px' }}>
                      {entry.player_email}
                    </p>
                  </div>
                  
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                      {entry.games_won}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      games won ({entry.matches_played} matches)
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>🏆</div>
            <h2 style={{ fontSize: '24px', color: '#666', marginBottom: '12px' }}>
              No leaderboard data available
            </h2>
            <p style={{ color: '#999', marginBottom: '24px' }}>
              Leaderboard will appear here once matches are played and scores are recorded.
            </p>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default Leaderboard
