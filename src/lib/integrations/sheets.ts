import { createServerClient } from '@/lib/supabase/server'

const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets'

// Google Sheets integration using API key or service account
// For simplicity, this uses a public/shared sheet with the Sheets API

function mapSheetStatus(status: string): 'todo' | 'in-progress' | 'blocked' | 'done' {
  const s = status.toLowerCase().trim()
  if (s === 'done' || s === 'complete' || s === 'completed') return 'done'
  if (s === 'in progress' || s === 'in-progress' || s === 'wip') return 'in-progress'
  if (s === 'blocked') return 'blocked'
  return 'todo'
}

function mapSheetPriority(priority: string): 'normal' | 'high' {
  const p = priority.toLowerCase().trim()
  if (p === 'high' || p === 'urgent' || p === 'critical') return 'high'
  return 'normal'
}

async function getAccessToken(): Promise<string> {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!email || !privateKey) {
    throw new Error('Google service account credentials not configured')
  }

  // Create JWT for Google API auth
  const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const now = Math.floor(Date.now() / 1000)
  const claim = btoa(
    JSON.stringify({
      iss: email,
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    })
  )

  // For production, use a proper JWT signing library
  // This is a simplified version - in production use 'google-auth-library'
  const { createSign } = await import('crypto')
  const sign = createSign('RSA-SHA256')
  sign.update(`${header}.${claim}`)
  const signature = sign
    .sign(privateKey, 'base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

  const jwt = `${header}.${claim}.${signature}`

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  })

  if (!tokenRes.ok) throw new Error('Failed to get Google access token')
  const tokenData = await tokenRes.json()
  return tokenData.access_token
}

export async function readFromSheet(spreadsheetId: string, range: string = 'Sheet1!A:F') {
  const accessToken = await getAccessToken()

  const res = await fetch(
    `${SHEETS_API}/${spreadsheetId}/values/${encodeURIComponent(range)}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )

  if (!res.ok) throw new Error(`Google Sheets API error: ${res.statusText}`)
  const data = await res.json()
  return data.values as string[][] || []
}

export async function syncFromSheet(spreadsheetId: string, range?: string) {
  const supabase = createServerClient()
  const rows = await readFromSheet(spreadsheetId, range)

  if (rows.length < 2) return { synced: 0, skipped: 0, total: 0 }

  // First row is headers: Member, Title, Description, Status, Priority, Due Date
  const headers = rows[0].map((h) => h.toLowerCase().trim())
  const memberIdx = headers.findIndex((h) => h.includes('member') || h.includes('name') || h.includes('assignee'))
  const titleIdx = headers.findIndex((h) => h.includes('title') || h.includes('task'))
  const descIdx = headers.findIndex((h) => h.includes('desc'))
  const statusIdx = headers.findIndex((h) => h.includes('status'))
  const priorityIdx = headers.findIndex((h) => h.includes('priority'))
  const dueDateIdx = headers.findIndex((h) => h.includes('due') || h.includes('date'))

  if (titleIdx === -1) throw new Error('Sheet must have a "Title" column')

  // Get members for mapping
  const { data: members } = await supabase.from('members').select('*')
  if (!members) throw new Error('Failed to fetch members')

  let synced = 0
  let skipped = 0

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    const title = row[titleIdx]?.trim()
    if (!title) { skipped++; continue }

    const memberName = memberIdx >= 0 ? row[memberIdx]?.trim() : ''
    const member = members.find(
      (m) => m.name.toLowerCase().includes(memberName.toLowerCase()) ||
             memberName.toLowerCase().includes(m.name.split(' ')[0].toLowerCase())
    )
    if (!member) { skipped++; continue }

    const taskData = {
      member_id: member.id,
      title,
      description: descIdx >= 0 ? row[descIdx]?.trim() || null : null,
      status: statusIdx >= 0 ? mapSheetStatus(row[statusIdx] || '') : 'todo' as const,
      priority: priorityIdx >= 0 ? mapSheetPriority(row[priorityIdx] || '') : 'normal' as const,
      due_date: dueDateIdx >= 0 && row[dueDateIdx] ? parseDateString(row[dueDateIdx]) : null,
    }

    // Check if task already exists
    const { data: existing } = await supabase
      .from('tasks')
      .select('id')
      .eq('title', title)
      .eq('member_id', member.id)
      .limit(1)
      .single()

    if (existing) {
      await supabase.from('tasks').update(taskData).eq('id', existing.id)
    } else {
      await supabase.from('tasks').insert(taskData)
    }
    synced++
  }

  return { synced, skipped, total: rows.length - 1 }
}

export async function exportToSheet(spreadsheetId: string, range: string = 'Sheet1!A1') {
  const supabase = createServerClient()
  const accessToken = await getAccessToken()

  const { data: tasks } = await supabase
    .from('tasks')
    .select('*, member:members(name)')
    .order('member_id')
    .order('due_date')

  if (!tasks) throw new Error('Failed to fetch tasks')

  const headers = ['Member', 'Title', 'Description', 'Status', 'Priority', 'Due Date']
  const rows = tasks.map((t) => [
    (t.member as unknown as { name: string })?.name || '',
    t.title,
    t.description || '',
    t.status,
    t.priority,
    t.due_date || '',
  ])

  const values = [headers, ...rows]

  const res = await fetch(
    `${SHEETS_API}/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values }),
    }
  )

  if (!res.ok) throw new Error(`Google Sheets API error: ${res.statusText}`)
  const result = await res.json()
  return { updatedRows: result.updatedRows, updatedCells: result.updatedCells }
}

function parseDateString(dateStr: string): string | null {
  if (!dateStr) return null
  // Try various date formats
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return null
  return d.toISOString().split('T')[0]
}
