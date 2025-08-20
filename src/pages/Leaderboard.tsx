import React from 'react'
import Layout from '../components/Layout'
import { useQuery } from '@tanstack/react-query'
import { leaderboardAPI } from '../lib/api'

const Leaderboard: React.FC = () => {
  // For now, we'll show a placeholder since we need a tournament ID
  // In a real app, you'd either select a tournament or show the latest one
  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => leaderboardAPI.getLeaderboard('placeholder-id'),
    enabled: false, // Disable for now since we don't have a real tournament ID
  })

  if (isLoading) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="spinner" style={{ margin: '0 auto 20px' }}></div>
          <p>Loading leaderboard...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#2E7D32', marginBottom: '24px' }}>
          Leaderboard
        </h1>

        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>📊</div>
          <h2 style={{ fontSize: '24px', color: '#666', marginBottom: '12px' }}>
            Leaderboard Coming Soon
          </h2>
          <p style={{ color: '#999', marginBottom: '24px' }}>
            Tournament leaderboards will be available once matches are played.
          </p>
        </div>
      </div>
    </Layout>
  )
}

export default Leaderboard
