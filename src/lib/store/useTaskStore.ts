import { create } from 'zustand'
import type { Task, TaskWithMember, Member, TaskStatus, TaskPriority } from '@/lib/supabase/types'

interface TaskStore {
  tasks: TaskWithMember[]
  members: Member[]
  loading: boolean
  error: string | null

  setTasks: (tasks: TaskWithMember[]) => void
  setMembers: (members: Member[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void

  fetchTasks: () => Promise<void>
  fetchMembers: () => Promise<void>

  addTask: (task: {
    member_id: string
    title: string
    description?: string
    status?: TaskStatus
    priority?: TaskPriority
    due_date?: string
  }) => Promise<void>

  updateTask: (id: string, updates: Partial<Task>) => Promise<void>
  deleteTask: (id: string) => Promise<void>

  // Realtime handlers
  handleRealtimeInsert: (task: Task) => void
  handleRealtimeUpdate: (task: Task) => void
  handleRealtimeDelete: (taskId: string) => void
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  members: [],
  loading: false,
  error: null,

  setTasks: (tasks) => set({ tasks }),
  setMembers: (members) => set({ members }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  fetchTasks: async () => {
    set({ loading: true, error: null })
    try {
      const res = await fetch('/api/tasks')
      if (!res.ok) throw new Error('Failed to fetch tasks')
      const data = await res.json()
      set({ tasks: data, loading: false })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  fetchMembers: async () => {
    try {
      const res = await fetch('/api/members')
      if (!res.ok) throw new Error('Failed to fetch members')
      const data = await res.json()
      set({ members: data })
    } catch (err) {
      set({ error: (err as Error).message })
    }
  },

  addTask: async (taskInput) => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskInput),
      })
      if (!res.ok) throw new Error('Failed to create task')
      const newTask = await res.json()
      set((state) => ({ tasks: [newTask, ...state.tasks] }))
    } catch (err) {
      set({ error: (err as Error).message })
      throw err
    }
  },

  updateTask: async (id, updates) => {
    const prevTasks = get().tasks
    // Optimistic update
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id ? { ...t, ...updates, updated_at: new Date().toISOString() } : t
      ),
    }))

    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!res.ok) throw new Error('Failed to update task')
      const updated = await res.json()
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? updated : t)),
      }))
    } catch (err) {
      // Rollback on error
      set({ tasks: prevTasks, error: (err as Error).message })
      throw err
    }
  },

  deleteTask: async (id) => {
    const prevTasks = get().tasks
    // Optimistic removal
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
    }))

    try {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete task')
    } catch (err) {
      set({ tasks: prevTasks, error: (err as Error).message })
      throw err
    }
  },

  handleRealtimeInsert: (task) => {
    const { members, tasks } = get()
    const member = members.find((m) => m.id === task.member_id)
    if (!member) return
    const exists = tasks.find((t) => t.id === task.id)
    if (exists) return
    const taskWithMember: TaskWithMember = { ...task, member }
    set((state) => ({ tasks: [taskWithMember, ...state.tasks] }))
  },

  handleRealtimeUpdate: (task) => {
    const { members } = get()
    const member = members.find((m) => m.id === task.member_id)
    if (!member) return
    const taskWithMember: TaskWithMember = { ...task, member }
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === task.id ? taskWithMember : t)),
    }))
  },

  handleRealtimeDelete: (taskId) => {
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== taskId),
    }))
  },
}))
