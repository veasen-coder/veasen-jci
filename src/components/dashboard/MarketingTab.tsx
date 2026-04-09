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
  GanttChart,
  CheckCircle2,
  AlertTriangle,
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

interface MarketingTabProps {
  members: Member[]
  canEdit?: boolean
}

export function MarketingTab({ members, canEdit = true }: MarketingTabProps) {
  const [posts, setPosts] = useState<MarketingPost[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState<MarketingCategory | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({})

  const toggleSection = (key: string) => setCollapsedSections((prev) => ({ ...prev, [key]: !prev[key] }))

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

  // Stats
  const today = new Date().toISOString().split('T')[0]
  const festivalPosts = posts.filter((p) => p.category === 'festival')
  const posterPosts = posts.filter((p) => p.category === 'event_poster')
  const promoPosts = posts.filter((p) => p.category === 'club_promotion')
  const totalDone = posts.filter((p) => p.poster_done || p.status === 'posted').length
  const overdue = posts.filter((p) => p.due_date && p.due_date < today && !p.poster_done && p.status !== 'posted').length
  const upcoming = posts.filter((p) => p.due_date && p.due_date >= today && p.due_date <= new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Marketing</h2>
        <p className="text-xs text-muted-foreground mt-1">{posts.length} item{posts.length !== 1 ? 's' : ''} tracked</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard icon={<PartyPopper className="h-4 w-4 text-amber-500" />} label="Festivals" value={festivalPosts.length} sub={`${festivalPosts.filter((p) => p.poster_done).length} done`} />
        <MetricCard icon={<ImageIcon className="h-4 w-4 text-violet-500" />} label="Event Posters" value={posterPosts.length} sub={`${posterPosts.filter((p) => p.poster_done).length} done`} />
        <MetricCard icon={<Film className="h-4 w-4 text-teal-500" />} label="Promotions" value={promoPosts.length} sub={`${promoPosts.filter((p) => p.status === 'posted').length} posted`} />
        <MetricCard
          icon={overdue > 0 ? <AlertTriangle className="h-4 w-4 text-red-500" /> : <CheckCircle2 className="h-4 w-4 text-green-500" />}
          label={overdue > 0 ? 'Overdue' : 'Completed'}
          value={overdue > 0 ? overdue : totalDone}
          sub={upcoming > 0 ? `${upcoming} due this week` : 'All on track'}
          alert={overdue > 0}
        />
      </div>

      {/* Roadmap Timeline */}
      <CollapsibleSection
        title="Roadmap Timeline"
        icon={<GanttChart className="h-4 w-4" />}
        count={posts.filter((p) => p.due_date).length}
        collapsed={collapsedSections['roadmap']}
        onToggle={() => toggleSection('roadmap')}
      >
        <RoadmapTimeline posts={posts} members={members} />
      </CollapsibleSection>

      {/* Festival Dates */}
      <CollapsibleSection
        title="Festival Dates"
        icon={<PartyPopper className="h-4 w-4 text-amber-500" />}
        count={festivalPosts.length}
        collapsed={collapsedSections['festival']}
        onToggle={() => toggleSection('festival')}
        onAdd={canEdit ? () => setShowForm(showForm === 'festival' ? null : 'festival') : undefined}
        accentColor="amber"
      >
        {canEdit && showForm === 'festival' && (
          <CreateForm
            category="festival"
            members={members}
            events={events}
            onSave={(post) => { setPosts((prev) => [post, ...prev]); setShowForm(null); setExpandedId(post.id) }}
            onCancel={() => setShowForm(null)}
          />
        )}
        <FestivalList
          posts={festivalPosts}
          expandedId={expandedId}
          setExpandedId={setExpandedId}
          members={members}
          onToggleDone={togglePosterDone}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          canEdit={canEdit}
        />
      </CollapsibleSection>

      {/* Event Posters */}
      <CollapsibleSection
        title="Event Posters"
        icon={<ImageIcon className="h-4 w-4 text-violet-500" />}
        count={posterPosts.length}
        collapsed={collapsedSections['event_poster']}
        onToggle={() => toggleSection('event_poster')}
        onAdd={canEdit ? () => setShowForm(showForm === 'event_poster' ? null : 'event_poster') : undefined}
        accentColor="violet"
      >
        {canEdit && showForm === 'event_poster' && (
          <CreateForm
            category="event_poster"
            members={members}
            events={events}
            onSave={(post) => { setPosts((prev) => [post, ...prev]); setShowForm(null); setExpandedId(post.id) }}
            onCancel={() => setShowForm(null)}
          />
        )}
        <EventPosterList
          posts={posterPosts}
          events={events}
          expandedId={expandedId}
          setExpandedId={setExpandedId}
          members={members}
          onToggleDone={togglePosterDone}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          canEdit={canEdit}
        />
      </CollapsibleSection>

      {/* Club Promotion */}
      <CollapsibleSection
        title="Club Promotion"
        icon={<Film className="h-4 w-4 text-teal-500" />}
        count={promoPosts.length}
        collapsed={collapsedSections['club_promotion']}
        onToggle={() => toggleSection('club_promotion')}
        onAdd={canEdit ? () => setShowForm(showForm === 'club_promotion' ? null : 'club_promotion') : undefined}
        accentColor="teal"
      >
        {canEdit && showForm === 'club_promotion' && (
          <CreateForm
            category="club_promotion"
            members={members}
            events={events}
            onSave={(post) => { setPosts((prev) => [post, ...prev]); setShowForm(null); setExpandedId(post.id) }}
            onCancel={() => setShowForm(null)}
          />
        )}
        <ClubPromotionList
          posts={promoPosts}
          expandedId={expandedId}
          setExpandedId={setExpandedId}
          members={members}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          canEdit={canEdit}
        />
      </CollapsibleSection>
    </div>
  )
}

/* ============= METRIC CARD ============= */
function MetricCard({ icon, label, value, sub, alert }: { icon: React.ReactNode; label: string; value: number; sub: string; alert?: boolean }) {
  return (
    <div className={`rounded-xl border bg-card p-4 ${alert ? 'border-red-200' : 'border-border'}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${alert ? 'text-red-600' : ''}`}>{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
    </div>
  )
}

/* ============= COLLAPSIBLE SECTION ============= */
function CollapsibleSection({
  title,
  icon,
  count,
  collapsed,
  onToggle,
  onAdd,
  children,
}: {
  title: string
  icon: React.ReactNode
  count: number
  collapsed: boolean
  onToggle: () => void
  onAdd?: () => void
  accentColor?: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/20">
        <button onClick={onToggle} className="flex items-center gap-2 hover:opacity-70 transition-opacity">
          {collapsed ? <ChevronRight className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          {icon}
          <span className="text-sm font-semibold uppercase tracking-wide">{title}</span>
          <span className="text-xs text-muted-foreground">({count})</span>
        </button>
        {onAdd && !collapsed && (
          <Button variant="ghost" size="sm" onClick={onAdd} className="gap-1 h-7 text-xs">
            <Plus className="h-3.5 w-3.5" />Add
          </Button>
        )}
      </div>
      {!collapsed && <div className="p-4 space-y-3">{children}</div>}
    </div>
  )
}

/* ============= FESTIVAL LIST ============= */
function FestivalList({
  posts, expandedId, setExpandedId, members, onToggleDone, onUpdate, onDelete, canEdit = true,
}: {
  posts: MarketingPost[]; expandedId: string | null; setExpandedId: (id: string | null) => void
  members: Member[]; onToggleDone: (post: MarketingPost) => void
  onUpdate: (id: string, updates: Partial<MarketingPost>) => void; onDelete: (id: string) => void
  canEdit?: boolean
}) {
  const sorted = [...posts].sort((a, b) => {
    if (!a.due_date) return 1; if (!b.due_date) return -1
    return a.due_date.localeCompare(b.due_date)
  })

  if (sorted.length === 0) return <p className="text-xs text-muted-foreground text-center py-4">No festival dates yet. Click Add to create one.</p>

  return (
    <div className="rounded-lg border border-border divide-y divide-border">
      {sorted.map((post) => {
        const isExpanded = expandedId === post.id
        const today = new Date().toISOString().split('T')[0]
        const isPast = post.due_date && post.due_date < today

        return (
          <div key={post.id} className={isPast && !post.poster_done ? 'opacity-60' : ''}>
            <div className="flex items-center gap-3 px-4 py-3">
              {canEdit ? (
                <button onClick={() => onToggleDone(post)}
                  className={`shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                    post.poster_done ? 'bg-green-500 border-green-500 text-white' : 'border-border hover:border-foreground/40'
                  }`}
                >
                  {post.poster_done && <Check className="h-4 w-4" />}
                </button>
              ) : post.poster_done ? (
                <div className="shrink-0 w-6 h-6 rounded-md bg-green-500 flex items-center justify-center">
                  <Check className="h-4 w-4 text-white" />
                </div>
              ) : (
                <div className="shrink-0 w-6 h-6 rounded-md border-2 border-border" />
              )}
              <div className="w-16 shrink-0 text-center">
                {post.due_date ? (
                  <>
                    <p className="text-[10px] text-muted-foreground">{formatDateKL(post.due_date + 'T00:00:00', 'MMM')}</p>
                    <p className="text-base font-bold leading-tight">{formatDateKL(post.due_date + 'T00:00:00', 'dd')}</p>
                  </>
                ) : <p className="text-xs text-muted-foreground">No date</p>}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${post.poster_done ? 'line-through text-muted-foreground' : ''}`}>{post.title}</p>
                {post.description && <p className="text-xs text-muted-foreground truncate">{post.description}</p>}
              </div>
              {post.content_url && (
                <a href={post.content_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                  className="shrink-0 flex items-center gap-1 text-xs text-blue-600 hover:underline bg-blue-50 px-2 py-1 rounded-md">
                  <ExternalLink className="h-3 w-3" />Canva
                </a>
              )}
              {canEdit && (
                <button onClick={() => setExpandedId(isExpanded ? null : post.id)} className="shrink-0">
                  {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                </button>
              )}
            </div>
            {canEdit && isExpanded && <EditSection post={post} members={members} onUpdate={onUpdate} onDelete={onDelete} />}
          </div>
        )
      })}
    </div>
  )
}

/* ============= EVENT POSTER LIST ============= */
function EventPosterList({
  posts, events, expandedId, setExpandedId, members, onToggleDone, onUpdate, onDelete, canEdit = true,
}: {
  posts: MarketingPost[]; events: Event[]; expandedId: string | null; setExpandedId: (id: string | null) => void
  members: Member[]; onToggleDone: (post: MarketingPost) => void
  onUpdate: (id: string, updates: Partial<MarketingPost>) => void; onDelete: (id: string) => void
  canEdit?: boolean
}) {
  const getEvent = (id: string | null) => events.find((e) => e.id === id)

  if (posts.length === 0) return <p className="text-xs text-muted-foreground text-center py-4">No event posters yet. Click Add to create one.</p>

  return (
    <div className="rounded-lg border border-border divide-y divide-border">
      {posts.map((post) => {
        const isExpanded = expandedId === post.id
        const linkedEvent = getEvent(post.event_id)

        return (
          <div key={post.id}>
            <div className="flex items-center gap-3 px-4 py-3">
              {canEdit ? (
                <button onClick={() => onToggleDone(post)}
                  className={`shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                    post.poster_done ? 'bg-green-500 border-green-500 text-white' : 'border-border hover:border-foreground/40'
                  }`}
                >
                  {post.poster_done && <Check className="h-4 w-4" />}
                </button>
              ) : post.poster_done ? (
                <div className="shrink-0 w-6 h-6 rounded-md bg-green-500 flex items-center justify-center">
                  <Check className="h-4 w-4 text-white" />
                </div>
              ) : (
                <div className="shrink-0 w-6 h-6 rounded-md border-2 border-border" />
              )}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${post.poster_done ? 'line-through text-muted-foreground' : ''}`}>{post.title}</p>
                {linkedEvent && <p className="text-xs text-violet-600">Event: {linkedEvent.title}</p>}
                {post.due_date && <p className="text-xs text-muted-foreground">{formatDateKL(post.due_date + 'T00:00:00', 'dd MMM yyyy')}</p>}
              </div>
              {post.content_url && (
                <a href={post.content_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                  className="shrink-0 flex items-center gap-1 text-xs text-blue-600 hover:underline bg-blue-50 px-2 py-1 rounded-md">
                  <ExternalLink className="h-3 w-3" />Canva
                </a>
              )}
              {canEdit && (
                <button onClick={() => setExpandedId(isExpanded ? null : post.id)} className="shrink-0">
                  {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                </button>
              )}
            </div>
            {canEdit && isExpanded && <EditSection post={post} members={members} events={events} onUpdate={onUpdate} onDelete={onDelete} />}
          </div>
        )
      })}
    </div>
  )
}

/* ============= CLUB PROMOTION LIST ============= */
function ClubPromotionList({
  posts, expandedId, setExpandedId, members, onUpdate, onDelete, canEdit = true,
}: {
  posts: MarketingPost[]; expandedId: string | null; setExpandedId: (id: string | null) => void
  members: Member[]; onUpdate: (id: string, updates: Partial<MarketingPost>) => void; onDelete: (id: string) => void
  canEdit?: boolean
}) {
  const statusColors: Record<MarketingStatus, string> = { draft: 'bg-amber-100 text-amber-700', scheduled: 'bg-blue-100 text-blue-700', posted: 'bg-green-100 text-green-700' }
  const statusLabels: Record<MarketingStatus, string> = { draft: 'Planning', scheduled: 'Scheduled', posted: 'Posted' }
  const getMemberById = (id: string) => members.find((m) => m.id === id)

  if (posts.length === 0) return <p className="text-xs text-muted-foreground text-center py-4">No promotions yet. Click Add to create one.</p>

  return (
    <div className="rounded-lg border border-border divide-y divide-border">
      {posts.map((post) => {
        const isExpanded = expandedId === post.id
        const assignee = post.assigned_to ? getMemberById(post.assigned_to) : null

        return (
          <div key={post.id}>
            <div
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-accent/30 transition-colors cursor-default"
            >
              {canEdit && (
                <button onClick={() => setExpandedId(isExpanded ? null : post.id)} className="shrink-0">
                  {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                </button>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{post.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`rounded-md text-xs font-medium px-2 py-0.5 ${statusColors[post.status]}`}>{statusLabels[post.status]}</span>
                  <span className="text-xs text-muted-foreground">{platformLabels[post.platform]}</span>
                  {post.due_date && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />{formatDateKL(post.due_date + 'T00:00:00', 'dd MMM yyyy')}
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
            </div>
            {canEdit && isExpanded && <EditSection post={post} members={members} onUpdate={onUpdate} onDelete={onDelete} />}
          </div>
        )
      })}
    </div>
  )
}

/* ============= CREATE FORM ============= */
function CreateForm({
  category, members, events, onSave, onCancel,
}: {
  category: MarketingCategory; members: Member[]; events: Event[]
  onSave: (post: MarketingPost) => void; onCancel: () => void
}) {
  const [title, setTitle] = useState('')
  const [startDate, setStartDate] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [description, setDescription] = useState('')
  const [contentUrl, setContentUrl] = useState('')
  const [platform, setPlatform] = useState<MarketingPlatform>('instagram')
  const [assignedTo, setAssignedTo] = useState('')
  const [eventId, setEventId] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const labels = {
    festival: { title: 'New Festival Date', titlePlaceholder: 'e.g. Hari Raya Aidilfitri', dateName: 'Festival Date', startName: 'Start Prep' },
    event_poster: { title: 'New Event Poster', titlePlaceholder: 'e.g. Entrepreneur Talk Poster', dateName: 'Deadline', startName: 'Start Date' },
    club_promotion: { title: 'New Promotion', titlePlaceholder: 'e.g. JCI Youth Recruitment Reel', dateName: 'Post Date', startName: 'Start Date' },
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
          title: title.trim(), category, platform, status: 'draft',
          start_date: startDate || null, due_date: dueDate || null,
          description: description.trim() || null, assigned_to: assignedTo || null,
          content_url: contentUrl.trim() || null, event_id: eventId || null, poster_done: false,
        }),
      })
      if (!res.ok) throw new Error('Failed to create')
      const post = await res.json()
      onSave(post)
      toast.success('Created')
    } catch { toast.error('Failed to create') } finally { setSubmitting(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-violet-200 bg-violet-50/30 p-4 space-y-3 mb-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{l.title}</h3>
        <button type="button" onClick={onCancel}><X className="h-4 w-4 text-muted-foreground" /></button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Title</label>
          <Input placeholder={l.titlePlaceholder} value={title} onChange={(e) => setTitle(e.target.value)} autoFocus required />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">{l.startName}</label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
        <label className="text-xs font-medium text-muted-foreground mb-1 block">{category === 'club_promotion' ? 'Caption / Brief' : 'Notes'}</label>
        <Textarea placeholder={category === 'club_promotion' ? 'Reel concept, caption ideas...' : 'Notes...'} value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="resize-none" />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Canva / Design Link</label>
        <Input type="url" placeholder="https://www.canva.com/design/..." value={contentUrl} onChange={(e) => setContentUrl(e.target.value)} />
      </div>
      <div className="flex items-center gap-2 pt-1">
        <Button type="submit" disabled={submitting || !title.trim()} size="sm">{submitting ? 'Creating...' : 'Create'}</Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  )
}

/* ============= SHARED EDIT SECTION ============= */
function EditSection({
  post, members, events, onUpdate, onDelete,
}: {
  post: MarketingPost; members: Member[]; events?: Event[]
  onUpdate: (id: string, updates: Partial<MarketingPost>) => void; onDelete: (id: string) => void
}) {
  const [title, setTitle] = useState(post.title)
  const [startDate, setStartDate] = useState(post.start_date || '')
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
      title: title.trim(), start_date: startDate || null, due_date: dueDate || null,
      description: description.trim() || null, content_url: contentUrl.trim() || null,
      platform, assigned_to: assignedTo || null, event_id: eventId || null, status,
    })
    setDirty(false)
    toast.success('Updated')
  }

  return (
    <div className="border-t border-border p-4 space-y-3 bg-accent/10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Title</label>
          <Input value={title} onChange={(e) => { setTitle(e.target.value); markDirty() }} className="text-sm" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Start Date</label>
          <Input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); markDirty() }} className="text-sm" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Due Date</label>
          <Input type="date" value={dueDate} onChange={(e) => { setDueDate(e.target.value); markDirty() }} className="text-sm" />
        </div>
      </div>
      {post.category === 'club_promotion' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
            <select value={status} onChange={(e) => { setStatus(e.target.value as MarketingStatus); markDirty() }} className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm">
              <option value="draft">Planning</option><option value="scheduled">Scheduled</option><option value="posted">Posted</option>
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
            className="flex items-center gap-2 rounded-lg bg-blue-50 p-2 text-sm text-blue-700 hover:bg-blue-100 transition-colors mt-2">
            <ExternalLink className="h-4 w-4 shrink-0" /><span className="truncate">Open in Canva</span>
          </a>
        )}
      </div>
      <div className="flex items-center justify-between pt-1">
        {dirty ? <Button size="sm" onClick={handleSave}>Save Changes</Button> : <span className="text-xs text-muted-foreground">No unsaved changes</span>}
        <Button variant="ghost" size="sm" onClick={() => onDelete(post.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-1">
          <Trash2 className="h-3.5 w-3.5" />Delete
        </Button>
      </div>
    </div>
  )
}

/* ============= ROADMAP GANTT TIMELINE ============= */
function RoadmapTimeline({ posts, members }: { posts: MarketingPost[]; members: Member[] }) {
  const timelinePosts = posts.filter((p) => p.due_date)

  if (timelinePosts.length === 0) {
    return (
      <div className="text-center py-6">
        <GanttChart className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-xs text-muted-foreground">Add start & due dates to see the roadmap</p>
      </div>
    )
  }

  const allDates = timelinePosts.flatMap((p) => {
    const dates: number[] = []
    if (p.start_date) dates.push(new Date(p.start_date + 'T00:00:00').getTime())
    if (p.due_date) dates.push(new Date(p.due_date + 'T00:00:00').getTime())
    return dates
  })
  const today = new Date()
  allDates.push(today.getTime())

  const minDate = new Date(Math.min(...allDates))
  const maxDate = new Date(Math.max(...allDates))
  const rangeStart = new Date(minDate.getFullYear(), minDate.getMonth(), 1)
  const rangeEnd = new Date(maxDate.getFullYear(), maxDate.getMonth() + 2, 0)
  const totalDays = Math.ceil((rangeEnd.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24))

  // Month headers
  const months: { label: string; startDay: number; days: number }[] = []
  const cursor = new Date(rangeStart)
  while (cursor <= rangeEnd) {
    const monthStart = new Date(cursor)
    const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0)
    const effectiveEnd = monthEnd > rangeEnd ? rangeEnd : monthEnd
    const startDay = Math.ceil((monthStart.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24))
    const endDay = Math.ceil((effectiveEnd.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24))
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    months.push({ label: `${monthNames[cursor.getMonth()]} ${cursor.getFullYear()}`, startDay, days: endDay - startDay + 1 })
    cursor.setMonth(cursor.getMonth() + 1); cursor.setDate(1)
  }

  // Week markers
  const weeks: number[] = []
  const weekCursor = new Date(rangeStart)
  while (weekCursor.getDay() !== 1) weekCursor.setDate(weekCursor.getDate() + 1)
  while (weekCursor <= rangeEnd) {
    weeks.push(Math.ceil((weekCursor.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24)))
    weekCursor.setDate(weekCursor.getDate() + 7)
  }

  const todayDay = Math.ceil((today.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24))
  const todayPct = (todayDay / totalDays) * 100

  const categoryConfig: Record<MarketingCategory, { label: string; color: string; bgColor: string; barColor: string }> = {
    festival: { label: 'Festival Dates', color: 'text-amber-700', bgColor: 'bg-amber-50', barColor: 'bg-amber-400' },
    event_poster: { label: 'Event Posters', color: 'text-violet-700', bgColor: 'bg-violet-50', barColor: 'bg-violet-400' },
    club_promotion: { label: 'Club Promotion', color: 'text-teal-700', bgColor: 'bg-teal-50', barColor: 'bg-teal-400' },
  }
  const categories: MarketingCategory[] = ['festival', 'event_poster', 'club_promotion']

  const getBarPosition = (post: MarketingPost) => {
    const end = new Date(post.due_date! + 'T00:00:00')
    const start = post.start_date ? new Date(post.start_date + 'T00:00:00') : new Date(end.getTime() - 14 * 86400000)
    const startDay = Math.max(0, Math.ceil((start.getTime() - rangeStart.getTime()) / 86400000))
    const endDay = Math.min(totalDays, Math.ceil((end.getTime() - rangeStart.getTime()) / 86400000))
    return { left: (startDay / totalDays) * 100, width: Math.max(((endDay - startDay) / totalDays) * 100, 1.5) }
  }

  const getMemberById = (id: string) => members.find((m) => m.id === id)

  return (
    <div className="overflow-x-auto -mx-4">
      <div style={{ minWidth: Math.max(700, totalDays * 5) }} className="px-0">
        {/* Month headers */}
        <div className="flex border-b border-border">
          <div className="w-44 shrink-0 px-3 py-2 border-r border-border">
            <span className="text-xs font-medium text-muted-foreground">Activity</span>
          </div>
          <div className="flex-1 relative flex">
            {months.map((month, i) => (
              <div key={i} className="border-r border-border px-1 py-2 text-center" style={{ width: `${(month.days / totalDays) * 100}%` }}>
                <span className="text-[11px] font-semibold text-foreground">{month.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Week sub-headers */}
        <div className="flex border-b border-border">
          <div className="w-44 shrink-0 border-r border-border" />
          <div className="flex-1 relative h-4">
            {weeks.map((day, i) => (
              <div key={i} className="absolute top-0 text-center" style={{ left: `${(day / totalDays) * 100}%`, width: `${(7 / totalDays) * 100}%` }}>
                <span className="text-[9px] text-muted-foreground/50">W{i + 1}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Category rows */}
        {categories.map((cat) => {
          const catPosts = timelinePosts.filter((p) => p.category === cat).sort((a, b) => (a.start_date || a.due_date || '').localeCompare(b.start_date || b.due_date || ''))
          if (catPosts.length === 0) return null
          const config = categoryConfig[cat]

          return (
            <div key={cat}>
              <div className={`flex border-b border-border ${config.bgColor}`}>
                <div className="w-44 shrink-0 px-3 py-1 border-r border-border">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${config.color}`}>{config.label}</span>
                </div>
                <div className="flex-1 relative">
                  {todayPct > 0 && todayPct < 100 && <div className="absolute top-0 bottom-0 w-px bg-red-400 z-10" style={{ left: `${todayPct}%` }} />}
                </div>
              </div>
              {catPosts.map((post) => {
                const bar = getBarPosition(post)
                const assignee = post.assigned_to ? getMemberById(post.assigned_to) : null
                return (
                  <div key={post.id} className="flex border-b border-border hover:bg-accent/20 transition-colors group">
                    <div className="w-44 shrink-0 px-3 py-2 border-r border-border flex items-center gap-1.5 min-h-[40px]">
                      {post.poster_done && (
                        <div className="w-3.5 h-3.5 rounded bg-green-500 flex items-center justify-center shrink-0">
                          <Check className="h-2.5 w-2.5 text-white" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className={`text-[11px] font-medium truncate ${post.poster_done ? 'line-through text-muted-foreground' : ''}`}>{post.title}</p>
                        {post.due_date && (
                          <p className="text-[9px] text-muted-foreground">
                            {post.start_date && `${formatDateKL(post.start_date + 'T00:00:00', 'MMM dd')} - `}
                            {formatDateKL(post.due_date + 'T00:00:00', 'MMM dd')}
                          </p>
                        )}
                      </div>
                      {assignee && <MemberAvatar member={assignee} size="sm" />}
                    </div>
                    <div className="flex-1 relative py-1.5">
                      {weeks.map((day, i) => (<div key={i} className="absolute top-0 bottom-0 border-l border-border/30" style={{ left: `${(day / totalDays) * 100}%` }} />))}
                      {todayPct > 0 && todayPct < 100 && <div className="absolute top-0 bottom-0 w-0.5 bg-red-400 z-10" style={{ left: `${todayPct}%` }} />}
                      <div
                        className={`absolute top-1.5 bottom-1.5 rounded-md ${config.barColor} ${post.poster_done ? 'opacity-50' : 'opacity-90'} shadow-sm transition-all group-hover:opacity-100 group-hover:shadow-md flex items-center justify-center overflow-hidden`}
                        style={{ left: `${bar.left}%`, width: `${bar.width}%` }}
                        title={`${post.title}${post.start_date ? ` | ${post.start_date}` : ''} → ${post.due_date}`}
                      >
                        {bar.width > 8 && <span className="text-[9px] font-semibold text-white truncate px-1.5">{post.title}</span>}
                        <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-2 rotate-45 bg-yellow-400 border border-yellow-500 shadow-sm" />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}

        {/* Legend */}
        <div className="px-3 py-1.5 flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1"><div className="w-3 h-0.5 bg-red-400" /><span className="text-[9px] text-muted-foreground">Today</span></div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rotate-45 bg-yellow-400 border border-yellow-500" /><span className="text-[9px] text-muted-foreground">Due</span></div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-green-500 flex items-center justify-center"><Check className="h-2 w-2 text-white" /></div><span className="text-[9px] text-muted-foreground">Done</span></div>
          {categories.map((cat) => (<div key={cat} className="flex items-center gap-1"><div className={`w-3 h-1.5 rounded-sm ${categoryConfig[cat].barColor}`} /><span className="text-[9px] text-muted-foreground">{categoryConfig[cat].label}</span></div>))}
        </div>
      </div>
    </div>
  )
}

function MarketingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-6 w-32" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (<Skeleton key={i} className="h-24 rounded-xl" />))}
      </div>
      {Array.from({ length: 3 }).map((_, i) => (<Skeleton key={i} className="h-32 rounded-xl" />))}
    </div>
  )
}
