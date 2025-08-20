import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { tournamentAPI, userAPI } from '../lib/api'
import { useAuth } from '../hooks/useAuth'

interface Match {
  player1_id: string
  player2_id: string
  games_per_set: number
  sets_per_match: number
  court: string
  start_time: string
  player1_score: number
  player2_score: number
}

const CreateTournament: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [tournament, setTournament] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: ''
  })
  const [matches, setMatches] = useState<Match[]>([
    {
      player1_id: '',
      player2_id: '',
      games_per_set: 6,
      sets_per_match: 3,
      court: '',
      start_time: '',
      player1_score: 0,
      player2_score: 0
    }
  ])

  // Fetch players for selection
  const { data: players, isLoading: playersLoading } = useQuery({
    queryKey: ['players'],
    queryFn: async () => {
      const allUsers = await userAPI.getUsers()
      return allUsers.filter(u => u.role === 'player')
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
      
      // Then create all matches for the tournament
      for (const match of matches) {
        await tournamentAPI.createMatch({
          tournament_id: createdTournament.id,
          ...match
        })
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

    // Validate matches
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i]
      if (!match.player1_id || !match.player2_id || !match.court || !match.start_time) {
        alert(`Please fill in all fields for match ${i + 1}`)
        return
      }
      if (match.player1_id === match.player2_id) {
        alert(`Match ${i + 1}: Player 1 and Player 2 cannot be the same`)
        return
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
      start_time: '',
      player1_score: 0,
      player2_score: 0
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Court *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={match.court}
                      onChange={(e) => updateMatch(index, 'court', e.target.value)}
                      placeholder="e.g., Court 1, Center Court"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Start Time *</label>
                    <input
                      type="datetime-local"
                      className="form-input"
                      value={match.start_time}
                      onChange={(e) => updateMatch(index, 'start_time', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Player 1 Score</label>
                    <input
                      type="number"
                      className="form-input"
                      value={match.player1_score}
                      onChange={(e) => updateMatch(index, 'player1_score', parseInt(e.target.value) || 0)}
                      min="0"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Player 2 Score</label>
                    <input
                      type="number"
                      className="form-input"
                      value={match.player2_score}
                      onChange={(e) => updateMatch(index, 'player2_score', parseInt(e.target.value) || 0)}
                      min="0"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

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
