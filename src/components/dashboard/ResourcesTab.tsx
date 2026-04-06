'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Resource, ResourceCategory } from '@/lib/supabase/types'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Plus,
  X,
  ExternalLink,
  Trash2,
  FolderOpen,
  FileText,
  Receipt,
  LayoutTemplate,
  Bookmark,
  ChevronDown,
  ChevronRight,
  Pencil,
  GraduationCap,
} from 'lucide-react'
import { toast } from 'sonner'

const categoryConfig: Record<ResourceCategory, { label: string; description: string; icon: typeof FileText; color: string; bgColor: string }> = {
  intima: {
    label: 'INTIMA Files',
    description: 'INTIMA Week documents, forms, and planning files',
    icon: GraduationCap,
    color: 'text-violet-700',
    bgColor: 'bg-violet-50',
  },
  department: {
    label: 'Department Files',
    description: 'Files organized by each department',
    icon: FolderOpen,
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
  },
  claim: {
    label: 'Claim Files',
    description: 'Reimbursement forms, receipts, and claim documents',
    icon: Receipt,
    color: 'text-green-700',
    bgColor: 'bg-green-50',
  },
  template: {
    label: 'Templates',
    description: 'Reusable document templates and forms',
    icon: LayoutTemplate,
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
  },
  general: {
    label: 'General',
    description: 'Other shared resources and links',
    icon: Bookmark,
    color: 'text-gray-700',
    bgColor: 'bg-gray-50',
  },
}

const allCategories: ResourceCategory[] = ['intima', 'department', 'claim', 'template', 'general']

export function ResourcesTab() {
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({})
  const [searchQuery, setSearchQuery] = useState('')

  const toggleSection = (key: string) => setCollapsedSections((prev) => ({ ...prev, [key]: !prev[key] }))

  const fetchResources = useCallback(async () => {
    try {
      const res = await fetch('/api/resources')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      if (Array.isArray(data)) setResources(data)
    } catch {
      toast.error('Failed to load resources')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchResources() }, [fetchResources])

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/resources/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      setResources((prev) => prev.filter((r) => r.id !== id))
      if (editingId === id) setEditingId(null)
      toast.success('Resource deleted')
    } catch {
      toast.error('Failed to delete')
    }
  }

  const handleUpdate = async (id: string, updates: Partial<Resource>) => {
    try {
      const res = await fetch(`/api/resources/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!res.ok) throw new Error('Failed to update')
      const updated = await res.json()
      setResources((prev) => prev.map((r) => (r.id === id ? updated : r)))
      setEditingId(null)
      toast.success('Updated')
    } catch {
      toast.error('Failed to update')
    }
  }

  if (loading) return <ResourcesSkeleton />

  const filtered = searchQuery.trim()
    ? resources.filter((r) =>
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.description && r.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : resources

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Resources</h2>
          <p className="text-xs text-muted-foreground mt-1">
            {resources.length} resource{resources.length !== 1 ? 's' : ''} shared
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2" disabled={showForm}>
          <Plus className="h-4 w-4" />
          Add Resource
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Input
          placeholder="Search resources..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-4"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Create form */}
      {showForm && (
        <CreateResourceForm
          onSave={(resource) => {
            setResources((prev) => [resource, ...prev])
            setShowForm(false)
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Category sections */}
      {allCategories.map((cat) => {
        const catResources = filtered.filter((r) => r.category === cat)
        const config = categoryConfig[cat]
        const isCollapsed = collapsedSections[cat]
        const Icon = config.icon

        return (
          <div key={cat} className="rounded-xl border border-border bg-card overflow-hidden">
            {/* Category header */}
            <button
              onClick={() => toggleSection(cat)}
              className={`w-full flex items-center justify-between px-4 py-3 border-b border-border ${config.bgColor} hover:opacity-90 transition-opacity`}
            >
              <div className="flex items-center gap-3">
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
                <Icon className={`h-5 w-5 ${config.color}`} />
                <div className="text-left">
                  <span className={`text-sm font-semibold ${config.color}`}>{config.label}</span>
                  <p className="text-[11px] text-muted-foreground">{config.description}</p>
                </div>
              </div>
              <span className="text-xs text-muted-foreground bg-background/60 px-2 py-0.5 rounded-full">
                {catResources.length}
              </span>
            </button>

            {/* Resource items */}
            {!isCollapsed && (
              <div className="divide-y divide-border">
                {catResources.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <Icon className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">
                      No {config.label.toLowerCase()} yet
                    </p>
                  </div>
                ) : (
                  catResources.map((resource) => (
                    <div key={resource.id}>
                      {editingId === resource.id ? (
                        <EditResourceForm
                          resource={resource}
                          onSave={(updates) => handleUpdate(resource.id, updates)}
                          onCancel={() => setEditingId(null)}
                          onDelete={() => handleDelete(resource.id)}
                        />
                      ) : (
                        <div className="flex items-center gap-3 px-4 py-3 group hover:bg-accent/30 transition-colors">
                          <div className={`w-10 h-10 rounded-lg ${config.bgColor} flex items-center justify-center shrink-0`}>
                            <FileText className={`h-5 w-5 ${config.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{resource.title}</p>
                            {resource.description && (
                              <p className="text-xs text-muted-foreground truncate">{resource.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => setEditingId(resource.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-accent"
                            >
                              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                            </button>
                            <a
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              Open
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ============= CREATE FORM ============= */
function CreateResourceForm({
  onSave,
  onCancel,
}: {
  onSave: (resource: Resource) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [category, setCategory] = useState<ResourceCategory>('general')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !url.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          url: url.trim(),
          category,
          description: description.trim() || null,
        }),
      })
      if (!res.ok) throw new Error('Failed to create')
      const resource = await res.json()
      onSave(resource)
      toast.success('Resource added')
    } catch {
      toast.error('Failed to create resource')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-violet-200 bg-violet-50/30 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Add New Resource</h3>
        <button type="button" onClick={onCancel}>
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Title</label>
          <Input
            placeholder="e.g. INTIMA Week Budget Sheet"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            required
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ResourceCategory)}
            className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm"
          >
            {allCategories.map((cat) => (
              <option key={cat} value={cat}>{categoryConfig[cat].label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Link / URL</label>
        <Input
          type="url"
          placeholder="https://drive.google.com/..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
        />
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Description (optional)</label>
        <Textarea
          placeholder="Brief description of this resource..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="resize-none"
        />
      </div>

      <div className="flex items-center gap-2 pt-1">
        <Button type="submit" disabled={submitting || !title.trim() || !url.trim()} size="sm">
          {submitting ? 'Adding...' : 'Add Resource'}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

/* ============= EDIT FORM ============= */
function EditResourceForm({
  resource,
  onSave,
  onCancel,
  onDelete,
}: {
  resource: Resource
  onSave: (updates: Partial<Resource>) => void
  onCancel: () => void
  onDelete: () => void
}) {
  const [title, setTitle] = useState(resource.title)
  const [url, setUrl] = useState(resource.url)
  const [category, setCategory] = useState<ResourceCategory>(resource.category)
  const [description, setDescription] = useState(resource.description || '')

  const handleSave = () => {
    if (!title.trim() || !url.trim()) return
    onSave({
      title: title.trim(),
      url: url.trim(),
      category,
      description: description.trim() || null,
    })
  }

  return (
    <div className="p-4 space-y-3 bg-accent/10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Title</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} className="text-sm" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ResourceCategory)}
            className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm"
          >
            {allCategories.map((cat) => (
              <option key={cat} value={cat}>{categoryConfig[cat].label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Link / URL</label>
        <Input type="url" value={url} onChange={(e) => setUrl(e.target.value)} className="text-sm" />
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Description</label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="resize-none text-sm"
        />
      </div>

      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleSave} disabled={!title.trim() || !url.trim()}>
            Save
          </Button>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        </div>
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

function ResourcesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-9 w-32" />
      </div>
      <Skeleton className="h-10 rounded-md" />
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-40 rounded-xl" />
      ))}
    </div>
  )
}
