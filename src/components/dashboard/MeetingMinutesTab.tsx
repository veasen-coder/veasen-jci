'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Member, MeetingMinutes, ActionItem, Attachment } from '@/lib/supabase/types'
import { MemberAvatar } from '@/components/shared/MemberAvatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { formatDateKL } from '@/lib/utils/dateHelpers'
import {
  Plus,
  X,
  FileText,
  Calendar,
  Users,
  Paperclip,
  Trash2,
  ChevronDown,
  ChevronRight,
  CheckSquare,
  Square,
  Upload,
} from 'lucide-react'
import { toast } from 'sonner'

interface MeetingMinutesTabProps {
  members: Member[]
}

export function MeetingMinutesTab({ members }: MeetingMinutesTabProps) {
  const [meetings, setMeetings] = useState<MeetingMinutes[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const fetchMeetings = useCallback(async () => {
    try {
      const res = await fetch('/api/meetings')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setMeetings(data)
    } catch {
      toast.error('Failed to load meeting minutes')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMeetings()
  }, [fetchMeetings])

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/meetings/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      setMeetings((prev) => prev.filter((m) => m.id !== id))
      if (expandedId === id) setExpandedId(null)
      toast.success('Meeting deleted')
    } catch {
      toast.error('Failed to delete meeting')
    }
  }

  const getMemberById = (id: string) => members.find((m) => m.id === id)

  if (loading) return <MeetingsSkeleton />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
            Meeting Minutes
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {meetings.length} meeting{meetings.length !== 1 ? 's' : ''} recorded
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2" disabled={showForm}>
          <Plus className="h-4 w-4" />
          New Meeting
        </Button>
      </div>

      {showForm && (
        <MeetingForm
          members={members}
          onSave={(meeting) => {
            setMeetings((prev) => [meeting, ...prev])
            setShowForm(false)
            setExpandedId(meeting.id)
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {meetings.length === 0 && !showForm ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <FileText className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No meeting minutes yet</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3 gap-2"
            onClick={() => setShowForm(true)}
          >
            <Plus className="h-4 w-4" />
            Record your first meeting
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {meetings.map((meeting) => {
            const isExpanded = expandedId === meeting.id
            const attendees = meeting.attendee_ids
              .map(getMemberById)
              .filter(Boolean) as Member[]

            return (
              <div
                key={meeting.id}
                className="rounded-xl border border-border bg-card overflow-hidden"
              >
                {/* Header row */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : meeting.id)}
                  className="w-full flex items-center gap-4 p-4 text-left hover:bg-accent/30 transition-colors duration-150"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{meeting.title}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDateKL(meeting.meeting_date + 'T00:00:00', 'dd MMM yyyy')}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {attendees.length} attendee{attendees.length !== 1 ? 's' : ''}
                      </span>
                      {meeting.attachments.length > 0 && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Paperclip className="h-3 w-3" />
                          {meeting.attachments.length}
                        </span>
                      )}
                      {meeting.action_items.length > 0 && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <CheckSquare className="h-3 w-3" />
                          {meeting.action_items.filter((a: ActionItem) => a.done).length}/{meeting.action_items.length}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex -space-x-2">
                    {attendees.slice(0, 4).map((m) => (
                      <MemberAvatar key={m.id} member={m} size="sm" />
                    ))}
                    {attendees.length > 4 && (
                      <span className="w-6 h-6 rounded-full bg-muted text-xs flex items-center justify-center font-medium">
                        +{attendees.length - 4}
                      </span>
                    )}
                  </div>
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <MeetingDetail
                    meeting={meeting}
                    members={members}
                    getMemberById={getMemberById}
                    onUpdate={(updated) => {
                      setMeetings((prev) =>
                        prev.map((m) => (m.id === updated.id ? updated : m))
                      )
                    }}
                    onDelete={() => handleDelete(meeting.id)}
                  />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function MeetingForm({
  members,
  onSave,
  onCancel,
}: {
  members: Member[]
  onSave: (meeting: MeetingMinutes) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState('')
  const [meetingDate, setMeetingDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([])
  const [agenda, setAgenda] = useState('')
  const [notes, setNotes] = useState('')
  const [googleDocsUrl, setGoogleDocsUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const toggleAttendee = (id: string) => {
    setSelectedAttendees((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          meeting_date: meetingDate,
          attendee_ids: selectedAttendees,
          agenda: agenda.trim() || null,
          notes: notes.trim() || null,
          google_docs_url: googleDocsUrl.trim() || null,
          action_items: [],
          attachments: [],
        }),
      })
      if (!res.ok) throw new Error('Failed to create')
      const meeting = await res.json()
      onSave(meeting)
      toast.success('Meeting created')
    } catch {
      toast.error('Failed to create meeting')
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
        <h3 className="text-sm font-semibold">New Meeting</h3>
        <button type="button" onClick={onCancel}>
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">
            Title
          </label>
          <Input
            placeholder="e.g. Weekly Board Meeting"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            required
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">
            Date
          </label>
          <Input
            type="date"
            value={meetingDate}
            onChange={(e) => setMeetingDate(e.target.value)}
            required
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-2 block">
          Attendees
        </label>
        <div className="flex flex-wrap gap-2">
          {members.map((member) => (
            <button
              key={member.id}
              type="button"
              onClick={() => toggleAttendee(member.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all duration-150 ${
                selectedAttendees.includes(member.id)
                  ? 'bg-foreground text-background'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              <MemberAvatar member={member} size="sm" />
              {member.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">
          Agenda
        </label>
        <Textarea
          placeholder="Meeting agenda items..."
          value={agenda}
          onChange={(e) => setAgenda(e.target.value)}
          rows={3}
          className="resize-none"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">
          Notes
        </label>
        <Textarea
          placeholder="Meeting notes and discussion points..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="resize-none"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">
          Google Docs Link (optional)
        </label>
        <Input
          type="url"
          placeholder="https://docs.google.com/document/d/..."
          value={googleDocsUrl}
          onChange={(e) => setGoogleDocsUrl(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-2 pt-2">
        <Button type="submit" disabled={submitting || !title.trim()}>
          {submitting ? 'Creating...' : 'Create Meeting'}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

function MeetingDetail({
  meeting,
  members,
  getMemberById,
  onUpdate,
  onDelete,
}: {
  meeting: MeetingMinutes
  members: Member[]
  getMemberById: (id: string) => Member | undefined
  onUpdate: (meeting: MeetingMinutes) => void
  onDelete: () => void
}) {
  const [editingNotes, setEditingNotes] = useState(false)
  const [notes, setNotes] = useState(meeting.notes || '')
  const [editingAgenda, setEditingAgenda] = useState(false)
  const [agenda, setAgenda] = useState(meeting.agenda || '')
  const [editingDocsUrl, setEditingDocsUrl] = useState(false)
  const [docsUrl, setDocsUrl] = useState(meeting.google_docs_url || '')
  const [newActionText, setNewActionText] = useState('')
  const [newActionAssignee, setNewActionAssignee] = useState('')
  const [uploading, setUploading] = useState(false)

  const attendees = meeting.attendee_ids
    .map(getMemberById)
    .filter(Boolean) as Member[]

  const saveField = async (field: string, value: unknown) => {
    try {
      const res = await fetch(`/api/meetings/${meeting.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      })
      if (!res.ok) throw new Error('Failed to update')
      const updated = await res.json()
      onUpdate(updated)
    } catch {
      toast.error('Failed to save changes')
    }
  }

  const toggleActionDone = async (actionId: string) => {
    const updated = meeting.action_items.map((a) =>
      a.id === actionId ? { ...a, done: !a.done } : a
    )
    await saveField('action_items', updated)
  }

  const addActionItem = async () => {
    if (!newActionText.trim()) return
    const item: ActionItem = {
      id: crypto.randomUUID(),
      text: newActionText.trim(),
      assignee_id: newActionAssignee || null,
      done: false,
    }
    const updated = [...meeting.action_items, item]
    await saveField('action_items', updated)
    setNewActionText('')
    setNewActionAssignee('')
  }

  const removeActionItem = async (actionId: string) => {
    const updated = meeting.action_items.filter((a) => a.id !== actionId)
    await saveField('action_items', updated)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('meetingId', meeting.id)

      const res = await fetch('/api/meetings/upload', {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) throw new Error('Failed to upload')
      const { attachment } = await res.json()

      const updated = [...meeting.attachments, attachment]
      await saveField('attachments', updated)
      toast.success(`Uploaded ${file.name}`)
    } catch {
      toast.error('Failed to upload file')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const removeAttachment = async (index: number) => {
    const updated = meeting.attachments.filter((_, i) => i !== index)
    await saveField('attachments', updated)
  }

  return (
    <div className="border-t border-border p-5 space-y-5">
      {/* Attendees */}
      <div>
        <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" /> Attendees
        </h4>
        <div className="flex flex-wrap gap-2">
          {attendees.map((m) => (
            <div key={m.id} className="flex items-center gap-1.5 bg-muted rounded-full px-2.5 py-1 text-xs">
              <MemberAvatar member={m} size="sm" />
              {m.name}
            </div>
          ))}
          {attendees.length === 0 && (
            <span className="text-xs text-muted-foreground">No attendees recorded</span>
          )}
        </div>
      </div>

      {/* Agenda */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" /> Agenda
          </h4>
          <button
            onClick={() => {
              if (editingAgenda) {
                saveField('agenda', agenda.trim() || null)
              }
              setEditingAgenda(!editingAgenda)
            }}
            className="text-xs text-blue-600 hover:underline"
          >
            {editingAgenda ? 'Save' : 'Edit'}
          </button>
        </div>
        {editingAgenda ? (
          <Textarea
            value={agenda}
            onChange={(e) => setAgenda(e.target.value)}
            rows={3}
            className="resize-none text-sm"
            placeholder="Meeting agenda..."
          />
        ) : (
          <p className="text-sm whitespace-pre-wrap rounded-lg bg-muted/50 p-3">
            {meeting.agenda || 'No agenda recorded'}
          </p>
        )}
      </div>

      {/* Notes */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" /> Notes
          </h4>
          <button
            onClick={() => {
              if (editingNotes) {
                saveField('notes', notes.trim() || null)
              }
              setEditingNotes(!editingNotes)
            }}
            className="text-xs text-blue-600 hover:underline"
          >
            {editingNotes ? 'Save' : 'Edit'}
          </button>
        </div>
        {editingNotes ? (
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={5}
            className="resize-none text-sm"
            placeholder="Meeting notes..."
          />
        ) : (
          <p className="text-sm whitespace-pre-wrap rounded-lg bg-muted/50 p-3">
            {meeting.notes || 'No notes recorded'}
          </p>
        )}
      </div>

      {/* Action Items */}
      <div>
        <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
          <CheckSquare className="h-3.5 w-3.5" /> Action Items ({meeting.action_items.length})
        </h4>
        <div className="space-y-2">
          {meeting.action_items.map((item) => {
            const assignee = item.assignee_id ? getMemberById(item.assignee_id) : null
            return (
              <div
                key={item.id}
                className="flex items-center gap-2 group"
              >
                <button onClick={() => toggleActionDone(item.id)}>
                  {item.done ? (
                    <CheckSquare className="h-4 w-4 text-green-600" />
                  ) : (
                    <Square className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
                <span className={`text-sm flex-1 ${item.done ? 'line-through text-muted-foreground' : ''}`}>
                  {item.text}
                </span>
                {assignee && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MemberAvatar member={assignee} size="sm" />
                    {assignee.name}
                  </div>
                )}
                <button
                  onClick={() => removeActionItem(item.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground hover:text-red-600" />
                </button>
              </div>
            )
          })}

          {/* Add action item */}
          <div className="flex items-center gap-2 pt-1">
            <Plus className="h-4 w-4 text-muted-foreground shrink-0" />
            <Input
              placeholder="Add action item..."
              value={newActionText}
              onChange={(e) => setNewActionText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addActionItem()
                }
              }}
              className="h-8 text-sm"
            />
            <select
              value={newActionAssignee}
              onChange={(e) => setNewActionAssignee(e.target.value)}
              className="h-8 rounded-md border border-border bg-background px-2 text-xs"
            >
              <option value="">Assign to...</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={addActionItem}
              disabled={!newActionText.trim()}
              className="h-8 px-2"
            >
              Add
            </Button>
          </div>
        </div>
      </div>

      {/* Google Docs Link */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" /> Google Docs
          </h4>
          <button
            onClick={() => {
              if (editingDocsUrl) {
                saveField('google_docs_url', docsUrl.trim() || null)
              }
              setEditingDocsUrl(!editingDocsUrl)
            }}
            className="text-xs text-blue-600 hover:underline"
          >
            {editingDocsUrl ? 'Save' : 'Edit'}
          </button>
        </div>
        {editingDocsUrl ? (
          <Input
            type="url"
            value={docsUrl}
            onChange={(e) => setDocsUrl(e.target.value)}
            placeholder="https://docs.google.com/document/d/..."
            className="text-sm"
          />
        ) : meeting.google_docs_url ? (
          <a
            href={meeting.google_docs_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg bg-blue-50 p-3 text-sm text-blue-700 hover:bg-blue-100 transition-colors"
          >
            <FileText className="h-4 w-4 shrink-0" />
            <span className="truncate">{meeting.google_docs_url}</span>
          </a>
        ) : (
          <p className="text-sm text-muted-foreground rounded-lg bg-muted/50 p-3">
            No Google Docs link added
          </p>
        )}
      </div>

      {/* Attachments */}
      <div>
        <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
          <Paperclip className="h-3.5 w-3.5" /> Attachments ({meeting.attachments.length})
        </h4>
        <div className="space-y-2">
          {meeting.attachments.map((att: Attachment, i: number) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-lg bg-muted/50 p-2.5 group"
            >
              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                {att.url ? (
                  <a
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-blue-600 hover:underline truncate block"
                  >
                    {att.name}
                  </a>
                ) : (
                  <span className="text-sm font-medium truncate block">{att.name}</span>
                )}
                <p className="text-xs text-muted-foreground">
                  {(att.size / 1024).toFixed(1)} KB &middot; {att.type}
                </p>
              </div>
              <button
                onClick={() => removeAttachment(i)}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-red-600" />
              </button>
            </div>
          ))}

          <label className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors py-2">
            <Upload className="h-4 w-4" />
            {uploading ? 'Uploading...' : 'Upload attachment'}
            <input
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              disabled={uploading}
            />
          </label>
        </div>
      </div>

      {/* Delete */}
      <div className="pt-3 border-t border-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-2"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete meeting
        </Button>
      </div>
    </div>
  )
}

function MeetingsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-9 w-32" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-20 rounded-xl" />
      ))}
    </div>
  )
}
