'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import type { TaskWithMember, Member, Event } from '@/lib/supabase/types'
import { Skeleton } from '@/components/ui/skeleton'
import { MemberAvatar } from '@/components/shared/MemberAvatar'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { PriorityBadge } from '@/components/shared/PriorityBadge'
import { getTaskCounts, getMemberStats, getDoneThisWeek, filterByMember, filterOverdue } from '@/lib/utils/taskHelpers'
import { formatDueDate, isOverdue, formatDateKL } from '@/lib/utils/dateHelpers'
import { Loader2, AlertTriangle, CheckCircle2, Clock, Calendar, Image as ImageIcon, Shield } from 'lucide-react'

interface OverviewTabProps {
  tasks: TaskWithMember[]
  members: Member[]
  loading: boolean
}

export function OverviewTab({ tasks, members, loading }: OverviewTabProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const [events, setEvents] = useState<Event[]>([])

  useEffect(() => {
    fetch('/api/events')
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setEvents(data) })
      .catch(() => {})
  }, [])

  if (loading) {
    return <OverviewSkeleton />
  }

  const counts = getTaskCounts(tasks)
  const doneThisWeek = getDoneThisWeek(tasks)
  const overdueCount = filterOverdue(tasks).length

  const metrics = [
    { label: 'In Progress', value: counts.inProgress, icon: Loader2, color: 'text-blue-600', tab: 'boards' },
    { label: 'Blockers', value: counts.blocked, icon: AlertTriangle, color: 'text-red-600', tab: 'boards' },
    { label: 'Overdue', value: overdueCount, icon: Clock, color: 'text-amber-600', tab: 'boards' },
    { label: 'Done This Week', value: doneThisWeek.length, icon: CheckCircle2, color: 'text-green-600', tab: 'summary' },
  ]

  const navigateToTab = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tab)
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const navigateToBoard = (memberId: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', 'boards')
    params.set('member', memberId)
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  // Upcoming dates: tasks + events in the next 14 days
  const today = new Date().toISOString().split('T')[0]
  const in14Days = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const upcomingItems: { date: string; title: string; type: 'task' | 'event'; status: string; member?: Member; id: string }[] = []

  tasks.forEach((t) => {
    if (t.due_date && t.due_date >= today && t.due_date <= in14Days && t.status !== 'done') {
      upcomingItems.push({
        date: t.due_date,
        title: t.title,
        type: 'task',
        status: t.status,
        member: t.member,
        id: t.id,
      })
    }
  })

  events.forEach((e) => {
    if (e.event_date >= today && e.event_date <= in14Days) {
      upcomingItems.push({
        date: e.event_date,
        title: e.title,
        type: 'event',
        status: e.status,
        id: e.id,
      })
    }
  })

  upcomingItems.sort((a, b) => a.date.localeCompare(b.date))

  // Upcoming events (next 3 non-completed)
  const upcomingEvents = events
    .filter((e) => e.event_date >= today && e.status !== 'completed')
    .slice(0, 3)

  return (
    <div className="space-y-6">
      {/* Metric Cards — 4 cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <button
            key={metric.label}
            onClick={() => navigateToTab(metric.tab)}
            className="rounded-xl border border-border bg-card p-4 text-left transition-all duration-150 cursor-pointer hover:border-border/80 hover:bg-accent/50"
          >
            <div className="flex items-center gap-2 mb-2">
              <metric.icon className={`h-4 w-4 ${metric.color}`} />
              <span className="text-sm text-muted-foreground">{metric.label}</span>
            </div>
            <p className={`text-2xl font-medium ${metric.color}`}>{metric.value}</p>
          </button>
        ))}
      </div>

      {/* Team Workload */}
      <section>
        <h2 className="text-sm font-semibold mb-4 text-foreground uppercase tracking-wide">
          Team Workload
        </h2>
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          {[...members].sort((a, b) => {
            const sa = getMemberStats(tasks, a)
            const sb = getMemberStats(tasks, b)
            return sb.active - sa.active
          }).map((member) => {
            const stats = getMemberStats(tasks, member)
            const isInactive = stats.active === 0 && stats.total === 0

            return (
              <div key={member.id} className={`flex items-center gap-4 ${isInactive ? 'opacity-40' : ''}`}>
                <div className="flex items-center gap-3 w-48 shrink-0">
                  <MemberAvatar member={member} size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{member.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{member.role}</p>
                  </div>
                </div>
                <div className="flex-1 flex items-center gap-3">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden flex">
                    {stats.donePercent > 0 && (
                      <div className="h-full bg-green-500 transition-all duration-300" style={{ width: `${stats.donePercent}%` }} />
                    )}
                    {stats.inProgressPercent > 0 && (
                      <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${stats.inProgressPercent}%` }} />
                    )}
                    {stats.blockedPercent > 0 && (
                      <div className="h-full bg-red-400 transition-all duration-300" style={{ width: `${stats.blockedPercent}%` }} />
                    )}
                  </div>
                  {stats.blocked > 0 && (
                    <span className="bg-red-200 text-red-900 rounded-md text-xs font-medium px-2 py-0.5 shrink-0">
                      {stats.blocked} blocked
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                  {stats.done}/{stats.total} done &middot; {stats.active} active
                </span>
              </div>
            )
          })}
        </div>
      </section>

      {/* Upcoming Dates Timeline */}
      {upcomingItems.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold mb-4 text-foreground uppercase tracking-wide">
            Upcoming Dates (Next 14 Days)
          </h2>
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            {upcomingItems.slice(0, 10).map((item) => (
              <div key={`${item.type}-${item.id}`} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-20 shrink-0">
                  {formatDateKL(item.date + 'T00:00:00', 'dd MMM')}
                </span>
                <span className={`shrink-0 rounded-md text-[10px] font-bold px-1.5 py-0.5 uppercase ${
                  item.type === 'event'
                    ? 'bg-violet-100 text-violet-700'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {item.type}
                </span>
                <span className="text-sm truncate flex-1">{item.title}</span>
                {item.member && <MemberAvatar member={item.member} size="sm" />}
                <span className={`shrink-0 rounded-md text-xs font-medium px-2 py-0.5 ${
                  item.status === 'blocked' ? 'bg-red-100 text-red-700' :
                  item.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                  item.status === 'planning' ? 'bg-amber-100 text-amber-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {item.status}
                </span>
              </div>
            ))}
            {upcomingItems.length > 10 && (
              <p className="text-xs text-muted-foreground text-center pt-1">
                +{upcomingItems.length - 10} more items
              </p>
            )}
          </div>
        </section>
      )}

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold mb-4 text-foreground uppercase tracking-wide">
            Upcoming Events
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {upcomingEvents.map((event) => (
              <button
                key={event.id}
                onClick={() => navigateToTab('events')}
                className="shrink-0 w-64 rounded-xl border border-border bg-card overflow-hidden text-left hover:border-border/80 hover:bg-accent/50 transition-all duration-150"
              >
                {event.poster_url ? (
                  <div className="h-32 bg-muted overflow-hidden">
                    <img src={event.poster_url} alt={event.title} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="h-32 bg-gradient-to-br from-violet-100 to-blue-100 flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-violet-300" />
                  </div>
                )}
                <div className="p-3">
                  <p className="text-sm font-medium truncate">{event.title}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Calendar className="h-3 w-3" />
                    {formatDateKL(event.event_date + 'T00:00:00', 'dd MMM yyyy')}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Member Snapshot */}
      <section>
        <h2 className="text-sm font-semibold mb-4 text-foreground uppercase tracking-wide">
          Member Snapshot
        </h2>
        {(() => {
          const activeMembers = members.filter((m) => {
            const mt = filterByMember(tasks, m.id)
            return mt.some((t) => t.status !== 'done')
          })
          const inactiveMembers = members.filter((m) => {
            const mt = filterByMember(tasks, m.id)
            return !mt.some((t) => t.status !== 'done')
          })

          return (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {activeMembers.map((member) => {
                  const memberTasks = filterByMember(tasks, member.id) as TaskWithMember[]
                  const activeTasks = memberTasks
                    .filter((t) => t.status === 'in-progress' || t.status === 'blocked')
                    .slice(0, 3)
                  const qcCount = memberTasks.filter((t) => t.needs_qc && t.status !== 'done').length

                  return (
                    <button
                      key={member.id}
                      onClick={() => navigateToBoard(member.id)}
                      className="rounded-xl border border-border bg-card p-4 text-left transition-all duration-150 hover:border-border/80 hover:bg-accent/50"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <MemberAvatar member={member} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{member.name}</p>
                          <p className="text-xs text-muted-foreground">{member.role}</p>
                        </div>
                        {qcCount > 0 && (
                          <span className="flex items-center gap-1 bg-violet-100 text-violet-700 rounded-md text-xs font-medium px-2 py-0.5">
                            <Shield className="h-3 w-3" />
                            {qcCount} QC
                          </span>
                        )}
                      </div>
                      {activeTasks.length > 0 ? (
                        <div className="space-y-2">
                          {activeTasks.map((task) => (
                            <div key={task.id} className="flex items-center gap-2">
                              <StatusBadge status={task.status} />
                              <PriorityBadge priority={task.priority} />
                              <span className="text-xs text-muted-foreground truncate flex-1">
                                {task.title}
                              </span>
                              {task.due_date && (
                                <span className={`text-xs shrink-0 ${isOverdue(task.due_date) ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                                  {formatDueDate(task.due_date)}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">No active tasks</p>
                      )}
                    </button>
                  )
                })}
              </div>
              {inactiveMembers.length > 0 && (
                <p className="text-xs text-muted-foreground mt-3">
                  {inactiveMembers.map((m) => m.name).join(', ')} — no active tasks
                </p>
              )}
            </>
          )
        })()}
      </section>
    </div>
  )
}

function OverviewSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-xl" />
      <Skeleton className="h-48 rounded-xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
