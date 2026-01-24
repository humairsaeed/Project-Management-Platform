import { useState } from 'react'
import { User, Mail, Shield, Key, Save, Clock } from 'lucide-react'
import { useAuthStore } from '../store/authSlice'
import { useTeamStore } from '../store/teamSlice'
import Avatar from '../components/common/Avatar'

export default function ProfilePage() {
  const { user: authUser } = useAuthStore()
  const { users, updateUser, resetUserPassword, loading } = useTeamStore()

  // Find the full user object from team store
  const fullUser = users.find((u) => u.id === authUser?.id)

  const [editing, setEditing] = useState(false)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [editedUser, setEditedUser] = useState({
    firstName: fullUser?.firstName || '',
    lastName: fullUser?.lastName || '',
    email: fullUser?.email || '',
    avatarUrl: fullUser?.avatarUrl || '',
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-slate-400">Loading profile...</p>
      </div>
    )
  }

  if (!authUser || !fullUser) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-slate-400">User not found</p>
      </div>
    )
  }

  const handleAvatarInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target
    const file = input.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      input.value = ''
      return
    }

    const maxBytes = 2 * 1024 * 1024
    if (file.size > maxBytes) {
      alert('Image must be 2MB or smaller')
      input.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setEditedUser((prev) => ({ ...prev, avatarUrl: reader.result as string }))
      }
      input.value = ''
    }
    reader.readAsDataURL(file)
  }

  const handleSaveProfile = async () => {
    if (!editedUser.firstName || !editedUser.lastName || !editedUser.email) {
      setError('All fields are required')
      return
    }

    try {
      await updateUser(fullUser.id, {
        firstName: editedUser.firstName,
        lastName: editedUser.lastName,
        email: editedUser.email,
        avatarUrl: editedUser.avatarUrl || undefined,
      })
    } catch (error) {
      setError('Failed to update profile')
      return
    }

    setEditing(false)
    setSuccess('Profile updated successfully')
    setTimeout(() => setSuccess(''), 3000)
  }

  const handleChangePassword = async () => {
    setError('')

    // Validate new password
    if (passwordData.newPassword.length < 6) {
      setError('New password must be at least 6 characters')
      return
    }

    // Validate password confirmation
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    try {
      await resetUserPassword(fullUser.id, passwordData.newPassword, passwordData.currentPassword)
    } catch (error) {
      setError('Failed to update password')
      return
    }

    setShowPasswordDialog(false)
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    })
    setSuccess('Password changed successfully')
    setTimeout(() => setSuccess(''), 3000)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'project_manager':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'contributor':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrator'
      case 'project_manager':
        return 'Project Manager'
      case 'contributor':
        return 'Contributor'
      default:
        return role
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">My Profile</h1>
        <p className="text-slate-400">Manage your account settings</p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-500/10 border border-green-500 text-green-500 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Profile Card */}
      <div className="card">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <Avatar
              name={`${fullUser.firstName} ${fullUser.lastName}`}
              size="lg"
              imageUrl={fullUser.avatarUrl}
            />
            <div>
              <h2 className="text-xl font-bold text-white">
                {fullUser.firstName} {fullUser.lastName}
              </h2>
              <p className="text-slate-400">{fullUser.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span
                  className={`px-2 py-0.5 rounded-full text-xs ${
                    fullUser.status === 'active'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-slate-500/20 text-slate-400'
                  }`}
                >
                  {fullUser.status}
                </span>
              </div>
            </div>
          </div>
          {!editing && (
            <button
              onClick={() => {
                setEditing(true)
                setEditedUser({
                  firstName: fullUser.firstName,
                  lastName: fullUser.lastName,
                  email: fullUser.email,
                  avatarUrl: fullUser.avatarUrl || '',
                })
              }}
              className="btn-secondary flex items-center gap-2"
            >
              <User size={16} />
              Edit Profile
            </button>
          )}
        </div>

        {editing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-400 block mb-2">First Name *</label>
                <input
                  type="text"
                  value={editedUser.firstName}
                  onChange={(e) => setEditedUser({ ...editedUser, firstName: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 block mb-2">Last Name *</label>
                <input
                  type="text"
                  value={editedUser.lastName}
                  onChange={(e) => setEditedUser({ ...editedUser, lastName: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-slate-400 block mb-2">Email *</label>
              <input
                type="email"
                value={editedUser.email}
                onChange={(e) => setEditedUser({ ...editedUser, email: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500"
              />
            </div>

            <div>
              <label className="text-sm text-slate-400 block mb-2">Profile Photo</label>
              <div className="flex items-center gap-3">
                <Avatar
                  name={`${editedUser.firstName} ${editedUser.lastName}`}
                  size="lg"
                  showTooltip={false}
                  imageUrl={editedUser.avatarUrl || undefined}
                />
                <div className="flex flex-col gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarInputChange}
                    className="text-sm text-slate-300"
                  />
                  {editedUser.avatarUrl && (
                    <button
                      type="button"
                      onClick={() => setEditedUser({ ...editedUser, avatarUrl: '' })}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Remove photo
                    </button>
                  )}
                  <span className="text-xs text-slate-500">PNG/JPG up to 2MB</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <button
                onClick={() => {
                  setEditing(false)
                  setError('')
                }}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                className="flex-1 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Save size={16} />
                Save Changes
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Personal Information */}
            <div>
              <h3 className="text-sm font-semibold text-slate-400 mb-3 uppercase">
                Personal Information
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail size={16} className="text-slate-500" />
                  <span className="text-slate-300">{fullUser.email}</span>
                </div>
              </div>
            </div>

            {/* Roles */}
            <div>
              <h3 className="text-sm font-semibold text-slate-400 mb-3 uppercase">
                Roles
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                {fullUser.roles.map((role) => (
                  <span
                    key={role}
                    className={`px-3 py-1.5 rounded text-sm border ${getRoleBadgeColor(role)}`}
                  >
                    <Shield size={14} className="inline mr-1" />
                    {getRoleLabel(role)}
                  </span>
                ))}
              </div>
            </div>

            {/* Activity */}
            <div>
              <h3 className="text-sm font-semibold text-slate-400 mb-3 uppercase">
                Activity
              </h3>
              <div className="flex items-center gap-3 text-slate-300">
                <Clock size={16} className="text-slate-500" />
                <span>Last active: {fullUser.lastActive}</span>
              </div>
              {fullUser.loginHistory && fullUser.loginHistory.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-slate-500 mb-2">Recent Logins</p>
                  <div className="space-y-2">
                    {fullUser.loginHistory.slice(-5).reverse().map((event, index) => (
                      <div
                        key={index}
                        className="text-xs text-slate-400 p-2 bg-slate-800/50 rounded"
                      >
                        <div>{new Date(event.timestamp).toLocaleString()}</div>
                        {event.userAgent && (
                          <div className="text-slate-500 truncate">{event.userAgent}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Security Settings */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-4">Security</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
            <div>
              <h3 className="text-white font-medium">Password</h3>
              <p className="text-sm text-slate-400">Change your account password</p>
            </div>
            <button
              onClick={() => setShowPasswordDialog(true)}
              className="btn-secondary flex items-center gap-2"
            >
              <Key size={16} />
              Change Password
            </button>
          </div>
        </div>
      </div>

      {/* Change Password Dialog */}
      {showPasswordDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              setShowPasswordDialog(false)
              setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
              })
              setError('')
            }}
          />
          <div className="relative bg-slate-800/95 backdrop-blur-xl border border-slate-600/50 rounded-xl shadow-2xl p-6 w-full max-w-md animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-semibold text-white mb-4">Change Password</h3>

            {error && (
              <div className="bg-red-500/10 border border-red-500 text-red-500 px-3 py-2 rounded-lg text-sm mb-4">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 block mb-2">Current Password *</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  placeholder="Enter current password"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="text-sm text-slate-400 block mb-2">New Password *</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  placeholder="Enter new password (min 6 characters)"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="text-sm text-slate-400 block mb-2">Confirm New Password *</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  placeholder="Confirm new password"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => {
                  setShowPasswordDialog(false)
                  setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                  })
                  setError('')
                }}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                disabled={!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                className="flex-1 px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
              >
                Change Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
