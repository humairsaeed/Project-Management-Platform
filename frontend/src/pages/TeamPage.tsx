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
} from 'lucide-react'
import Avatar from '../components/common/Avatar'

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  roles: string[]
  teams: string[]
  status: 'active' | 'inactive'
  lastActive: string
}

interface Team {
  id: string
  name: string
  description: string
  members: string[]
  lead: string
}

const mockUsers: User[] = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@company.com',
    roles: ['admin'],
    teams: ['Security', 'Leadership'],
    status: 'active',
    lastActive: '2 minutes ago',
  },
  {
    id: '2',
    firstName: 'Sarah',
    lastName: 'Jones',
    email: 'sarah.jones@company.com',
    roles: ['project_manager'],
    teams: ['Cloud Services'],
    status: 'active',
    lastActive: '5 minutes ago',
  },
  {
    id: '3',
    firstName: 'Mike',
    lastName: 'Wilson',
    email: 'mike.wilson@company.com',
    roles: ['contributor'],
    teams: ['Security', 'IT Infrastructure'],
    status: 'active',
    lastActive: '1 hour ago',
  },
]

const mockTeams: Team[] = [
  {
    id: 't1',
    name: 'Security',
    description: 'Security and compliance team',
    members: ['1', '3'],
    lead: '1',
  },
  {
    id: 't2',
    name: 'Cloud Services',
    description: 'Cloud infrastructure and services',
    members: ['2'],
    lead: '2',
  },
]

type TabType = 'users' | 'teams'

export default function TeamPage() {
  const [activeTab, setActiveTab] = useState<TabType>('users')
  const [searchTerm, setSearchTerm] = useState('')
  const [users, setUsers] = useState<User[]>(mockUsers)
  const [teams, setTeams] = useState<Team[]>(mockTeams)
  const [showAddUserDialog, setShowAddUserDialog] = useState(false)
  const [showAddTeamDialog, setShowAddTeamDialog] = useState(false)
  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    roles: ['contributor'] as string[],
    teams: [] as string[],
  })
  const [newTeam, setNewTeam] = useState({
    name: '',
    description: '',
    lead: '',
    members: [] as string[],
  })

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

  const handleAddUser = () => {
    if (!newUser.firstName || !newUser.lastName || !newUser.email) return

    const user: User = {
      id: `u${Date.now()}`,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      email: newUser.email,
      roles: newUser.roles,
      teams: newUser.teams,
      status: 'active',
      lastActive: 'Just now',
    }

    setUsers([...users, user])
    setShowAddUserDialog(false)
    setNewUser({
      firstName: '',
      lastName: '',
      email: '',
      roles: ['contributor'],
      teams: [],
    })
  }

  const handleAddTeam = () => {
    if (!newTeam.name || !newTeam.lead) return

    const team: Team = {
      id: `t${Date.now()}`,
      name: newTeam.name,
      description: newTeam.description,
      members: newTeam.members,
      lead: newTeam.lead,
    }

    setTeams([...teams, team])
    setShowAddTeamDialog(false)
    setNewTeam({
      name: '',
      description: '',
      lead: '',
      members: [],
    })
  }

  const handleDeleteUser = (userId: string) => {
    setUsers(users.filter((u) => u.id !== userId))
  }

  const handleToggleUserStatus = (userId: string) => {
    setUsers(
      users.map((u) =>
        u.id === userId ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } : u
      )
    )
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
                    {user.teams.map((team) => (
                      <span
                        key={team}
                        className="px-2 py-1 rounded text-xs bg-slate-700 text-slate-300"
                      >
                        {team}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
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
                  <button className="p-1.5 rounded hover:bg-slate-700 text-slate-400">
                    <MoreVertical size={16} />
                  </button>
                </div>

                {teamLead && (
                  <div className="mb-3 p-2 bg-slate-700/50 rounded">
                    <div className="text-xs text-slate-500 mb-1">Team Lead</div>
                    <div className="flex items-center gap-2">
                      <Avatar
                        name={`${teamLead.firstName} ${teamLead.lastName}`}
                        size="sm"
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
                <label className="text-sm text-slate-400 block mb-2">Role *</label>
                <select
                  value={newUser.roles[0]}
                  onChange={(e) => setNewUser({ ...newUser, roles: [e.target.value] })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500"
                >
                  <option value="contributor">Contributor</option>
                  <option value="project_manager">Project Manager</option>
                  <option value="admin">Administrator</option>
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
                disabled={!newUser.firstName || !newUser.lastName || !newUser.email}
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
    </div>
  )
}
