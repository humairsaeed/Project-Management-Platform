import { useEffect, useRef } from 'react'
import { useProjectStore } from '../store/projectSlice'
import { useAuthStore } from '../store/authSlice'

/**
 * Hook to sync project data with backend
 * - Loads data from backend on mount/login
 * - Projects are now managed through real-time API calls (no auto-save needed)
 */
export function useBackendSync() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const user = useAuthStore((state) => state.user)
  const { loadFromBackend } = useProjectStore()
  const hasLoadedRef = useRef(false)

  // Load from backend on mount/login
  useEffect(() => {
    if (isAuthenticated && user && !hasLoadedRef.current) {
      const syncData = async () => {
        console.log('Loading projects from backend for user:', user.id)
        await loadFromBackend(user.id)
        hasLoadedRef.current = true
      }
      syncData()
    } else if (!isAuthenticated) {
      hasLoadedRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.id])
}
