import api from './api'
import type { Task, KanbanBoard } from '../types/task'

export const taskService = {
  /**
   * Get Kanban board for a project
   */
  async getKanbanBoard(projectId: string): Promise<KanbanBoard> {
    const response = await api.get(`/projects/${projectId}/kanban`)
    return response.data
  },

  /**
   * Get task details
   */
  async getTask(taskId: string): Promise<Task> {
    const response = await api.get(`/tasks/${taskId}`)
    return response.data
  },

  /**
   * Create a new task
   */
  async createTask(projectId: string, data: Partial<Task>): Promise<Task> {
    const response = await api.post(`/projects/${projectId}/tasks`, data)
    return response.data
  },

  /**
   * Update a task
   */
  async updateTask(taskId: string, data: Partial<Task>): Promise<Task> {
    const response = await api.patch(`/tasks/${taskId}`, data)
    return response.data
  },

  /**
   * Move task in Kanban board
   */
  async moveTask(taskId: string, newStatus: string, newPosition: number): Promise<void> {
    await api.patch(`/tasks/${taskId}/move`, {
      new_status: newStatus,
      new_position: newPosition,
    })
  },

  /**
   * Delete a task
   */
  async deleteTask(taskId: string): Promise<void> {
    await api.delete(`/tasks/${taskId}`)
  },
}

export default taskService
