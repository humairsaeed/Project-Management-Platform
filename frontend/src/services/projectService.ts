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
    page?: number
    limit?: number
  }): Promise<PaginatedResponse<ProjectSummary>> {
    const response = await api.get('/projects', { params })
    return response.data
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
}

export default projectService
