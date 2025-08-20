import React, { useState, useEffect } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { matchAPI, userAPI, tournamentAPI } from '../lib/api'

interface EditMatchModalProps {
  match: {
    id: string
    tournament_id: string
    player1_id: string
    player2_id: string
    games_per_set: number
    sets_per_match: number
    court: string
    player1_score: number
    player2_score: number
    status: string
    winner_id?: string
    sets?: Array<{
      id: string
      set_number: number
      player1_games: number
      player2_games: number
    }>
  }
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const EditMatchModal: React.FC<EditMatchModalProps> = ({ match, isOpen, onClose, onSuccess }) => {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    sets: match.sets?.map(set => ({
      set_number: set.set_number,
      player1_games: set.player1_games > 0 ? set.player1_games : '',
      player2_games: set.player2_games > 0 ? set.player2_games : ''
    })) || Array.from({ length: match.sets_per_match || 3 }, (_, index) => ({
      set_number: index + 1,
      player1_games: '',
      player2_games: ''
    })),
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

  const updateSet = (setIndex: number, field: 'player1_games' | 'player2_games', value: string | number) => {
    const updatedSets = [...formData.sets]
    updatedSets[setIndex] = { ...updatedSets[setIndex], [field]: value }
    setFormData({ ...formData, sets: updatedSets })
  }

    const updateMatchMutation = useMutation({
    mutationFn: async () => {
      // Update court and other basic fields
      await matchAPI.updateMatch(match.id, {
        court: formData.court,
        player1_id: match.player1_id,
        player2_id: match.player2_id,
        player1_score: 0, // Will be calculated from sets
        player2_score: 0  // Will be calculated from sets
      })

      // If status is being set to completed, update sets and determine winner
      if (formData.status === 'completed') {
        // Filter out empty sets and convert to numbers
        const validSets = formData.sets
          .filter(set => set.player1_games !== '' || set.player2_games !== '')
          .map(set => ({
            set_number: set.set_number,
            player1_games: set.player1_games === '' ? 0 : Number(set.player1_games) || 0,
            player2_games: set.player2_games === '' ? 0 : Number(set.player2_games) || 0
          }))
        
        await matchAPI.updateMatchSets(match.id, { sets: validSets })
      } else {
        // Update status if changed
        if (formData.status !== match.status) {
          await matchAPI.updateMatchStatus(match.id, formData.status as 'scheduled' | 'in_progress' | 'completed')
        }
      }
    },
    onSuccess: () => {
      // Invalidate all match-related queries
      queryClient.invalidateQueries({ queryKey: ['matches'] })
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] })
      // Also invalidate tournament-specific match queries
      if (match.tournament_id) {
        queryClient.invalidateQueries({ queryKey: ['tournament', match.tournament_id, 'matches'] })
      }
      onSuccess()
      onClose()
    },
    onError: (error) => {
      alert(error instanceof Error ? error.message : 'Failed to update match')
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate that completed matches have valid scores
    if (formData.status === 'completed') {
      const validSets = formData.sets.filter(set => set.player1_games !== '' || set.player2_games !== '')
      
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
    
    updateMatchMutation.mutate()
  }

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

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
      zIndex: 1000,
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '20px',
        maxWidth: '500px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        position: 'relative'
      }}>
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: '#666',
            width: '44px',
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f0f0f0'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
          }}
        >
          ×
        </button>

        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ 
            fontSize: '24px', 
            fontWeight: 'bold', 
            color: 'var(--primary-color)', 
            margin: '0 0 16px 0',
            paddingRight: '40px' // Space for close button
          }}>
            Edit Match
          </h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 12px 0' }}>
              {getPlayerName(match.player1_id)} vs {getPlayerName(match.player2_id)}
            </h3>
            <p style={{ color: '#666', margin: '0 0 8px 0', fontSize: '14px' }}>
              <strong>Tournament:</strong> {tournament?.name || 'Loading...'}
            </p>
            <p style={{ color: '#666', margin: 0, fontSize: '14px' }}>
              <strong>Format:</strong> {match.sets_per_match} sets, {match.games_per_set} games per set
            </p>
          </div>

          <div style={{ display: 'grid', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Court</label>
              <input
                type="text"
                className="form-input"
                value={formData.court}
                onChange={(e) => setFormData({ ...formData, court: e.target.value })}
                placeholder="Enter court name"
              />
            </div>

                         {/* Set Scores */}
             <div style={{ marginTop: '16px' }}>
               <h4 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--primary-color)', marginBottom: '12px' }}>
                 Set Scores
               </h4>
               {formData.sets.map((set, index) => (
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
                     <label className="form-label">Set {set.set_number} - {getPlayerName(match.player1_id)} Games</label>
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
                     <label className="form-label">Set {set.set_number} - {getPlayerName(match.player2_id)} Games</label>
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

            <div className="form-group">
              <label className="form-label">Match Status</label>
              <select
                className="form-input"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                style={{ fontSize: '16px' }} // Prevent zoom on iOS
              >
                <option value="scheduled">Scheduled</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div style={{ 
            display: 'flex', 
            gap: '12px', 
            marginTop: '24px',
            flexDirection: 'column' // Stack buttons on mobile
          }} className="mobile-btn-group">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              style={{ flex: 1, minHeight: '44px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 1, minHeight: '44px' }}
              disabled={updateMatchMutation.isPending}
            >
              {updateMatchMutation.isPending ? 'Updating...' : 'Update Match'}
            </button>
          </div>
        </form>

        {/* Mobile-specific styles */}
        <style jsx>{`
          @media (max-width: 768px) {
            .mobile-grid {
              grid-template-columns: 1fr !important;
            }
            .mobile-btn-group {
              flex-direction: column !important;
            }
          }
          
          @media (min-width: 769px) {
            .mobile-grid {
              grid-template-columns: 1fr 1fr !important;
            }
            .mobile-btn-group {
              flex-direction: row !important;
            }
          }
        `}</style>
      </div>
    </div>
  )
}

export default EditMatchModal
