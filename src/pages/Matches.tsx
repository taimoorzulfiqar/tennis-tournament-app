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

  const { data: matches, isLoading: matchesLoading, error: matchesError } = useQuery({
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
      console.log('deleteMatchMutation called with matchId:', matchId)
      await matchAPI.deleteMatch(matchId)
    },
    onSuccess: () => {
      console.log('deleteMatchMutation onSuccess called')
      queryClient.invalidateQueries({ queryKey: ['matches'] })
      queryClient.invalidateQueries({ queryKey: ['tournament'] })
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] })
      alert('Match deleted successfully!')
    },
    onError: (error) => {
      console.error('deleteMatchMutation onError called:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      alert(`Failed to delete match: ${errorMessage}`)
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
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-primary)' }}>
              All Matches
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '18px' }}>
              View and manage all tournament matches
            </p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '256px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '48px',
                height: '48px',
                border: '4px solid var(--primary-light)',
                borderTop: '4px solid var(--primary-color)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 16px'
              }}></div>
              <div style={{ fontSize: '18px', color: 'var(--text-secondary)' }}>Loading matches...</div>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  if (matchesError) {
    return (
      <Layout>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-primary)' }}>
              All Matches
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '18px' }}>
              View and manage all tournament matches
            </p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '256px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px', color: '#f44336' }}>⚠️</div>
              <h2 style={{ color: '#f44336', fontSize: '24px', marginBottom: '16px', fontWeight: 'bold' }}>
                Error Loading Matches
              </h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', maxWidth: '400px', margin: '0 auto' }}>
                {matchesError instanceof Error ? matchesError.message : 'Unknown error occurred'}
              </p>
              <button 
                onClick={() => window.location.reload()} 
                style={{
                  padding: '12px 24px',
                  backgroundColor: 'var(--primary-color)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-dark)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-color)'}
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-primary)' }}>
            All Matches
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '18px' }}>
            View and manage all tournament matches
          </p>
        </div>
        
        {matches && matches.length > 0 ? (
          <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
            {matches.map((match, index) => (
              <div key={match.id} className="card" style={{
                transition: 'box-shadow 0.2s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.15)'}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)'}
              >
                <div className="card-header">
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>
                    Match {index + 1}
                  </h3>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600',
                    backgroundColor: match.status === 'completed' ? '#e8f5e8' : 
                                     match.status === 'in_progress' ? '#fff3e0' : '#f5f5f5',
                    color: match.status === 'completed' ? '#2e7d32' : 
                           match.status === 'in_progress' ? '#f57c00' : '#666',
                    border: `1px solid ${match.status === 'completed' ? '#4caf50' : 
                                       match.status === 'in_progress' ? '#ff9800' : '#e0e0e0'}`
                  }}>
                    {match.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                
                {match.court && (
                  <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px' }}>🏟️</span>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500' }}>
                      Court: {match.court}
                    </span>
                  </div>
                )}
                
                {match.status === 'completed' && (
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ marginBottom: '8px' }}>
                      <div style={{
                        backgroundColor: '#e3f2fd',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #2196f3',
                        display: 'inline-block'
                      }}>
                        <p style={{ fontSize: '13px', color: '#1976d2', fontWeight: 'bold', margin: 0 }}>
                          Score: <span style={{ fontSize: '16px' }}>{match.player1_score} - {match.player2_score}</span>
                        </p>
                      </div>
                    </div>
                    {match.winner_id && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '16px' }}>🏆</span>
                        <p style={{ fontSize: '13px', fontWeight: 'bold', color: '#2e7d32', margin: 0 }}>
                          Winner: {getPlayerName(match.winner_id)}
                        </p>
                      </div>
                    )}
                  </div>
                )}
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  <span>📅</span>
                  <span>Created: {new Date(match.created_at).toLocaleDateString()}</span>
                </div>
                
                {/* Action buttons - only show for admins */}
                {user && (user.role === 'master' || (user.role === 'admin' && user.verification_status === 'approved')) && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleEditMatch(match)}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        backgroundColor: 'var(--primary-color)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-dark)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-color)'}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDeleteMatch(match.id)}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        backgroundColor: '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#d32f2f'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f44336'}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '64px 24px' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px', color: '#ccc' }}>🎾</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '18px', fontWeight: '500', marginBottom: '8px' }}>
              No matches found.
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              Matches will appear here once they are created.
            </p>
          </div>
        )}
        
        {/* Edit Modal */}
        {selectedMatch && (
          <EditMatchModal
            match={selectedMatch}
            isOpen={isEditModalOpen}
            onClose={handleCloseEditModal}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['matches'] })
            }}
          />
        )}
      </div>
    </Layout>
  )
}

export default Matches
