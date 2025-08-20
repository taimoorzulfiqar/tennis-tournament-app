import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { tournamentAPI, userAPI, matchAPI } from '../lib/api'
import { useAuth } from '../hooks/useAuth'

interface Match {
  player1_id: string
  player2_id: string
  games_per_set: number
  sets_per_match: number
  court: string
  sets: Array<{
    set_number: number
    player1_games: string | number
    player2_games: string | number
  }>
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
      games_per_set: 6,
      sets_per_match: 3,
      court: '',
      sets: [
        { set_number: 1, player1_games: '', player2_games: '' },
        { set_number: 2, player1_games: '', player2_games: '' },
        { set_number: 3, player1_games: '', player2_games: '' }
      ],
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
             games_per_set: match.games_per_set || 6,
             sets_per_match: match.sets_per_match || 3,
             court: match.court,
             player1_score: 0, // Will be calculated from sets
             player2_score: 0  // Will be calculated from sets
           })

           // If match is marked as completed, update its sets and determine winner
           if (match.is_completed) {
             // Filter out empty sets and convert to numbers
             const validSets = match.sets
               .filter(set => set.player1_games !== '' || set.player2_games !== '')
               .map(set => ({
                 set_number: set.set_number,
                 player1_games: set.player1_games === '' ? 0 : Number(set.player1_games) || 0,
                 player2_games: set.player2_games === '' ? 0 : Number(set.player2_games) || 0
               }))
             
             // Use updateMatchSets to properly set winner_id and status
             await matchAPI.updateMatchSets(createdMatch.id!, {
               sets: validSets
             })
           }
         }
      }
      
      return createdTournament
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] })
      alert('Tournament created successfully!')
      navigate('/')
    },
    onError: (error) => {
      alert(error instanceof Error ? error.message : 'Failed to create tournament')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!tournament.name || !tournament.start_date) {
      alert('Please fill in all required fields.')
      return
    }

    // Only validate matches if not creating without matches
    if (!createWithoutMatches) {
      // Validate matches
      for (let i = 0; i < matches.length; i++) {
        const match = matches[i]
        if (!match.player1_id || !match.player2_id) {
          alert(`Please fill in all required fields for match ${i + 1}`)
          return
        }
        if (match.player1_id === match.player2_id) {
          alert(`Match ${i + 1}: Player 1 and Player 2 cannot be the same`)
          return
        }
        
        // Validate that completed matches have valid scores
        if (match.is_completed) {
          const validSets = match.sets.filter(set => set.player1_games !== '' || set.player2_games !== '')
          
          if (validSets.length === 0) {
            alert(`Match ${i + 1}: Completed matches must have valid scores. Please enter scores for at least one set.`)
            return
          }
          
          // Check that each set has valid scores
          for (const set of validSets) {
            const player1Games = set.player1_games === '' ? 0 : Number(set.player1_games) || 0
            const player2Games = set.player2_games === '' ? 0 : Number(set.player2_games) || 0
            
            if (player1Games === 0 && player2Games === 0) {
              alert(`Match ${i + 1}, Set ${set.set_number}: Please enter valid scores for both players.`)
              return
            }
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
        games_per_set: 6,
        sets_per_match: 3,
        court: '',
        sets: [
          { set_number: 1, player1_games: '', player2_games: '' },
          { set_number: 2, player1_games: '', player2_games: '' },
          { set_number: 3, player1_games: '', player2_games: '' }
        ],
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
    if (field === 'sets_per_match') {
      const newSetsCount = Number(value) || 3
      const newSets = Array.from({ length: newSetsCount }, (_, setIndex) => ({
        set_number: setIndex + 1,
        player1_games: '',
        player2_games: ''
      }))
      updatedMatches[index] = { ...updatedMatches[index], [field]: value, sets: newSets }
    } else {
      updatedMatches[index] = { ...updatedMatches[index], [field]: value }
    }
    setMatches(updatedMatches)
  }

  const updateSet = (matchIndex: number, setIndex: number, field: 'player1_games' | 'player2_games', value: string | number) => {
    const updatedMatches = [...matches]
    const updatedSets = [...updatedMatches[matchIndex].sets]
    updatedSets[setIndex] = { ...updatedSets[setIndex], [field]: value }
    updatedMatches[matchIndex] = { ...updatedMatches[matchIndex], sets: updatedSets }
    setMatches(updatedMatches)
  }

  if (playersLoading) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="spinner" style={{ margin: '0 auto 20px' }}></div>
          <p>Loading players...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
          <button
            onClick={() => navigate('/')}
            className="btn btn-secondary"
            style={{ marginRight: '16px' }}
          >
            ← Back
          </button>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--primary-color)', margin: 0 }}>
            Create Tournament
          </h1>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Tournament Details */}
          <div className="card" style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--primary-color)', marginBottom: '20px' }}>
              Tournament Information
            </h2>
            
            <div className="form-group">
              <label className="form-label">Tournament Name *</label>
              <input
                type="text"
                className="form-input"
                value={tournament.name}
                onChange={(e) => setTournament({ ...tournament, name: e.target.value })}
                placeholder="Enter tournament name"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-input"
                value={tournament.description}
                onChange={(e) => setTournament({ ...tournament, description: e.target.value })}
                placeholder="Enter tournament description"
                rows={3}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Start Date *</label>
                <input
                  type="date"
                  className="form-input"
                  value={tournament.start_date}
                  onChange={(e) => setTournament({ ...tournament, start_date: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">End Date (Optional)</label>
                <input
                  type="date"
                  className="form-input"
                  value={tournament.end_date}
                  onChange={(e) => setTournament({ ...tournament, end_date: e.target.value })}
                />
              </div>
            </div>

            {/* Option to create without matches */}
            <div style={{ marginTop: '20px', padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={createWithoutMatches}
                  onChange={(e) => setCreateWithoutMatches(e.target.checked)}
                  style={{ width: '16px', height: '16px' }}
                />
                <span style={{ fontSize: '14px', color: '#666' }}>
                  Create tournament without initial matches (you can add matches later)
                </span>
              </label>
            </div>
          </div>

          {/* Matches - only show if not creating without matches */}
          {!createWithoutMatches && (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--primary-color)', margin: 0 }}>
                  Tournament Matches
                </h2>
                <button
                  type="button"
                  onClick={addMatch}
                  className="btn btn-secondary"
                  style={{ padding: '8px 16px', fontSize: '14px' }}
                >
                  ➕ Add Match
                </button>
              </div>

              {matches.map((match, index) => (
                <div key={index} className="card" style={{ marginBottom: '16px', backgroundColor: '#f8f9fa' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#333', margin: 0 }}>
                      Match {index + 1}
                    </h3>
                    {matches.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMatch(index)}
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                      >
                        🗑️ Remove
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">Player 1 *</label>
                      <select
                        className="form-input"
                        value={match.player1_id}
                        onChange={(e) => updateMatch(index, 'player1_id', e.target.value)}
                        required
                      >
                        <option value="">Select Player 1</option>
                        {players?.map((player) => (
                          <option key={player.id} value={player.id}>
                            {player.full_name || player.email}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Player 2 *</label>
                      <select
                        className="form-input"
                        value={match.player2_id}
                        onChange={(e) => updateMatch(index, 'player2_id', e.target.value)}
                        required
                      >
                        <option value="">Select Player 2</option>
                        {players?.map((player) => (
                          <option key={player.id} value={player.id}>
                            {player.full_name || player.email}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">Games per Set</label>
                      <input
                        type="number"
                        className="form-input"
                        value={match.games_per_set}
                        onChange={(e) => updateMatch(index, 'games_per_set', parseInt(e.target.value))}
                        min="1"
                        max="10"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Sets per Match</label>
                      <input
                        type="number"
                        className="form-input"
                        value={match.sets_per_match}
                        onChange={(e) => updateMatch(index, 'sets_per_match', parseInt(e.target.value))}
                        min="1"
                        max="5"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Court</label>
                    <input
                      type="text"
                      className="form-input"
                      value={match.court}
                      onChange={(e) => updateMatch(index, 'court', e.target.value)}
                      placeholder="e.g., Court 1, Center Court"
                    />
                  </div>

                                                                       {/* Set Scores */}
                    <div style={{ marginTop: '16px' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--primary-color)', marginBottom: '12px' }}>
                        Set Scores
                      </h4>
                      {match.sets.map((set, setIndex) => (
                        <div key={setIndex} style={{ 
                          display: 'grid', 
                          gridTemplateColumns: '1fr 1fr', 
                          gap: '16px',
                          marginBottom: '8px',
                          padding: '8px',
                          backgroundColor: '#f0f0f0',
                          borderRadius: '4px'
                        }}>
                          <div className="form-group">
                            <label className="form-label">Set {set.set_number} - Player 1 Games</label>
                            <input
                              type="number"
                              className="form-input"
                              value={set.player1_games}
                              onChange={(e) => updateSet(index, setIndex, 'player1_games', e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                              min="0"
                              placeholder="Enter games won"
                            />
                          </div>

                          <div className="form-group">
                            <label className="form-label">Set {set.set_number} - Player 2 Games</label>
                            <input
                              type="number"
                              className="form-input"
                              value={set.player2_games}
                              onChange={(e) => updateSet(index, setIndex, 'player2_games', e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                              min="0"
                              placeholder="Enter games won"
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                  <div style={{ marginTop: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={match.is_completed}
                        onChange={(e) => updateMatch(index, 'is_completed', e.target.checked)}
                        style={{ width: '16px', height: '16px' }}
                      />
                      <span style={{ fontSize: '14px', color: '#666' }}>
                        Mark this match as completed
                      </span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="btn btn-secondary"
              style={{ flex: 1 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 1 }}
              disabled={createTournamentMutation.isPending}
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
