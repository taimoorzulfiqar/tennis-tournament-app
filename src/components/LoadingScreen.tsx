import React from 'react'
import Logo from './Logo'

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
        <div style={{ marginBottom: '32px' }}>
          <Logo size="large" />
        </div>
        <div className="spinner" style={{ margin: '0 auto 20px' }}></div>
        <p style={{ margin: 0, opacity: 0.8, fontSize: '16px' }}>Loading...</p>
      </div>
    </div>
  )
}

export default LoadingScreen
