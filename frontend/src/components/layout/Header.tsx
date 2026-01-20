import { Bell, Search, User, LogOut } from 'lucide-react'
import { useAuthStore } from '../../store/authSlice'

export default function Header() {
  const { user, logout } = useAuthStore()

  return (
    <header className="h-16 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-6">
      {/* Search */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <Search size={20} className="text-slate-400" />
        <input
          type="text"
          placeholder="Search projects, tasks..."
          className="input flex-1"
        />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors relative">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

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
