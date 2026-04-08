import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerClient()
  const body = await request.json()

  const updateData: Record<string, unknown> = {}
  if (body.status !== undefined) updateData.status = body.status
  if (body.priority !== undefined) updateData.priority = body.priority
  if (body.title !== undefined) updateData.title = body.title
  if (body.description !== undefined) updateData.description = body.description
  if (body.due_date !== undefined) updateData.due_date = body.due_date
  if (body.event_id !== undefined) updateData.event_id = body.event_id
  if (body.needs_qc !== undefined) updateData.needs_qc = body.needs_qc

  // Get old task for activity logging
  const { data: oldTask } = await supabase
    .from('tasks')
    .select('status, needs_qc, member_id, title')
    .eq('id', params.id)
    .single()

  const { data, error } = await supabase
    .from('tasks')
    .update(updateData)
    .eq('id', params.id)
    .select('*, member:members(*)')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Log activity for status changes and QC requests
  if (oldTask) {
    try {
      if (body.status && body.status !== oldTask.status) {
        await supabase.from('activity_log').insert({
          actor_id: oldTask.member_id,
          action: 'status_change',
          target_type: 'task',
          target_id: params.id,
          metadata: { task_title: oldTask.title, old_status: oldTask.status, new_status: body.status },
        })
      }
      if (body.needs_qc === true && !oldTask.needs_qc) {
        await supabase.from('activity_log').insert({
          actor_id: oldTask.member_id,
          action: 'qc_request',
          target_type: 'task',
          target_id: params.id,
          metadata: { task_title: oldTask.title },
        })
      }
    } catch {}
  }

  return NextResponse.json(data)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerClient()

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', params.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
