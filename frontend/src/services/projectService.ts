import api from './api'
import type { Project, ProjectSummary, PortfolioOverview } from '../types/project'
import type { PaginatedResponse } from '../types/api'

export const projectService = {
  /**
   * Get portfolio overview for executive dashboard
   */
  async getPortfolioOverview(): Promise<PortfolioOverview> {
    const response = await api.get('/projects/portfolio/overview')
    return response.data
  },

  /**
   * List all projects with pagination
   */
  async listProjects(params?: {
    status?: string
    teamId?: string
    userId?: string
    page?: number
    limit?: number
  }): Promise<PaginatedResponse<ProjectSummary>> {
    const response = await api.get('/projects', { params })
    return response.data
  },

  /**
   * Get projects for a specific user (assigned projects)
   */
  async getUserProjects(userId: string): Promise<Project[]> {
    try {
      const response = await api.get(`/projects?user_id=${userId}`)
      return response.data.data || []
    } catch (error) {
      console.error('Failed to fetch user projects:', error)
      return []
    }
  },

  /**
   * Get project details by ID
   */
  async getProject(projectId: string): Promise<Project> {
    const response = await api.get(`/projects/${projectId}`)
    return response.data
  },

  /**
   * Create a new project
   */
  async createProject(data: Partial<Project>): Promise<Project> {
    const response = await api.post('/projects', data)
    return response.data
  },

  /**
   * Update a project
   */
  async updateProject(projectId: string, data: Partial<Project>): Promise<Project> {
    const response = await api.patch(`/projects/${projectId}`, data)
    return response.data
  },

  /**
   * Delete/archive a project
   */
  async deleteProject(projectId: string): Promise<void> {
    await api.delete(`/projects/${projectId}`)
  },

  /**
   * Assign a user to a project
   */
  async assignUserToProject(
    projectId: string,
    userId: string,
    role: 'manager' | 'member' | 'viewer' = 'member',
    assignedBy?: string
  ): Promise<any> {
    const response = await api.post(`/projects/${projectId}/assignments`, {
      user_id: userId,
      role,
      project_id: projectId,
      assigned_by: assignedBy,
    })
    return response.data
  },

  /**
   * Get project assignments
   */
  async getProjectAssignments(projectId: string): Promise<any[]> {
    const response = await api.get(`/projects/${projectId}/assignments`)
    return response.data
  },

  /**
   * Remove user from project
   */
  async removeUserFromProject(projectId: string, userId: string): Promise<void> {
    await api.delete(`/projects/${projectId}/assignments/${userId}`)
  },

  /**
   * Get project tasks
   */
  async getProjectTasks(projectId: string): Promise<any[]> {
    try {
      const response = await api.get(`/projects/${projectId}/tasks`)
      return response.data.data || []
    } catch (error) {
      console.error('Failed to fetch project tasks:', error)
      return []
    }
  },

  /**
   * Create a task
   */
  async createTask(projectId: string, task: any): Promise<any> {
    const response = await api.post(`/projects/${projectId}/tasks`, {
      ...task,
      project_id: projectId,
    })
    return response.data
  },

  /**
   * Update a task
   */
  async updateTask(taskId: string, updates: any): Promise<any> {
    const response = await api.patch(`/tasks/${taskId}`, updates)
    return response.data
  },

  /**
   * Delete a task
   */
  async deleteTask(taskId: string): Promise<void> {
    await api.delete(`/tasks/${taskId}`)
  },

  /**
   * Get project milestones
   */
  async getProjectMilestones(projectId: string): Promise<any[]> {
    try {
      const response = await api.get(`/projects/${projectId}/milestones`)
      return response.data || []
    } catch (error) {
      console.error('Failed to fetch project milestones:', error)
      return []
    }
  },

  /**
   * Create a milestone
   */
  async createMilestone(projectId: string, milestone: any): Promise<any> {
    const response = await api.post(`/projects/${projectId}/milestones`, {
      ...milestone,
      project_id: projectId,
    })
    return response.data
  },

  /**
   * Update a milestone
   */
  async updateMilestone(milestoneId: string, updates: any): Promise<any> {
    const response = await api.patch(`/milestones/${milestoneId}`, updates)
    return response.data
  },

  /**
   * Delete a milestone
   */
  async deleteMilestone(milestoneId: string): Promise<void> {
    await api.delete(`/milestones/${milestoneId}`)
  },
}

export default projectService
