import type { Task, TaskWithMember, TaskStatus, Member } from '@/lib/supabase/types'

export function filterByStatus(tasks: Task[], status: TaskStatus) {
  return tasks.filter((t) => t.status === status)
}

export function filterByMember(tasks: Task[], memberId: string) {
  return tasks.filter((t) => t.member_id === memberId)
}

export function filterBlocked(tasks: Task[]) {
  return tasks.filter((t) => t.status === 'blocked')
}

export function filterHighPriority(tasks: Task[]) {
  return tasks.filter((t) => t.priority === 'high' && t.status !== 'done')
}

export function filterOverdue(tasks: Task[]) {
  const today = new Date().toISOString().split('T')[0]
  return tasks.filter((t) => t.due_date && t.due_date < today && t.status !== 'done')
}

export function sortByDueDate(tasks: Task[]) {
  return [...tasks].sort((a, b) => {
    if (!a.due_date) return 1
    if (!b.due_date) return -1
    return a.due_date.localeCompare(b.due_date)
  })
}

export function groupByMember(tasks: TaskWithMember[]) {
  const groups: Record<string, TaskWithMember[]> = {}
  for (const task of tasks) {
    const memberId = task.member_id
    if (!groups[memberId]) groups[memberId] = []
    groups[memberId].push(task)
  }
  return groups
}

export function getTaskCounts(tasks: Task[]) {
  return {
    total: tasks.length,
    todo: tasks.filter((t) => t.status === 'todo').length,
    inProgress: tasks.filter((t) => t.status === 'in-progress').length,
    blocked: tasks.filter((t) => t.status === 'blocked').length,
    done: tasks.filter((t) => t.status === 'done').length,
  }
}

export function getMemberStats(tasks: Task[], member: Member) {
  const memberTasks = filterByMember(tasks, member.id)
  const done = memberTasks.filter((t) => t.status === 'done').length
  const blocked = memberTasks.filter((t) => t.status === 'blocked').length
  const inProgress = memberTasks.filter((t) => t.status === 'in-progress').length
  const active = memberTasks.filter((t) => t.status !== 'done').length

  const total = memberTasks.length
  const todo = memberTasks.filter((t) => t.status === 'todo').length

  return {
    total,
    done,
    blocked,
    inProgress,
    todo,
    active,
    donePercent: total > 0 ? (done / total) * 100 : 0,
    inProgressPercent: total > 0 ? (inProgress / total) * 100 : 0,
    blockedPercent: total > 0 ? (blocked / total) * 100 : 0,
    todoPercent: total > 0 ? (todo / total) * 100 : 0,
  }
}

export function getNextStatus(status: TaskStatus): TaskStatus {
  const cycle: Record<TaskStatus, TaskStatus> = {
    'todo': 'in-progress',
    'in-progress': 'done',
    'blocked': 'in-progress',
    'done': 'todo',
  }
  return cycle[status]
}

export function getDoneThisWeek(tasks: Task[]) {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
  startOfWeek.setHours(0, 0, 0, 0)

  return tasks.filter((t) => {
    if (t.status !== 'done') return false
    const updatedAt = new Date(t.updated_at)
    return updatedAt >= startOfWeek
  })
}
