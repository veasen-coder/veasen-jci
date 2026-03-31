import type { TaskWithMember } from '@/lib/supabase/types'
import { StatusBadge } from './StatusBadge'
import { PriorityBadge } from './PriorityBadge'
import { MemberAvatar } from './MemberAvatar'
import { formatDueDate, isOverdue } from '@/lib/utils/dateHelpers'

interface TaskCardProps {
  task: TaskWithMember
  showMember?: boolean
  onStatusClick?: () => void
  compact?: boolean
}

export function TaskCard({ task, showMember = false, onStatusClick, compact = false }: TaskCardProps) {
  const overdue = isOverdue(task.due_date) && task.status !== 'done'

  return (
    <div className="rounded-xl border border-border bg-card p-4 transition-all duration-150 hover:border-border/80">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className={`font-medium text-sm leading-snug ${compact ? 'line-clamp-1' : 'line-clamp-2'}`}>
            {task.title}
          </p>
          {!compact && task.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {task.description}
            </p>
          )}
        </div>
        {showMember && task.member && (
          <MemberAvatar member={task.member} size="sm" />
        )}
      </div>

      <div className="flex items-center gap-2 mt-3 flex-wrap">
        <StatusBadge status={task.status} onClick={onStatusClick} />
        <PriorityBadge priority={task.priority} />
        {task.due_date && (
          <span className={`text-xs ${overdue ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
            {formatDueDate(task.due_date)}
            {overdue && ' (Overdue)'}
          </span>
        )}
      </div>

      {showMember && task.member && (
        <div className="flex items-center gap-1.5 mt-2">
          <span className="text-xs text-muted-foreground">{task.member.name}</span>
        </div>
      )}
    </div>
  )
}
