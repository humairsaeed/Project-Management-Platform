import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useAuthStore } from './authSlice'

export interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  roles: string[]
  teams: string[]
  status: 'active' | 'inactive'
  lastActive: string
  password?: string // In a real app, this would be handled server-side
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

const defaultRoles: Role[] = [
  {
    id: '1',
    name: 'admin',
    displayName: 'Administrator',
    description: 'Full system access including user management and settings',
    isSystemRole: true,
    permissions: {
      dashboard: { access: true, view_analytics: true },
      projects: { create: true, read: true, update: true, delete: true, archive: true },
      tasks: { create: true, read: true, update: true, delete: true, assign: true, move: true },
      team: { access: true, view_members: true, manage_members: true, manage_teams: true },
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
      dashboard: { access: true, view_analytics: false },
      projects: { create: true, read: true, update: true, delete: false, archive: false },
      tasks: { create: true, read: true, update: true, delete: true, assign: true, move: true },
      team: { access: false, view_members: true, manage_members: false, manage_teams: false },
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
      dashboard: { access: true, view_analytics: false },
      projects: { create: false, read: true, update: false, delete: false, archive: false },
      tasks: { create: true, read: true, update: true, delete: false, assign: false, move: true },
      team: { access: false, view_members: false, manage_members: false, manage_teams: false },
      users: { create: false, read: true, update: false, delete: false, manage_roles: false },
      settings: { access: false, manage_roles: false, view_audit: false },
    },
  },
]

// Production: Only one admin account for initial setup
// Admin can create additional users as needed
const defaultUsers: User[] = [
  {
    id: 'admin-001',
    firstName: 'System',
    lastName: 'Administrator',
    email: 'admin@company.com',
    password: 'Admin@123',
    roles: ['admin'],
    teams: [],
    status: 'active',
    lastActive: 'Never',
    loginHistory: [],
  },
]

// Production: Empty teams array - admin will create teams as needed
const defaultTeams: Team[] = []

interface TeamState {
  users: User[]
  teams: Team[]
  roles: Role[]

  // User actions
  addUser: (user: User) => void
  updateUser: (id: string, updates: Partial<User>) => void
  deleteUser: (id: string) => void
  toggleUserStatus: (id: string) => void
  resetUserPassword: (id: string, newPassword: string) => void
  recordLogin: (userId: string) => void

  // Team actions
  addTeam: (team: Team) => void
  updateTeam: (id: string, updates: Partial<Team>) => void
  deleteTeam: (id: string) => void

  // Role actions
  addRole: (role: Role) => void
  updateRole: (id: string, updates: Partial<Role>) => void
  deleteRole: (id: string) => void
}

export const useTeamStore = create<TeamState>()(
  persist(
    (set) => ({
      users: defaultUsers,
      teams: defaultTeams,
      roles: defaultRoles,

      // User actions
      addUser: (user) =>
        set((state) => ({
          users: [...state.users, user],
        })),

      updateUser: (id, updates) =>
        set((state) => {
          const updatedUsers = state.users.map((user) =>
            user.id === id ? { ...user, ...updates } : user
          )

          // Sync with auth store if the updated user is currently logged in
          const authUser = useAuthStore.getState().user
          if (authUser && authUser.id === id) {
            if (updates.roles) {
              useAuthStore.getState().updateUserRoles(updates.roles)
            }
            if (updates.teams) {
              useAuthStore.getState().updateUserTeams(updates.teams)
            }
          }

          return { users: updatedUsers }
        }),

      deleteUser: (id) =>
        set((state) => ({
          users: state.users.filter((user) => user.id !== id),
        })),

      toggleUserStatus: (id) =>
        set((state) => ({
          users: state.users.map((user) =>
            user.id === id
              ? { ...user, status: user.status === 'active' ? 'inactive' : 'active' }
              : user
          ),
        })),

      resetUserPassword: (id, newPassword) =>
        set((state) => ({
          users: state.users.map((user) =>
            user.id === id ? { ...user, password: newPassword } : user
          ),
        })),

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
                  ].slice(-50), // Keep last 50 login events
                }
              : user
          )

          return { users: updatedUsers }
        }),

      // Team actions
      addTeam: (team) =>
        set((state) => ({
          teams: [...state.teams, team],
        })),

      updateTeam: (id, updates) =>
        set((state) => ({
          teams: state.teams.map((team) =>
            team.id === id ? { ...team, ...updates } : team
          ),
        })),

      deleteTeam: (id) =>
        set((state) => ({
          teams: state.teams.filter((team) => team.id !== id),
        })),

      // Role actions
      addRole: (role) =>
        set((state) => ({
          roles: [...state.roles, role],
        })),

      updateRole: (id, updates) =>
        set((state) => ({
          roles: state.roles.map((role) =>
            role.id === id ? { ...role, ...updates } : role
          ),
        })),

      deleteRole: (id) =>
        set((state) => ({
          roles: state.roles.filter((role) => role.id !== id),
        })),
    }),
    {
      name: 'team-storage',
      version: 2,
      migrate: (persistedState: any, version: number) => {
        let state = persistedState as TeamState

        // Migration from version 0 to 1: add passwords and loginHistory
        if (version === 0) {
          const updatedUsers = state.users.map((user) => {
            if (!user.password) {
              return { ...user, password: 'demo123', loginHistory: [] }
            }
            if (!user.loginHistory) {
              return { ...user, loginHistory: [] }
            }
            return user
          })

          state = {
            ...state,
            users: updatedUsers,
          }
        }

        // Migration from version 1 to 2: add dashboard and team permissions
        if (version <= 1) {
          const updatedRoles = state.roles.map((role) => {
            // Check if role already has new permission structure
            if (!role.permissions.dashboard || !role.permissions.team) {
              const { dashboard: _d, team: _t, ...oldPermissions } = role.permissions as any
              return {
                ...role,
                permissions: {
                  dashboard: role.name === 'admin'
                    ? { access: true, view_analytics: true }
                    : { access: true, view_analytics: false },
                  ...oldPermissions,
                  team: role.name === 'admin'
                    ? { access: true, view_members: true, manage_members: true, manage_teams: true }
                    : role.name === 'project_manager'
                    ? { access: false, view_members: true, manage_members: false, manage_teams: false }
                    : { access: false, view_members: false, manage_members: false, manage_teams: false },
                },
              }
            }
            return role
          })

          state = {
            ...state,
            roles: updatedRoles,
          }
        }

        return state as TeamState
      },
    }
  )
)
