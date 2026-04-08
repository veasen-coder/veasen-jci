'use client'

import { useState } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useTasks } from '@/hooks/useTasks'
import { useMembers } from '@/hooks/useMembers'
import { getTodayDisplayKL } from '@/lib/utils/dateHelpers'
import { OverviewTab } from './OverviewTab'
import { PresidentViewTab } from './PresidentViewTab'
import { EventsTab } from './EventsTab'
import { BoardsTab } from './BoardsTab'
import { MeetingMinutesTab } from './MeetingMinutesTab'
import { MarketingTab } from './MarketingTab'
import { IntegrationsTab } from './IntegrationsTab'
import { ResourcesTab } from './ResourcesTab'
import { Shield, X, Lock } from 'lucide-react'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { ActivityFeed } from '@/components/shared/ActivityFeed'
import { MemberProfileModal } from '@/components/shared/MemberProfileModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'events', label: 'Events' },
  { id: 'boards', label: 'Individual Boards' },
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

  const [profileMemberId, setProfileMemberId] = useState<string | null>(null)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState(false)
  const [presidentUnlocked, setPresidentUnlocked] = useState(false)

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

  return (
    <div className="min-h-screen bg-background">
      <div className="h-1 bg-gradient-to-r from-violet-600 to-blue-600" />
      <header className="border-b border-border px-4 sm:px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            JCI Youth IICS <span className="text-violet-600">&middot;</span> Command Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {getTodayDisplayKL()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ActivityFeed />
          <ThemeToggle />
          <button
          onClick={handlePresidentClick}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
            activeTab === 'president'
              ? 'bg-violet-600 text-white shadow-md'
              : presidentUnlocked
              ? 'bg-violet-100 text-violet-700 hover:bg-violet-200'
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
          {tabs.map((tab) => (
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
        {activeTab === 'boards' && <BoardsTab tasks={tasks} members={members} loading={loading} onMemberClick={(member) => setProfileMemberId(member.id)} />}
        {activeTab === 'meetings' && <MeetingMinutesTab members={members} />}
        {activeTab === 'marketing' && <MarketingTab members={members} />}
        {activeTab === 'resources' && <ResourcesTab />}
        {activeTab === 'integrations' && <IntegrationsTab />}
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
