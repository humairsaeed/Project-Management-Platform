import { useState } from 'react'
import KanbanColumn from './KanbanColumn'
import type { TaskCard, TaskStatus } from '../../types/task'

interface KanbanBoardProps {
  projectId: string
}

// Mock data for development
const mockTasks: Record<TaskStatus, TaskCard[]> = {
  todo: [
    {
      id: '1',
      title: 'Security Testing',
      status: 'todo',
      priority: 'high',
      taskType: 'task',
      position: 0,
      completionPercentage: 0,
      labels: ['security'],
      subtaskCount: 3,
      completedSubtaskCount: 0,
      hasBlockers: false,
      commentCount: 2,
    },
    {
      id: '2',
      title: 'Documentation',
      status: 'todo',
      priority: 'medium',
      taskType: 'task',
      position: 1,
      completionPercentage: 0,
      labels: ['docs'],
      subtaskCount: 0,
      completedSubtaskCount: 0,
      hasBlockers: false,
      commentCount: 0,
    },
  ],
  in_progress: [
    {
      id: '3',
      title: 'Production WAF Deployment',
      status: 'in_progress',
      priority: 'critical',
      taskType: 'task',
      position: 0,
      completionPercentage: 60,
      labels: ['waf', 'production'],
      subtaskCount: 5,
      completedSubtaskCount: 3,
      hasBlockers: false,
      commentCount: 8,
    },
    {
      id: '4',
      title: 'API Gateway Integration',
      status: 'in_progress',
      priority: 'high',
      taskType: 'task',
      position: 1,
      completionPercentage: 30,
      labels: ['api'],
      subtaskCount: 4,
      completedSubtaskCount: 1,
      hasBlockers: false,
      commentCount: 3,
    },
  ],
  review: [
    {
      id: '5',
      title: 'WAF Rule Design',
      status: 'review',
      priority: 'high',
      taskType: 'task',
      position: 0,
      completionPercentage: 90,
      labels: ['waf'],
      subtaskCount: 2,
      completedSubtaskCount: 2,
      hasBlockers: false,
      commentCount: 5,
    },
  ],
  done: [
    {
      id: '6',
      title: 'API Inventory',
      status: 'done',
      priority: 'medium',
      taskType: 'task',
      position: 0,
      completionPercentage: 100,
      labels: ['api'],
      subtaskCount: 0,
      completedSubtaskCount: 0,
      hasBlockers: false,
      commentCount: 1,
    },
    {
      id: '7',
      title: 'Test Environment Setup',
      status: 'done',
      priority: 'medium',
      taskType: 'task',
      position: 1,
      completionPercentage: 100,
      labels: ['infrastructure'],
      subtaskCount: 2,
      completedSubtaskCount: 2,
      hasBlockers: false,
      commentCount: 4,
    },
  ],
  blocked: [],
}

const columns: { status: TaskStatus; title: string }[] = [
  { status: 'todo', title: 'To Do' },
  { status: 'in_progress', title: 'In Progress' },
  { status: 'review', title: 'Review' },
  { status: 'done', title: 'Done' },
]

export default function KanbanBoard({ projectId: _projectId }: KanbanBoardProps) {
  const [tasks] = useState(mockTasks)

  return (
    <div className="flex gap-4 h-full overflow-x-auto pb-4">
      {columns.map((column) => (
        <KanbanColumn
          key={column.status}
          status={column.status}
          title={column.title}
          tasks={tasks[column.status] || []}
        />
      ))}
    </div>
  )
}
