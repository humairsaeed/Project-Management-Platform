import { create } from 'zustand'

export type DashboardFilter = 'all' | 'active' | 'on_track' | 'at_risk'

interface DashboardState {
  filter: DashboardFilter
  setFilter: (filter: DashboardFilter) => void
  selectedProjectId: string | null
  setSelectedProjectId: (id: string | null) => void
}

export const useDashboardStore = create<DashboardState>((set) => ({
  filter: 'all',
  setFilter: (filter) => set({ filter }),
  selectedProjectId: null,
  setSelectedProjectId: (selectedProjectId) => set({ selectedProjectId }),
}))
