import { useState, useEffect } from 'react'
import {
  CheckCircle2,
  Circle,
  Clock,
  Calendar,
  Edit2,
  Save,
  X,
  ChevronDown,
  ChevronUp,
  GripVertical,
} from 'lucide-react'
import type { TaskWithAssignees } from './ProjectDetailModal'
import Avatar, { AvatarGroup } from '../common/Avatar'

interface TeamMember {
  id: string
  name: string
}

interface TaskListProps {
  tasks: TaskWithAssignees[]
  onTaskUpdate: (taskId: string, updates: Partial<TaskWithAssignees>) => void
  onTaskReorder?: (draggedId: string, targetId: string) => void
  teamMembers?: TeamMember[]
}

export default function TaskList({
  tasks,
  onTaskUpdate,
  onTaskReorder,
  teamMembers = [],
}: TaskListProps) {
  const [editingTask, setEditingTask] = useState<string | null>(null)
  const [expandedTask, setExpandedTask] = useState<string | null>(null)
  const [draggedTask, setDraggedTask] = useState<string | null>(null)
  const [dragOverTask, setDragOverTask] = useState<string | null>(null)
  const [dropIndicator, setDropIndicator] = useState<'above' | 'below' | null>(null)

  const statusOptions = [
    { value: 'todo', label: 'To Do', color: 'bg-slate-500' },
    { value: 'in_progress', label: 'In Progress', color: 'bg-primary-500' },
    { value: 'done', label: 'Done', color: 'bg-green-500' },
  ]

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

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTask(taskId)
    e.dataTransfer.effectAllowed = 'move'
    const target = e.target as HTMLElement
    target.style.opacity = '0.5'
  }

  const handleDragOver = (e: React.DragEvent, taskId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'

    if (draggedTask && draggedTask !== taskId) {
      setDragOverTask(taskId)
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      const midY = rect.top + rect.height / 2
      setDropIndicator(e.clientY < midY ? 'above' : 'below')
    }
  }

  const handleDragLeave = () => {
    setDragOverTask(null)
    setDropIndicator(null)
  }

  const handleDragEnd = (e: React.DragEvent) => {
    const target = e.target as HTMLElement
    target.style.opacity = '1'

    if (draggedTask && dragOverTask && onTaskReorder) {
      onTaskReorder(draggedTask, dragOverTask)
    }
    setDraggedTask(null)
    setDragOverTask(null)
    setDropIndicator(null)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-white">Project Tasks</h3>
        <div className="flex items-center gap-4 text-sm text-slate-400">
          <span className="flex items-center gap-1">
            <CheckCircle2 size={14} className="text-green-400" />
            {tasks.filter((t) => t.status === 'done').length} Done
          </span>
          <span className="flex items-center gap-1">
            <Clock size={14} className="text-primary-400" />
            {tasks.filter((t) => t.status === 'in_progress').length} In Progress
          </span>
          <span className="flex items-center gap-1">
            <Circle size={14} className="text-slate-400" />
            {tasks.filter((t) => t.status === 'todo').length} To Do
          </span>
        </div>
      </div>

      <div className="text-xs text-slate-500 mb-2">
        Drag tasks to reorder. Click edit to change status, progress, or assignees.
      </div>

      <div className="space-y-2">
        {tasks.map((task, index) => (
          <TaskRow
            key={task.id}
            task={task}
            isEditing={editingTask === task.id}
            isExpanded={expandedTask === task.id}
            isDragging={draggedTask === task.id}
            isDragOver={dragOverTask === task.id}
            dropIndicator={dragOverTask === task.id ? dropIndicator : null}
            onEdit={() => setEditingTask(task.id)}
            onSave={(updates) => {
              onTaskUpdate(task.id, updates)
              setEditingTask(null)
            }}
            onCancel={() => setEditingTask(null)}
            onToggleExpand={() =>
              setExpandedTask(expandedTask === task.id ? null : task.id)
            }
            onDragStart={(e) => handleDragStart(e, task.id)}
            onDragOver={(e) => handleDragOver(e, task.id)}
            onDragLeave={handleDragLeave}
            onDragEnd={handleDragEnd}
            statusOptions={statusOptions}
            getStatusIcon={getStatusIcon}
            teamMembers={teamMembers}
            animationDelay={index * 50}
          />
        ))}
      </div>
    </div>
  )
}

function TaskRow({
  task,
  isEditing,
  isExpanded,
  isDragging,
  isDragOver,
  dropIndicator,
  onEdit,
  onSave,
  onCancel,
  onToggleExpand,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDragEnd,
  statusOptions,
  getStatusIcon,
  teamMembers,
  animationDelay,
}: {
  task: TaskWithAssignees
  isEditing: boolean
  isExpanded: boolean
  isDragging: boolean
  isDragOver: boolean
  dropIndicator: 'above' | 'below' | null
  onEdit: () => void
  onSave: (updates: Partial<TaskWithAssignees>) => void
  onCancel: () => void
  onToggleExpand: () => void
  onDragStart: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: () => void
  onDragEnd: (e: React.DragEvent) => void
  statusOptions: Array<{ value: string; label: string; color: string }>
  getStatusIcon: (status: string) => React.ReactNode
  teamMembers: TeamMember[]
  animationDelay: number
}) {
  const [editedTask, setEditedTask] = useState(task)
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setEditedTask(task)
  }, [task])

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), animationDelay)
    return () => clearTimeout(timer)
  }, [animationDelay])

  const handleSave = () => {
    onSave({
      title: editedTask.title,
      status: editedTask.status,
      assignees: editedTask.assignees,
      progress: editedTask.progress,
    })
    setShowAssigneeDropdown(false)
  }

  const handleStatusChange = (newStatus: TaskWithAssignees['status']) => {
    setEditedTask({
      ...editedTask,
      status: newStatus,
      progress: newStatus === 'done' ? 100 : newStatus === 'todo' ? 0 : editedTask.progress,
    })
  }

  const handleProgressChange = (value: number) => {
    const progress = Math.max(0, Math.min(100, value))
    let status = editedTask.status
    if (progress === 100) status = 'done'
    else if (progress === 0) status = 'todo'
    else if (progress > 0) status = 'in_progress'

    setEditedTask({ ...editedTask, progress, status })
  }

  const toggleAssignee = (name: string) => {
    const current = editedTask.assignees
    if (current.includes(name)) {
      setEditedTask({ ...editedTask, assignees: current.filter((a) => a !== name) })
    } else {
      setEditedTask({ ...editedTask, assignees: [...current, name] })
    }
  }

  return (
    <div
      draggable={!isEditing}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDragEnd={onDragEnd}
      className={`relative bg-slate-800/50 rounded-lg border transition-all duration-300 ease-out
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        ${isExpanded ? 'border-primary-500/50 shadow-lg shadow-primary-500/10' : 'border-slate-700'}
        ${isDragging ? 'opacity-50 scale-95 rotate-1' : ''}
        ${isDragOver ? 'scale-[1.02]' : ''}
        hover:border-slate-600 hover:shadow-md
      `}
    >
      {/* Drop indicator line */}
      {isDragOver && dropIndicator === 'above' && (
        <div className="absolute -top-1 left-0 right-0 h-0.5 bg-primary-500 rounded-full animate-pulse" />
      )}
      {isDragOver && dropIndicator === 'below' && (
        <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary-500 rounded-full animate-pulse" />
      )}

      <div
        className="flex items-center gap-3 p-4 cursor-pointer"
        onClick={onToggleExpand}
      >
        {/* Drag handle */}
        <div
          className="cursor-grab active:cursor-grabbing text-slate-500 hover:text-slate-300 transition-colors p-1 rounded hover:bg-slate-700/50"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <GripVertical size={16} />
        </div>

        <div className="transition-transform duration-200 hover:scale-110">
          {getStatusIcon(task.status)}
        </div>

        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              type="text"
              value={editedTask.title}
              onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-primary-500 transition-colors"
            />
          ) : (
            <span className={`text-white transition-all ${task.status === 'done' ? 'line-through text-slate-400' : ''}`}>
              {task.title}
            </span>
          )}
        </div>

        <div className="flex items-center gap-4 text-sm">
          {isEditing ? (
            <>
              <select
                value={editedTask.status}
                onChange={(e) => handleStatusChange(e.target.value as TaskWithAssignees['status'])}
                onClick={(e) => e.stopPropagation()}
                className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-primary-500 transition-colors"
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleSave()
                }}
                className="p-1.5 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-all hover:scale-110"
              >
                <Save size={14} />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowAssigneeDropdown(false)
                  onCancel()
                }}
                className="p-1.5 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all hover:scale-110"
              >
                <X size={14} />
              </button>
            </>
          ) : (
            <>
              {/* Avatar display */}
              <div onClick={(e) => e.stopPropagation()}>
                {task.assignees.length > 0 ? (
                  <AvatarGroup names={task.assignees} max={3} size="sm" />
                ) : (
                  <span className="text-slate-500 text-xs">Unassigned</span>
                )}
              </div>

              <span className="text-slate-400 w-12">{task.progress}%</span>

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setEditedTask(task)
                  onEdit()
                }}
                className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-all hover:scale-110"
              >
                <Edit2 size={14} />
              </button>

              <div className="transition-transform duration-200">
                {isExpanded ? (
                  <ChevronUp size={18} className="text-slate-400" />
                ) : (
                  <ChevronDown size={18} className="text-slate-400" />
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Expanded Details */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-out ${
          isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-4 pb-4 pt-2 border-t border-slate-700">
          {isEditing ? (
            <div className="space-y-4">
              {/* Progress Slider */}
              <div>
                <label className="text-sm text-slate-400 block mb-2">Progress: {editedTask.progress}%</label>
                <div className="flex items-center gap-3">
                  <div className="flex-1 relative">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={editedTask.progress}
                      onChange={(e) => handleProgressChange(parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editedTask.progress}
                    onChange={(e) => handleProgressChange(parseInt(e.target.value) || 0)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-16 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-sm text-center focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>

              {/* Multi-Assignee Selection */}
              <div className="relative">
                <label className="text-sm text-slate-400 block mb-2">Assignees</label>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowAssigneeDropdown(!showAssigneeDropdown)
                  }}
                  className="w-full flex items-center justify-between bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500 hover:border-slate-500 transition-colors"
                >
                  <span className="flex items-center gap-2 flex-wrap">
                    {editedTask.assignees.length > 0 ? (
                      <div className="flex items-center gap-2">
                        <AvatarGroup names={editedTask.assignees} max={5} size="sm" />
                        <span className="text-slate-400 text-xs ml-2">
                          {editedTask.assignees.length} selected
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-500">Select assignees...</span>
                    )}
                  </span>
                  <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${showAssigneeDropdown ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown with animation */}
                <div
                  className={`absolute z-10 mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden transition-all duration-200 ${
                    showAssigneeDropdown ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
                  }`}
                >
                  <div className="max-h-48 overflow-auto">
                    {teamMembers.map((member) => (
                      <label
                        key={member.id}
                        className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-700/70 cursor-pointer transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={editedTask.assignees.includes(member.name)}
                          onChange={() => toggleAssignee(member.name)}
                          className="rounded border-slate-600 bg-slate-700 text-primary-500 focus:ring-primary-500 focus:ring-offset-0"
                        />
                        <Avatar name={member.name} size="sm" showTooltip={false} />
                        <span className="text-white text-sm">{member.name}</span>
                        {editedTask.assignees.includes(member.name) && (
                          <CheckCircle2 size={14} className="text-green-400 ml-auto" />
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-slate-400 block mb-1">Status</span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs ${
                      statusOptions.find((s) => s.value === task.status)?.color
                    } bg-opacity-20`}
                  >
                    {statusOptions.find((s) => s.value === task.status)?.label}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block mb-1">Assignees</span>
                  <div className="flex items-center gap-2">
                    {task.assignees.length > 0 ? (
                      <AvatarGroup names={task.assignees} max={4} size="sm" />
                    ) : (
                      <span className="text-slate-500 text-xs">No assignees</span>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block mb-1">Start Date</span>
                  <span className="text-white flex items-center gap-1">
                    <Calendar size={14} />
                    {task.startDate}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block mb-1">End Date</span>
                  <span className="text-white flex items-center gap-1">
                    <Calendar size={14} />
                    {task.endDate}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400">Progress</span>
                  <span className="text-white">{task.progress}%</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ease-out ${
                      task.status === 'done' ? 'bg-green-500' : 'bg-primary-500'
                    }`}
                    style={{ width: `${task.progress}%` }}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
