import api from './api'
import type { LoginRequest, LoginResponse } from '../types/user'

export const authService = {
  /**
   * Login with email and password
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await api.post('/auth/login', credentials)
    return response.data
  },

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    const response = await api.post(
      '/auth/refresh',
      {},
      {
        headers: {
          Authorization: `Bearer ${refreshToken}`,
        },
      }
    )
    return response.data
  },

  /**
   * Logout (revoke refresh token)
   */
  async logout(): Promise<void> {
    await api.post('/auth/logout')
  },

  /**
   * Get current user profile
   */
  async getCurrentUser() {
    const response = await api.get('/auth/me')
    return response.data
  },
}

export default authService
