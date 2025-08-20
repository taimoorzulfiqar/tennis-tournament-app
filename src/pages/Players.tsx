import React, { useState, useMemo } from 'react'
import { useUsers } from '../hooks/useUsers'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { matchAPI } from '../lib/api'
import { User, Match } from '../types'
import Layout from '../components/Layout'

interface PlayerStats {
  player: User
  matchesPlayed: number
  wins: number
  losses: number
  winPercentage: number
  totalGames: number
  gamesWon: number
  gamesLost: number
}

const Players: React.FC = () => {
  const { users, isLoading: usersLoading } = useUsers()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'matches' | 'wins' | 'winPercentage' | 'gamesWon'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // Fetch all matches to calculate player stats
  const { data: matches = [], isLoading: matchesLoading } = useQuery({
    queryKey: ['matches'],
    queryFn: () => matchAPI.getMatches(),
    refetchOnWindowFocus: true,
    staleTime: 0, // Always consider data stale to ensure fresh data
  })

  // Calculate player stats
  const playerStats = useMemo((): PlayerStats[] => {
    console.log('Calculating player stats...')
    console.log('Users:', users)
    console.log('Matches:', matches)
    
    const statsMap = new Map<string, PlayerStats>()

    // Initialize stats for all players
    users.forEach(user => {
      if (user.role === 'player') {
        statsMap.set(user.id, {
          player: user,
          matchesPlayed: 0,
          wins: 0,
          losses: 0,
          winPercentage: 0,
          totalGames: 0,
          gamesWon: user.games_won || 0,
          gamesLost: 0
        })
      }
    })

    // Calculate stats from matches
    matches.forEach(match => {
      console.log('Processing match:', match)
      console.log('Match scores - Player1:', match.player1_score, 'Player2:', match.player2_score)
      console.log('Match status:', match.status, 'Winner ID:', match.winner_id)
      
      if (match.status === 'completed' && match.winner_id) {
        console.log('Match is completed with winner:', match.winner_id)
        const player1Stats = statsMap.get(match.player1_id)
        const player2Stats = statsMap.get(match.player2_id)

        if (player1Stats) {
          player1Stats.matchesPlayed++
          player1Stats.totalGames += match.player1_score + match.player2_score
          player1Stats.gamesLost += match.player2_score

          if (match.winner_id === match.player1_id) {
            player1Stats.wins++
          } else {
            player1Stats.losses++
          }
        }

        if (player2Stats) {
          player2Stats.matchesPlayed++
          player2Stats.totalGames += match.player1_score + match.player2_score
          player2Stats.gamesLost += match.player1_score

          if (match.winner_id === match.player2_id) {
            player2Stats.wins++
          } else {
            player2Stats.losses++
          }
        }
      }
    })

    // Calculate win percentages
    statsMap.forEach(stats => {
      if (stats.matchesPlayed > 0) {
        stats.winPercentage = Math.round((stats.wins / stats.matchesPlayed) * 100)
      }
    })

    const result = Array.from(statsMap.values())
    console.log('Calculated player stats:', result)
    return result
  }, [users, matches])

  // Filter and sort players
  const filteredAndSortedStats = useMemo(() => {
    let filtered = playerStats.filter(stats =>
      stats.player.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stats.player.email.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Sort players
    filtered.sort((a, b) => {
      let aValue: string | number
      let bValue: string | number

      switch (sortBy) {
        case 'name':
          aValue = a.player.full_name || a.player.email
          bValue = b.player.full_name || b.player.email
          break
        case 'matches':
          aValue = a.matchesPlayed
          bValue = b.matchesPlayed
          break
        case 'wins':
          aValue = a.wins
          bValue = b.wins
          break
        case 'winPercentage':
          aValue = a.winPercentage
          bValue = b.winPercentage
          break
        case 'gamesWon':
          aValue = a.gamesWon
          bValue = b.gamesWon
          break
        default:
          aValue = a.player.full_name || a.player.email
          bValue = b.player.full_name || b.player.email
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      } else {
        return sortOrder === 'asc' 
          ? (aValue as number) - (bValue as number)
          : (bValue as number) - (aValue as number)
      }
    })

    return filtered
  }, [playerStats, searchTerm, sortBy, sortOrder])

  const handleSort = (newSortBy: typeof sortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(newSortBy)
      setSortOrder('desc')
    }
  }

  const getSortIcon = (column: typeof sortBy) => {
    if (sortBy !== column) return '↕️'
    return sortOrder === 'asc' ? '↑' : '↓'
  }

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['matches'] })
    queryClient.invalidateQueries({ queryKey: ['users'] })
  }

  if (usersLoading || matchesLoading) {
    return (
      <Layout>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
          <div style={{ marginBottom: '24px' }}>
            <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-primary)' }}>
              Players
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '18px' }}>
              View all registered players and their tournament statistics
            </p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '256px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '48px',
                height: '48px',
                border: '4px solid var(--primary-light)',
                borderTop: '4px solid var(--primary-color)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 16px'
              }}></div>
              <div style={{ fontSize: '18px', color: 'var(--text-secondary)' }}>Loading players...</div>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

    return (
    <Layout>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-primary)' }}>
            Players
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '18px' }}>
            View all registered players and their tournament statistics
          </p>
        </div>

        {/* Search and Controls */}
        <div style={{ 
          marginBottom: '32px', 
          backgroundColor: 'white', 
          borderRadius: '12px', 
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', 
          padding: '24px',
          border: '1px solid #e0e0e0'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-primary)' }}>
                Search Players
              </label>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '16px',
                  transition: 'border-color 0.2s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <label style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                  Sort by:
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => handleSort(e.target.value as typeof sortBy)}
                  style={{
                    padding: '12px 16px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '16px',
                    backgroundColor: 'white',
                    transition: 'border-color 0.2s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                  onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                >
                  <option value="name">Name</option>
                  <option value="matches">Matches Played</option>
                  <option value="wins">Wins</option>
                  <option value="gamesWon">Games Won</option>
                  <option value="winPercentage">Win %</option>
                </select>
              </div>
              <button
                onClick={handleRefresh}
                style={{
                  padding: '12px 24px',
                  backgroundColor: 'var(--primary-color)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-dark)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-color)'}
              >
                🔄 Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Players Table */}
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '12px', 
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', 
          overflow: 'hidden',
          border: '1px solid #e0e0e0'
        }}>
          {/* Table Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 1fr',
            gap: '16px',
            padding: '20px',
            backgroundColor: 'var(--primary-light)',
            borderBottom: '2px solid var(--primary-color)',
            fontWeight: 'bold',
            fontSize: '14px',
            color: 'var(--text-primary)'
          }}>
            <div 
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              onClick={() => handleSort('name')}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary-color)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
            >
              Player {getSortIcon('name')}
            </div>
            <div 
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              onClick={() => handleSort('matches')}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary-color)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
            >
              Matches {getSortIcon('matches')}
            </div>
            <div 
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              onClick={() => handleSort('wins')}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary-color)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
            >
              Wins {getSortIcon('wins')}
            </div>
            <div style={{ textAlign: 'center' }}>Losses</div>
            <div 
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
              onClick={() => handleSort('gamesWon')}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary-color)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
            >
              Games Won {getSortIcon('gamesWon')}
            </div>
            <div 
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
              onClick={() => handleSort('winPercentage')}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary-color)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
            >
              Win % {getSortIcon('winPercentage')}
            </div>
            <div style={{ textAlign: 'center' }}>Games W/L</div>
          </div>

          {/* Table Body */}
          {filteredAndSortedStats.length === 0 ? (
            <div style={{ padding: '64px', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px', color: '#ccc' }}>👥</div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '18px', fontWeight: '500' }}>
                {searchTerm ? 'No players found matching your search.' : 'No players registered yet.'}
              </p>
            </div>
          ) : (
            filteredAndSortedStats.map((stats, index) => (
              <div
                key={stats.player.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 1fr',
                  gap: '16px',
                  padding: '20px',
                  borderBottom: '1px solid #f0f0f0',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-light)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '18px', color: 'var(--text-primary)' }}>
                    {stats.player.full_name || 'Unnamed Player'}
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {stats.player.email}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{
                    backgroundColor: '#e3f2fd',
                    color: '#1976d2',
                    padding: '4px 12px',
                    borderRadius: '16px',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}>
                    {stats.matchesPlayed}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{
                    backgroundColor: '#e8f5e8',
                    color: '#2e7d32',
                    padding: '4px 12px',
                    borderRadius: '16px',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}>
                    {stats.wins}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{
                    backgroundColor: '#ffebee',
                    color: '#c62828',
                    padding: '4px 12px',
                    borderRadius: '16px',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}>
                    {stats.losses}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{
                    backgroundColor: '#e3f2fd',
                    color: '#1976d2',
                    padding: '4px 12px',
                    borderRadius: '16px',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}>
                    {stats.gamesWon}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{
                    backgroundColor: stats.winPercentage >= 50 ? '#e8f5e8' : '#ffebee',
                    color: stats.winPercentage >= 50 ? '#2e7d32' : '#c62828',
                    padding: '4px 12px',
                    borderRadius: '16px',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}>
                    {stats.matchesPlayed > 0 ? `${stats.winPercentage}%` : '-'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{
                    backgroundColor: '#f5f5f5',
                    color: '#666',
                    padding: '4px 12px',
                    borderRadius: '16px',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}>
                    {stats.totalGames > 0 ? `${stats.gamesWon}/${stats.gamesLost}` : '-'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  )
}

export default Players
