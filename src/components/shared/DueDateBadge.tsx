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
      <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 text-gray-500 text-xs px-2 py-0.5">
        {dateText}
      </span>
    )
  }

  if (isOverdue(dueDate)) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-red-100 text-red-700 text-xs px-2 py-0.5 font-medium">
        <AlertTriangle className="h-3 w-3" />
        Overdue &middot; {dateText}
      </span>
    )
  }

  if (isDueSoon(dueDate)) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-orange-100 text-orange-700 text-xs px-2 py-0.5">
        <Clock className="h-3 w-3" />
        {dateText}
      </span>
    )
  }

  if (isDueThisWeek(dueDate)) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 text-amber-700 text-xs px-2 py-0.5">
        {dateText}
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-muted text-muted-foreground text-xs px-2 py-0.5">
      {dateText}
    </span>
  )
}
