import { useState } from 'react'
import { Clock, User, FileText, ArrowRight, Filter, ChevronDown, ChevronUp } from 'lucide-react'

interface AuditLogEntry {
  id: string
  userId: string
  userEmail: string
  userName: string
  tableName: string
  recordId: string
  recordName: string
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE'
  oldValue: Record<string, unknown> | null
  newValue: Record<string, unknown> | null
  changedFields: string[]
  createdAt: string
}

const mockAuditLogs: AuditLogEntry[] = [
  {
    id: '1',
    userId: '1',
    userEmail: 'john.smith@company.com',
    userName: 'John Smith',
    tableName: 'projects.tasks',
    recordId: 'task-1',
    recordName: 'Configure WAF rules',
    action: 'STATUS_CHANGE',
    oldValue: { status: 'in_progress', completion_percentage: 50 },
    newValue: { status: 'done', completion_percentage: 100 },
    changedFields: ['status', 'completion_percentage'],
    createdAt: '2025-01-20T14:30:00Z',
  },
  {
    id: '2',
    userId: '2',
    userEmail: 'sarah.jones@company.com',
    userName: 'Sarah Jones',
    tableName: 'projects.tasks',
    recordId: 'task-2',
    recordName: 'API Gateway Integration',
    action: 'UPDATE',
    oldValue: { assigned_to: 'Mike Wilson', estimated_hours: 20 },
    newValue: { assigned_to: 'Emily Chen', estimated_hours: 24 },
    changedFields: ['assigned_to', 'estimated_hours'],
    createdAt: '2025-01-20T13:15:00Z',
  },
  {
    id: '3',
    userId: '1',
    userEmail: 'john.smith@company.com',
    userName: 'John Smith',
    tableName: 'projects.milestones',
    recordId: 'milestone-1',
    recordName: 'Production Deployment',
    action: 'STATUS_CHANGE',
    oldValue: { status: 'pending' },
    newValue: { status: 'achieved' },
    changedFields: ['status'],
    createdAt: '2025-01-20T11:00:00Z',
  },
  {
    id: '4',
    userId: '3',
    userEmail: 'mike.wilson@company.com',
    userName: 'Mike Wilson',
    tableName: 'projects.tasks',
    recordId: 'task-3',
    recordName: 'Security Testing Plan',
    action: 'CREATE',
    oldValue: null,
    newValue: { title: 'Security Testing Plan', status: 'todo', estimated_hours: 16 },
    changedFields: [],
    createdAt: '2025-01-20T09:45:00Z',
  },
  {
    id: '5',
    userId: '2',
    userEmail: 'sarah.jones@company.com',
    userName: 'Sarah Jones',
    tableName: 'projects.projects',
    recordId: 'project-1',
    recordName: 'WAF/API Security',
    action: 'UPDATE',
    oldValue: { completion_percentage: 60 },
    newValue: { completion_percentage: 65 },
    changedFields: ['completion_percentage'],
    createdAt: '2025-01-19T16:30:00Z',
  },
]

interface Props {
  recordId?: string
  tableName?: string
}

export default function AuditTrail({ recordId, tableName }: Props) {
  const [logs] = useState<AuditLogEntry[]>(
    recordId && tableName
      ? mockAuditLogs.filter((log) => log.recordId === recordId && log.tableName === tableName)
      : mockAuditLogs
  )
  const [expandedLog, setExpandedLog] = useState<string | null>(null)
  const [actionFilter, setActionFilter] = useState<string>('all')

  const filteredLogs = logs.filter(
    (log) => actionFilter === 'all' || log.action === actionFilter
  )

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'bg-green-500/20 text-green-400'
      case 'UPDATE':
        return 'bg-blue-500/20 text-blue-400'
      case 'DELETE':
        return 'bg-red-500/20 text-red-400'
      case 'STATUS_CHANGE':
        return 'bg-yellow-500/20 text-yellow-400'
      default:
        return 'bg-slate-500/20 text-slate-400'
    }
  }

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'STATUS_CHANGE':
        return 'Status Changed'
      default:
        return action.charAt(0) + action.slice(1).toLowerCase()
    }
  }

  const getTableLabel = (tableName: string) => {
    const parts = tableName.split('.')
    return parts[parts.length - 1].charAt(0).toUpperCase() + parts[parts.length - 1].slice(1)
  }

  return (
    <div className="space-y-6">
      {!recordId && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Audit Trail</h2>
            <p className="text-sm text-slate-400">Track all changes made in the system</p>
          </div>
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-400" />
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-sm text-white focus:outline-none focus:border-primary-500"
            >
              <option value="all">All Actions</option>
              <option value="CREATE">Created</option>
              <option value="UPDATE">Updated</option>
              <option value="DELETE">Deleted</option>
              <option value="STATUS_CHANGE">Status Changes</option>
            </select>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {filteredLogs.map((log) => (
          <div
            key={log.id}
            className="bg-slate-800/50 rounded-lg border border-slate-700 overflow-hidden"
          >
            <div
              className="p-4 cursor-pointer hover:bg-slate-800/80 transition-colors"
              onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-slate-700">
                    <FileText size={16} className="text-slate-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getActionColor(log.action)}`}>
                        {getActionLabel(log.action)}
                      </span>
                      <span className="text-slate-400 text-xs">{getTableLabel(log.tableName)}</span>
                    </div>
                    <div className="mt-1 text-white font-medium">{log.recordName}</div>
                    <div className="mt-1 flex items-center gap-2 text-sm text-slate-400">
                      <User size={14} />
                      {log.userName}
                      <span className="text-slate-600">•</span>
                      <Clock size={14} />
                      {formatDate(log.createdAt)}
                    </div>
                  </div>
                </div>
                {expandedLog === log.id ? (
                  <ChevronUp size={20} className="text-slate-400" />
                ) : (
                  <ChevronDown size={20} className="text-slate-400" />
                )}
              </div>
            </div>

            {/* Expanded Details */}
            {expandedLog === log.id && (
              <div className="px-4 pb-4 border-t border-slate-700 pt-4">
                {log.changedFields.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm text-slate-400 font-medium">Changes:</div>
                    {log.changedFields.map((field) => (
                      <div
                        key={field}
                        className="flex items-center gap-3 text-sm bg-slate-900/50 rounded p-2"
                      >
                        <span className="text-slate-400 capitalize min-w-[120px]">
                          {field.replace(/_/g, ' ')}:
                        </span>
                        <span className="text-red-400 line-through">
                          {log.oldValue?.[field]?.toString() || 'N/A'}
                        </span>
                        <ArrowRight size={14} className="text-slate-500" />
                        <span className="text-green-400">
                          {log.newValue?.[field]?.toString() || 'N/A'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {log.action === 'CREATE' && log.newValue && (
                  <div className="space-y-2">
                    <div className="text-sm text-slate-400 font-medium">Created with:</div>
                    <div className="bg-slate-900/50 rounded p-3 text-sm">
                      <pre className="text-green-400 whitespace-pre-wrap">
                        {JSON.stringify(log.newValue, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {log.action === 'DELETE' && log.oldValue && (
                  <div className="space-y-2">
                    <div className="text-sm text-slate-400 font-medium">Deleted record:</div>
                    <div className="bg-slate-900/50 rounded p-3 text-sm">
                      <pre className="text-red-400 whitespace-pre-wrap">
                        {JSON.stringify(log.oldValue, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredLogs.length === 0 && (
        <div className="text-center py-8 text-slate-400">No audit logs found</div>
      )}
    </div>
  )
}
