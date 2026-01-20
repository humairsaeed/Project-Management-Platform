import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Filter } from 'lucide-react'

export default function ProjectsPage() {
  const [searchTerm, setSearchTerm] = useState('')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Projects</h1>
          <p className="text-slate-400 mt-1">Manage your IT infrastructure projects</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          New Project
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <Search size={18} className="text-slate-400" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input flex-1"
          />
        </div>
        <button className="btn-secondary flex items-center gap-2">
          <Filter size={18} />
          Filters
        </button>
      </div>

      {/* Projects Table */}
      <div className="card overflow-hidden p-0">
        <table className="w-full">
          <thead className="bg-slate-700/50">
            <tr>
              <th className="text-left text-sm font-medium text-slate-300 px-6 py-4">Project</th>
              <th className="text-left text-sm font-medium text-slate-300 px-6 py-4">Status</th>
              <th className="text-left text-sm font-medium text-slate-300 px-6 py-4">Progress</th>
              <th className="text-left text-sm font-medium text-slate-300 px-6 py-4">Deadline</th>
              <th className="text-left text-sm font-medium text-slate-300 px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            <ProjectRow
              id="1"
              name="Vulnerabilities Remediation"
              status="active"
              progress={65}
              deadline="Feb 18, 2025"
            />
            <ProjectRow
              id="2"
              name="Cloud Migration Planning"
              status="active"
              progress={70}
              deadline="Mar 20, 2025"
            />
            <ProjectRow
              id="3"
              name="WAF/API Security"
              status="active"
              progress={65}
              deadline="Mar 05, 2025"
            />
            <ProjectRow
              id="4"
              name="Tape Library & Backup Replacements"
              status="active"
              progress={20}
              deadline="May 20, 2025"
            />
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ProjectRow({
  id,
  name,
  status,
  progress,
  deadline,
}: {
  id: string
  name: string
  status: string
  progress: number
  deadline: string
}) {
  const statusColors: Record<string, string> = {
    active: 'bg-green-500/10 text-green-400 border-green-500/20',
    planning: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    on_hold: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    completed: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  }

  return (
    <tr className="hover:bg-slate-700/30 transition-colors">
      <td className="px-6 py-4">
        <Link to={`/projects/${id}`} className="text-white font-medium hover:text-primary-400">
          {name}
        </Link>
      </td>
      <td className="px-6 py-4">
        <span className={`px-2 py-1 rounded-full text-xs border ${statusColors[status]}`}>
          {status}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-sm text-slate-400">{progress}%</span>
        </div>
      </td>
      <td className="px-6 py-4 text-slate-300">{deadline}</td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <Link
            to={`/projects/${id}/kanban`}
            className="text-sm text-primary-400 hover:text-primary-300"
          >
            Kanban
          </Link>
          <span className="text-slate-600">|</span>
          <Link
            to={`/projects/${id}/gantt`}
            className="text-sm text-primary-400 hover:text-primary-300"
          >
            Gantt
          </Link>
        </div>
      </td>
    </tr>
  )
}
