'use client'

import { useState, useEffect } from 'react'
import {
  Sheet,
  MessageSquare,
  Database,
  Layers,
  GitBranch,
  Sparkles,
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { useTaskStore } from '@/lib/store/useTaskStore'

export function IntegrationsTab() {
  return (
    <div className="space-y-8">
      <div className="mb-6">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Active Integrations
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Connected tools syncing with your dashboard.
        </p>
      </div>

      {/* Active integrations with controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ClickUpIntegration />
        <GoogleSheetsIntegration />
      </div>

      {/* Other integration options */}
      <div>
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
          Other Integration Options
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {otherIntegrations.map((integration) => (
            <div
              key={integration.title}
              className="rounded-xl border border-border bg-card p-4 transition-all duration-150 hover:border-border/80"
            >
              <div className="flex items-start gap-3 mb-2">
                <div className="rounded-lg bg-muted p-2 shrink-0">
                  <integration.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium">{integration.title}</h3>
                  <span
                    className={`${integration.difficultyColor} rounded-md text-xs font-medium px-2 py-0.5 inline-block mt-1`}
                  >
                    {integration.difficulty}
                  </span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {integration.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ClickUpIntegration() {
  const [lists, setLists] = useState<{ id: string; name: string; task_count: number }[]>([])
  const [selectedList, setSelectedList] = useState<string>('')
  const [syncing, setSyncing] = useState(false)
  const [loadingLists, setLoadingLists] = useState(false)
  const [lastResult, setLastResult] = useState<{ synced: number; total: number } | null>(null)
  const fetchTasks = useTaskStore((s) => s.fetchTasks)

  useEffect(() => {
    loadLists()
  }, [])

  const loadLists = async () => {
    setLoadingLists(true)
    try {
      const res = await fetch('/api/integrations/clickup')
      if (!res.ok) throw new Error('Failed to fetch lists')
      const data = await res.json()
      setLists(data.lists || [])
      if (data.lists?.length > 0) setSelectedList(data.lists[0].id)
    } catch {
      // ClickUp not configured — that's OK
    } finally {
      setLoadingLists(false)
    }
  }

  const pullFromClickUp = async () => {
    setSyncing(true)
    try {
      const res = await fetch('/api/integrations/clickup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pull', listId: selectedList || undefined }),
      })
      if (!res.ok) throw new Error('Sync failed')
      const result = await res.json()
      setLastResult(result)
      toast.success(`Synced ${result.synced} tasks from ClickUp`)
      fetchTasks()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-purple-100 p-2.5 shrink-0">
          <Layers className="h-5 w-5 text-purple-700" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium">ClickUp</h3>
          <span className="bg-green-100 text-green-800 rounded-md text-xs font-medium px-2 py-0.5 inline-block mt-1">
            Connected
          </span>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Pull tasks from your ClickUp workspace into the dashboard. Tasks are matched by title to avoid duplicates.
      </p>

      {/* List selector */}
      {lists.length > 0 && (
        <div>
          <label className="text-xs text-muted-foreground block mb-1.5">Select list to sync</label>
          <select
            value={selectedList}
            onChange={(e) => setSelectedList(e.target.value)}
            className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">All lists</option>
            {lists.map((list) => (
              <option key={list.id} value={list.id}>
                {list.name} ({list.task_count} tasks)
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={pullFromClickUp}
          disabled={syncing || loadingLists}
          className="gap-2"
        >
          <Download className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing...' : 'Pull from ClickUp'}
        </Button>
      </div>

      {lastResult && (
        <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 rounded-lg p-2.5">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Synced {lastResult.synced} of {lastResult.total} tasks
        </div>
      )}
    </div>
  )
}

function GoogleSheetsIntegration() {
  const [spreadsheetId, setSpreadsheetId] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [lastResult, setLastResult] = useState<string | null>(null)
  const fetchTasks = useTaskStore((s) => s.fetchTasks)

  useEffect(() => {
    // Check if Google credentials are configured
    // We can't check env vars from client, so we'll just show the form
    const savedId = localStorage.getItem('jci_sheets_id')
    if (savedId) setSpreadsheetId(savedId)
  }, [])

  const saveSpreadsheetId = (id: string) => {
    setSpreadsheetId(id)
    localStorage.setItem('jci_sheets_id', id)
  }

  const pullFromSheets = async () => {
    if (!spreadsheetId.trim()) {
      toast.error('Enter a Spreadsheet ID first')
      return
    }
    setSyncing(true)
    try {
      const res = await fetch('/api/integrations/sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pull', spreadsheetId: spreadsheetId.trim() }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Sync failed')
      }
      const result = await res.json()
      setLastResult(`Imported ${result.synced} tasks (${result.skipped} skipped)`)
      toast.success(`Imported ${result.synced} tasks from Google Sheets`)
      fetchTasks()
    } catch (err) {
      toast.error((err as Error).message)
      setLastResult(null)
    } finally {
      setSyncing(false)
    }
  }

  const exportToSheets = async () => {
    if (!spreadsheetId.trim()) {
      toast.error('Enter a Spreadsheet ID first')
      return
    }
    setExporting(true)
    try {
      const res = await fetch('/api/integrations/sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'push', spreadsheetId: spreadsheetId.trim() }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Export failed')
      }
      const result = await res.json()
      setLastResult(`Exported ${result.updatedRows} rows`)
      toast.success(`Exported tasks to Google Sheets`)
    } catch (err) {
      toast.error((err as Error).message)
      setLastResult(null)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-green-100 p-2.5 shrink-0">
          <Sheet className="h-5 w-5 text-green-700" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium">Google Sheets</h3>
          <span className="bg-amber-100 text-amber-800 rounded-md text-xs font-medium px-2 py-0.5 inline-block mt-1">
            Requires Setup
          </span>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Sync tasks from a Google Sheet or export your dashboard data. Sheet must have columns: Member, Title, Description, Status, Priority, Due Date.
      </p>

      <div>
        <label className="text-xs text-muted-foreground block mb-1.5">
          Spreadsheet ID (from the Sheet URL)
        </label>
        <Input
          placeholder="e.g. 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
          value={spreadsheetId}
          onChange={(e) => saveSpreadsheetId(e.target.value)}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Find this in your Sheet URL: docs.google.com/spreadsheets/d/<strong>THIS_PART</strong>/edit
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={pullFromSheets}
          disabled={syncing || !spreadsheetId.trim()}
          className="gap-2"
        >
          <Download className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Importing...' : 'Import from Sheet'}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={exportToSheets}
          disabled={exporting || !spreadsheetId.trim()}
          className="gap-2"
        >
          <Upload className={`h-3.5 w-3.5 ${exporting ? 'animate-spin' : ''}`} />
          {exporting ? 'Exporting...' : 'Export to Sheet'}
        </Button>
      </div>

      {lastResult && (
        <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 rounded-lg p-2.5">
          <CheckCircle2 className="h-3.5 w-3.5" />
          {lastResult}
        </div>
      )}

      <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 rounded-lg p-2.5">
        <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
        <span>
          Requires Google service account credentials in your environment variables.
          Set GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY in .env.local.
        </span>
      </div>
    </div>
  )
}

const otherIntegrations = [
  {
    title: 'WhatsApp bot',
    description: 'Members send daily task updates via WhatsApp. Bot parses and writes to dashboard.',
    difficulty: 'Easy',
    difficultyColor: 'bg-green-100 text-green-800',
    icon: MessageSquare,
  },
  {
    title: 'Notion database',
    description: 'Connect via Notion API. Pull tasks from shared Notion DB in real time.',
    difficulty: 'Medium',
    difficultyColor: 'bg-amber-100 text-amber-800',
    icon: Database,
  },
  {
    title: 'n8n automation',
    description: 'Central n8n workflow aggregates from WhatsApp, Notion, or Sheets into dashboard DB.',
    difficulty: 'Advanced',
    difficultyColor: 'bg-blue-100 text-blue-800',
    icon: GitBranch,
  },
  {
    title: 'AI daily digest',
    description: 'Claude API call every morning at 8am KL to generate weekly rollup and flag blockers.',
    difficulty: 'Advanced',
    difficultyColor: 'bg-blue-100 text-blue-800',
    icon: Sparkles,
  },
]
