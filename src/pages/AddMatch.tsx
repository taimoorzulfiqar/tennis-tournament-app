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
  match_format: {
    sets: number
    games_per_set: number
    tiebreak_at: number
  }
  detailed_score: {
    player1_sets: (number | null)[]
    player2_sets: (number | null)[]
  }
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
    is_completed: false,
    match_format: {
      sets: 3,
      games_per_set: 6,
      tiebreak_at: 6
    },
    detailed_score: {
      player1_sets: Array(3).fill(null),
      player2_sets: Array(3).fill(null)
    }
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
      // Determine status based on whether scores are provided or match is completed
      let status: 'scheduled' | 'in_progress' | 'completed' = 'scheduled'
      if (matchData.is_completed) {
        status = 'completed'
      } else if ((matchData.player1_score && matchData.player1_score > 0) || (matchData.player2_score && matchData.player2_score > 0)) {
        status = 'in_progress'
      }

      const createdMatch = await matchAPI.createMatch({
        tournament_id: tournamentId!,
        player1_id: matchData.player1_id,
        player2_id: matchData.player2_id,
        court: matchData.court,
        player1_score: matchData.player1_score,
        player2_score: matchData.player2_score,
        status: status
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
      // Check if scores are entered
      if (!match.player1_score && !match.player2_score) {
        alert('Please enter scores for completed matches.')
        return
      }
      
      // Ensure there's a clear winner (no ties in total games won)
      if (match.player1_score === match.player2_score) {
        alert('Please enter scores that result in a clear winner. Match cannot end in a tie.')
        return
      }
    }

    createMatchMutation.mutate(match)
  }

  const handleInputChange = (field: keyof Match, value: any) => {
    setMatch(prev => {
      const newMatch = { ...prev, [field]: value }
      
      // If Player 1 is being changed and it matches the current Player 2, clear Player 2
      if (field === 'player1_id' && value === prev.player2_id) {
        newMatch.player2_id = ''
      }
      
      return newMatch
    })
  }

  const handleFormatChange = (field: keyof Match['match_format'], value: number) => {
    setMatch(prev => ({
      ...prev,
      match_format: { ...prev.match_format, [field]: value },
      detailed_score: { 
        player1_sets: Array(value).fill(null), 
        player2_sets: Array(value).fill(null) 
      } // Reset scores when format changes
    }))
  }

  const handleSetScoreChange = (setIndex: number, player: 'player1' | 'player2', games: number | null) => {
    setMatch(prev => {
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
      
      // Calculate overall match score (total games won)
      let player1Score = 0
      let player2Score = 0
      
      // Sum up all individual games won across all sets
      for (let i = 0; i < Math.max(newDetailedScore.player1_sets.length, newDetailedScore.player2_sets.length); i++) {
        const p1Games = newDetailedScore.player1_sets[i] || 0
        const p2Games = newDetailedScore.player2_sets[i] || 0
        
        player1Score += p1Games
        player2Score += p2Games
      }
      
      return {
        ...prev,
        detailed_score: newDetailedScore,
        player1_score: player1Score,
        player2_score: player2Score
      }
    })
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
                  {players?.filter(player => player.id !== match.player1_id).map((player) => (
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
                     value={match.match_format.sets}
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
                     value={match.match_format.games_per_set}
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

            {/* Score Inputs (always visible) */}
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
                  gridTemplateColumns: '2fr repeat(' + match.match_format.sets + ', 1fr)',
                  gap: '8px',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>Player</div>
                  {Array.from({ length: match.match_format.sets }, (_, i) => (
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
                  gridTemplateColumns: '2fr repeat(' + match.match_format.sets + ', 1fr)',
                  gap: '8px',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <div style={{ 
                    fontWeight: '500', 
                    color: 'var(--text-primary)',
                    fontSize: '14px'
                  }}>
                    {players?.find(p => p.id === match.player1_id)?.full_name || 'Player 1'}
                  </div>
                  {Array.from({ length: match.match_format.sets }, (_, setIndex) => (
                                         <input
                       key={setIndex}
                       type="text"
                       inputMode="numeric"
                       pattern="[0-9]*"
                       value={match.detailed_score.player1_sets[setIndex] || ''}
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
                     />
                  ))}
                </div>
                
                {/* Player 2 Score Row */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr repeat(' + match.match_format.sets + ', 1fr)',
                  gap: '8px',
                  alignItems: 'center'
                }}>
                  <div style={{ 
                    fontWeight: '500', 
                    color: 'var(--text-primary)',
                    fontSize: '14px'
                  }}>
                    {players?.find(p => p.id === match.player2_id)?.full_name || 'Player 2'}
                  </div>
                  {Array.from({ length: match.match_format.sets }, (_, setIndex) => (
                                         <input
                       key={setIndex}
                       type="text"
                       inputMode="numeric"
                       pattern="[0-9]*"
                       value={match.detailed_score.player2_sets[setIndex] || ''}
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
                  Match Score (Total Games Won):
                </div>
                <div style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: 'var(--text-primary)'
                }}>
                  {players?.find(p => p.id === match.player1_id)?.full_name || 'Player 1'}: {match.player1_score} - {players?.find(p => p.id === match.player2_id)?.full_name || 'Player 2'}: {match.player2_score}
                </div>
              </div>
            </div>

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
