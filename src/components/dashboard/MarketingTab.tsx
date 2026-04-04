'use client'

import { useState, useEffect, useCallback } from 'react'
import type { MarketingPost, MarketingPlatform, MarketingStatus, MarketingCategory, Member, Event } from '@/lib/supabase/types'
import { MemberAvatar } from '@/components/shared/MemberAvatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { formatDateKL } from '@/lib/utils/dateHelpers'
import {
  Plus,
  X,
  Calendar,
  Trash2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Check,
  PartyPopper,
  Image as ImageIcon,
  Film,
} from 'lucide-react'
import { toast } from 'sonner'

const platformLabels: Record<MarketingPlatform, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  tiktok: 'TikTok',
  twitter: 'Twitter',
  linkedin: 'LinkedIn',
  other: 'Other',
}

const allPlatforms: MarketingPlatform[] = ['instagram', 'facebook', 'tiktok', 'twitter', 'linkedin', 'other']

const sectionTabs = [
  { id: 'festival' as MarketingCategory, label: 'Festival Dates', icon: PartyPopper },
  { id: 'event_poster' as MarketingCategory, label: 'Event Posters', icon: ImageIcon },
  { id: 'club_promotion' as MarketingCategory, label: 'Club Promotion', icon: Film },
]

interface MarketingTabProps {
  members: Member[]
}

export function MarketingTab({ members }: MarketingTabProps) {
  const [posts, setPosts] = useState<MarketingPost[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<MarketingCategory>('festival')

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch('/api/marketing')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      if (Array.isArray(data)) setPosts(data)
    } catch {
      toast.error('Failed to load marketing posts')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPosts()
    fetch('/api/events')
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setEvents(data) })
      .catch(() => {})
  }, [fetchPosts])

  const sectionPosts = posts.filter((p) => p.category === activeSection)

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/marketing/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      setPosts((prev) => prev.filter((p) => p.id !== id))
      if (expandedId === id) setExpandedId(null)
      toast.success('Deleted')
    } catch {
      toast.error('Failed to delete')
    }
  }

  const handleUpdate = async (id: string, updates: Partial<MarketingPost>) => {
    try {
      const res = await fetch(`/api/marketing/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!res.ok) throw new Error('Failed to update')
      const updated = await res.json()
      setPosts((prev) => prev.map((p) => (p.id === id ? updated : p)))
    } catch {
      toast.error('Failed to update')
    }
  }

  const togglePosterDone = async (post: MarketingPost) => {
    await handleUpdate(post.id, { poster_done: !post.poster_done })
  }

  if (loading) return <MarketingSkeleton />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Marketing</h2>
          <p className="text-xs text-muted-foreground mt-1">{posts.length} item{posts.length !== 1 ? 's' : ''} tracked</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2" disabled={showForm}>
          <Plus className="h-4 w-4" />
          Add New
        </Button>
      </div>

      {/* Section tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {sectionTabs.map((tab) => {
          const count = posts.filter((p) => p.category === tab.id).length
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-150 whitespace-nowrap shrink-0 ${
                activeSection === tab.id
                  ? 'bg-foreground text-background'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {count > 0 && <span className="text-xs opacity-70">({count})</span>}
            </button>
          )
        })}
      </div>

      {/* Create form */}
      {showForm && (
        <CreateForm
          category={activeSection}
          members={members}
          events={events}
          onSave={(post) => {
            setPosts((prev) => [post, ...prev])
            setShowForm(false)
            setExpandedId(post.id)
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Section content */}
      {activeSection === 'festival' && (
        <FestivalSection
          posts={sectionPosts}
          expandedId={expandedId}
          setExpandedId={setExpandedId}
          members={members}
          onToggleDone={togglePosterDone}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          showForm={showForm}
          onShowForm={() => setShowForm(true)}
        />
      )}

      {activeSection === 'event_poster' && (
        <EventPosterSection
          posts={sectionPosts}
          events={events}
          expandedId={expandedId}
          setExpandedId={setExpandedId}
          members={members}
          onToggleDone={togglePosterDone}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          showForm={showForm}
          onShowForm={() => setShowForm(true)}
        />
      )}

      {activeSection === 'club_promotion' && (
        <ClubPromotionSection
          posts={sectionPosts}
          expandedId={expandedId}
          setExpandedId={setExpandedId}
          members={members}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          showForm={showForm}
          onShowForm={() => setShowForm(true)}
        />
      )}
    </div>
  )
}

/* ============= FESTIVAL DATES SECTION ============= */
function FestivalSection({
  posts,
  expandedId,
  setExpandedId,
  members,
  onToggleDone,
  onUpdate,
  onDelete,
  showForm,
  onShowForm,
}: {
  posts: MarketingPost[]
  expandedId: string | null
  setExpandedId: (id: string | null) => void
  members: Member[]
  onToggleDone: (post: MarketingPost) => void
  onUpdate: (id: string, updates: Partial<MarketingPost>) => void
  onDelete: (id: string) => void
  showForm: boolean
  onShowForm: () => void
}) {
  const sorted = [...posts].sort((a, b) => {
    if (!a.due_date) return 1
    if (!b.due_date) return -1
    return a.due_date.localeCompare(b.due_date)
  })

  if (sorted.length === 0 && !showForm) {
    return (
      <div className="rounded-xl border border-border bg-card p-12 text-center">
        <PartyPopper className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No festival dates yet</p>
        <p className="text-xs text-muted-foreground mt-1">Add festivals like CNY, Hari Raya, Christmas with their poster status</p>
        <Button variant="outline" size="sm" className="mt-3 gap-2" onClick={onShowForm}>
          <Plus className="h-4 w-4" />Add festival date
        </Button>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card divide-y divide-border">
      {sorted.map((post) => {
        const isExpanded = expandedId === post.id
        const today = new Date().toISOString().split('T')[0]
        const isPast = post.due_date && post.due_date < today

        return (
          <div key={post.id} className={isPast && !post.poster_done ? 'opacity-60' : ''}>
            <div className="flex items-center gap-3 px-4 py-3">
              {/* Poster done checkbox */}
              <button
                onClick={() => onToggleDone(post)}
                className={`shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                  post.poster_done
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'border-border hover:border-foreground/40'
                }`}
              >
                {post.poster_done && <Check className="h-4 w-4" />}
              </button>

              {/* Date */}
              <div className="w-20 shrink-0 text-center">
                {post.due_date ? (
                  <>
                    <p className="text-xs text-muted-foreground">{formatDateKL(post.due_date + 'T00:00:00', 'MMM')}</p>
                    <p className="text-lg font-bold leading-tight">{formatDateKL(post.due_date + 'T00:00:00', 'dd')}</p>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">No date</p>
                )}
              </div>

              {/* Title */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${post.poster_done ? 'line-through text-muted-foreground' : ''}`}>
                  {post.title}
                </p>
                {post.description && (
                  <p className="text-xs text-muted-foreground truncate">{post.description}</p>
                )}
              </div>

              {/* Canva link */}
              {post.content_url && (
                <a
                  href={post.content_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="shrink-0 flex items-center gap-1 text-xs text-blue-600 hover:underline bg-blue-50 px-2 py-1 rounded-md"
                >
                  <ExternalLink className="h-3 w-3" />
                  Canva
                </a>
              )}

              {/* Expand */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : post.id)}
                className="shrink-0"
              >
                {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
              </button>
            </div>

            {isExpanded && (
              <EditSection post={post} members={members} onUpdate={onUpdate} onDelete={onDelete} />
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ============= EVENT POSTERS SECTION ============= */
function EventPosterSection({
  posts,
  events,
  expandedId,
  setExpandedId,
  members,
  onToggleDone,
  onUpdate,
  onDelete,
  showForm,
  onShowForm,
}: {
  posts: MarketingPost[]
  events: Event[]
  expandedId: string | null
  setExpandedId: (id: string | null) => void
  members: Member[]
  onToggleDone: (post: MarketingPost) => void
  onUpdate: (id: string, updates: Partial<MarketingPost>) => void
  onDelete: (id: string) => void
  showForm: boolean
  onShowForm: () => void
}) {
  const getEvent = (id: string | null) => events.find((e) => e.id === id)

  if (posts.length === 0 && !showForm) {
    return (
      <div className="rounded-xl border border-border bg-card p-12 text-center">
        <ImageIcon className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No event posters yet</p>
        <p className="text-xs text-muted-foreground mt-1">Track poster designs for your JCI events</p>
        <Button variant="outline" size="sm" className="mt-3 gap-2" onClick={onShowForm}>
          <Plus className="h-4 w-4" />Add event poster
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {posts.map((post) => {
        const isExpanded = expandedId === post.id
        const linkedEvent = getEvent(post.event_id)

        return (
          <div key={post.id} className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3">
              <button
                onClick={() => onToggleDone(post)}
                className={`shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                  post.poster_done
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'border-border hover:border-foreground/40'
                }`}
              >
                {post.poster_done && <Check className="h-4 w-4" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${post.poster_done ? 'line-through text-muted-foreground' : ''}`}>{post.title}</p>
                {linkedEvent && (
                  <p className="text-xs text-violet-600">Event: {linkedEvent.title}</p>
                )}
              </div>
              {post.content_url && (
                <a href={post.content_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                  className="shrink-0 flex items-center gap-1 text-xs text-blue-600 hover:underline bg-blue-50 px-2 py-1 rounded-md">
                  <ExternalLink className="h-3 w-3" />Canva
                </a>
              )}
              <button onClick={() => setExpandedId(isExpanded ? null : post.id)} className="shrink-0">
                {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
              </button>
            </div>
            {isExpanded && <EditSection post={post} members={members} events={events} onUpdate={onUpdate} onDelete={onDelete} />}
          </div>
        )
      })}
    </div>
  )
}

/* ============= CLUB PROMOTION SECTION ============= */
function ClubPromotionSection({
  posts,
  expandedId,
  setExpandedId,
  members,
  onUpdate,
  onDelete,
  showForm,
  onShowForm,
}: {
  posts: MarketingPost[]
  expandedId: string | null
  setExpandedId: (id: string | null) => void
  members: Member[]
  onUpdate: (id: string, updates: Partial<MarketingPost>) => void
  onDelete: (id: string) => void
  showForm: boolean
  onShowForm: () => void
}) {
  const statusColors: Record<MarketingStatus, string> = {
    draft: 'bg-amber-100 text-amber-700',
    scheduled: 'bg-blue-100 text-blue-700',
    posted: 'bg-green-100 text-green-700',
  }

  const statusLabels: Record<MarketingStatus, string> = {
    draft: 'Planning',
    scheduled: 'Scheduled',
    posted: 'Posted',
  }

  const getMemberById = (id: string) => members.find((m) => m.id === id)

  if (posts.length === 0 && !showForm) {
    return (
      <div className="rounded-xl border border-border bg-card p-12 text-center">
        <Film className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No promotions yet</p>
        <p className="text-xs text-muted-foreground mt-1">Plan reels, stories, and promotional content for club awareness</p>
        <Button variant="outline" size="sm" className="mt-3 gap-2" onClick={onShowForm}>
          <Plus className="h-4 w-4" />Add promotion
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {posts.map((post) => {
        const isExpanded = expandedId === post.id
        const assignee = post.assigned_to ? getMemberById(post.assigned_to) : null

        return (
          <div key={post.id} className="rounded-xl border border-border bg-card overflow-hidden">
            <button
              onClick={() => setExpandedId(isExpanded ? null : post.id)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-accent/30 transition-colors"
            >
              {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{post.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`rounded-md text-xs font-medium px-2 py-0.5 ${statusColors[post.status]}`}>
                    {statusLabels[post.status]}
                  </span>
                  <span className="text-xs text-muted-foreground">{platformLabels[post.platform]}</span>
                  {post.due_date && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDateKL(post.due_date + 'T00:00:00', 'dd MMM yyyy')}
                    </span>
                  )}
                </div>
              </div>
              {post.content_url && (
                <a href={post.content_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                  className="shrink-0 flex items-center gap-1 text-xs text-blue-600 hover:underline bg-blue-50 px-2 py-1 rounded-md">
                  <ExternalLink className="h-3 w-3" />Canva
                </a>
              )}
              {assignee && <MemberAvatar member={assignee} size="sm" />}
            </button>
            {isExpanded && <EditSection post={post} members={members} onUpdate={onUpdate} onDelete={onDelete} />}
          </div>
        )
      })}
    </div>
  )
}

/* ============= CREATE FORM ============= */
function CreateForm({
  category,
  members,
  events,
  onSave,
  onCancel,
}: {
  category: MarketingCategory
  members: Member[]
  events: Event[]
  onSave: (post: MarketingPost) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [description, setDescription] = useState('')
  const [contentUrl, setContentUrl] = useState('')
  const [platform, setPlatform] = useState<MarketingPlatform>('instagram')
  const [assignedTo, setAssignedTo] = useState('')
  const [eventId, setEventId] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const labels = {
    festival: { title: 'New Festival Date', titlePlaceholder: 'e.g. Hari Raya Aidilfitri', dateName: 'Festival Date' },
    event_poster: { title: 'New Event Poster', titlePlaceholder: 'e.g. Entrepreneur Talk Poster', dateName: 'Deadline' },
    club_promotion: { title: 'New Promotion', titlePlaceholder: 'e.g. JCI Youth Recruitment Reel', dateName: 'Post Date' },
  }
  const l = labels[category]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/marketing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          category,
          platform,
          status: 'draft',
          due_date: dueDate || null,
          description: description.trim() || null,
          assigned_to: assignedTo || null,
          content_url: contentUrl.trim() || null,
          event_id: eventId || null,
          poster_done: false,
        }),
      })
      if (!res.ok) throw new Error('Failed to create')
      const post = await res.json()
      onSave(post)
      toast.success('Created')
    } catch {
      toast.error('Failed to create')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-violet-200 bg-violet-50/30 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{l.title}</h3>
        <button type="button" onClick={onCancel}><X className="h-4 w-4 text-muted-foreground" /></button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Title</label>
          <Input placeholder={l.titlePlaceholder} value={title} onChange={(e) => setTitle(e.target.value)} autoFocus required />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">{l.dateName}</label>
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
      </div>

      {category === 'event_poster' && (
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Linked Event</label>
          <select value={eventId} onChange={(e) => setEventId(e.target.value)} className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm">
            <option value="">No event</option>
            {events.map((ev) => (<option key={ev.id} value={ev.id}>{ev.title}</option>))}
          </select>
        </div>
      )}

      {category === 'club_promotion' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Platform</label>
            <select value={platform} onChange={(e) => setPlatform(e.target.value as MarketingPlatform)} className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm">
              {allPlatforms.map((p) => (<option key={p} value={p}>{platformLabels[p]}</option>))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Assigned To</label>
            <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm">
              <option value="">Unassigned</option>
              {members.map((m) => (<option key={m.id} value={m.id}>{m.name}</option>))}
            </select>
          </div>
        </div>
      )}

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">
          {category === 'club_promotion' ? 'Caption / Brief' : 'Notes'}
        </label>
        <Textarea placeholder={category === 'club_promotion' ? 'Reel concept, caption ideas...' : 'Notes...'} value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="resize-none" />
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Canva / Design Link</label>
        <Input type="url" placeholder="https://www.canva.com/design/..." value={contentUrl} onChange={(e) => setContentUrl(e.target.value)} />
      </div>

      <div className="flex items-center gap-2 pt-2">
        <Button type="submit" disabled={submitting || !title.trim()}>
          {submitting ? 'Creating...' : 'Create'}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  )
}

/* ============= SHARED EDIT SECTION ============= */
function EditSection({
  post,
  members,
  events,
  onUpdate,
  onDelete,
}: {
  post: MarketingPost
  members: Member[]
  events?: Event[]
  onUpdate: (id: string, updates: Partial<MarketingPost>) => void
  onDelete: (id: string) => void
}) {
  const [title, setTitle] = useState(post.title)
  const [dueDate, setDueDate] = useState(post.due_date || '')
  const [description, setDescription] = useState(post.description || '')
  const [contentUrl, setContentUrl] = useState(post.content_url || '')
  const [platform, setPlatform] = useState<MarketingPlatform>(post.platform)
  const [assignedTo, setAssignedTo] = useState(post.assigned_to || '')
  const [eventId, setEventId] = useState(post.event_id || '')
  const [status, setStatus] = useState<MarketingStatus>(post.status)
  const [dirty, setDirty] = useState(false)
  const markDirty = () => setDirty(true)

  const handleSave = () => {
    onUpdate(post.id, {
      title: title.trim(),
      due_date: dueDate || null,
      description: description.trim() || null,
      content_url: contentUrl.trim() || null,
      platform,
      assigned_to: assignedTo || null,
      event_id: eventId || null,
      status,
    })
    setDirty(false)
    toast.success('Updated')
  }

  return (
    <div className="border-t border-border p-4 space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Title</label>
          <Input value={title} onChange={(e) => { setTitle(e.target.value); markDirty() }} className="text-sm" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Date</label>
          <Input type="date" value={dueDate} onChange={(e) => { setDueDate(e.target.value); markDirty() }} className="text-sm" />
        </div>
      </div>

      {post.category === 'club_promotion' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
            <select value={status} onChange={(e) => { setStatus(e.target.value as MarketingStatus); markDirty() }} className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm">
              <option value="draft">Planning</option>
              <option value="scheduled">Scheduled</option>
              <option value="posted">Posted</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Platform</label>
            <select value={platform} onChange={(e) => { setPlatform(e.target.value as MarketingPlatform); markDirty() }} className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm">
              {allPlatforms.map((p) => (<option key={p} value={p}>{platformLabels[p]}</option>))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Assigned To</label>
            <select value={assignedTo} onChange={(e) => { setAssignedTo(e.target.value); markDirty() }} className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm">
              <option value="">Unassigned</option>
              {members.map((m) => (<option key={m.id} value={m.id}>{m.name}</option>))}
            </select>
          </div>
        </div>
      )}

      {post.category === 'event_poster' && events && (
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Linked Event</label>
          <select value={eventId} onChange={(e) => { setEventId(e.target.value); markDirty() }} className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm">
            <option value="">No event</option>
            {events.map((ev) => (<option key={ev.id} value={ev.id}>{ev.title}</option>))}
          </select>
        </div>
      )}

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Notes</label>
        <Textarea value={description} onChange={(e) => { setDescription(e.target.value); markDirty() }} rows={2} className="resize-none text-sm" />
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Canva / Design Link</label>
        <Input type="url" value={contentUrl} onChange={(e) => { setContentUrl(e.target.value); markDirty() }} placeholder="https://www.canva.com/design/..." className="text-sm" />
        {post.content_url && (
          <a href={post.content_url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg bg-blue-50 p-2.5 text-sm text-blue-700 hover:bg-blue-100 transition-colors mt-2">
            <ExternalLink className="h-4 w-4 shrink-0" /><span className="truncate">Open in Canva</span>
          </a>
        )}
      </div>

      <div className="flex items-center justify-between pt-2">
        {dirty ? (
          <Button size="sm" onClick={handleSave}>Save Changes</Button>
        ) : (
          <span className="text-xs text-muted-foreground">No unsaved changes</span>
        )}
        <Button variant="ghost" size="sm" onClick={() => onDelete(post.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-1">
          <Trash2 className="h-3.5 w-3.5" />Delete
        </Button>
      </div>
    </div>
  )
}

function MarketingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-9 w-28" />
      </div>
      <div className="flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (<Skeleton key={i} className="h-10 w-36 rounded-full" />))}
      </div>
      {Array.from({ length: 4 }).map((_, i) => (<Skeleton key={i} className="h-16 rounded-xl" />))}
    </div>
  )
}
