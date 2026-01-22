import { useState, useMemo } from 'react'
import { Plus, Search, Filter, FolderOpen, CheckCircle2, Clock, Calendar } from 'lucide-react'
import { useProjectStore, type Project } from '../store/projectSlice'
import ProjectDetailModal from '../components/projects/ProjectDetailModal'

type TabType = 'active' | 'completed' | 'upcoming'

export default function ProjectsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<TabType>('active')
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)

  const { projects } = useProjectStore()

  // Filter projects by search term
  const filteredProjects = useMemo(() => {
    return projects.filter((project) =>
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [projects, searchTerm])

  // Categorize projects by status
  const activeProjects = useMemo(() =>
    filteredProjects.filter((p) => p.status === 'active'),
    [filteredProjects]
  )

  const completedProjects = useMemo(() =>
    filteredProjects.filter((p) => p.status === 'completed'),
    [filteredProjects]
  )

  // Upcoming projects - on_hold status or projects with future start dates
  const upcomingProjects = useMemo(() =>
    filteredProjects.filter((p) => p.status === 'on_hold'),
    [filteredProjects]
  )

  // Get projects for current tab
  const getCurrentProjects = () => {
    switch (activeTab) {
      case 'active':
        return activeProjects
      case 'completed':
        return completedProjects
      case 'upcoming':
        return upcomingProjects
      default:
        return activeProjects
    }
  }

  const currentProjects = getCurrentProjects()

  const selectedProject = selectedProjectId
    ? projects.find((p) => p.id === selectedProjectId)
    : null

  const tabs = [
    { id: 'active' as TabType, label: 'Active Projects', icon: FolderOpen, count: activeProjects.length },
    { id: 'completed' as TabType, label: 'Completed Projects', icon: CheckCircle2, count: completedProjects.length },
    { id: 'upcoming' as TabType, label: 'Upcoming Projects', icon: Clock, count: upcomingProjects.length },
  ]

  const formatDeadline = (daysUntilDeadline: number) => {
    const deadline = new Date()
    deadline.setDate(deadline.getDate() + daysUntilDeadline)
    return deadline.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatCompletedDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A'
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

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

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-800/50 p-1 rounded-lg w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                isActive
                  ? 'bg-primary-500 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Icon size={16} />
              {tab.label}
              <span
                className={`px-2 py-0.5 rounded-full text-xs ${
                  isActive
                    ? 'bg-primary-600 text-white'
                    : 'bg-slate-700 text-slate-400'
                }`}
              >
                {tab.count}
              </span>
            </button>
          )
        })}
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

      {/* Projects Grid */}
      {currentProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              formatDeadline={formatDeadline}
              formatCompletedDate={formatCompletedDate}
              onClick={() => setSelectedProjectId(project.id)}
            />
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <div className="text-slate-400 text-lg">
            {searchTerm
              ? `No ${activeTab} projects found matching "${searchTerm}"`
              : `No ${activeTab} projects`}
          </div>
          <p className="text-slate-500 text-sm mt-2">
            {activeTab === 'upcoming'
              ? 'Projects with "on hold" status will appear here'
              : activeTab === 'completed'
              ? 'Completed projects will appear here'
              : 'Create a new project to get started'}
          </p>
        </div>
      )}

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

function ProjectCard({
  project,
  formatDeadline,
  formatCompletedDate,
  onClick,
}: {
  project: Project
  formatDeadline: (days: number) => string
  formatCompletedDate: (dateStr?: string) => string
  onClick: () => void
}) {
  const statusConfig: Record<string, { bg: string; text: string; border: string; label: string }> = {
    active: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20', label: 'Active' },
    completed: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', label: 'Completed' },
    on_hold: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20', label: 'On Hold' },
  }

  const riskConfig: Record<string, { bg: string; text: string }> = {
    low: { bg: 'bg-green-500/10', text: 'text-green-400' },
    medium: { bg: 'bg-yellow-500/10', text: 'text-yellow-400' },
    high: { bg: 'bg-orange-500/10', text: 'text-orange-400' },
    critical: { bg: 'bg-red-500/10', text: 'text-red-400' },
  }

  const status = statusConfig[project.status] || statusConfig.active
  const risk = riskConfig[project.riskLevel] || riskConfig.low

  return (
    <div
      onClick={onClick}
      className="card cursor-pointer hover:border-primary-500/50 hover:bg-slate-800/80 transition-all group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold text-lg group-hover:text-primary-400 transition-colors truncate">
            {project.name}
          </h3>
          <p className="text-slate-400 text-sm mt-1 line-clamp-2">
            {project.description}
          </p>
        </div>
      </div>

      {/* Status & Risk Badges */}
      <div className="flex items-center gap-2 mb-4">
        <span className={`px-2 py-1 rounded-full text-xs border ${status.bg} ${status.text} ${status.border}`}>
          {status.label}
        </span>
        {project.status !== 'completed' && (
          <span className={`px-2 py-1 rounded-full text-xs ${risk.bg} ${risk.text}`}>
            {project.riskLevel.charAt(0).toUpperCase() + project.riskLevel.slice(1)} Risk
          </span>
        )}
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm text-slate-400">Progress</span>
          <span className="text-sm font-medium text-white">{project.completionPercentage}%</span>
        </div>
        <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              project.completionPercentage === 100 ? 'bg-emerald-500' : 'bg-primary-500'
            }`}
            style={{ width: `${project.completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-1.5 text-slate-400">
          <Calendar size={14} />
          <span>
            {project.status === 'completed'
              ? `Completed ${formatCompletedDate(project.completedAt)}`
              : formatDeadline(project.daysUntilDeadline)}
          </span>
        </div>
        <div className="text-slate-500">
          {project.tasks.length} tasks
        </div>
      </div>

      {/* Manager & Team */}
      <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center justify-between text-xs text-slate-500">
        <span>Manager: {project.manager}</span>
        <span>{project.team}</span>
      </div>
    </div>
  )
}
