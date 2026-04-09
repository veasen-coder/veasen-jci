'use client'

import type { Member } from '@/lib/supabase/types'
import { Users } from 'lucide-react'

interface ProfileSelectorProps {
  members: Member[]
  onSelect: (member: Member) => void
  loading: boolean
}

export function ProfileSelector({ members, onSelect, loading }: ProfileSelectorProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="h-1 bg-gradient-to-r from-violet-600 to-blue-600" />

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mx-auto mb-4">
              <Users className="h-7 w-7 text-violet-600 dark:text-violet-400" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              JCI Youth IICS
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5">
              Select your profile to continue
            </p>
          </div>

          {/* Member Grid */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {members.map((member) => (
                <button
                  key={member.id}
                  onClick={() => onSelect(member)}
                  className="group flex flex-col items-center gap-2.5 p-5 rounded-xl border border-border bg-card hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-lg hover:shadow-violet-100/50 dark:hover:shadow-violet-900/20 transition-all duration-200 active:scale-[0.97]"
                >
                  <div
                    className="h-14 w-14 rounded-full flex items-center justify-center text-base font-semibold shrink-0 ring-2 ring-transparent group-hover:ring-violet-400 dark:group-hover:ring-violet-600 transition-all duration-200"
                    style={{ backgroundColor: member.bg_hex, color: member.color_hex }}
                  >
                    {member.initials}
                  </div>
                  <div className="text-center min-w-0 w-full">
                    <p className="text-sm font-semibold truncate">{member.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{member.role}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
