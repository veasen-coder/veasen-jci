import { createServerClient } from '@/lib/supabase/server'

const CLICKUP_API = 'https://api.clickup.com/api/v2'

interface ClickUpTask {
  id: string
  name: string
  description: string
  status: { status: string }
  priority: { id: string; priority: string } | null
  due_date: string | null
  assignees: { id: number; username: string; email: string }[]
  list: { id: string; name: string }
}

// Map ClickUp status to our status
function mapStatus(clickupStatus: string): 'todo' | 'in-progress' | 'blocked' | 'done' {
  const s = clickupStatus.toLowerCase()
  if (s === 'complete' || s === 'done' || s === 'closed') return 'done'
  if (s === 'in progress') return 'in-progress'
  if (s === 'blocked') return 'blocked'
  return 'todo'
}

// Map ClickUp priority to our priority
function mapPriority(clickupPriority: { id: string; priority: string } | null): 'normal' | 'high' {
  if (!clickupPriority) return 'normal'
  const p = clickupPriority.priority.toLowerCase()
  if (p === 'urgent' || p === 'high') return 'high'
  return 'normal'
}

// Map our status back to ClickUp status
function mapStatusToClickUp(status: string): string {
  switch (status) {
    case 'done': return 'complete'
    case 'in-progress': return 'in progress'
    case 'blocked': return 'in progress' // ClickUp doesn't have blocked by default
    case 'todo':
    default: return 'to do'
  }
}

// Map ClickUp assignee email to our member
async function mapAssigneeToMember(assignees: ClickUpTask['assignees']) {
  const supabase = createServerClient()
  const { data: members } = await supabase.from('members').select('*')
  if (!members || assignees.length === 0) return members?.[0]?.id || null

  // Map by known email patterns or just assign to first member
  const emailToMember: Record<string, string> = {
    'yikaiteh.jciyouthiics@gmail.com': 'Veasen Teh',
  }

  for (const assignee of assignees) {
    const memberName = emailToMember[assignee.email]
    if (memberName) {
      const member = members.find((m) => m.name === memberName)
      if (member) return member.id
    }
    // Try matching by username
    const byUsername = members.find(
      (m) => m.name.toLowerCase().includes((assignee.username || '').toLowerCase())
    )
    if (byUsername) return byUsername.id
  }

  // Default to first member (President)
  return members[0]?.id || null
}

export async function fetchClickUpLists() {
  const apiKey = process.env.CLICKUP_API_KEY
  const spaceId = process.env.CLICKUP_SPACE_ID
  if (!apiKey || !spaceId) throw new Error('ClickUp credentials not configured')

  const res = await fetch(`${CLICKUP_API}/space/${spaceId}/list`, {
    headers: { Authorization: apiKey },
  })
  if (!res.ok) throw new Error(`ClickUp API error: ${res.statusText}`)
  const data = await res.json()
  return data.lists as { id: string; name: string; task_count: number }[]
}

export async function fetchClickUpTasks(listId?: string) {
  const apiKey = process.env.CLICKUP_API_KEY
  const spaceId = process.env.CLICKUP_SPACE_ID
  const teamId = process.env.CLICKUP_TEAM_ID
  if (!apiKey) throw new Error('ClickUp API key not configured')

  let url: string
  if (listId) {
    url = `${CLICKUP_API}/list/${listId}/task?include_closed=true`
  } else {
    // Fetch from all lists in the space
    url = `${CLICKUP_API}/team/${teamId}/task?space_ids[]=${spaceId}&include_closed=true`
  }

  const res = await fetch(url, {
    headers: { Authorization: apiKey },
  })
  if (!res.ok) throw new Error(`ClickUp API error: ${res.statusText}`)
  const data = await res.json()
  return data.tasks as ClickUpTask[]
}

export async function syncFromClickUp(listId?: string) {
  const supabase = createServerClient()
  const clickupTasks = await fetchClickUpTasks(listId)

  let synced = 0
  let skipped = 0

  for (const cuTask of clickupTasks) {
    // Check if task already exists by matching on clickup_id or title
    const { data: existing } = await supabase
      .from('tasks')
      .select('id')
      .eq('title', cuTask.name)
      .limit(1)
      .single()

    const memberId = await mapAssigneeToMember(cuTask.assignees)
    if (!memberId) { skipped++; continue }

    const taskData = {
      member_id: memberId,
      title: cuTask.name,
      description: cuTask.description || null,
      status: mapStatus(cuTask.status.status),
      priority: mapPriority(cuTask.priority),
      due_date: cuTask.due_date
        ? new Date(parseInt(cuTask.due_date)).toISOString().split('T')[0]
        : null,
    }

    if (existing) {
      // Update existing task
      await supabase.from('tasks').update(taskData).eq('id', existing.id)
      synced++
    } else {
      // Insert new task
      await supabase.from('tasks').insert(taskData)
      synced++
    }
  }

  return { synced, skipped, total: clickupTasks.length }
}

export async function pushToClickUp(taskId: string, listId: string) {
  const apiKey = process.env.CLICKUP_API_KEY
  if (!apiKey) throw new Error('ClickUp API key not configured')

  const supabase = createServerClient()
  const { data: task } = await supabase
    .from('tasks')
    .select('*, member:members(name)')
    .eq('id', taskId)
    .single()

  if (!task) throw new Error('Task not found')

  const res = await fetch(`${CLICKUP_API}/list/${listId}/task`, {
    method: 'POST',
    headers: {
      Authorization: apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: task.title,
      description: task.description || '',
      status: mapStatusToClickUp(task.status),
      priority: task.priority === 'high' ? 2 : 3,
      due_date: task.due_date ? new Date(task.due_date).getTime() : undefined,
    }),
  })

  if (!res.ok) throw new Error(`ClickUp API error: ${res.statusText}`)
  return await res.json()
}
