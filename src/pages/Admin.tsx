import React, { useState } from 'react'
import Layout from '../components/Layout'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userAPI } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import { User } from '../types'

const Admin: React.FC = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'player' as 'admin' | 'player'
  })

  const { data: users, isLoading, refetch } = useQuery({
    queryKey: ['users'],
    queryFn: userAPI.getUsers,
  })

  const createUserMutation = useMutation({
    mutationFn: userAPI.createUser,
    onSuccess: () => {
      setShowCreateModal(false)
      setNewUser({ email: '', password: '', full_name: '', role: 'player' })
      queryClient.invalidateQueries({ queryKey: ['users'] })
      alert('User created successfully!')
    },
    onError: (error) => {
      alert(error instanceof Error ? error.message : 'Failed to create user')
    },
  })

  const deleteUserMutation = useMutation({
    mutationFn: userAPI.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      alert('User deleted successfully!')
    },
    onError: (error) => {
      alert(error instanceof Error ? error.message : 'Failed to delete user')
    },
  })

  const updateVerificationMutation = useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: 'pending' | 'approved' | 'rejected' }) =>
      userAPI.updateVerificationStatus(userId, { verification_status: status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      alert('Verification status updated successfully!')
    },
    onError: (error) => {
      alert(error instanceof Error ? error.message : 'Failed to update verification status')
    },
  })

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newUser.email || !newUser.password || !newUser.full_name) {
      alert('Please fill in all fields')
      return
    }
    if (newUser.password.length < 6) {
      alert('Password must be at least 6 characters long')
      return
    }
    createUserMutation.mutate(newUser)
  }

  const handleDeleteUser = (userId: string, userEmail: string) => {
    if (userId === user?.id) {
      alert('You cannot delete your own account')
      return
    }
    if (confirm(`Are you sure you want to delete ${userEmail}? This action cannot be undone.`)) {
      deleteUserMutation.mutate(userId)
    }
  }

  const handleVerificationUpdate = (userId: string, currentStatus: string, userEmail: string) => {
    let newStatus: 'pending' | 'approved' | 'rejected'
    
    if (currentStatus === 'pending') {
      newStatus = 'approved'
    } else if (currentStatus === 'approved') {
      newStatus = 'rejected'
    } else {
      newStatus = 'approved'
    }

    const action = newStatus === 'approved' ? 'approve' : newStatus === 'rejected' ? 'reject' : 'set to pending'
    
    if (confirm(`Are you sure you want to ${action} ${userEmail}?`)) {
      updateVerificationMutation.mutate({ userId, status: newStatus })
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'master': return '#f44336'
      case 'admin': return '#ff9800'
      case 'player': return 'var(--primary-color)'
      default: return '#666'
    }
  }

  const getVerificationColor = (status: string) => {
    switch (status) {
      case 'approved': return 'var(--primary-color)'
      case 'pending': return 'var(--accent-color)'
      case 'rejected': return '#f44336'
      default: return '#666'
    }
  }

  const getVerificationText = (status: string) => {
    switch (status) {
      case 'approved': return 'Approved'
      case 'pending': return 'Pending'
      case 'rejected': return 'Rejected'
      default: return status
    }
  }

  if (isLoading) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="spinner" style={{ margin: '0 auto 20px' }}></div>
          <p>Loading users...</p>
        </div>
      </Layout>
    )
  }

  const pendingAdmins = users?.filter(u => u.role === 'admin' && u.verification_status === 'pending') || []
  const approvedUsers = users?.filter(u => u.verification_status === 'approved') || []

  return (
    <Layout>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--primary-color)', margin: 0 }}>
            Admin Panel
          </h1>
          {user?.role === 'master' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
            >
              👤 Add User
            </button>
          )}
        </div>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '32px' }}>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>👥</div>
            <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--primary-color)', margin: '0 0 4px 0' }}>
              {users?.length || 0}
            </h3>
            <p style={{ color: '#666', margin: 0 }}>Total Users</p>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>⚙️</div>
            <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--primary-color)', margin: '0 0 4px 0' }}>
              {users?.filter(u => u.role === 'admin').length || 0}
            </h3>
            <p style={{ color: '#666', margin: 0 }}>Admins</p>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎾</div>
            <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--primary-color)', margin: '0 0 4px 0' }}>
              {users?.filter(u => u.role === 'player').length || 0}
            </h3>
            <p style={{ color: '#666', margin: 0 }}>Players</p>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>⏳</div>
            <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--accent-color)', margin: '0 0 4px 0' }}>
              {pendingAdmins.length}
            </h3>
            <p style={{ color: '#666', margin: 0 }}>Pending Admins</p>
          </div>
        </div>

        {/* Pending Admin Approvals */}
        {pendingAdmins.length > 0 && user?.role === 'master' && (
          <div className="card" style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--accent-color)', marginBottom: '20px' }}>
              ⏳ Pending Admin Approvals
            </h2>
            <div style={{ display: 'grid', gap: '16px' }}>
              {pendingAdmins.map((userItem: User) => (
                <div key={userItem.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px',
                  backgroundColor: '#fff3cd',
                  border: '1px solid #ffeaa7',
                  borderRadius: '8px'
                }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 4px 0' }}>
                      {userItem.full_name || 'No name set'}
                    </h3>
                    <p style={{ color: '#666', margin: '0 0 4px 0', fontSize: '14px' }}>
                      {userItem.email}
                    </p>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      backgroundColor: getVerificationColor(userItem.verification_status) + '20',
                      color: getVerificationColor(userItem.verification_status),
                      textTransform: 'capitalize'
                    }}>
                      {getVerificationText(userItem.verification_status)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => handleVerificationUpdate(userItem.id, userItem.verification_status, userItem.email)}
                      className="btn btn-primary"
                      style={{ padding: '8px 16px', fontSize: '12px' }}
                      disabled={updateVerificationMutation.isPending}
                    >
                      ✅ Approve
                    </button>
                    <button
                      onClick={() => updateVerificationMutation.mutate({ userId: userItem.id, status: 'rejected' })}
                      className="btn btn-secondary"
                      style={{ padding: '8px 16px', fontSize: '12px' }}
                      disabled={updateVerificationMutation.isPending}
                    >
                      ❌ Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Users List */}
        <div className="card">
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--primary-color)', marginBottom: '20px' }}>
            User Management
          </h2>

          {users && users.length > 0 ? (
            <div style={{ display: 'grid', gap: '16px' }}>
              {users.map((userItem: User) => (
                <div key={userItem.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '8px'
                }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 4px 0' }}>
                      {userItem.full_name || 'No name set'}
                    </h3>
                    <p style={{ color: '#666', margin: '0 0 4px 0', fontSize: '14px' }}>
                      {userItem.email}
                    </p>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        backgroundColor: getRoleColor(userItem.role) + '20',
                        color: getRoleColor(userItem.role),
                        textTransform: 'capitalize'
                      }}>
                        {userItem.role}
                      </span>
                      {userItem.role === 'admin' && (
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          backgroundColor: getVerificationColor(userItem.verification_status) + '20',
                          color: getVerificationColor(userItem.verification_status),
                          textTransform: 'capitalize'
                        }}>
                          {getVerificationText(userItem.verification_status)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', color: '#999' }}>
                      {new Date(userItem.created_at).toLocaleDateString()}
                    </span>
                    {user?.role === 'master' && userItem.id !== user.id && (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {userItem.role === 'admin' && userItem.verification_status !== 'pending' && (
                          <button
                            onClick={() => handleVerificationUpdate(userItem.id, userItem.verification_status, userItem.email)}
                            className="btn btn-secondary"
                            style={{ padding: '6px 10px', fontSize: '11px' }}
                            disabled={updateVerificationMutation.isPending}
                          >
                            {userItem.verification_status === 'approved' ? '❌' : '✅'}
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteUser(userItem.id, userItem.email)}
                          className="btn btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '11px' }}
                          disabled={deleteUserMutation.isPending}
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
              <p style={{ color: '#666' }}>No users found</p>
            </div>
          )}
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
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
            maxWidth: '500px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px', color: 'var(--primary-color)' }}>
              Create New User
            </h2>

            <form onSubmit={handleCreateUser}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="Enter email"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Enter password"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Role</label>
                <select
                  className="form-input"
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'admin' | 'player' })}
                >
                  <option value="player">Player</option>
                  <option value="admin">Admin</option>
                </select>
                {newUser.role === 'admin' && (
                  <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                    ⚠️ Admin users will require approval from the master user before they can access admin features.
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  disabled={createUserMutation.isPending}
                >
                  {createUserMutation.isPending ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}

export default Admin
