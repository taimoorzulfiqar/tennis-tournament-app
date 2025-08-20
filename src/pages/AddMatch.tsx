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
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
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
              <div style={{ fontSize: '18px', color: 'var(--text-secondary)' }}>Loading...</div>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  if (!tournament) {
    return (
      <Layout>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '256px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px', color: '#f44336' }}>⚠️</div>
              <div style={{ fontSize: '18px', color: '#f44336', fontWeight: '500' }}>Tournament not found</div>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '24px' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-primary)' }}>
            Add Match to {tournament.name}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>
            Create a new match for this tournament
          </p>
        </div>
        
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '32px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e0e0e0'
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Player Selection */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '16px'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '8px',
                  color: 'var(--text-primary)'
                }}>
                  Player 1
                </label>
                <select
                  value={match.player1_id}
                  onChange={(e) => handleInputChange('player1_id', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '16px',
                    backgroundColor: 'white',
                    transition: 'border-color 0.2s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                  onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
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
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '8px',
                  color: 'var(--text-primary)'
                }}>
                  Player 2
                </label>
                <select
                  value={match.player2_id}
                  onChange={(e) => handleInputChange('player2_id', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '16px',
                    backgroundColor: 'white',
                    transition: 'border-color 0.2s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                  onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
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
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '8px',
                color: 'var(--text-primary)'
              }}>
                Court
              </label>
              <input
                type="text"
                value={match.court}
                onChange={(e) => handleInputChange('court', e.target.value)}
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
                placeholder="e.g., Court 1, Indoor Court, etc."
              />
            </div>

            {/* Match Completion */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input
                type="checkbox"
                id="is_completed"
                checked={match.is_completed}
                onChange={(e) => handleInputChange('is_completed', e.target.checked)}
                style={{
                  width: '20px',
                  height: '20px',
                  accentColor: 'var(--primary-color)',
                  cursor: 'pointer'
                }}
              />
              <label htmlFor="is_completed" style={{
                fontSize: '16px',
                fontWeight: '500',
                color: 'var(--text-primary)',
                cursor: 'pointer'
              }}>
                Mark as completed
              </label>
            </div>

            {/* Score Inputs (only show if completed) */}
            {match.is_completed && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '16px'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    marginBottom: '8px',
                    color: 'var(--text-primary)'
                  }}>
                    {players?.find(p => p.id === match.player1_id)?.full_name || 'Player 1'} Score
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={match.player1_score}
                    onChange={(e) => handleInputChange('player1_score', parseInt(e.target.value) || 0)}
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
                    required
                  />
                </div>
                
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    marginBottom: '8px',
                    color: 'var(--text-primary)'
                  }}>
                    {players?.find(p => p.id === match.player2_id)?.full_name || 'Player 2'} Score
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={match.player2_score}
                    onChange={(e) => handleInputChange('player2_score', parseInt(e.target.value) || 0)}
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
                    required
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '16px',
              paddingTop: '20px',
              flexWrap: 'wrap'
            }}>
              <button
                type="button"
                onClick={() => navigate(`/tournaments/${tournamentId}`)}
                style={{
                  padding: '12px 24px',
                  color: 'var(--text-primary)',
                  backgroundColor: '#f5f5f5',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e0e0e0'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMatchMutation.isPending}
                style={{
                  padding: '12px 24px',
                  backgroundColor: createMatchMutation.isPending ? '#ccc' : 'var(--primary-color)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: createMatchMutation.isPending ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!createMatchMutation.isPending) {
                    e.currentTarget.style.backgroundColor = 'var(--primary-dark)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!createMatchMutation.isPending) {
                    e.currentTarget.style.backgroundColor = 'var(--primary-color)'
                  }
                }}
              >
                {createMatchMutation.isPending ? 'Creating...' : 'Create Match'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  )
}

export default AddMatch
