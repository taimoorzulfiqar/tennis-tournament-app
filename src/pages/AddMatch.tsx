import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { matchAPI, userAPI, tournamentAPI } from '../lib/api'
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
    games_per_set: 6,
    sets_per_match: 3,
    court: '',
    sets: [
      { set_number: 1, player1_games: '', player2_games: '' },
      { set_number: 2, player1_games: '', player2_games: '' },
      { set_number: 3, player1_games: '', player2_games: '' }
    ],
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
        games_per_set: matchData.games_per_set || 6,
        sets_per_match: matchData.sets_per_match || 3,
        court: matchData.court,
        player1_score: 0, // Will be calculated from sets
        player2_score: 0  // Will be calculated from sets
      })

      // If match is marked as completed, update its sets and determine winner
      if (matchData.is_completed) {
        console.log('Match is marked as completed, updating sets...')
        
        // Filter out empty sets and convert to numbers
        const validSets = matchData.sets
          .filter(set => set.player1_games !== '' || set.player2_games !== '')
          .map(set => ({
            set_number: set.set_number,
            player1_games: set.player1_games === '' ? 0 : Number(set.player1_games) || 0,
            player2_games: set.player2_games === '' ? 0 : Number(set.player2_games) || 0
          }))
        
        console.log('Sets to update:', validSets)
        
        // Use updateMatchSets to properly set winner_id and status
        const updatedMatch = await matchAPI.updateMatchSets(createdMatch.id!, {
          sets: validSets
        })
        
        console.log('Match updated with sets and winner:', updatedMatch)
      }

      return createdMatch
    },
    onSuccess: (createdMatch) => {
      console.log('Match created successfully:', createdMatch)
      // Invalidate all match-related queries
      queryClient.invalidateQueries({ queryKey: ['matches'] })
      queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId, 'matches'] })
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] })
      alert('Match added successfully!')
      navigate(`/tournament/${tournamentId}`)
    },
    onError: (error) => {
      alert(error instanceof Error ? error.message : 'Failed to add match')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!match.player1_id || !match.player2_id) {
      alert('Please fill in all required fields.')
      return
    }
    if (match.player1_id === match.player2_id) {
      alert('Player 1 and Player 2 cannot be the same')
      return
    }
    
    // Validate that completed matches have valid scores
    if (match.is_completed) {
      const validSets = match.sets.filter(set => set.player1_games !== '' || set.player2_games !== '')
      
      if (validSets.length === 0) {
        alert('Completed matches must have valid scores. Please enter scores for at least one set.')
        return
      }
      
      // Check that each set has valid scores
      for (const set of validSets) {
        const player1Games = set.player1_games === '' ? 0 : Number(set.player1_games) || 0
        const player2Games = set.player2_games === '' ? 0 : Number(set.player2_games) || 0
        
        if (player1Games === 0 && player2Games === 0) {
          alert(`Set ${set.set_number}: Please enter valid scores for both players.`)
          return
        }
      }
    }

    createMatchMutation.mutate(match)
  }

  const updateMatch = (field: keyof Match, value: any) => {
    if (field === 'sets_per_match') {
      const newSetsCount = Number(value) || 3
      const newSets = Array.from({ length: newSetsCount }, (_, index) => ({
        set_number: index + 1,
        player1_games: '',
        player2_games: ''
      }))
      setMatch({ ...match, [field]: value, sets: newSets })
    } else {
      setMatch({ ...match, [field]: value })
    }
  }

  const updateSet = (setIndex: number, field: 'player1_games' | 'player2_games', value: string | number) => {
    const updatedSets = [...match.sets]
    updatedSets[setIndex] = { ...updatedSets[setIndex], [field]: value }
    setMatch({ ...match, sets: updatedSets })
  }

  if (tournamentLoading || playersLoading) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="spinner" style={{ margin: '0 auto 20px' }}></div>
          <p>Loading...</p>
        </div>
      </Layout>
    )
  }

  if (!tournament) {
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
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
          <button
            onClick={() => navigate(`/tournament/${tournamentId}`)}
            className="btn btn-secondary"
            style={{ marginRight: '16px' }}
          >
            ← Back
          </button>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--primary-color)', margin: 0 }}>
            Add Match
          </h1>
        </div>

        <div className="card" style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--primary-color)', marginBottom: '16px' }}>
            Tournament: {tournament.name}
          </h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="card">
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--primary-color)', marginBottom: '20px' }}>
              Match Details
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Player 1 *</label>
                <select
                  className="form-input"
                  value={match.player1_id}
                  onChange={(e) => updateMatch('player1_id', e.target.value)}
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
                  onChange={(e) => updateMatch('player2_id', e.target.value)}
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
                  onChange={(e) => updateMatch('games_per_set', parseInt(e.target.value))}
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
                  onChange={(e) => updateMatch('sets_per_match', parseInt(e.target.value))}
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
                onChange={(e) => updateMatch('court', e.target.value)}
                placeholder="e.g., Court 1, Center Court"
              />
            </div>

                         {/* Set Scores */}
             <div style={{ marginTop: '20px' }}>
               <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--primary-color)', marginBottom: '16px' }}>
                 Set Scores
               </h3>
               {match.sets.map((set, index) => (
                 <div key={index} style={{ 
                   display: 'grid', 
                   gridTemplateColumns: '1fr 1fr', 
                   gap: '16px',
                   marginBottom: '12px',
                   padding: '12px',
                   backgroundColor: '#f8f9fa',
                   borderRadius: '8px'
                 }}>
                   <div className="form-group">
                     <label className="form-label">Set {set.set_number} - Player 1 Games</label>
                     <input
                       type="number"
                       className="form-input"
                       value={set.player1_games}
                       onChange={(e) => updateSet(index, 'player1_games', e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
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
                       onChange={(e) => updateSet(index, 'player2_games', e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
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
                  onChange={(e) => updateMatch('is_completed', e.target.checked)}
                  style={{ width: '16px', height: '16px' }}
                />
                <span style={{ fontSize: '14px', color: '#666' }}>
                  Mark this match as completed
                </span>
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button
              type="button"
              onClick={() => navigate(`/tournament/${tournamentId}`)}
              className="btn btn-secondary"
              style={{ flex: 1 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 1 }}
              disabled={createMatchMutation.isPending}
            >
              {createMatchMutation.isPending ? 'Adding...' : 'Add Match'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}

export default AddMatch
