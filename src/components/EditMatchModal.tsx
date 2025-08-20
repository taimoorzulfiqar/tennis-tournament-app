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
    court: match.court,
    match_format: {
      sets: 3,
      games_per_set: 6,
      tiebreak_at: 6
    },
    detailed_score: {
      player1_sets: [] as (number | null)[],
      player2_sets: [] as (number | null)[]
    }
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
             // Check if any set scores are entered
       const hasSetScores = formData.detailed_score.player1_sets.some(score => score && score > 0) || 
                           formData.detailed_score.player2_sets.some(score => score && score > 0)
      
      if (!hasSetScores) {
        alert('Please enter set scores for completed matches.')
        return
      }
      
      // Ensure there's a clear winner (no ties in sets won)
      if (formData.player1_score === formData.player2_score) {
        alert('Please enter scores that result in a clear winner. Match cannot end in a tie.')
        return
      }
      
      // Validate that the match is actually complete based on the format
      const setsToWin = Math.ceil(formData.match_format.sets / 2)
      if (formData.player1_score < setsToWin && formData.player2_score < setsToWin) {
        alert(`Match is not complete. A player needs to win ${setsToWin} sets in a ${formData.match_format.sets} set format.`)
        return
      }
    }

    updateMatchMutation.mutate()
  }

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleFormatChange = (field: keyof typeof formData.match_format, value: number) => {
    setFormData(prev => ({
      ...prev,
      match_format: { ...prev.match_format, [field]: value },
      detailed_score: { player1_sets: [], player2_sets: [] } // Reset scores when format changes
    }))
  }

  const handleSetScoreChange = (setIndex: number, player: 'player1' | 'player2', games: number | null) => {
    setFormData(prev => {
      const newDetailedScore = { ...prev.detailed_score }
      const playerKey = player === 'player1' ? 'player1_sets' : 'player2_sets'
      
      // Ensure arrays are long enough
      while (newDetailedScore.player1_sets.length <= setIndex) {
        newDetailedScore.player1_sets.push(null)
      }
      while (newDetailedScore.player2_sets.length <= setIndex) {
        newDetailedScore.player2_sets.push(null)
      }
      
      newDetailedScore[playerKey][setIndex] = games
      
      // Calculate overall match score (sets won)
      let player1Score = 0
      let player2Score = 0
      
      for (let i = 0; i < Math.max(newDetailedScore.player1_sets.length, newDetailedScore.player2_sets.length); i++) {
        const p1Games = newDetailedScore.player1_sets[i] || 0
        const p2Games = newDetailedScore.player2_sets[i] || 0
        
        if (p1Games > p2Games && p1Games >= prev.match_format.games_per_set) {
          player1Score++
        } else if (p2Games > p1Games && p2Games >= prev.match_format.games_per_set) {
          player2Score++
        }
      }
      
      return {
        ...prev,
        detailed_score: newDetailedScore,
        player1_score: player1Score,
        player2_score: player2Score
      }
    })
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

          {/* Match Format */}
          <div style={{
            padding: '20px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #e0e0e0'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              marginBottom: '16px',
              color: 'var(--text-primary)'
            }}>
              Match Format
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
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
                  Number of Sets
                </label>
                                 <select
                   value={formData.match_format.sets}
                   onChange={(e) => handleFormatChange('sets', parseInt(e.target.value))}
                   style={{
                     width: '100%',
                     padding: '12px 16px',
                     border: '2px solid #e0e0e0',
                     borderRadius: '8px',
                     fontSize: '16px',
                     backgroundColor: 'white',
                     transition: 'border-color 0.2s ease',
                     appearance: 'none',
                     backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2212%22%20height%3D%228%22%20viewBox%3D%220%200%2012%208%22%3E%3Cpath%20fill%3D%22%23666%22%20d%3D%22M1.41%200L6%204.59%2010.59%200%2012%201.41%206%207.41%200%201.41z%22/%3E%3C/svg%3E")',
                     backgroundRepeat: 'no-repeat',
                     backgroundPosition: 'right 12px center',
                     backgroundSize: '12px 8px',
                     paddingRight: '36px'
                   }}
                   onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                   onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                 >
                  <option value={1}>1</option>
                  <option value={3}>3</option>
                  <option value={5}>5</option>
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
                  Games per Set
                </label>
                                 <select
                   value={formData.match_format.games_per_set}
                   onChange={(e) => handleFormatChange('games_per_set', parseInt(e.target.value))}
                   style={{
                     width: '100%',
                     padding: '12px 16px',
                     border: '2px solid #e0e0e0',
                     borderRadius: '8px',
                     fontSize: '16px',
                     backgroundColor: 'white',
                     transition: 'border-color 0.2s ease',
                     appearance: 'none',
                     backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2212%22%20height%3D%228%22%20viewBox%3D%220%200%2012%208%22%3E%3Cpath%20fill%3D%22%23666%22%20d%3D%22M1.41%200L6%204.59%2010.59%200%2012%201.41%206%207.41%200%201.41z%22/%3E%3C/svg%3E")',
                     backgroundRepeat: 'no-repeat',
                     backgroundPosition: 'right 12px center',
                     backgroundSize: '12px 8px',
                     paddingRight: '36px'
                   }}
                   onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                   onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                 >
                  <option value={4}>4</option>
                  <option value={6}>6</option>
                  <option value={8}>8</option>
                </select>
              </div>
              

            </div>
          </div>

          {/* Detailed Score Inputs (only show if completed) */}
          {formData.status === 'completed' && (
            <div style={{
              padding: '20px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #e0e0e0'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                marginBottom: '16px',
                color: 'var(--text-primary)'
              }}>
                Set Scores
              </h3>
              
              <div style={{ marginBottom: '16px' }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr repeat(' + formData.match_format.sets + ', 1fr)',
                  gap: '8px',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>Player</div>
                  {Array.from({ length: formData.match_format.sets }, (_, i) => (
                    <div key={i} style={{ 
                      fontWeight: '600', 
                      color: 'var(--text-primary)', 
                      textAlign: 'center' 
                    }}>
                      Set {i + 1}
                    </div>
                  ))}
                </div>
                
                {/* Player 1 Score Row */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr repeat(' + formData.match_format.sets + ', 1fr)',
                  gap: '8px',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <div style={{ 
                    fontWeight: '500', 
                    color: 'var(--text-primary)',
                    fontSize: '14px'
                  }}>
                    {getPlayerName(match.player1_id)}
                  </div>
                  {Array.from({ length: formData.match_format.sets }, (_, setIndex) => (
                                         <input
                       key={setIndex}
                       type="text"
                       inputMode="numeric"
                       pattern="[0-9]*"
                       value={formData.detailed_score.player1_sets[setIndex] || ''}
                       onChange={(e) => {
                         const value = e.target.value.replace(/[^0-9]/g, '')
                         handleSetScoreChange(setIndex, 'player1', value === '' ? null : parseInt(value))
                       }}
                       style={{
                         width: '100%',
                         padding: '8px',
                         border: '2px solid #e0e0e0',
                         borderRadius: '6px',
                         fontSize: '14px',
                         textAlign: 'center',
                         transition: 'border-color 0.2s ease'
                       }}
                       onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                       onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                       placeholder="0"
                     />
                  ))}
                </div>
                
                {/* Player 2 Score Row */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr repeat(' + formData.match_format.sets + ', 1fr)',
                  gap: '8px',
                  alignItems: 'center'
                }}>
                  <div style={{ 
                    fontWeight: '500', 
                    color: 'var(--text-primary)',
                    fontSize: '14px'
                  }}>
                    {getPlayerName(match.player2_id)}
                  </div>
                  {Array.from({ length: formData.match_format.sets }, (_, setIndex) => (
                                         <input
                       key={setIndex}
                       type="text"
                       inputMode="numeric"
                       pattern="[0-9]*"
                       value={formData.detailed_score.player2_sets[setIndex] || ''}
                       onChange={(e) => {
                         const value = e.target.value.replace(/[^0-9]/g, '')
                         handleSetScoreChange(setIndex, 'player2', value === '' ? null : parseInt(value))
                       }}
                       style={{
                         width: '100%',
                         padding: '8px',
                         border: '2px solid #e0e0e0',
                         borderRadius: '6px',
                         fontSize: '14px',
                         textAlign: 'center',
                         transition: 'border-color 0.2s ease'
                       }}
                       onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                       onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                       placeholder="0"
                     />
                  ))}
                </div>
              </div>
              
              {/* Match Summary */}
              <div style={{
                padding: '12px',
                backgroundColor: 'white',
                borderRadius: '6px',
                border: '1px solid #e0e0e0'
              }}>
                <div style={{
                  fontSize: '14px',
                  color: 'var(--text-secondary)',
                  marginBottom: '4px'
                }}>
                  Match Score (Sets Won):
                </div>
                <div style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: 'var(--text-primary)'
                }}>
                  {getPlayerName(match.player1_id)}: {formData.player1_score} - {getPlayerName(match.player2_id)}: {formData.player2_score}
                </div>
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
