import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { tournamentAPI } from '../lib/api'
import { useAuth } from '../hooks/useAuth'

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

  const createTournamentMutation = useMutation({
    mutationFn: (tournamentData: any) => tournamentAPI.createTournament(tournamentData, user!.id),
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

    createTournamentMutation.mutate(tournament)
  }

  return (
    <Layout>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
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

        <div className="card">
          <form onSubmit={handleSubmit}>
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
                rows={4}
              />
            </div>

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
      </div>
    </Layout>
  )
}

export default CreateTournament
