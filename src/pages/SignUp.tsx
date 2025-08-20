import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Logo from '../components/Logo'

const SignUp: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<'admin' | 'player'>('player')
  const { signUpMutation } = useAuth()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password || !fullName) {
      alert('Please fill in all fields.')
      return
    }

    try {
      await signUpMutation.mutateAsync({ email, password, full_name: fullName, role })
    } catch (error) {
      console.error('Sign up error:', error)
      alert(error instanceof Error ? error.message : 'Sign up failed')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '40px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ marginBottom: '20px' }}>
            <Logo size="large" />
          </div>
          <h1 style={{
            fontSize: '22px',
            fontWeight: 'bold',
            color: 'var(--primary-color)',
            marginBottom: '8px'
          }}>
            Join the Academy
          </h1>
          <p style={{
            fontSize: '16px',
            color: '#666'
          }}>
            Create your tennis academy account
          </p>
        </div>

        <form onSubmit={handleSignUp}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Role</label>
            <select
              className="form-input"
              value={role}
              onChange={(e) => setRole(e.target.value as 'admin' | 'player')}
            >
              <option value="player">Player</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '16px' }}
            disabled={signUpMutation.isPending}
          >
            {signUpMutation.isPending ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <p style={{ color: '#666', marginBottom: '8px' }}>
            Already have an account?
          </p>
          <Link to="/sign-in" style={{
            color: 'var(--primary-color)',
            textDecoration: 'none',
            fontWeight: '600'
          }}>
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  )
}

export default SignUp
