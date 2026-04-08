'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import type { TaskWithMember, Member, Event } from '@/lib/supabase/types'
import { Skeleton } from '@/components/ui/skeleton'
import { MemberAvatar } from '@/components/shared/MemberAvatar'
import { filterOverdue } from '@/lib/utils/taskHelpers'
import { formatDateKL } from '@/lib/utils/dateHelpers'
import { DueDateBadge } from '@/components/shared/DueDateBadge'
import { Calendar, Image as ImageIcon, AlertTriangle } from 'lucide-react'

interface OverviewTabProps {
  tasks: TaskWithMember[]
  members: Member[]
  loading: boolean
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  const navigateToTab = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tab)
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const today = new Date().toISOString().split('T')[0]
  const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  // Upcoming timeline: tasks + events in the next 30 days
  const upcomingItems: { date: string; title: string; type: 'task' | 'event'; status: string; member?: Member; id: string }[] = []

  tasks.forEach((t) => {
    if (t.due_date && t.due_date >= today && t.due_date <= in30Days && t.status !== 'done') {
      upcomingItems.push({ date: t.due_date, title: t.title, type: 'task', status: t.status, member: t.member, id: t.id })
    }
  })

  events.forEach((e) => {
    if (e.event_date >= today && e.event_date <= in30Days) {
      upcomingItems.push({ date: e.event_date, title: e.title, type: 'event', status: e.status, id: e.id })
    }
  })

  upcomingItems.sort((a, b) => a.date.localeCompare(b.date))

  // Group by date for timeline view
  const groupedByDate: Record<string, typeof upcomingItems> = {}
  for (const item of upcomingItems) {
    if (!groupedByDate[item.date]) groupedByDate[item.date] = []
    groupedByDate[item.date].push(item)
  }
  const dateKeys = Object.keys(groupedByDate).sort()

  // Overdue items
  const overdueItems = filterOverdue(tasks) as TaskWithMember[]

  // Upcoming events (all non-completed)
  const upcomingEvents = events
    .filter((e) => e.event_date >= today && e.status !== 'completed')
    .sort((a, b) => a.event_date.localeCompare(b.event_date))

  // Event roadmap (all events sorted by date)
  const allEventsSorted = [...events].sort((a, b) => a.event_date.localeCompare(b.event_date))

  return (
    <div className="space-y-6">
      {/* Overdue Alert */}
      {overdueItems.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <h2 className="text-sm font-semibold text-red-800">
              {overdueItems.length} Overdue Task{overdueItems.length !== 1 ? 's' : ''}
            </h2>
          </div>
          <div className="space-y-2">
            {overdueItems.slice(0, 5).map((task) => (
              <div key={task.id} className="flex items-center gap-2 text-sm">
                <MemberAvatar member={task.member} size="sm" />
                <span className="truncate flex-1 text-red-900">{task.title}</span>
                <DueDateBadge dueDate={task.due_date} status={task.status} />
              </div>
            ))}
            {overdueItems.length > 5 && (
              <p className="text-xs text-red-600">+{overdueItems.length - 5} more</p>
            )}
          </div>
        </div>
      )}

      {/* Upcoming Events Cards */}
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
                className="shrink-0 w-56 rounded-xl border border-border bg-card overflow-hidden text-left hover:border-border/80 hover:bg-accent/50 transition-all duration-150"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {event.poster_url ? (
                  <div className="aspect-[4/5] bg-muted overflow-hidden">
                    <img src={event.poster_url} alt={event.title} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="aspect-[4/5] bg-gradient-to-br from-violet-100 to-blue-100 flex items-center justify-center">
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

      {/* Upcoming Dates Timeline (30 days) */}
      {dateKeys.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold mb-4 text-foreground uppercase tracking-wide">
            Upcoming Dates (Next 30 Days)
          </h2>
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="space-y-4">
              {dateKeys.slice(0, 15).map((date) => {
                const items = groupedByDate[date]
                const isToday = date === today
                return (
                  <div key={date} className="flex gap-4">
                    <div className={`w-20 shrink-0 text-right ${isToday ? 'font-bold text-foreground' : ''}`}>
                      <p className="text-xs text-muted-foreground">
                        {formatDateKL(date + 'T00:00:00', 'EEE')}
                      </p>
                      <p className={`text-sm ${isToday ? 'text-violet-600 font-semibold' : ''}`}>
                        {formatDateKL(date + 'T00:00:00', 'dd MMM')}
                      </p>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full border-2 shrink-0 ${
                        isToday ? 'border-violet-600 bg-violet-600' : 'border-border bg-background'
                      }`} />
                      <div className="w-0.5 flex-1 bg-border" />
                    </div>
                    <div className="flex-1 pb-4 space-y-2">
                      {items.map((item) => (
                        <div key={`${item.type}-${item.id}`} className="flex items-center gap-2">
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
                    </div>
                  </div>
                )
              })}
            </div>
            {dateKeys.length > 15 && (
              <p className="text-xs text-muted-foreground text-center pt-3">
                +{dateKeys.length - 15} more dates
              </p>
            )}
          </div>
        </section>
      )}

      {/* Event Roadmap */}
      {allEventsSorted.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold mb-4 text-foreground uppercase tracking-wide">
            Event Roadmap
          </h2>
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="space-y-3">
              {allEventsSorted.map((event) => {
                const isPast = event.event_date < today
                return (
                  <div
                    key={event.id}
                    className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
                      isPast ? 'opacity-50' : 'hover:bg-accent/30'
                    }`}
                  >
                    <div className="w-20 shrink-0">
                      <p className="text-sm font-medium">
                        {formatDateKL(event.event_date + 'T00:00:00', 'dd MMM')}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatDateKL(event.event_date + 'T00:00:00', 'yyyy')}
                      </p>
                    </div>
                    <div className={`w-3 h-3 rounded-full shrink-0 ${
                      event.status === 'completed' ? 'bg-green-500' :
                      event.status === 'in-progress' ? 'bg-blue-500' :
                      'bg-amber-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{event.title}</p>
                      {event.description && (
                        <p className="text-xs text-muted-foreground truncate">{event.description}</p>
                      )}
                    </div>
                    <span className={`shrink-0 rounded-md text-xs font-medium px-2 py-0.5 ${
                      event.status === 'completed' ? 'bg-green-100 text-green-700' :
                      event.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {event.status === 'completed' ? 'Completed' :
                       event.status === 'in-progress' ? 'In Progress' : 'Planning'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Empty state */}
      {upcomingItems.length === 0 && upcomingEvents.length === 0 && allEventsSorted.length === 0 && overdueItems.length === 0 && (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <Calendar className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No upcoming dates or events</p>
          <p className="text-xs text-muted-foreground mt-1">Create events and add due dates to tasks to see your roadmap here</p>
        </div>
      )}
    </div>
  )
}

function OverviewSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-48 rounded-xl" />
      <Skeleton className="h-64 rounded-xl" />
      <Skeleton className="h-48 rounded-xl" />
    </div>
  )
}
