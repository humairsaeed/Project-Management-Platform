/**
 * User Types
 */

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  avatarUrl?: string
  isActive: boolean
  roles: string[]
  teams: Team[]
  skills: UserSkill[]
}

export interface Team {
  id: string
  name: string
  description?: string
}

export interface UserSkill {
  skillId: string
  skillName: string
  proficiencyLevel: number
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  tokenType: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse extends AuthTokens {
  user: User
}
