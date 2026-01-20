import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import KanbanBoard from '../components/kanban/KanbanBoard'

export default function KanbanPage() {
  const { projectId } = useParams()

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to={`/projects/${projectId}`}
          className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Kanban Board</h1>
          <p className="text-slate-400 mt-1">WAF/API Security Implementation</p>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-hidden">
        <KanbanBoard projectId={projectId!} />
      </div>
    </div>
  )
}
