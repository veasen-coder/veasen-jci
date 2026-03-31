'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import type { TaskWithMember, Member } from '@/lib/supabase/types'
import { Skeleton } from '@/components/ui/skeleton'
import { MemberAvatar } from '@/components/shared/MemberAvatar'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { PriorityBadge } from '@/components/shared/PriorityBadge'
import { getTaskCounts, getMemberStats, getDoneThisWeek, filterByMember } from '@/lib/utils/taskHelpers'
import { ListChecks, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react'

interface OverviewTabProps {
  tasks: TaskWithMember[]
  members: Member[]
  loading: boolean
}

export function OverviewTab({ tasks, members, loading }: OverviewTabProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  if (loading) {
    return <OverviewSkeleton />
  }

  const counts = getTaskCounts(tasks)
  const doneThisWeek = getDoneThisWeek(tasks)

  const metrics = [
    { label: 'Total Tasks', value: counts.total, icon: ListChecks, color: 'text-foreground' },
    { label: 'In Progress', value: counts.inProgress, icon: Loader2, color: 'text-blue-600' },
    { label: 'Blockers', value: counts.blocked, icon: AlertTriangle, color: 'text-red-600' },
    { label: 'Done This Week', value: doneThisWeek.length, icon: CheckCircle2, color: 'text-green-600' },
  ]

  const navigateToBoard = (memberId: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', 'boards')
    params.set('member', memberId)
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="space-y-8">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <metric.icon className={`h-4 w-4 ${metric.color}`} />
              <span className="text-sm text-muted-foreground">{metric.label}</span>
            </div>
            <p className={`text-2xl font-medium ${metric.color}`}>{metric.value}</p>
          </div>
        ))}
      </div>

      {/* Team Workload */}
      <section>
        <h2 className="text-sm font-medium mb-4 text-muted-foreground uppercase tracking-wide">
          Team Workload
        </h2>
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          {members.map((member) => {
            const stats = getMemberStats(tasks, member)
            const barColor =
              stats.blocked > 0
                ? 'bg-red-500'
                : stats.inProgress >= 3
                ? 'bg-amber-500'
                : 'bg-green-500'

            return (
              <div key={member.id} className="flex items-center gap-4">
                <div className="flex items-center gap-3 w-48 shrink-0">
                  <MemberAvatar member={member} size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{member.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{member.role}</p>
                  </div>
                </div>
                <div className="flex-1 flex items-center gap-3">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                      style={{ width: `${stats.progress}%` }}
                    />
                  </div>
                  {stats.blocked > 0 && (
                    <span className="bg-red-100 text-red-800 rounded-md text-xs font-medium px-2 py-0.5 shrink-0">
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

      {/* Member Snapshot */}
      <section>
        <h2 className="text-sm font-medium mb-4 text-muted-foreground uppercase tracking-wide">
          Member Snapshot
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {members.map((member) => {
            const memberTasks = filterByMember(tasks, member.id)
            const activeTasks = memberTasks
              .filter((t) => t.status === 'in-progress' || t.status === 'blocked')
              .slice(0, 3)

            return (
              <button
                key={member.id}
                onClick={() => navigateToBoard(member.id)}
                className="rounded-xl border border-border bg-card p-4 text-left transition-all duration-150 hover:border-border/80 hover:bg-accent/50"
              >
                <div className="flex items-center gap-3 mb-3">
                  <MemberAvatar member={member} />
                  <div>
                    <p className="text-sm font-medium">{member.name}</p>
                    <p className="text-xs text-muted-foreground">{member.role}</p>
                  </div>
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
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
