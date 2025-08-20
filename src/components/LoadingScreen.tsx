import React from 'react'

const LoadingScreen: React.FC = () => {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: 'linear-gradient(135deg, var(--dark-bg) 0%, #1a1a1a 100%)',
      color: 'white',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div className="logo" style={{ marginBottom: '32px', justifyContent: 'center' }}>
          <div className="logo-icon" style={{ width: '60px', height: '60px', fontSize: '30px' }}>
            🎾
          </div>
          <div className="logo-text" style={{ fontSize: '28px' }}>
            Expert Tennis Academy
          </div>
        </div>
        <div className="spinner" style={{ margin: '0 auto 20px' }}></div>
        <p style={{ margin: 0, opacity: 0.8, fontSize: '16px' }}>Loading...</p>
      </div>
    </div>
  )
}

export default LoadingScreen
