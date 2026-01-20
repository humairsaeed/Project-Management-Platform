import { create } from 'zustand'

interface Project {
  id: string
  name: string
  status: string
  completionPercentage: number
}

interface ProjectState {
  currentProject: Project | null
  projects: Project[]
  setCurrentProject: (project: Project | null) => void
  setProjects: (projects: Project[]) => void
}

export const useProjectStore = create<ProjectState>((set) => ({
  currentProject: null,
  projects: [],

  setCurrentProject: (project) => {
    set({ currentProject: project })
  },

  setProjects: (projects) => {
    set({ projects })
  },
}))
