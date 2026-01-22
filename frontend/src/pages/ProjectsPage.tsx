import { useState, useMemo } from 'react'
import {
  Plus,
  Search,
  Filter,
  FolderOpen,
  CheckCircle2,
  Clock,
  Calendar,
  Trash2,
  AlertTriangle,
  GripVertical,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  RotateCcw,
  MoveRight,
  Archive,
} from 'lucide-react'
import { useProjectStore, type Project, type RiskLevel, type Priority, type ProjectStatus } from '../store/projectSlice'
import ProjectDetailModal from '../components/projects/ProjectDetailModal'

type TabType = 'active' | 'completed' | 'upcoming' | 'deleted'
type SortType = 'custom' | 'date_asc' | 'date_desc' | 'name_asc' | 'name_desc'

const teamOptions = ['Security', 'Cloud Services', 'IT Infrastructure', 'DevOps', 'Engineering']
const managerOptions = ['John Smith', 'Sarah Jones', 'Mike Wilson', 'Emily Chen', 'David Lee']

export default function ProjectsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<TabType>('active')
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [showNewProjectModal, setShowNewProjectModal] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [permanentDeleteId, setPermanentDeleteId] = useState<string | null>(null)
  const [sortType, setSortType] = useState<SortType>('custom')

  // Filter states
  const [yearFilter, setYearFilter] = useState<string>('all')
  const [monthFilter, setMonthFilter] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)

  // Drag and drop states
  const [draggedProjectId, setDraggedProjectId] = useState<string | null>(null)
  const [dragOverProjectId, setDragOverProjectId] = useState<string | null>(null)

  // New project form states
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    team: '',
    manager: '',
    priority: 'medium' as Priority,
    riskLevel: 'low' as RiskLevel,
    status: 'active' as ProjectStatus,
    daysUntilDeadline: 30,
  })

  const {
    projects,
    addProject,
    softDeleteProject,
    restoreProject,
    permanentDeleteProject,
    reorderProjects,
    moveToUpcoming,
    moveToActive,
  } = useProjectStore()

  // Get years and months for filters
  const currentYear = new Date().getFullYear()
  const years = [currentYear - 1, currentYear, currentYear + 1, currentYear + 2]
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

  // Filter projects by search term and date filters (excluding deleted)
  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      // Exclude deleted projects from main filters
      if (project.isDeleted) return false

      const matchesSearch =
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description.toLowerCase().includes(searchTerm.toLowerCase())

      // Calculate deadline date for filtering
      const deadline = new Date()
      deadline.setDate(deadline.getDate() + project.daysUntilDeadline)
      const deadlineYear = deadline.getFullYear().toString()
      const deadlineMonth = (deadline.getMonth() + 1).toString().padStart(2, '0')

      const matchesYear = yearFilter === 'all' || deadlineYear === yearFilter
      const matchesMonth = monthFilter === 'all' || deadlineMonth === monthFilter

      return matchesSearch && matchesYear && matchesMonth
    })
  }, [projects, searchTerm, yearFilter, monthFilter])

  // Sort projects
  const sortedProjects = useMemo(() => {
    if (sortType === 'custom') return filteredProjects

    return [...filteredProjects].sort((a, b) => {
      switch (sortType) {
        case 'name_asc':
          return a.name.localeCompare(b.name)
        case 'name_desc':
          return b.name.localeCompare(a.name)
        case 'date_asc':
          return a.daysUntilDeadline - b.daysUntilDeadline
        case 'date_desc':
          return b.daysUntilDeadline - a.daysUntilDeadline
        default:
          return 0
      }
    })
  }, [filteredProjects, sortType])

  // Get deleted projects
  const deletedProjects = useMemo(() => {
    return projects.filter((p) => p.isDeleted).filter((project) =>
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [projects, searchTerm])

  // Categorize projects by status
  const activeProjects = useMemo(
    () => sortedProjects.filter((p) => p.status === 'active'),
    [sortedProjects]
  )

  const completedProjects = useMemo(
    () => sortedProjects.filter((p) => p.status === 'completed'),
    [sortedProjects]
  )

  const upcomingProjects = useMemo(
    () => sortedProjects.filter((p) => p.status === 'on_hold'),
    [sortedProjects]
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
      case 'deleted':
        return deletedProjects
      default:
        return activeProjects
    }
  }

  const currentProjects = getCurrentProjects()

  const selectedProject = selectedProjectId ? projects.find((p) => p.id === selectedProjectId) : null

  const tabs = [
    { id: 'active' as TabType, label: 'Active Projects', icon: FolderOpen, count: activeProjects.length },
    { id: 'completed' as TabType, label: 'Completed Projects', icon: CheckCircle2, count: completedProjects.length },
    { id: 'upcoming' as TabType, label: 'Upcoming Projects', icon: Clock, count: upcomingProjects.length },
    { id: 'deleted' as TabType, label: 'Deleted Projects', icon: Archive, count: deletedProjects.length },
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

  const handleCreateProject = () => {
    if (!newProject.name.trim()) return

    const project: Project = {
      id: `p${Date.now()}`,
      name: newProject.name.trim(),
      description: newProject.description.trim() || 'No description provided',
      completionPercentage: 0,
      status: newProject.status,
      riskLevel: newProject.riskLevel,
      daysUntilDeadline: newProject.daysUntilDeadline,
      priority: newProject.priority,
      manager: newProject.manager || 'Unassigned',
      team: newProject.team || 'General',
      tasks: [],
    }

    addProject(project)
    setShowNewProjectModal(false)
    setNewProject({
      name: '',
      description: '',
      team: '',
      manager: '',
      priority: 'medium',
      riskLevel: 'low',
      status: 'active',
      daysUntilDeadline: 30,
    })
  }

  const handleSoftDelete = (projectId: string) => {
    softDeleteProject(projectId)
    setDeleteConfirmId(null)
  }

  const handleRestore = (projectId: string) => {
    restoreProject(projectId)
  }

  const handlePermanentDelete = (projectId: string) => {
    permanentDeleteProject(projectId)
    setPermanentDeleteId(null)
  }

  const handleMoveToUpcoming = (projectId: string) => {
    moveToUpcoming(projectId)
  }

  const handleMoveToActive = (projectId: string) => {
    moveToActive(projectId)
  }

  const cycleSortType = () => {
    const sortOrder: SortType[] = ['custom', 'date_asc', 'date_desc', 'name_asc', 'name_desc']
    const currentIndex = sortOrder.indexOf(sortType)
    const nextIndex = (currentIndex + 1) % sortOrder.length
    setSortType(sortOrder[nextIndex])
  }

  const getSortLabel = () => {
    switch (sortType) {
      case 'custom':
        return 'Custom Order'
      case 'date_asc':
        return 'Date (Earliest)'
      case 'date_desc':
        return 'Date (Latest)'
      case 'name_asc':
        return 'Name (A-Z)'
      case 'name_desc':
        return 'Name (Z-A)'
      default:
        return 'Sort'
    }
  }

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, projectId: string) => {
    setDraggedProjectId(projectId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, projectId: string) => {
    e.preventDefault()
    if (draggedProjectId && draggedProjectId !== projectId) {
      setDragOverProjectId(projectId)
    }
  }

  const handleDragLeave = () => {
    setDragOverProjectId(null)
  }

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    if (draggedProjectId && draggedProjectId !== targetId) {
      reorderProjects(draggedProjectId, targetId)
      // Reset to custom order when manually reordering
      setSortType('custom')
    }
    setDraggedProjectId(null)
    setDragOverProjectId(null)
  }

  const handleDragEnd = () => {
    setDraggedProjectId(null)
    setDragOverProjectId(null)
  }

  const clearFilters = () => {
    setYearFilter('all')
    setMonthFilter('all')
    setSearchTerm('')
  }

  const hasActiveFilters = yearFilter !== 'all' || monthFilter !== 'all' || searchTerm !== ''

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Projects</h1>
          <p className="text-slate-400 mt-1">Plan, track, and deliver your projects</p>
        </div>
        <button
          onClick={() => setShowNewProjectModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          New Project
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-800/50 p-1 rounded-lg w-fit flex-wrap">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                isActive
                  ? tab.id === 'deleted'
                    ? 'bg-red-500/80 text-white'
                    : 'bg-primary-500 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Icon size={16} />
              {tab.label}
              <span
                className={`px-2 py-0.5 rounded-full text-xs ${
                  isActive
                    ? tab.id === 'deleted'
                      ? 'bg-red-600 text-white'
                      : 'bg-primary-600 text-white'
                    : 'bg-slate-700 text-slate-400'
                }`}
              >
                {tab.count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Filters Row */}
      <div className="flex items-center gap-4 flex-wrap">
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

        {/* Filter Toggle Button */}
        {activeTab !== 'deleted' && (
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary flex items-center gap-2 ${showFilters ? 'bg-primary-500/20 border-primary-500' : ''}`}
          >
            <Filter size={18} />
            Filters
            {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-primary-500" />}
          </button>
        )}

        {/* Sort Button */}
        {activeTab !== 'deleted' && (
          <button
            onClick={cycleSortType}
            className={`btn-secondary flex items-center gap-2 ${sortType !== 'custom' ? 'bg-primary-500/20 border-primary-500' : ''}`}
          >
            {sortType === 'date_asc' || sortType === 'name_asc' ? (
              <ArrowUp size={18} />
            ) : sortType === 'date_desc' || sortType === 'name_desc' ? (
              <ArrowDown size={18} />
            ) : (
              <ArrowUpDown size={18} />
            )}
            {getSortLabel()}
          </button>
        )}
      </div>

      {/* Expanded Filters */}
      {showFilters && activeTab !== 'deleted' && (
        <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-4 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-medium">Filter by Target Date</h3>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1"
              >
                <X size={14} />
                Clear all
              </button>
            )}
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            {/* Year Filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-400">Year:</label>
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-primary-500"
              >
                <option value="all">All Years</option>
                {years.map((year) => (
                  <option key={year} value={year.toString()}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            {/* Month Filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-400">Month:</label>
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
        </div>
      )}

      {/* Drag Hint */}
      {activeTab !== 'deleted' && (
        <div className="text-xs text-slate-500">
          Drag projects to reorder. Click on a project to view details.
        </div>
      )}

      {/* Projects Grid */}
      {currentProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              formatDeadline={formatDeadline}
              formatCompletedDate={formatCompletedDate}
              onClick={() => !project.isDeleted && setSelectedProjectId(project.id)}
              onDelete={() => setDeleteConfirmId(project.id)}
              onRestore={() => handleRestore(project.id)}
              onPermanentDelete={() => setPermanentDeleteId(project.id)}
              onMoveToUpcoming={() => handleMoveToUpcoming(project.id)}
              onMoveToActive={() => handleMoveToActive(project.id)}
              isDragging={draggedProjectId === project.id}
              isDragOver={dragOverProjectId === project.id}
              onDragStart={(e) => handleDragStart(e, project.id)}
              onDragOver={(e) => handleDragOver(e, project.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, project.id)}
              onDragEnd={handleDragEnd}
              isDeletedTab={activeTab === 'deleted'}
            />
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <div className="text-slate-400 text-lg">
            {searchTerm || hasActiveFilters
              ? `No ${activeTab} projects found matching your filters`
              : `No ${activeTab} projects`}
          </div>
          <p className="text-slate-500 text-sm mt-2">
            {activeTab === 'upcoming'
              ? 'Projects with "on hold" status will appear here'
              : activeTab === 'completed'
              ? 'Completed projects will appear here'
              : activeTab === 'deleted'
              ? 'Deleted projects can be restored from here'
              : 'Create a new project to get started'}
          </p>
        </div>
      )}

      {/* Project Detail Modal with Animation */}
      {selectedProject && !selectedProject.isDeleted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-200">
          <div
            className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm"
            onClick={() => setSelectedProjectId(null)}
          />
          <div className="relative w-full max-w-6xl max-h-[90vh] mx-4 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <ProjectDetailModal
              project={selectedProject}
              onClose={() => setSelectedProjectId(null)}
            />
          </div>
        </div>
      )}

      {/* New Project Modal */}
      {showNewProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-200">
          <div
            className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm"
            onClick={() => setShowNewProjectModal(false)}
          />
          <div
            className="relative bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-6 w-full max-w-lg mx-4 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Create New Project</h2>
              <button
                onClick={() => setShowNewProjectModal(false)}
                className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Project Name */}
              <div>
                <label className="text-sm text-slate-400 block mb-2">Project Name *</label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  placeholder="Enter project name..."
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-primary-500"
                  autoFocus
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-sm text-slate-400 block mb-2">Description</label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  placeholder="Describe your project..."
                  rows={3}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-primary-500 resize-none"
                />
              </div>

              {/* Team and Manager Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-400 block mb-2">Team</label>
                  <select
                    value={newProject.team}
                    onChange={(e) => setNewProject({ ...newProject, team: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-primary-500"
                  >
                    <option value="">Select team...</option>
                    {teamOptions.map((team) => (
                      <option key={team} value={team}>
                        {team}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-slate-400 block mb-2">Manager</label>
                  <select
                    value={newProject.manager}
                    onChange={(e) => setNewProject({ ...newProject, manager: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-primary-500"
                  >
                    <option value="">Select manager...</option>
                    {managerOptions.map((manager) => (
                      <option key={manager} value={manager}>
                        {manager}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status, Priority and Risk Row */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm text-slate-400 block mb-2">Status</label>
                  <select
                    value={newProject.status}
                    onChange={(e) => setNewProject({ ...newProject, status: e.target.value as ProjectStatus })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-primary-500"
                  >
                    <option value="active">Active</option>
                    <option value="on_hold">On Hold (Upcoming)</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-slate-400 block mb-2">Priority</label>
                  <select
                    value={newProject.priority}
                    onChange={(e) => setNewProject({ ...newProject, priority: e.target.value as Priority })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-primary-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-slate-400 block mb-2">Risk Level</label>
                  <select
                    value={newProject.riskLevel}
                    onChange={(e) => setNewProject({ ...newProject, riskLevel: e.target.value as RiskLevel })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-primary-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              {/* Days Until Deadline */}
              <div>
                <label className="text-sm text-slate-400 block mb-2">
                  Days Until Deadline: {newProject.daysUntilDeadline} days
                </label>
                <input
                  type="range"
                  min="7"
                  max="365"
                  value={newProject.daysUntilDeadline}
                  onChange={(e) => setNewProject({ ...newProject, daysUntilDeadline: parseInt(e.target.value) })}
                  className="w-full accent-primary-500"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>1 week</span>
                  <span>Target: {formatDeadline(newProject.daysUntilDeadline)}</span>
                  <span>1 year</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700">
                <button
                  onClick={() => setShowNewProjectModal(false)}
                  className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateProject}
                  disabled={!newProject.name.trim()}
                  className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Create Project
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Soft Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center animate-in fade-in duration-150"
          onClick={() => setDeleteConfirmId(null)}
        >
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
          <div
            className="relative bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-6 w-80 max-w-[90vw] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center mb-4">
                <Archive size={24} className="text-yellow-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Move to Deleted</h3>
              <p className="text-slate-400 text-sm mb-6">
                Are you sure you want to delete{' '}
                <span className="text-white font-medium">
                  "{projects.find((p) => p.id === deleteConfirmId)?.name}"
                </span>
                ? You can restore it later from the Deleted Projects tab.
              </p>
              <div className="flex items-center gap-3 w-full">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSoftDelete(deleteConfirmId)}
                  className="flex-1 px-4 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Permanent Delete Confirmation Modal */}
      {permanentDeleteId && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center animate-in fade-in duration-150"
          onClick={() => setPermanentDeleteId(null)}
        >
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
          <div
            className="relative bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-6 w-80 max-w-[90vw] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
                <AlertTriangle size={24} className="text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Permanently Delete</h3>
              <p className="text-slate-400 text-sm mb-6">
                Are you sure you want to permanently delete{' '}
                <span className="text-white font-medium">
                  "{projects.find((p) => p.id === permanentDeleteId)?.name}"
                </span>
                ? This action cannot be undone.
              </p>
              <div className="flex items-center gap-3 w-full">
                <button
                  onClick={() => setPermanentDeleteId(null)}
                  className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handlePermanentDelete(permanentDeleteId)}
                  className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Delete Forever
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ProjectCard({
  project,
  formatDeadline,
  formatCompletedDate,
  onClick,
  onDelete,
  onRestore,
  onPermanentDelete,
  onMoveToUpcoming,
  onMoveToActive,
  isDragging,
  isDragOver,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  isDeletedTab,
}: {
  project: Project
  formatDeadline: (days: number) => string
  formatCompletedDate: (dateStr?: string) => string
  onClick: () => void
  onDelete: () => void
  onRestore: () => void
  onPermanentDelete: () => void
  onMoveToUpcoming: () => void
  onMoveToActive: () => void
  isDragging: boolean
  isDragOver: boolean
  onDragStart: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: () => void
  onDrop: (e: React.DragEvent) => void
  onDragEnd: () => void
  isDeletedTab: boolean
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

  if (isDeletedTab) {
    // Deleted project card - different styling and actions
    return (
      <div className="card border-red-500/20 bg-slate-800/30 relative group">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-slate-400 font-semibold text-lg truncate">{project.name}</h3>
            <p className="text-slate-500 text-sm mt-1 line-clamp-2">{project.description}</p>
          </div>
        </div>

        {/* Deleted info */}
        <div className="text-xs text-red-400 mb-4">
          Deleted {formatCompletedDate(project.deletedAt)}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onRestore()
            }}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg text-sm font-medium transition-colors"
          >
            <RotateCcw size={16} />
            Restore
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onPermanentDelete()
            }}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm font-medium transition-colors"
          >
            <Trash2 size={16} />
            Delete Forever
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={`card cursor-pointer hover:border-primary-500/50 hover:bg-slate-800/80 transition-all group relative ${
        isDragging ? 'opacity-50 scale-95 rotate-1' : ''
      } ${isDragOver ? 'border-primary-500 scale-[1.02] shadow-lg shadow-primary-500/20' : ''}`}
    >
      {/* Drag Handle */}
      <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing text-slate-500 hover:text-slate-300">
        <GripVertical size={16} />
      </div>

      {/* Action Buttons */}
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
        {/* Move to Upcoming/Active button */}
        {project.status === 'active' && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onMoveToUpcoming()
            }}
            className="p-1.5 hover:bg-yellow-500/20 rounded-lg text-slate-500 hover:text-yellow-400 transition-colors"
            title="Move to Upcoming"
          >
            <Clock size={16} />
          </button>
        )}
        {project.status === 'on_hold' && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onMoveToActive()
            }}
            className="p-1.5 hover:bg-green-500/20 rounded-lg text-slate-500 hover:text-green-400 transition-colors"
            title="Move to Active"
          >
            <MoveRight size={16} />
          </button>
        )}
        {/* Delete Button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="p-1.5 hover:bg-red-500/20 rounded-lg text-slate-500 hover:text-red-400 transition-colors"
          title="Delete project"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div onClick={onClick} className="pt-2">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0 pl-4">
            <h3 className="text-white font-semibold text-lg group-hover:text-primary-400 transition-colors truncate">
              {project.name}
            </h3>
            <p className="text-slate-400 text-sm mt-1 line-clamp-2">{project.description}</p>
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
              {project.status === 'completed' ? (
                `Completed ${formatCompletedDate(project.completedAt)}`
              ) : (
                <>
                  <span className="text-slate-500">Target Date:</span> {formatDeadline(project.daysUntilDeadline)}
                </>
              )}
            </span>
          </div>
          <div className="text-slate-500">{project.tasks.length} tasks</div>
        </div>

        {/* Manager & Team */}
        <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center justify-between text-xs text-slate-500">
          <span>Manager: {project.manager}</span>
          <span>{project.team}</span>
        </div>
      </div>
    </div>
  )
}
