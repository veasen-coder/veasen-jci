'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from '@hello-pangea/dnd'
import type { TaskWithMember, Member, TaskStatus, TaskPriority, Event } from '@/lib/supabase/types'
import { useTaskStore } from '@/lib/store/useTaskStore'
import { filterByMember } from '@/lib/utils/taskHelpers'
import { MemberAvatar } from '@/components/shared/MemberAvatar'
import { DueDateBadge } from '@/components/shared/DueDateBadge'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { PriorityBadge } from '@/components/shared/PriorityBadge'
import { TaskEditModal } from './TaskEditModal'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Plus, X, Calendar, Shield, Tag, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

interface BoardsTabProps {
  tasks: TaskWithMember[]
  members: Member[]
  loading: boolean
  activeProfileId?: string | null
  isPresident?: boolean
  onMemberClick?: (member: Member) => void
}

type ColumnId = 'todo' | 'in-progress' | 'done'

const columns: { id: ColumnId; label: string }[] = [
  { id: 'todo', label: 'To Do' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'done', label: 'Done' },
]

export function BoardsTab({ tasks, members, loading, activeProfileId, isPresident, onMemberClick }: BoardsTabProps) {
  const searchParams = useSearchParams()
  const memberParam = searchParams.get('member')
  const [selectedMemberId, setSelectedMemberId] = useState<string>(
    memberParam || activeProfileId || 'all'
  )
  const [editingTask, setEditingTask] = useState<TaskWithMember | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const updateTask = useTaskStore((s) => s.updateTask)

  useEffect(() => {
    fetch('/api/events')
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setEvents(data) })
      .catch(() => {})
  }, [])

  const isAllView = selectedMemberId === 'all'
  const selectedMember = members.find((m) => m.id === selectedMemberId)
  const activeTasks = isAllView ? tasks : filterByMember(tasks, selectedMemberId) as TaskWithMember[]

  const getColumnTasks = (columnId: ColumnId) => {
    if (columnId === 'in-progress') {
      return activeTasks.filter(
        (t) => t.status === 'in-progress' || t.status === 'blocked'
      )
    }
    return activeTasks.filter((t) => t.status === columnId)
  }

  const handleDragEnd = async (result: DropResult) => {
    const { draggableId, destination } = result
    if (!destination) return

    const newStatus = destination.droppableId as TaskStatus
    const task = tasks.find((t) => t.id === draggableId)
    if (!task || task.status === newStatus) return

    try {
      await updateTask(draggableId, { status: newStatus })
    } catch {
      toast.error('Failed to update task status')
    }
  }

  const getEventName = (eventId: string | null) => {
    if (!eventId) return null
    return events.find((e) => e.id === eventId)?.title || null
  }

  // Overdue tasks for current view
  const today = new Date().toISOString().split('T')[0]
  const overdueTasks = activeTasks.filter(
    (t) => t.due_date && t.due_date < today && t.status !== 'done'
  )

  if (loading) {
    return <BoardsSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Member Selector — only visible to President */}
      {isPresident && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedMemberId('all')}
            className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all duration-150 whitespace-nowrap shrink-0 ${
              isAllView
                ? 'bg-foreground text-background'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            All Members
          </button>
          {members.map((member) => (
            <button
              key={member.id}
              onClick={() => setSelectedMemberId(member.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all duration-150 whitespace-nowrap shrink-0 ${
                selectedMemberId === member.id
                  ? 'bg-foreground text-background'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              <MemberAvatar member={member} size="sm" onClick={onMemberClick ? () => onMemberClick(member) : undefined} />
              {member.role}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {selectedMember ? (
          <>
            <span>{selectedMember.name}</span>
            <span>&middot;</span>
            <span>{selectedMember.role}</span>
            <span>&middot;</span>
          </>
        ) : null}
        <span>{activeTasks.length} tasks</span>
      </div>

      {/* Overdue Tasks Alert */}
      {overdueTasks.length > 0 && (
        <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <h2 className="text-sm font-semibold text-red-800 dark:text-red-300">
              {overdueTasks.length} Overdue Task{overdueTasks.length !== 1 ? 's' : ''}
            </h2>
          </div>
          <div className="space-y-2">
            {overdueTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => setEditingTask(task)}
                className="flex items-center gap-2 text-sm cursor-pointer hover:bg-red-100/50 dark:hover:bg-red-900/20 rounded-lg px-2 py-1.5 -mx-2 transition-colors"
              >
                {isAllView && task.member && (
                  <MemberAvatar member={task.member} size="sm" />
                )}
                <span className="truncate flex-1 text-red-900 dark:text-red-200">{task.title}</span>
                <DueDateBadge dueDate={task.due_date} status={task.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {columns.map((column) => {
            const columnTasks = getColumnTasks(column.id)
            return (
              <div key={column.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">
                    {column.label}{' '}
                    <span className="text-muted-foreground">({columnTasks.length})</span>
                  </h3>
                </div>

                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-[200px] rounded-xl border border-border p-3 space-y-2 transition-colors duration-150 ${
                        snapshot.isDraggingOver ? 'bg-accent/50 border-accent' : 'bg-muted/30'
                      }`}
                    >
                      {columnTasks.map((task, index) => {
                        const eventName = getEventName(task.event_id)
                        return (
                          <Draggable key={task.id} draggableId={task.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                onClick={() => setEditingTask(task)}
                                className={`rounded-xl border border-border bg-card p-3 transition-all duration-150 cursor-pointer hover:ring-2 hover:ring-ring/20 ${
                                  snapshot.isDragging ? 'shadow-lg ring-2 ring-ring/20' : ''
                                }`}
                              >
                                {isAllView && task.member && (
                                  <div className="flex items-center gap-1.5 mb-1.5">
                                    <MemberAvatar member={task.member} size="sm" onClick={onMemberClick ? () => onMemberClick(task.member) : undefined} />
                                    <span className="text-xs text-muted-foreground">{task.member.role}</span>
                                  </div>
                                )}
                                <p className="text-sm font-medium line-clamp-2 mb-2">
                                  {task.title}
                                </p>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <StatusBadge status={task.status} />
                                  <PriorityBadge priority={task.priority} />
                                  <DueDateBadge dueDate={task.due_date} status={task.status} />
                                  {task.needs_qc && (
                                    <span className="flex items-center gap-0.5 bg-violet-100 text-violet-700 rounded-md text-[10px] font-bold px-1.5 py-0.5">
                                      <Shield className="h-3 w-3" />
                                      QC
                                    </span>
                                  )}
                                  {eventName && (
                                    <span className="flex items-center gap-0.5 bg-emerald-100 text-emerald-700 rounded-md text-[10px] font-medium px-1.5 py-0.5 truncate max-w-[120px]">
                                      <Tag className="h-3 w-3 shrink-0" />
                                      {eventName}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        )
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>

                {!isAllView && <AddTaskInline memberId={selectedMemberId} status={column.id} />}
              </div>
            )
          })}
        </div>
      </DragDropContext>

      {/* Task Edit Modal */}
      {editingTask && (
        <TaskEditModal
          task={editingTask}
          events={events}
          members={members}
          onClose={() => setEditingTask(null)}
        />
      )}
    </div>
  )
}

function AddTaskInline({ memberId, status }: { memberId: string; status: TaskStatus }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('normal')
  const [submitting, setSubmitting] = useState(false)
  const addTask = useTaskStore((s) => s.addTask)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setSubmitting(true)
    try {
      await addTask({
        member_id: memberId,
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        priority,
        due_date: dueDate || undefined,
      })
      setTitle('')
      setDescription('')
      setDueDate('')
      setPriority('normal')
      setOpen(false)
      toast.success('Task created')
    } catch {
      toast.error('Failed to create task')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors duration-150 w-full justify-center py-2"
      >
        <Plus className="h-4 w-4" />
        Add task
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-3 space-y-3">
      <Input
        placeholder="Task title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        autoFocus
        required
      />
      <Textarea
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
        className="resize-none"
      />
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="pl-8"
          />
        </div>
        <button
          type="button"
          onClick={() => setPriority(priority === 'normal' ? 'high' : 'normal')}
          className={`rounded-md text-xs font-medium px-3 py-2 transition-colors duration-150 ${
            priority === 'high'
              ? 'bg-amber-100 text-amber-800'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          {priority === 'high' ? 'High' : 'Normal'}
        </button>
      </div>
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={submitting || !title.trim()}>
          {submitting ? 'Creating...' : 'Create'}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </form>
  )
}

function BoardsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-32 rounded-full" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  )
}
