import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const SignIn: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { signInMutation } = useAuth()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      alert('Please enter both email and password.')
      return
    }

    try {
      await signInMutation.mutateAsync({ email, password })
    } catch (error) {
      console.error('Sign in error:', error)
      alert(error instanceof Error ? error.message : 'Sign in failed')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      background: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)'
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
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            backgroundColor: '#E8F5E8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            fontSize: '40px'
          }}>
            🎾
          </div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#2E7D32',
            marginBottom: '8px'
          }}>
            Welcome Back
          </h1>
          <p style={{
            fontSize: '16px',
            color: '#666'
          }}>
            Sign in to your tennis tournament account
          </p>
        </div>

        <form onSubmit={handleSignIn}>
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

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '16px' }}
            disabled={signInMutation.isPending}
          >
            {signInMutation.isPending ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <p style={{ color: '#666', marginBottom: '8px' }}>
            Don't have an account?
          </p>
          <Link to="/sign-up" style={{
            color: '#2E7D32',
            textDecoration: 'none',
            fontWeight: '600'
          }}>
            Sign up here
          </Link>
        </div>
      </div>
    </div>
  )
}

export default SignIn
