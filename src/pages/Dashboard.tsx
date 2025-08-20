import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { useQuery } from '@tanstack/react-query'
import { tournamentAPI } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import { Tournament } from '../types'

const Dashboard: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newTournament, setNewTournament] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: ''
  })

  const { data: tournaments, isLoading, refetch } = useQuery({
    queryKey: ['tournaments'],
    queryFn: tournamentAPI.getTournaments,
  })

  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      await tournamentAPI.createTournament(newTournament, user.id)
      setShowCreateModal(false)
      setNewTournament({ name: '', description: '', start_date: '', end_date: '' })
      refetch()
    } catch (error) {
      console.error('Error creating tournament:', error)
      alert('Failed to create tournament')
    }
  }

  const getStatusColor = (tournament: Tournament) => {
    const startDate = new Date(tournament.start_date)
    const endDate = tournament.end_date ? new Date(tournament.end_date) : null
    const now = new Date()

    if (endDate && now > endDate) return '#f44336' // Red for completed
    if (now >= startDate) return 'var(--primary-color)' // Green for active
    return 'var(--accent-color)' // Gold for upcoming
  }

  const getStatusText = (tournament: Tournament) => {
    const startDate = new Date(tournament.start_date)
    const endDate = tournament.end_date ? new Date(tournament.end_date) : null
    const now = new Date()

    if (endDate && now > endDate) return 'Completed'
    if (now >= startDate) return 'Active'
    return 'Upcoming'
  }

  if (isLoading) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="spinner" style={{ margin: '0 auto 20px' }}></div>
          <p>Loading tournaments...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--primary-color)', margin: 0 }}>
            Academy Tournaments
          </h1>
          {(user?.role === 'master' || (user?.role === 'admin' && user?.verification_status === 'approved')) && (
            <button
              onClick={() => navigate('/create-tournament')}
              className="btn btn-primary"
            >
              🏆 Create Tournament
            </button>
          )}
        </div>

        {tournaments && tournaments.length > 0 ? (
          <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))' }}>
            {tournaments.map((tournament) => (
              <div key={tournament.id} className="card">
                <div className="card-header">
                  <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--primary-color)', margin: 0 }}>
                    {tournament.name}
                  </h3>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600',
                    backgroundColor: getStatusColor(tournament) + '20',
                    color: getStatusColor(tournament)
                  }}>
                    {getStatusText(tournament)}
                  </span>
                </div>
                
                {tournament.description && (
                  <p style={{ color: '#666', marginBottom: '16px' }}>
                    {tournament.description}
                  </p>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: '14px', color: '#666', margin: '4px 0' }}>
                      <strong>Start:</strong> {new Date(tournament.start_date).toLocaleDateString()}
                    </p>
                    {tournament.end_date && (
                      <p style={{ fontSize: '14px', color: '#666', margin: '4px 0' }}>
                        <strong>End:</strong> {new Date(tournament.end_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <button 
                    onClick={() => navigate(`/tournament/${tournament.id}`)}
                    className="btn btn-secondary"
                    style={{ padding: '8px 16px', fontSize: '14px' }}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>🏆</div>
            <h2 style={{ fontSize: '24px', color: '#666', marginBottom: '12px' }}>
              No tournaments yet
            </h2>
            <p style={{ color: '#999', marginBottom: '24px' }}>
              {user?.role === 'master' || (user?.role === 'admin' && user?.verification_status === 'approved')
                ? 'Create your first academy tournament to get started!'
                : 'Check back later for upcoming tournaments.'
              }
            </p>
            {(user?.role === 'master' || (user?.role === 'admin' && user?.verification_status === 'approved')) && (
              <button
                onClick={() => navigate('/create-tournament')}
                className="btn btn-primary"
              >
                Create Tournament
              </button>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}

export default Dashboard
