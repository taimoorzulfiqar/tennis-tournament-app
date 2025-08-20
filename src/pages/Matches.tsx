import React from 'react'
import Layout from '../components/Layout'
import { useQuery } from '@tanstack/react-query'
import { matchAPI } from '../lib/api'

const Matches: React.FC = () => {
  const { data: matches, isLoading } = useQuery({
    queryKey: ['matches'],
    queryFn: () => matchAPI.getMatches(),
  })

  if (isLoading) {
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
                    <strong>Time:</strong> {new Date(match.start_time).toLocaleString()}
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
                    <p style={{ fontWeight: 'bold', margin: '0 0 4px 0' }}>Player 1</p>
                    <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#2E7D32', margin: 0 }}>
                      {match.player1_score}
                    </p>
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#666' }}>VS</div>
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <p style={{ fontWeight: 'bold', margin: '0 0 4px 0' }}>Player 2</p>
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
                    🏆 Winner: Player {match.winner_id === match.player1_id ? '1' : '2'}
                  </p>
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
    </Layout>
  )
}

export default Matches
