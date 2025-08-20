import React from 'react'

interface LogoProps {
  size?: 'small' | 'medium' | 'large'
  showText?: boolean
}

const Logo: React.FC<LogoProps> = ({ size = 'medium', showText = true }) => {
  const sizeMap = {
    small: { icon: 24, text: 16 },
    medium: { icon: 40, text: 20 },
    large: { icon: 60, text: 28 }
  }

  const { icon, text } = sizeMap[size]

  return (
    <div className="logo" style={{ fontSize: text }}>
      <div 
        className="logo-icon" 
        style={{ 
          width: icon, 
          height: icon, 
          fontSize: icon * 0.5,
          background: 'linear-gradient(135deg, #32CD32 0%, #8A2BE2 100%)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          boxShadow: '0 2px 8px rgba(50, 205, 50, 0.3)'
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
            fontWeight: 'bold'
          }}
        >
          Expert Tennis Academy
        </div>
      )}
    </div>
  )
}

export default Logo
