'use client'

import { useState, useEffect, useRef } from 'react'
import type { ActivityLogEntryWithActor } from '@/lib/supabase/types'
import { MemberAvatar } from '@/components/shared/MemberAvatar'
import { Bell, X, MessageSquare, ArrowRightLeft, Shield, Plus } from 'lucide-react'

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
  const [entries, setEntries] = useState<ActivityLogEntryWithActor[]>([])
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

  useEffect(() => {
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
    }, 30000)
    return () => clearInterval(interval)
  }, [entries.length])

  useEffect(() => {
    if (open) {
      fetchActivity()
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

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-accent transition-colors"
      >
        <Bell className="h-4 w-4 text-muted-foreground" />
        {hasNew && (
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 max-h-[70vh] rounded-xl border border-border bg-card shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/20">
            <h3 className="text-sm font-semibold">Activity</h3>
            <button onClick={() => setOpen(false)}>
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          <div className="overflow-y-auto max-h-[60vh]">
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
          </div>
        </div>
      )}
    </div>
  )
}
