'use client'

import type { TaskWithMember, Member } from '@/lib/supabase/types'
import { useSummary } from '@/hooks/useSummary'
import { getDoneThisWeek, filterBlocked, filterOverdue, sortByDueDate } from '@/lib/utils/taskHelpers'
import { formatDueDate, formatRelative } from '@/lib/utils/dateHelpers'
import { Clock } from 'lucide-react'
import { MemberAvatar } from '@/components/shared/MemberAvatar'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { CheckCircle2, ArrowRight, RefreshCw, Sparkles, AlertTriangle } from 'lucide-react'

interface SummaryTabProps {
  tasks: TaskWithMember[]
  members: Member[]
  loading: boolean
}

export function SummaryTab({ tasks, loading: tasksLoading }: SummaryTabProps) {
  const { summary, loading: summaryLoading, regenerating, regenerate } = useSummary()

  if (tasksLoading) {
    return <SummarySkeleton />
  }

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const completedToday = tasks.filter(
    (t) => t.status === 'done' && new Date(t.updated_at) >= todayStart
  )

  const overdueItems = sortByDueDate(filterOverdue(tasks)).slice(0, 6) as TaskWithMember[]
  const upNext = sortByDueDate(
    tasks.filter((t) => {
      if (t.status === 'done') return false
      if (!t.due_date) return true
      const today = new Date().toISOString().split('T')[0]
      return t.due_date >= today
    })
  ).slice(0, 6) as TaskWithMember[]

  const doneThisWeek = getDoneThisWeek(tasks)
  const activeTasks = tasks.filter((t) => t.status !== 'done')
  const blockers = filterBlocked(tasks)

  return (
    <div className="space-y-8">
      {/* Two columns: Completed Today + Up Next */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Completed Today */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
              Completed Today
            </h2>
            <span className="text-xs text-muted-foreground">({completedToday.length})</span>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            {completedToday.length > 0 ? (
              completedToday.map((task) => (
                <div key={task.id} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                  {task.member && <MemberAvatar member={task.member} size="sm" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{task.title}</p>
                    <p className="text-xs text-muted-foreground">{task.member?.name}</p>
                  </div>
                  <StatusBadge status="done" />
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">
                No tasks completed today yet
              </p>
            )}
          </div>
        </section>

        {/* Right column: Overdue + Up Next */}
        <div className="space-y-6">
          {/* Overdue */}
          {overdueItems.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Clock className="h-4 w-4 text-red-600" />
                <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                  Overdue
                </h2>
                <span className="text-xs text-red-600 font-medium">({overdueItems.length})</span>
              </div>
              <div className="rounded-xl border border-red-200 bg-red-50/50 p-4 space-y-3">
                {overdueItems.map((task) => (
                  <div key={task.id} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                    {task.member && <MemberAvatar member={task.member} size="sm" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{task.title}</p>
                      <p className="text-xs text-muted-foreground">{task.member?.name}</p>
                    </div>
                    {task.due_date && (
                      <span className="text-xs text-red-600 font-medium shrink-0">
                        {formatDueDate(task.due_date)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Up Next */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <ArrowRight className="h-4 w-4 text-amber-600" />
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                Up Next
              </h2>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              {upNext.length > 0 ? (
                upNext.map((task) => (
                  <div key={task.id} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                    {task.member && <MemberAvatar member={task.member} size="sm" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{task.title}</p>
                      <p className="text-xs text-muted-foreground">{task.member?.name}</p>
                    </div>
                    {task.due_date && (
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatDueDate(task.due_date)}
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">
                  All upcoming tasks are done!
                </p>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Weekly Rollup */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-600" />
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
              Weekly Rollup
            </h2>
          </div>
          {summary?.weekly_narrative && (
            <Button
              variant="outline"
              size="sm"
              onClick={regenerate}
              disabled={regenerating}
              className="gap-2"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${regenerating ? 'animate-spin' : ''}`} />
              {regenerating ? 'Generating...' : 'Regenerate'}
            </Button>
          )}
        </div>
        <div className="rounded-xl border border-border bg-card p-5 space-y-5">
          {/* Mini metrics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg bg-green-50 p-3 text-center">
              <p className="text-2xl font-medium text-green-700">{doneThisWeek.length}</p>
              <p className="text-xs text-green-600">Completed this week</p>
            </div>
            <div className="rounded-lg bg-blue-50 p-3 text-center">
              <p className="text-2xl font-medium text-blue-700">{activeTasks.length}</p>
              <p className="text-xs text-blue-600">Still active</p>
            </div>
            <div className="rounded-lg bg-red-50 p-3 text-center">
              <p className="text-2xl font-medium text-red-700">{blockers.length}</p>
              <p className="text-xs text-red-600">Critical blockers</p>
            </div>
          </div>

          {/* AI Narrative */}
          {summaryLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : summary?.weekly_narrative ? (
            <div className="space-y-3">
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-sm leading-relaxed">{summary.weekly_narrative}</p>
              </div>
              {summary.blockers_narrative && (
                <div className="rounded-lg bg-red-50 p-4 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                  <p className="text-sm text-red-800 leading-relaxed">
                    {summary.blockers_narrative}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center py-6 gap-3">
              <Sparkles className="h-8 w-8 text-violet-400" />
              <p className="text-sm text-muted-foreground">No AI summary generated yet</p>
              <Button
                onClick={regenerate}
                disabled={regenerating}
                className="gap-2"
              >
                <Sparkles className={`h-4 w-4 ${regenerating ? 'animate-spin' : ''}`} />
                {regenerating ? 'Generating...' : 'Generate AI Summary'}
              </Button>
            </div>
          )}

          {summary?.generated_at && (
            <div className="pt-2 border-t border-border">
              <span className="text-xs text-muted-foreground">
                Last generated: {formatRelative(summary.generated_at)}
              </span>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function SummarySkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  )
}
