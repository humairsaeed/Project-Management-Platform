import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import projectService from '../services/projectService'
import { useTeamStore } from './teamSlice'

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
  managerId?: string
  team: string
  teamId?: string
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
  addProject: (project: Project, currentUserId?: string) => Promise<void>
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
  loadFromBackend: (userId?: string) => Promise<void>
  saveToBackend: () => Promise<void>
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: initialProjects,
      milestones: initialMilestones,

      addProject: async (project, currentUserId) => {
        try {
          const managerId = project.managerId || currentUserId || null
          const teamId = project.teamId || null

          // Transform frontend format to backend format
          const backendPayload: any = {
            name: project.name,
            description: project.description,
            status: project.status || 'planning',
            priority: project.priority || 'medium',
            risk_level: project.riskLevel || 'low',
            completion_percentage: 0,
            manager_user_id: managerId,
            owner_team_id: teamId,
            target_start_date: null,
            target_end_date: project.daysUntilDeadline
              ? new Date(Date.now() + project.daysUntilDeadline * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
              : null,
          }

          // Call backend API to create project
          const createdProject = await projectService.createProject(backendPayload)

          // Add the created project to local state
          set((state) => ({
            projects: [{
              ...project,
              id: createdProject.id,
              managerId: managerId || undefined,
              teamId: teamId || undefined,
            }, ...state.projects],
          }))

          console.log('Project created successfully:', createdProject)
        } catch (error) {
          console.error('Failed to create project:', error)
          throw error
        }
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

      loadFromBackend: async (userId?: string) => {
        try {
          if (!userId) {
            console.warn('No user ID provided for loadFromBackend')
            return
          }

          const { users, teams } = useTeamStore.getState()
          const resolveUserName = (id?: string) => {
            if (!id) return ''
            const match = users.find((u) => u.id === id)
            return match ? `${match.firstName} ${match.lastName}`.trim() : id
          }
          const resolveTeamName = (id?: string) => {
            if (!id) return ''
            const match = teams.find((t) => t.id === id)
            return match?.name || id
          }
          const normalizeStatus = (status: string) =>
            status === 'archived' ? 'cancelled' : status

          // Fetch projects from the real backend API
          const projects = await projectService.getUserProjects(userId)

          if (projects && projects.length > 0) {
            // Transform backend data to match frontend format
            const transformedProjects = projects.map((p: any) => ({
              id: p.id,
              name: p.name,
              description: p.description || '',
              completionPercentage: p.completion_percentage || 0,
              status: normalizeStatus(p.status) as ProjectStatus,
              riskLevel: p.risk_level as RiskLevel,
              daysUntilDeadline: p.target_end_date
                ? Math.ceil((new Date(p.target_end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                : 0,
              priority: p.priority as Priority,
              manager: resolveUserName(p.manager_user_id),
              managerId: p.manager_user_id || undefined,
              team: resolveTeamName(p.owner_team_id),
              teamId: p.owner_team_id || undefined,
              tasks: p.tasks?.map((t: any) => ({
                id: t.id,
                title: t.title,
                status: t.status,
                assignees: t.assigned_to_user_id ? [resolveUserName(t.assigned_to_user_id)] : [],
                startDate: t.start_date || '',
                endDate: t.due_date || '',
                progress: t.completion_percentage || 0,
                comments: [],
              })) || [],
              auditLogs: [],
            }))

            set({ projects: transformedProjects })
            console.log(`Loaded ${transformedProjects.length} projects from backend`)
          } else {
            console.log('No projects found for user')
          }
        } catch (error) {
          console.error('Failed to load from backend:', error)
        }
      },

      saveToBackend: async () => {
        // No-op: Projects are now saved individually through API calls
        // This method kept for backward compatibility
        console.log('saveToBackend called - no action needed (using real-time API updates)')
      },
    }),
    {
      name: 'project-storage',
      version: 1,
      partialize: (state) => ({
        projects: state.projects,
        milestones: state.milestones,
      }),
    }
  )
)
