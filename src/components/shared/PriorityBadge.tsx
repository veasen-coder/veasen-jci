import type { TaskPriority } from '@/lib/supabase/types'
import { ArrowUp } from 'lucide-react'

interface PriorityBadgeProps {
  priority: TaskPriority
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  if (priority !== 'high') return null

  return (
    <span className="pill bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
      <ArrowUp className="h-2.5 w-2.5" />
      High
    </span>
  )
}
