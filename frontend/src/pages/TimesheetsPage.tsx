import { useState } from 'react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'

export default function TimesheetsPage() {
  const [currentWeek] = useState('Jan 13 - Jan 19, 2025')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Timesheets</h1>
          <p className="text-slate-400 mt-1">Track your time and productivity</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          Log Time
        </button>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <button className="btn-secondary p-2">
          <ChevronLeft size={18} />
        </button>
        <span className="text-lg font-medium text-white">{currentWeek}</span>
        <button className="btn-secondary p-2">
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Weekly Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-slate-400 text-sm">Total Hours</p>
          <p className="text-2xl font-bold text-white mt-1">32.5</p>
        </div>
        <div className="card">
          <p className="text-slate-400 text-sm">Billable Hours</p>
          <p className="text-2xl font-bold text-green-400 mt-1">28.0</p>
        </div>
        <div className="card">
          <p className="text-slate-400 text-sm">Status</p>
          <p className="text-2xl font-bold text-yellow-400 mt-1">Draft</p>
        </div>
      </div>

      {/* Time Entries */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-4">Time Entries</h2>
        <div className="space-y-3">
          <TimeEntry
            date="Mon, Jan 13"
            project="WAF/API Security"
            task="Configure WAF rules"
            hours={8}
          />
          <TimeEntry
            date="Tue, Jan 14"
            project="WAF/API Security"
            task="API gateway integration"
            hours={7.5}
          />
          <TimeEntry
            date="Wed, Jan 15"
            project="Cloud Migration"
            task="Architecture review"
            hours={6}
          />
          <TimeEntry
            date="Thu, Jan 16"
            project="WAF/API Security"
            task="Security testing"
            hours={8}
          />
          <TimeEntry
            date="Fri, Jan 17"
            project="Vulnerabilities"
            task="Patch deployment"
            hours={3}
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button className="btn-primary">Submit Timesheet</button>
      </div>
    </div>
  )
}

function TimeEntry({
  date,
  project,
  task,
  hours,
}: {
  date: string
  project: string
  task: string
  hours: number
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
      <div className="flex items-center gap-6">
        <span className="text-slate-400 w-24">{date}</span>
        <div>
          <p className="text-white font-medium">{project}</p>
          <p className="text-slate-400 text-sm">{task}</p>
        </div>
      </div>
      <span className="text-lg font-semibold text-white">{hours}h</span>
    </div>
  )
}
