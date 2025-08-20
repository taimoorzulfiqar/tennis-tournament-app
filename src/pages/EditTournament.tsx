import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { tournamentAPI, userAPI, matchAPI } from '../lib/api'
import { useAuth } from '../hooks/useAuth'

interface Match {
  id?: string
  player1_id: string
  player2_id: string
  games_per_set: number
  sets_per_match: number
  court: string
  player1_score: string | number
  player2_score: string | number
  is_completed: boolean
}

const EditTournament: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // Redirect if user is not authorized to edit tournaments
  React.useEffect(() => {
    if (user && !(
      user.role === 'master' || 
      (user.role === 'admin' && user.verification_status === 'approved')
    )) {
      navigate('/')
      alert('Access denied. Only approved admins and master users can edit tournaments.')
    }
  }, [user, navigate])
  
  const [tournament, setTournament] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: ''
  })
  const [matches, setMatches] = useState<Match[]>([])

  // Fetch tournament data
  const { data: tournamentData, isLoading: tournamentLoading } = useQuery({
    queryKey: ['tournament', id],
    queryFn: () => tournamentAPI.getTournament(id!),
    enabled: !!id,
  })

  // Fetch matches for this tournament
  const { data: existingMatches, isLoading: matchesLoading } = useQuery({
    queryKey: ['matches', id],
    queryFn: () => matchAPI.getMatches(id!),
    enabled: !!id,
  })

  // Fetch players for selection
  const { data: players, isLoading: playersLoading } = useQuery({
    queryKey: ['players'],
    queryFn: async () => {
      console.log('EditTournament: Fetching players...')
      const allUsers = await userAPI.getUsers()
      console.log('EditTournament: All users:', allUsers)
      const playerUsers = allUsers.filter(u => u.role === 'player')
      console.log('EditTournament: Player users:', playerUsers)
      return playerUsers
    },
  })

  // Initialize form data when tournament and matches are loaded
  useEffect(() => {
    if (tournamentData) {
      setTournament({
        name: tournamentData.name,
        description: tournamentData.description || '',
        start_date: tournamentData.start_date.split('T')[0], // Convert to date format
        end_date: tournamentData.end_date ? tournamentData.end_date.split('T')[0] : ''
      })
    }
  }, [tournamentData])

     useEffect(() => {
     if (existingMatches) {
       setMatches(existingMatches.map(match => ({
         id: match.id,
         player1_id: match.player1_id,
         player2_id: match.player2_id,
         games_per_set: match.games_per_set || 6,
         sets_per_match: match.sets_per_match || 3,
         court: match.court,
         player1_score: match.player1_score || '',
         player2_score: match.player2_score || ''
       })))
     }
   }, [existingMatches])

  const updateTournamentMutation = useMutation({
    mutationFn: async (tournamentData: any) => {
      // Prepare tournament data - handle empty end_date
      const tournamentUpdate = {
        ...tournamentData,
        end_date: tournamentData.end_date || null // Convert empty string to null
      }
      
      // Update tournament
      const updatedTournament = await tournamentAPI.updateTournament(id!, tournamentUpdate)
      
      // Update existing matches and create new ones
      for (const match of matches) {
        if (match.id) {
                     // Update existing match - only include defined values
           const matchUpdates: any = {
             player1_id: match.player1_id,
             player2_id: match.player2_id,
             court: match.court,
             player1_score: match.player1_score === '' ? 0 : Number(match.player1_score) || 0,
             player2_score: match.player2_score === '' ? 0 : Number(match.player2_score) || 0
           }
          
          // Only add games_per_set and sets_per_match if they exist
          if (match.games_per_set !== undefined) {
            matchUpdates.games_per_set = match.games_per_set
          }
          if (match.sets_per_match !== undefined) {
            matchUpdates.sets_per_match = match.sets_per_match
          }
          
          await matchAPI.updateMatch(match.id, matchUpdates)
        } else {
          // Create new match
          await matchAPI.createMatch({
            tournament_id: id!,
            player1_id: match.player1_id,
            player2_id: match.player2_id,
            games_per_set: match.games_per_set || 6,
            sets_per_match: match.sets_per_match || 3,
            court: match.court,
             player1_score: match.player1_score === '' ? 0 : Number(match.player1_score) || 0,
             player2_score: match.player2_score === '' ? 0 : Number(match.player2_score) || 0
           })
        }
      }
      
      return updatedTournament
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] })
      queryClient.invalidateQueries({ queryKey: ['tournament', id] })
      queryClient.invalidateQueries({ queryKey: ['matches', id] })
      alert('Tournament updated successfully!')
      navigate(`/tournament/${id}`)
    },
    onError: (error) => {
      alert(error instanceof Error ? error.message : 'Failed to update tournament')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!tournament.name || !tournament.start_date) {
      alert('Please fill in all required fields.')
      return
    }

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
    }

    updateTournamentMutation.mutate(tournament)
  }

     const addMatch = () => {
     setMatches([...matches, {
       player1_id: '',
       player2_id: '',
       games_per_set: 6,
       sets_per_match: 3,
       court: '',
       player1_score: '',
       player2_score: ''
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
    setMatches(updatedMatches)
  }

  if (tournamentLoading || matchesLoading || playersLoading) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="spinner" style={{ margin: '0 auto 20px' }}></div>
          <p>Loading tournament data...</p>
        </div>
      </Layout>
    )
  }

  if (!tournamentData) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <h2>Tournament not found</h2>
          <button onClick={() => navigate('/')} className="btn btn-primary">
            Back to Tournaments
          </button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
          <button
            onClick={() => navigate(`/tournament/${id}`)}
            className="btn btn-secondary"
            style={{ marginRight: '16px' }}
          >
            ← Back
          </button>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--primary-color)', margin: 0 }}>
            Edit Tournament
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
          </div>

          {/* Matches */}
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
                    Match {index + 1} {match.id && '(Existing)'}
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
                      {players?.map((player) => {
                        console.log('EditTournament: Rendering player option:', player)
                        return (
                          <option key={player.id} value={player.id}>
                            {player.full_name || player.email}
                          </option>
                        )
                      })}
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
                      {players?.map((player) => {
                        console.log('EditTournament: Rendering player option:', player)
                        return (
                          <option key={player.id} value={player.id}>
                            {player.full_name || player.email}
                          </option>
                        )
                      })}
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

                                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                   <div className="form-group">
                     <label className="form-label">Player 1 Score</label>
                     <input
                       type="number"
                       className="form-input"
                       value={match.player1_score}
                       onChange={(e) => updateMatch(index, 'player1_score', e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                       min="0"
                       placeholder="Enter score"
                     />
                   </div>

                   <div className="form-group">
                     <label className="form-label">Player 2 Score</label>
                     <input
                       type="number"
                       className="form-input"
                       value={match.player2_score}
                       onChange={(e) => updateMatch(index, 'player2_score', e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                       min="0"
                       placeholder="Enter score"
                     />
                   </div>
                 </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button
              type="button"
              onClick={() => navigate(`/tournament/${id}`)}
              className="btn btn-secondary"
              style={{ flex: 1 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 1 }}
              disabled={updateTournamentMutation.isPending}
            >
              {updateTournamentMutation.isPending ? 'Updating...' : 'Update Tournament'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}

export default EditTournament
