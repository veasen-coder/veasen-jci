'use client'

import type { Member } from '@/lib/supabase/types'

interface ProfileSelectorProps {
  members: Member[]
  onSelect: (member: Member) => void
  loading: boolean
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

export function ProfileSelector({ members, onSelect, loading }: ProfileSelectorProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Ambient brand glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-96 w-[42rem] rounded-full bg-gradient-to-r from-violet-500/20 via-fuchsia-500/15 to-blue-500/20 blur-3xl" />
      <div className="h-1 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-blue-600" />

      <div className="flex-1 flex items-center justify-center px-4 py-12 relative">
        <div className="w-full max-w-lg animate-fade-in-up">
          {/* Header */}
          <div className="text-center mb-8">
            <img
              src="https://res.cloudinary.com/dp0wzw4wa/image/upload/q_auto/f_auto/v1776338473/JCI_YOUTH_IICS-3_1_sb89ll.png"
              alt="JCI Youth IICS"
              className="h-20 w-20 rounded-full object-cover mx-auto mb-5 ring-4 ring-violet-500/15 shadow-elevated"
            />
            <p className="text-xs font-medium text-violet-600 dark:text-violet-400 uppercase tracking-widest mb-1">
              {getGreeting()}
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-gradient-brand">
              JCI Youth IICS
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
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
              {members.map((member, i) => (
                <button
                  key={member.id}
                  onClick={() => onSelect(member)}
                  style={{ animationDelay: `${i * 40}ms` }}
                  className="group flex flex-col items-center gap-2.5 p-5 rounded-xl border border-border bg-card hover:border-violet-300 dark:hover:border-violet-700 card-interactive animate-fade-in-up"
                >
                  <div
                    className="h-14 w-14 rounded-full flex items-center justify-center text-base font-semibold shrink-0 ring-2 ring-transparent group-hover:ring-violet-400 dark:group-hover:ring-violet-600 transition-all duration-200 shadow-soft"
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

          <p className="text-center text-[11px] text-muted-foreground/70 mt-8">
            JCI Youth IICS · Command Dashboard
          </p>
        </div>
      </div>
    </div>
  )
}
