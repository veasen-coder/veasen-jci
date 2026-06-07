'use client'

import { useEffect } from 'react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[DashboardError]', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-background text-foreground">
      <div className="max-w-xl w-full rounded-xl border border-destructive/30 bg-destructive/5 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-destructive">Dashboard Error</h2>
        <p className="text-sm font-mono break-all bg-muted rounded p-3">
          {error.message || 'Unknown error'}
        </p>
        {error.stack && (
          <pre className="text-xs font-mono text-muted-foreground bg-muted rounded p-3 overflow-auto max-h-48 whitespace-pre-wrap">
            {error.stack}
          </pre>
        )}
        <button
          onClick={reset}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
