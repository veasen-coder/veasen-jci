'use client'

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

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'president', label: 'President View' },
  { id: 'events', label: 'Events' },
  { id: 'boards', label: 'Individual Boards' },
  { id: 'meetings', label: 'Meeting Minutes' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'integrations', label: 'Integrations' },
] as const

type TabId = (typeof tabs)[number]['id']

export function DashboardShell() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const activeTab = (searchParams.get('tab') as TabId) || 'overview'

  const { tasks, loading } = useTasks()
  const members = useMembers()

  const setTab = (tab: TabId) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tab)
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="h-1 bg-gradient-to-r from-violet-600 to-blue-600" />
      <header className="border-b border-border px-4 sm:px-6 py-4">
        <h1 className="text-xl font-semibold tracking-tight">
          JCI Youth IICS <span className="text-violet-600">&middot;</span> Command Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {getTodayDisplayKL()}
        </p>
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
        {activeTab === 'president' && <PresidentViewTab tasks={tasks} members={members} loading={loading} />}
        {activeTab === 'events' && <EventsTab members={members} />}
        {activeTab === 'boards' && <BoardsTab tasks={tasks} members={members} loading={loading} />}
        {activeTab === 'meetings' && <MeetingMinutesTab members={members} />}
        {activeTab === 'marketing' && <MarketingTab members={members} />}
        {activeTab === 'integrations' && <IntegrationsTab />}
      </main>
    </div>
  )
}
