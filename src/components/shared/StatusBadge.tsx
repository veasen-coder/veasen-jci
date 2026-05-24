import type { TaskStatus } from '@/lib/supabase/types'

interface StatusBadgeProps {
  status: TaskStatus
  onClick?: () => void
}

const statusConfig: Record<TaskStatus, { label: string; className: string; dot: string }> = {
  'todo': {
    label: 'To Do',
    className: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    dot: 'bg-slate-400',
  },
  'in-progress': {
    label: 'In Progress',
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300',
    dot: 'bg-blue-500',
  },
  'done': {
    label: 'Done',
    className: 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300',
    dot: 'bg-green-500',
  },
  'blocked': {
    label: 'Blocked',
    className: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300',
    dot: 'bg-red-500',
  },
}

export function StatusBadge({ status, onClick }: StatusBadgeProps) {
  const config = statusConfig[status]
  const Component = onClick ? 'button' : 'span'

  return (
    <Component
      className={`pill ${config.className} ${
        onClick ? 'cursor-pointer transition-all duration-150 hover:opacity-80 active:scale-95' : ''
      }`}
      onClick={onClick}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </Component>
  )
}
