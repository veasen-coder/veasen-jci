import type { TaskPriority } from '@/lib/supabase/types'

interface PriorityBadgeProps {
  priority: TaskPriority
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  if (priority !== 'high') return null

  return (
    <span className="bg-amber-100 text-amber-800 rounded-md text-xs font-medium px-2 py-0.5">
      High
    </span>
  )
}
