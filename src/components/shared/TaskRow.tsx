import type { TaskWithMember } from '@/lib/supabase/types'
import { StatusBadge } from './StatusBadge'
import { PriorityBadge } from './PriorityBadge'
import { MemberAvatar } from './MemberAvatar'
import { formatDueDate, isOverdue } from '@/lib/utils/dateHelpers'

interface TaskRowProps {
  task: TaskWithMember
  onStatusClick?: () => void
  dotColor?: string
}

export function TaskRow({ task, onStatusClick, dotColor }: TaskRowProps) {
  const overdue = isOverdue(task.due_date) && task.status !== 'done'

  return (
    <div className="flex items-center gap-3 py-3 px-1 border-b border-border/50 last:border-0 transition-colors duration-150">
      {dotColor && (
        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: dotColor }} />
      )}
      {task.member && <MemberAvatar member={task.member} size="sm" />}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{task.title}</p>
        <p className="text-xs text-muted-foreground">{task.member?.name}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <StatusBadge status={task.status} onClick={onStatusClick} />
        <PriorityBadge priority={task.priority} />
        {task.due_date && (
          <span className={`text-xs whitespace-nowrap ${overdue ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
            {formatDueDate(task.due_date)}
          </span>
        )}
      </div>
    </div>
  )
}
