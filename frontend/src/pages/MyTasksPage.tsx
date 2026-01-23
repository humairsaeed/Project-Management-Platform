import { useState, useMemo } from 'react'
import {
  CheckCircle2,
  Circle,
  Clock,
  Calendar,
  AlertTriangle,
  Edit2,
} from 'lucide-react'
import { useProjectStore } from '../store/projectSlice'
import { useAuthStore } from '../store/authSlice'
import ProjectDetailModal from '../components/projects/ProjectDetailModal'

type FilterType = 'all' | 'my_tasks' | 'overdue'
type SortType = 'priority' | 'due_date' | 'status'

export default function MyTasksPage() {
  const [activeFilter, setActiveFilter] = useState<FilterType>('my_tasks')
  const [sortBy, setSortBy] = useState<SortType>('due_date')
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const { projects } = useProjectStore()
  const { user } = useAuthStore()

  // Get all tasks assigned to the current user
  const myTasks = useMemo(() => {
    if (!user) return []

    const userName = `${user.firstName} ${user.lastName}`
    const allTasks: Array<{
      task: any
      projectId: string
      projectName: string
    }> = []

    projects.forEach((project) => {
      // Skip deleted projects
      if (project.isDeleted) return

      project.tasks.forEach((task) => {
        // Check if user is assigned to this task (case-insensitive comparison)
        const isAssigned = task.assignees.some(
          (assignee: string) => assignee.toLowerCase() === userName.toLowerCase()
        )

        if (isAssigned) {
          allTasks.push({
            task,
            projectId: project.id,
            projectName: project.name,
          })
        }
      })
    })

    return allTasks
  }, [projects, user])

  // Filter and sort tasks
  const filteredTasks = useMemo(() => {
    let filtered = myTasks

    // Apply filter
    if (activeFilter === 'my_tasks') {
      filtered = myTasks.filter((item) => item.task.status !== 'done')
    } else if (activeFilter === 'overdue') {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      filtered = myTasks.filter((item) => {
        const endDate = new Date(item.task.endDate)
        endDate.setHours(0, 0, 0, 0)
        return endDate < today && item.task.status !== 'done'
      })
    }

    // Apply sort
    filtered.sort((a, b) => {
      if (sortBy === 'due_date') {
        return new Date(a.task.endDate).getTime() - new Date(b.task.endDate).getTime()
      } else if (sortBy === 'status') {
        const statusOrder: Record<string, number> = { todo: 0, in_progress: 1, done: 2 }
        return (statusOrder[a.task.status] || 0) - (statusOrder[b.task.status] || 0)
      } else if (sortBy === 'priority') {
        // Sort by progress (higher progress = higher priority to finish)
        return b.task.progress - a.task.progress
      }
      return 0
    })

    return filtered
  }, [myTasks, activeFilter, sortBy])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done':
        return <CheckCircle2 size={18} className="text-green-400" />
      case 'in_progress':
        return <Clock size={18} className="text-primary-400" />
      default:
        return <Circle size={18} className="text-slate-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'done':
        return 'bg-green-500/20 text-green-400'
      case 'in_progress':
        return 'bg-primary-500/20 text-primary-400'
      default:
        return 'bg-slate-500/20 text-slate-400'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'done':
        return 'Done'
      case 'in_progress':
        return 'In Progress'
      default:
        return 'To Do'
    }
  }

  const isOverdue = (endDate: string, status: string) => {
    if (status === 'done') return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const taskEndDate = new Date(endDate)
    taskEndDate.setHours(0, 0, 0, 0)
    return taskEndDate < today
  }

  const getDaysUntilDue = (endDate: string) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const taskEndDate = new Date(endDate)
    taskEndDate.setHours(0, 0, 0, 0)
    const diffTime = taskEndDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const overdueTasks = myTasks.filter((item) => isOverdue(item.task.endDate, item.task.status))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">My Tasks</h1>
        <p className="text-slate-400">All tasks assigned to you</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
            <CheckCircle2 size={16} />
            Total Tasks
          </div>
          <div className="text-2xl font-bold text-white">{myTasks.length}</div>
        </div>
        <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
            <Circle size={16} />
            To Do
          </div>
          <div className="text-2xl font-bold text-white">
            {myTasks.filter((item) => item.task.status === 'todo').length}
          </div>
        </div>
        <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
            <Clock size={16} />
            In Progress
          </div>
          <div className="text-2xl font-bold text-white">
            {myTasks.filter((item) => item.task.status === 'in_progress').length}
          </div>
        </div>
        <div className="p-4 bg-slate-800/50 border border-red-500/30 rounded-lg">
          <div className="flex items-center gap-2 text-red-400 text-sm mb-1">
            <AlertTriangle size={16} />
            Overdue
          </div>
          <div className="text-2xl font-bold text-red-400">{overdueTasks.length}</div>
        </div>
      </div>

      {/* Filters and Sort */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveFilter('my_tasks')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeFilter === 'my_tasks'
                ? 'bg-primary-500 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Active Tasks ({myTasks.filter((item) => item.task.status !== 'done').length})
          </button>
          <button
            onClick={() => setActiveFilter('overdue')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeFilter === 'overdue'
                ? 'bg-red-500 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Overdue ({overdueTasks.length})
          </button>
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeFilter === 'all'
                ? 'bg-primary-500 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            All Tasks ({myTasks.length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortType)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500"
          >
            <option value="due_date">Due Date</option>
            <option value="status">Status</option>
            <option value="priority">Priority</option>
          </select>
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <CheckCircle2 size={48} className="mx-auto mb-4 opacity-50" />
            <p>No tasks found</p>
          </div>
        ) : (
          filteredTasks.map((item) => {
            const overdue = isOverdue(item.task.endDate, item.task.status)
            const daysUntil = getDaysUntilDue(item.task.endDate)

            return (
              <div
                key={`${item.projectId}-${item.task.id}`}
                className={`p-4 bg-slate-800/50 border rounded-lg hover:border-primary-500/30 transition-all cursor-pointer group ${
                  overdue ? 'border-red-500/30' : 'border-slate-700'
                }`}
                onClick={() => setSelectedProjectId(item.projectId)}
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1">{getStatusIcon(item.task.status)}</div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-white font-medium mb-1">{item.task.title}</h3>
                          <Edit2 size={14} className="text-slate-500 group-hover:text-primary-400 transition-colors" />
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <span className="truncate">{item.projectName}</span>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${getStatusBadge(item.task.status)}`}>
                        {getStatusLabel(item.task.status)}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 flex-wrap text-sm">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Calendar size={14} />
                        <span>
                          Due: {new Date(item.task.endDate).toLocaleDateString()}
                          {overdue ? (
                            <span className="ml-2 text-red-400 font-medium">
                              ({Math.abs(daysUntil)} day{Math.abs(daysUntil) !== 1 ? 's' : ''} overdue)
                            </span>
                          ) : daysUntil === 0 ? (
                            <span className="ml-2 text-amber-400 font-medium">(Due today)</span>
                          ) : daysUntil < 3 ? (
                            <span className="ml-2 text-amber-400 font-medium">
                              ({daysUntil} day{daysUntil !== 1 ? 's' : ''} left)
                            </span>
                          ) : null}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">Progress:</span>
                        <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              item.task.status === 'done' ? 'bg-green-500' : 'bg-primary-500'
                            }`}
                            style={{ width: `${item.task.progress}%` }}
                          />
                        </div>
                        <span className="text-white text-xs">{item.task.progress}%</span>
                      </div>
                    </div>

                    {/* Comments count */}
                    {item.task.comments && item.task.comments.length > 0 && (
                      <div className="mt-2 text-xs text-slate-400 flex items-center gap-1">
                        <CheckCircle2 size={12} />
                        {item.task.comments.length} comment{item.task.comments.length !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Project Detail Modal */}
      {selectedProjectId && (() => {
        const selectedProject = projects.find(p => p.id === selectedProjectId)
        if (!selectedProject) return null

        return (
          <ProjectDetailModal
            project={selectedProject}
            onClose={() => setSelectedProjectId(null)}
          />
        )
      })()}
    </div>
  )
}
