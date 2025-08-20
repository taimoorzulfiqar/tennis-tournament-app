import React from 'react'

const LoadingScreen: React.FC = () => {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
      color: 'white',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 20px' }}></div>
        <h1 style={{ margin: '0 0 10px', fontSize: '24px' }}>Tennis Tournament App</h1>
        <p style={{ margin: 0, opacity: 0.8 }}>Loading...</p>
      </div>
    </div>
  )
}

export default LoadingScreen
