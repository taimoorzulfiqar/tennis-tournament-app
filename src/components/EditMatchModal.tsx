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
      console.log('EditMatchModal: Starting match update with formData:', formData)
      
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
        console.log('EditMatchModal: Match is being set to completed, updating score...')
        console.log('Scores:', { player1_score: formData.player1_score, player2_score: formData.player2_score })
        
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
      console.log('EditMatchModal: Match updated successfully')
      queryClient.invalidateQueries({ queryKey: ['matches'] })
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] })
      queryClient.invalidateQueries({ queryKey: ['users'] })
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
      
      // Ensure there's a clear winner (no ties)
      if (formData.player1_score === formData.player2_score) {
        alert('Please enter different scores for completed matches. Ties are not allowed.')
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
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        width: '100%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
        margin: '20px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: 'var(--text-primary)'
          }}>
            Edit Match
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              transition: 'color 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
          >
            ✕
          </button>
        </div>

        {tournament && (
          <div style={{
            marginBottom: '24px',
            padding: '16px',
            backgroundColor: 'var(--primary-light)',
            borderRadius: '8px',
            border: '1px solid var(--primary-color)'
          }}>
            <p style={{
              fontSize: '14px',
              color: 'var(--text-secondary)',
              margin: 0
            }}>
              Tournament: <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{tournament.name}</span>
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Players Display */}
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
              <div style={{
                padding: '12px 16px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #e0e0e0',
                fontSize: '16px',
                color: 'var(--text-primary)'
              }}>
                {getPlayerName(match.player1_id)}
              </div>
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
              <div style={{
                padding: '12px 16px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #e0e0e0',
                fontSize: '16px',
                color: 'var(--text-primary)'
              }}>
                {getPlayerName(match.player2_id)}
              </div>
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
              value={formData.court}
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

          {/* Status */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              marginBottom: '8px',
              color: 'var(--text-primary)'
            }}>
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleInputChange('status', e.target.value)}
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
            >
              <option value="scheduled">Scheduled</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Score Inputs (only show if completed) */}
          {formData.status === 'completed' && (
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
                  {getPlayerName(match.player1_id)} Score
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.player1_score}
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
                  {getPlayerName(match.player2_id)} Score
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.player2_score}
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

          {/* Winner Display */}
          {match.winner_id && (
            <div style={{
              padding: '16px',
              backgroundColor: '#e8f5e8',
              border: '1px solid #4caf50',
              borderRadius: '8px'
            }}>
              <p style={{
                fontSize: '14px',
                color: '#2e7d32',
                margin: 0
              }}>
                <span style={{ fontWeight: '600' }}>Winner:</span> {getPlayerName(match.winner_id)}
              </p>
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
              onClick={onClose}
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
              disabled={updateMatchMutation.isPending}
              style={{
                padding: '12px 24px',
                backgroundColor: updateMatchMutation.isPending ? '#ccc' : 'var(--primary-color)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: updateMatchMutation.isPending ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (!updateMatchMutation.isPending) {
                  e.currentTarget.style.backgroundColor = 'var(--primary-dark)'
                }
              }}
              onMouseLeave={(e) => {
                if (!updateMatchMutation.isPending) {
                  e.currentTarget.style.backgroundColor = 'var(--primary-color)'
                }
              }}
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
