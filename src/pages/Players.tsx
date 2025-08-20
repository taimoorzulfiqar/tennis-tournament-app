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
          gamesWon: 0,
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
          player1Stats.gamesWon += match.player1_score
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
          player2Stats.gamesWon += match.player2_score
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
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '24px', marginBottom: '16px' }}>Loading players...</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: '700', 
            marginBottom: '8px',
            color: '#1a1a1a'
          }}>
            Players
          </h1>
          <p style={{ 
            color: '#666', 
            fontSize: '16px',
            marginBottom: '24px'
          }}>
            View all registered players and their tournament statistics
          </p>
        </div>

        {/* Search and Stats */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '16px',
          marginBottom: '24px'
        }}>
          <div style={{
            display: 'flex',
            gap: '16px',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            <div style={{ flex: 1, minWidth: '250px' }}>
              <input
                type="text"
                placeholder="Search players by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '16px',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
              />
            </div>
                         <div style={{
               display: 'flex',
               gap: '8px',
               alignItems: 'center'
             }}>
               <span style={{ fontSize: '14px', color: '#666' }}>Sort by:</span>
               <div style={{ position: 'relative' }}>
                 <select
                   value={sortBy}
                   onChange={(e) => handleSort(e.target.value as typeof sortBy)}
                   style={{
                     padding: '8px 12px',
                     paddingRight: '32px',
                     border: '1px solid #ddd',
                     borderRadius: '6px',
                     fontSize: '14px',
                     outline: 'none',
                     appearance: 'none',
                     backgroundColor: 'white'
                   }}
                 >
                   <option value="name">Name</option>
                   <option value="matches">Matches Played</option>
                   <option value="wins">Wins</option>
                   <option value="gamesWon">Games Won</option>
                   <option value="winPercentage">Win %</option>
                 </select>
                 <div style={{
                   position: 'absolute',
                   right: '8px',
                   top: '50%',
                   transform: 'translateY(-50%)',
                   pointerEvents: 'none',
                   fontSize: '12px',
                   color: '#666'
                 }}>
                   ▼
                 </div>
               </div>
                               <button
                  onClick={handleRefresh}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: '#f8f9fa',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  🔄 Refresh
                </button>
             </div>
          </div>

          
        </div>

        {/* Players Table */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e0e0e0',
          overflow: 'hidden'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 1fr',
            gap: '16px',
            padding: '16px',
            backgroundColor: '#f8f9fa',
            borderBottom: '1px solid #e0e0e0',
            fontWeight: '600',
            fontSize: '14px',
            color: '#495057'
          }}>
            <div 
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              onClick={() => handleSort('name')}
            >
              Player {getSortIcon('name')}
            </div>
            <div 
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              onClick={() => handleSort('matches')}
            >
              Matches {getSortIcon('matches')}
            </div>
            <div 
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              onClick={() => handleSort('wins')}
            >
              Wins {getSortIcon('wins')}
            </div>
            <div style={{ textAlign: 'center' }}>Losses</div>
            <div 
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}
              onClick={() => handleSort('gamesWon')}
            >
              Games Won {getSortIcon('gamesWon')}
            </div>
            <div 
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}
              onClick={() => handleSort('winPercentage')}
            >
              Win % {getSortIcon('winPercentage')}
            </div>
            <div style={{ textAlign: 'center' }}>Games W/L</div>
          </div>

          {filteredAndSortedStats.length === 0 ? (
            <div style={{
              padding: '40px',
              textAlign: 'center',
              color: '#666',
              fontSize: '16px'
            }}>
              {searchTerm ? 'No players found matching your search.' : 'No players registered yet.'}
            </div>
          ) : (
            filteredAndSortedStats.map((stats, index) => (
              <div
                key={stats.player.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 1fr',
                  gap: '16px',
                  padding: '16px',
                  borderBottom: index < filteredAndSortedStats.length - 1 ? '1px solid #f0f0f0' : 'none',
                  alignItems: 'center',
                  transition: 'background-color 0.2s',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8f9fa'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <div>
                  <div style={{ fontWeight: '600', color: '#1a1a1a' }}>
                    {stats.player.full_name || 'Unnamed Player'}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666', marginTop: '2px' }}>
                    {stats.player.email}
                  </div>
                </div>
                <div style={{ fontWeight: '500', color: '#495057' }}>
                  {stats.matchesPlayed}
                </div>
                <div style={{ fontWeight: '500', color: '#28a745' }}>
                  {stats.wins}
                </div>
                <div style={{ fontWeight: '500', color: '#dc3545', textAlign: 'center' }}>
                  {stats.losses}
                </div>
                <div style={{ fontWeight: '500', color: '#007bff', textAlign: 'center' }}>
                  {stats.gamesWon}
                </div>
                <div style={{ 
                  fontWeight: '600', 
                  textAlign: 'center',
                  color: stats.winPercentage >= 50 ? '#28a745' : '#dc3545'
                }}>
                  {stats.matchesPlayed > 0 ? `${stats.winPercentage}%` : '-'}
                </div>
                <div style={{ textAlign: 'center', fontSize: '14px', color: '#666' }}>
                  {stats.totalGames > 0 ? `${stats.gamesWon}/${stats.gamesLost}` : '-'}
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
