'use client'

import { useState, useEffect, useCallback } from 'react'
import type { DailySummary } from '@/lib/supabase/types'

export function useSummary() {
  const [summary, setSummary] = useState<DailySummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSummary = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/summary')
      if (!res.ok) throw new Error('Failed to fetch summary')
      const data = await res.json()
      setSummary(data)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  const regenerate = useCallback(async () => {
    setRegenerating(true)
    setError(null)
    try {
      const res = await fetch('/api/summary', { method: 'POST' })
      if (!res.ok) throw new Error('Failed to generate summary')
      const data = await res.json()
      setSummary(data)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setRegenerating(false)
    }
  }, [])

  useEffect(() => {
    fetchSummary()
  }, [fetchSummary])

  return { summary, loading, regenerating, error, regenerate }
}
