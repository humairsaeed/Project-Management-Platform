import { Link } from 'react-router-dom'
import { ArrowRight, ExternalLink, Clock, XCircle, User } from 'lucide-react'

interface ProjectCardProject {
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
  statusChangeReason?: string
  statusChangedBy?: string
  statusChangedAt?: string
}

interface ProjectCardProps {
  project: ProjectCardProject
  onClick?: () => void
}

export default function ProjectCard({ project, onClick }: ProjectCardProps) {
  const priorityColors: Record<string, string> = {
    low: 'text-slate-400',
    medium: 'text-blue-400',
    high: 'text-yellow-400',
    critical: 'text-red-400',
  }

  return (
    <div
      onClick={onClick}
      className={`card hover:border-slate-600 transition-colors ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-white font-medium">{project.name}</h3>
            <span className={`text-xs ${priorityColors[project.priority]}`}>
              {project.priority.toUpperCase()}
            </span>
          </div>

          {/* Description */}
          {project.description && (
            <p className="text-sm text-slate-400 mb-3 line-clamp-2">
              {project.description}
            </p>
          )}

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
            <span className="capitalize">Status: {project.status}</span>
            {project.manager && <span>PM: {project.manager}</span>}
            {project.daysUntilDeadline !== undefined && (
              <span>{project.daysUntilDeadline} days left</span>
            )}
          </div>

          {/* Status Change Reason - Display for specific statuses */}
          {project.statusChangeReason &&
           (project.status === 'on_hold' || project.status === 'cancelled') && (
            <div className="mt-3 p-3 bg-slate-700/50 border-l-2 border-amber-500 rounded">
              <div className="flex items-start gap-2">
                <div className="mt-0.5">
                  {project.status === 'on_hold' ? (
                    <Clock size={16} className="text-amber-400" />
                  ) : (
                    <XCircle size={16} className="text-red-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-slate-300 mb-1">
                    {project.status === 'on_hold' ? 'On Hold' : 'Cancelled'}
                  </div>
                  <p className="text-xs text-slate-400 break-words">
                    {project.statusChangeReason}
                  </p>
                  {project.statusChangedBy && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-slate-500">
                      <User size={12} />
                      <span>{project.statusChangedBy}</span>
                      {project.statusChangedAt && (
                        <span className="ml-1">
                          • {new Date(project.statusChangedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {onClick && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onClick()
              }}
              className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              title="View Details"
            >
              <ExternalLink size={18} />
            </button>
          )}
          <Link
            to={`/projects/${project.id}`}
            onClick={(e) => e.stopPropagation()}
            className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            title="Go to Project"
          >
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </div>
  )
}
