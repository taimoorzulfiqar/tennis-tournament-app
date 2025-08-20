import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { matchAPI, userAPI, tournamentAPI } from '../lib/api'
import { useAuth } from '../hooks/useAuth'

interface Match {
  player1_id: string
  player2_id: string
  court: string
  player1_score: number
  player2_score: number
  is_completed: boolean
}

const AddMatch: React.FC = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // Redirect if user is not authorized to add matches
  React.useEffect(() => {
    if (user && !(
      user.role === 'master' || 
      (user.role === 'admin' && user.verification_status === 'approved')
    )) {
      navigate('/')
      alert('Access denied. Only approved admins and master users can add matches.')
    }
  }, [user, navigate])

  const [match, setMatch] = useState<Match>({
    player1_id: '',
    player2_id: '',
    court: '',
    player1_score: 0,
    player2_score: 0,
    is_completed: false
  })

  // Fetch tournament details
  const { data: tournament, isLoading: tournamentLoading } = useQuery({
    queryKey: ['tournament', tournamentId],
    queryFn: () => tournamentAPI.getTournament(tournamentId!),
    enabled: !!tournamentId,
  })

  // Fetch players for selection
  const { data: players, isLoading: playersLoading } = useQuery({
    queryKey: ['players'],
    queryFn: async () => {
      const allUsers = await userAPI.getUsers()
      return allUsers.filter(u => u.role === 'player')
    },
  })

  const createMatchMutation = useMutation({
    mutationFn: async (matchData: Match) => {
      const createdMatch = await matchAPI.createMatch({
        tournament_id: tournamentId!,
        player1_id: matchData.player1_id,
        player2_id: matchData.player2_id,
        court: matchData.court,
        player1_score: matchData.player1_score,
        player2_score: matchData.player2_score
      })

      // If match is marked as completed, update its score and determine winner
      if (matchData.is_completed) {
        console.log('Match is marked as completed, updating score...')
        console.log('Scores:', { player1_score: matchData.player1_score, player2_score: matchData.player2_score })
        
        const updatedMatch = await matchAPI.updateMatchScore(createdMatch.id!, {
          player1_score: matchData.player1_score,
          player2_score: matchData.player2_score
        })
        
        console.log('Match updated with score:', updatedMatch)
        return updatedMatch
      }

      return createdMatch
    },
    onSuccess: () => {
      console.log('Match created successfully')
      queryClient.invalidateQueries({ queryKey: ['matches'] })
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] })
      queryClient.invalidateQueries({ queryKey: ['users'] })
      navigate(`/tournaments/${tournamentId}`)
    },
    onError: (error) => {
      console.error('Error creating match:', error)
      alert('Failed to create match. Please try again.')
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!match.player1_id || !match.player2_id) {
      alert('Please select both players.')
      return
    }
    
    if (match.player1_id === match.player2_id) {
      alert('Please select different players.')
      return
    }

    // If match is completed, validate scores
    if (match.is_completed) {
      if (match.player1_score === 0 && match.player2_score === 0) {
        alert('Please enter scores for completed matches.')
        return
      }
      
      // Ensure there's a clear winner (no ties)
      if (match.player1_score === match.player2_score) {
        alert('Please enter different scores for completed matches. Ties are not allowed.')
        return
      }
    }

    createMatchMutation.mutate(match)
  }

  const handleInputChange = (field: keyof Match, value: any) => {
    setMatch(prev => ({ ...prev, [field]: value }))
  }

  if (tournamentLoading || playersLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </Layout>
    )
  }

  if (!tournament) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-red-600">Tournament not found</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Add Match to {tournament.name}</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Player Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Player 1
              </label>
              <select
                value={match.player1_id}
                onChange={(e) => handleInputChange('player1_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Player 1</option>
                {players?.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.full_name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Player 2
              </label>
              <select
                value={match.player2_id}
                onChange={(e) => handleInputChange('player2_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Player 2</option>
                {players?.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.full_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Court */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Court
            </label>
            <input
              type="text"
              value={match.court}
              onChange={(e) => handleInputChange('court', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Court 1, Indoor Court, etc."
            />
          </div>

          {/* Match Completion */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_completed"
              checked={match.is_completed}
              onChange={(e) => handleInputChange('is_completed', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="is_completed" className="text-sm font-medium text-gray-700">
              Mark as completed
            </label>
          </div>

          {/* Score Inputs (only show if completed) */}
          {match.is_completed && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {players?.find(p => p.id === match.player1_id)?.full_name || 'Player 1'} Score
                </label>
                <input
                  type="number"
                  min="0"
                  value={match.player1_score}
                  onChange={(e) => handleInputChange('player1_score', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {players?.find(p => p.id === match.player2_id)?.full_name || 'Player 2'} Score
                </label>
                <input
                  type="number"
                  min="0"
                  value={match.player2_score}
                  onChange={(e) => handleInputChange('player2_score', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate(`/tournaments/${tournamentId}`)}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMatchMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {createMatchMutation.isPending ? 'Creating...' : 'Create Match'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}

export default AddMatch
