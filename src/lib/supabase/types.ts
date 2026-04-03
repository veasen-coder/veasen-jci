export type TaskStatus = 'todo' | 'in-progress' | 'blocked' | 'done'
export type TaskPriority = 'normal' | 'high'
export type EventStatus = 'planning' | 'in-progress' | 'completed'
export type MarketingPlatform = 'instagram' | 'facebook' | 'tiktok' | 'twitter' | 'linkedin' | 'other'
export type MarketingStatus = 'draft' | 'scheduled' | 'posted'

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
  platform: MarketingPlatform
  status: MarketingStatus
  due_date: string | null
  description: string | null
  assigned_to: string | null
  content_url: string | null
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
