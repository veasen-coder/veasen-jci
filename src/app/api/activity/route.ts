import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = createServerClient()

  const { data: logs, error } = await supabase
    .from('activity_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Fetch members for actors
  const { data: members } = await supabase.from('members').select('*')
  const memberMap = new Map((members || []).map((m) => [m.id, m]))

  const logsWithActors = (logs || []).map((l) => ({
    ...l,
    actor: l.actor_id ? memberMap.get(l.actor_id) || null : null,
  }))

  return NextResponse.json(logsWithActors)
}
