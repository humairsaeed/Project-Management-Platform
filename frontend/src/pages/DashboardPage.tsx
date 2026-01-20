import { TrendingUp, FolderCheck, AlertTriangle, Clock } from 'lucide-react'
import PortfolioOverview from '../components/dashboard/PortfolioOverview'
import ProjectCard from '../components/dashboard/ProjectCard'
import MilestoneTimeline from '../components/dashboard/MilestoneTimeline'

// Mock data for initial development
const mockProjects = [
  {
    id: '1',
    name: 'Vulnerabilities Remediation',
    completionPercentage: 65,
    status: 'active' as const,
    riskLevel: 'medium' as const,
    daysUntilDeadline: 30,
    priority: 'high' as const,
  },
  {
    id: '2',
    name: 'Cloud Migration Planning',
    completionPercentage: 70,
    status: 'active' as const,
    riskLevel: 'low' as const,
    daysUntilDeadline: 60,
    priority: 'high' as const,
  },
  {
    id: '3',
    name: 'WAF/API Security',
    completionPercentage: 65,
    status: 'active' as const,
    riskLevel: 'medium' as const,
    daysUntilDeadline: 45,
    priority: 'critical' as const,
  },
  {
    id: '4',
    name: 'Tape Library & Backup Replacements',
    completionPercentage: 20,
    status: 'active' as const,
    riskLevel: 'low' as const,
    daysUntilDeadline: 120,
    priority: 'medium' as const,
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
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Executive Dashboard</h1>
        <p className="text-slate-400 mt-1">Portfolio overview and key metrics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Projects"
          value="4"
          icon={<FolderCheck className="text-primary-400" />}
          trend="+1 this month"
        />
        <StatCard
          title="Portfolio Health"
          value="72.5%"
          icon={<TrendingUp className="text-green-400" />}
          trend="On track"
        />
        <StatCard
          title="At Risk"
          value="1"
          icon={<AlertTriangle className="text-yellow-400" />}
          trend="Needs attention"
        />
        <StatCard
          title="Hours This Week"
          value="156"
          icon={<Clock className="text-blue-400" />}
          trend="Team total"
        />
      </div>

      {/* Portfolio Overview */}
      <PortfolioOverview projects={mockProjects} />

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Cards */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Active Projects</h2>
          {mockProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>

        {/* Milestones */}
        <div>
          <MilestoneTimeline
            recentMilestones={mockMilestones.recent}
            upcomingMilestones={mockMilestones.upcoming}
          />
        </div>
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  icon,
  trend,
}: {
  title: string
  value: string
  icon: React.ReactNode
  trend: string
}) {
  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-sm">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          <p className="text-sm text-slate-500 mt-1">{trend}</p>
        </div>
        <div className="p-3 bg-slate-700/50 rounded-lg">{icon}</div>
      </div>
    </div>
  )
}
