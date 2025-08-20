import React from 'react'

interface LogoProps {
  size?: 'small' | 'medium' | 'large'
  showText?: boolean
}

const Logo: React.FC<LogoProps> = ({ size = 'medium', showText = true }) => {
  const sizeMap = {
    small: { icon: 32, text: 12 },
    medium: { icon: 44, text: 14 },
    large: { icon: 64, text: 18 }
  }

  const { icon, text } = sizeMap[size]

  return (
    <div className="logo" style={{ fontSize: text }}>
      <div 
        className="logo-icon" 
        style={{ 
          width: icon, 
          height: icon, 
          background: 'linear-gradient(135deg, #32CD32 0%, #8A2BE2 100%)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          boxShadow: '0 3px 10px rgba(50, 205, 50, 0.25)',
          fontSize: icon * 0.6,
          fontWeight: 'bold',
          flexShrink: 0
        }}
      >
        🎾
      </div>
      {showText && (
        <div 
          className="logo-text"
          style={{
            fontWeight: 'bold',
            whiteSpace: 'nowrap'
          }}
        >
          <span style={{ color: '#228B22' }}>Expert</span>{' '}
          <span style={{ color: '#4B0082' }}>Tennis Academy</span>
        </div>
      )}
    </div>
  )
}

export default Logo
