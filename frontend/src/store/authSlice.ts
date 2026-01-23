import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  roles: string[]
  teams: string[]
}

interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  login: (user: User, accessToken: string) => void
  logout: () => void
  hasRole: (role: string) => boolean
  updateUserRoles: (roles: string[]) => void
  updateUserTeams: (teams: string[]) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      login: (user, accessToken) => {
        set({
          user,
          accessToken,
          isAuthenticated: true,
        })
      },

      logout: () => {
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
        })
      },

      hasRole: (role) => {
        const user = get().user
        if (!user) return false
        return user.roles.includes(role) || user.roles.includes('admin')
      },

      updateUserRoles: (roles) => {
        const user = get().user
        if (user) {
          set({
            user: {
              ...user,
              roles,
            },
          })
        }
      },

      updateUserTeams: (teams) => {
        const user = get().user
        if (user) {
          set({
            user: {
              ...user,
              teams,
            },
          })
        }
      },
    }),
    {
      name: 'auth-storage',
      version: 1,
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
      migrate: (persistedState: any, version: number) => {
        // Migration to version 1: PRODUCTION RESET - Force logout all sessions
        if (version === 0) {
          console.log('Migrating auth to production version 1: Forcing logout')
          return {
            user: null,
            accessToken: null,
            isAuthenticated: false,
          }
        }
        return persistedState
      },
    }
  )
)
