'use client'

import { useState, useRef, useEffect } from 'react'
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
import { Lock, X, Eye, EyeOff } from 'lucide-react'

const PRESIDENT_PASSWORD = '2004'

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'events', label: 'Events' },
  { id: 'boards', label: 'Individual Boards' },
  { id: 'meetings', label: 'Meeting Minutes' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'integrations', label: 'Integrations' },
] as const

type TabId = (typeof tabs)[number]['id'] | 'president'

export function DashboardShell() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const activeTab = (searchParams.get('tab') as TabId) || 'overview'

  const { tasks, loading } = useTasks()
  const members = useMembers()

  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [presidentUnlocked, setPresidentUnlocked] = useState(false)
  const passwordInputRef = useRef<HTMLInputElement>(null)

  // If navigated to president tab but not unlocked, redirect to overview
  useEffect(() => {
    if (activeTab === 'president' && !presidentUnlocked) {
      const params = new URLSearchParams(searchParams.toString())
      params.set('tab', 'overview')
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    }
  }, [activeTab, presidentUnlocked, router, pathname, searchParams])

  // Focus password input when modal opens
  useEffect(() => {
    if (showPasswordModal) {
      setTimeout(() => passwordInputRef.current?.focus(), 100)
    }
  }, [showPasswordModal])

  const setTab = (tab: TabId) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tab)
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === PRESIDENT_PASSWORD) {
      setPresidentUnlocked(true)
      setShowPasswordModal(false)
      setPassword('')
      setError('')
      setShowPassword(false)
      setTab('president')
    } else {
      setError('Incorrect password')
      setPassword('')
    }
  }

  const handlePresidentClick = () => {
    if (presidentUnlocked) {
      setTab('president')
    } else {
      setShowPasswordModal(true)
    }
  }

  const handleExitPresidentView = () => {
    setPresidentUnlocked(false)
    setTab('overview')
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="h-1 bg-gradient-to-r from-violet-600 to-blue-600" />
      <header className="border-b border-border px-4 sm:px-6 py-4 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            JCI Youth IICS <span className="text-violet-600">&middot;</span> Command Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {getTodayDisplayKL()}
          </p>
        </div>
        <button
          onClick={handlePresidentClick}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
            presidentUnlocked
              ? 'bg-violet-100 text-violet-700 hover:bg-violet-200'
              : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground'
          }`}
          title="President View"
        >
          <Lock className="h-4 w-4" />
          <span className="hidden sm:inline">President</span>
        </button>
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
        {activeTab === 'president' && presidentUnlocked && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-violet-600" />
                <h2 className="text-sm font-semibold text-violet-600 uppercase tracking-wide">
                  President View
                </h2>
              </div>
              <button
                onClick={handleExitPresidentView}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <X className="h-3.5 w-3.5" />
                Exit President View
              </button>
            </div>
            <PresidentViewTab tasks={tasks} members={members} loading={loading} />
          </div>
        )}
        {activeTab === 'events' && <EventsTab members={members} />}
        {activeTab === 'boards' && <BoardsTab tasks={tasks} members={members} loading={loading} />}
        {activeTab === 'meetings' && <MeetingMinutesTab members={members} />}
        {activeTab === 'marketing' && <MarketingTab members={members} />}
        {activeTab === 'integrations' && <IntegrationsTab />}
      </main>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-violet-100 flex items-center justify-center">
                <Lock className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold">President Access</h3>
                <p className="text-xs text-muted-foreground">Enter password to continue</p>
              </div>
            </div>
            <form onSubmit={handlePasswordSubmit}>
              <div className="relative">
                <input
                  ref={passwordInputRef}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setError('')
                  }}
                  placeholder="Enter password"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-shadow"
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {error && (
                <p className="text-xs text-red-600 mt-2">{error}</p>
              )}
              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false)
                    setPassword('')
                    setError('')
                    setShowPassword(false)
                  }}
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border border-border hover:bg-accent transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!password}
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Unlock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
