import { useEffect, useRef } from 'react'
import { useProjectStore } from '../store/projectSlice'
import { useAuthStore } from '../store/authSlice'

let syncTimeout: NodeJS.Timeout | null = null

/**
 * Hook to sync project data with backend
 * - Loads data from backend on mount/login
 * - Auto-saves to backend when data changes (debounced)
 */
export function useBackendSync() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const { projects, milestones, loadFromBackend, saveToBackend } = useProjectStore()
  const hasLoadedRef = useRef(false)

  // Load from backend on mount/login
  useEffect(() => {
    if (isAuthenticated && !hasLoadedRef.current) {
      loadFromBackend()
      hasLoadedRef.current = true
    }
  }, [isAuthenticated, loadFromBackend])

  // Auto-save to backend when data changes (debounced)
  useEffect(() => {
    if (!isAuthenticated || !hasLoadedRef.current) return

    // Clear previous timeout
    if (syncTimeout) {
      clearTimeout(syncTimeout)
    }

    // Debounce save (wait 1 second after last change)
    syncTimeout = setTimeout(() => {
      saveToBackend()
    }, 1000)

    return () => {
      if (syncTimeout) {
        clearTimeout(syncTimeout)
      }
    }
  }, [projects, milestones, isAuthenticated, saveToBackend])

  // Save to backend on logout/unmount
  useEffect(() => {
    return () => {
      if (isAuthenticated && hasLoadedRef.current) {
        saveToBackend()
      }
    }
  }, [isAuthenticated, saveToBackend])
}
