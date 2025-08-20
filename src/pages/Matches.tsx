import React, { useState } from 'react'
import Layout from '../components/Layout'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { matchAPI, userAPI } from '../lib/api'
import EditMatchModal from '../components/EditMatchModal'
import { useAuth } from '../hooks/useAuth'

const Matches: React.FC = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
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

  const deleteMatchMutation = useMutation({
    mutationFn: async (matchId: string) => {
      await matchAPI.deleteMatch(matchId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] })
      alert('Match deleted successfully!')
    },
    onError: (error) => {
      alert(error instanceof Error ? error.message : 'Failed to delete match')
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

  const handleDeleteMatch = (matchId: string) => {
    if (window.confirm('Are you sure you want to delete this match? This action cannot be undone.')) {
      deleteMatchMutation.mutate(matchId)
    }
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
        <h1 style={{ 
          fontSize: '28px', 
          fontWeight: 'bold', 
          color: '#2E7D32', 
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          Matches
        </h1>

        {matches && matches.length > 0 ? (
          <div style={{ 
            display: 'grid', 
            gap: '20px', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            maxWidth: '100%'
          }}>
            {matches.map((match, index) => (
              <div key={match.id} className="card match-card">
                <div className="card-header">
                  <h3 style={{ 
                    fontSize: '18px', 
                    fontWeight: 'bold', 
                    color: '#2E7D32', 
                    margin: 0
                  }}>
                    Match {index + 1}
                  </h3>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600',
                    backgroundColor: match.status === 'completed' ? '#4caf5020' : 
                                   match.status === 'in_progress' ? '#ff980020' : '#66620',
                    color: match.status === 'completed' ? '#4caf50' : 
                          match.status === 'in_progress' ? '#ff9800' : '#666',
                    textAlign: 'center',
                    minWidth: '80px'
                  }}>
                    {match.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>

                <div style={{ marginBottom: '12px' }}>
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
                  borderRadius: '8px',
                  marginBottom: '12px'
                }}>
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <p style={{ 
                      fontWeight: 'bold', 
                      margin: '0 0 6px 0',
                      fontSize: '13px',
                      wordBreak: 'break-word'
                    }}>
                      {getPlayerName(match.player1_id)}
                    </p>
                    <p style={{ 
                      fontSize: '24px', 
                      fontWeight: 'bold', 
                      color: '#2E7D32', 
                      margin: 0 
                    }}>
                      {match.player1_score}
                    </p>
                  </div>
                  <div style={{ 
                    fontSize: '16px', 
                    fontWeight: 'bold', 
                    color: '#666',
                    padding: '0 8px'
                  }}>
                    VS
                  </div>
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <p style={{ 
                      fontWeight: 'bold', 
                      margin: '0 0 6px 0',
                      fontSize: '13px',
                      wordBreak: 'break-word'
                    }}>
                      {getPlayerName(match.player2_id)}
                    </p>
                    <p style={{ 
                      fontSize: '24px', 
                      fontWeight: 'bold', 
                      color: '#2E7D32', 
                      margin: 0 
                    }}>
                      {match.player2_score}
                    </p>
                  </div>
                </div>

                {match.winner_id && (
                  <p style={{ 
                    textAlign: 'center', 
                    marginBottom: '12px', 
                    fontWeight: 'bold', 
                    color: '#4caf50',
                    fontSize: '14px'
                  }}>
                    🏆 Winner: {getPlayerName(match.winner_id)}
                  </p>
                )}

                {(user?.role === 'master' || (user?.role === 'admin' && user?.verification_status === 'approved')) && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleEditMatch(match)}
                      className="btn btn-secondary"
                      style={{ 
                        padding: '8px 16px', 
                        fontSize: '14px',
                        flex: 1
                      }}
                    >
                      ✏️ Edit Match
                    </button>
                    <button
                      onClick={() => handleDeleteMatch(match.id!)}
                      className="btn btn-secondary"
                      style={{ 
                        padding: '8px 16px', 
                        fontSize: '14px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none'
                      }}
                      disabled={deleteMatchMutation.isPending}
                    >
                      {deleteMatchMutation.isPending ? '🗑️ Deleting...' : '🗑️ Delete'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>🎾</div>
            <h2 style={{ fontSize: '20px', color: '#666', marginBottom: '12px' }}>
              No matches yet
            </h2>
            <p style={{ color: '#999', marginBottom: '24px', fontSize: '14px' }}>
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

      {/* Mobile-specific styles */}
      <style>{`
        @media (max-width: 768px) {
          .match-card {
            margin: 0 !important;
            padding: 16px !important;
          }
          
          .card-header {
            flex-direction: column !important;
            gap: 8px !important;
            text-align: center !important;
          }
        }
        
        @media (min-width: 769px) {
          .match-card {
            margin: 0 !important;
            padding: 20px !important;
          }
          
          .card-header {
            flex-direction: row !important;
            justify-content: space-between !important;
            align-items: center !important;
          }
        }
      `}</style>
    </Layout>
  )
}

export default Matches
