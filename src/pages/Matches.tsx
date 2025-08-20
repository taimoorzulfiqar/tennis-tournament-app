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
        <div className="max-w-6xl mx-auto p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">All Matches</h1>
            <p className="text-gray-600 text-lg">View and manage all tournament matches</p>
          </div>
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <div className="text-lg text-gray-600">Loading matches...</div>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  if (matchesError) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">All Matches</h1>
            <p className="text-gray-600 text-lg">View and manage all tournament matches</p>
          </div>
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="text-red-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-red-600 text-xl mb-4 font-semibold">Error Loading Matches</h2>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {matchesError instanceof Error ? matchesError.message : 'Unknown error occurred'}
              </p>
              <button 
                onClick={() => window.location.reload()} 
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200 font-medium"
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
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">All Matches</h1>
          <p className="text-gray-600 text-lg">View and manage all tournament matches</p>
        </div>
        
        {matches && matches.length > 0 ? (
          <div className="grid gap-6">
            {matches.map((match) => (
              <div key={match.id} className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-200">
                <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-gray-900">
                        {getPlayerName(match.player1_id)} vs {getPlayerName(match.player2_id)}
                      </h3>
                      <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                        match.status === 'completed' ? 'bg-green-100 text-green-800 border border-green-200' :
                        match.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                        'bg-gray-100 text-gray-800 border border-gray-200'
                      }`}>
                        {match.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    
                    {match.court && (
                      <div className="mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <span className="text-sm text-gray-600 font-medium">Court: {match.court}</span>
                      </div>
                    )}
                    
                    {match.status === 'completed' && (
                      <div className="mb-4">
                        <div className="flex items-center gap-4 mb-2">
                          <div className="bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
                            <p className="text-sm text-blue-600 font-semibold">
                              Score: <span className="text-lg">{match.player1_score} - {match.player2_score}</span>
                            </p>
                          </div>
                        </div>
                        {match.winner_id && (
                          <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-sm font-semibold text-green-600">
                              Winner: {getPlayerName(match.winner_id)}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>Created: {new Date(match.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  {/* Action buttons - only show for admins */}
                  {user && (user.role === 'master' || (user.role === 'admin' && user.verification_status === 'approved')) && (
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                      <button
                        onClick={() => handleEditMatch(match)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200 flex items-center justify-center gap-2 text-sm font-medium"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteMatch(match.id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200 flex items-center justify-center gap-2 text-sm font-medium"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <p className="text-gray-600 text-lg font-medium">No matches found.</p>
            <p className="text-gray-500 text-sm mt-2">Matches will appear here once they are created.</p>
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
