import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import userDataService from '../services/userDataService'

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'
export type ProjectStatus = 'active' | 'completed' | 'on_hold' | 'planning' | 'cancelled'
export type Priority = 'low' | 'medium' | 'high' | 'critical'

export interface TaskComment {
  id: string
  userId: string
  userName: string
  userEmail: string
  content: string
  createdAt: string
}

export interface TaskWithAssignees {
  id: string
  title: string
  status: 'todo' | 'in_progress' | 'done'
  assignees: string[]
  startDate: string
  endDate: string
  progress: number
  comment?: string  // Keep for backward compatibility
  comments?: TaskComment[]
}

export interface AuditLogEntry {
  id: string
  userId: string
  userEmail: string
  userName: string
  tableName: string
  recordId: string
  recordName: string
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE'
  oldValue: Record<string, unknown> | null
  newValue: Record<string, unknown> | null
  changedFields: string[]
  createdAt: string
}

export interface Project {
  id: string
  name: string
  description: string
  completionPercentage: number
  status: ProjectStatus
  riskLevel: RiskLevel
  daysUntilDeadline: number
  priority: Priority
  manager: string
  team: string
  tasks: TaskWithAssignees[]
  auditLogs?: AuditLogEntry[] // Per-project audit history
  completedAt?: string // When project was marked as complete
  isDeleted?: boolean // Soft delete flag
  deletedAt?: string // When project was deleted
  statusChangeReason?: string // Reason for status change (on_hold, cancelled, deleted)
  statusChangedBy?: string // User name who changed the status
  statusChangedById?: string // User ID who changed the status
  statusChangedAt?: string // When the status was changed
}

export interface Milestone {
  id: string
  name: string
  projectName: string
  status?: 'achieved' | 'missed'
  targetDate?: string
  completedAt?: string
}

// Production: Empty initial data - admin will create projects as needed
const initialProjects: Project[] = []

// Production: Empty milestones - will be populated as projects are created and completed
const initialMilestones: { recent: Milestone[]; upcoming: Milestone[] } = {
  recent: [],
  upcoming: [],
}

interface ProjectState {
  projects: Project[]
  milestones: { recent: Milestone[]; upcoming: Milestone[] }

  // Actions
  addProject: (project: Project) => void
  deleteProject: (projectId: string) => void
  softDeleteProject: (projectId: string) => void
  restoreProject: (projectId: string) => void
  permanentDeleteProject: (projectId: string) => void
  reorderProjects: (draggedId: string, targetId: string) => void
  updateProject: (projectId: string, updates: Partial<Project>) => void
  updateProjectTasks: (projectId: string, tasks: TaskWithAssignees[]) => void
  updateProjectCompletion: (projectId: string, completion: number) => void
  completeProject: (projectId: string) => void
  reopenProject: (projectId: string) => void
  moveToUpcoming: (projectId: string) => void
  moveToActive: (projectId: string) => void
  addMilestone: (milestone: Milestone, type: 'recent' | 'upcoming') => void
  moveMilestoneToRecent: (milestoneId: string) => void
  addAuditLog: (projectId: string, log: AuditLogEntry) => void
  getProjectAuditLogs: (projectId: string) => AuditLogEntry[]
  getActiveProjects: () => Project[]
  getCompletedProjects: () => Project[]
  getDeletedProjects: () => Project[]
  loadFromBackend: () => Promise<void>
  saveToBackend: () => Promise<void>
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: initialProjects,
      milestones: initialMilestones,

      addProject: (project) => {
        set((state) => ({
          projects: [project, ...state.projects],
        }))
      },

      deleteProject: (projectId) => {
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== projectId),
        }))
      },

      softDeleteProject: (projectId) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? { ...p, isDeleted: true, deletedAt: new Date().toISOString() }
              : p
          ),
        }))
      },

      restoreProject: (projectId) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? { ...p, isDeleted: false, deletedAt: undefined }
              : p
          ),
        }))
      },

      permanentDeleteProject: (projectId) => {
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== projectId),
        }))
      },

      reorderProjects: (draggedId, targetId) => {
        set((state) => {
          const projects = [...state.projects]
          const draggedIndex = projects.findIndex((p) => p.id === draggedId)
          const targetIndex = projects.findIndex((p) => p.id === targetId)

          if (draggedIndex === -1 || targetIndex === -1) return state

          const [draggedProject] = projects.splice(draggedIndex, 1)
          projects.splice(targetIndex, 0, draggedProject)

          return { projects }
        })
      },

      updateProject: (projectId, updates) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId ? { ...p, ...updates } : p
          ),
        }))
      },

      updateProjectTasks: (projectId, tasks) => {
        set((state) => {
          const totalProgress = tasks.reduce((sum, task) => sum + task.progress, 0)
          const completion = tasks.length > 0 ? Math.round(totalProgress / tasks.length) : 0

          return {
            projects: state.projects.map((p) =>
              p.id === projectId
                ? { ...p, tasks, completionPercentage: completion }
                : p
            ),
          }
        })

        // Check if project should be marked complete
        const project = get().projects.find((p) => p.id === projectId)
        if (project && project.completionPercentage === 100 && project.status !== 'completed') {
          get().completeProject(projectId)
        }
      },

      updateProjectCompletion: (projectId, completion) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId ? { ...p, completionPercentage: completion } : p
          ),
        }))

        // Auto-complete if 100%
        if (completion === 100) {
          get().completeProject(projectId)
        }
      },

      completeProject: (projectId) => {
        const project = get().projects.find((p) => p.id === projectId)
        if (!project || project.status === 'completed') return

        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? { ...p, status: 'completed' as ProjectStatus, completedAt: new Date().toISOString() }
              : p
          ),
          milestones: {
            ...state.milestones,
            recent: [
              {
                id: `milestone-${Date.now()}`,
                name: `${project.name} Completed`,
                projectName: project.name,
                status: 'achieved' as const,
                completedAt: new Date().toISOString(),
              },
              ...state.milestones.recent,
            ].slice(0, 5), // Keep only 5 recent milestones
          },
        }))
      },

      reopenProject: (projectId) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? { ...p, status: 'active' as ProjectStatus, completedAt: undefined }
              : p
          ),
        }))
      },

      moveToUpcoming: (projectId) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? { ...p, status: 'on_hold' as ProjectStatus }
              : p
          ),
        }))
      },

      moveToActive: (projectId) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? { ...p, status: 'active' as ProjectStatus }
              : p
          ),
        }))
      },

      addMilestone: (milestone, type) => {
        set((state) => ({
          milestones: {
            ...state.milestones,
            [type]: type === 'recent'
              ? [milestone, ...state.milestones.recent].slice(0, 5)
              : [...state.milestones.upcoming, milestone],
          },
        }))
      },

      moveMilestoneToRecent: (milestoneId) => {
        set((state) => {
          const milestone = state.milestones.upcoming.find((m) => m.id === milestoneId)
          if (!milestone) return state

          return {
            milestones: {
              recent: [
                { ...milestone, status: 'achieved' as const, completedAt: new Date().toISOString() },
                ...state.milestones.recent,
              ].slice(0, 5),
              upcoming: state.milestones.upcoming.filter((m) => m.id !== milestoneId),
            },
          }
        })
      },

      addAuditLog: (projectId, log) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? { ...p, auditLogs: [log, ...(p.auditLogs || [])] }
              : p
          ),
        }))
      },

      getProjectAuditLogs: (projectId) => {
        const project = get().projects.find((p) => p.id === projectId)
        return project?.auditLogs || []
      },

      getActiveProjects: () => {
        return get().projects.filter((p) => p.status === 'active' && !p.isDeleted)
      },

      getCompletedProjects: () => {
        return get().projects.filter((p) => p.status === 'completed' && !p.isDeleted)
      },

      getDeletedProjects: () => {
        return get().projects.filter((p) => p.isDeleted)
      },

      loadFromBackend: async () => {
        try {
          const userData = await userDataService.loadUserData()
          // Only update if backend has data
          if (userData.projects && userData.projects.length > 0) {
            set({
              projects: userData.projects,
              milestones: userData.milestones || initialMilestones,
            })
          } else if (userData.milestones && (userData.milestones.recent?.length > 0 || userData.milestones.upcoming?.length > 0)) {
            set({
              projects: userData.projects || get().projects,
              milestones: userData.milestones,
            })
          }
          // If backend is empty, keep current state (don't overwrite)
        } catch (error) {
          console.error('Failed to load from backend:', error)
        }
      },

      saveToBackend: async () => {
        try {
          const state = get()
          await userDataService.saveUserData({
            projects: state.projects,
            milestones: state.milestones,
          })
        } catch (error) {
          console.error('Failed to save to backend:', error)
        }
      },
    }),
    {
      name: 'project-storage',
      version: 3,
      partialize: (state) => ({
        projects: state.projects,
        milestones: state.milestones,
      }),
      migrate: (persistedState: any, version: number) => {
        // Return persisted state as-is - we preserve all data now
        // Backend sync will handle syncing to server
        console.log(`Project storage version: ${version}, migrating to version 3 (backend sync enabled)`)
        return persistedState as Pick<ProjectState, 'projects' | 'milestones'>
      },
    }
  )
)
