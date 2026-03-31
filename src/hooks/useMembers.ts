'use client'

import { useEffect } from 'react'
import { useTaskStore } from '@/lib/store/useTaskStore'

export function useMembers() {
  const members = useTaskStore((s) => s.members)
  const fetchMembers = useTaskStore((s) => s.fetchMembers)

  useEffect(() => {
    if (members.length === 0) {
      fetchMembers()
    }
  }, [members.length, fetchMembers])

  return members
}
