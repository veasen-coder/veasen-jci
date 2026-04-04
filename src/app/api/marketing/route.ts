import { createServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('marketing_posts')
    .select('*')
    .order('due_date', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = createServerClient()
  const body = await request.json()

  const { data, error } = await supabase
    .from('marketing_posts')
    .insert({
      title: body.title,
      category: body.category || 'festival',
      platform: body.platform || 'instagram',
      status: body.status || 'draft',
      due_date: body.due_date || null,
      description: body.description || null,
      assigned_to: body.assigned_to || null,
      content_url: body.content_url || null,
      event_id: body.event_id || null,
      poster_done: body.poster_done || false,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
