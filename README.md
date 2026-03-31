# JCI Youth IICS — Command Dashboard

A team task management dashboard for the 6-person leadership board of JCI Youth IICS (Malaysia). Provides a unified view of tasks, workload, blockers, priorities, and AI-generated daily/weekly summaries.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Database:** Supabase (PostgreSQL)
- **State:** Zustand
- **Drag & Drop:** @hello-pangea/dnd
- **AI:** Anthropic Claude API (@anthropic-ai/sdk)

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd veasen-JCI
npm install --legacy-peer-deps
```

### 2. Configure environment variables

Copy the example file and fill in your Supabase and Anthropic credentials:

```bash
cp .env.local.example .env.local
```

Required variables:
- `NEXT_PUBLIC_SUPABASE_URL` — Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (for server-side operations)
- `ANTHROPIC_API_KEY` — Anthropic API key (for AI summary generation)

### 3. Set up the database

Run the schema and seed SQL files against your Supabase project:

1. Go to your Supabase dashboard → SQL Editor
2. Run `supabase/schema.sql` to create tables, RLS policies, and indexes
3. Run `supabase/seed.sql` to insert team members and sample tasks
4. Enable Realtime for the `tasks` table (Settings → Realtime → Enable for tasks table)

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to the dashboard.

## Features

- **Overview Tab:** Metric cards, team workload progress bars, member snapshot grid
- **Individual Boards Tab:** Per-member kanban boards with drag-and-drop
- **Priority & Blockers Tab:** Filtered views for blocked, overdue, and high-priority tasks
- **Daily Summary Tab:** Completed today, up next, and AI-generated weekly rollup
- **Integrations Tab:** Information about available integration options

## Team Members

| Name | Role |
|------|------|
| Veasen Teh | President |
| Jia Xuan | Secretary |
| Chin Hong | Treasurer |
| Matthew | Membership Director |
| Angelyn | Activity Director |
| Victoria | Marketing Director |
