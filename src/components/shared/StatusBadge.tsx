import type { TaskStatus } from '@/lib/supabase/types'

interface StatusBadgeProps {
  status: TaskStatus
  onClick?: () => void
}

const statusConfig: Record<TaskStatus, { label: string; className: string }> = {
  'todo': { label: 'To Do', className: 'bg-slate-100 text-slate-600' },
  'in-progress': { label: 'In Progress', className: 'bg-blue-100 text-blue-800' },
  'done': { label: 'Done', className: 'bg-green-100 text-green-800' },
  'blocked': { label: 'Blocked', className: 'bg-red-100 text-red-800' },
}

export function StatusBadge({ status, onClick }: StatusBadgeProps) {
  const config = statusConfig[status]
  const Component = onClick ? 'button' : 'span'

  return (
    <Component
      className={`${config.className} rounded-md text-xs font-medium px-2 py-0.5 transition-all duration-150 ${
        onClick ? 'cursor-pointer hover:opacity-80 active:scale-95' : ''
      }`}
      onClick={onClick}
    >
      {config.label}
    </Component>
  )
}
