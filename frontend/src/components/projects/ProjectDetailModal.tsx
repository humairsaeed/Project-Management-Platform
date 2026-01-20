import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Calendar,
  User,
  Users,
  BarChart3,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  History,
} from 'lucide-react'
import Modal from '../common/Modal'
import TaskList from './TaskList'
import AuditTrail from '../common/AuditTrail'

interface ProjectDetailModalProps {
  project: {
    id: string
    name: string
    description?: string
    completionPercentage: number
    status: string
    riskLevel: string
    daysUntilDeadline?: number
    priority: string
    manager?: string
    team?: string
  }
  onClose: () => void
}

// Mock tasks for this project
const mockProjectTasks = [
  {
    id: 't1',
    title: 'WAF Rule Design',
    status: 'done' as const,
    assignee: 'John Smith',
    startDate: '2025-01-01',
    endDate: '2025-01-15',
    progress: 100,
  },
  {
    id: 't2',
    title: 'API Inventory',
    status: 'done' as const,
    assignee: 'Sarah Jones',
    startDate: '2025-01-05',
    endDate: '2025-01-12',
    progress: 100,
  },
  {
    id: 't3',
    title: 'Test Environment Setup',
    status: 'done' as const,
    assignee: 'Mike Wilson',
    startDate: '2025-01-10',
    endDate: '2025-01-17',
    progress: 100,
  },
  {
    id: 't4',
    title: 'Production WAF Deployment',
    status: 'in_progress' as const,
    assignee: 'John Smith',
    startDate: '2025-01-15',
    endDate: '2025-02-05',
    progress: 60,
  },
  {
    id: 't5',
    title: 'API Gateway Integration',
    status: 'in_progress' as const,
    assignee: 'Emily Chen',
    startDate: '2025-01-20',
    endDate: '2025-02-10',
    progress: 30,
  },
  {
    id: 't6',
    title: 'Security Testing',
    status: 'todo' as const,
    assignee: 'Sarah Jones',
    startDate: '2025-02-01',
    endDate: '2025-02-15',
    progress: 0,
  },
  {
    id: 't7',
    title: 'Documentation',
    status: 'todo' as const,
    assignee: 'Mike Wilson',
    startDate: '2025-02-10',
    endDate: '2025-02-20',
    progress: 0,
  },
]

type Tab = 'overview' | 'tasks' | 'gantt' | 'audit'

export default function ProjectDetailModal({ project, onClose }: ProjectDetailModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [tasks, setTasks] = useState(mockProjectTasks)

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: BarChart3 },
    { id: 'tasks' as const, label: 'Tasks', icon: CheckCircle2 },
    { id: 'gantt' as const, label: 'Timeline', icon: Calendar },
    { id: 'audit' as const, label: 'History', icon: History },
  ]

  const handleTaskUpdate = (taskId: string, updates: Partial<typeof tasks[0]>) => {
    setTasks(tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t)))
  }

  const completedTasks = tasks.filter((t) => t.status === 'done').length
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length
  const todoTasks = tasks.filter((t) => t.status === 'todo').length

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={project.name}
      subtitle={project.description}
      size="full"
    >
      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 border-b border-slate-700 -mt-2 pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
              activeTab === tab.id
                ? 'bg-primary-500/20 text-primary-400'
                : 'text-slate-400 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}

        <Link
          to={`/projects/${project.id}`}
          className="ml-auto flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
        >
          <ExternalLink size={16} />
          Open Full View
        </Link>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <OverviewTab project={project} stats={{ completedTasks, inProgressTasks, todoTasks }} />
      )}

      {activeTab === 'tasks' && (
        <TaskList tasks={tasks} onTaskUpdate={handleTaskUpdate} />
      )}

      {activeTab === 'gantt' && (
        <CompactGantt tasks={tasks} />
      )}

      {activeTab === 'audit' && (
        <AuditTrail recordId={project.id} tableName="projects.projects" />
      )}
    </Modal>
  )
}

function OverviewTab({
  project,
  stats,
}: {
  project: ProjectDetailModalProps['project']
  stats: { completedTasks: number; inProgressTasks: number; todoTasks: number }
}) {
  const riskColors: Record<string, string> = {
    low: 'text-green-400',
    medium: 'text-yellow-400',
    high: 'text-orange-400',
    critical: 'text-red-400',
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-700/50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
            <BarChart3 size={16} />
            Completion
          </div>
          <div className="text-2xl font-bold text-white">{project.completionPercentage}%</div>
        </div>

        <div className="bg-slate-700/50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
            <AlertCircle size={16} />
            Risk Level
          </div>
          <div className={`text-2xl font-bold capitalize ${riskColors[project.riskLevel]}`}>
            {project.riskLevel}
          </div>
        </div>

        <div className="bg-slate-700/50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
            <Clock size={16} />
            Days Remaining
          </div>
          <div className="text-2xl font-bold text-white">
            {project.daysUntilDeadline ?? 'N/A'}
          </div>
        </div>

        <div className="bg-slate-700/50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
            <CheckCircle2 size={16} />
            Tasks
          </div>
          <div className="text-2xl font-bold text-white">
            {stats.completedTasks}/{stats.completedTasks + stats.inProgressTasks + stats.todoTasks}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-slate-400">Overall Progress</span>
          <span className="text-white font-medium">{project.completionPercentage}%</span>
        </div>
        <div className="h-4 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary-600 to-primary-400 rounded-full transition-all duration-500"
            style={{ width: `${project.completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Project Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-white">Project Details</h3>

          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <User size={16} className="text-slate-400" />
              <span className="text-slate-400">Project Manager:</span>
              <span className="text-white">{project.manager || 'Not assigned'}</span>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <Users size={16} className="text-slate-400" />
              <span className="text-slate-400">Team:</span>
              <span className="text-white">{project.team || 'Not assigned'}</span>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <Calendar size={16} className="text-slate-400" />
              <span className="text-slate-400">Priority:</span>
              <span className="text-white capitalize">{project.priority}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium text-white">Task Breakdown</h3>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500" />
                Completed
              </span>
              <span className="text-white">{stats.completedTasks}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-primary-500" />
                In Progress
              </span>
              <span className="text-white">{stats.inProgressTasks}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-slate-500" />
                To Do
              </span>
              <span className="text-white">{stats.todoTasks}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CompactGantt({
  tasks,
}: {
  tasks: Array<{
    id: string
    title: string
    status: string
    startDate: string
    endDate: string
    progress: number
  }>
}) {
  // Generate weeks for header
  const weeks = ['Jan 6', 'Jan 13', 'Jan 20', 'Jan 27', 'Feb 3', 'Feb 10', 'Feb 17', 'Feb 24']

  const getTaskPosition = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const totalDays = weeks.length * 7

    const startOffset = Math.floor(
      (start.getTime() - new Date('2025-01-06').getTime()) / (1000 * 60 * 60 * 24)
    )
    const duration = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))

    return {
      left: Math.max(0, (startOffset / totalDays) * 100),
      width: Math.min(100 - (startOffset / totalDays) * 100, (duration / totalDays) * 100),
    }
  }

  const statusColors: Record<string, string> = {
    done: 'bg-green-500',
    in_progress: 'bg-primary-500',
    todo: 'bg-slate-500',
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[700px]">
        {/* Timeline Header */}
        <div className="flex border-b border-slate-700">
          <div className="w-48 shrink-0 p-3 font-medium text-slate-300 text-sm">Task</div>
          <div className="flex-1 flex">
            {weeks.map((week) => (
              <div
                key={week}
                className="flex-1 p-2 text-center text-xs text-slate-400 border-l border-slate-700"
              >
                {week}
              </div>
            ))}
          </div>
        </div>

        {/* Tasks */}
        <div className="divide-y divide-slate-700/50">
          {tasks.map((task) => {
            const { left, width } = getTaskPosition(task.startDate, task.endDate)
            return (
              <div key={task.id} className="flex items-center h-10 hover:bg-slate-700/30">
                <div className="w-48 shrink-0 px-3 text-sm text-white truncate">{task.title}</div>
                <div className="flex-1 relative h-full flex items-center px-2">
                  {/* Background grid */}
                  <div className="absolute inset-0 flex">
                    {weeks.map((_, i) => (
                      <div key={i} className="flex-1 border-l border-slate-700/30" />
                    ))}
                  </div>

                  {/* Task bar */}
                  <div
                    className={`absolute h-5 rounded ${statusColors[task.status]} opacity-80`}
                    style={{ left: `${left}%`, width: `${width}%` }}
                  >
                    {task.progress > 0 && task.progress < 100 && (
                      <div
                        className="h-full bg-white/20 rounded-l"
                        style={{ width: `${task.progress}%` }}
                      />
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
