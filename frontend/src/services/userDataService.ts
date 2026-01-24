import api from './api'

export interface UserData {
  projects?: any[]
  milestones?: any
  teams?: any[]
  [key: string]: any
}

export const userDataService = {
  /**
   * Load user data from backend
   */
  async loadUserData(): Promise<UserData> {
    try {
      const response = await api.get('/auth/me/data')
      return response.data.data || {}
    } catch (error) {
      console.error('Failed to load user data:', error)
      return {}
    }
  },

  /**
   * Save user data to backend
   */
  async saveUserData(data: UserData): Promise<void> {
    try {
      await api.put('/auth/me/data', data)
    } catch (error) {
      console.error('Failed to save user data:', error)
      throw error
    }
  },
}

export default userDataService
