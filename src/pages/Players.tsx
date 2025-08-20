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
        <div className="max-w-7xl mx-auto p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2 text-gray-900">Players</h1>
            <p className="text-gray-600 text-lg">View all registered players and their tournament statistics</p>
          </div>
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <div className="text-lg text-gray-600">Loading players...</div>
            </div>
          </div>
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
        <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center">
            <div className="flex-1 min-w-0">
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Players</label>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center w-full lg:w-auto">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => handleSort(e.target.value as typeof sortBy)}
                  className="w-full sm:w-auto px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white"
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
                className="w-full sm:w-auto px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200 flex items-center justify-center gap-2 font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Players Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
          {/* Desktop Table Header */}
          <div className="hidden md:grid grid-cols-7 gap-4 p-6 bg-gradient-to-r from-green-50 to-green-100 border-b border-green-200 font-semibold text-sm text-gray-700">
            <div 
              className="cursor-pointer flex items-center gap-1 hover:text-green-600 transition-colors duration-200"
              onClick={() => handleSort('name')}
            >
              Player {getSortIcon('name')}
            </div>
            <div 
              className="cursor-pointer flex items-center gap-1 hover:text-green-600 transition-colors duration-200"
              onClick={() => handleSort('matches')}
            >
              Matches {getSortIcon('matches')}
            </div>
            <div 
              className="cursor-pointer flex items-center gap-1 hover:text-green-600 transition-colors duration-200"
              onClick={() => handleSort('wins')}
            >
              Wins {getSortIcon('wins')}
            </div>
            <div className="text-center">Losses</div>
            <div 
              className="cursor-pointer flex items-center gap-1 justify-center hover:text-green-600 transition-colors duration-200"
              onClick={() => handleSort('gamesWon')}
            >
              Games Won {getSortIcon('gamesWon')}
            </div>
            <div 
              className="cursor-pointer flex items-center gap-1 justify-center hover:text-green-600 transition-colors duration-200"
              onClick={() => handleSort('winPercentage')}
            >
              Win % {getSortIcon('winPercentage')}
            </div>
            <div className="text-center">Games W/L</div>
          </div>

          {/* Table Body */}
          {filteredAndSortedStats.length === 0 ? (
            <div className="p-16 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="text-gray-600 text-lg font-medium">
                {searchTerm ? 'No players found matching your search.' : 'No players registered yet.'}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table Rows */}
              <div className="hidden md:block">
                {filteredAndSortedStats.map((stats, index) => (
                  <div
                    key={stats.player.id}
                    className="grid grid-cols-7 gap-4 p-6 border-b border-gray-100 hover:bg-green-50 transition-all duration-200"
                  >
                <div>
                  <div className="font-semibold text-gray-900 text-lg">
                    {stats.player.full_name || 'Unnamed Player'}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {stats.player.email}
                  </div>
                </div>
                <div className="font-medium text-gray-700 flex items-center">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                    {stats.matchesPlayed}
                  </span>
                </div>
                <div className="font-medium text-green-600 flex items-center">
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                    {stats.wins}
                  </span>
                </div>
                <div className="font-medium text-red-600 text-center flex items-center justify-center">
                  <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-semibold">
                    {stats.losses}
                  </span>
                </div>
                <div className="font-medium text-blue-600 text-center flex items-center justify-center">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                    {stats.gamesWon}
                  </span>
                </div>
                <div className={`font-semibold text-center flex items-center justify-center ${
                  stats.winPercentage >= 50 ? 'text-green-600' : 'text-red-600'
                }`}>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    stats.winPercentage >= 50 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {stats.matchesPlayed > 0 ? `${stats.winPercentage}%` : '-'}
                  </span>
                </div>
                <div className="text-center text-sm text-gray-600 flex items-center justify-center">
                  <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-semibold">
                    {stats.totalGames > 0 ? `${stats.gamesWon}/${stats.gamesLost}` : '-'}
                  </span>
                </div>
              </div>
            ))}
              </div>

              {/* Mobile Card Layout */}
              <div className="md:hidden">
                {filteredAndSortedStats.map((stats, index) => (
                  <div
                    key={stats.player.id}
                    className="p-6 border-b border-gray-100 hover:bg-green-50 transition-all duration-200"
                  >
                    <div className="mb-4">
                      <div className="font-semibold text-gray-900 text-lg mb-1">
                        {stats.player.full_name || 'Unnamed Player'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {stats.player.email}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-sm text-gray-600 mb-1">Matches</div>
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                          {stats.matchesPlayed}
                        </span>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-gray-600 mb-1">Wins</div>
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                          {stats.wins}
                        </span>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-gray-600 mb-1">Losses</div>
                        <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-semibold">
                          {stats.losses}
                        </span>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-gray-600 mb-1">Games Won</div>
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                          {stats.gamesWon}
                        </span>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-gray-600 mb-1">Win %</div>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          stats.winPercentage >= 50 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {stats.matchesPlayed > 0 ? `${stats.winPercentage}%` : '-'}
                        </span>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-gray-600 mb-1">Games W/L</div>
                        <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-semibold">
                          {stats.totalGames > 0 ? `${stats.gamesWon}/${stats.gamesLost}` : '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default Players
