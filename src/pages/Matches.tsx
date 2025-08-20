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
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading matches...</div>
        </div>
      </Layout>
    )
  }

  if (matchesError) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <h2 className="text-red-600 text-xl mb-4">Error Loading Matches</h2>
            <p className="text-gray-600 mb-4">
              {matchesError instanceof Error ? matchesError.message : 'Unknown error occurred'}
            </p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Retry
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">All Matches</h1>
        
        {matches && matches.length > 0 ? (
          <div className="grid gap-4">
            {matches.map((match) => (
              <div key={match.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold">
                        {getPlayerName(match.player1_id)} vs {getPlayerName(match.player2_id)}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        match.status === 'completed' ? 'bg-green-100 text-green-800' :
                        match.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {match.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    
                    {match.court && (
                      <p className="text-sm text-gray-600 mb-2">
                        Court: {match.court}
                      </p>
                    )}
                    
                    {match.status === 'completed' && (
                      <div className="mb-2">
                        <p className="text-sm text-gray-600">
                          Score: {match.player1_score} - {match.player2_score}
                        </p>
                        {match.winner_id && (
                          <p className="text-sm font-medium text-green-600">
                            Winner: {getPlayerName(match.winner_id)}
                          </p>
                        )}
                      </div>
                    )}
                    
                    <p className="text-xs text-gray-500">
                      Created: {new Date(match.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  
                  {/* Action buttons - only show for admins */}
                  {user && (user.role === 'master' || (user.role === 'admin' && user.verification_status === 'approved')) && (
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handleEditMatch(match)}
                        className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteMatch(match.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No matches found.</p>
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
