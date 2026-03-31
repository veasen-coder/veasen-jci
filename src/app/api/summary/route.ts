import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { generateSummary } from '@/lib/ai/generateSummary'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = createServerClient()
  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('daily_summaries')
    .select('*')
    .eq('summary_date', today)
    .single()

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data || null)
}

export async function POST() {
  try {
    const summary = await generateSummary()
    return NextResponse.json(summary)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate summary'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
