import Anthropic from '@anthropic-ai/sdk'
import { createServerClient } from '@/lib/supabase/server'
import type { DailySummary } from '@/lib/supabase/types'

interface SummaryResponse {
  weekly_narrative: string
  blockers_narrative: string
  completed_today: { task_id: string; title: string; member_name: string }[]
  up_next: { task_id: string; title: string; member_name: string; due_date: string | null }[]
}

export async function generateSummary(): Promise<DailySummary> {
  const supabase = createServerClient()

  // Fetch all tasks with member names
  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('*, member:members(name)')
    .order('due_date', { ascending: true })

  if (tasksError) throw new Error(`Failed to fetch tasks: ${tasksError.message}`)

  const today = new Date().toISOString().split('T')[0]

  // Group tasks by member for the prompt
  const tasksByMember: Record<string, typeof tasks> = {}
  for (const task of tasks || []) {
    const memberName = (task.member as unknown as { name: string })?.name || 'Unknown'
    if (!tasksByMember[memberName]) tasksByMember[memberName] = []
    tasksByMember[memberName].push(task)
  }

  let taskSummaryText = ''
  for (const [memberName, memberTasks] of Object.entries(tasksByMember)) {
    taskSummaryText += `\n${memberName}:\n`
    for (const task of memberTasks) {
      taskSummaryText += `  - "${task.title}" | Status: ${task.status} | Priority: ${task.priority} | Due: ${task.due_date || 'no date'}\n`
    }
  }

  const prompt = `You are an assistant for a JCI (Junior Chamber International) Youth chapter in Malaysia called "JCI Youth IICS". Today is ${today} (Asia/Kuala_Lumpur timezone).

Here are the current tasks for all 6 board members:
${taskSummaryText}

Analyze these tasks and return a JSON object with exactly these keys:
1. "weekly_narrative": A 2-3 sentence summary covering the chapter's progress this week, key risks, and what to focus on next. Be concise, professional, and specific to JCI chapter operations.
2. "blockers_narrative": A 1-2 sentence callout about the most critical unresolved blocker(s). If there are no blockers, say so briefly.
3. "completed_today": An array of tasks marked "done" that were likely completed today. Each item: { "task_id": "<id>", "title": "<title>", "member_name": "<name>" }. If none, return an empty array.
4. "up_next": The 5 most urgent non-done tasks sorted by due date. Each item: { "task_id": "<id>", "title": "<title>", "member_name": "<name>", "due_date": "<date or null>" }

Return ONLY valid JSON, no markdown formatting or code blocks.`

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  })

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  const responseText =
    message.content[0].type === 'text' ? message.content[0].text : ''

  let parsed: SummaryResponse
  try {
    // Strip potential markdown code blocks
    const cleaned = responseText.replace(/```json\n?|\n?```/g, '').trim()
    parsed = JSON.parse(cleaned)
  } catch {
    throw new Error('Failed to parse AI response as JSON')
  }

  // Upsert into daily_summaries
  const { data, error } = await supabase
    .from('daily_summaries')
    .upsert(
      {
        summary_date: today,
        weekly_narrative: parsed.weekly_narrative,
        blockers_narrative: parsed.blockers_narrative,
        completed_today: parsed.completed_today as unknown as DailySummary['completed_today'],
        up_next: parsed.up_next as unknown as DailySummary['up_next'],
      },
      { onConflict: 'summary_date' }
    )
    .select()
    .single()

  if (error) throw new Error(`Failed to save summary: ${error.message}`)

  return data as DailySummary
}
