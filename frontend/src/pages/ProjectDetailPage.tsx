import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Kanban, GanttChart, Settings } from 'lucide-react'

export default function ProjectDetailPage() {
  const { projectId } = useParams()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/projects"
          className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">WAF/API Security Implementation</h1>
          <p className="text-slate-400 mt-1">Project ID: {projectId}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to={`/projects/${projectId}/kanban`} className="btn-secondary flex items-center gap-2">
            <Kanban size={18} />
            Kanban
          </Link>
          <Link to={`/projects/${projectId}/gantt`} className="btn-secondary flex items-center gap-2">
            <GanttChart size={18} />
            Gantt
          </Link>
          <button className="btn-secondary">
            <Settings size={18} />
          </button>
        </div>
      </div>

      {/* Project Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-slate-400 text-sm">Status</p>
          <p className="text-lg font-semibold text-green-400 mt-1">Active</p>
        </div>
        <div className="card">
          <p className="text-slate-400 text-sm">Completion</p>
          <p className="text-lg font-semibold text-white mt-1">65%</p>
        </div>
        <div className="card">
          <p className="text-slate-400 text-sm">Tasks</p>
          <p className="text-lg font-semibold text-white mt-1">13/20</p>
        </div>
        <div className="card">
          <p className="text-slate-400 text-sm">Days Remaining</p>
          <p className="text-lg font-semibold text-yellow-400 mt-1">45</p>
        </div>
      </div>

      {/* Content placeholder */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-4">Project Details</h2>
        <p className="text-slate-400">
          Deploy Web Application Firewall and implement comprehensive API security controls.
          Includes rule configuration, API gateway setup, and security testing.
        </p>
      </div>
    </div>
  )
}
