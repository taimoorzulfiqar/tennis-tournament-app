import React, { useState, useEffect } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { matchAPI, userAPI, tournamentAPI } from '../lib/api'

interface EditMatchModalProps {
  match: {
    id: string
    tournament_id: string
    player1_id: string
    player2_id: string
    court: string
    player1_score: number
    player2_score: number
    status: string
    winner_id?: string
  }
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const EditMatchModal: React.FC<EditMatchModalProps> = ({ match, isOpen, onClose, onSuccess }) => {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    player1_score: match.player1_score,
    player2_score: match.player2_score,
    status: match.status,
    court: match.court
  })

  const { data: players } = useQuery({
    queryKey: ['players'],
    queryFn: async () => {
      const allUsers = await userAPI.getUsers()
      return allUsers.filter(u => u.role === 'player')
    }
  })

  const { data: tournament } = useQuery({
    queryKey: ['tournament', match.tournament_id],
    queryFn: () => tournamentAPI.getTournament(match.tournament_id),
    enabled: !!match.tournament_id,
  })

  const getPlayerName = (playerId: string) => {
    const player = players?.find(p => p.id === playerId)
    return player?.full_name || player?.email || 'Unknown Player'
  }

  const updateMatchMutation = useMutation({
    mutationFn: async () => {
      // Update court and other basic fields
      await matchAPI.updateMatch(match.id, {
        court: formData.court,
        player1_id: match.player1_id,
        player2_id: match.player2_id,
        player1_score: formData.player1_score,
        player2_score: formData.player2_score
      })

      // If status is being set to completed, update score and determine winner
      if (formData.status === 'completed') {
        await matchAPI.updateMatchScore(match.id, {
          player1_score: formData.player1_score,
          player2_score: formData.player2_score
        })
      } else {
        // Update status if changed
        if (formData.status !== match.status) {
          await matchAPI.updateMatchStatus(match.id, formData.status as 'scheduled' | 'in_progress' | 'completed')
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] })
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] })
      onSuccess()
      onClose()
    },
    onError: (error) => {
      console.error('Error updating match:', error)
      alert('Failed to update match. Please try again.')
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (formData.status === 'completed') {
      if (formData.player1_score === 0 && formData.player2_score === 0) {
        alert('Please enter scores for completed matches.')
        return
      }
    }

    updateMatchMutation.mutate()
  }

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Reset form data when match changes
  useEffect(() => {
    setFormData({
      player1_score: match.player1_score,
      player2_score: match.player2_score,
      status: match.status,
      court: match.court
    })
  }, [match])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Edit Match</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {tournament && (
          <div className="mb-4 p-3 bg-gray-50 rounded">
            <p className="text-sm text-gray-600">
              Tournament: <span className="font-medium">{tournament.name}</span>
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Players Display */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Player 1
              </label>
              <div className="p-3 bg-gray-50 rounded border">
                {getPlayerName(match.player1_id)}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Player 2
              </label>
              <div className="p-3 bg-gray-50 rounded border">
                {getPlayerName(match.player2_id)}
              </div>
            </div>
          </div>

          {/* Court */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Court
            </label>
            <input
              type="text"
              value={formData.court}
              onChange={(e) => handleInputChange('court', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Court 1, Indoor Court, etc."
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleInputChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="scheduled">Scheduled</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Score Inputs (only show if completed) */}
          {formData.status === 'completed' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {getPlayerName(match.player1_id)} Score
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.player1_score}
                  onChange={(e) => handleInputChange('player1_score', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {getPlayerName(match.player2_id)} Score
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.player2_score}
                  onChange={(e) => handleInputChange('player2_score', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          )}

          {/* Winner Display */}
          {match.winner_id && (
            <div className="p-3 bg-green-50 border border-green-200 rounded">
              <p className="text-sm text-green-800">
                <span className="font-medium">Winner:</span> {getPlayerName(match.winner_id)}
              </p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMatchMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {updateMatchMutation.isPending ? 'Updating...' : 'Update Match'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditMatchModal
