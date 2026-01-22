import { useState, useMemo } from 'react'
import {
  FolderOpen,
  CheckCircle2,
  Clock,
  Layers,
  Filter,
  TrendingUp,
  BarChart3,
  PieChart,
  Activity,
  Users,
  Calendar,
} from 'lucide-react'
import { useProjectStore } from '../store/projectSlice'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from 'recharts'

export default function DashboardPage() {
  const { projects } = useProjectStore()
  const [yearFilter, setYearFilter] = useState<string>('all')
  const [monthFilter, setMonthFilter] = useState<string>('all')

  // Get years that have projects
  const projectYears = useMemo(() => {
    const yearsSet = new Set<number>()
    projects.forEach((project) => {
      if (!project.isDeleted) {
        const deadline = new Date()
        deadline.setDate(deadline.getDate() + project.daysUntilDeadline)
        yearsSet.add(deadline.getFullYear())
      }
    })
    return Array.from(yearsSet).sort((a, b) => a - b)
  }, [projects])

  const months = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ]

  // Filter projects by year and month
  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      if (project.isDeleted) return false

      const deadline = new Date()
      deadline.setDate(deadline.getDate() + project.daysUntilDeadline)
      const deadlineYear = deadline.getFullYear().toString()
      const deadlineMonth = (deadline.getMonth() + 1).toString().padStart(2, '0')

      const matchesYear = yearFilter === 'all' || deadlineYear === yearFilter
      const matchesMonth = monthFilter === 'all' || deadlineMonth === monthFilter

      return matchesYear && matchesMonth
    })
  }, [projects, yearFilter, monthFilter])

  // Calculate counts
  const totalProjects = filteredProjects.length
  const activeProjects = filteredProjects.filter((p) => p.status === 'active').length
  const completedProjects = filteredProjects.filter((p) => p.status === 'completed').length
  const upcomingProjects = filteredProjects.filter((p) => p.status === 'on_hold').length

  // Chart data - Project status distribution
  const statusData = [
    { name: 'Active', value: activeProjects, color: '#22c55e' },
    { name: 'Completed', value: completedProjects, color: '#10b981' },
    { name: 'Upcoming', value: upcomingProjects, color: '#f59e0b' },
  ].filter((d) => d.value > 0)

  // Chart data - Risk level distribution
  const riskData = useMemo(() => {
    const activeOnly = filteredProjects.filter((p) => p.status === 'active')
    return [
      { name: 'Low', value: activeOnly.filter((p) => p.riskLevel === 'low').length, color: '#22c55e' },
      { name: 'Medium', value: activeOnly.filter((p) => p.riskLevel === 'medium').length, color: '#f59e0b' },
      { name: 'High', value: activeOnly.filter((p) => p.riskLevel === 'high').length, color: '#f97316' },
      { name: 'Critical', value: activeOnly.filter((p) => p.riskLevel === 'critical').length, color: '#ef4444' },
    ].filter((d) => d.value > 0)
  }, [filteredProjects])

  // Chart data - Team workload
  const teamData = useMemo(() => {
    const teamCounts: Record<string, number> = {}
    filteredProjects.forEach((p) => {
      if (p.status === 'active') {
        teamCounts[p.team] = (teamCounts[p.team] || 0) + 1
      }
    })
    return Object.entries(teamCounts).map(([name, projects]) => ({
      name,
      projects,
    }))
  }, [filteredProjects])

  // Chart data - Completion progress by project
  const completionData = useMemo(() => {
    return filteredProjects
      .filter((p) => p.status === 'active')
      .slice(0, 8)
      .map((p) => ({
        name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
        completion: p.completionPercentage,
        remaining: 100 - p.completionPercentage,
      }))
  }, [filteredProjects])

  // Chart data - Monthly trend (simulated based on daysUntilDeadline)
  const trendData = useMemo(() => {
    const monthlyData: Record<string, { month: string; active: number; completed: number }> = {}
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

    // Initialize last 6 months
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${d.getMonth()}`
      monthlyData[key] = {
        month: monthNames[d.getMonth()],
        active: 0,
        completed: 0,
      }
    }

    // Distribute projects
    filteredProjects.forEach((p) => {
      const deadline = new Date()
      deadline.setDate(deadline.getDate() + p.daysUntilDeadline)
      const key = `${deadline.getFullYear()}-${deadline.getMonth()}`
      if (monthlyData[key]) {
        if (p.status === 'completed') {
          monthlyData[key].completed++
        } else if (p.status === 'active') {
          monthlyData[key].active++
        }
      }
    })

    return Object.values(monthlyData)
  }, [filteredProjects])

  // Priority distribution
  const priorityData = useMemo(() => {
    const activeOnly = filteredProjects.filter((p) => p.status === 'active')
    return [
      { name: 'Critical', value: activeOnly.filter((p) => p.priority === 'critical').length, color: '#ef4444' },
      { name: 'High', value: activeOnly.filter((p) => p.priority === 'high').length, color: '#f97316' },
      { name: 'Medium', value: activeOnly.filter((p) => p.priority === 'medium').length, color: '#f59e0b' },
      { name: 'Low', value: activeOnly.filter((p) => p.priority === 'low').length, color: '#22c55e' },
    ].filter((d) => d.value > 0)
  }, [filteredProjects])

  return (
    <div className="space-y-6">
      {/* Page Header with Filters */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Executive Dashboard</h1>
          <p className="text-slate-400 mt-1">Portfolio overview and key metrics</p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <Filter size={18} className="text-slate-400" />
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-primary-500"
          >
            <option value="all">All Years</option>
            {projectYears.map((year) => (
              <option key={year} value={year.toString()}>
                {year}
              </option>
            ))}
          </select>
          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-primary-500"
          >
            <option value="all">All Months</option>
            {months.map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Projects"
          value={totalProjects}
          icon={<Layers className="text-primary-400" />}
          color="primary"
        />
        <StatCard
          title="Active Projects"
          value={activeProjects}
          icon={<FolderOpen className="text-green-400" />}
          color="green"
        />
        <StatCard
          title="Completed Projects"
          value={completedProjects}
          icon={<CheckCircle2 className="text-emerald-400" />}
          color="emerald"
        />
        <StatCard
          title="Upcoming Projects"
          value={upcomingProjects}
          icon={<Clock className="text-amber-400" />}
          color="amber"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Status Pie Chart */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-primary-500/20">
              <PieChart size={18} className="text-primary-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Project Status Distribution</h3>
              <p className="text-xs text-slate-400">Overview of project statuses</p>
            </div>
          </div>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <RechartsPie>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                  labelStyle={{ color: '#f1f5f9' }}
                />
                <Legend />
              </RechartsPie>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-slate-400">
              No data available
            </div>
          )}
        </div>

        {/* Risk Level Distribution */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-orange-500/20">
              <Activity size={18} className="text-orange-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Risk Level Distribution</h3>
              <p className="text-xs text-slate-400">Active projects by risk level</p>
            </div>
          </div>
          {riskData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <RechartsPie>
                <Pie
                  data={riskData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {riskData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                  labelStyle={{ color: '#f1f5f9' }}
                />
                <Legend />
              </RechartsPie>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-slate-400">
              No active projects
            </div>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Completion Progress Bar Chart */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-green-500/20">
              <BarChart3 size={18} className="text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Project Completion Progress</h3>
              <p className="text-xs text-slate-400">Active projects completion percentage</p>
            </div>
          </div>
          {completionData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={completionData} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis type="number" domain={[0, 100]} stroke="#94a3b8" />
                <YAxis type="category" dataKey="name" stroke="#94a3b8" width={100} tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                  labelStyle={{ color: '#f1f5f9' }}
                  formatter={(value: number) => [`${value}%`, 'Completion']}
                />
                <Bar dataKey="completion" fill="#22c55e" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-slate-400">
              No active projects
            </div>
          )}
        </div>

        {/* Team Workload */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <Users size={18} className="text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Team Workload</h3>
              <p className="text-xs text-slate-400">Active projects per team</p>
            </div>
          </div>
          {teamData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={teamData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                  labelStyle={{ color: '#f1f5f9' }}
                />
                <Bar dataKey="projects" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-slate-400">
              No active projects
            </div>
          )}
        </div>
      </div>

      {/* Charts Row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Trend */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <TrendingUp size={18} className="text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Project Trend</h3>
              <p className="text-xs text-slate-400">Monthly project distribution</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                labelStyle={{ color: '#f1f5f9' }}
              />
              <Legend />
              <Area type="monotone" dataKey="active" stackId="1" stroke="#22c55e" fill="#22c55e" fillOpacity={0.6} name="Active" />
              <Area type="monotone" dataKey="completed" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="Completed" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Priority Distribution */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-red-500/20">
              <Calendar size={18} className="text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Priority Distribution</h3>
              <p className="text-xs text-slate-400">Active projects by priority</p>
            </div>
          </div>
          {priorityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={priorityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                  labelStyle={{ color: '#f1f5f9' }}
                />
                <Bar dataKey="value" name="Projects" radius={[4, 4, 0, 0]}>
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-slate-400">
              No active projects
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string
  value: number
  icon: React.ReactNode
  color: 'primary' | 'green' | 'emerald' | 'amber'
}) {
  const bgColors = {
    primary: 'bg-primary-500/10 border-primary-500/20',
    green: 'bg-green-500/10 border-green-500/20',
    emerald: 'bg-emerald-500/10 border-emerald-500/20',
    amber: 'bg-amber-500/10 border-amber-500/20',
  }

  const iconBgColors = {
    primary: 'bg-primary-500/20',
    green: 'bg-green-500/20',
    emerald: 'bg-emerald-500/20',
    amber: 'bg-amber-500/20',
  }

  return (
    <div className={`card border ${bgColors[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-400 text-sm">{title}</p>
          <p className="text-3xl font-bold text-white mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${iconBgColors[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}
