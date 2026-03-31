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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_member_id ON tasks(member_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_updated_at ON tasks(updated_at);
