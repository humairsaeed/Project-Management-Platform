import api from './api'

export interface ApiTeam {
  id: string
  name: string
  description?: string
  leadUserId?: string | null
  members: string[]
}

export interface ApiRole {
  id: string
  name: string
  displayName: string
  description?: string
  isSystemRole: boolean
  permissions: Record<string, unknown>
}

export interface ApiUser {
  id: string
  email: string
  firstName: string
  lastName: string
  avatarUrl?: string | null
  isActive: boolean
  roles: string[]
  teams: { id: string; name: string; description?: string }[]
}

export interface CreateUserPayload {
  email: string
  password: string
  firstName: string
  lastName: string
  roles: string[]
  teams: string[]
  avatarUrl?: string
  isActive?: boolean
}

export interface UpdateUserPayload {
  email?: string
  firstName?: string
  lastName?: string
  roles?: string[]
  teams?: string[]
  avatarUrl?: string
  isActive?: boolean
}

export interface CreateTeamPayload {
  name: string
  description?: string
  leadUserId?: string
  members?: string[]
}

export interface UpdateTeamPayload {
  name?: string
  description?: string
  leadUserId?: string
  members?: string[]
}

export const teamService = {
  async listUsers(): Promise<ApiUser[]> {
    const response = await api.get('/auth/users')
    return response.data
  },

  async listTeams(): Promise<ApiTeam[]> {
    const response = await api.get('/auth/teams')
    return response.data
  },

  async listRoles(): Promise<ApiRole[]> {
    const response = await api.get('/auth/roles')
    return response.data
  },

  async createUser(payload: CreateUserPayload): Promise<ApiUser> {
    const response = await api.post('/auth/users', payload)
    return response.data
  },

  async updateUser(userId: string, payload: UpdateUserPayload): Promise<ApiUser> {
    const response = await api.patch(`/auth/users/${userId}`, payload)
    return response.data
  },

  async deleteUser(userId: string): Promise<void> {
    await api.delete(`/auth/users/${userId}`)
  },

  async resetPassword(userId: string, newPassword: string, currentPassword?: string): Promise<void> {
    await api.post(`/auth/users/${userId}/password`, {
      currentPassword,
      newPassword,
    })
  },

  async createTeam(payload: CreateTeamPayload): Promise<ApiTeam> {
    const response = await api.post('/auth/teams', payload)
    return response.data
  },

  async updateTeam(teamId: string, payload: UpdateTeamPayload): Promise<ApiTeam> {
    const response = await api.patch(`/auth/teams/${teamId}`, payload)
    return response.data
  },

  async deleteTeam(teamId: string): Promise<void> {
    await api.delete(`/auth/teams/${teamId}`)
  },
}

export default teamService
