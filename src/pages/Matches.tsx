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
      await matchAPI.deleteMatch(matchId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] })
      queryClient.invalidateQueries({ queryKey: ['tournament'] })
      alert('Match deleted successfully!')
    },
    onError: (error) => {
      console.error('Error deleting match:', error)
      alert('Failed to delete match. Please try again.')
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {matches.map((match) => (
              <div key={match.id} style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                padding: '24px',
                border: '1px solid #e0e0e0',
                transition: 'box-shadow 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.15)'}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)'}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                        {getPlayerName(match.player1_id)} vs {getPlayerName(match.player2_id)}
                      </h3>
                      <span style={{
                        padding: '8px 16px',
                        borderRadius: '20px',
                        fontSize: '14px',
                        fontWeight: 'bold',
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
                        <span style={{ fontSize: '16px' }}>🏟️</span>
                        <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '500' }}>
                          Court: {match.court}
                        </span>
                      </div>
                    )}
                    
                    {match.status === 'completed' && (
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ marginBottom: '8px' }}>
                          <div style={{
                            backgroundColor: '#e3f2fd',
                            padding: '12px 16px',
                            borderRadius: '8px',
                            border: '1px solid #2196f3',
                            display: 'inline-block'
                          }}>
                            <p style={{ fontSize: '14px', color: '#1976d2', fontWeight: 'bold' }}>
                              Score: <span style={{ fontSize: '20px' }}>{match.player1_score} - {match.player2_score}</span>
                            </p>
                          </div>
                        </div>
                        {match.winner_id && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '20px' }}>🏆</span>
                            <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#2e7d32' }}>
                              Winner: {getPlayerName(match.winner_id)}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      <span>📅</span>
                      <span>Created: {new Date(match.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  {/* Action buttons - only show for admins */}
                  {user && (user.role === 'master' || (user.role === 'admin' && user.verification_status === 'approved')) && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <button
                        onClick={() => handleEditMatch(match)}
                        style={{
                          padding: '12px 16px',
                          backgroundColor: 'var(--primary-color)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-dark)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-color)'}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDeleteMatch(match.id)}
                        style={{
                          padding: '12px 16px',
                          backgroundColor: '#f44336',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#d32f2f'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f44336'}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  )}
                </div>
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
