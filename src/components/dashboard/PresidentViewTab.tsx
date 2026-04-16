'use client'

import { useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import type { TaskWithMember, Member } from '@/lib/supabase/types'
import { useTaskStore } from '@/lib/store/useTaskStore'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { MemberAvatar } from '@/components/shared/MemberAvatar'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { PriorityBadge } from '@/components/shared/PriorityBadge'
import { getTaskCounts, getMemberStats, getDoneThisWeek, filterByMember, filterOverdue } from '@/lib/utils/taskHelpers'
import { DueDateBadge } from '@/components/shared/DueDateBadge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, AlertTriangle, CheckCircle2, Clock, Shield, Check, X, Plus } from 'lucide-react'
import { toast } from 'sonner'
import type { TaskPriority } from '@/lib/supabase/types'

interface PresidentViewTabProps {
  tasks: TaskWithMember[]
  members: Member[]
  loading: boolean
  onMemberClick?: (member: Member) => void
}

export function PresidentViewTab({ tasks, members, loading, onMemberClick }: PresidentViewTabProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const addTask = useTaskStore((s) => s.addTask)

  const [showAssignForm, setShowAssignForm] = useState(false)
  const [assignMemberId, setAssignMemberId] = useState('')
  const [assignTitle, setAssignTitle] = useState('')
  const [assignDescription, setAssignDescription] = useState('')
  const [assignPriority, setAssignPriority] = useState<TaskPriority>('normal')
  const [assignDueDate, setAssignDueDate] = useState('')
  const [assignSubmitting, setAssignSubmitting] = useState(false)

  const resetAssignForm = () => {
    setAssignMemberId('')
    setAssignTitle('')
    setAssignDescription('')
    setAssignPriority('normal')
    setAssignDueDate('')
  }

  const handleAssignTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!assignMemberId || !assignTitle.trim()) return
    setAssignSubmitting(true)
    try {
      await addTask({
        member_id: assignMemberId,
        title: assignTitle.trim(),
        description: assignDescription.trim() || undefined,
        status: 'todo',
        priority: assignPriority,
        due_date: assignDueDate || undefined,
      })
      const member = members.find((m) => m.id === assignMemberId)
      toast.success(`Task assigned to ${member?.name || 'member'}`)
      resetAssignForm()
      setShowAssignForm(false)
    } catch {
      toast.error('Failed to assign task')
    } finally {
      setAssignSubmitting(false)
    }
  }

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

      {/* Assign Task */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-teal-600" />
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
              Assign Task
            </h2>
          </div>
          <Button
            variant={showAssignForm ? 'ghost' : 'default'}
            size="sm"
            onClick={() => { setShowAssignForm(!showAssignForm); if (showAssignForm) resetAssignForm() }}
            className={showAssignForm ? 'gap-2' : 'gap-2 bg-teal-600 hover:bg-teal-700 text-white'}
          >
            {showAssignForm ? (
              <><X className="h-3.5 w-3.5" /> Cancel</>
            ) : (
              <><Plus className="h-3.5 w-3.5" /> New Task</>
            )}
          </Button>
        </div>

        {showAssignForm && (
          <form onSubmit={handleAssignTask} className="rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50/30 dark:bg-teal-950/20 p-5 space-y-4 mb-2">
            {/* Assign To — Member Selector */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Assign To</label>
              <div className="flex gap-2 flex-wrap">
                {members.map((member) => (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => setAssignMemberId(member.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
                      assignMemberId === member.id
                        ? 'border-teal-400 bg-teal-100 dark:bg-teal-900/40 dark:border-teal-700'
                        : 'border-border hover:border-teal-300 dark:hover:border-teal-700'
                    }`}
                  >
                    <MemberAvatar member={member} size="sm" />
                    <span className="font-medium text-xs">{member.name}</span>
                  </button>
                ))}
              </div>
              {!assignMemberId && <p className="text-[10px] text-muted-foreground mt-1">Select a member to assign this task to</p>}
            </div>

            {/* Task Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Task Title</label>
                <Input
                  placeholder="e.g. Prepare Q2 report, Design event banner..."
                  value={assignTitle}
                  onChange={(e) => setAssignTitle(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Priority</label>
                <div className="flex gap-1">
                  {(['low', 'normal', 'high'] as TaskPriority[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setAssignPriority(p)}
                      className={`flex-1 px-3 py-2 rounded-md text-xs font-medium capitalize transition-all ${
                        assignPriority === p
                          ? (p as string) === 'high' ? 'bg-red-100 text-red-700 border border-red-300 dark:bg-red-900/40 dark:text-red-400 dark:border-red-700'
                            : (p as string) === 'low' ? 'bg-blue-100 text-blue-700 border border-blue-300 dark:bg-blue-900/40 dark:text-blue-400 dark:border-blue-700'
                            : 'bg-foreground text-background border border-foreground'
                          : 'bg-muted text-muted-foreground border border-transparent hover:border-border'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Due Date</label>
                <Input type="date" value={assignDueDate} onChange={(e) => setAssignDueDate(e.target.value)} />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Description (optional)</label>
              <Textarea
                placeholder="Add details or instructions..."
                value={assignDescription}
                onChange={(e) => setAssignDescription(e.target.value)}
                rows={2}
                className="resize-none"
              />
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="ghost" size="sm" onClick={() => { setShowAssignForm(false); resetAssignForm() }}>
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={assignSubmitting || !assignMemberId || !assignTitle.trim()}
                className="gap-2 bg-teal-600 hover:bg-teal-700 text-white"
              >
                {assignSubmitting ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Assigning...</>
                ) : (
                  <><Plus className="h-3.5 w-3.5" /> Assign Task</>
                )}
              </Button>
            </div>
          </form>
        )}
      </section>

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
                <QCRequestCard key={task.id} task={task} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle2 className="h-8 w-8 text-green-400 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                No QC requests — all clear
              </p>
            </div>
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
              <div key={member.id} className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 ${isInactive ? 'opacity-40' : ''}`}>
                <div className="flex items-center gap-3 w-full sm:w-48 shrink-0">
                  <MemberAvatar member={member} size="sm" onClick={onMemberClick ? () => onMemberClick(member) : undefined} />
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
                  <MemberAvatar member={member} onClick={onMemberClick ? () => onMemberClick(member) : undefined} />
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
                      <DueDateBadge dueDate={task.due_date} status={task.status} />
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

/* ============= QC REQUEST CARD ============= */
function QCRequestCard({ task }: { task: TaskWithMember }) {
  const updateTask = useTaskStore((s) => s.updateTask)
  const [acting, setActing] = useState(false)

  const handleApprove = async () => {
    setActing(true)
    try {
      await updateTask(task.id, { status: 'done', needs_qc: false })
      toast.success(`"${task.title}" approved & marked as done`)
    } catch {
      toast.error('Failed to approve task')
    } finally {
      setActing(false)
    }
  }

  const handleReject = async () => {
    setActing(true)
    try {
      await updateTask(task.id, { needs_qc: false })
      toast.info(`"${task.title}" sent back for revision`)
    } catch {
      toast.error('Failed to reject task')
    } finally {
      setActing(false)
    }
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg bg-violet-50/50 border border-violet-100 dark:bg-violet-950/30 dark:border-violet-900">
      <MemberAvatar member={task.member} size="sm" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{task.title}</p>
        <p className="text-xs text-muted-foreground">
          {task.member.name} &middot; {task.member.role}
        </p>
        {task.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
        )}
      </div>
      <StatusBadge status={task.status} />
      <DueDateBadge dueDate={task.due_date} status={task.status} />
      <div className="flex items-center gap-1.5 shrink-0">
        <Button
          size="sm"
          onClick={handleApprove}
          disabled={acting}
          className="gap-1 h-8 bg-green-600 hover:bg-green-700 text-white"
        >
          <Check className="h-3.5 w-3.5" />
          Done
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleReject}
          disabled={acting}
          className="gap-1 h-8 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
        >
          <X className="h-3.5 w-3.5" />
          Revise
        </Button>
      </div>
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
