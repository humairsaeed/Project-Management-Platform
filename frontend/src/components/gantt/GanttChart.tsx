import { useState } from 'react'

interface GanttChartProps {
  projectId: string
}

// Mock data for development
const mockTasks = [
  {
    id: '1',
    title: 'WAF Rule Design',
    startDate: '2025-01-01',
    endDate: '2025-01-15',
    progress: 100,
    status: 'done',
  },
  {
    id: '2',
    title: 'API Inventory',
    startDate: '2025-01-05',
    endDate: '2025-01-12',
    progress: 100,
    status: 'done',
  },
  {
    id: '3',
    title: 'Test Environment Setup',
    startDate: '2025-01-10',
    endDate: '2025-01-17',
    progress: 100,
    status: 'done',
  },
  {
    id: '4',
    title: 'Production WAF Deployment',
    startDate: '2025-01-15',
    endDate: '2025-02-05',
    progress: 60,
    status: 'in_progress',
  },
  {
    id: '5',
    title: 'API Gateway Integration',
    startDate: '2025-01-20',
    endDate: '2025-02-10',
    progress: 30,
    status: 'in_progress',
  },
  {
    id: '6',
    title: 'Security Testing',
    startDate: '2025-02-01',
    endDate: '2025-02-15',
    progress: 0,
    status: 'todo',
  },
  {
    id: '7',
    title: 'Documentation',
    startDate: '2025-02-10',
    endDate: '2025-02-20',
    progress: 0,
    status: 'todo',
  },
]

const milestones = [
  { id: 'm1', name: 'Production Deployment', date: '2025-02-15' },
  { id: 'm2', name: 'Project Complete', date: '2025-03-05' },
]

export default function GanttChart({ projectId }: GanttChartProps) {
  const [zoomLevel] = useState<'day' | 'week' | 'month'>('week')

  // Generate weeks for header
  const weeks = [
    'Jan 6', 'Jan 13', 'Jan 20', 'Jan 27',
    'Feb 3', 'Feb 10', 'Feb 17', 'Feb 24',
    'Mar 3',
  ]

  return (
    <div className="card h-full overflow-auto">
      <div className="min-w-[900px]">
        {/* Timeline Header */}
        <div className="flex border-b border-slate-700">
          <div className="w-64 shrink-0 p-3 font-medium text-slate-300">Task</div>
          <div className="flex-1 flex">
            {weeks.map((week) => (
              <div
                key={week}
                className="flex-1 p-3 text-center text-sm text-slate-400 border-l border-slate-700"
              >
                {week}
              </div>
            ))}
          </div>
        </div>

        {/* Tasks */}
        <div className="divide-y divide-slate-700/50">
          {mockTasks.map((task) => (
            <GanttRow key={task.id} task={task} weeks={weeks} />
          ))}
        </div>

        {/* Milestones */}
        <div className="mt-4 pt-4 border-t border-slate-700">
          <div className="text-sm font-medium text-slate-400 mb-2 px-3">Milestones</div>
          {milestones.map((milestone) => (
            <div key={milestone.id} className="flex items-center py-2 px-3">
              <div className="w-64 shrink-0 text-white">{milestone.name}</div>
              <div className="flex-1 relative h-6">
                <div
                  className="absolute w-4 h-4 bg-primary-500 transform rotate-45 top-1"
                  style={{ left: `${getMilestonePosition(milestone.date, weeks)}%` }}
                  title={milestone.date}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function GanttRow({
  task,
  weeks,
}: {
  task: {
    id: string
    title: string
    startDate: string
    endDate: string
    progress: number
    status: string
  }
  weeks: string[]
}) {
  const { left, width } = getTaskPosition(task.startDate, task.endDate, weeks)

  const statusColors: Record<string, string> = {
    done: 'bg-green-500',
    in_progress: 'bg-primary-500',
    todo: 'bg-slate-500',
  }

  return (
    <div className="flex items-center h-12 hover:bg-slate-700/30">
      <div className="w-64 shrink-0 px-3 text-sm text-white truncate">{task.title}</div>
      <div className="flex-1 relative h-full flex items-center px-2">
        {/* Background grid */}
        <div className="absolute inset-0 flex">
          {weeks.map((_, i) => (
            <div key={i} className="flex-1 border-l border-slate-700/30" />
          ))}
        </div>

        {/* Task bar */}
        <div
          className={`absolute h-6 rounded ${statusColors[task.status]} opacity-80`}
          style={{ left: `${left}%`, width: `${width}%` }}
        >
          {/* Progress fill */}
          {task.progress > 0 && task.progress < 100 && (
            <div
              className="h-full bg-white/20 rounded-l"
              style={{ width: `${task.progress}%` }}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function getTaskPosition(
  startDate: string,
  endDate: string,
  weeks: string[]
): { left: number; width: number } {
  // Simplified calculation for demo
  const start = new Date(startDate)
  const end = new Date(endDate)
  const totalDays = weeks.length * 7

  const startOffset = Math.floor((start.getTime() - new Date('2025-01-06').getTime()) / (1000 * 60 * 60 * 24))
  const duration = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))

  return {
    left: Math.max(0, (startOffset / totalDays) * 100),
    width: Math.min(100 - (startOffset / totalDays) * 100, (duration / totalDays) * 100),
  }
}

function getMilestonePosition(date: string, weeks: string[]): number {
  const milestoneDate = new Date(date)
  const totalDays = weeks.length * 7
  const offset = Math.floor((milestoneDate.getTime() - new Date('2025-01-06').getTime()) / (1000 * 60 * 60 * 24))
  return (offset / totalDays) * 100
}
