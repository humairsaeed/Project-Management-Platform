import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import taskService from '../services/taskService'
import type { Task } from '../types/task'

export function useKanbanBoard(projectId: string) {
  return useQuery({
    queryKey: ['kanban', projectId],
    queryFn: () => taskService.getKanbanBoard(projectId),
    enabled: !!projectId,
  })
}

export function useTask(taskId: string) {
  return useQuery({
    queryKey: ['task', taskId],
    queryFn: () => taskService.getTask(taskId),
    enabled: !!taskId,
  })
}

export function useCreateTask(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Partial<Task>) => taskService.createTask(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban', projectId] })
      queryClient.invalidateQueries({ queryKey: ['project', projectId] })
    },
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: Partial<Task> }) =>
      taskService.updateTask(taskId, data),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] })
      // Invalidate all kanban boards as we don't know which project this belongs to
      queryClient.invalidateQueries({ queryKey: ['kanban'] })
    },
  })
}

export function useMoveTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      taskId,
      newStatus,
      newPosition,
    }: {
      taskId: string
      newStatus: string
      newPosition: number
    }) => taskService.moveTask(taskId, newStatus, newPosition),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban'] })
    },
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (taskId: string) => taskService.deleteTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban'] })
      queryClient.invalidateQueries({ queryKey: ['project'] })
    },
  })
}
