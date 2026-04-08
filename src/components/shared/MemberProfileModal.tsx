'use client'

import { useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import type { TaskWithMember, TaskStatus } from '@/lib/supabase/types'
import { getMemberStats, filterByMember } from '@/lib/utils/taskHelpers'
import { useTaskStore } from '@/lib/store/useTaskStore'
import { PriorityBadge } from '@/components/shared/PriorityBadge'
import { DueDateBadge } from '@/components/shared/DueDateBadge'
import { X, Shield, ArrowRight, Pencil, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface MemberProfileModalProps {
  memberId: string | null
  tasks: TaskWithMember[]
  onClose: () => void
}

const statusSections: { status: TaskStatus; label: string }[] = [
  { status: 'in-progress', label: 'In Progress' },
  { status: 'blocked', label: 'Blocked' },
  { status: 'todo', label: 'To Do' },
  { status: 'done', label: 'Done' },
]

export function MemberProfileModal({ memberId, tasks, onClose }: MemberProfileModalProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const members = useTaskStore((s) => s.members)
  const fetchMembers = useTaskStore((s) => s.fetchMembers)

  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editRole, setEditRole] = useState('')
  const [saving, setSaving] = useState(false)

  // Always read fresh member from the store
  const member = memberId ? members.find((m) => m.id === memberId) || null : null

  if (!member) return null

  const stats = getMemberStats(tasks, member)
  const memberTasks = filterByMember(tasks, member.id) as TaskWithMember[]

  const handleViewBoard = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', 'boards')
    params.set('member', member.id)
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
    onClose()
  }

  const handleStartEdit = () => {
    setEditName(member.name)
    setEditRole(member.role)
    setEditing(true)
  }

  const handleSave = async () => {
    if (!editName.trim() || !editRole.trim()) return
    setSaving(true)
    try {
      // Generate initials from new name
      const nameParts = editName.trim().split(/\s+/)
      const initials = nameParts.length >= 2
        ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
        : editName.trim().substring(0, 2).toUpperCase()

      const res = await fetch(`/api/members/${member.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          role: editRole.trim(),
          initials,
        }),
      })
      if (!res.ok) throw new Error('Failed to update')
      // Refresh members in store
      await fetchMembers()
      setEditing(false)
    } catch {
      // stay in edit mode on error
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setEditing(false)
    setEditName('')
    setEditRole('')
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-border shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className="h-12 w-12 rounded-full flex items-center justify-center text-sm font-semibold shrink-0"
                style={{ backgroundColor: member.bg_hex, color: member.color_hex }}
              >
                {editing ? (editName.trim().split(/\s+/).length >= 2
                  ? (editName.trim().split(/\s+/)[0][0] + editName.trim().split(/\s+/).slice(-1)[0][0]).toUpperCase()
                  : editName.trim().substring(0, 2).toUpperCase()
                ) : member.initials}
              </div>
              <div className="flex-1 min-w-0">
                {editing ? (
                  <div className="space-y-1.5">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Name"
                      className="h-8 text-sm font-semibold"
                      autoFocus
                    />
                    <Input
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value)}
                      placeholder="Position / Role"
                      className="h-8 text-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSave()
                        if (e.key === 'Escape') handleCancelEdit()
                      }}
                    />
                  </div>
                ) : (
                  <>
                    <h2 className="text-base font-semibold">{member.name}</h2>
                    <p className="text-sm text-muted-foreground">{member.role}</p>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {editing ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={saving || !editName.trim() || !editRole.trim()}
                    className="p-1.5 rounded-md bg-green-100 text-green-700 hover:bg-green-200 transition-colors disabled:opacity-50 dark:bg-green-900/30 dark:text-green-400"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="p-1.5 rounded-md hover:bg-muted transition-colors"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleStartEdit}
                    className="p-1.5 rounded-md hover:bg-muted transition-colors"
                    title="Edit profile"
                  >
                    <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                  <button
                    onClick={onClose}
                    className="p-1.5 rounded-md hover:bg-muted transition-colors"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-4 gap-3 mt-4">
            <div className="text-center">
              <p className="text-lg font-semibold">{stats.total}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-green-600">{stats.done}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Done</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-blue-600">{stats.inProgress}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">In Progress</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-red-600">{stats.blocked}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Blocked</p>
            </div>
          </div>

          {/* Progress Bar */}
          {stats.total > 0 && (
            <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden flex">
              {stats.donePercent > 0 && (
                <div
                  className="h-full bg-green-500 transition-all duration-300"
                  style={{ width: `${stats.donePercent}%` }}
                />
              )}
              {stats.inProgressPercent > 0 && (
                <div
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${stats.inProgressPercent}%` }}
                />
              )}
              {stats.blockedPercent > 0 && (
                <div
                  className="h-full bg-red-400 transition-all duration-300"
                  style={{ width: `${stats.blockedPercent}%` }}
                />
              )}
              {stats.todoPercent > 0 && (
                <div
                  className="h-full bg-slate-300 transition-all duration-300"
                  style={{ width: `${stats.todoPercent}%` }}
                />
              )}
            </div>
          )}

          {/* View Board Button */}
          <Button
            onClick={handleViewBoard}
            variant="outline"
            size="sm"
            className="w-full mt-3 gap-2"
          >
            View Board
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Task List */}
        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          {memberTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No tasks assigned
            </p>
          ) : (
            statusSections.map(({ status, label }) => {
              const sectionTasks = memberTasks.filter((t) => t.status === status)
              if (sectionTasks.length === 0) return null

              return (
                <div key={status}>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    {label} ({sectionTasks.length})
                  </h3>
                  <div className="space-y-2">
                    {sectionTasks.map((task) => (
                      <div
                        key={task.id}
                        className="rounded-lg border border-border bg-muted/30 p-3"
                      >
                        <p className="text-sm font-medium mb-1.5">{task.title}</p>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <PriorityBadge priority={task.priority} />
                          <DueDateBadge dueDate={task.due_date} status={task.status} />
                          {task.needs_qc && (
                            <span className="flex items-center gap-0.5 bg-violet-100 text-violet-700 rounded-md text-[10px] font-bold px-1.5 py-0.5 dark:bg-violet-900/30 dark:text-violet-400">
                              <Shield className="h-3 w-3" />
                              QC
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
