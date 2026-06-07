'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useTasks } from '@/hooks/useTasks'
import { useMembers } from '@/hooks/useMembers'
import { useTaskStore } from '@/lib/store/useTaskStore'
import { OverviewTab } from './OverviewTab'
import { PresidentViewTab } from './PresidentViewTab'
import { EventsTab } from './EventsTab'
import { BoardsTab } from './BoardsTab'
import { MeetingMinutesTab } from './MeetingMinutesTab'
import { MarketingTab } from './MarketingTab'
import { PartnershipsTab } from './PartnershipsTab'
import { IntegrationsTab } from './IntegrationsTab'
import { ResourcesTab } from './ResourcesTab'
import {
  Shield,
  X,
  Lock,
  ChevronDown,
  LogOut,
  LayoutDashboard,
  CalendarDays,
  KanbanSquare,
  FileText,
  Megaphone,
  Handshake,
  FolderOpen,
  Plug,
} from 'lucide-react'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { ActivityFeed } from '@/components/shared/ActivityFeed'
import { MemberProfileModal } from '@/components/shared/MemberProfileModal'
import { ProfileSelector } from '@/components/shared/ProfileSelector'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const tabs = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'events', label: 'Events', icon: CalendarDays },
  { id: 'boards', label: 'My Board', icon: KanbanSquare },
  { id: 'meetings', label: 'Meeting Minutes', icon: FileText },
  { id: 'marketing', label: 'Marketing', icon: Megaphone },
  { id: 'partnerships', label: 'Partnerships', icon: Handshake },
  { id: 'resources', label: 'Resources', icon: FolderOpen },
  { id: 'integrations', label: 'Integrations', icon: Plug },
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

  // Defer rendering until after hydration to avoid server/client mismatch
  // (localStorage is unavailable on the server, so activeProfileId differs)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

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
  const isMembership = role.includes('membership')

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

  // Wait for client hydration before reading localStorage-backed store state
  if (!mounted) {
    return <ProfileSelector members={[]} loading={true} onSelect={() => {}} />
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
      <div className="h-1 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-blue-600" />
      <header className="glass sticky top-0 z-30 border-b border-border px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src="https://res.cloudinary.com/dp0wzw4wa/image/upload/q_auto/f_auto/v1776338473/JCI_YOUTH_IICS-3_1_sb89ll.png"
            alt="JCI Youth IICS"
            className="h-10 w-10 rounded-full object-cover ring-2 ring-violet-500/20 shadow-soft"
          />
          <div className="hidden md:block leading-tight">
            <p className="text-sm font-bold tracking-tight">JCI Youth IICS</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Command Dashboard</p>
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
            aria-label="President View"
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
              activeTab === 'president'
                ? 'bg-violet-600 text-white shadow-glow'
                : presidentUnlocked
                ? 'bg-violet-100 text-violet-700 hover:bg-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:hover:bg-violet-900/50'
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

      <nav className="glass sticky top-[64px] z-20 border-b border-border px-4 sm:px-6 overflow-x-auto">
        <div className="flex gap-1 min-w-max py-2">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setTab(tab.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 whitespace-nowrap ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-soft'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </nav>

      <main key={activeTab} className="px-4 sm:px-6 py-6 max-w-[1400px] mx-auto animate-fade-in-up">
        {activeTab === 'overview' && <OverviewTab tasks={tasks} members={members} loading={loading} />}
        {activeTab === 'president' && presidentUnlocked && <PresidentViewTab tasks={tasks} members={members} loading={loading} onMemberClick={(member) => setProfileMemberId(member.id)} />}
        {activeTab === 'events' && <EventsTab members={members} />}
        {activeTab === 'boards' && <BoardsTab tasks={isPresident ? tasks : myTasks} members={members} loading={loading} activeProfileId={activeProfileId} isPresident={isPresident} onMemberClick={(member) => setProfileMemberId(member.id)} />}
        {activeTab === 'meetings' && <MeetingMinutesTab members={members} canEdit={isPresident || isSecretary} />}
        {activeTab === 'marketing' && <MarketingTab members={members} canEdit={isPresident || isMarketing} />}
        {activeTab === 'partnerships' && <PartnershipsTab canEdit={isPresident || isMembership} />}
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
                <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-950/50 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-violet-600 dark:text-violet-400" />
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
