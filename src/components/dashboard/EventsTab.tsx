'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Event, EventStatus, Member, TaskWithMember } from '@/lib/supabase/types'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { MemberAvatar } from '@/components/shared/MemberAvatar'
import { PriorityBadge } from '@/components/shared/PriorityBadge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { formatDateKL } from '@/lib/utils/dateHelpers'
import {
  Plus,
  X,
  Calendar,
  Image as ImageIcon,
  ChevronDown,
  ChevronRight,
  Trash2,
  ClipboardList,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'

const statusColors: Record<EventStatus, string> = {
  planning: 'bg-amber-100 text-amber-800',
  'in-progress': 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
}

const statusLabels: Record<EventStatus, string> = {
  planning: 'Planning',
  'in-progress': 'In Progress',
  completed: 'Completed',
}

interface EventsTabProps {
  members: Member[]
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function EventsTab({ members }: EventsTabProps) {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [taskCounts, setTaskCounts] = useState<Record<string, number>>({})

  const fetchTaskCounts = useCallback(async (eventList: Event[]) => {
    const counts: Record<string, number> = {}
    await Promise.all(
      eventList.map(async (event) => {
        try {
          const res = await fetch(`/api/events/${event.id}/tasks`)
          if (res.ok) {
            const tasks = await res.json()
            if (Array.isArray(tasks)) counts[event.id] = tasks.length
          }
        } catch {
          // silently ignore
        }
      })
    )
    setTaskCounts(counts)
  }, [])

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch('/api/events')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      if (Array.isArray(data)) {
        setEvents(data)
        fetchTaskCounts(data)
      }
    } catch {
      toast.error('Failed to load events')
    } finally {
      setLoading(false)
    }
  }, [fetchTaskCounts])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/events/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      setEvents((prev) => prev.filter((e) => e.id !== id))
      if (expandedId === id) setExpandedId(null)
      toast.success('Event deleted')
    } catch {
      toast.error('Failed to delete event')
    }
  }

  const handleUpdate = async (id: string, updates: Partial<Event>) => {
    try {
      const res = await fetch(`/api/events/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!res.ok) throw new Error('Failed to update')
      const updated = await res.json()
      setEvents((prev) => prev.map((e) => (e.id === id ? updated : e)))
    } catch {
      toast.error('Failed to update event')
    }
  }

  if (loading) return <EventsSkeleton />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
            Events
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {events.length} event{events.length !== 1 ? 's' : ''} tracked
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2" disabled={showForm}>
          <Plus className="h-4 w-4" />
          New Event
        </Button>
      </div>

      {showForm && (
        <EventForm
          onSave={(event) => {
            setEvents((prev) => [event, ...prev].sort((a, b) => a.event_date.localeCompare(b.event_date)))
            setShowForm(false)
            setExpandedId(event.id)
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {events.length === 0 && !showForm ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <Calendar className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No events yet</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3 gap-2"
            onClick={() => setShowForm(true)}
          >
            <Plus className="h-4 w-4" />
            Create your first event
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {events.map((event) => {
            const isExpanded = expandedId === event.id
            const isPast = event.event_date < new Date().toISOString().split('T')[0]

            return (
              <div
                key={event.id}
                className={`rounded-xl border border-border bg-card overflow-hidden transition-all duration-150 ${
                  isPast && event.status !== 'completed' ? 'opacity-70' : ''
                }`}
              >
                {/* Poster area */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {event.poster_url ? (
                  <div className="aspect-[4/5] bg-muted relative overflow-hidden">
                    <img
                      src={event.poster_url}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-[4/5] bg-gradient-to-br from-violet-100 to-blue-100 flex items-center justify-center">
                    <ImageIcon className="h-10 w-10 text-violet-300" />
                  </div>
                )}

                {/* Content */}
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold line-clamp-2">{event.title}</h3>
                    <span className={`shrink-0 rounded-md text-xs font-medium px-2 py-0.5 ${statusColors[event.status]}`}>
                      {statusLabels[event.status]}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDateKL(event.event_date + 'T00:00:00', 'dd MMM yyyy')}
                  </div>

                  {event.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {event.description}
                    </p>
                  )}

                  {/* Task count + Expand toggle */}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : event.id)}
                      className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                    >
                      {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                      {isExpanded ? 'Collapse' : 'Edit details'}
                    </button>
                    {(taskCounts[event.id] ?? 0) > 0 && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted rounded-md px-2 py-0.5">
                        <ClipboardList className="h-3 w-3" />
                        {taskCounts[event.id]} task{taskCounts[event.id] !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  {/* Expanded edit section */}
                  {isExpanded && (
                    <>
                      <EventEditSection
                        event={event}
                        onUpdate={(updates) => handleUpdate(event.id, updates)}
                        onDelete={() => handleDelete(event.id)}
                      />
                      <LinkedTasksSection eventId={event.id} />
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function EventForm({
  onSave,
  onCancel,
}: {
  onSave: (event: Event) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [status, setStatus] = useState<EventStatus>('planning')
  const [posterUrl, setPosterUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !eventDate) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          event_date: eventDate,
          status,
          poster_url: posterUrl.trim() || null,
        }),
      })
      if (!res.ok) throw new Error('Failed to create')
      const event = await res.json()
      onSave(event)
      toast.success('Event created')
    } catch {
      toast.error('Failed to create event')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-violet-200 bg-violet-50/30 p-5 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">New Event</h3>
        <button type="button" onClick={onCancel}>
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Title</label>
          <Input
            placeholder="e.g. JCI National Convention 2026"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            required
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Event Date</label>
          <Input
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            required
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Description</label>
        <Textarea
          placeholder="Event description..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="resize-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as EventStatus)}
            className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm"
          >
            <option value="planning">Planning</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Poster URL (optional)</label>
          <Input
            type="url"
            placeholder="https://example.com/poster.jpg"
            value={posterUrl}
            onChange={(e) => setPosterUrl(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2">
        <Button type="submit" disabled={submitting || !title.trim() || !eventDate}>
          {submitting ? 'Creating...' : 'Create Event'}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

function EventEditSection({
  event,
  onUpdate,
  onDelete,
}: {
  event: Event
  onUpdate: (updates: Partial<Event>) => void
  onDelete: () => void
}) {
  const [title, setTitle] = useState(event.title)
  const [description, setDescription] = useState(event.description || '')
  const [eventDate, setEventDate] = useState(event.event_date)
  const [status, setStatus] = useState<EventStatus>(event.status)
  const [posterUrl, setPosterUrl] = useState(event.poster_url || '')
  const [dirty, setDirty] = useState(false)

  const markDirty = () => setDirty(true)

  const handleSave = () => {
    onUpdate({
      title: title.trim(),
      description: description.trim() || null,
      event_date: eventDate,
      status,
      poster_url: posterUrl.trim() || null,
    })
    setDirty(false)
    toast.success('Event updated')
  }

  return (
    <div className="space-y-3 pt-3 border-t border-border">
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Title</label>
        <Input value={title} onChange={(e) => { setTitle(e.target.value); markDirty() }} className="text-sm" />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Description</label>
        <Textarea value={description} onChange={(e) => { setDescription(e.target.value); markDirty() }} rows={2} className="resize-none text-sm" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Date</label>
          <Input type="date" value={eventDate} onChange={(e) => { setEventDate(e.target.value); markDirty() }} className="text-sm" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value as EventStatus); markDirty() }}
            className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm"
          >
            <option value="planning">Planning</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Poster URL</label>
        <Input type="url" value={posterUrl} onChange={(e) => { setPosterUrl(e.target.value); markDirty() }} placeholder="https://..." className="text-sm" />
      </div>
      <div className="flex items-center justify-between pt-2">
        {dirty ? (
          <Button size="sm" onClick={handleSave}>Save Changes</Button>
        ) : (
          <span className="text-xs text-muted-foreground">No unsaved changes</span>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-1"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </Button>
      </div>
    </div>
  )
}

function LinkedTasksSection({ eventId }: { eventId: string }) {
  const [tasks, setTasks] = useState<TaskWithMember[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function fetchLinkedTasks() {
      setLoading(true)
      try {
        const res = await fetch(`/api/events/${eventId}/tasks`)
        if (!res.ok) throw new Error('Failed to fetch')
        const data = await res.json()
        if (!cancelled && Array.isArray(data)) setTasks(data)
      } catch {
        // silently ignore
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchLinkedTasks()
    return () => { cancelled = true }
  }, [eventId])

  return (
    <div className="space-y-2 pt-3 border-t border-border">
      <div className="flex items-center gap-1.5">
        <ClipboardList className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Linked Tasks
        </span>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-3 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Loading tasks...
        </div>
      ) : tasks.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2">No tasks linked to this event</p>
      ) : (
        <div className="space-y-1.5">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2"
            >
              <StatusBadge status={task.status} />
              <span className="text-xs font-medium truncate flex-1">{task.title}</span>
              {task.priority === 'high' && <PriorityBadge priority={task.priority} />}
              {task.member && <MemberAvatar member={task.member} size="sm" />}
              {task.due_date && (
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {formatDateKL(task.due_date + 'T00:00:00', 'dd MMM')}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function EventsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-9 w-28" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-72 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
