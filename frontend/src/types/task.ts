/**
 * Task Types
 */

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done' | 'blocked'
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical'
export type TaskType = 'task' | 'subtask' | 'milestone' | 'bug' | 'feature'

export interface Task {
  id: string
  projectId: string
  parentTaskId?: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  taskType: TaskType
  completionPercentage: number
  estimatedHours?: number
  actualHours: number
  startDate?: string
  dueDate?: string
  completedAt?: string
  position: number
  labels: string[]
  assignee?: UserSummary
  createdAt: string
  updatedAt: string
}

export interface TaskCard {
  id: string
  title: string
  status: TaskStatus
  priority: TaskPriority
  taskType: TaskType
  position: number
  dueDate?: string
  completionPercentage: number
  labels: string[]
  assignee?: UserSummary
  subtaskCount: number
  completedSubtaskCount: number
  hasBlockers: boolean
  commentCount: number
}

export interface KanbanBoard {
  projectId: string
  projectName: string
  columns: Record<TaskStatus, KanbanColumn>
  statistics: KanbanStatistics
}

export interface KanbanColumn {
  status: TaskStatus
  title: string
  taskCount: number
  tasks: TaskCard[]
  wipLimit?: number
  isOverWip: boolean
}

export interface KanbanStatistics {
  totalTasks: number
  byStatus: Record<string, number>
  byPriority: Record<string, number>
  overdueCount: number
  blockedCount: number
  completedToday: number
  completedThisWeek: number
}

export interface UserSummary {
  id: string
  email: string
  firstName: string
  lastName: string
  avatarUrl?: string
}
