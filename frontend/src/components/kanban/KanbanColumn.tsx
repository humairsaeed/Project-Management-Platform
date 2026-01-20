import { Plus } from 'lucide-react'
import KanbanCard from './KanbanCard'
import type { TaskCard, TaskStatus } from '../../types/task'

interface KanbanColumnProps {
  status: TaskStatus
  title: string
  tasks: TaskCard[]
}

const statusColors: Record<TaskStatus, string> = {
  todo: 'border-slate-500',
  in_progress: 'border-blue-500',
  review: 'border-yellow-500',
  done: 'border-green-500',
  blocked: 'border-red-500',
}

export default function KanbanColumn({ status, title, tasks }: KanbanColumnProps) {
  return (
    <div className="flex flex-col w-80 shrink-0">
      {/* Column Header */}
      <div className={`flex items-center justify-between p-3 bg-slate-800 rounded-t-lg border-t-2 ${statusColors[status]}`}>
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-white">{title}</h3>
          <span className="px-2 py-0.5 bg-slate-700 rounded text-xs text-slate-400">
            {tasks.length}
          </span>
        </div>
        <button className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors">
          <Plus size={16} />
        </button>
      </div>

      {/* Cards Container */}
      <div className="flex-1 bg-slate-800/50 rounded-b-lg p-2 space-y-2 overflow-y-auto">
        {tasks.map((task) => (
          <KanbanCard key={task.id} task={task} />
        ))}

        {tasks.length === 0 && (
          <div className="p-4 text-center text-slate-500 text-sm">
            No tasks
          </div>
        )}
      </div>
    </div>
  )
}
