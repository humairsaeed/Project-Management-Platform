import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  FolderKanban,
  Settings,
  ChevronLeft,
  ChevronRight,
  Users,
  CheckSquare,
} from 'lucide-react'
import { useUIStore } from '../../store/uiSlice'
import { useAuthStore } from '../../store/authSlice'

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'project_manager', 'contributor'] },
  { path: '/projects', label: 'Projects', icon: FolderKanban, roles: ['admin', 'project_manager', 'contributor'] },
  { path: '/team', label: 'Team', icon: Users, roles: ['admin'] },
  { path: '/settings', label: 'Settings', icon: Settings, roles: ['admin'] },
]

export default function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useUIStore()
  const { hasRole } = useAuthStore()

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-slate-800 border-r border-slate-700 transition-all duration-300 z-40 ${
        sidebarOpen ? 'w-64' : 'w-20'
      }`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-700">
        {sidebarOpen && (
          <span className="text-xl font-bold text-white">PM Platform</span>
        )}
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {navItems
          .filter((item) => item.roles.some((role) => hasRole(role)))
          .map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary-600 text-white'
                    : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                }`
              }
            >
              <item.icon size={20} />
              {sidebarOpen && <span>{item.label}</span>}
            </NavLink>
          ))}

        {/* My Tasks - Only for Contributors and Project Managers */}
        {(hasRole('contributor') || hasRole('project_manager')) && (
          <>
            {sidebarOpen && (
              <div className="pt-4 pb-2 px-4 text-xs font-semibold text-slate-500 uppercase">
                My Work
              </div>
            )}
            <NavLink
              to="/my-tasks"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary-600 text-white'
                    : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                }`
              }
            >
              <CheckSquare size={20} />
              {sidebarOpen && <span>My Tasks</span>}
            </NavLink>
          </>
        )}
      </nav>
    </aside>
  )
}
