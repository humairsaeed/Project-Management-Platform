import { MessageSquare, CheckSquare } from 'lucide-react'
import type { TaskCard } from '../../types/task'

interface KanbanCardProps {
  task: TaskCard
}

const priorityColors: Record<string, string> = {
  low: 'bg-slate-500',
  medium: 'bg-blue-500',
  high: 'bg-yellow-500',
  critical: 'bg-red-500',
}

export default function KanbanCard({ task }: KanbanCardProps) {
  return (
    <div className="bg-slate-700 rounded-lg p-3 cursor-pointer hover:bg-slate-600 transition-colors group">
      {/* Priority indicator */}
      <div className={`h-1 w-8 rounded-full mb-2 ${priorityColors[task.priority]}`} />

      {/* Title */}
      <h4 className="text-white font-medium text-sm mb-2 group-hover:text-primary-300">
        {task.title}
      </h4>

      {/* Labels */}
      {task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.labels.map((label) => (
            <span
              key={label}
              className="px-2 py-0.5 bg-primary-500/20 text-primary-300 rounded text-xs"
            >
              {label}
            </span>
          ))}
        </div>
      )}

      {/* Progress (if in progress) */}
      {task.completionPercentage > 0 && task.completionPercentage < 100 && (
        <div className="mb-2">
          <div className="h-1.5 bg-slate-600 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 rounded-full"
              style={{ width: `${task.completionPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-3">
          {task.subtaskCount > 0 && (
            <span className="flex items-center gap-1">
              <CheckSquare size={12} />
              {task.completedSubtaskCount}/{task.subtaskCount}
            </span>
          )}
          {task.commentCount > 0 && (
            <span className="flex items-center gap-1">
              <MessageSquare size={12} />
              {task.commentCount}
            </span>
          )}
        </div>

        {task.dueDate && (
          <span className="text-slate-500">{task.dueDate}</span>
        )}
      </div>
    </div>
  )
}
