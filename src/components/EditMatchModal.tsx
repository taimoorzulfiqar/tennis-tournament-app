import React, { useState, useEffect } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { matchAPI, userAPI } from '../lib/api'

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

  const getPlayerName = (playerId: string) => {
    const player = players?.find(p => p.id === playerId)
    return player?.full_name || player?.email || 'Unknown Player'
  }

  const updateMatchMutation = useMutation({
    mutationFn: async () => {
      const updates: any = {
        player1_score: formData.player1_score,
        player2_score: formData.player2_score,
        court: formData.court
      }

      // If status is being set to completed, use updateMatchScore to set winner_id
      if (formData.status === 'completed') {
        await matchAPI.updateMatchScore(match.id, {
          player1_score: formData.player1_score,
          player2_score: formData.player2_score
        })
        // Update other fields separately
        await matchAPI.updateMatch(match.id, {
          court: formData.court,
          player1_id: match.player1_id,
          player2_id: match.player2_id,
          player1_score: formData.player1_score,
          player2_score: formData.player2_score
        })
      } else {
        // Update match details normally
        await matchAPI.updateMatch(match.id, updates)

        // Update status if changed
        if (formData.status !== match.status) {
          await matchAPI.updateMatchStatus(match.id, formData.status as 'scheduled' | 'in_progress' | 'completed')
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] })
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] })
      onSuccess()
      onClose()
    },
    onError: (error) => {
      alert(error instanceof Error ? error.message : 'Failed to update match')
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
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
              <strong>Tournament:</strong> {match.tournament_id}
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

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '16px',
              gridTemplateColumns: '1fr' // Single column on mobile
            }} className="mobile-grid">
              <div className="form-group">
                <label className="form-label">{getPlayerName(match.player1_id)} Score</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.player1_score}
                  onChange={(e) => setFormData({ ...formData, player1_score: parseInt(e.target.value) || 0 })}
                  min="0"
                  placeholder="Enter score"
                />
              </div>

              <div className="form-group">
                <label className="form-label">{getPlayerName(match.player2_id)} Score</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.player2_score}
                  onChange={(e) => setFormData({ ...formData, player2_score: parseInt(e.target.value) || 0 })}
                  min="0"
                  placeholder="Enter score"
                />
              </div>
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
