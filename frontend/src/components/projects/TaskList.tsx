import { useState, useEffect, useRef } from 'react'
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
  Plus,
  Trash2,
  Search,
  AlertTriangle,
  MessageSquare,
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
  onTaskAdd?: (task: TaskWithAssignees) => void
  onTaskDelete?: (taskId: string) => void
  teamMembers?: TeamMember[]
}

export default function TaskList({
  tasks,
  onTaskUpdate,
  onTaskReorder,
  onTaskAdd,
  onTaskDelete,
  teamMembers = [],
}: TaskListProps) {
  const [editingTask, setEditingTask] = useState<string | null>(null)
  const [expandedTask, setExpandedTask] = useState<string | null>(null)
  const [draggedTask, setDraggedTask] = useState<string | null>(null)
  const [dragOverTask, setDragOverTask] = useState<string | null>(null)
  const [dropIndicator, setDropIndicator] = useState<'above' | 'below' | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskStatus, setNewTaskStatus] = useState<'todo' | 'in_progress' | 'done'>('todo')
  const [newTaskAssignees, setNewTaskAssignees] = useState<string[]>([])
  const [newTaskStartDate, setNewTaskStartDate] = useState('')
  const [newTaskEndDate, setNewTaskEndDate] = useState('')
  const [showNewTaskAssigneeDropdown, setShowNewTaskAssigneeDropdown] = useState(false)
  const [newTaskAssigneeSearch, setNewTaskAssigneeSearch] = useState('')
  const [newTaskComment, setNewTaskComment] = useState('')
  const newTaskAssigneeDropdownRef = useRef<HTMLDivElement>(null)

  // Close new task assignee dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (newTaskAssigneeDropdownRef.current && !newTaskAssigneeDropdownRef.current.contains(event.target as Node)) {
        setShowNewTaskAssigneeDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Initialize dates when form opens
  const initializeNewTaskForm = () => {
    const today = new Date()
    const nextWeek = new Date(today)
    nextWeek.setDate(nextWeek.getDate() + 7)
    setNewTaskTitle('')
    setNewTaskStatus('todo')
    setNewTaskAssignees([])
    setNewTaskStartDate(today.toISOString().split('T')[0])
    setNewTaskEndDate(nextWeek.toISOString().split('T')[0])
    setNewTaskComment('')
    setShowAddForm(true)
  }

  // Filter team members for new task dropdown
  const filteredNewTaskMembers = teamMembers.filter((member) =>
    member.name.toLowerCase().includes(newTaskAssigneeSearch.toLowerCase())
  )

  const toggleNewTaskAssignee = (name: string) => {
    if (newTaskAssignees.includes(name)) {
      setNewTaskAssignees(newTaskAssignees.filter((a) => a !== name))
    } else {
      setNewTaskAssignees([...newTaskAssignees, name])
    }
  }

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
    // Find the parent task row for visual feedback
    const handle = e.target as HTMLElement
    const taskRow = handle.closest('.bg-slate-800\\/50') as HTMLElement
    if (taskRow) {
      taskRow.style.opacity = '0.5'
    }
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
    // Find the parent task row and reset opacity
    const handle = e.target as HTMLElement
    const taskRow = handle.closest('.bg-slate-800\\/50') as HTMLElement
    if (taskRow) {
      taskRow.style.opacity = '1'
    }

    if (draggedTask && dragOverTask && onTaskReorder) {
      onTaskReorder(draggedTask, dragOverTask)
    }
    setDraggedTask(null)
    setDragOverTask(null)
    setDropIndicator(null)
  }

  const handleAddTask = () => {
    if (!newTaskTitle.trim() || !onTaskAdd) return

    // Calculate progress based on status
    let progress = 0
    if (newTaskStatus === 'done') progress = 100
    else if (newTaskStatus === 'in_progress') progress = 50

    const newTask: TaskWithAssignees = {
      id: `t${Date.now()}`,
      title: newTaskTitle.trim(),
      status: newTaskStatus,
      assignees: newTaskAssignees,
      startDate: newTaskStartDate,
      endDate: newTaskEndDate,
      progress,
      comment: newTaskComment.trim() || undefined,
    }

    onTaskAdd(newTask)
    setNewTaskTitle('')
    setNewTaskStatus('todo')
    setNewTaskAssignees([])
    setNewTaskComment('')
    setShowAddForm(false)
    setShowNewTaskAssigneeDropdown(false)
    setNewTaskAssigneeSearch('')
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
        {tasks.map((task) => (
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
            onDelete={onTaskDelete ? () => onTaskDelete(task.id) : undefined}
            onDragStart={(e) => handleDragStart(e, task.id)}
            onDragOver={(e) => handleDragOver(e, task.id)}
            onDragLeave={handleDragLeave}
            onDragEnd={handleDragEnd}
            statusOptions={statusOptions}
            getStatusIcon={getStatusIcon}
            teamMembers={teamMembers}
          />
        ))}
      </div>

      {/* Add Task Button / Form */}
      {onTaskAdd && (
        <div className="mt-4">
          {showAddForm ? (
            <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-5 animate-in slide-in-from-top-2 duration-200">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-white font-medium">Add New Task</h4>
                <button
                  onClick={() => {
                    setShowAddForm(false)
                    setNewTaskTitle('')
                    setShowNewTaskAssigneeDropdown(false)
                  }}
                  className="p-1.5 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Task Title */}
                <div>
                  <label className="text-sm text-slate-400 block mb-2">Task Title *</label>
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newTaskTitle.trim()) handleAddTask()
                      if (e.key === 'Escape') {
                        setShowAddForm(false)
                        setNewTaskTitle('')
                      }
                    }}
                    placeholder="Enter task title..."
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-primary-500 transition-colors"
                    autoFocus
                  />
                </div>

                {/* Status and Timeline Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Status */}
                  <div>
                    <label className="text-sm text-slate-400 block mb-2">Status</label>
                    <select
                      value={newTaskStatus}
                      onChange={(e) => setNewTaskStatus(e.target.value as 'todo' | 'in_progress' | 'done')}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-primary-500 transition-colors"
                    >
                      {statusOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Start Date */}
                  <div>
                    <label className="text-sm text-slate-400 block mb-2">Start Date</label>
                    <input
                      type="date"
                      value={newTaskStartDate}
                      onChange={(e) => setNewTaskStartDate(e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-primary-500 transition-colors"
                    />
                  </div>

                  {/* End Date */}
                  <div>
                    <label className="text-sm text-slate-400 block mb-2">End Date</label>
                    <input
                      type="date"
                      value={newTaskEndDate}
                      onChange={(e) => setNewTaskEndDate(e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-primary-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Assignees */}
                <div ref={newTaskAssigneeDropdownRef} className="relative">
                  <label className="text-sm text-slate-400 block mb-2">Assignees</label>
                  <button
                    type="button"
                    onClick={() => setShowNewTaskAssigneeDropdown(!showNewTaskAssigneeDropdown)}
                    className="w-full max-w-sm flex items-center justify-between bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-primary-500 hover:border-slate-500 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      {newTaskAssignees.length > 0 ? (
                        <>
                          <AvatarGroup names={newTaskAssignees} max={3} size="sm" />
                          <span className="text-slate-400 text-xs">
                            {newTaskAssignees.length} selected
                          </span>
                        </>
                      ) : (
                        <span className="text-slate-500">Select assignees...</span>
                      )}
                    </span>
                    <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${showNewTaskAssigneeDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Assignee Dropdown */}
                  {showNewTaskAssigneeDropdown && (
                    <div className="absolute z-[200] mt-2 w-72 max-w-sm bg-slate-800/95 backdrop-blur-md border border-slate-600 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                      {/* Search Input */}
                      <div className="p-3 border-b border-slate-700">
                        <div className="relative">
                          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            value={newTaskAssigneeSearch}
                            onChange={(e) => setNewTaskAssigneeSearch(e.target.value)}
                            placeholder="Search team members..."
                            className="w-full bg-slate-700/50 border border-slate-600 rounded-lg pl-9 pr-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-primary-500 transition-colors"
                          />
                        </div>
                      </div>

                      {/* Members List */}
                      <div className="max-h-52 overflow-auto py-2">
                        {filteredNewTaskMembers.length > 0 ? (
                          filteredNewTaskMembers.map((member) => (
                            <label
                              key={member.id}
                              className="flex items-center gap-3 px-3 py-2 mx-2 rounded-lg hover:bg-slate-700/50 cursor-pointer transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={newTaskAssignees.includes(member.name)}
                                onChange={() => toggleNewTaskAssignee(member.name)}
                                className="rounded border-slate-600 bg-slate-700 text-primary-500 focus:ring-primary-500 focus:ring-offset-0"
                              />
                              <Avatar name={member.name} size="sm" showTooltip={false} />
                              <span className="text-white text-sm flex-1">{member.name}</span>
                              {newTaskAssignees.includes(member.name) && (
                                <CheckCircle2 size={14} className="text-green-400" />
                              )}
                            </label>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-center text-slate-500 text-sm">
                            No members found
                          </div>
                        )}
                      </div>

                      {/* Footer with count */}
                      {newTaskAssignees.length > 0 && (
                        <div className="px-3 py-2 border-t border-slate-700 bg-slate-800/50">
                          <span className="text-xs text-slate-400">
                            {newTaskAssignees.length} member{newTaskAssignees.length !== 1 ? 's' : ''} selected
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Comment Field */}
                <div>
                  <label className="text-sm text-slate-400 block mb-2">
                    <MessageSquare size={14} className="inline mr-1" />
                    Comment (optional)
                  </label>
                  <textarea
                    value={newTaskComment}
                    onChange={(e) => setNewTaskComment(e.target.value)}
                    placeholder="Add a comment or note about this task..."
                    rows={2}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-primary-500 transition-colors resize-none"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => {
                      setShowAddForm(false)
                      setNewTaskTitle('')
                      setNewTaskComment('')
                      setShowNewTaskAssigneeDropdown(false)
                    }}
                    className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddTask}
                    disabled={!newTaskTitle.trim()}
                    className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Add Task
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={initializeNewTaskForm}
              className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-700 hover:border-primary-500/50 rounded-lg text-slate-400 hover:text-primary-400 transition-all hover:bg-slate-800/30"
            >
              <Plus size={18} />
              Add New Task
            </button>
          )}
        </div>
      )}
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
  onDelete,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDragEnd,
  statusOptions,
  getStatusIcon,
  teamMembers,
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
  onDelete?: () => void
  onDragStart: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: () => void
  onDragEnd: (e: React.DragEvent) => void
  statusOptions: Array<{ value: string; label: string; color: string }>
  getStatusIcon: (status: string) => React.ReactNode
  teamMembers: TeamMember[]
}) {
  const [editedTask, setEditedTask] = useState(task)
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [assigneeSearch, setAssigneeSearch] = useState('')
  const assigneeDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setEditedTask(task)
  }, [task])

  // Reset search when dropdown closes
  useEffect(() => {
    if (!showAssigneeDropdown) {
      setAssigneeSearch('')
    }
  }, [showAssigneeDropdown])

  // Close assignee dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (assigneeDropdownRef.current && !assigneeDropdownRef.current.contains(event.target as Node)) {
        setShowAssigneeDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filter team members based on search
  const filteredMembers = teamMembers.filter((member) =>
    member.name.toLowerCase().includes(assigneeSearch.toLowerCase())
  )

  const handleSave = () => {
    onSave({
      title: editedTask.title,
      status: editedTask.status,
      assignees: editedTask.assignees,
      progress: editedTask.progress,
      comment: editedTask.comment,
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

  // Handle row click - toggle expand
  const handleRowClick = (e: React.MouseEvent) => {
    // Check if click originated from drag handle
    const target = e.target as HTMLElement
    if (target.closest('[data-drag-handle]')) {
      return // Don't toggle if clicking drag handle
    }
    onToggleExpand()
  }

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      className={`relative bg-slate-800/50 rounded-lg border transition-all duration-300 ease-out
        ${isExpanded ? 'border-primary-500/50 shadow-lg shadow-primary-500/10 z-10' : 'border-slate-700'}
        ${isDragging ? 'opacity-50 scale-95 rotate-1' : ''}
        ${isDragOver ? 'scale-[1.02]' : ''}
        ${showAssigneeDropdown ? 'z-50' : ''}
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
        className="flex items-center gap-3 p-4 cursor-pointer select-none"
        onClick={handleRowClick}
      >
        {/* Drag handle - only this element is draggable */}
        <div
          data-drag-handle
          draggable={!isEditing}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          className="cursor-grab active:cursor-grabbing text-slate-500 hover:text-slate-300 transition-colors p-1 rounded hover:bg-slate-700/50"
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

              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowDeleteConfirm(true)
                  }}
                  className="p-1.5 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-all hover:scale-110"
                >
                  <Trash2 size={14} />
                </button>
              )}

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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          onClick={(e) => {
            e.stopPropagation()
            setShowDeleteConfirm(false)
          }}
        >
          {/* Backdrop with blur */}
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />

          {/* Modal Content */}
          <div
            className="relative bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-6 w-80 max-w-[90vw] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
                <AlertTriangle size={24} className="text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Delete Task</h3>
              <p className="text-slate-400 text-sm mb-6">
                Are you sure you want to delete <span className="text-white font-medium">"{task.title}"</span>? This action cannot be undone.
              </p>
              <div className="flex items-center gap-3 w-full">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowDeleteConfirm(false)
                  }}
                  className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete?.()
                    setShowDeleteConfirm(false)
                  }}
                  className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expanded Details */}
      <div
        className={`transition-all duration-300 ease-out ${
          isExpanded ? 'max-h-[500px] opacity-100 overflow-visible' : 'max-h-0 opacity-0 overflow-hidden pointer-events-none'
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
              <div ref={assigneeDropdownRef} className="relative">
                <label className="text-sm text-slate-400 block mb-2">Assignees</label>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowAssigneeDropdown(!showAssigneeDropdown)
                  }}
                  className="w-full max-w-sm flex items-center justify-between bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500 hover:border-slate-500 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    {editedTask.assignees.length > 0 ? (
                      <>
                        <AvatarGroup names={editedTask.assignees} max={3} size="sm" />
                        <span className="text-slate-400 text-xs">
                          {editedTask.assignees.length} selected
                        </span>
                      </>
                    ) : (
                      <span className="text-slate-500">Select assignees...</span>
                    )}
                  </span>
                  <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${showAssigneeDropdown ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown with blur backdrop and animation */}
                {showAssigneeDropdown && (
                  <div
                    className="absolute z-[200] mt-2 w-72 max-w-sm bg-slate-800/95 backdrop-blur-md border border-slate-600 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Search Input */}
                    <div className="p-3 border-b border-slate-700">
                      <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={assigneeSearch}
                          onChange={(e) => setAssigneeSearch(e.target.value)}
                          placeholder="Search team members..."
                          className="w-full bg-slate-700/50 border border-slate-600 rounded-lg pl-9 pr-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-primary-500 transition-colors"
                          autoFocus
                        />
                      </div>
                    </div>

                    {/* Members List */}
                    <div className="max-h-52 overflow-auto py-2">
                      {filteredMembers.length > 0 ? (
                        filteredMembers.map((member) => (
                          <label
                            key={member.id}
                            className="flex items-center gap-3 px-3 py-2 mx-2 rounded-lg hover:bg-slate-700/50 cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={editedTask.assignees.includes(member.name)}
                              onChange={() => toggleAssignee(member.name)}
                              className="rounded border-slate-600 bg-slate-700 text-primary-500 focus:ring-primary-500 focus:ring-offset-0"
                            />
                            <Avatar name={member.name} size="sm" showTooltip={false} />
                            <span className="text-white text-sm flex-1">{member.name}</span>
                            {editedTask.assignees.includes(member.name) && (
                              <CheckCircle2 size={14} className="text-green-400" />
                            )}
                          </label>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-center text-slate-500 text-sm">
                          No members found
                        </div>
                      )}
                    </div>

                    {/* Footer with count */}
                    {editedTask.assignees.length > 0 && (
                      <div className="px-3 py-2 border-t border-slate-700 bg-slate-800/50">
                        <span className="text-xs text-slate-400">
                          {editedTask.assignees.length} member{editedTask.assignees.length !== 1 ? 's' : ''} selected
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Comment Field */}
              <div>
                <label className="text-sm text-slate-400 block mb-2">
                  <MessageSquare size={14} className="inline mr-1" />
                  Comment
                </label>
                <textarea
                  value={editedTask.comment || ''}
                  onChange={(e) => setEditedTask({ ...editedTask, comment: e.target.value })}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="Add a comment or note..."
                  rows={2}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-primary-500 transition-colors resize-none"
                />
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

              {/* Comment Display */}
              {task.comment && (
                <div className="mt-4 p-3 bg-slate-700/50 rounded-lg">
                  <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                    <MessageSquare size={14} />
                    <span>Comment</span>
                  </div>
                  <p className="text-white text-sm">{task.comment}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
