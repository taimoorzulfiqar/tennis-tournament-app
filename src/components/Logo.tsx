import React from 'react'

interface LogoProps {
  size?: 'small' | 'medium' | 'large'
  showText?: boolean
}

const Logo: React.FC<LogoProps> = ({ size = 'medium', showText = true }) => {
  const sizeMap = {
    small: { icon: 32, text: 16 },
    medium: { icon: 48, text: 20 },
    large: { icon: 72, text: 28 }
  }

  const { icon, text } = sizeMap[size]

  // Tennis racket SVG component
  const TennisRacket = ({ size }: { size: number }) => (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Tennis ball */}
      <circle cx="25" cy="25" r="8" fill="#FFD700" stroke="#FFA500" strokeWidth="1"/>
      
      {/* Racket head */}
      <ellipse cx="65" cy="35" rx="20" ry="15" fill="#8A2BE2" stroke="#4B0082" strokeWidth="2"/>
      
      {/* Racket strings - horizontal */}
      <line x1="45" y1="35" x2="85" y2="35" stroke="white" strokeWidth="1"/>
      <line x1="45" y1="30" x2="85" y2="30" stroke="white" strokeWidth="1"/>
      <line x1="45" y1="40" x2="85" y2="40" stroke="white" strokeWidth="1"/>
      <line x1="45" y1="25" x2="85" y2="25" stroke="white" strokeWidth="1"/>
      <line x1="45" y1="45" x2="85" y2="45" stroke="white" strokeWidth="1"/>
      
      {/* Racket strings - vertical */}
      <line x1="55" y1="20" x2="55" y2="50" stroke="white" strokeWidth="1"/>
      <line x1="60" y1="20" x2="60" y2="50" stroke="white" strokeWidth="1"/>
      <line x1="65" y1="20" x2="65" y2="50" stroke="white" strokeWidth="1"/>
      <line x1="70" y1="20" x2="70" y2="50" stroke="white" strokeWidth="1"/>
      <line x1="75" y1="20" x2="75" y2="50" stroke="white" strokeWidth="1"/>
      
      {/* Racket handle */}
      <rect x="80" y="30" width="4" height="25" rx="2" fill="#32CD32" stroke="#228B22" strokeWidth="1"/>
      <rect x="82" y="55" width="8" height="3" rx="1.5" fill="#32CD32" stroke="#228B22" strokeWidth="1"/>
    </svg>
  )

  return (
    <div className="logo" style={{ fontSize: text }}>
      <div 
        className="logo-icon" 
        style={{ 
          width: icon, 
          height: icon, 
          background: 'linear-gradient(135deg, #32CD32 0%, #8A2BE2 100%)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          boxShadow: '0 4px 12px rgba(50, 205, 50, 0.3)',
          padding: '8px'
        }}
      >
        <TennisRacket size={icon * 0.7} />
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
