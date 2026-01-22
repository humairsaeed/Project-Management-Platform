import { useState, useEffect, useCallback } from 'react'
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
  Edit2,
  ChevronDown,
  X,
} from 'lucide-react'
import Modal from '../common/Modal'
import TaskList from './TaskList'
import AuditTrail from '../common/AuditTrail'
import Avatar, { AvatarGroup } from '../common/Avatar'
import { useProjectStore, type TaskWithAssignees as StoreTaskWithAssignees, type RiskLevel } from '../../store/projectSlice'

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

// Available team members for assignment
export const teamMembers = [
  { id: 'u1', name: 'John Smith' },
  { id: 'u2', name: 'Sarah Jones' },
  { id: 'u3', name: 'Mike Wilson' },
  { id: 'u4', name: 'Emily Chen' },
  { id: 'u5', name: 'David Lee' },
]

export interface TaskWithAssignees {
  id: string
  title: string
  status: 'todo' | 'in_progress' | 'done'
  assignees: string[]
  startDate: string
  endDate: string
  progress: number
}

export interface AuditLogEntry {
  id: string
  userId: string
  userEmail: string
  userName: string
  tableName: string
  recordId: string
  recordName: string
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE'
  oldValue: Record<string, unknown> | null
  newValue: Record<string, unknown> | null
  changedFields: string[]
  createdAt: string
}

type Tab = 'overview' | 'tasks' | 'gantt' | 'audit'

export default function ProjectDetailModal({ project, onClose }: ProjectDetailModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([])
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  // Get project from store
  const { projects, updateProjectTasks, updateProject } = useProjectStore()
  const storeProject = projects.find((p) => p.id === project.id)

  // Local tasks state initialized from store
  const [tasks, setTasks] = useState<TaskWithAssignees[]>(
    storeProject?.tasks || []
  )

  // Sync tasks when store changes
  useEffect(() => {
    if (storeProject?.tasks) {
      setTasks(storeProject.tasks)
    }
  }, [storeProject?.tasks])

  // Calculate completion percentage from tasks
  const calculatedCompletion = useCallback(() => {
    if (tasks.length === 0) return 0
    const totalProgress = tasks.reduce((sum, task) => sum + task.progress, 0)
    return Math.round(totalProgress / tasks.length)
  }, [tasks])

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: BarChart3 },
    { id: 'tasks' as const, label: 'Tasks', icon: CheckCircle2 },
    { id: 'gantt' as const, label: 'Timeline', icon: Calendar },
    { id: 'audit' as const, label: 'History', icon: History },
  ]

  // Add audit log entry
  const addAuditLog = useCallback((
    action: AuditLogEntry['action'],
    recordName: string,
    oldValue: Record<string, unknown> | null,
    newValue: Record<string, unknown> | null,
    changedFields: string[],
    tableName = 'projects.tasks'
  ) => {
    const newLog: AuditLogEntry = {
      id: `log-${Date.now()}`,
      userId: '1',
      userEmail: 'admin@company.com',
      userName: 'System Admin',
      tableName,
      recordId: project.id,
      recordName,
      action,
      oldValue,
      newValue,
      changedFields,
      createdAt: new Date().toISOString(),
    }
    setAuditLogs((prev) => [newLog, ...prev])
  }, [project.id])

  const handleTaskUpdate = (taskId: string, updates: Partial<TaskWithAssignees>) => {
    const oldTask = tasks.find((t) => t.id === taskId)
    if (!oldTask) return

    const changedFields: string[] = []
    const oldValue: Record<string, unknown> = {}
    const newValue: Record<string, unknown> = {}

    // Track changes for audit log
    if (updates.status !== undefined && updates.status !== oldTask.status) {
      changedFields.push('status')
      oldValue.status = oldTask.status
      newValue.status = updates.status
    }
    if (updates.progress !== undefined && updates.progress !== oldTask.progress) {
      changedFields.push('progress')
      oldValue.progress = oldTask.progress
      newValue.progress = updates.progress
    }
    if (updates.assignees !== undefined && JSON.stringify(updates.assignees) !== JSON.stringify(oldTask.assignees)) {
      changedFields.push('assignees')
      oldValue.assignees = oldTask.assignees.join(', ')
      newValue.assignees = updates.assignees.join(', ')
    }
    if (updates.startDate !== undefined && updates.startDate !== oldTask.startDate) {
      changedFields.push('startDate')
      oldValue.startDate = oldTask.startDate
      newValue.startDate = updates.startDate
    }
    if (updates.endDate !== undefined && updates.endDate !== oldTask.endDate) {
      changedFields.push('endDate')
      oldValue.endDate = oldTask.endDate
      newValue.endDate = updates.endDate
    }

    const newTasks = tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t))
    setTasks(newTasks)

    // Add audit log if there were changes
    if (changedFields.length > 0) {
      const action = changedFields.includes('status') ? 'STATUS_CHANGE' : 'UPDATE'
      addAuditLog(action, oldTask.title, oldValue, newValue, changedFields)
    }

    // Auto-save to store
    updateProjectTasks(project.id, newTasks as StoreTaskWithAssignees[])

    // Show save message
    setSaveMessage('Changes saved!')
    setTimeout(() => setSaveMessage(null), 2000)
  }

  const handleTaskReorder = (draggedId: string, targetId: string) => {
    const draggedIndex = tasks.findIndex((t) => t.id === draggedId)
    const targetIndex = tasks.findIndex((t) => t.id === targetId)

    if (draggedIndex === -1 || targetIndex === -1) return

    const newTasks = [...tasks]
    const [draggedTask] = newTasks.splice(draggedIndex, 1)
    newTasks.splice(targetIndex, 0, draggedTask)
    setTasks(newTasks)

    addAuditLog('UPDATE', draggedTask.title, { position: draggedIndex }, { position: targetIndex }, ['position'])

    // Auto-save to store
    updateProjectTasks(project.id, newTasks as StoreTaskWithAssignees[])
    setSaveMessage('Changes saved!')
    setTimeout(() => setSaveMessage(null), 2000)
  }

  const handleTaskAdd = (newTask: TaskWithAssignees) => {
    const newTasks = [...tasks, newTask]
    setTasks(newTasks)

    addAuditLog('CREATE', newTask.title, null, { title: newTask.title, status: newTask.status }, [])

    // Auto-save to store
    updateProjectTasks(project.id, newTasks as StoreTaskWithAssignees[])
    setSaveMessage('Task added!')
    setTimeout(() => setSaveMessage(null), 2000)
  }

  const handleTaskDelete = (taskId: string) => {
    const deletedTask = tasks.find((t) => t.id === taskId)
    if (!deletedTask) return

    const newTasks = tasks.filter((t) => t.id !== taskId)
    setTasks(newTasks)

    addAuditLog('DELETE', deletedTask.title, { title: deletedTask.title, status: deletedTask.status }, null, [])

    // Auto-save to store
    updateProjectTasks(project.id, newTasks as StoreTaskWithAssignees[])
    setSaveMessage('Task deleted!')
    setTimeout(() => setSaveMessage(null), 2000)
  }

  const handleRiskLevelChange = (newRiskLevel: RiskLevel) => {
    const oldRiskLevel = storeProject?.riskLevel
    if (oldRiskLevel === newRiskLevel) return

    updateProject(project.id, { riskLevel: newRiskLevel })
    addAuditLog(
      'UPDATE',
      project.name,
      { riskLevel: oldRiskLevel },
      { riskLevel: newRiskLevel },
      ['riskLevel'],
      'projects'
    )
    setSaveMessage('Risk level updated!')
    setTimeout(() => setSaveMessage(null), 2000)
  }

  const completedTasks = tasks.filter((t) => t.status === 'done').length
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length
  const todoTasks = tasks.filter((t) => t.status === 'todo').length
  const currentCompletion = calculatedCompletion()
  const currentRiskLevel = storeProject?.riskLevel || project.riskLevel

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

        <div className="ml-auto flex items-center gap-3">
          {/* Save indicator */}
          {saveMessage && (
            <span className="flex items-center gap-1 text-sm text-green-400 animate-pulse">
              <CheckCircle2 size={14} />
              {saveMessage}
            </span>
          )}

          <Link
            to={`/projects/${project.id}`}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <ExternalLink size={16} />
            Open Full View
          </Link>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <OverviewTab
          project={{ ...project, completionPercentage: currentCompletion, riskLevel: currentRiskLevel }}
          stats={{ completedTasks, inProgressTasks, todoTasks, totalTasks: tasks.length }}
          onRiskLevelChange={handleRiskLevelChange}
        />
      )}

      {activeTab === 'tasks' && (
        <TaskList
          tasks={tasks}
          onTaskUpdate={handleTaskUpdate}
          onTaskReorder={handleTaskReorder}
          onTaskAdd={handleTaskAdd}
          onTaskDelete={handleTaskDelete}
          teamMembers={teamMembers}
        />
      )}

      {activeTab === 'gantt' && (
        <EditableGantt tasks={tasks} onTaskUpdate={handleTaskUpdate} />
      )}

      {activeTab === 'audit' && (
        <AuditTrail projectId={project.id} externalLogs={auditLogs} />
      )}
    </Modal>
  )
}

function OverviewTab({
  project,
  stats,
  onRiskLevelChange,
}: {
  project: ProjectDetailModalProps['project']
  stats: { completedTasks: number; inProgressTasks: number; todoTasks: number; totalTasks: number }
  onRiskLevelChange: (riskLevel: RiskLevel) => void
}) {
  const [showRiskDropdown, setShowRiskDropdown] = useState(false)

  const riskColors: Record<string, string> = {
    low: 'text-green-400',
    medium: 'text-yellow-400',
    high: 'text-orange-400',
    critical: 'text-red-400',
  }

  const riskBgColors: Record<string, string> = {
    low: 'bg-green-500/20 hover:bg-green-500/30',
    medium: 'bg-yellow-500/20 hover:bg-yellow-500/30',
    high: 'bg-orange-500/20 hover:bg-orange-500/30',
    critical: 'bg-red-500/20 hover:bg-red-500/30',
  }

  const riskOptions: RiskLevel[] = ['low', 'medium', 'high', 'critical']

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

        {/* Editable Risk Level */}
        <div className="bg-slate-700/50 rounded-lg p-4 relative">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
            <AlertCircle size={16} />
            Risk Level
            <Edit2 size={12} className="ml-auto opacity-50" />
          </div>
          <button
            onClick={() => setShowRiskDropdown(!showRiskDropdown)}
            className={`text-2xl font-bold capitalize ${riskColors[project.riskLevel]} flex items-center gap-2 hover:opacity-80 transition-opacity`}
          >
            {project.riskLevel}
            <ChevronDown size={18} className={`transition-transform ${showRiskDropdown ? 'rotate-180' : ''}`} />
          </button>

          {/* Risk Level Dropdown */}
          {showRiskDropdown && (
            <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-600 rounded-lg shadow-2xl overflow-hidden">
              {riskOptions.map((level) => (
                <button
                  key={level}
                  onClick={() => {
                    onRiskLevelChange(level)
                    setShowRiskDropdown(false)
                  }}
                  className={`w-full px-4 py-2.5 text-left capitalize flex items-center justify-between ${riskBgColors[level]} ${riskColors[level]} transition-colors`}
                >
                  {level}
                  {project.riskLevel === level && (
                    <CheckCircle2 size={16} />
                  )}
                </button>
              ))}
            </div>
          )}
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
            {stats.completedTasks}/{stats.totalTasks}
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

function EditableGantt({
  tasks,
  onTaskUpdate,
}: {
  tasks: TaskWithAssignees[]
  onTaskUpdate: (taskId: string, updates: Partial<TaskWithAssignees>) => void
}) {
  const [dragging, setDragging] = useState<{
    taskId: string
    type: 'move' | 'resize-start' | 'resize-end'
    startX: number
    originalStart: string
    originalEnd: string
  } | null>(null)
  const [editingDates, setEditingDates] = useState<string | null>(null)
  const [tempDates, setTempDates] = useState<{ start: string; end: string }>({ start: '', end: '' })

  // Generate weeks for header
  const weeks = ['Jan 6', 'Jan 13', 'Jan 20', 'Jan 27', 'Feb 3', 'Feb 10', 'Feb 17', 'Feb 24']
  const baseDate = new Date('2025-01-06')
  const totalDays = weeks.length * 7

  const getTaskPosition = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)

    const startOffset = Math.floor(
      (start.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24)
    )
    const duration = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))

    return {
      left: Math.max(0, (startOffset / totalDays) * 100),
      width: Math.min(100 - (startOffset / totalDays) * 100, (duration / totalDays) * 100),
    }
  }

  const handleMouseDown = (
    e: React.MouseEvent,
    taskId: string,
    type: 'move' | 'resize-start' | 'resize-end'
  ) => {
    e.preventDefault()
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return

    setDragging({
      taskId,
      type,
      startX: e.clientX,
      originalStart: task.startDate,
      originalEnd: task.endDate,
    })
  }

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragging) return

      const container = document.querySelector('.gantt-container')
      if (!container) return

      const containerWidth = container.clientWidth - 192 // subtract task name column width
      const deltaX = e.clientX - dragging.startX
      const daysDelta = Math.round((deltaX / containerWidth) * totalDays)

      if (daysDelta === 0) return

      const originalStart = new Date(dragging.originalStart)
      const originalEnd = new Date(dragging.originalEnd)

      let newStart = originalStart
      let newEnd = originalEnd

      if (dragging.type === 'move') {
        newStart = new Date(originalStart.getTime() + daysDelta * 24 * 60 * 60 * 1000)
        newEnd = new Date(originalEnd.getTime() + daysDelta * 24 * 60 * 60 * 1000)
      } else if (dragging.type === 'resize-start') {
        newStart = new Date(originalStart.getTime() + daysDelta * 24 * 60 * 60 * 1000)
        if (newStart >= originalEnd) return
      } else if (dragging.type === 'resize-end') {
        newEnd = new Date(originalEnd.getTime() + daysDelta * 24 * 60 * 60 * 1000)
        if (newEnd <= originalStart) return
      }

      onTaskUpdate(dragging.taskId, {
        startDate: newStart.toISOString().split('T')[0],
        endDate: newEnd.toISOString().split('T')[0],
      })
    },
    [dragging, onTaskUpdate, totalDays]
  )

  const handleMouseUp = useCallback(() => {
    setDragging(null)
  }, [])

  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [dragging, handleMouseMove, handleMouseUp])

  const statusColors: Record<string, string> = {
    done: 'bg-green-500',
    in_progress: 'bg-primary-500',
    todo: 'bg-slate-500',
  }

  const openDateEditor = (task: TaskWithAssignees) => {
    setEditingDates(task.id)
    setTempDates({ start: task.startDate, end: task.endDate })
  }

  const saveDates = (taskId: string) => {
    if (new Date(tempDates.start) >= new Date(tempDates.end)) {
      return // Invalid date range
    }
    onTaskUpdate(taskId, {
      startDate: tempDates.start,
      endDate: tempDates.end,
    })
    setEditingDates(null)
  }

  return (
    <div className="overflow-x-auto gantt-container">
      <div className="min-w-[700px]">
        <div className="mb-2 text-xs text-slate-400">
          Drag task bars to change dates. Drag edges to resize. Click the calendar icon to set exact dates.
        </div>

        {/* Timeline Header */}
        <div className="flex border-b border-slate-700">
          <div className="w-48 shrink-0 p-3 font-medium text-slate-300 text-sm">Task</div>
          <div className="w-20 shrink-0 p-3 font-medium text-slate-300 text-sm text-center">Assignees</div>
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
              <div key={task.id} className="flex items-center h-12 hover:bg-slate-700/30 transition-colors relative">
                <div className="w-48 shrink-0 px-3 flex items-center gap-2">
                  <button
                    onClick={() => openDateEditor(task)}
                    className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-primary-400 transition-colors"
                    title="Edit dates"
                  >
                    <Calendar size={14} />
                  </button>
                  <span className="text-sm text-white truncate">{task.title}</span>
                </div>
                <div className="w-20 shrink-0 flex items-center justify-center">
                  {task.assignees.length > 0 ? (
                    <AvatarGroup names={task.assignees} max={2} size="sm" />
                  ) : (
                    <span className="text-slate-500 text-xs">-</span>
                  )}
                </div>
                <div className="flex-1 relative h-full flex items-center px-2">
                  {/* Background grid */}
                  <div className="absolute inset-0 flex">
                    {weeks.map((_, i) => (
                      <div key={i} className="flex-1 border-l border-slate-700/30" />
                    ))}
                  </div>

                  {/* Task bar - draggable */}
                  <div
                    className={`absolute h-6 rounded-full ${statusColors[task.status]} opacity-80 cursor-move group transition-all duration-150 hover:opacity-100 hover:shadow-lg flex items-center justify-center`}
                    style={{ left: `${left}%`, width: `${width}%`, minWidth: '30px' }}
                    onMouseDown={(e) => handleMouseDown(e, task.id, 'move')}
                  >
                    {/* Left resize handle */}
                    <div
                      className="absolute left-0 top-0 w-3 h-full cursor-ew-resize bg-white/0 hover:bg-white/30 rounded-l-full transition-colors"
                      onMouseDown={(e) => {
                        e.stopPropagation()
                        handleMouseDown(e, task.id, 'resize-start')
                      }}
                    />

                    {/* Progress fill */}
                    {task.progress > 0 && task.progress < 100 && (
                      <div
                        className="absolute left-0 h-full bg-white/20 rounded-l-full pointer-events-none"
                        style={{ width: `${task.progress}%` }}
                      />
                    )}

                    {/* Avatar on the bar */}
                    {task.assignees.length > 0 && width > 5 && (
                      <div className="absolute -left-1 -top-1">
                        <Avatar name={task.assignees[0]} size="sm" />
                      </div>
                    )}

                    {/* Right resize handle */}
                    <div
                      className="absolute right-0 top-0 w-3 h-full cursor-ew-resize bg-white/0 hover:bg-white/30 rounded-r-full transition-colors"
                      onMouseDown={(e) => {
                        e.stopPropagation()
                        handleMouseDown(e, task.id, 'resize-end')
                      }}
                    />
                  </div>
                </div>

                {/* Date Editor Popup */}
                {editingDates === task.id && (
                  <div className="absolute z-50 left-12 top-full mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-2xl p-4 w-72">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-white font-medium text-sm">{task.title}</span>
                      <button
                        onClick={() => setEditingDates(null)}
                        className="p-1 hover:bg-slate-700 rounded text-slate-400"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Start Date</label>
                        <input
                          type="date"
                          value={tempDates.start}
                          onChange={(e) => setTempDates({ ...tempDates, start: e.target.value })}
                          className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">End Date</label>
                        <input
                          type="date"
                          value={tempDates.end}
                          onChange={(e) => setTempDates({ ...tempDates, end: e.target.value })}
                          className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500"
                        />
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => saveDates(task.id)}
                          className="flex-1 px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white rounded text-sm font-medium transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingDates(null)}
                          className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
