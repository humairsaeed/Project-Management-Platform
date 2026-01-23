import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
    projects: { create: boolean; read: boolean; update: boolean; delete: boolean; archive: boolean }
    tasks: { create: boolean; read: boolean; update: boolean; delete: boolean; assign: boolean; move: boolean }
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

const defaultUsers: User[] = [
  {
    id: '0',
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@company.com',
    password: 'demo123',
    roles: ['admin'],
    teams: [],
    status: 'active',
    lastActive: 'Just now',
    loginHistory: [],
  },
  {
    id: '1',
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@company.com',
    password: 'demo123',
    roles: ['project_manager'],
    teams: ['Security', 'Leadership'],
    status: 'active',
    lastActive: '2 minutes ago',
    loginHistory: [],
  },
  {
    id: '2',
    firstName: 'Sarah',
    lastName: 'Jones',
    email: 'sarah.jones@company.com',
    password: 'demo123',
    roles: ['project_manager'],
    teams: ['Cloud Services'],
    status: 'active',
    lastActive: '5 minutes ago',
    loginHistory: [],
  },
  {
    id: '3',
    firstName: 'Mike',
    lastName: 'Wilson',
    email: 'mike.wilson@company.com',
    password: 'demo123',
    roles: ['contributor'],
    teams: ['Security', 'IT Infrastructure'],
    status: 'active',
    lastActive: '1 hour ago',
    loginHistory: [],
  },
  {
    id: '4',
    firstName: 'Emily',
    lastName: 'Chen',
    email: 'emily.chen@company.com',
    password: 'demo123',
    roles: ['contributor'],
    teams: ['Cloud Services'],
    status: 'active',
    lastActive: '3 hours ago',
    loginHistory: [],
  },
  {
    id: '5',
    firstName: 'David',
    lastName: 'Lee',
    email: 'david.lee@company.com',
    password: 'demo123',
    roles: ['contributor'],
    teams: ['DevOps'],
    status: 'active',
    lastActive: '1 day ago',
    loginHistory: [],
  },
]

const defaultTeams: Team[] = [
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
    members: ['2', '4'],
    lead: '2',
  },
  {
    id: 't3',
    name: 'IT Infrastructure',
    description: 'IT infrastructure and operations',
    members: ['3'],
    lead: '3',
  },
  {
    id: 't4',
    name: 'DevOps',
    description: 'DevOps and CI/CD',
    members: ['5'],
    lead: '5',
  },
]

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
        set((state) => ({
          users: state.users.map((user) =>
            user.id === id ? { ...user, ...updates } : user
          ),
        })),

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
        set((state) => ({
          users: state.users.map((user) =>
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
          ),
        })),

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
    }
  )
)
