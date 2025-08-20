import React from 'react'
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

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{
        background: 'linear-gradient(135deg, var(--dark-bg) 0%, #1a1a1a 100%)',
        color: 'white',
        padding: '16px 24px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <Logo size="medium" />
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
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
        </div>
      </header>

      {/* Navigation */}
      <nav style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e0e0e0',
        padding: '0 24px'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          gap: '8px',
          overflowX: 'auto'
        }}>
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
                whiteSpace: 'nowrap'
              }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main style={{
        flex: 1,
        padding: '24px',
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%'
      }}>
        {children}
      </main>
    </div>
  )
}

export default Layout
