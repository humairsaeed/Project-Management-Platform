import { ChevronRight, User, Users } from 'lucide-react'

interface ProjectWithDescription {
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
}

interface PortfolioOverviewProps {
  projects: ProjectWithDescription[]
  onProjectClick?: (projectId: string) => void
}

export default function PortfolioOverview({ projects, onProjectClick }: PortfolioOverviewProps) {
  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-white mb-4">Portfolio Overview</h2>

      <div className="space-y-4">
        {projects.map((project) => (
          <div
            key={project.id}
            onClick={() => onProjectClick?.(project.id)}
            className={`p-4 -mx-4 rounded-lg transition-all ${
              onProjectClick
                ? 'cursor-pointer hover:bg-slate-700/50'
                : ''
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-white font-medium">{project.name}</span>
                  <RiskBadge level={project.riskLevel} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-sm">
                    {project.completionPercentage}%
                  </span>
                  {onProjectClick && (
                    <ChevronRight size={16} className="text-slate-500" />
                  )}
                </div>
              </div>

              {/* Description */}
              {project.description && (
                <p className="text-sm text-slate-400 line-clamp-2">
                  {project.description}
                </p>
              )}

              {/* Progress bar */}
              <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${getProgressColor(
                    project.completionPercentage,
                    project.riskLevel
                  )}`}
                  style={{ width: `${project.completionPercentage}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-4">
                  <span className="capitalize">Priority: {project.priority}</span>
                  {project.manager && (
                    <span className="flex items-center gap-1">
                      <User size={12} />
                      {project.manager}
                    </span>
                  )}
                  {project.team && (
                    <span className="flex items-center gap-1">
                      <Users size={12} />
                      {project.team}
                    </span>
                  )}
                </div>
                {project.daysUntilDeadline !== undefined && (
                  <span>{project.daysUntilDeadline} days remaining</span>
                )}
              </div>
            </div>
          </div>
        ))}

        {projects.length === 0 && (
          <div className="text-center py-8 text-slate-400">
            No projects to display
          </div>
        )}
      </div>
    </div>
  )
}

function RiskBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    low: 'bg-green-500/10 text-green-400 border-green-500/20',
    medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    critical: 'bg-red-500/10 text-red-400 border-red-500/20',
  }

  return (
    <span className={`px-2 py-0.5 rounded text-xs border ${colors[level] || colors.low}`}>
      {level}
    </span>
  )
}

function getProgressColor(percentage: number, riskLevel: string): string {
  if (riskLevel === 'critical') return 'bg-red-500'
  if (riskLevel === 'high') return 'bg-orange-500'
  if (percentage >= 70) return 'bg-green-500'
  if (percentage >= 40) return 'bg-primary-500'
  return 'bg-yellow-500'
}
