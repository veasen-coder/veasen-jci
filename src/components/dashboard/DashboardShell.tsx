'use client'

import { useState } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useTasks } from '@/hooks/useTasks'
import { useMembers } from '@/hooks/useMembers'
import { useTaskStore } from '@/lib/store/useTaskStore'
import { getTodayDisplayKL } from '@/lib/utils/dateHelpers'
import { OverviewTab } from './OverviewTab'
import { PresidentViewTab } from './PresidentViewTab'
import { EventsTab } from './EventsTab'
import { BoardsTab } from './BoardsTab'
import { MeetingMinutesTab } from './MeetingMinutesTab'
import { MarketingTab } from './MarketingTab'
import { IntegrationsTab } from './IntegrationsTab'
import { ResourcesTab } from './ResourcesTab'
import { Shield, X, Lock, ChevronDown, LogOut } from 'lucide-react'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { ActivityFeed } from '@/components/shared/ActivityFeed'
import { MemberProfileModal } from '@/components/shared/MemberProfileModal'
import { ProfileSelector } from '@/components/shared/ProfileSelector'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'events', label: 'Events' },
  { id: 'boards', label: 'My Board' },
  { id: 'meetings', label: 'Meeting Minutes' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'resources', label: 'Resources' },
  { id: 'integrations', label: 'Integrations' },
] as const

type TabId = (typeof tabs)[number]['id'] | 'president'

const PRESIDENT_CODE = '2004'

export function DashboardShell() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const activeTab = (searchParams.get('tab') as TabId) || 'overview'

  const { tasks, loading } = useTasks()
  const members = useMembers()

  const activeProfileId = useTaskStore((s) => s.activeProfileId)
  const setActiveProfileId = useTaskStore((s) => s.setActiveProfileId)
  const clearActiveProfile = useTaskStore((s) => s.clearActiveProfile)

  const activeProfile = members.find((m) => m.id === activeProfileId) || null

  const [profileMemberId, setProfileMemberId] = useState<string | null>(null)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState(false)
  const [presidentUnlocked, setPresidentUnlocked] = useState(false)
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)

  // Role-based permissions
  const role = activeProfile?.role?.toLowerCase() || ''
  const isPresident = role === 'president'
  const isSecretary = role === 'secretary'
  const isMarketing = role.includes('marketing')

  // Filter tasks for the active profile (used for non-president tabs)
  const myTasks = activeProfileId
    ? tasks.filter((t) => t.member_id === activeProfileId)
    : tasks

  // Determine visible tabs based on role
  const visibleTabs = isPresident
    ? tabs
    : tabs.filter((t) => t.id !== 'integrations')

  const setTab = (tab: TabId) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tab)
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const handlePresidentClick = () => {
    if (presidentUnlocked) {
      setTab('president')
    } else {
      setShowPasswordModal(true)
      setPassword('')
      setPasswordError(false)
    }
  }

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === PRESIDENT_CODE) {
      setPresidentUnlocked(true)
      setShowPasswordModal(false)
      setPassword('')
      setPasswordError(false)
      setTab('president')
    } else {
      setPasswordError(true)
      setPassword('')
    }
  }

  const handleSwitchProfile = (memberId: string) => {
    setActiveProfileId(memberId)
    setShowProfileDropdown(false)
  }

  // Show profile selector if no active profile
  if (!activeProfileId || !activeProfile) {
    return (
      <ProfileSelector
        members={members}
        loading={members.length === 0}
        onSelect={(member) => setActiveProfileId(member.id)}
      />
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="h-1 bg-gradient-to-r from-violet-600 to-blue-600" />
      <header className="border-b border-border px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src="https://res.cloudinary.com/dp0wzw4wa/image/upload/q_auto/f_auto/v1776338473/JCI_YOUTH_IICS-3_1_sb89ll.png"
            alt="JCI Youth IICS"
            className="h-10 w-10 rounded-full object-cover"
          />
          <div className="hidden sm:block">
            <p className="text-sm text-muted-foreground">
              {getTodayDisplayKL()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ActivityFeed />
          <ThemeToggle />

          {/* Profile Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg border border-border hover:bg-accent transition-colors"
            >
              <div
                className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0"
                style={{ backgroundColor: activeProfile.bg_hex, color: activeProfile.color_hex }}
              >
                {activeProfile.initials}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-medium leading-tight">{activeProfile.name}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">{activeProfile.role}</p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </button>

            {showProfileDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowProfileDropdown(false)} />
                <div className="absolute right-0 top-full mt-1.5 w-56 rounded-xl border border-border bg-card shadow-xl z-50 overflow-hidden">
                  <div className="px-3 py-2 border-b border-border">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Switch Profile</p>
                  </div>
                  <div className="py-1">
                    {members.map((member) => (
                      <button
                        key={member.id}
                        onClick={() => handleSwitchProfile(member.id)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-accent transition-colors ${
                          member.id === activeProfileId ? 'bg-accent/50' : ''
                        }`}
                      >
                        <div
                          className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0"
                          style={{ backgroundColor: member.bg_hex, color: member.color_hex }}
                        >
                          {member.initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{member.name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{member.role}</p>
                        </div>
                        {member.id === activeProfileId && (
                          <div className="w-1.5 h-1.5 rounded-full bg-violet-500 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-border py-1">
                    <button
                      onClick={() => { clearActiveProfile(); setShowProfileDropdown(false) }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-accent transition-colors text-muted-foreground"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span className="text-xs">Sign Out</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          <button
            onClick={handlePresidentClick}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
              activeTab === 'president'
                ? 'bg-violet-600 text-white shadow-md'
                : presidentUnlocked
                ? 'bg-violet-100 text-violet-700 hover:bg-violet-200 dark:bg-violet-900/30 dark:text-violet-400'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {presidentUnlocked ? (
              <Shield className="h-4 w-4" />
            ) : (
              <Lock className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">President View</span>
          </button>
        </div>
      </header>

      <nav className="border-b border-border px-4 sm:px-6 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors duration-150 border-b-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="px-4 sm:px-6 py-6 max-w-[1400px] mx-auto">
        {activeTab === 'overview' && <OverviewTab tasks={tasks} members={members} loading={loading} />}
        {activeTab === 'president' && presidentUnlocked && <PresidentViewTab tasks={tasks} members={members} loading={loading} onMemberClick={(member) => setProfileMemberId(member.id)} />}
        {activeTab === 'events' && <EventsTab members={members} />}
        {activeTab === 'boards' && <BoardsTab tasks={isPresident ? tasks : myTasks} members={members} loading={loading} activeProfileId={activeProfileId} isPresident={isPresident} onMemberClick={(member) => setProfileMemberId(member.id)} />}
        {activeTab === 'meetings' && <MeetingMinutesTab members={members} canEdit={isPresident || isSecretary} />}
        {activeTab === 'marketing' && <MarketingTab members={members} canEdit={isPresident || isMarketing} />}
        {activeTab === 'resources' && <ResourcesTab />}
        {activeTab === 'integrations' && isPresident && <IntegrationsTab />}
      </main>

      {/* Member Profile Modal */}
      <MemberProfileModal
        memberId={profileMemberId}
        tasks={tasks}
        onClose={() => setProfileMemberId(null)}
      />

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-violet-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">President Access</h3>
                  <p className="text-xs text-muted-foreground">Enter access code to continue</p>
                </div>
              </div>
              <button onClick={() => setShowPasswordModal(false)}>
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            <form onSubmit={handlePasswordSubmit} className="space-y-3">
              <div>
                <Input
                  type="password"
                  placeholder="Enter access code"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setPasswordError(false) }}
                  autoFocus
                  className={passwordError ? 'border-red-400 focus-visible:ring-red-400' : ''}
                />
                {passwordError && (
                  <p className="text-xs text-red-500 mt-1.5">Incorrect code. Try again.</p>
                )}
              </div>
              <Button type="submit" className="w-full gap-2 bg-violet-600 hover:bg-violet-700">
                <Lock className="h-4 w-4" />
                Unlock
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
