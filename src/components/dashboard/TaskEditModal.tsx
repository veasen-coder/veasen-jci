'use client'

import { useState, useEffect } from 'react'
import type { TaskWithMember, Event, TaskStatus, TaskPriority } from '@/lib/supabase/types'
import { useTaskStore } from '@/lib/store/useTaskStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { X, Shield } from 'lucide-react'
import { toast } from 'sonner'

interface TaskEditModalProps {
  task: TaskWithMember
  events: Event[]
  onClose: () => void
}

export function TaskEditModal({ task, events, onClose }: TaskEditModalProps) {
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description || '')
  const [dueDate, setDueDate] = useState(task.due_date || '')
  const [priority, setPriority] = useState<TaskPriority>(task.priority)
  const [status, setStatus] = useState<TaskStatus>(task.status)
  const [eventId, setEventId] = useState(task.event_id || '')
  const [needsQc, setNeedsQc] = useState(task.needs_qc)
  const [saving, setSaving] = useState(false)
  const updateTask = useTaskStore((s) => s.updateTask)

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const handleSave = async () => {
    if (!title.trim()) return
    setSaving(true)
    try {
      await updateTask(task.id, {
        title: title.trim(),
        description: description.trim() || null,
        due_date: dueDate || null,
        priority,
        status,
        event_id: eventId || null,
        needs_qc: needsQc,
      })
      toast.success('Task updated')
      onClose()
    } catch {
      toast.error('Failed to update task')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-card border border-border rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="text-sm font-semibold">Edit Task</h3>
          <button onClick={onClose}>
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Member info (read-only) */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
              style={{ backgroundColor: task.member.bg_hex, color: task.member.color_hex }}
            >
              {task.member.initials}
            </div>
            <span>{task.member.name}</span>
            <span>&middot;</span>
            <span>{task.member.role}</span>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="text-sm" />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="resize-none text-sm"
              placeholder="Task description..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Due Date</label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Priority</label>
              <button
                type="button"
                onClick={() => setPriority(priority === 'normal' ? 'high' : 'normal')}
                className={`w-full h-10 rounded-md text-sm font-medium transition-colors duration-150 ${
                  priority === 'high'
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : 'bg-muted text-muted-foreground border border-border'
                }`}
              >
                {priority === 'high' ? 'High Priority' : 'Normal'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm"
              >
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="blocked">Blocked</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Linked Event</label>
              <select
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm"
              >
                <option value="">No event</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>{ev.title}</option>
                ))}
              </select>
            </div>
          </div>

          {/* QC Request toggle */}
          <button
            type="button"
            onClick={() => setNeedsQc(!needsQc)}
            className={`flex items-center gap-2 w-full rounded-lg p-3 text-sm font-medium transition-all duration-150 ${
              needsQc
                ? 'bg-violet-100 text-violet-800 border border-violet-200'
                : 'bg-muted text-muted-foreground border border-border'
            }`}
          >
            <Shield className="h-4 w-4" />
            {needsQc ? 'QC Requested — President will review' : 'Request QC from President'}
          </button>
        </div>

        <div className="flex items-center justify-end gap-2 p-5 border-t border-border">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !title.trim()}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  )
}
