import { useMemo } from 'react'
import { Activity, User as UserIcon, Clock } from 'lucide-react'
import { useTeamStore } from '../../store/teamSlice'
import { useProjectStore } from '../../store/projectSlice'
import Avatar from '../common/Avatar'

export default function UserActivityAnalytics() {
  const { users } = useTeamStore()
  const { projects } = useProjectStore()

  // Calculate user activity scores based on login history and task assignments
  const userActivityData = useMemo(() => {
    return users
      .filter((user) => user.status === 'active')
      .map((user) => {
        const userName = `${user.firstName} ${user.lastName}`

        // Count tasks assigned to this user
        let assignedTasks = 0
        let completedTasks = 0
        let inProgressTasks = 0

        projects.forEach((project) => {
          if (!project.isDeleted) {
            project.tasks.forEach((task) => {
              const isAssigned = task.assignees.some(
                (assignee: string) => assignee.toLowerCase() === userName.toLowerCase()
              )
              if (isAssigned) {
                assignedTasks++
                if (task.status === 'done') completedTasks++
                else if (task.status === 'in_progress') inProgressTasks++
              }
            })
          }
        })

        // Count logins in last 7 days
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        const recentLogins = (user.loginHistory || []).filter(
          (login) => new Date(login.timestamp) >= sevenDaysAgo
        ).length

        // Calculate activity score (0-100)
        const loginScore = Math.min(recentLogins * 10, 40) // Max 40 points for logins
        const taskScore = Math.min(assignedTasks * 2, 30) // Max 30 points for task count
        const completionScore = assignedTasks > 0 ? (completedTasks / assignedTasks) * 30 : 0 // Max 30 points for completion rate
        const activityScore = Math.round(loginScore + taskScore + completionScore)

        return {
          user,
          userName,
          assignedTasks,
          completedTasks,
          inProgressTasks,
          recentLogins,
          activityScore,
          lastLoginDate: user.loginHistory && user.loginHistory.length > 0
            ? new Date(user.loginHistory[user.loginHistory.length - 1].timestamp)
            : null,
        }
      })
      .sort((a, b) => b.activityScore - a.activityScore)
  }, [users, projects])

  const getActivityLevel = (score: number) => {
    if (score >= 70) return { label: 'Very Active', color: 'text-green-400', bg: 'bg-green-500/20' }
    if (score >= 40) return { label: 'Active', color: 'text-blue-400', bg: 'bg-blue-500/20' }
    if (score >= 20) return { label: 'Moderate', color: 'text-amber-400', bg: 'bg-amber-500/20' }
    return { label: 'Low Activity', color: 'text-slate-400', bg: 'bg-slate-500/20' }
  }

  const getLastLoginText = (lastLogin: Date | null) => {
    if (!lastLogin) return 'Never logged in'

    const now = new Date()
    const diffMs = now.getTime() - lastLogin.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 5) return 'Just now'
    if (diffMins < 60) return `${diffMins} min ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return lastLogin.toLocaleDateString()
  }

  const totalActiveUsers = userActivityData.length
  const veryActiveUsers = userActivityData.filter((u) => u.activityScore >= 70).length
  const averageScore = totalActiveUsers > 0
    ? Math.round(userActivityData.reduce((sum, u) => sum + u.activityScore, 0) / totalActiveUsers)
    : 0

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary-500/20">
            <Activity size={18} className="text-primary-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">User Activity Analytics</h3>
            <p className="text-xs text-slate-400">Login history and task engagement</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="text-center">
            <div className="text-slate-400">Avg Score</div>
            <div className="text-xl font-bold text-white">{averageScore}</div>
          </div>
          <div className="text-center">
            <div className="text-slate-400">Very Active</div>
            <div className="text-xl font-bold text-green-400">{veryActiveUsers}</div>
          </div>
        </div>
      </div>

      {/* User Activity List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {userActivityData.map((data) => {
          const activity = getActivityLevel(data.activityScore)

          return (
            <div
              key={data.user.id}
              className="p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Avatar name={data.userName} size="md" imageUrl={data.user.avatarUrl} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-white font-medium">{data.userName}</h4>
                      <span className={`px-2 py-0.5 rounded text-xs ${activity.bg} ${activity.color}`}>
                        {activity.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-400 text-xs">
                      <Clock size={12} />
                      {getLastLoginText(data.lastLoginDate)}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400">Tasks:</span>
                      <span className="ml-1 text-white font-medium">{data.assignedTasks}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Completed:</span>
                      <span className="ml-1 text-green-400 font-medium">{data.completedTasks}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Logins (7d):</span>
                      <span className="ml-1 text-primary-400 font-medium">{data.recentLogins}</span>
                    </div>
                  </div>

                  {/* Activity Score Bar */}
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-400">Activity Score</span>
                      <span className="text-white font-medium">{data.activityScore}%</span>
                    </div>
                    <div className="h-2 bg-slate-600 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          data.activityScore >= 70
                            ? 'bg-green-500'
                            : data.activityScore >= 40
                            ? 'bg-blue-500'
                            : data.activityScore >= 20
                            ? 'bg-amber-500'
                            : 'bg-slate-500'
                        }`}
                        style={{ width: `${data.activityScore}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {userActivityData.length === 0 && (
        <div className="text-center py-8 text-slate-400">
          <UserIcon size={48} className="mx-auto mb-2 opacity-50" />
          <p>No active users found</p>
        </div>
      )}
    </div>
  )
}
