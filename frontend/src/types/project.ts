/**
 * Project Types
 */

export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'archived'
export type ProjectPriority = 'low' | 'medium' | 'high' | 'critical'
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

export interface Project {
  id: string
  name: string
  description?: string
  status: ProjectStatus
  priority: ProjectPriority
  completionPercentage: number
  startDate?: string
  targetEndDate?: string
  actualEndDate?: string
  budgetAllocated?: number
  budgetSpent: number
  createdAt: string
  updatedAt: string
}

export interface ProjectSummary {
  id: string
  name: string
  status: ProjectStatus
  priority: ProjectPriority
  completionPercentage: number
  targetEndDate?: string
  daysUntilDeadline?: number
  riskLevel?: RiskLevel
  taskCount: number
  completedTaskCount: number
}

export interface PortfolioOverview {
  totalProjects: number
  projectsByStatus: Record<string, number>
  portfolioHealthScore: number
  projectsSummary: ProjectSnapshotSummary[]
  recentMilestones: MilestoneSummary[]
  upcomingMilestones: MilestoneSummary[]
}

export interface ProjectSnapshotSummary {
  id: string
  name: string
  completionPercentage: number
  status: ProjectStatus
  riskLevel: RiskLevel
  daysUntilDeadline?: number
  priority: ProjectPriority
}

export interface MilestoneSummary {
  id: string
  projectId: string
  projectName: string
  name: string
  targetDate: string
  achievedDate?: string
  status: 'upcoming' | 'achieved' | 'missed'
}
