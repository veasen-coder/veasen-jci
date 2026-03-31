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

  const { data, error } = await supabase
    .from('tasks')
    .update(updateData)
    .eq('id', params.id)
    .select('*, member:members(*)')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
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
