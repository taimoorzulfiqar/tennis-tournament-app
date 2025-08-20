import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { useQuery } from '@tanstack/react-query'
import { tournamentAPI } from '../lib/api'
import { useAuth } from '../hooks/useAuth'

const TournamentDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const { data: tournament, isLoading } = useQuery({
    queryKey: ['tournament', id],
    queryFn: () => tournamentAPI.getTournament(id!),
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="spinner" style={{ margin: '0 auto 20px' }}></div>
          <p>Loading tournament...</p>
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

  const getStatusColor = () => {
    const startDate = new Date(tournament.start_date)
    const endDate = tournament.end_date ? new Date(tournament.end_date) : null
    const now = new Date()

    if (endDate && now > endDate) return '#f44336' // Red for completed
    if (now >= startDate) return 'var(--primary-color)' // Green for active
    return 'var(--accent-color)' // Gold for upcoming
  }

  const getStatusText = () => {
    const startDate = new Date(tournament.start_date)
    const endDate = tournament.end_date ? new Date(tournament.end_date) : null
    const now = new Date()

    if (endDate && now > endDate) return 'Completed'
    if (now >= startDate) return 'Active'
    return 'Upcoming'
  }

  return (
    <Layout>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button
              onClick={() => navigate('/')}
              className="btn btn-secondary"
              style={{ marginRight: '16px' }}
            >
              ← Back
            </button>
            <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--primary-color)', margin: 0 }}>
              Tournament Details
            </h1>
          </div>
          {(user?.role === 'master' || (user?.role === 'admin' && user?.verification_status === 'approved')) && (
            <button
              onClick={() => navigate(`/edit-tournament/${id}`)}
              className="btn btn-primary"
            >
              ✏️ Edit Tournament
            </button>
          )}
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <div>
              <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--primary-color)', margin: '0 0 8px 0' }}>
                {tournament.name}
              </h2>
              {tournament.description && (
                <p style={{ color: '#666', fontSize: '16px', margin: '0 0 16px 0' }}>
                  {tournament.description}
                </p>
              )}
            </div>
            <span style={{
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: '600',
              backgroundColor: getStatusColor() + '20',
              color: getStatusColor()
            }}>
              {getStatusText()}
            </span>
          </div>

          <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <div style={{ backgroundColor: '#f5f5f5', padding: '16px', borderRadius: '8px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 8px 0', color: '#333' }}>
                Start Date
              </h3>
              <p style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--primary-color)', margin: 0 }}>
                {new Date(tournament.start_date).toLocaleDateString()}
              </p>
            </div>

            {tournament.end_date && (
              <div style={{ backgroundColor: '#f5f5f5', padding: '16px', borderRadius: '8px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 8px 0', color: '#333' }}>
                  End Date
                </h3>
                <p style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--primary-color)', margin: 0 }}>
                  {new Date(tournament.end_date).toLocaleDateString()}
                </p>
              </div>
            )}

            <div style={{ backgroundColor: '#f5f5f5', padding: '16px', borderRadius: '8px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 8px 0', color: '#333' }}>
                Created
              </h3>
              <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
                {new Date(tournament.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #e0e0e0' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--primary-color)', margin: '0 0 16px 0' }}>
              Tournament Actions
            </h3>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button 
                onClick={() => navigate('/matches')}
                className="btn btn-primary"
              >
                🎾 View Matches
              </button>
              {(user?.role === 'master' || (user?.role === 'admin' && user?.verification_status === 'approved')) && (
                <button 
                  onClick={() => navigate(`/add-match/${id}`)}
                  className="btn btn-secondary"
                >
                  ➕ Add Match
                </button>
              )}
              <button 
                onClick={() => navigate('/leaderboard')}
                className="btn btn-secondary"
              >
                📊 View Leaderboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default TournamentDetails
