'use client'

import { useState, useEffect, useCallback } from 'react'
import type { MarketingPost, MarketingPlatform, MarketingStatus, Member } from '@/lib/supabase/types'
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
  Megaphone,
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

const platformColors: Record<MarketingPlatform, string> = {
  instagram: 'bg-pink-100 text-pink-800',
  facebook: 'bg-blue-100 text-blue-800',
  tiktok: 'bg-gray-900 text-white',
  twitter: 'bg-sky-100 text-sky-800',
  linkedin: 'bg-blue-200 text-blue-900',
  other: 'bg-gray-100 text-gray-800',
}

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

const allPlatforms: MarketingPlatform[] = ['instagram', 'facebook', 'tiktok', 'twitter', 'linkedin', 'other']

interface MarketingTabProps {
  members: Member[]
}

export function MarketingTab({ members }: MarketingTabProps) {
  const [posts, setPosts] = useState<MarketingPost[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [platformFilter, setPlatformFilter] = useState<MarketingPlatform | 'all'>('all')

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
  }, [fetchPosts])

  const filteredPosts = platformFilter === 'all'
    ? posts
    : posts.filter((p) => p.platform === platformFilter)

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/marketing/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      setPosts((prev) => prev.filter((p) => p.id !== id))
      if (expandedId === id) setExpandedId(null)
      toast.success('Post deleted')
    } catch {
      toast.error('Failed to delete post')
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
      toast.error('Failed to update post')
    }
  }

  const getMemberById = (id: string) => members.find((m) => m.id === id)

  if (loading) return <MarketingSkeleton />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
            Marketing
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {posts.length} post{posts.length !== 1 ? 's' : ''} tracked
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2" disabled={showForm}>
          <Plus className="h-4 w-4" />
          New Post
        </Button>
      </div>

      {/* Platform filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setPlatformFilter('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 whitespace-nowrap shrink-0 ${
            platformFilter === 'all'
              ? 'bg-foreground text-background'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          All
        </button>
        {allPlatforms.map((p) => {
          const count = posts.filter((post) => post.platform === p).length
          if (count === 0) return null
          return (
            <button
              key={p}
              onClick={() => setPlatformFilter(p)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 whitespace-nowrap shrink-0 ${
                platformFilter === p
                  ? 'bg-foreground text-background'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {platformLabels[p]} ({count})
            </button>
          )
        })}
      </div>

      {showForm && (
        <PostForm
          members={members}
          onSave={(post) => {
            setPosts((prev) => [post, ...prev].sort((a, b) => {
              if (!a.due_date) return 1
              if (!b.due_date) return -1
              return a.due_date.localeCompare(b.due_date)
            }))
            setShowForm(false)
            setExpandedId(post.id)
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {filteredPosts.length === 0 && !showForm ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <Megaphone className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            {platformFilter === 'all' ? 'No marketing posts yet' : `No ${platformLabels[platformFilter]} posts`}
          </p>
          {platformFilter === 'all' && (
            <Button
              variant="outline"
              size="sm"
              className="mt-3 gap-2"
              onClick={() => setShowForm(true)}
            >
              <Plus className="h-4 w-4" />
              Create your first post
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPosts.map((post) => {
            const isExpanded = expandedId === post.id
            const assignee = post.assigned_to ? getMemberById(post.assigned_to) : null

            return (
              <div
                key={post.id}
                className="rounded-xl border border-border bg-card overflow-hidden"
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : post.id)}
                  className="w-full flex items-center gap-4 p-4 text-left hover:bg-accent/30 transition-colors duration-150"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{post.title}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={`rounded-md text-xs font-medium px-2 py-0.5 ${platformColors[post.platform]}`}>
                        {platformLabels[post.platform]}
                      </span>
                      <span className={`rounded-md text-xs font-medium px-2 py-0.5 ${statusColors[post.status]}`}>
                        {statusLabels[post.status]}
                      </span>
                      {post.due_date && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDateKL(post.due_date + 'T00:00:00', 'dd MMM yyyy')}
                        </span>
                      )}
                    </div>
                  </div>
                  {assignee && <MemberAvatar member={assignee} size="sm" />}
                </button>

                {isExpanded && (
                  <PostEditSection
                    post={post}
                    members={members}
                    onUpdate={(updates) => handleUpdate(post.id, updates)}
                    onDelete={() => handleDelete(post.id)}
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

function PostForm({
  members,
  onSave,
  onCancel,
}: {
  members: Member[]
  onSave: (post: MarketingPost) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState('')
  const [platform, setPlatform] = useState<MarketingPlatform>('instagram')
  const [status, setStatus] = useState<MarketingStatus>('draft')
  const [dueDate, setDueDate] = useState('')
  const [description, setDescription] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [contentUrl, setContentUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)

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
          platform,
          status,
          due_date: dueDate || null,
          description: description.trim() || null,
          assigned_to: assignedTo || null,
          content_url: contentUrl.trim() || null,
        }),
      })
      if (!res.ok) throw new Error('Failed to create')
      const post = await res.json()
      onSave(post)
      toast.success('Post created')
    } catch {
      toast.error('Failed to create post')
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
        <h3 className="text-sm font-semibold">New Marketing Post</h3>
        <button type="button" onClick={onCancel}>
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Title</label>
          <Input
            placeholder="e.g. JCI Youth Recruitment Post"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            required
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Platform</label>
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value as MarketingPlatform)}
            className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm"
          >
            {allPlatforms.map((p) => (
              <option key={p} value={p}>{platformLabels[p]}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as MarketingStatus)}
            className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm"
          >
            <option value="draft">Planning</option>
            <option value="scheduled">Scheduled</option>
            <option value="posted">Posted</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Post Date</label>
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Assigned To</label>
          <select
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm"
          >
            <option value="">Unassigned</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Caption / Brief</label>
        <Textarea
          placeholder="Post caption, content brief, or planning notes..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="resize-none"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Canva / Design Link</label>
        <Input
          type="url"
          placeholder="https://www.canva.com/design/..."
          value={contentUrl}
          onChange={(e) => setContentUrl(e.target.value)}
        />
        <p className="text-[10px] text-muted-foreground mt-1">Paste your Canva design link or any content URL</p>
      </div>

      <div className="flex items-center gap-2 pt-2">
        <Button type="submit" disabled={submitting || !title.trim()}>
          {submitting ? 'Creating...' : 'Create Post'}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

function PostEditSection({
  post,
  members,
  onUpdate,
  onDelete,
}: {
  post: MarketingPost
  members: Member[]
  onUpdate: (updates: Partial<MarketingPost>) => void
  onDelete: () => void
}) {
  const [title, setTitle] = useState(post.title)
  const [platform, setPlatform] = useState<MarketingPlatform>(post.platform)
  const [status, setStatus] = useState<MarketingStatus>(post.status)
  const [dueDate, setDueDate] = useState(post.due_date || '')
  const [description, setDescription] = useState(post.description || '')
  const [assignedTo, setAssignedTo] = useState(post.assigned_to || '')
  const [contentUrl, setContentUrl] = useState(post.content_url || '')
  const [dirty, setDirty] = useState(false)

  const markDirty = () => setDirty(true)

  const handleSave = () => {
    onUpdate({
      title: title.trim(),
      platform,
      status,
      due_date: dueDate || null,
      description: description.trim() || null,
      assigned_to: assignedTo || null,
      content_url: contentUrl.trim() || null,
    })
    setDirty(false)
    toast.success('Post updated')
  }

  return (
    <div className="border-t border-border p-5 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Title</label>
          <Input value={title} onChange={(e) => { setTitle(e.target.value); markDirty() }} className="text-sm" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Platform</label>
          <select
            value={platform}
            onChange={(e) => { setPlatform(e.target.value as MarketingPlatform); markDirty() }}
            className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm"
          >
            {allPlatforms.map((p) => (
              <option key={p} value={p}>{platformLabels[p]}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value as MarketingStatus); markDirty() }}
            className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm"
          >
            <option value="draft">Planning</option>
            <option value="scheduled">Scheduled</option>
            <option value="posted">Posted</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Post Date</label>
          <Input type="date" value={dueDate} onChange={(e) => { setDueDate(e.target.value); markDirty() }} className="text-sm" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Assigned To</label>
          <select
            value={assignedTo}
            onChange={(e) => { setAssignedTo(e.target.value); markDirty() }}
            className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm"
          >
            <option value="">Unassigned</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Caption / Brief</label>
        <Textarea value={description} onChange={(e) => { setDescription(e.target.value); markDirty() }} rows={3} className="resize-none text-sm" placeholder="Post caption, content brief, or planning notes..." />
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Canva / Design Link</label>
        <Input type="url" value={contentUrl} onChange={(e) => { setContentUrl(e.target.value); markDirty() }} placeholder="https://www.canva.com/design/..." className="text-sm" />
        {post.content_url && (
          <a
            href={post.content_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg bg-blue-50 p-2.5 text-sm text-blue-700 hover:bg-blue-100 transition-colors mt-2"
          >
            <ExternalLink className="h-4 w-4 shrink-0" />
            <span className="truncate">Open in Canva</span>
          </a>
        )}
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

function MarketingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-9 w-28" />
      </div>
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-full" />
        ))}
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-20 rounded-xl" />
      ))}
    </div>
  )
}
