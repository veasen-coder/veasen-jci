'use client'

import { formatDueDate, isOverdue, isDueSoon, isDueThisWeek } from '@/lib/utils/dateHelpers'
import { Clock, AlertTriangle } from 'lucide-react'

interface DueDateBadgeProps {
  dueDate: string | null
  status?: string
}

export function DueDateBadge({ dueDate, status }: DueDateBadgeProps) {
  if (!dueDate) return null

  const dateText = formatDueDate(dueDate)

  if (status === 'done') {
    return (
      <span className="pill bg-muted text-muted-foreground">
        {dateText}
      </span>
    )
  }

  if (isOverdue(dueDate)) {
    return (
      <span className="pill bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300">
        <AlertTriangle className="h-3 w-3" />
        Overdue &middot; {dateText}
      </span>
    )
  }

  if (isDueSoon(dueDate)) {
    return (
      <span className="pill bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300">
        <Clock className="h-3 w-3" />
        {dateText}
      </span>
    )
  }

  if (isDueThisWeek(dueDate)) {
    return (
      <span className="pill bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
        {dateText}
      </span>
    )
  }

  return (
    <span className="pill bg-muted text-muted-foreground">
      {dateText}
    </span>
  )
}
