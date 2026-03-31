import { Suspense } from 'react'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import DashboardLoading from './loading'

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardShell />
    </Suspense>
  )
}
