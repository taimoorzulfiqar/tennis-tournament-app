import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { tournamentAPI, userAPI, matchAPI } from '../lib/api'
import { useAuth } from '../hooks/useAuth'

interface Match {
  player1_id: string
  player2_id: string
  court: string
  player1_score: number
  player2_score: number
  is_completed: boolean
}

const CreateTournament: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // Redirect if user is not authorized to create tournaments
  React.useEffect(() => {
    if (user && !(
      user.role === 'master' || 
      (user.role === 'admin' && user.verification_status === 'approved')
    )) {
      navigate('/')
      alert('Access denied. Only approved admins and master users can create tournaments.')
    }
  }, [user, navigate])
  
  const [tournament, setTournament] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: ''
  })
  
  const [createWithoutMatches, setCreateWithoutMatches] = useState(false)
  
  const [matches, setMatches] = useState<Match[]>([
    {
      player1_id: '',
      player2_id: '',
      court: '',
      player1_score: 0,
      player2_score: 0,
      is_completed: false
    }
  ])

  // Fetch players for selection
  const { data: players, isLoading: playersLoading } = useQuery({
    queryKey: ['players'],
    queryFn: async () => {
      console.log('CreateTournament: Fetching players...')
      const allUsers = await userAPI.getUsers()
      console.log('CreateTournament: All users:', allUsers)
      const playerUsers = allUsers.filter(u => u.role === 'player')
      console.log('CreateTournament: Player users:', playerUsers)
      return playerUsers
    },
  })

  const createTournamentMutation = useMutation({
    mutationFn: async (tournamentData: any) => {
      // Prepare tournament data - handle empty end_date
      const tournamentCreate = {
        ...tournamentData,
        end_date: tournamentData.end_date || null // Convert empty string to null
      }
      
      // First create the tournament
      const createdTournament = await tournamentAPI.createTournament(tournamentCreate, user!.id)
      
      // Only create matches if not creating without matches
      if (!createWithoutMatches) {
        // Then create all matches for the tournament
        for (const match of matches) {
          const createdMatch = await matchAPI.createMatch({
            tournament_id: createdTournament.id,
            player1_id: match.player1_id,
            player2_id: match.player2_id,
            court: match.court,
            player1_score: match.player1_score,
            player2_score: match.player2_score
          })

          // If match is marked as completed, update its score and determine winner
          if (match.is_completed) {
            console.log('Match is marked as completed, updating score...')
            
            await matchAPI.updateMatchScore(createdMatch.id!, {
              player1_score: match.player1_score,
              player2_score: match.player2_score
            })
          }
        }
      }
      
      return createdTournament
    },
    onSuccess: () => {
      console.log('Tournament created successfully')
      queryClient.invalidateQueries({ queryKey: ['tournaments'] })
      queryClient.invalidateQueries({ queryKey: ['matches'] })
      queryClient.invalidateQueries({ queryKey: ['users'] })
      alert('Tournament created successfully!')
      navigate('/')
    },
    onError: (error) => {
      console.error('Error creating tournament:', error)
      alert('Failed to create tournament. Please try again.')
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!tournament.name || !tournament.start_date) {
      alert('Please fill in all required fields.')
      return
    }

    // Validate matches if creating with matches
    if (!createWithoutMatches) {
      for (let i = 0; i < matches.length; i++) {
        const match = matches[i]
        if (!match.player1_id || !match.player2_id) {
          alert(`Match ${i + 1}: Please select both players.`)
          return
        }
        
        if (match.player1_id === match.player2_id) {
          alert(`Match ${i + 1}: Please select different players.`)
          return
        }

        // If match is completed, validate scores
        if (match.is_completed) {
          if (match.player1_score === 0 && match.player2_score === 0) {
            alert(`Match ${i + 1}: Please enter scores for completed matches.`)
            return
          }
        }
      }
    }

    createTournamentMutation.mutate(tournament)
  }

  const addMatch = () => {
    setMatches([...matches, {
      player1_id: '',
      player2_id: '',
      court: '',
      player1_score: 0,
      player2_score: 0,
      is_completed: false
    }])
  }

  const removeMatch = (index: number) => {
    if (matches.length > 1) {
      setMatches(matches.filter((_, i) => i !== index))
    }
  }

  const updateMatch = (index: number, field: keyof Match, value: any) => {
    const updatedMatches = [...matches]
    updatedMatches[index] = { ...updatedMatches[index], [field]: value }
    
    // If Player 1 is being changed and it matches the current Player 2, clear Player 2
    if (field === 'player1_id' && value === matches[index].player2_id) {
      updatedMatches[index].player2_id = ''
    }
    
    setMatches(updatedMatches)
  }

  if (playersLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Create Tournament</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tournament Details */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Tournament Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tournament Name *
                </label>
                <input
                  type="text"
                  value={tournament.name}
                  onChange={(e) => setTournament({ ...tournament, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={tournament.start_date}
                  onChange={(e) => setTournament({ ...tournament, start_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={tournament.description}
                  onChange={(e) => setTournament({ ...tournament, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={tournament.end_date}
                  onChange={(e) => setTournament({ ...tournament, end_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Create Without Matches Option */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="createWithoutMatches"
                checked={createWithoutMatches}
                onChange={(e) => setCreateWithoutMatches(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="createWithoutMatches" className="text-sm font-medium text-gray-700">
                Create tournament without matches (add matches later)
              </label>
            </div>
          </div>

          {/* Matches Section */}
          {!createWithoutMatches && (
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Matches</h2>
                <button
                  type="button"
                  onClick={addMatch}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  Add Match
                </button>
              </div>
              
              {matches.map((match, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Match {index + 1}</h3>
                    {matches.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMatch(index)}
                        className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Player 1
                      </label>
                      <select
                        value={match.player1_id}
                        onChange={(e) => updateMatch(index, 'player1_id', e.target.value)}
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
                        onChange={(e) => updateMatch(index, 'player2_id', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select Player 2</option>
                        {players?.filter(player => player.id !== match.player1_id).map((player) => (
                          <option key={player.id} value={player.id}>
                            {player.full_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Court
                      </label>
                      <input
                        type="text"
                        value={match.court}
                        onChange={(e) => updateMatch(index, 'court', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Court 1, Indoor Court, etc."
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`is_completed_${index}`}
                        checked={match.is_completed}
                        onChange={(e) => updateMatch(index, 'is_completed', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`is_completed_${index}`} className="text-sm font-medium text-gray-700">
                        Mark as completed
                      </label>
                    </div>
                  </div>

                  {/* Score Inputs (only show if completed) */}
                  {match.is_completed && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {players?.find(p => p.id === match.player1_id)?.full_name || 'Player 1'} Score
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={match.player1_score}
                          onChange={(e) => updateMatch(index, 'player1_score', parseInt(e.target.value) || 0)}
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
                          onChange={(e) => updateMatch(index, 'player2_score', parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createTournamentMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {createTournamentMutation.isPending ? 'Creating...' : 'Create Tournament'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}

export default CreateTournament
