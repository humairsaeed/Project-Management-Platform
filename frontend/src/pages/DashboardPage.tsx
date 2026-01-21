import { TrendingUp, FolderCheck, AlertTriangle, Clock, X } from 'lucide-react'
import PortfolioOverview from '../components/dashboard/PortfolioOverview'
import ProjectCard from '../components/dashboard/ProjectCard'
import MilestoneTimeline from '../components/dashboard/MilestoneTimeline'
import ProjectDetailModal from '../components/projects/ProjectDetailModal'
import { useDashboardStore } from '../store/dashboardSlice'

// Mock data for initial development
const mockProjects = [
  {
    id: '1',
    name: 'Vulnerabilities Remediation',
    description: 'Address critical security vulnerabilities across production systems including patch management, configuration hardening, and penetration testing remediation.',
    completionPercentage: 65,
    status: 'active' as const,
    riskLevel: 'medium' as const,
    daysUntilDeadline: 30,
    priority: 'high' as const,
    manager: 'John Smith',
    team: 'Security',
  },
  {
    id: '2',
    name: 'Cloud Migration Planning',
    description: 'Plan and execute migration of on-premises infrastructure to Azure cloud including assessment, architecture design, and pilot migrations.',
    completionPercentage: 70,
    status: 'active' as const,
    riskLevel: 'low' as const,
    daysUntilDeadline: 60,
    priority: 'high' as const,
    manager: 'Sarah Jones',
    team: 'Cloud Services',
  },
  {
    id: '3',
    name: 'WAF/API Security',
    description: 'Implement Web Application Firewall and API Gateway security controls to protect public-facing applications and services.',
    completionPercentage: 65,
    status: 'active' as const,
    riskLevel: 'medium' as const,
    daysUntilDeadline: 45,
    priority: 'critical' as const,
    manager: 'Mike Wilson',
    team: 'Security',
  },
  {
    id: '4',
    name: 'Tape Library & Backup Replacements',
    description: 'Replace aging tape library infrastructure with modern backup solutions including disk-based backup and cloud archival integration.',
    completionPercentage: 20,
    status: 'active' as const,
    riskLevel: 'low' as const,
    daysUntilDeadline: 120,
    priority: 'medium' as const,
    manager: 'Emily Chen',
    team: 'IT Infrastructure',
  },
]

const mockMilestones = {
  recent: [
    { id: '1', name: 'NLB Replacement', projectName: 'Infrastructure Upgrade', status: 'achieved' as const },
    { id: '2', name: 'Exchange Node Addition', projectName: 'Email Infrastructure', status: 'achieved' as const },
    { id: '3', name: 'Oracle 19c Migration', projectName: 'Database Upgrade', status: 'achieved' as const },
  ],
  upcoming: [
    { id: '4', name: 'Production Deployment', projectName: 'WAF/API Security', targetDate: '2025-02-15' },
    { id: '5', name: 'Phase 1 Complete', projectName: 'Cloud Migration', targetDate: '2025-03-01' },
  ],
}

export default function DashboardPage() {
  const { filter, setFilter, selectedProjectId, setSelectedProjectId } = useDashboardStore()

  // Filter projects based on selected filter
  const filteredProjects = mockProjects.filter((project) => {
    if (filter === 'all') return true
    if (filter === 'active') return project.status === 'active'
    if (filter === 'on_track') return project.riskLevel === 'low'
    if (filter === 'at_risk') return project.riskLevel === 'medium' || project.riskLevel === 'high' || project.riskLevel === 'critical'
    return true
  })

  // Calculate stats
  const activeCount = mockProjects.filter((p) => p.status === 'active').length
  const atRiskCount = mockProjects.filter((p) => p.riskLevel === 'medium' || p.riskLevel === 'high' || p.riskLevel === 'critical').length
  const avgCompletion = Math.round(mockProjects.reduce((sum, p) => sum + p.completionPercentage, 0) / mockProjects.length * 10) / 10

  const selectedProject = selectedProjectId
    ? mockProjects.find((p) => p.id === selectedProjectId)
    : null

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
          trend="+1 this month"
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
        <div>
          <MilestoneTimeline
            recentMilestones={mockMilestones.recent}
            upcomingMilestones={mockMilestones.upcoming}
          />
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
