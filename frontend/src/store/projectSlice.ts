import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'
export type ProjectStatus = 'active' | 'completed' | 'on_hold'
export type Priority = 'low' | 'medium' | 'high' | 'critical'

export interface TaskWithAssignees {
  id: string
  title: string
  status: 'todo' | 'in_progress' | 'done'
  assignees: string[]
  startDate: string
  endDate: string
  progress: number
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
  completedAt?: string // When project was marked as complete
}

export interface Milestone {
  id: string
  name: string
  projectName: string
  status?: 'achieved' | 'missed'
  targetDate?: string
  completedAt?: string
}

// Initial mock data
const initialProjects: Project[] = [
  {
    id: '1',
    name: 'Vulnerabilities Remediation',
    description: 'Address critical security vulnerabilities across production systems including patch management, configuration hardening, and penetration testing remediation.',
    completionPercentage: 56,
    status: 'active',
    riskLevel: 'medium',
    daysUntilDeadline: 30,
    priority: 'high',
    manager: 'John Smith',
    team: 'Security',
    tasks: [
      { id: 't1', title: 'WAF Rule Design', status: 'done', assignees: ['John Smith'], startDate: '2025-01-01', endDate: '2025-01-15', progress: 100 },
      { id: 't2', title: 'API Inventory', status: 'done', assignees: ['Sarah Jones'], startDate: '2025-01-05', endDate: '2025-01-12', progress: 100 },
      { id: 't3', title: 'Test Environment Setup', status: 'done', assignees: ['Mike Wilson'], startDate: '2025-01-10', endDate: '2025-01-17', progress: 100 },
      { id: 't4', title: 'Production WAF Deployment', status: 'in_progress', assignees: ['John Smith', 'Emily Chen'], startDate: '2025-01-15', endDate: '2025-02-05', progress: 60 },
      { id: 't5', title: 'API Gateway Integration', status: 'in_progress', assignees: ['Emily Chen'], startDate: '2025-01-20', endDate: '2025-02-10', progress: 30 },
      { id: 't6', title: 'Security Testing', status: 'todo', assignees: ['Sarah Jones', 'Mike Wilson'], startDate: '2025-02-01', endDate: '2025-02-15', progress: 0 },
      { id: 't7', title: 'Documentation', status: 'todo', assignees: ['Mike Wilson'], startDate: '2025-02-10', endDate: '2025-02-20', progress: 0 },
    ],
  },
  {
    id: '2',
    name: 'Cloud Migration Planning',
    description: 'Plan and execute migration of on-premises infrastructure to Azure cloud including assessment, architecture design, and pilot migrations.',
    completionPercentage: 70,
    status: 'active',
    riskLevel: 'low',
    daysUntilDeadline: 60,
    priority: 'high',
    manager: 'Sarah Jones',
    team: 'Cloud Services',
    tasks: [
      { id: 't1', title: 'Infrastructure Assessment', status: 'done', assignees: ['Sarah Jones'], startDate: '2025-01-01', endDate: '2025-01-10', progress: 100 },
      { id: 't2', title: 'Architecture Design', status: 'done', assignees: ['David Lee'], startDate: '2025-01-08', endDate: '2025-01-20', progress: 100 },
      { id: 't3', title: 'Cost Analysis', status: 'done', assignees: ['Emily Chen'], startDate: '2025-01-15', endDate: '2025-01-25', progress: 100 },
      { id: 't4', title: 'Pilot Migration', status: 'in_progress', assignees: ['Sarah Jones', 'David Lee'], startDate: '2025-01-25', endDate: '2025-02-15', progress: 50 },
      { id: 't5', title: 'Documentation & Training', status: 'todo', assignees: ['Emily Chen'], startDate: '2025-02-10', endDate: '2025-02-28', progress: 0 },
    ],
  },
  {
    id: '3',
    name: 'WAF/API Security',
    description: 'Implement Web Application Firewall and API Gateway security controls to protect public-facing applications and services.',
    completionPercentage: 65,
    status: 'active',
    riskLevel: 'medium',
    daysUntilDeadline: 45,
    priority: 'critical',
    manager: 'Mike Wilson',
    team: 'Security',
    tasks: [
      { id: 't1', title: 'Requirements Gathering', status: 'done', assignees: ['Mike Wilson'], startDate: '2025-01-01', endDate: '2025-01-08', progress: 100 },
      { id: 't2', title: 'Vendor Selection', status: 'done', assignees: ['Mike Wilson', 'John Smith'], startDate: '2025-01-05', endDate: '2025-01-15', progress: 100 },
      { id: 't3', title: 'POC Implementation', status: 'done', assignees: ['John Smith'], startDate: '2025-01-12', endDate: '2025-01-25', progress: 100 },
      { id: 't4', title: 'Production Deployment', status: 'in_progress', assignees: ['John Smith', 'Emily Chen'], startDate: '2025-01-25', endDate: '2025-02-10', progress: 40 },
      { id: 't5', title: 'Monitoring Setup', status: 'todo', assignees: ['Emily Chen'], startDate: '2025-02-08', endDate: '2025-02-20', progress: 0 },
    ],
  },
  {
    id: '4',
    name: 'Tape Library & Backup Replacements',
    description: 'Replace aging tape library infrastructure with modern backup solutions including disk-based backup and cloud archival integration.',
    completionPercentage: 20,
    status: 'active',
    riskLevel: 'low',
    daysUntilDeadline: 120,
    priority: 'medium',
    manager: 'Emily Chen',
    team: 'IT Infrastructure',
    tasks: [
      { id: 't1', title: 'Inventory Assessment', status: 'done', assignees: ['Emily Chen'], startDate: '2025-01-01', endDate: '2025-01-15', progress: 100 },
      { id: 't2', title: 'Solution Design', status: 'in_progress', assignees: ['Emily Chen', 'David Lee'], startDate: '2025-01-12', endDate: '2025-02-01', progress: 50 },
      { id: 't3', title: 'Procurement', status: 'todo', assignees: ['David Lee'], startDate: '2025-02-01', endDate: '2025-02-28', progress: 0 },
      { id: 't4', title: 'Installation', status: 'todo', assignees: ['Emily Chen', 'David Lee'], startDate: '2025-03-01', endDate: '2025-03-30', progress: 0 },
      { id: 't5', title: 'Data Migration', status: 'todo', assignees: ['Emily Chen'], startDate: '2025-04-01', endDate: '2025-04-30', progress: 0 },
    ],
  },
]

const initialMilestones: { recent: Milestone[]; upcoming: Milestone[] } = {
  recent: [
    { id: '1', name: 'NLB Replacement', projectName: 'Infrastructure Upgrade', status: 'achieved', completedAt: '2025-01-15' },
    { id: '2', name: 'Exchange Node Addition', projectName: 'Email Infrastructure', status: 'achieved', completedAt: '2025-01-10' },
    { id: '3', name: 'Oracle 19c Migration', projectName: 'Database Upgrade', status: 'achieved', completedAt: '2025-01-05' },
  ],
  upcoming: [
    { id: '4', name: 'Production Deployment', projectName: 'WAF/API Security', targetDate: '2025-02-15' },
    { id: '5', name: 'Phase 1 Complete', projectName: 'Cloud Migration', targetDate: '2025-03-01' },
  ],
}

interface ProjectState {
  projects: Project[]
  milestones: { recent: Milestone[]; upcoming: Milestone[] }

  // Actions
  updateProject: (projectId: string, updates: Partial<Project>) => void
  updateProjectTasks: (projectId: string, tasks: TaskWithAssignees[]) => void
  updateProjectCompletion: (projectId: string, completion: number) => void
  completeProject: (projectId: string) => void
  reopenProject: (projectId: string) => void
  addMilestone: (milestone: Milestone, type: 'recent' | 'upcoming') => void
  moveMilestoneToRecent: (milestoneId: string) => void
  getActiveProjects: () => Project[]
  getCompletedProjects: () => Project[]
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: initialProjects,
      milestones: initialMilestones,

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

      getActiveProjects: () => {
        return get().projects.filter((p) => p.status === 'active')
      },

      getCompletedProjects: () => {
        return get().projects.filter((p) => p.status === 'completed')
      },
    }),
    {
      name: 'project-storage',
      partialize: (state) => ({
        projects: state.projects,
        milestones: state.milestones,
      }),
    }
  )
)
