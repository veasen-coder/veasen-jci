export type TaskStatus = 'todo' | 'in-progress' | 'blocked' | 'done'
export type TaskPriority = 'normal' | 'high'

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
  created_at: string
  updated_at: string
}

export interface TaskWithMember extends Task {
  member: Member
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
