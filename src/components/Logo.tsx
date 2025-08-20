import React from 'react'

interface LogoProps {
  size?: 'small' | 'medium' | 'large'
  showText?: boolean
}

const Logo: React.FC<LogoProps> = ({ size = 'medium', showText = true }) => {
  const sizeMap = {
    small: { width: 120, height: 36 },
    medium: { width: 160, height: 48 },
    large: { width: 200, height: 60 }
  }

  const { width, height } = sizeMap[size]

  return (
    <div className="logo" style={{ display: 'flex', alignItems: 'center' }}>
      <img 
        src="/logo.svg" 
        alt="Expert Tennis Academy" 
        style={{ 
          width: width, 
          height: height,
          filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))'
        }}
      />
    </div>
  )
}

export default Logo
