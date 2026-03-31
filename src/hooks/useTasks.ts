'use client'

import { useEffect } from 'react'
import { useTaskStore } from '@/lib/store/useTaskStore'
import { createClient } from '@/lib/supabase/client'
import type { Task } from '@/lib/supabase/types'

export function useTasks() {
  const tasks = useTaskStore((s) => s.tasks)
  const loading = useTaskStore((s) => s.loading)
  const error = useTaskStore((s) => s.error)
  const fetchTasks = useTaskStore((s) => s.fetchTasks)
  const handleRealtimeInsert = useTaskStore((s) => s.handleRealtimeInsert)
  const handleRealtimeUpdate = useTaskStore((s) => s.handleRealtimeUpdate)
  const handleRealtimeDelete = useTaskStore((s) => s.handleRealtimeDelete)

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  // Subscribe to Supabase Realtime
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('tasks-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'tasks' },
        (payload) => {
          handleRealtimeInsert(payload.new as Task)
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'tasks' },
        (payload) => {
          handleRealtimeUpdate(payload.new as Task)
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'tasks' },
        (payload) => {
          handleRealtimeDelete((payload.old as { id: string }).id)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [handleRealtimeInsert, handleRealtimeUpdate, handleRealtimeDelete])

  return { tasks, loading, error }
}
