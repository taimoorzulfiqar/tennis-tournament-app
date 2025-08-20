import React, { useState } from 'react'
import Layout from '../components/Layout'
import { useAuth } from '../hooks/useAuth'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { userAPI } from '../lib/api'

const Profile: React.FC = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [editData, setEditData] = useState({
    full_name: user?.full_name || ''
  })

  const updatePasswordMutation = useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) =>
      userAPI.updatePassword(currentPassword, newPassword),
    onSuccess: () => {
      setShowPasswordModal(false)
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      alert('Password updated successfully!')
    },
    onError: (error) => {
      alert(error instanceof Error ? error.message : 'Failed to update password')
    },
  })

  const updateProfileMutation = useMutation({
    mutationFn: ({ full_name }: { full_name: string }) =>
      userAPI.updateProfile(user!.id, { full_name }),
    onSuccess: () => {
      setShowEditModal(false)
      queryClient.invalidateQueries({ queryKey: ['currentUser'] })
      alert('Profile updated successfully!')
    },
    onError: (error) => {
      alert(error instanceof Error ? error.message : 'Failed to update profile')
    },
  })

  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match')
      return
    }
    if (passwordData.newPassword.length < 6) {
      alert('New password must be at least 6 characters long')
      return
    }
    updatePasswordMutation.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword
    })
  }

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editData.full_name.trim()) {
      alert('Full name cannot be empty')
      return
    }
    updateProfileMutation.mutate({ full_name: editData.full_name.trim() })
  }

  if (!user) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>Loading profile...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#2E7D32', marginBottom: '24px' }}>
          Profile
        </h1>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: '#E8F5E8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              marginRight: '20px'
            }}>
              👤
            </div>
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#2E7D32', margin: '0 0 8px 0' }}>
                {user.full_name || 'No name set'}
              </h2>
              <p style={{ color: '#666', margin: '0 0 4px 0' }}>{user.email}</p>
              <span style={{
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '600',
                backgroundColor: '#2E7D3220',
                color: '#2E7D32',
                textTransform: 'capitalize'
              }}>
                {user.role}
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>
                Account Information
              </h3>
              <div style={{ backgroundColor: '#f5f5f5', padding: '16px', borderRadius: '8px' }}>
                <p style={{ margin: '8px 0', fontSize: '14px' }}>
                  <strong>Email:</strong> {user.email}
                </p>
                <p style={{ margin: '8px 0', fontSize: '14px' }}>
                  <strong>Role:</strong> {user.role}
                </p>
                <p style={{ margin: '8px 0', fontSize: '14px' }}>
                  <strong>Member since:</strong> {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>
                Actions
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button
                  onClick={() => setShowEditModal(true)}
                  className="btn btn-secondary"
                >
                  ✏️ Edit Profile
                </button>
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="btn btn-secondary"
                >
                  🔒 Change Password
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '32px',
            width: '90%',
            maxWidth: '400px'
          }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px', color: '#2E7D32' }}>
              Edit Profile
            </h2>

            <form onSubmit={handleProfileUpdate}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={editData.full_name}
                  onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  disabled={updateProfileMutation.isPending}
                >
                  {updateProfileMutation.isPending ? 'Updating...' : 'Update Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '32px',
            width: '90%',
            maxWidth: '400px'
          }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px', color: '#2E7D32' }}>
              Change Password
            </h2>

            <form onSubmit={handlePasswordUpdate}>
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  placeholder="Enter current password"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">New Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  placeholder="Enter new password"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  placeholder="Confirm new password"
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  disabled={updatePasswordMutation.isPending}
                >
                  {updatePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}

export default Profile
