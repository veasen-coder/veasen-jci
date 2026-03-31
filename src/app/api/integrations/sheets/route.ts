import { NextRequest, NextResponse } from 'next/server'
import { syncFromSheet, exportToSheet } from '@/lib/integrations/sheets'

export const dynamic = 'force-dynamic'

// POST: Sync from or export to Google Sheets
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, spreadsheetId, range } = body

    if (!spreadsheetId) {
      return NextResponse.json({ error: 'Spreadsheet ID is required' }, { status: 400 })
    }

    if (action === 'pull') {
      const result = await syncFromSheet(spreadsheetId, range)
      return NextResponse.json(result)
    }

    if (action === 'push') {
      const result = await exportToSheet(spreadsheetId, range)
      return NextResponse.json(result)
    }

    return NextResponse.json({ error: 'Invalid action. Use "pull" or "push".' }, { status: 400 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Google Sheets sync failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
