import React from 'react'

interface LogoProps {
  size?: 'small' | 'medium' | 'large'
  showText?: boolean
}

const Logo: React.FC<LogoProps> = ({ size = 'medium', showText = true }) => {
  const sizeMap = {
    small: { icon: 32, text: 16 },
    medium: { icon: 44, text: 20 },
    large: { icon: 64, text: 28 }
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
          fontWeight: 'bold'
        }}
      >
        🎾
      </div>
      {showText && (
        <div 
          className="logo-text"
          style={{
            background: 'linear-gradient(135deg, #32CD32 0%, #8A2BE2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontWeight: 'bold',
            whiteSpace: 'nowrap'
          }}
        >
          Expert Tennis Academy
        </div>
      )}
    </div>
  )
}

export default Logo
