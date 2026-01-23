import { useState } from 'react'
import { Shield, Check, X, Edit2, Eye } from 'lucide-react'

interface Permission {
  create: boolean
  read: boolean
  update: boolean
  delete: boolean
}

interface Role {
  id: string
  name: string
  displayName: string
  description: string
  isSystemRole: boolean
  permissions: {
    projects: Permission & { archive: boolean }
    tasks: Permission & { assign: boolean; move: boolean }
    users: Permission & { manage_roles: boolean }
    settings: { access: boolean; manage_roles: boolean; view_audit: boolean }
  }
}

const mockRoles: Role[] = [
  {
    id: '1',
    name: 'admin',
    displayName: 'Administrator',
    description: 'Full system access including user management and settings',
    isSystemRole: true,
    permissions: {
      projects: { create: true, read: true, update: true, delete: true, archive: true },
      tasks: { create: true, read: true, update: true, delete: true, assign: true, move: true },
      users: { create: true, read: true, update: true, delete: true, manage_roles: true },
      settings: { access: true, manage_roles: true, view_audit: true },
    },
  },
  {
    id: '2',
    name: 'project_manager',
    displayName: 'Project Manager',
    description: 'Can manage projects and tasks, assign team members',
    isSystemRole: true,
    permissions: {
      projects: { create: true, read: true, update: true, delete: false, archive: false },
      tasks: { create: true, read: true, update: true, delete: true, assign: true, move: true },
      users: { create: false, read: true, update: false, delete: false, manage_roles: false },
      settings: { access: false, manage_roles: false, view_audit: true },
    },
  },
  {
    id: '3',
    name: 'contributor',
    displayName: 'Contributor',
    description: 'Can view and update assigned tasks',
    isSystemRole: true,
    permissions: {
      projects: { create: false, read: true, update: false, delete: false, archive: false },
      tasks: { create: true, read: true, update: true, delete: false, assign: false, move: true },
      users: { create: false, read: true, update: false, delete: false, manage_roles: false },
      settings: { access: false, manage_roles: false, view_audit: false },
    },
  },
]

interface Props {
  isAdmin: boolean
}

export default function RoleManager({ isAdmin }: Props) {
  const [roles, setRoles] = useState<Role[]>(mockRoles)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newRole, setNewRole] = useState<Partial<Role>>({
    name: '',
    displayName: '',
    description: '',
    isSystemRole: false,
    permissions: {
      projects: { create: false, read: true, update: false, delete: false, archive: false },
      tasks: { create: false, read: true, update: false, delete: false, assign: false, move: false },
      users: { create: false, read: true, update: false, delete: false, manage_roles: false },
      settings: { access: false, manage_roles: false, view_audit: false },
    },
  })

  const handleCreateRole = () => {
    if (!newRole.name || !newRole.displayName) return

    const role: Role = {
      id: `custom-${Date.now()}`,
      name: newRole.name!,
      displayName: newRole.displayName!,
      description: newRole.description || '',
      isSystemRole: false,
      permissions: newRole.permissions!,
    }

    setRoles([...roles, role])
    setShowCreateDialog(false)
    setSelectedRole(role)
    // Reset form
    setNewRole({
      name: '',
      displayName: '',
      description: '',
      isSystemRole: false,
      permissions: {
        projects: { create: false, read: true, update: false, delete: false, archive: false },
        tasks: { create: false, read: true, update: false, delete: false, assign: false, move: false },
        users: { create: false, read: true, update: false, delete: false, manage_roles: false },
        settings: { access: false, manage_roles: false, view_audit: false },
      },
    })
  }

  const PermissionBadge = ({ allowed }: { allowed: boolean }) => (
    <span
      className={`inline-flex items-center justify-center w-6 h-6 rounded ${
        allowed ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
      }`}
    >
      {allowed ? <Check size={14} /> : <X size={14} />}
    </span>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Role Management</h2>
          <p className="text-sm text-slate-400">Define permissions for each role in the system</p>
        </div>
        {isAdmin && (
          <button className="btn-primary" onClick={() => setShowCreateDialog(true)}>
            Create Custom Role
          </button>
        )}
      </div>

      {/* Roles List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {roles.map((role) => (
          <div
            key={role.id}
            onClick={() => setSelectedRole(role)}
            className={`p-4 rounded-lg border cursor-pointer transition-all ${
              selectedRole?.id === role.id
                ? 'border-primary-500 bg-primary-500/10'
                : 'border-slate-700 hover:border-slate-600 bg-slate-800/50'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary-500/20">
                  <Shield size={20} className="text-primary-400" />
                </div>
                <div>
                  <h3 className="font-medium text-white">{role.displayName}</h3>
                  <p className="text-xs text-slate-400">{role.description}</p>
                </div>
              </div>
              {role.isSystemRole && (
                <span className="text-xs px-2 py-1 rounded bg-slate-700 text-slate-400">
                  System
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Permission Matrix */}
      {selectedRole && (
        <div className="mt-6 p-4 rounded-lg bg-slate-800/50 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-white">
              Permissions: {selectedRole.displayName}
            </h3>
            {isAdmin && !selectedRole.isSystemRole && (
              <button className="btn-secondary text-sm">
                <Edit2 size={14} className="mr-2" />
                Edit Permissions
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Resource</th>
                  <th className="text-center py-3 px-2 text-slate-400 font-medium">Create</th>
                  <th className="text-center py-3 px-2 text-slate-400 font-medium">Read</th>
                  <th className="text-center py-3 px-2 text-slate-400 font-medium">Update</th>
                  <th className="text-center py-3 px-2 text-slate-400 font-medium">Delete</th>
                  <th className="text-center py-3 px-2 text-slate-400 font-medium">Special</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                <tr>
                  <td className="py-3 px-4 text-white">Projects</td>
                  <td className="text-center py-3 px-2">
                    <PermissionBadge allowed={selectedRole.permissions.projects.create} />
                  </td>
                  <td className="text-center py-3 px-2">
                    <PermissionBadge allowed={selectedRole.permissions.projects.read} />
                  </td>
                  <td className="text-center py-3 px-2">
                    <PermissionBadge allowed={selectedRole.permissions.projects.update} />
                  </td>
                  <td className="text-center py-3 px-2">
                    <PermissionBadge allowed={selectedRole.permissions.projects.delete} />
                  </td>
                  <td className="text-center py-3 px-2">
                    <span className="text-xs text-slate-400">
                      Archive: <PermissionBadge allowed={selectedRole.permissions.projects.archive} />
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-white">Tasks</td>
                  <td className="text-center py-3 px-2">
                    <PermissionBadge allowed={selectedRole.permissions.tasks.create} />
                  </td>
                  <td className="text-center py-3 px-2">
                    <PermissionBadge allowed={selectedRole.permissions.tasks.read} />
                  </td>
                  <td className="text-center py-3 px-2">
                    <PermissionBadge allowed={selectedRole.permissions.tasks.update} />
                  </td>
                  <td className="text-center py-3 px-2">
                    <PermissionBadge allowed={selectedRole.permissions.tasks.delete} />
                  </td>
                  <td className="text-center py-3 px-2 space-x-2">
                    <span className="text-xs text-slate-400">
                      Assign: <PermissionBadge allowed={selectedRole.permissions.tasks.assign} />
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-white">Users</td>
                  <td className="text-center py-3 px-2">
                    <PermissionBadge allowed={selectedRole.permissions.users.create} />
                  </td>
                  <td className="text-center py-3 px-2">
                    <PermissionBadge allowed={selectedRole.permissions.users.read} />
                  </td>
                  <td className="text-center py-3 px-2">
                    <PermissionBadge allowed={selectedRole.permissions.users.update} />
                  </td>
                  <td className="text-center py-3 px-2">
                    <PermissionBadge allowed={selectedRole.permissions.users.delete} />
                  </td>
                  <td className="text-center py-3 px-2">
                    <span className="text-xs text-slate-400">
                      Manage Roles: <PermissionBadge allowed={selectedRole.permissions.users.manage_roles} />
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-white">Settings</td>
                  <td className="text-center py-3 px-2" colSpan={4}>
                    <div className="flex items-center justify-center gap-4">
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Eye size={12} /> Access: <PermissionBadge allowed={selectedRole.permissions.settings.access} />
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        Audit: <PermissionBadge allowed={selectedRole.permissions.settings.view_audit} />
                      </span>
                    </div>
                  </td>
                  <td className="text-center py-3 px-2">
                    <span className="text-xs text-slate-400">
                      Manage: <PermissionBadge allowed={selectedRole.permissions.settings.manage_roles} />
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Role Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowCreateDialog(false)}
          />
          <div className="relative bg-slate-800/95 backdrop-blur-xl border border-slate-600/50 rounded-xl shadow-2xl p-6 w-full max-w-lg animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-semibold text-white mb-4">Create Custom Role</h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 block mb-2">Role Name (Identifier) *</label>
                <input
                  type="text"
                  value={newRole.name}
                  onChange={(e) => setNewRole({ ...newRole, name: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                  placeholder="e.g., senior_developer"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="text-sm text-slate-400 block mb-2">Display Name *</label>
                <input
                  type="text"
                  value={newRole.displayName}
                  onChange={(e) => setNewRole({ ...newRole, displayName: e.target.value })}
                  placeholder="e.g., Senior Developer"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="text-sm text-slate-400 block mb-2">Description</label>
                <textarea
                  value={newRole.description}
                  onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                  placeholder="Describe the role's purpose..."
                  rows={2}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setShowCreateDialog(false)}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRole}
                disabled={!newRole.name || !newRole.displayName}
                className="flex-1 px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
              >
                Create Role
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
