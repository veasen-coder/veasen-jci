'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from '@hello-pangea/dnd'
import type { Partnership, PartnershipStage } from '@/lib/supabase/types'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Plus,
  X,
  Trash2,
  Handshake,
  Building2,
  Mail,
  Phone,
  Gift,
  FileText,
} from 'lucide-react'
import { toast } from 'sonner'

interface PartnershipsTabProps {
  canEdit?: boolean
}

type ViewId = 'pipeline' | 'current'

const views: { id: ViewId; label: string }[] = [
  { id: 'pipeline', label: 'Pipeline' },
  { id: 'current', label: 'Current Partnerships' },
]

const stageColumns: { id: PartnershipStage; label: string; color: string }[] = [
  { id: 'list', label: 'List', color: 'bg-muted-foreground' },
  { id: 'contacted', label: 'Contacted', color: 'bg-blue-500' },
  { id: 'negotiating', label: 'Negotiating', color: 'bg-amber-500' },
  { id: 'closed', label: 'Closed', color: 'bg-green-500' },
]

export function PartnershipsTab({ canEdit = true }: PartnershipsTabProps) {
  const [partnerships, setPartnerships] = useState<Partnership[]>([])
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState<ViewId>('pipeline')
  const [showForm, setShowForm] = useState<PartnershipStage | null>(null)
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const fetchPartnerships = useCallback(async () => {
    try {
      const res = await fetch('/api/partnerships')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      if (Array.isArray(data)) setPartnerships(data)
    } catch {
      toast.error('Failed to load partnerships')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPartnerships()
  }, [fetchPartnerships])

  const handleUpdate = async (id: string, updates: Partial<Partnership>) => {
    // Optimistic update
    setPartnerships((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)))
    try {
      const res = await fetch(`/api/partnerships/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!res.ok) throw new Error('Failed to update')
      const updated = await res.json()
      setPartnerships((prev) => prev.map((p) => (p.id === id ? updated : p)))
    } catch {
      toast.error('Failed to update')
      fetchPartnerships()
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/partnerships/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      setPartnerships((prev) => prev.filter((p) => p.id !== id))
      if (selectedPartnerId === id) setSelectedPartnerId(null)
      if (expandedId === id) setExpandedId(null)
      toast.success('Deleted')
    } catch {
      toast.error('Failed to delete')
    }
  }

  const handleDragEnd = async (result: DropResult) => {
    const { draggableId, destination } = result
    if (!destination) return

    const newStage = destination.droppableId as PartnershipStage
    const partner = partnerships.find((p) => p.id === draggableId)
    if (!partner || partner.stage === newStage) return

    await handleUpdate(draggableId, { stage: newStage })
  }

  const getColumnPartners = (stage: PartnershipStage) =>
    partnerships.filter((p) => p.stage === stage)

  const currentPartners = partnerships.filter((p) => p.stage === 'closed')
  const selectedPartner = currentPartners.find((p) => p.id === selectedPartnerId) || null

  if (loading) return <PartnershipsSkeleton />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Partnerships</h2>
          <p className="text-xs text-muted-foreground mt-1">
            {partnerships.length} total · {currentPartners.length} active
          </p>
        </div>

        {/* View Switcher */}
        <div className="inline-flex items-center rounded-full bg-muted p-1">
          {views.map((v) => (
            <button
              key={v.id}
              onClick={() => setActiveView(v.id)}
              className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all ${
                activeView === v.id
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pipeline View */}
      {activeView === 'pipeline' && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {stageColumns.map((column) => {
              const columnPartners = getColumnPartners(column.id)
              return (
                <div key={column.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${column.color}`} />
                      <h3 className="text-sm font-medium">{column.label}</h3>
                      <span className="text-xs text-muted-foreground">({columnPartners.length})</span>
                    </div>
                  </div>

                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`min-h-[200px] rounded-xl border border-dashed p-3 space-y-2 transition-colors ${
                          snapshot.isDraggingOver ? 'bg-accent/50 border-accent' : 'bg-muted/20 border-border'
                        }`}
                      >
                        {columnPartners.length === 0 && (
                          <p className="text-xs text-muted-foreground text-center py-8">
                            No partners
                          </p>
                        )}
                        {columnPartners.map((partner, index) => (
                          <Draggable
                            key={partner.id}
                            draggableId={partner.id}
                            index={index}
                            isDragDisabled={!canEdit}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`rounded-xl border border-border bg-card p-3 transition-all ${
                                  snapshot.isDragging ? 'shadow-lg ring-2 ring-ring/20' : ''
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2 mb-1.5">
                                  <p className="text-sm font-semibold flex-1">{partner.name}</p>
                                  {canEdit && (
                                    <button
                                      onClick={() => handleDelete(partner.id)}
                                      className="shrink-0 text-muted-foreground hover:text-red-500 transition-colors"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                </div>
                                {partner.company && (
                                  <p className="text-xs text-muted-foreground truncate mb-2">
                                    {partner.company}
                                  </p>
                                )}
                                {partner.benefits && (
                                  <p className="text-xs text-foreground/70 italic line-clamp-2 mb-2">
                                    {partner.benefits}
                                  </p>
                                )}
                                {partner.notes && (
                                  <p className="text-xs text-muted-foreground line-clamp-2">
                                    {partner.notes}
                                  </p>
                                )}
                                <div className="mt-2 pt-2 border-t border-border/50 text-[10px] text-muted-foreground">
                                  {new Date(partner.created_at).toLocaleDateString('en-GB', {
                                    day: '2-digit',
                                    month: 'short',
                                  })}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>

                  {canEdit && (
                    <>
                      {showForm === column.id ? (
                        <PartnershipForm
                          stage={column.id}
                          onSave={(partner) => {
                            setPartnerships((prev) => [partner, ...prev])
                            setShowForm(null)
                          }}
                          onCancel={() => setShowForm(null)}
                        />
                      ) : (
                        <button
                          onClick={() => setShowForm(column.id)}
                          className="w-full flex items-center gap-1.5 justify-center py-2 text-xs text-muted-foreground hover:text-foreground transition-colors rounded-lg border border-dashed border-border hover:border-foreground/30"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Add partner
                        </button>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </DragDropContext>
      )}

      {/* Current Partnerships View */}
      {activeView === 'current' && (
        <div className="space-y-4">
          {currentPartners.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-12 text-center">
              <Handshake className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No active partnerships yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Move partners to the Closed column in the pipeline to see them here
              </p>
            </div>
          ) : (
            <>
              {/* Partner Selector */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                <button
                  onClick={() => setSelectedPartnerId(null)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap shrink-0 ${
                    selectedPartnerId === null
                      ? 'bg-foreground text-background'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  All ({currentPartners.length})
                </button>
                {currentPartners.map((partner) => (
                  <button
                    key={partner.id}
                    onClick={() => setSelectedPartnerId(partner.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap shrink-0 ${
                      selectedPartnerId === partner.id
                        ? 'bg-foreground text-background'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    <Handshake className="h-3.5 w-3.5" />
                    {partner.name}
                  </button>
                ))}
              </div>

              {/* Selected Partner Detail OR All Grid */}
              {selectedPartner ? (
                <PartnerDetail
                  partner={selectedPartner}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                  canEdit={canEdit}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentPartners.map((partner) => (
                    <button
                      key={partner.id}
                      onClick={() => setSelectedPartnerId(partner.id)}
                      className="rounded-xl border border-border bg-card p-5 text-left hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-100 to-blue-100 dark:from-violet-900/30 dark:to-blue-900/30 flex items-center justify-center shrink-0">
                          <Handshake className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{partner.name}</p>
                          {partner.company && (
                            <p className="text-[11px] text-muted-foreground truncate">{partner.company}</p>
                          )}
                        </div>
                      </div>
                      {partner.benefits && (
                        <p className="text-xs text-foreground/70 line-clamp-3 mt-3">{partner.benefits}</p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

/* ============= PARTNERSHIP FORM ============= */
function PartnershipForm({
  stage,
  onSave,
  onCancel,
}: {
  stage: PartnershipStage
  onSave: (p: Partnership) => void
  onCancel: () => void
}) {
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [benefits, setBenefits] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/partnerships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          company: company.trim() || null,
          benefits: benefits.trim() || null,
          stage,
        }),
      })
      if (!res.ok) throw new Error('Failed')
      const partner = await res.json()
      onSave(partner)
      toast.success('Partner added')
    } catch {
      toast.error('Failed to create partner')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-3 space-y-2">
      <Input
        placeholder="Partner name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoFocus
        required
      />
      <Input
        placeholder="Company (optional)"
        value={company}
        onChange={(e) => setCompany(e.target.value)}
      />
      <Textarea
        placeholder="Potential benefits / what they offer"
        value={benefits}
        onChange={(e) => setBenefits(e.target.value)}
        rows={2}
        className="resize-none text-sm"
      />
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={saving || !name.trim()}>
          {saving ? 'Adding...' : 'Add'}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </form>
  )
}

/* ============= PARTNER DETAIL ============= */
function PartnerDetail({
  partner,
  onUpdate,
  onDelete,
  canEdit,
}: {
  partner: Partnership
  onUpdate: (id: string, updates: Partial<Partnership>) => void
  onDelete: (id: string) => void
  canEdit: boolean
}) {
  const [editing, setEditing] = useState<string | null>(null)
  const [value, setValue] = useState('')

  const startEdit = (field: string, current: string | null) => {
    setEditing(field)
    setValue(current || '')
  }

  const saveEdit = () => {
    if (editing) {
      onUpdate(partner.id, { [editing]: value.trim() || null })
      setEditing(null)
      setValue('')
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border bg-gradient-to-r from-violet-50 to-blue-50 dark:from-violet-950/20 dark:to-blue-950/20">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-card border border-border flex items-center justify-center shrink-0">
              <Handshake className="h-6 w-6 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{partner.name}</h3>
              {partner.company && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Building2 className="h-3 w-3" />
                  {partner.company}
                </p>
              )}
            </div>
          </div>
          {canEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (confirm(`Delete partnership with ${partner.name}?`)) onDelete(partner.id)
              }}
              className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
          )}
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Benefits */}
        <DetailField
          icon={<Gift className="h-4 w-4 text-violet-500" />}
          label="Benefits / What they offer"
          value={partner.benefits}
          field="benefits"
          editing={editing}
          editValue={value}
          setEditValue={setValue}
          startEdit={startEdit}
          saveEdit={saveEdit}
          cancelEdit={() => setEditing(null)}
          multiline
          canEdit={canEdit}
        />

        {/* Contact */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DetailField
            icon={<Mail className="h-4 w-4 text-blue-500" />}
            label="Contact Email"
            value={partner.contact_email}
            field="contact_email"
            editing={editing}
            editValue={value}
            setEditValue={setValue}
            startEdit={startEdit}
            saveEdit={saveEdit}
            cancelEdit={() => setEditing(null)}
            canEdit={canEdit}
          />
          <DetailField
            icon={<Phone className="h-4 w-4 text-green-500" />}
            label="Contact Phone"
            value={partner.contact_phone}
            field="contact_phone"
            editing={editing}
            editValue={value}
            setEditValue={setValue}
            startEdit={startEdit}
            saveEdit={saveEdit}
            cancelEdit={() => setEditing(null)}
            canEdit={canEdit}
          />
        </div>

        <DetailField
          icon={<Building2 className="h-4 w-4 text-amber-500" />}
          label="Contact Person"
          value={partner.contact_name}
          field="contact_name"
          editing={editing}
          editValue={value}
          setEditValue={setValue}
          startEdit={startEdit}
          saveEdit={saveEdit}
          cancelEdit={() => setEditing(null)}
          canEdit={canEdit}
        />

        {/* Notes */}
        <DetailField
          icon={<FileText className="h-4 w-4 text-muted-foreground" />}
          label="Notes"
          value={partner.notes}
          field="notes"
          editing={editing}
          editValue={value}
          setEditValue={setValue}
          startEdit={startEdit}
          saveEdit={saveEdit}
          cancelEdit={() => setEditing(null)}
          multiline
          canEdit={canEdit}
        />
      </div>
    </div>
  )
}

/* ============= DETAIL FIELD ============= */
function DetailField({
  icon,
  label,
  value,
  field,
  editing,
  editValue,
  setEditValue,
  startEdit,
  saveEdit,
  cancelEdit,
  multiline = false,
  canEdit = true,
}: {
  icon: React.ReactNode
  label: string
  value: string | null
  field: string
  editing: string | null
  editValue: string
  setEditValue: (v: string) => void
  startEdit: (f: string, v: string | null) => void
  saveEdit: () => void
  cancelEdit: () => void
  multiline?: boolean
  canEdit?: boolean
}) {
  const isEditing = editing === field

  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        {icon}
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
      </div>
      {isEditing ? (
        <div className="space-y-2">
          {multiline ? (
            <Textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              rows={3}
              autoFocus
              className="text-sm"
            />
          ) : (
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              autoFocus
            />
          )}
          <div className="flex gap-2">
            <Button size="sm" onClick={saveEdit}>Save</Button>
            <Button size="sm" variant="ghost" onClick={cancelEdit}>Cancel</Button>
          </div>
        </div>
      ) : (
        <button
          disabled={!canEdit}
          onClick={() => canEdit && startEdit(field, value)}
          className={`w-full text-left text-sm ${
            value ? 'text-foreground' : 'text-muted-foreground italic'
          } ${canEdit ? 'hover:bg-accent/30 rounded-md px-2 py-1 -mx-2 transition-colors' : ''}`}
        >
          {value || (canEdit ? `Click to add ${label.toLowerCase()}` : 'Not set')}
        </button>
      )}
    </div>
  )
}

function PartnershipsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-64" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-40 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  )
}
