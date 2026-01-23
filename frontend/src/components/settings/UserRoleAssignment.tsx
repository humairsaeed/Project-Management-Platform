import { useState, useMemo } from 'react'
import { Shield, Search, ChevronDown } from 'lucide-react'
import { useTeamStore } from '../../store/teamSlice'
import Avatar from '../common/Avatar'

interface Props {
  isAdmin: boolean
}

export default function UserRoleAssignment({ isAdmin }: Props) {
  const { users, teams, roles, updateUser } = useTeamStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [editingUser, setEditingUser] = useState<string | null>(null)

  // Transform users for display
  const displayUsers = useMemo(() => {
    return users.map((user) => {
      const userTeams = user.teams
        .map((teamId) => teams.find((t) => t.id === teamId)?.name)
        .filter(Boolean)
        .join(', ') || 'No team'

      const primaryRole = user.roles[0] || 'contributor'
      const roleName = roles.find((r) => r.name === primaryRole)?.displayName || primaryRole

      return {
        ...user,
        teamNames: userTeams,
        primaryRole,
        roleName,
      }
    })
  }, [users, teams, roles])

  const filteredUsers = useMemo(() => {
    return displayUsers.filter((user) => {
      const matchesSearch =
        user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesRole = roleFilter === 'all' || user.primaryRole === roleFilter
      return matchesSearch && matchesRole
    })
  }, [displayUsers, searchQuery, roleFilter])

  const handleRoleChange = (userId: string, newRole: string) => {
    const user = users.find((u) => u.id === userId)
    if (user) {
      // Update the user's primary role
      updateUser(userId, {
        roles: [newRole],
      })
    }
    setEditingUser(null)
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">User Permissions</h2>
          <p className="text-sm text-slate-400">Assign roles to users in the system</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-primary-500"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
        >
          <option value="all">All Roles</option>
          {roles.map((role) => (
            <option key={role.id} value={role.name}>
              {role.displayName}
            </option>
          ))}
        </select>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left py-3 px-4 text-slate-400 font-medium">User</th>
              <th className="text-left py-3 px-4 text-slate-400 font-medium">Team</th>
              <th className="text-left py-3 px-4 text-slate-400 font-medium">Role</th>
              <th className="text-left py-3 px-4 text-slate-400 font-medium">Last Active</th>
              {isAdmin && (
                <th className="text-right py-3 px-4 text-slate-400 font-medium">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-slate-800/50">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <Avatar
                      name={`${user.firstName} ${user.lastName}`}
                      size="md"
                      imageUrl={user.avatarUrl}
                    />
                    <div>
                      <div className="font-medium text-white">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-sm text-slate-400">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 text-slate-300">{user.teamNames}</td>
                <td className="py-3 px-4">
                  {editingUser === user.id ? (
                    <div className="relative">
                      <select
                        value={user.primaryRole}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        onBlur={() => setEditingUser(null)}
                        autoFocus
                        className="px-3 py-1.5 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:border-primary-500"
                      >
                        {roles.map((role) => (
                          <option key={role.id} value={role.name}>
                            {role.displayName}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm border ${getRoleBadgeColor(
                        user.primaryRole
                      )}`}
                    >
                      <Shield size={12} />
                      {user.roleName}
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-slate-400 text-sm">{user.lastActive}</td>
                {isAdmin && (
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setEditingUser(user.id)}
                      className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1 ml-auto"
                    >
                      Change Role
                      <ChevronDown size={14} />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-8 text-slate-400">No users found matching your criteria</div>
      )}
    </div>
  )
}
