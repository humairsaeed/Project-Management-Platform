import { TrendingUp, FolderCheck, AlertTriangle, Clock, X, Trophy, RotateCcw } from 'lucide-react'
import PortfolioOverview from '../components/dashboard/PortfolioOverview'
import ProjectCard from '../components/dashboard/ProjectCard'
import MilestoneTimeline from '../components/dashboard/MilestoneTimeline'
import ProjectDetailModal from '../components/projects/ProjectDetailModal'
import { useDashboardStore } from '../store/dashboardSlice'
import { useProjectStore } from '../store/projectSlice'

export default function DashboardPage() {
  const { filter, setFilter, selectedProjectId, setSelectedProjectId } = useDashboardStore()
  const { projects, milestones, reopenProject } = useProjectStore()

  // Get active and completed projects from the store
  const activeProjects = projects.filter((p) => p.status === 'active')
  const completedProjects = projects.filter((p) => p.status === 'completed')

  // Filter projects based on selected filter
  const filteredProjects = activeProjects.filter((project) => {
    if (filter === 'all') return true
    if (filter === 'active') return project.status === 'active'
    if (filter === 'on_track') return project.riskLevel === 'low'
    if (filter === 'at_risk') return project.riskLevel === 'medium' || project.riskLevel === 'high' || project.riskLevel === 'critical'
    return true
  })

  // Calculate stats from active projects
  const activeCount = activeProjects.length
  const atRiskCount = activeProjects.filter((p) => p.riskLevel === 'medium' || p.riskLevel === 'high' || p.riskLevel === 'critical').length
  const avgCompletion = activeProjects.length > 0
    ? Math.round(activeProjects.reduce((sum, p) => sum + p.completionPercentage, 0) / activeProjects.length * 10) / 10
    : 0

  const selectedProject = selectedProjectId
    ? projects.find((p) => p.id === selectedProjectId)
    : null

  const handleReopenProject = (projectId: string) => {
    reopenProject(projectId)
  }

  const formatCompletedDate = (dateStr?: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Executive Dashboard</h1>
          <p className="text-slate-400 mt-1">Portfolio overview and key metrics</p>
        </div>
        {filter !== 'all' && (
          <button
            onClick={() => setFilter('all')}
            className="flex items-center gap-2 px-3 py-1.5 bg-primary-500/20 text-primary-400 rounded-lg text-sm hover:bg-primary-500/30 transition-colors"
          >
            <X size={14} />
            Clear filter: {filter.replace('_', ' ')}
          </button>
        )}
      </div>

      {/* Stats Grid - Clickable */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Projects"
          value={activeCount.toString()}
          icon={<FolderCheck className="text-primary-400" />}
          trend={completedProjects.length > 0 ? `${completedProjects.length} completed` : 'No completed yet'}
          isActive={filter === 'active'}
          onClick={() => setFilter(filter === 'active' ? 'all' : 'active')}
        />
        <StatCard
          title="Portfolio Health"
          value={`${avgCompletion}%`}
          icon={<TrendingUp className="text-green-400" />}
          trend="On track"
          isActive={filter === 'on_track'}
          onClick={() => setFilter(filter === 'on_track' ? 'all' : 'on_track')}
        />
        <StatCard
          title="At Risk"
          value={atRiskCount.toString()}
          icon={<AlertTriangle className="text-yellow-400" />}
          trend="Needs attention"
          isActive={filter === 'at_risk'}
          onClick={() => setFilter(filter === 'at_risk' ? 'all' : 'at_risk')}
        />
        <StatCard
          title="Hours This Week"
          value="156"
          icon={<Clock className="text-blue-400" />}
          trend="Team total"
          isActive={false}
          onClick={() => {}}
          disabled
        />
      </div>

      {/* Portfolio Overview */}
      <PortfolioOverview
        projects={filteredProjects}
        onProjectClick={(projectId) => setSelectedProjectId(projectId)}
      />

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Cards */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">
            {filter === 'all' ? 'Active Projects' : `Filtered Projects (${filteredProjects.length})`}
          </h2>
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => setSelectedProjectId(project.id)}
            />
          ))}
          {filteredProjects.length === 0 && (
            <div className="card text-center py-8 text-slate-400">
              No projects match the current filter
            </div>
          )}
        </div>

        {/* Milestones */}
        <div className="space-y-6">
          <MilestoneTimeline
            recentMilestones={milestones.recent}
            upcomingMilestones={milestones.upcoming}
          />

          {/* Completed Projects / Recent Achievements */}
          {completedProjects.length > 0 && (
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-emerald-500/20">
                  <Trophy size={18} className="text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Recent Achievements</h3>
                  <p className="text-xs text-slate-400">Completed projects</p>
                </div>
              </div>

              <div className="space-y-3">
                {completedProjects.map((project) => (
                  <div
                    key={project.id}
                    className="group flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-emerald-500/30 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <FolderCheck size={18} className="text-emerald-400" />
                      </div>
                      <div>
                        <div className="text-white font-medium">{project.name}</div>
                        <div className="text-xs text-slate-400">
                          Completed {formatCompletedDate(project.completedAt)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded text-xs font-medium">
                        100%
                      </span>
                      <button
                        onClick={() => handleReopenProject(project.id)}
                        className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-xs transition-all"
                        title="Reopen project"
                      >
                        <RotateCcw size={12} />
                        Reopen
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Project Detail Modal */}
      {selectedProject && (
        <ProjectDetailModal
          project={selectedProject}
          onClose={() => setSelectedProjectId(null)}
        />
      )}
    </div>
  )
}

function StatCard({
  title,
  value,
  icon,
  trend,
  isActive,
  onClick,
  disabled,
}: {
  title: string
  value: string
  icon: React.ReactNode
  trend: string
  isActive: boolean
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <div
      onClick={disabled ? undefined : onClick}
      className={`card transition-all ${
        disabled
          ? 'opacity-60 cursor-not-allowed'
          : 'cursor-pointer hover:border-primary-500/50 hover:bg-slate-800/80'
      } ${isActive ? 'border-primary-500 bg-primary-500/10' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-sm">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          <p className="text-sm text-slate-500 mt-1">{trend}</p>
        </div>
        <div className={`p-3 rounded-lg ${isActive ? 'bg-primary-500/20' : 'bg-slate-700/50'}`}>
          {icon}
        </div>
      </div>
      {!disabled && (
        <div className="mt-3 text-xs text-slate-500">
          {isActive ? 'Click to clear filter' : 'Click to filter'}
        </div>
      )}
    </div>
  )
}
