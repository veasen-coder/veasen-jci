import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('tasks')
    .select('*, member:members(*)')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = createServerClient()
  const body = await request.json()

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      member_id: body.member_id,
      title: body.title,
      description: body.description || null,
      status: body.status || 'todo',
      priority: body.priority || 'normal',
      due_date: body.due_date || null,
    })
    .select('*, member:members(*)')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
