export type TaskStatus = 'todo' | 'in-progress' | 'blocked' | 'done'
export type TaskPriority = 'normal' | 'high'
export type EventStatus = 'planning' | 'in-progress' | 'completed'
export type MarketingPlatform = 'instagram' | 'facebook' | 'tiktok' | 'twitter' | 'linkedin' | 'other'
export type MarketingStatus = 'draft' | 'scheduled' | 'posted'
export type MarketingCategory = 'festival' | 'event_poster' | 'club_promotion'
export type PartnershipStage = 'list' | 'contacted' | 'negotiating' | 'closed'
export type ContentIdeaStatus = 'idea' | 'approved' | 'in-progress' | 'published'

export interface Member {
  id: string
  name: string
  role: string
  initials: string
  color_hex: string
  bg_hex: string
  created_at: string
}

export interface Task {
  id: string
  member_id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  due_date: string | null
  event_id: string | null
  needs_qc: boolean
  created_at: string
  updated_at: string
}

export interface TaskWithMember extends Task {
  member: Member
}

export interface Event {
  id: string
  title: string
  description: string | null
  event_date: string
  poster_url: string | null
  status: EventStatus
  created_at: string
  updated_at: string
}

export interface MarketingPost {
  id: string
  title: string
  category: MarketingCategory
  platform: MarketingPlatform
  status: MarketingStatus
  start_date: string | null
  due_date: string | null
  description: string | null
  assigned_to: string | null
  content_url: string | null
  event_id: string | null
  poster_done: boolean
  created_at: string
  updated_at: string
}

export interface Partnership {
  id: string
  name: string
  company: string | null
  stage: PartnershipStage
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  benefits: string | null
  notes: string | null
  logo_url: string | null
  created_at: string
  updated_at: string
}

export interface ContentIdea {
  id: string
  title: string
  description: string | null
  platform: MarketingPlatform
  status: ContentIdeaStatus
  target_date: string | null
  assigned_to: string | null
  reference_url: string | null
  needs_qc: boolean
  created_at: string
  updated_at: string
}

export interface DailySummary {
  id: string
  summary_date: string
  completed_today: { task_id: string; title: string; member_name: string }[] | null
  up_next: { task_id: string; title: string; member_name: string; due_date: string | null }[] | null
  weekly_narrative: string | null
  blockers_narrative: string | null
  generated_at: string
}

export interface ActionItem {
  id: string
  text: string
  assignee_id: string | null
  done: boolean
}

export interface Attachment {
  name: string
  url: string
  size: number
  type: string
  uploaded_at: string
}

export interface MeetingMinutes {
  id: string
  title: string
  meeting_date: string
  attendee_ids: string[]
  agenda: string | null
  notes: string | null
  action_items: ActionItem[]
  attachments: Attachment[]
  google_docs_url: string | null
  created_at: string
  updated_at: string
}

export type ResourceCategory = 'intima' | 'department' | 'claim' | 'template' | 'general'

export interface Resource {
  id: string
  title: string
  url: string
  category: ResourceCategory
  description: string | null
  icon: string | null
  created_at: string
  updated_at: string
}

export interface TaskComment {
  id: string
  task_id: string
  member_id: string
  content: string
  created_at: string
}

export interface TaskCommentWithMember extends TaskComment {
  member: Member
}

export interface ActivityLogEntry {
  id: string
  actor_id: string | null
  action: string
  target_type: string
  target_id: string
  metadata: Record<string, unknown> | null
  created_at: string
}

export interface ActivityLogEntryWithActor extends ActivityLogEntry {
  actor: Member | null
}

export interface Database {
  public: {
    Tables: {
      members: {
        Row: Member
        Insert: Omit<Member, 'id' | 'created_at'>
        Update: Partial<Omit<Member, 'id' | 'created_at'>>
      }
      tasks: {
        Row: Task
        Insert: Omit<Task, 'id' | 'created_at' | 'updated_at'> & { status?: TaskStatus; priority?: TaskPriority }
        Update: Partial<Omit<Task, 'id' | 'created_at'>>
      }
      daily_summaries: {
        Row: DailySummary
        Insert: Omit<DailySummary, 'id' | 'generated_at'>
        Update: Partial<Omit<DailySummary, 'id'>>
      }
    }
  }
}
