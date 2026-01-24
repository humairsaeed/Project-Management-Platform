import { useState } from 'react'
import {
  Users,
  UserPlus,
  Search,
  Mail,
  Shield,
  MoreVertical,
  Trash2,
  UserX,
  Check,
  Edit2,
  Key,
} from 'lucide-react'
import Avatar from '../components/common/Avatar'
import { useTeamStore, User, Team } from '../store/teamSlice'

type TabType = 'users' | 'teams'

export default function TeamPage() {
  const { users, teams, roles, addUser, updateUser, deleteUser, toggleUserStatus, addTeam, updateTeam, deleteTeam } = useTeamStore()
  const [activeTab, setActiveTab] = useState<TabType>('users')
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddUserDialog, setShowAddUserDialog] = useState(false)
  const [showAddTeamDialog, setShowAddTeamDialog] = useState(false)
  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    avatarUrl: '',
    roles: ['contributor'] as string[],
    teams: [] as string[],
  })
  const [newTeam, setNewTeam] = useState({
    name: '',
    description: '',
    lead: '',
    members: [] as string[],
  })
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [showEditUserDialog, setShowEditUserDialog] = useState(false)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [showEditTeamDialog, setShowEditTeamDialog] = useState(false)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [passwordUserId, setPasswordUserId] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [teamMenuOpen, setTeamMenuOpen] = useState<string | null>(null)

  // Helper function to get team name from ID
  const getTeamName = (teamId: string) => {
    const team = teams.find((t) => t.id === teamId)
    return team?.name || teamId
  }

  const handleAvatarInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    onChange: (dataUrl: string) => void
  ) => {
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
        onChange(reader.result)
      }
      input.value = ''
    }
    reader.readAsDataURL(file)
  }

  const filteredUsers = users.filter(
    (user) =>
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredTeams = teams.filter(
    (team) =>
      team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddUser = async () => {
    if (!newUser.firstName || !newUser.lastName || !newUser.email || !newUser.password) {
      alert('Please fill in all required fields')
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newUser.email)) {
      alert('Please enter a valid email address')
      return
    }

    // Check if email already exists
    if (users.some((u) => u.email.toLowerCase() === newUser.email.toLowerCase())) {
      alert('A user with this email already exists')
      return
    }

    // Ensure at least one role is selected
    if (newUser.roles.length === 0) {
      alert('Please select at least one role')
      return
    }

    // Validate password length
    if (newUser.password.length < 6) {
      alert('Password must be at least 6 characters long')
      return
    }

    try {
      await addUser({
        firstName: newUser.firstName.trim(),
        lastName: newUser.lastName.trim(),
        email: newUser.email.trim().toLowerCase(),
        password: newUser.password,
        avatarUrl: newUser.avatarUrl || undefined,
        roles: newUser.roles,
        teams: newUser.teams,
        isActive: true,
      })
    } catch (error) {
      alert('Failed to create user')
      return
    }

    setShowAddUserDialog(false)
    setNewUser({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      avatarUrl: '',
      roles: ['contributor'],
      teams: [],
    })
  }

  const handleAddTeam = async () => {
    if (!newTeam.name || !newTeam.lead) return

    try {
      await addTeam({
        name: newTeam.name,
        description: newTeam.description,
        leadUserId: newTeam.lead,
        members: newTeam.members,
      })
    } catch (error) {
      alert('Failed to create team')
      return
    }
    setShowAddTeamDialog(false)
    setNewTeam({
      name: '',
      description: '',
      lead: '',
      members: [],
    })
  }

  const handleDeleteUser = async (userId: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteUser(userId)
      } catch (error) {
        alert('Failed to delete user')
      }
    }
  }

  const handleToggleUserStatus = async (userId: string) => {
    try {
      await toggleUserStatus(userId)
    } catch (error) {
      alert('Failed to update user status')
    }
  }

  const handleEditUser = (user: User) => {
    setEditingUser({ ...user })
    setShowEditUserDialog(true)
  }

  const handleSaveUser = async () => {
    if (!editingUser) return

    // Validation
    if (!editingUser.firstName || !editingUser.lastName || !editingUser.email) {
      alert('Please fill in all required fields')
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(editingUser.email)) {
      alert('Please enter a valid email address')
      return
    }

    // Check if email already exists (excluding current user)
    if (users.some((u) => u.id !== editingUser.id && u.email.toLowerCase() === editingUser.email.toLowerCase())) {
      alert('A user with this email already exists')
      return
    }

    // Ensure at least one role is selected
    if (editingUser.roles.length === 0) {
      alert('Please select at least one role')
      return
    }

    try {
      await updateUser(editingUser.id, {
        firstName: editingUser.firstName.trim(),
        lastName: editingUser.lastName.trim(),
        email: editingUser.email.trim().toLowerCase(),
        avatarUrl: editingUser.avatarUrl,
        roles: editingUser.roles,
        teams: editingUser.teams,
      })
    } catch (error) {
      alert('Failed to update user')
      return
    }

    setShowEditUserDialog(false)
    setEditingUser(null)
  }

  const handleEditTeam = (team: Team) => {
    setEditingTeam({ ...team })
    setShowEditTeamDialog(true)
    setTeamMenuOpen(null)
  }

  const handleSaveTeam = async () => {
    if (!editingTeam) return

    try {
      await updateTeam(editingTeam.id, {
        name: editingTeam.name,
        description: editingTeam.description,
        leadUserId: editingTeam.lead,
        members: editingTeam.members,
      })
    } catch (error) {
      alert('Failed to update team')
      return
    }

    setShowEditTeamDialog(false)
    setEditingTeam(null)
  }

  const handleDeleteTeam = async (teamId: string) => {
    if (confirm('Are you sure you want to delete this team?')) {
      try {
        await deleteTeam(teamId)
      } catch (error) {
        alert('Failed to delete team')
        return
      }
      setTeamMenuOpen(null)
    }
  }

  const handleResetPassword = (userId: string) => {
    setPasswordUserId(userId)
    setShowPasswordDialog(true)
  }

  const handleSavePassword = async () => {
    if (!passwordUserId || !newPassword) return

    const { resetUserPassword } = useTeamStore.getState()
    try {
      await resetUserPassword(passwordUserId, newPassword)
    } catch (error) {
      alert('Failed to reset password')
      return
    }

    setShowPasswordDialog(false)
    setPasswordUserId(null)
    setNewPassword('')
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
        return 'Admin'
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Team Management</h1>
          <p className="text-slate-400">Manage users and teams</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-700">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-3 font-medium text-sm transition-colors relative ${
            activeTab === 'users'
              ? 'text-primary-400'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <Users size={18} />
            Users
            <span className="ml-1 px-2 py-0.5 rounded-full bg-slate-700 text-xs">
              {users.length}
            </span>
          </div>
          {activeTab === 'users' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('teams')}
          className={`px-4 py-3 font-medium text-sm transition-colors relative ${
            activeTab === 'teams'
              ? 'text-primary-400'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <Shield size={18} />
            Teams
            <span className="ml-1 px-2 py-0.5 rounded-full bg-slate-700 text-xs">
              {teams.length}
            </span>
          </div>
          {activeTab === 'teams' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500" />
          )}
        </button>
      </div>

      {/* Search and Actions */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-primary-500 transition-colors"
          />
        </div>
        {activeTab === 'users' && (
          <button
            onClick={() => setShowAddUserDialog(true)}
            className="btn-primary flex items-center gap-2"
          >
            <UserPlus size={18} />
            Add User
          </button>
        )}
        {activeTab === 'teams' && (
          <button
            onClick={() => setShowAddTeamDialog(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Users size={18} />
            Create Team
          </button>
        )}
      </div>

      {/* Users List */}
      {activeTab === 'users' && (
        <div className="grid gap-4">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg hover:border-slate-600 transition-colors"
            >
              <div className="flex items-start gap-4">
                <Avatar
                  name={`${user.firstName} ${user.lastName}`}
                  size="lg"
                  imageUrl={user.avatarUrl}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-white font-medium">
                      {user.firstName} {user.lastName}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs ${
                        user.status === 'active'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-slate-500/20 text-slate-400'
                      }`}
                    >
                      {user.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                    <Mail size={14} />
                    {user.email}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {user.roles.map((role) => (
                      <span
                        key={role}
                        className={`px-2 py-1 rounded text-xs border ${getRoleBadgeColor(
                          role
                        )}`}
                      >
                        {getRoleLabel(role)}
                      </span>
                    ))}
                    {user.teams.map((teamId) => (
                      <span
                        key={teamId}
                        className="px-2 py-1 rounded text-xs bg-slate-700 text-slate-300"
                      >
                        {getTeamName(teamId)}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEditUser(user)}
                    className="p-2 rounded-lg hover:bg-primary-500/20 text-slate-400 hover:text-primary-400 transition-colors"
                    title="Edit User"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleResetPassword(user.id)}
                    className="p-2 rounded-lg hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 transition-colors"
                    title="Reset Password"
                  >
                    <Key size={18} />
                  </button>
                  <button
                    onClick={() => handleToggleUserStatus(user.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      user.status === 'active'
                        ? 'hover:bg-amber-500/20 text-slate-400 hover:text-amber-400'
                        : 'hover:bg-green-500/20 text-slate-400 hover:text-green-400'
                    }`}
                    title={user.status === 'active' ? 'Deactivate' : 'Activate'}
                  >
                    {user.status === 'active' ? (
                      <UserX size={18} />
                    ) : (
                      <Check size={18} />
                    )}
                  </button>
                  <button
                    onClick={() => handleDeleteUser(user.id)}
                    className="p-2 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                    title="Delete User"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Teams List */}
      {activeTab === 'teams' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTeams.map((team) => {
            const teamLead = users.find((u) => u.id === team.lead)
            return (
              <div
                key={team.id}
                className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg hover:border-slate-600 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-white font-medium mb-1">{team.name}</h3>
                    <p className="text-sm text-slate-400">{team.description}</p>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() =>
                        setTeamMenuOpen(teamMenuOpen === team.id ? null : team.id)
                      }
                      className="p-1.5 rounded hover:bg-slate-700 text-slate-400"
                    >
                      <MoreVertical size={16} />
                    </button>
                    {teamMenuOpen === team.id && (
                      <div className="absolute right-0 mt-2 w-40 bg-slate-700 border border-slate-600 rounded-lg shadow-xl z-10">
                        <button
                          onClick={() => handleEditTeam(team)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white hover:bg-slate-600 rounded-t-lg transition-colors"
                        >
                          <Edit2 size={14} />
                          Edit Team
                        </button>
                        <button
                          onClick={() => handleDeleteTeam(team.id)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-slate-600 rounded-b-lg transition-colors"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {teamLead && (
                  <div className="mb-3 p-2 bg-slate-700/50 rounded">
                    <div className="text-xs text-slate-500 mb-1">Team Lead</div>
                    <div className="flex items-center gap-2">
                      <Avatar
                        name={`${teamLead.firstName} ${teamLead.lastName}`}
                        size="sm"
                        imageUrl={teamLead.avatarUrl}
                      />
                      <span className="text-sm text-white">
                        {teamLead.firstName} {teamLead.lastName}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">
                    {team.members.length} member{team.members.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add User Dialog */}
      {showAddUserDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowAddUserDialog(false)}
          />
          <div className="relative bg-slate-800/95 backdrop-blur-xl border border-slate-600/50 rounded-xl shadow-2xl p-6 w-full max-w-lg animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-semibold text-white mb-4">Add New User</h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-400 block mb-2">First Name *</label>
                  <input
                    type="text"
                    value={newUser.firstName}
                    onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400 block mb-2">Last Name *</label>
                  <input
                    type="text"
                    value={newUser.lastName}
                    onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-slate-400 block mb-2">Email *</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="text-sm text-slate-400 block mb-2">Initial Password *</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Enter initial password"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="text-sm text-slate-400 block mb-2">Profile Photo</label>
                <div className="flex items-center gap-3">
                  <Avatar
                    name={`${newUser.firstName || 'New'} ${newUser.lastName || 'User'}`}
                    size="lg"
                    showTooltip={false}
                    imageUrl={newUser.avatarUrl || undefined}
                  />
                  <div className="flex flex-col gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        handleAvatarInputChange(e, (dataUrl) =>
                          setNewUser({ ...newUser, avatarUrl: dataUrl })
                        )
                      }
                      className="text-sm text-slate-300"
                    />
                    {newUser.avatarUrl && (
                      <button
                        type="button"
                        onClick={() => setNewUser({ ...newUser, avatarUrl: '' })}
                        className="text-xs text-slate-400 hover:text-white"
                      >
                        Remove photo
                      </button>
                    )}
                    <span className="text-xs text-slate-500">PNG/JPG up to 2MB</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm text-slate-400 block mb-2">Role *</label>
                <select
                  value={newUser.roles[0]}
                  onChange={(e) => setNewUser({ ...newUser, roles: [e.target.value] })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500"
                >
                  {roles.length > 0 ? (
                    roles.map((role) => (
                      <option key={role.id} value={role.name}>
                        {role.displayName}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="contributor">Contributor</option>
                      <option value="project_manager">Project Manager</option>
                      <option value="admin">Administrator</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setShowAddUserDialog(false)}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddUser}
                disabled={!newUser.firstName || !newUser.lastName || !newUser.email || !newUser.password}
                className="flex-1 px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
              >
                Add User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Team Dialog */}
      {showAddTeamDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowAddTeamDialog(false)}
          />
          <div className="relative bg-slate-800/95 backdrop-blur-xl border border-slate-600/50 rounded-xl shadow-2xl p-6 w-full max-w-lg animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-semibold text-white mb-4">Create Team</h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 block mb-2">Team Name *</label>
                <input
                  type="text"
                  value={newTeam.name}
                  onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="text-sm text-slate-400 block mb-2">Description</label>
                <textarea
                  value={newTeam.description}
                  onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
                  rows={2}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500 resize-none"
                />
              </div>

              <div>
                <label className="text-sm text-slate-400 block mb-2">Team Lead *</label>
                <select
                  value={newTeam.lead}
                  onChange={(e) => setNewTeam({ ...newTeam, lead: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500"
                >
                  <option value="">Select a team lead...</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.firstName} {user.lastName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setShowAddTeamDialog(false)}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddTeam}
                disabled={!newTeam.name || !newTeam.lead}
                className="flex-1 px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
              >
                Create Team
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Dialog */}
      {showEditUserDialog && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              setShowEditUserDialog(false)
              setEditingUser(null)
            }}
          />
          <div className="relative bg-slate-800/95 backdrop-blur-xl border border-slate-600/50 rounded-xl shadow-2xl p-6 w-full max-w-lg animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-semibold text-white mb-4">Edit User</h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 block mb-2">First Name *</label>
                <input
                  type="text"
                  value={editingUser.firstName}
                  onChange={(e) => setEditingUser({ ...editingUser, firstName: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="text-sm text-slate-400 block mb-2">Last Name *</label>
                <input
                  type="text"
                  value={editingUser.lastName}
                  onChange={(e) => setEditingUser({ ...editingUser, lastName: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="text-sm text-slate-400 block mb-2">Email *</label>
                <input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="text-sm text-slate-400 block mb-2">Profile Photo</label>
                <div className="flex items-center gap-3">
                  <Avatar
                    name={`${editingUser.firstName} ${editingUser.lastName}`}
                    size="lg"
                    showTooltip={false}
                    imageUrl={editingUser.avatarUrl}
                  />
                  <div className="flex flex-col gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        handleAvatarInputChange(e, (dataUrl) =>
                          setEditingUser({ ...editingUser, avatarUrl: dataUrl })
                        )
                      }
                      className="text-sm text-slate-300"
                    />
                    {editingUser.avatarUrl && (
                      <button
                        type="button"
                        onClick={() => setEditingUser({ ...editingUser, avatarUrl: undefined })}
                        className="text-xs text-slate-400 hover:text-white"
                      >
                        Remove photo
                      </button>
                    )}
                    <span className="text-xs text-slate-500">PNG/JPG up to 2MB</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm text-slate-400 block mb-2">Roles *</label>
                <div className="space-y-2">
                  {roles.map((role) => (
                    <label
                      key={role.id}
                      className="flex items-center gap-2 p-2 rounded hover:bg-slate-700 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={editingUser.roles.includes(role.name)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setEditingUser({
                              ...editingUser,
                              roles: [...editingUser.roles, role.name],
                            })
                          } else {
                            setEditingUser({
                              ...editingUser,
                              roles: editingUser.roles.filter((r) => r !== role.name),
                            })
                          }
                        }}
                        className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-primary-500 focus:ring-primary-500"
                      />
                      <span className="text-sm text-slate-300">
                        {role.displayName}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm text-slate-400 block mb-2">Teams</label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {teams.map((team) => (
                    <label
                      key={team.id}
                      className="flex items-center gap-2 p-2 rounded hover:bg-slate-700 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={editingUser.teams.includes(team.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setEditingUser({
                              ...editingUser,
                              teams: [...editingUser.teams, team.id],
                            })
                          } else {
                            setEditingUser({
                              ...editingUser,
                              teams: editingUser.teams.filter((t) => t !== team.id),
                            })
                          }
                        }}
                        className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-primary-500 focus:ring-primary-500"
                      />
                      <span className="text-sm text-slate-300">
                        {team.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => {
                  setShowEditUserDialog(false)
                  setEditingUser(null)
                }}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveUser}
                disabled={!editingUser.firstName || !editingUser.lastName || !editingUser.email || editingUser.roles.length === 0}
                className="flex-1 px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Reset Dialog */}
      {showPasswordDialog && passwordUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              setShowPasswordDialog(false)
              setPasswordUserId(null)
              setNewPassword('')
            }}
          />
          <div className="relative bg-slate-800/95 backdrop-blur-xl border border-slate-600/50 rounded-xl shadow-2xl p-6 w-full max-w-md animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-semibold text-white mb-4">Reset Password</h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 block mb-2">New Password *</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => {
                  setShowPasswordDialog(false)
                  setPasswordUserId(null)
                  setNewPassword('')
                }}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePassword}
                disabled={!newPassword}
                className="flex-1 px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
              >
                Reset Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Team Dialog */}
      {showEditTeamDialog && editingTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              setShowEditTeamDialog(false)
              setEditingTeam(null)
            }}
          />
          <div className="relative bg-slate-800/95 backdrop-blur-xl border border-slate-600/50 rounded-xl shadow-2xl p-6 w-full max-w-lg animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-semibold text-white mb-4">Edit Team</h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 block mb-2">Team Name *</label>
                <input
                  type="text"
                  value={editingTeam.name}
                  onChange={(e) => setEditingTeam({ ...editingTeam, name: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="text-sm text-slate-400 block mb-2">Description</label>
                <textarea
                  value={editingTeam.description}
                  onChange={(e) => setEditingTeam({ ...editingTeam, description: e.target.value })}
                  rows={2}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500 resize-none"
                />
              </div>

              <div>
                <label className="text-sm text-slate-400 block mb-2">Team Lead *</label>
                <select
                  value={editingTeam.lead}
                  onChange={(e) => setEditingTeam({ ...editingTeam, lead: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500"
                >
                  <option value="">Select a team lead...</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.firstName} {user.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm text-slate-400 block mb-2">Team Members</label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {users.map((user) => (
                    <label
                      key={user.id}
                      className="flex items-center gap-2 p-2 rounded hover:bg-slate-700 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={editingTeam.members.includes(user.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setEditingTeam({
                              ...editingTeam,
                              members: [...editingTeam.members, user.id],
                            })
                          } else {
                            setEditingTeam({
                              ...editingTeam,
                              members: editingTeam.members.filter((id) => id !== user.id),
                            })
                          }
                        }}
                        className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-primary-500 focus:ring-primary-500"
                      />
                      <span className="text-sm text-slate-300">
                        {user.firstName} {user.lastName}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => {
                  setShowEditTeamDialog(false)
                  setEditingTeam(null)
                }}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTeam}
                disabled={!editingTeam.name || !editingTeam.lead}
                className="flex-1 px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
