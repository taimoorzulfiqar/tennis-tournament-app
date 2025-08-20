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
    scheduled_time: string
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
    scheduled_time: match.scheduled_time.split('T')[0] + 'T' + match.scheduled_time.split('T')[1].substring(0, 5)
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
        court: formData.court,
        scheduled_time: new Date(formData.scheduled_time).toISOString()
      }

      // Update match details
      await matchAPI.updateMatch(match.id, updates)

      // Update status if changed
      if (formData.status !== match.status) {
        await matchAPI.updateMatchStatus(match.id, formData.status as 'scheduled' | 'in_progress' | 'completed')
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
        maxWidth: '500px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--primary-color)', margin: 0 }}>
            Edit Match
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#666'
            }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 12px 0' }}>
              {getPlayerName(match.player1_id)} vs {getPlayerName(match.player2_id)}
            </h3>
            <p style={{ color: '#666', margin: '0 0 8px 0' }}>
              <strong>Tournament:</strong> {match.tournament_id}
            </p>
            <p style={{ color: '#666', margin: 0 }}>
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
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Scheduled Time</label>
              <input
                type="datetime-local"
                className="form-input"
                value={formData.scheduled_time}
                onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">{getPlayerName(match.player1_id)} Score</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.player1_score}
                  onChange={(e) => setFormData({ ...formData, player1_score: parseInt(e.target.value) || 0 })}
                  min="0"
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
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Match Status</label>
              <select
                className="form-input"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="scheduled">Scheduled</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              style={{ flex: 1 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 1 }}
              disabled={updateMatchMutation.isPending}
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
