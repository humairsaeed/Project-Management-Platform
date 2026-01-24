import { useState } from 'react'
import { Shield, Users, Activity } from 'lucide-react'
import RoleManager from '../components/settings/RoleManager'
import UserRoleAssignment from '../components/settings/UserRoleAssignment'
import AuditTrail from '../components/common/AuditTrail'
import { useAuthStore } from '../store/authSlice'

type SettingsTab = 'roles' | 'users' | 'audit'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('roles')
  const user = useAuthStore((state) => state.user)

  // Check if user has admin permissions
  const isAdmin = user?.roles?.includes('admin') ?? false

  const tabs = [
    { id: 'roles' as const, label: 'Role Management', icon: Shield },
    { id: 'users' as const, label: 'User Permissions', icon: Users },
    { id: 'audit' as const, label: 'Audit Trail', icon: Activity },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 mt-1">Manage roles, permissions, and view audit logs</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-slate-700">
        <nav className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="card">
        {activeTab === 'roles' && <RoleManager isAdmin={isAdmin} />}
        {activeTab === 'users' && <UserRoleAssignment isAdmin={isAdmin} />}
        {activeTab === 'audit' && <AuditTrail />}
      </div>
    </div>
  )
}
