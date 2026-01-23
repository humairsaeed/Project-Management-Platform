import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import authService from '../services/authService'
import { useAuthStore } from '../store/authSlice'
import type { LoginRequest } from '../types/user'

export function useLogin() {
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)

  return useMutation({
    mutationFn: (credentials: LoginRequest) => authService.login(credentials),
    onSuccess: (data) => {
      login(
        {
          id: data.user.id,
          email: data.user.email,
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          avatarUrl: data.user.avatarUrl,
          roles: data.user.roles,
          teams: data.user.teams.map((t) => t.id),
        },
        data.accessToken
      )
      navigate('/dashboard')
    },
  })
}

export function useLogout() {
  const navigate = useNavigate()
  const logout = useAuthStore((state) => state.logout)

  return useMutation({
    mutationFn: () => authService.logout(),
    onSettled: () => {
      logout()
      navigate('/login')
    },
  })
}
