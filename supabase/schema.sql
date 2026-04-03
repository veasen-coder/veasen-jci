-- JCI Youth IICS Command Dashboard — Database Schema

-- Members table
CREATE TABLE IF NOT EXISTS members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL,
  initials text NOT NULL,
  color_hex text NOT NULL,
  bg_hex text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in-progress', 'blocked', 'done')),
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal', 'high')),
  due_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Daily summaries table
CREATE TABLE IF NOT EXISTS daily_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  summary_date date NOT NULL UNIQUE,
  completed_today jsonb,
  up_next jsonb,
  weekly_narrative text,
  blockers_narrative text,
  generated_at timestamptz DEFAULT now()
);

-- Auto-update updated_at on tasks
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_summaries ENABLE ROW LEVEL SECURITY;

-- MVP policies: allow all for authenticated and anon users
CREATE POLICY "Allow all access to members" ON members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to tasks" ON tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to daily_summaries" ON daily_summaries FOR ALL USING (true) WITH CHECK (true);

-- Enable realtime for tasks
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;

-- Meeting minutes table
CREATE TABLE IF NOT EXISTS meeting_minutes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  meeting_date date NOT NULL,
  attendee_ids uuid[] NOT NULL DEFAULT '{}',
  agenda text,
  notes text,
  action_items jsonb DEFAULT '[]',
  attachments jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE meeting_minutes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to meeting_minutes" ON meeting_minutes FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER update_meeting_minutes_updated_at
  BEFORE UPDATE ON meeting_minutes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  event_date date NOT NULL,
  poster_url text,
  status text NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'in-progress', 'completed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to events" ON events FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Marketing posts table
CREATE TABLE IF NOT EXISTS marketing_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  platform text NOT NULL CHECK (platform IN ('instagram', 'facebook', 'tiktok', 'twitter', 'linkedin', 'other')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'posted')),
  due_date date,
  description text,
  assigned_to uuid REFERENCES members(id),
  content_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE marketing_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to marketing_posts" ON marketing_posts FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER update_marketing_posts_updated_at BEFORE UPDATE ON marketing_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add event_id and needs_qc to tasks (run as ALTER if table already exists)
-- ALTER TABLE tasks ADD COLUMN IF NOT EXISTS event_id uuid REFERENCES events(id) ON DELETE SET NULL;
-- ALTER TABLE tasks ADD COLUMN IF NOT EXISTS needs_qc boolean NOT NULL DEFAULT false;

-- Add google_docs_url to meeting_minutes (run as ALTER if table already exists)
-- ALTER TABLE meeting_minutes ADD COLUMN IF NOT EXISTS google_docs_url text;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_member_id ON tasks(member_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_updated_at ON tasks(updated_at);
CREATE INDEX IF NOT EXISTS idx_meeting_minutes_date ON meeting_minutes(meeting_date DESC);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_marketing_posts_due ON marketing_posts(due_date);
