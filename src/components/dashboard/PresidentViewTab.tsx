'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import type { TaskWithMember, Member } from '@/lib/supabase/types'
import { Skeleton } from '@/components/ui/skeleton'
import { MemberAvatar } from '@/components/shared/MemberAvatar'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { PriorityBadge } from '@/components/shared/PriorityBadge'
import { getTaskCounts, getMemberStats, getDoneThisWeek, filterByMember, filterOverdue } from '@/lib/utils/taskHelpers'
import { formatDueDate, isOverdue } from '@/lib/utils/dateHelpers'
import { Loader2, AlertTriangle, CheckCircle2, Clock, Shield } from 'lucide-react'

interface PresidentViewTabProps {
  tasks: TaskWithMember[]
  members: Member[]
  loading: boolean
}

export function PresidentViewTab({ tasks, members, loading }: PresidentViewTabProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  if (loading) {
    return <PresidentSkeleton />
  }

  const counts = getTaskCounts(tasks)
  const doneThisWeek = getDoneThisWeek(tasks)
  const overdueCount = filterOverdue(tasks).length
  const qcTasks = tasks.filter((t) => t.needs_qc && t.status !== 'done')

  const metrics = [
    { label: 'In Progress', value: counts.inProgress, icon: Loader2, color: 'text-blue-600' },
    { label: 'Blockers', value: counts.blocked, icon: AlertTriangle, color: 'text-red-600' },
    { label: 'Overdue', value: overdueCount, icon: Clock, color: 'text-amber-600' },
    { label: 'Done This Week', value: doneThisWeek.length, icon: CheckCircle2, color: 'text-green-600' },
  ]

  const navigateToBoard = (memberId: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', 'boards')
    params.set('member', memberId)
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-xl border border-border bg-card p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <metric.icon className={`h-4 w-4 ${metric.color}`} />
              <span className="text-sm text-muted-foreground">{metric.label}</span>
            </div>
            <p className={`text-2xl font-medium ${metric.color}`}>{metric.value}</p>
          </div>
        ))}
      </div>

      {/* QC Requests — tasks needing President review */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-4 w-4 text-violet-600" />
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
            QC Requests
          </h2>
          <span className="text-xs text-muted-foreground">({qcTasks.length})</span>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          {qcTasks.length > 0 ? (
            <div className="space-y-3">
              {qcTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-violet-50/50 border border-violet-100"
                >
                  <MemberAvatar member={task.member} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{task.title}</p>
                    <p className="text-xs text-muted-foreground">{task.member.name} &middot; {task.member.role}</p>
                  </div>
                  <StatusBadge status={task.status} />
                  <PriorityBadge priority={task.priority} />
                  {task.due_date && (
                    <span className={`text-xs shrink-0 ${isOverdue(task.due_date) && task.status !== 'done' ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                      {formatDueDate(task.due_date)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">
              No QC requests — all clear
            </p>
          )}
        </div>
      </section>

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

      {/* Member Ongoing Tasks — Full detail for President */}
      <section>
        <h2 className="text-sm font-semibold mb-4 text-foreground uppercase tracking-wide">
          Member Ongoing Tasks
        </h2>
        <div className="space-y-4">
          {members.map((member) => {
            const memberTasks = (filterByMember(tasks, member.id) as TaskWithMember[])
              .filter((t) => t.status !== 'done')
            if (memberTasks.length === 0) return null

            return (
              <button
                key={member.id}
                onClick={() => navigateToBoard(member.id)}
                className="w-full rounded-xl border border-border bg-card p-4 text-left transition-all duration-150 hover:border-border/80 hover:bg-accent/50"
              >
                <div className="flex items-center gap-3 mb-3">
                  <MemberAvatar member={member} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{member.name}</p>
                    <p className="text-xs text-muted-foreground">{member.role}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {memberTasks.length} task{memberTasks.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="space-y-2">
                  {memberTasks.slice(0, 5).map((task) => (
                    <div key={task.id} className="flex items-center gap-2">
                      <StatusBadge status={task.status} />
                      <PriorityBadge priority={task.priority} />
                      <span className="text-xs text-muted-foreground truncate flex-1">
                        {task.title}
                      </span>
                      {task.needs_qc && (
                        <span className="flex items-center gap-0.5 bg-violet-100 text-violet-700 rounded-md text-[10px] font-bold px-1.5 py-0.5">
                          <Shield className="h-3 w-3" />
                          QC
                        </span>
                      )}
                      {task.due_date && (
                        <span className={`text-xs shrink-0 ${isOverdue(task.due_date) ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                          {formatDueDate(task.due_date)}
                        </span>
                      )}
                    </div>
                  ))}
                  {memberTasks.length > 5 && (
                    <p className="text-xs text-muted-foreground">+{memberTasks.length - 5} more</p>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </section>
    </div>
  )
}

function PresidentSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-48 rounded-xl" />
      <Skeleton className="h-64 rounded-xl" />
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
