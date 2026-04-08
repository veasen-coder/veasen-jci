'use client'

import { useState, useEffect, useRef } from 'react'
import type { ActivityLogEntryWithActor, TaskWithMember } from '@/lib/supabase/types'
import { MemberAvatar } from '@/components/shared/MemberAvatar'
import { isOverdue, isDueSoon, formatDueDate } from '@/lib/utils/dateHelpers'
import { Bell, X, MessageSquare, ArrowRightLeft, Shield, Plus, AlertTriangle, Clock } from 'lucide-react'

interface DueAlert {
  id: string
  task: TaskWithMember
  type: 'overdue' | 'due_soon'
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })
}

function getActionDescription(entry: ActivityLogEntryWithActor): { icon: typeof Bell; text: string; color: string } {
  const meta = entry.metadata as Record<string, string> | null
  const title = meta?.task_title || 'a task'

  switch (entry.action) {
    case 'status_change':
      return {
        icon: ArrowRightLeft,
        text: `changed "${title}" from ${meta?.old_status} to ${meta?.new_status}`,
        color: 'text-blue-500',
      }
    case 'qc_request':
      return {
        icon: Shield,
        text: `requested QC for "${title}"`,
        color: 'text-violet-500',
      }
    case 'comment_added':
      return {
        icon: MessageSquare,
        text: `commented on a task`,
        color: 'text-green-500',
      }
    case 'task_created':
      return {
        icon: Plus,
        text: `created "${title}"`,
        color: 'text-teal-500',
      }
    default:
      return {
        icon: Bell,
        text: entry.action,
        color: 'text-muted-foreground',
      }
  }
}

export function ActivityFeed() {
  const [open, setOpen] = useState(false)
  const [activeSection, setActiveSection] = useState<'alerts' | 'activity'>('alerts')
  const [entries, setEntries] = useState<ActivityLogEntryWithActor[]>([])
  const [dueAlerts, setDueAlerts] = useState<DueAlert[]>([])
  const [loading, setLoading] = useState(false)
  const [hasNew, setHasNew] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const fetchActivity = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/activity')
      if (!res.ok) throw new Error()
      const data = await res.json()
      if (Array.isArray(data)) setEntries(data)
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  const fetchDueAlerts = async () => {
    try {
      const res = await fetch('/api/tasks')
      if (!res.ok) return
      const tasks: TaskWithMember[] = await res.json()

      const alerts: DueAlert[] = []
      for (const task of tasks) {
        if (task.status === 'done' || !task.due_date) continue
        if (isOverdue(task.due_date)) {
          alerts.push({ id: `overdue-${task.id}`, task, type: 'overdue' })
        } else if (isDueSoon(task.due_date)) {
          alerts.push({ id: `due-${task.id}`, task, type: 'due_soon' })
        }
      }
      // Sort: overdue first, then due soon
      alerts.sort((a, b) => {
        if (a.type !== b.type) return a.type === 'overdue' ? -1 : 1
        return (a.task.due_date || '').localeCompare(b.task.due_date || '')
      })
      setDueAlerts(alerts)
      if (alerts.length > 0) setHasNew(true)
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    fetchDueAlerts()
    // Poll for new activity every 30s
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/activity')
        if (!res.ok) return
        const data = await res.json()
        if (Array.isArray(data) && data.length > entries.length) {
          setHasNew(true)
          setEntries(data)
        }
      } catch {
        // ignore
      }
      // Also refresh due alerts
      fetchDueAlerts()
    }, 30000)
    return () => clearInterval(interval)
  }, [entries.length])

  useEffect(() => {
    if (open) {
      fetchActivity()
      fetchDueAlerts()
      setHasNew(false)
    }
  }, [open])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const alertCount = dueAlerts.length

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-accent transition-colors"
      >
        <Bell className="h-4 w-4 text-muted-foreground" />
        {(hasNew || alertCount > 0) && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1">
            {alertCount > 0 ? alertCount : ''}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 max-h-[70vh] rounded-xl border border-border bg-card shadow-xl z-50 overflow-hidden">
          {/* Header with tabs */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/20">
            <div className="flex gap-1">
              <button
                onClick={() => setActiveSection('alerts')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  activeSection === 'alerts'
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Alerts {alertCount > 0 && `(${alertCount})`}
              </button>
              <button
                onClick={() => setActiveSection('activity')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  activeSection === 'activity'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Activity
              </button>
            </div>
            <button onClick={() => setOpen(false)}>
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          <div className="overflow-y-auto max-h-[60vh]">
            {/* Alerts Section */}
            {activeSection === 'alerts' && (
              <>
                {dueAlerts.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <AlertTriangle className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">No due date alerts</p>
                    <p className="text-[10px] text-muted-foreground mt-1">All tasks are on track!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {dueAlerts.map((alert) => {
                      const isOD = alert.type === 'overdue'
                      return (
                        <div
                          key={alert.id}
                          className={`flex items-start gap-3 px-4 py-3 ${
                            isOD ? 'bg-red-50/50 dark:bg-red-950/20' : 'bg-orange-50/50 dark:bg-orange-950/20'
                          }`}
                        >
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                              isOD
                                ? 'bg-red-100 dark:bg-red-900/40'
                                : 'bg-orange-100 dark:bg-orange-900/40'
                            }`}
                          >
                            {isOD ? (
                              <AlertTriangle className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                            ) : (
                              <Clock className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{alert.task.title}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span
                                className={`text-[10px] font-bold uppercase ${
                                  isOD ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'
                                }`}
                              >
                                {isOD ? 'Overdue' : 'Due Soon'}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {formatDueDate(alert.task.due_date)}
                              </span>
                            </div>
                            {alert.task.member && (
                              <div className="flex items-center gap-1.5 mt-1">
                                <MemberAvatar member={alert.task.member} size="xs" />
                                <span className="text-[10px] text-muted-foreground">
                                  {alert.task.member.name}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            )}

            {/* Activity Section */}
            {activeSection === 'activity' && (
              <>
                {loading && entries.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <p className="text-xs text-muted-foreground">Loading...</p>
                  </div>
                ) : entries.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <Bell className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">No activity yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {entries.map((entry) => {
                      const action = getActionDescription(entry)
                      const Icon = action.icon

                      return (
                        <div key={entry.id} className="flex items-start gap-3 px-4 py-3 hover:bg-accent/30 transition-colors">
                          {entry.actor ? (
                            <MemberAvatar member={entry.actor} size="sm" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                              <Icon className={`h-3.5 w-3.5 ${action.color}`} />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs">
                              <span className="font-medium">{entry.actor?.name || 'System'}</span>{' '}
                              <span className="text-muted-foreground">{action.text}</span>
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {timeAgo(entry.created_at)}
                            </p>
                          </div>
                          <Icon className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${action.color}`} />
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
