import { useState } from 'react'
import {
  CheckCircle2,
  Circle,
  Clock,
  User,
  Calendar,
  Edit2,
  Save,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

interface Task {
  id: string
  title: string
  status: 'todo' | 'in_progress' | 'done'
  assignee: string
  startDate: string
  endDate: string
  progress: number
}

interface TaskListProps {
  tasks: Task[]
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void
}

export default function TaskList({ tasks, onTaskUpdate }: TaskListProps) {
  const [editingTask, setEditingTask] = useState<string | null>(null)
  const [expandedTask, setExpandedTask] = useState<string | null>(null)

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

      <div className="space-y-2">
        {tasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            isEditing={editingTask === task.id}
            isExpanded={expandedTask === task.id}
            onEdit={() => setEditingTask(task.id)}
            onSave={(updates) => {
              onTaskUpdate(task.id, updates)
              setEditingTask(null)
            }}
            onCancel={() => setEditingTask(null)}
            onToggleExpand={() =>
              setExpandedTask(expandedTask === task.id ? null : task.id)
            }
            statusOptions={statusOptions}
            getStatusIcon={getStatusIcon}
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
  onEdit,
  onSave,
  onCancel,
  onToggleExpand,
  statusOptions,
  getStatusIcon,
}: {
  task: Task
  isEditing: boolean
  isExpanded: boolean
  onEdit: () => void
  onSave: (updates: Partial<Task>) => void
  onCancel: () => void
  onToggleExpand: () => void
  statusOptions: Array<{ value: string; label: string; color: string }>
  getStatusIcon: (status: string) => React.ReactNode
}) {
  const [editedTask, setEditedTask] = useState(task)

  const handleSave = () => {
    onSave({
      title: editedTask.title,
      status: editedTask.status,
      assignee: editedTask.assignee,
      progress: editedTask.progress,
    })
  }

  return (
    <div
      className={`bg-slate-800/50 rounded-lg border transition-all ${
        isExpanded ? 'border-primary-500/50' : 'border-slate-700'
      }`}
    >
      <div
        className="flex items-center gap-3 p-4 cursor-pointer"
        onClick={onToggleExpand}
      >
        {getStatusIcon(task.status)}

        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              type="text"
              value={editedTask.title}
              onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-primary-500"
            />
          ) : (
            <span className={`text-white ${task.status === 'done' ? 'line-through text-slate-400' : ''}`}>
              {task.title}
            </span>
          )}
        </div>

        <div className="flex items-center gap-4 text-sm">
          {isEditing ? (
            <>
              <select
                value={editedTask.status}
                onChange={(e) => {
                  const newStatus = e.target.value as Task['status']
                  setEditedTask({
                    ...editedTask,
                    status: newStatus,
                    progress: newStatus === 'done' ? 100 : newStatus === 'todo' ? 0 : editedTask.progress,
                  })
                }}
                onClick={(e) => e.stopPropagation()}
                className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-primary-500"
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
                className="p-1.5 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30"
              >
                <Save size={14} />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onCancel()
                }}
                className="p-1.5 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30"
              >
                <X size={14} />
              </button>
            </>
          ) : (
            <>
              <span className="flex items-center gap-1 text-slate-400">
                <User size={14} />
                {task.assignee}
              </span>

              <span className="text-slate-400 w-12">{task.progress}%</span>

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit()
                }}
                className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <Edit2 size={14} />
              </button>

              {isExpanded ? (
                <ChevronUp size={18} className="text-slate-400" />
              ) : (
                <ChevronDown size={18} className="text-slate-400" />
              )}
            </>
          )}
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && !isEditing && (
        <div className="px-4 pb-4 pt-2 border-t border-slate-700">
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
              <span className="text-slate-400 block mb-1">Assignee</span>
              <span className="text-white flex items-center gap-1">
                <User size={14} />
                {task.assignee}
              </span>
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
                className={`h-full rounded-full transition-all ${
                  task.status === 'done' ? 'bg-green-500' : 'bg-primary-500'
                }`}
                style={{ width: `${task.progress}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
