'use client'

import { useState, useEffect, useCallback } from 'react'
import type { TaskWithMember, Event, TaskStatus, TaskPriority, TaskCommentWithMember, Member } from '@/lib/supabase/types'
import { useTaskStore } from '@/lib/store/useTaskStore'
import { MemberAvatar } from '@/components/shared/MemberAvatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { X, Shield, MessageSquare, Send } from 'lucide-react'
import { toast } from 'sonner'

interface TaskEditModalProps {
  task: TaskWithMember
  events: Event[]
  members: Member[]
  onClose: () => void
}

export function TaskEditModal({ task, events, members, onClose }: TaskEditModalProps) {
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description || '')
  const [dueDate, setDueDate] = useState(task.due_date || '')
  const [priority, setPriority] = useState<TaskPriority>(task.priority)
  const [status, setStatus] = useState<TaskStatus>(task.status)
  const [eventId, setEventId] = useState(task.event_id || '')
  const [needsQc, setNeedsQc] = useState(task.needs_qc)
  const [saving, setSaving] = useState(false)
  const [comments, setComments] = useState<TaskCommentWithMember[]>([])
  const [newComment, setNewComment] = useState('')
  const [commentAs, setCommentAs] = useState(task.member_id)
  const [sendingComment, setSendingComment] = useState(false)
  const updateTask = useTaskStore((s) => s.updateTask)

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/tasks/${task.id}/comments`)
      if (!res.ok) return
      const data = await res.json()
      if (Array.isArray(data)) setComments(data)
    } catch {}
  }, [task.id])

  useEffect(() => { fetchComments() }, [fetchComments])

  const handleAddComment = async () => {
    if (!newComment.trim()) return
    setSendingComment(true)
    try {
      const res = await fetch(`/api/tasks/${task.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_id: commentAs, content: newComment.trim() }),
      })
      if (!res.ok) throw new Error()
      const comment = await res.json()
      setComments((prev) => [...prev, comment])
      setNewComment('')
    } catch {
      toast.error('Failed to add comment')
    } finally {
      setSendingComment(false)
    }
  }

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
      <div className="relative bg-card border border-border rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] sm:max-h-[90vh] h-full sm:h-auto overflow-y-auto">
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

        {/* Comments Section */}
        <div className="border-t border-border p-5 space-y-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Comments ({comments.length})
            </h4>
          </div>

          {comments.length > 0 && (
            <div className="space-y-2.5 max-h-48 overflow-y-auto">
              {comments.map((c) => (
                <div key={c.id} className="flex items-start gap-2">
                  {c.member && <MemberAvatar member={c.member} size="sm" />}
                  <div className="flex-1 min-w-0 bg-muted/50 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">{c.member?.name || 'Unknown'}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(c.created_at).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-foreground mt-0.5">{c.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2">
            <select
              value={commentAs}
              onChange={(e) => setCommentAs(e.target.value)}
              className="h-9 rounded-md border border-border bg-background px-2 text-xs w-28 shrink-0"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            <Input
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddComment() } }}
              className="text-sm h-9"
            />
            <Button
              size="sm"
              onClick={handleAddComment}
              disabled={sendingComment || !newComment.trim()}
              className="h-9 px-3 shrink-0"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
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
