import { CheckCircle, Circle, Calendar } from 'lucide-react'

interface Milestone {
  id: string
  name: string
  projectName: string
  status?: 'achieved' | 'upcoming' | 'missed'
  targetDate?: string
}

interface MilestoneTimelineProps {
  recentMilestones: Milestone[]
  upcomingMilestones: Milestone[]
}

export default function MilestoneTimeline({
  recentMilestones,
  upcomingMilestones,
}: MilestoneTimelineProps) {
  return (
    <div className="space-y-6">
      {/* Recent Milestones */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <CheckCircle size={20} className="text-green-400" />
          Recent Achievements
        </h2>
        <div className="space-y-3">
          {recentMilestones.map((milestone) => (
            <div
              key={milestone.id}
              className="flex items-center gap-3 p-3 bg-green-500/5 rounded-lg border border-green-500/10"
            >
              <CheckCircle size={16} className="text-green-400 shrink-0" />
              <div className="flex-1">
                <p className="text-white font-medium">{milestone.name}</p>
                <p className="text-slate-400 text-sm">{milestone.projectName}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Milestones */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Calendar size={20} className="text-primary-400" />
          Upcoming Milestones
        </h2>
        <div className="space-y-3">
          {upcomingMilestones.map((milestone) => (
            <div
              key={milestone.id}
              className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg"
            >
              <Circle size={16} className="text-primary-400 shrink-0" />
              <div className="flex-1">
                <p className="text-white font-medium">{milestone.name}</p>
                <p className="text-slate-400 text-sm">{milestone.projectName}</p>
              </div>
              {milestone.targetDate && (
                <span className="text-sm text-slate-400">{milestone.targetDate}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
