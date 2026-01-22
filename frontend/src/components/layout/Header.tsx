import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Search, User, LogOut, X, FolderOpen, CheckCircle2, Clock, AlertTriangle } from 'lucide-react'
import { useAuthStore } from '../../store/authSlice'
import { useProjectStore } from '../../store/projectSlice'

export default function Header() {
  const { user, logout } = useAuthStore()
  const { projects } = useProjectStore()
  const navigate = useNavigate()

  const [searchTerm, setSearchTerm] = useState('')
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const notificationRef = useRef<HTMLDivElement>(null)

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false)
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filter projects based on search term
  const searchResults = searchTerm.trim()
    ? projects.filter(
        (p) =>
          !p.isDeleted &&
          (p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.manager.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.team.toLowerCase().includes(searchTerm.toLowerCase()))
      ).slice(0, 5)
    : []

  // Generate notifications from projects
  const notifications = [
    ...projects
      .filter((p) => !p.isDeleted && p.status === 'active' && p.daysUntilDeadline <= 7)
      .map((p) => ({
        id: `deadline-${p.id}`,
        type: 'warning' as const,
        title: 'Deadline Approaching',
        message: `${p.name} is due in ${p.daysUntilDeadline} days`,
        time: 'Soon',
      })),
    ...projects
      .filter((p) => !p.isDeleted && p.status === 'active' && (p.riskLevel === 'high' || p.riskLevel === 'critical'))
      .map((p) => ({
        id: `risk-${p.id}`,
        type: 'alert' as const,
        title: 'High Risk Project',
        message: `${p.name} has ${p.riskLevel} risk level`,
        time: 'Active',
      })),
    ...projects
      .filter((p) => !p.isDeleted && p.status === 'completed' && p.completedAt)
      .slice(0, 2)
      .map((p) => ({
        id: `completed-${p.id}`,
        type: 'success' as const,
        title: 'Project Completed',
        message: `${p.name} was completed`,
        time: p.completedAt ? new Date(p.completedAt).toLocaleDateString() : '',
      })),
  ].slice(0, 5)

  const handleSearchSelect = () => {
    setSearchTerm('')
    setShowSearchResults(false)
    navigate('/projects')
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <FolderOpen size={14} className="text-green-400" />
      case 'completed':
        return <CheckCircle2 size={14} className="text-emerald-400" />
      case 'on_hold':
        return <Clock size={14} className="text-amber-400" />
      default:
        return <FolderOpen size={14} className="text-slate-400" />
    }
  }

  const getNotificationIcon = (type: 'warning' | 'alert' | 'success') => {
    switch (type) {
      case 'warning':
        return <Clock size={16} className="text-amber-400" />
      case 'alert':
        return <AlertTriangle size={16} className="text-red-400" />
      case 'success':
        return <CheckCircle2 size={16} className="text-emerald-400" />
    }
  }

  return (
    <header className="h-16 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-6">
      {/* Search */}
      <div ref={searchRef} className="relative flex items-center gap-3 flex-1 max-w-xl">
        <Search size={20} className="text-slate-400 absolute left-3 z-10" />
        <input
          type="text"
          placeholder="Search projects, tasks..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            setShowSearchResults(true)
          }}
          onFocus={() => setShowSearchResults(true)}
          className="input flex-1 pl-10"
        />
        {searchTerm && (
          <button
            onClick={() => {
              setSearchTerm('')
              setShowSearchResults(false)
            }}
            className="absolute right-3 p-1 hover:bg-slate-600 rounded text-slate-400 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        )}

        {/* Search Results Dropdown */}
        {showSearchResults && searchTerm && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-600 rounded-lg shadow-2xl overflow-hidden z-50">
            {searchResults.length > 0 ? (
              <div className="max-h-80 overflow-auto">
                <div className="px-3 py-2 text-xs text-slate-400 border-b border-slate-700">
                  {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
                </div>
                {searchResults.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => handleSearchSelect(project.id)}
                    className="w-full px-4 py-3 flex items-start gap-3 hover:bg-slate-700/50 transition-colors text-left"
                  >
                    <div className="mt-0.5">{getStatusIcon(project.status)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-medium truncate">{project.name}</div>
                      <div className="text-xs text-slate-400 truncate">{project.description}</div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                        <span>{project.team}</span>
                        <span>•</span>
                        <span>{project.manager}</span>
                        <span>•</span>
                        <span>{project.completionPercentage}% complete</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-4 py-6 text-center text-slate-400">
                No projects found for "{searchTerm}"
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <div ref={notificationRef} className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors relative"
          >
            <Bell size={20} />
            {notifications.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute top-full right-0 mt-2 w-80 bg-slate-800 border border-slate-600 rounded-lg shadow-2xl overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
                <span className="font-medium text-white">Notifications</span>
                {notifications.length > 0 && (
                  <span className="px-2 py-0.5 bg-primary-500/20 text-primary-400 rounded-full text-xs">
                    {notifications.length}
                  </span>
                )}
              </div>
              {notifications.length > 0 ? (
                <div className="max-h-80 overflow-auto">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="px-4 py-3 hover:bg-slate-700/50 transition-colors border-b border-slate-700/50 last:border-0"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">{getNotificationIcon(notification.type)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-white font-medium">{notification.title}</div>
                          <div className="text-xs text-slate-400 mt-0.5">{notification.message}</div>
                          <div className="text-xs text-slate-500 mt-1">{notification.time}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-8 text-center text-slate-400">
                  <Bell size={24} className="mx-auto mb-2 opacity-50" />
                  <div className="text-sm">No notifications</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center">
            <User size={16} className="text-white" />
          </div>
          {user && (
            <span className="text-sm text-slate-300">
              {user.firstName} {user.lastName}
            </span>
          )}
          <button
            onClick={logout}
            className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  )
}
