import { createServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerClient()

  const { data: comments, error } = await supabase
    .from('task_comments')
    .select('*')
    .eq('task_id', params.id)
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Fetch members for each comment
  const { data: members } = await supabase.from('members').select('*')
  const memberMap = new Map((members || []).map((m) => [m.id, m]))

  const commentsWithMembers = (comments || []).map((c) => ({
    ...c,
    member: memberMap.get(c.member_id) || null,
  }))

  return NextResponse.json(commentsWithMembers)
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerClient()
  const body = await request.json()

  const { data: comment, error } = await supabase
    .from('task_comments')
    .insert({
      task_id: params.id,
      member_id: body.member_id,
      content: body.content,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Log activity (ignore errors)
  try {
    await supabase.from('activity_log').insert({
      actor_id: body.member_id,
      action: 'comment_added',
      target_type: 'task',
      target_id: params.id,
      metadata: { comment_preview: body.content.substring(0, 100) },
    })
  } catch {}

  // Return with member
  const { data: member } = await supabase
    .from('members')
    .select('*')
    .eq('id', body.member_id)
    .single()

  return NextResponse.json({ ...comment, member }, { status: 201 })
}
