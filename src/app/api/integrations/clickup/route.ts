import { NextRequest, NextResponse } from 'next/server'
import { syncFromClickUp, fetchClickUpLists, pushToClickUp } from '@/lib/integrations/clickup'

export const dynamic = 'force-dynamic'

// GET: Fetch ClickUp lists for the UI
export async function GET() {
  try {
    const lists = await fetchClickUpLists()
    return NextResponse.json({ lists })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch ClickUp lists'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// POST: Sync tasks from ClickUp or push a task to ClickUp
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, listId, taskId } = body

    if (action === 'pull') {
      const result = await syncFromClickUp(listId)
      return NextResponse.json(result)
    }

    if (action === 'push' && taskId && listId) {
      const result = await pushToClickUp(taskId, listId)
      return NextResponse.json(result)
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'ClickUp sync failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
