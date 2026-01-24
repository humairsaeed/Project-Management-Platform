import { create } from 'zustand'
import { useAuthStore } from './authSlice'
import teamService, { type ApiRole, type ApiTeam, type ApiUser, type CreateTeamPayload, type CreateUserPayload, type UpdateTeamPayload, type UpdateUserPayload } from '../services/teamService'

export interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  avatarUrl?: string
  roles: string[]
  teams: string[]
  status: 'active' | 'inactive'
  lastActive: string
  loginHistory?: LoginEvent[]
}

export interface LoginEvent {
  timestamp: string
  ipAddress?: string
  userAgent?: string
}

export interface Team {
  id: string
  name: string
  description: string
  members: string[]
  lead: string
}

export interface Role {
  id: string
  name: string
  displayName: string
  description: string
  isSystemRole: boolean
  permissions: {
    dashboard: { access: boolean; view_analytics: boolean }
    projects: { create: boolean; read: boolean; update: boolean; delete: boolean; archive: boolean }
    tasks: { create: boolean; read: boolean; update: boolean; delete: boolean; assign: boolean; move: boolean }
    team: { access: boolean; view_members: boolean; manage_members: boolean; manage_teams: boolean }
    users: { create: boolean; read: boolean; update: boolean; delete: boolean; manage_roles: boolean }
    settings: { access: boolean; manage_roles: boolean; view_audit: boolean }
  }
}

interface TeamState {
  users: User[]
  teams: Team[]
  roles: Role[]
  loading: boolean
  error: string | null

  // User actions
  loadAll: () => Promise<void>
  addUser: (user: CreateUserPayload) => Promise<void>
  updateUser: (id: string, updates: UpdateUserPayload) => Promise<void>
  deleteUser: (id: string) => Promise<void>
  toggleUserStatus: (id: string) => Promise<void>
  resetUserPassword: (id: string, newPassword: string, currentPassword?: string) => Promise<void>
  recordLogin: (userId: string) => void

  // Team actions
  addTeam: (team: CreateTeamPayload) => Promise<void>
  updateTeam: (id: string, updates: UpdateTeamPayload) => Promise<void>
  deleteTeam: (id: string) => Promise<void>

  // Role actions
  addRole: (role: Role) => void
  updateRole: (id: string, updates: Partial<Role>) => void
  deleteRole: (id: string) => void
}

const emptyPermissions: Role['permissions'] = {
  dashboard: { access: false, view_analytics: false },
  projects: { create: false, read: false, update: false, delete: false, archive: false },
  tasks: { create: false, read: false, update: false, delete: false, assign: false, move: false },
  team: { access: false, view_members: false, manage_members: false, manage_teams: false },
  users: { create: false, read: false, update: false, delete: false, manage_roles: false },
  settings: { access: false, manage_roles: false, view_audit: false },
}

const normalizePermissions = (
  permissions: Partial<Role['permissions']> | (Record<string, unknown> & { teams?: unknown }) | undefined
): Role['permissions'] => {
  const teamPermissions = (permissions as { team?: Role['permissions']['team']; teams?: Role['permissions']['team'] })
    ?.team || (permissions as { teams?: Role['permissions']['team'] })?.teams
  return {
    dashboard: { ...emptyPermissions.dashboard, ...(permissions as Partial<Role['permissions']>)?.dashboard },
    projects: { ...emptyPermissions.projects, ...(permissions as Partial<Role['permissions']>)?.projects },
    tasks: { ...emptyPermissions.tasks, ...(permissions as Partial<Role['permissions']>)?.tasks },
    team: { ...emptyPermissions.team, ...(teamPermissions || {}) },
    users: { ...emptyPermissions.users, ...(permissions as Partial<Role['permissions']>)?.users },
    settings: { ...emptyPermissions.settings, ...(permissions as Partial<Role['permissions']>)?.settings },
  }
}

const mapRole = (role: ApiRole): Role => ({
  id: role.id,
  name: role.name,
  displayName: role.displayName,
  description: role.description || '',
  isSystemRole: role.isSystemRole,
  permissions: normalizePermissions(role.permissions as Partial<Role['permissions']>),
})

const mapTeam = (team: ApiTeam): Team => ({
  id: team.id,
  name: team.name,
  description: team.description || '',
  members: team.members || [],
  lead: team.leadUserId || '',
})

const mapUser = (user: ApiUser, existing?: User): User => ({
  id: user.id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  avatarUrl: user.avatarUrl || undefined,
  roles: user.roles || [],
  teams: (user.teams || []).map((team) => team.id),
  status: user.isActive ? 'active' : 'inactive',
  lastActive: existing?.lastActive || 'Never',
  loginHistory: existing?.loginHistory || [],
})

export const useTeamStore = create<TeamState>((set, get) => ({
  users: [],
  teams: [],
  roles: [],
  loading: false,
  error: null,

  loadAll: async () => {
    set({ loading: true, error: null })
    try {
      const [users, teams, roles] = await Promise.all([
        teamService.listUsers(),
        teamService.listTeams(),
        teamService.listRoles(),
      ])

      const existingUsers = get().users
      const mappedUsers = users.map((user) =>
        mapUser(user, existingUsers.find((u) => u.id === user.id))
      )
      const mappedTeams = teams.map(mapTeam)
      const mappedRoles = roles.map(mapRole)

      set({
        users: mappedUsers,
        teams: mappedTeams,
        roles: mappedRoles,
        loading: false,
      })

      const authUser = useAuthStore.getState().user
      if (authUser) {
        const updatedUser = mappedUsers.find((u) => u.id === authUser.id)
        if (updatedUser) {
          useAuthStore.getState().updateUserProfile({
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            email: updatedUser.email,
            avatarUrl: updatedUser.avatarUrl,
          })
          useAuthStore.getState().updateUserRoles(updatedUser.roles)
          useAuthStore.getState().updateUserTeams(updatedUser.teams)
        }
      }
    } catch (error) {
      set({ loading: false, error: 'Failed to load team data' })
      throw error
    }
  },

  addUser: async (user) => {
    await teamService.createUser(user)
    await get().loadAll()
  },

  updateUser: async (id, updates) => {
    await teamService.updateUser(id, updates)
    await get().loadAll()
  },

  deleteUser: async (id) => {
    await teamService.deleteUser(id)
    await get().loadAll()
  },

  toggleUserStatus: async (id) => {
    const user = get().users.find((u) => u.id === id)
    if (!user) return
    await teamService.updateUser(id, { isActive: user.status !== 'active' })
    await get().loadAll()
  },

  resetUserPassword: async (id, newPassword, currentPassword) => {
    await teamService.resetPassword(id, newPassword, currentPassword)
  },

  recordLogin: (userId) =>
    set((state) => {
      const updatedUsers = state.users.map((user) =>
        user.id === userId
          ? {
              ...user,
              lastActive: 'Just now',
              loginHistory: [
                ...(user.loginHistory || []),
                {
                  timestamp: new Date().toISOString(),
                  userAgent: navigator.userAgent,
                },
              ].slice(-50),
            }
          : user
      )

      return { users: updatedUsers }
    }),

  addTeam: async (team) => {
    await teamService.createTeam(team)
    await get().loadAll()
  },

  updateTeam: async (id, updates) => {
    await teamService.updateTeam(id, updates)
    await get().loadAll()
  },

  deleteTeam: async (id) => {
    await teamService.deleteTeam(id)
    await get().loadAll()
  },

  addRole: (role) =>
    set((state) => ({
      roles: [...state.roles, role],
    })),

  updateRole: (id, updates) =>
    set((state) => ({
      roles: state.roles.map((role) => (role.id === id ? { ...role, ...updates } : role)),
    })),

  deleteRole: (id) =>
    set((state) => ({
      roles: state.roles.filter((role) => role.id !== id),
    })),
}))
