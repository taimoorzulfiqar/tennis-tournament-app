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
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading players...</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2 text-gray-900">
            Players
          </h1>
          <p className="text-gray-600 text-lg">
            View all registered players and their tournament statistics
          </p>
        </div>

        {/* Search and Controls */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex-1 min-w-0">
              <input
                type="text"
                placeholder="Search players by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2 items-center">
              <span className="text-sm text-gray-600">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => handleSort(e.target.value as typeof sortBy)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="name">Name</option>
                <option value="matches">Matches Played</option>
                <option value="wins">Wins</option>
                <option value="gamesWon">Games Won</option>
                <option value="winPercentage">Win %</option>
              </select>
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 flex items-center gap-2"
              >
                <span>🔄</span>
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Players Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-7 gap-4 p-4 bg-gray-50 border-b border-gray-200 font-semibold text-sm text-gray-700">
            <div 
              className="cursor-pointer flex items-center gap-1 hover:text-blue-600"
              onClick={() => handleSort('name')}
            >
              Player {getSortIcon('name')}
            </div>
            <div 
              className="cursor-pointer flex items-center gap-1 hover:text-blue-600"
              onClick={() => handleSort('matches')}
            >
              Matches {getSortIcon('matches')}
            </div>
            <div 
              className="cursor-pointer flex items-center gap-1 hover:text-blue-600"
              onClick={() => handleSort('wins')}
            >
              Wins {getSortIcon('wins')}
            </div>
            <div className="text-center">Losses</div>
            <div 
              className="cursor-pointer flex items-center gap-1 justify-center hover:text-blue-600"
              onClick={() => handleSort('gamesWon')}
            >
              Games Won {getSortIcon('gamesWon')}
            </div>
            <div 
              className="cursor-pointer flex items-center gap-1 justify-center hover:text-blue-600"
              onClick={() => handleSort('winPercentage')}
            >
              Win % {getSortIcon('winPercentage')}
            </div>
            <div className="text-center">Games W/L</div>
          </div>

          {/* Table Body */}
          {filteredAndSortedStats.length === 0 ? (
            <div className="p-12 text-center text-gray-600">
              {searchTerm ? 'No players found matching your search.' : 'No players registered yet.'}
            </div>
          ) : (
            filteredAndSortedStats.map((stats, index) => (
              <div
                key={stats.player.id}
                className="grid grid-cols-7 gap-4 p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <div>
                  <div className="font-semibold text-gray-900">
                    {stats.player.full_name || 'Unnamed Player'}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {stats.player.email}
                  </div>
                </div>
                <div className="font-medium text-gray-700">
                  {stats.matchesPlayed}
                </div>
                <div className="font-medium text-green-600">
                  {stats.wins}
                </div>
                <div className="font-medium text-red-600 text-center">
                  {stats.losses}
                </div>
                <div className="font-medium text-blue-600 text-center">
                  {stats.gamesWon}
                </div>
                <div className={`font-semibold text-center ${
                  stats.winPercentage >= 50 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stats.matchesPlayed > 0 ? `${stats.winPercentage}%` : '-'}
                </div>
                <div className="text-center text-sm text-gray-600">
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
