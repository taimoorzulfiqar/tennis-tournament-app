import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Logo from './Logo'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, signOutMutation } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    try {
      await signOutMutation.mutateAsync()
      navigate('/sign-in')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const navItems = [
    { path: '/', label: 'Tournaments', icon: '🏆' },
    { path: '/leaderboard', label: 'Leaderboard', icon: '📊' },
    { path: '/matches', label: 'Matches', icon: '🎾' },
    { path: '/profile', label: 'Profile', icon: '👤' },
  ]

  // Add admin nav item for admin and master users
  if (user && (user.role === 'admin' || user.role === 'master')) {
    navItems.push({ path: '/admin', label: 'Admin', icon: '⚙️' })
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{
        background: '#1a1a1a',
        color: 'white',
        padding: '12px 16px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 1000
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <Logo size="medium" />
          
          {/* Desktop User Info */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '16px',
            display: 'none' // Hidden on mobile
          }} className="desktop-only">
            <span style={{ fontSize: '14px' }}>
              Welcome, {user?.full_name || user?.email}
            </span>
            <button
              onClick={handleSignOut}
              className="btn btn-secondary"
              style={{ fontSize: '14px', padding: '8px 16px' }}
              disabled={signOutMutation.isPending}
            >
              {signOutMutation.isPending ? 'Signing Out...' : 'Sign Out'}
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMobileMenu}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '8px',
              display: 'block' // Show on mobile
            }}
            className="mobile-only"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* Mobile User Info */}
        {isMobileMenuOpen && (
          <div style={{
            marginTop: '12px',
            paddingTop: '12px',
            borderTop: '1px solid rgba(255, 255, 255, 0.2)',
            display: 'block' // Show on mobile when menu is open
          }} className="mobile-only">
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.8)' }}>
                Welcome, {user?.full_name || user?.email}
              </span>
              <button
                onClick={handleSignOut}
                className="btn btn-secondary"
                style={{ 
                  fontSize: '14px', 
                  padding: '12px 16px',
                  width: '100%'
                }}
                disabled={signOutMutation.isPending}
              >
                {signOutMutation.isPending ? 'Signing Out...' : 'Sign Out'}
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Navigation */}
      <nav style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e0e0e0',
        position: 'sticky',
        top: '60px',
        zIndex: 999
      }}>
        {/* Desktop Navigation */}
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          padding: '0 16px',
          display: 'none' // Hidden on mobile
        }} className="desktop-only">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '16px 20px',
                textDecoration: 'none',
                color: location.pathname === item.path ? 'var(--primary-color)' : '#666',
                borderBottom: location.pathname === item.path ? '3px solid var(--primary-color)' : '3px solid transparent',
                fontWeight: location.pathname === item.path ? '600' : '400',
                whiteSpace: 'nowrap',
                minHeight: '44px' // Touch target size
              }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>

        {/* Mobile Navigation */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          display: 'block' // Show on mobile
        }} className="mobile-only">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px 20px',
                textDecoration: 'none',
                color: location.pathname === item.path ? 'var(--primary-color)' : '#666',
                backgroundColor: location.pathname === item.path ? 'rgba(50, 205, 50, 0.1)' : 'transparent',
                borderLeft: location.pathname === item.path ? '4px solid var(--primary-color)' : '4px solid transparent',
                fontWeight: location.pathname === item.path ? '600' : '400',
                minHeight: '44px', // Touch target size
                transition: 'all 0.2s ease'
              }}
            >
              <span style={{ fontSize: '18px' }}>{item.icon}</span>
              <span style={{ fontSize: '16px' }}>{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main style={{
        flex: 1,
        padding: '16px',
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%'
      }}>
        {children}
      </main>

      {/* Mobile-specific styles */}
      <style jsx>{`
        @media (max-width: 768px) {
          .desktop-only {
            display: none !important;
          }
          .mobile-only {
            display: block !important;
          }
        }
        
        @media (min-width: 769px) {
          .desktop-only {
            display: flex !important;
          }
          .mobile-only {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}

export default Layout
