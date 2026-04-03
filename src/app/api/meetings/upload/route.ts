import { createServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const supabase = createServerClient()
  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const meetingId = formData.get('meetingId') as string | null

  if (!file || !meetingId) {
    return NextResponse.json({ error: 'File and meetingId are required' }, { status: 400 })
  }

  const fileName = `${meetingId}/${Date.now()}-${file.name}`

  const { error: uploadError } = await supabase.storage
    .from('meeting-attachments')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (uploadError) {
    // If bucket doesn't exist, store as base64 data URL in the meeting record instead
    if (uploadError.message.includes('Bucket not found') || uploadError.message.includes('bucket')) {
      // Fallback: store file metadata without actual storage
      return NextResponse.json({
        attachment: {
          name: file.name,
          url: '', // No storage bucket available
          size: file.size,
          type: file.type,
          uploaded_at: new Date().toISOString(),
        },
        warning: 'File metadata saved but storage bucket "meeting-attachments" needs to be created in Supabase Storage.',
      })
    }
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { data: urlData } = supabase.storage
    .from('meeting-attachments')
    .getPublicUrl(fileName)

  return NextResponse.json({
    attachment: {
      name: file.name,
      url: urlData.publicUrl,
      size: file.size,
      type: file.type,
      uploaded_at: new Date().toISOString(),
    },
  })
}
