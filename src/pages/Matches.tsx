import React, { useState } from 'react'
import Layout from '../components/Layout'
import { useQuery } from '@tanstack/react-query'
import { matchAPI, userAPI } from '../lib/api'
import EditMatchModal from '../components/EditMatchModal'
import { useAuth } from '../hooks/useAuth'

const Matches: React.FC = () => {
  const { user } = useAuth()
  const [selectedMatch, setSelectedMatch] = useState<any>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const { data: matches, isLoading: matchesLoading } = useQuery({
    queryKey: ['matches'],
    queryFn: () => matchAPI.getMatches(),
  })

  const { data: players, isLoading: playersLoading } = useQuery({
    queryKey: ['players'],
    queryFn: async () => {
      const allUsers = await userAPI.getUsers()
      return allUsers.filter(u => u.role === 'player')
    },
  })

  const getPlayerName = (playerId: string) => {
    const player = players?.find(p => p.id === playerId)
    return player?.full_name || player?.email || 'Unknown Player'
  }

  const handleEditMatch = (match: any) => {
    setSelectedMatch(match)
    setIsEditModalOpen(true)
  }

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false)
    setSelectedMatch(null)
  }

  if (matchesLoading || playersLoading) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="spinner" style={{ margin: '0 auto 20px' }}></div>
          <p>Loading matches...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#2E7D32', marginBottom: '24px' }}>
          Matches
        </h1>

        {matches && matches.length > 0 ? (
          <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))' }}>
            {matches.map((match) => (
              <div key={match.id} className="card">
                <div className="card-header">
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#2E7D32', margin: 0 }}>
                    Match #{match.id.slice(0, 8)}
                  </h3>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600',
                    backgroundColor: match.status === 'completed' ? '#4caf5020' : 
                                   match.status === 'in_progress' ? '#ff980020' : '#66620',
                    color: match.status === 'completed' ? '#4caf50' : 
                          match.status === 'in_progress' ? '#ff9800' : '#666'
                  }}>
                    {match.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <p style={{ fontSize: '14px', color: '#666', margin: '4px 0' }}>
                    <strong>Court:</strong> {match.court}
                  </p>
                  <p style={{ fontSize: '14px', color: '#666', margin: '4px 0' }}>
                    <strong>Time:</strong> {new Date(match.scheduled_time).toLocaleString()}
                  </p>
                </div>

                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '12px',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '8px'
                }}>
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <p style={{ fontWeight: 'bold', margin: '0 0 4px 0' }}>{getPlayerName(match.player1_id)}</p>
                    <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#2E7D32', margin: 0 }}>
                      {match.player1_score}
                    </p>
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#666' }}>VS</div>
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <p style={{ fontWeight: 'bold', margin: '0 0 4px 0' }}>{getPlayerName(match.player2_id)}</p>
                    <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#2E7D32', margin: 0 }}>
                      {match.player2_score}
                    </p>
                  </div>
                </div>

                {match.winner_id && (
                  <p style={{ 
                    textAlign: 'center', 
                    marginTop: '12px', 
                    fontWeight: 'bold', 
                    color: '#4caf50' 
                  }}>
                    🏆 Winner: {getPlayerName(match.winner_id)}
                  </p>
                )}

                {(user?.role === 'admin' || user?.role === 'master') && (
                  <div style={{ marginTop: '16px', textAlign: 'center' }}>
                    <button
                      onClick={() => handleEditMatch(match)}
                      className="btn btn-secondary"
                      style={{ padding: '8px 16px', fontSize: '14px' }}
                    >
                      ✏️ Edit Match
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>🎾</div>
            <h2 style={{ fontSize: '24px', color: '#666', marginBottom: '12px' }}>
              No matches yet
            </h2>
            <p style={{ color: '#999', marginBottom: '24px' }}>
              Matches will appear here once they are scheduled.
            </p>
          </div>
        )}
      </div>

      {selectedMatch && (
        <EditMatchModal
          match={selectedMatch}
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          onSuccess={() => {
            // The modal will handle cache invalidation
          }}
        />
      )}
    </Layout>
  )
}

export default Matches
