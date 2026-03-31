'use client'

import type { TaskWithMember, Member } from '@/lib/supabase/types'
import { useTaskStore } from '@/lib/store/useTaskStore'
import { filterBlocked, filterOverdue, filterHighPriority, sortByDueDate } from '@/lib/utils/taskHelpers'
import { getNextStatus } from '@/lib/utils/taskHelpers'
import { TaskRow } from '@/components/shared/TaskRow'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertTriangle, Clock, Flame } from 'lucide-react'
import { toast } from 'sonner'

interface PriorityTabProps {
  tasks: TaskWithMember[]
  members: Member[]
  loading: boolean
}

export function PriorityTab({ tasks, loading }: PriorityTabProps) {
  const updateTask = useTaskStore((s) => s.updateTask)

  if (loading) {
    return <PrioritySkeleton />
  }

  const blocked = filterBlocked(tasks) as TaskWithMember[]
  const overdue = sortByDueDate(filterOverdue(tasks)) as TaskWithMember[]
  const highPriority = sortByDueDate(filterHighPriority(tasks)) as TaskWithMember[]

  const handleStatusCycle = async (task: TaskWithMember) => {
    const nextStatus = getNextStatus(task.status)
    try {
      await updateTask(task.id, { status: nextStatus })
    } catch {
      toast.error('Failed to update status')
    }
  }

  return (
    <div className="space-y-8">
      {/* Two-column: Blockers + Overdue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Blockers */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Blockers
            </h2>
            <span className="text-xs text-muted-foreground">({blocked.length})</span>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            {blocked.length > 0 ? (
              blocked.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  dotColor="#ef4444"
                  onStatusClick={() => handleStatusCycle(task)}
                />
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No blockers — looking good!
              </p>
            )}
          </div>
        </section>

        {/* Overdue */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4 text-amber-600" />
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Overdue
            </h2>
            <span className="text-xs text-muted-foreground">({overdue.length})</span>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            {overdue.length > 0 ? (
              overdue.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  dotColor="#f59e0b"
                  onStatusClick={() => handleStatusCycle(task)}
                />
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No overdue tasks
              </p>
            )}
          </div>
        </section>
      </div>

      {/* High Priority */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Flame className="h-4 w-4 text-amber-600" />
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            High Priority
          </h2>
          <span className="text-xs text-muted-foreground">({highPriority.length})</span>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          {highPriority.length > 0 ? (
            highPriority.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onStatusClick={() => handleStatusCycle(task)}
              />
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No high-priority tasks outstanding
            </p>
          )}
        </div>
      </section>
    </div>
  )
}

function PrioritySkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
      <Skeleton className="h-48 rounded-xl" />
    </div>
  )
}
