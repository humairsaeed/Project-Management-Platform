import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import type { ProjectSnapshotSummary } from '../../types/project'

interface ProjectCardProps {
  project: ProjectSnapshotSummary
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const priorityColors: Record<string, string> = {
    low: 'text-slate-400',
    medium: 'text-blue-400',
    high: 'text-yellow-400',
    critical: 'text-red-400',
  }

  return (
    <div className="card hover:border-slate-600 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-white font-medium">{project.name}</h3>
            <span className={`text-xs ${priorityColors[project.priority]}`}>
              {project.priority.toUpperCase()}
            </span>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 rounded-full"
                style={{ width: `${project.completionPercentage}%` }}
              />
            </div>
            <span className="text-sm text-slate-400 w-12">
              {project.completionPercentage}%
            </span>
          </div>

          {/* Meta */}
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span>Status: {project.status}</span>
            {project.daysUntilDeadline !== undefined && (
              <span>{project.daysUntilDeadline} days left</span>
            )}
          </div>
        </div>

        <Link
          to={`/projects/${project.id}`}
          className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  )
}
