-- JCI Youth IICS Command Dashboard — Seed Data

-- Insert members
INSERT INTO members (id, name, role, initials, color_hex, bg_hex) VALUES
  ('a1b2c3d4-0001-4000-8000-000000000001', 'Veasen Teh', 'President', 'VT', '#534AB7', '#EEEDFE'),
  ('a1b2c3d4-0002-4000-8000-000000000002', 'Jia Xuan', 'Secretary', 'JX', '#0F6E56', '#E1F5EE'),
  ('a1b2c3d4-0003-4000-8000-000000000003', 'Chin Hong', 'Treasurer', 'CH', '#185FA5', '#E6F1FB'),
  ('a1b2c3d4-0004-4000-8000-000000000004', 'Matthew', 'Membership Director', 'MT', '#993C1D', '#FAECE7'),
  ('a1b2c3d4-0005-4000-8000-000000000005', 'Angelyn', 'Activity Director', 'AG', '#854F0B', '#FAEEDA'),
  ('a1b2c3d4-0006-4000-8000-000000000006', 'Victoria', 'Marketing Director', 'VC', '#993556', '#FBEAF0');

-- Veasen Teh — President tasks
INSERT INTO tasks (member_id, title, description, status, priority, due_date) VALUES
  ('a1b2c3d4-0001-4000-8000-000000000001', 'Prepare Q2 strategic plan presentation', 'Outline chapter goals for Q2 including membership growth, community projects, and training schedule.', 'in-progress', 'high', '2026-04-04'),
  ('a1b2c3d4-0001-4000-8000-000000000001', 'Review probation evaluations for new members', 'Evaluate 3 probationary members and prepare recommendation letters.', 'todo', 'high', '2026-04-07'),
  ('a1b2c3d4-0001-4000-8000-000000000001', 'Coordinate with JCI Malaysia National for zone meeting', 'Confirm attendance, prepare chapter report, and book travel.', 'in-progress', 'normal', '2026-04-10'),
  ('a1b2c3d4-0001-4000-8000-000000000001', 'Draft partnership proposal for Club Week sponsor', 'Write sponsorship deck for potential corporate partners for Club Week event.', 'todo', 'normal', '2026-04-14'),
  ('a1b2c3d4-0001-4000-8000-000000000001', 'Monthly board alignment call agenda', 'Prepare agenda items and circulate to all board members before the call.', 'done', 'normal', '2026-03-28');

-- Jia Xuan — Secretary tasks
INSERT INTO tasks (member_id, title, description, status, priority, due_date) VALUES
  ('a1b2c3d4-0002-4000-8000-000000000002', 'Compile March board meeting minutes', 'Transcribe and format meeting minutes from the March general meeting.', 'in-progress', 'normal', '2026-04-02'),
  ('a1b2c3d4-0002-4000-8000-000000000002', 'Update member registry with new joiners', 'Add 5 new members to the official chapter registry and send confirmation emails.', 'todo', 'normal', '2026-04-05'),
  ('a1b2c3d4-0002-4000-8000-000000000002', 'File annual chapter report with JCI HQ', 'Complete and submit the annual report form with financials and activity log.', 'blocked', 'high', '2026-04-03'),
  ('a1b2c3d4-0002-4000-8000-000000000002', 'Send Club Week RSVP reminder to all members', 'Draft and send WhatsApp blast + email reminder for Club Week registration.', 'todo', 'normal', '2026-04-08'),
  ('a1b2c3d4-0002-4000-8000-000000000002', 'Archive Q1 meeting documents', 'Organize and archive all Q1 meeting agendas, minutes, and supporting docs to Google Drive.', 'done', 'normal', '2026-03-25');

-- Chin Hong — Treasurer tasks
INSERT INTO tasks (member_id, title, description, status, priority, due_date) VALUES
  ('a1b2c3d4-0003-4000-8000-000000000003', 'Prepare Q1 financial report', 'Consolidate all income and expenses for Q1, prepare balance sheet and P&L statement.', 'in-progress', 'high', '2026-04-05'),
  ('a1b2c3d4-0003-4000-8000-000000000003', 'Process Club Week vendor payments', 'Issue payments to 3 confirmed vendors for Club Week venue and catering.', 'blocked', 'high', '2026-04-01'),
  ('a1b2c3d4-0003-4000-8000-000000000003', 'Submit budget proposal for Q2 activities', 'Draft budget allocation for Q2 events, training, and marketing.', 'todo', 'normal', '2026-04-10'),
  ('a1b2c3d4-0003-4000-8000-000000000003', 'Collect outstanding membership dues', 'Follow up with 8 members who have not paid their annual dues.', 'in-progress', 'normal', '2026-04-07'),
  ('a1b2c3d4-0003-4000-8000-000000000003', 'Reconcile petty cash for March', 'Match receipts against petty cash log and update the spreadsheet.', 'done', 'normal', '2026-03-30');

-- Matthew — Membership Director tasks
INSERT INTO tasks (member_id, title, description, status, priority, due_date) VALUES
  ('a1b2c3d4-0004-4000-8000-000000000004', 'Design onboarding deck for new members', 'Create a welcome presentation covering chapter history, structure, and expectations.', 'in-progress', 'high', '2026-04-06'),
  ('a1b2c3d4-0004-4000-8000-000000000004', 'Organize orientation session for April intake', 'Book venue, prepare materials, and confirm facilitators for new member orientation.', 'todo', 'normal', '2026-04-12'),
  ('a1b2c3d4-0004-4000-8000-000000000004', 'Conduct exit interviews with 2 departing members', 'Schedule and complete feedback sessions to understand reasons for leaving.', 'todo', 'normal', '2026-04-09'),
  ('a1b2c3d4-0004-4000-8000-000000000004', 'Update membership benefits guide', 'Refresh the benefits document with new partner perks and training opportunities.', 'in-progress', 'normal', '2026-04-11'),
  ('a1b2c3d4-0004-4000-8000-000000000004', 'Send March membership growth report', 'Compile stats on new joins, renewals, and attrition for the board.', 'done', 'normal', '2026-03-29');

-- Angelyn — Activity Director tasks
INSERT INTO tasks (member_id, title, description, status, priority, due_date) VALUES
  ('a1b2c3d4-0005-4000-8000-000000000005', 'Finalize Club Week event schedule', 'Lock in timings, speakers, and activity flow for the 2-day Club Week event.', 'in-progress', 'high', '2026-04-03'),
  ('a1b2c3d4-0005-4000-8000-000000000005', 'Book venue for April community service project', 'Confirm booking at community hall and arrange logistics for the cleanup drive.', 'blocked', 'high', '2026-04-02'),
  ('a1b2c3d4-0005-4000-8000-000000000005', 'Plan leadership training workshop', 'Design curriculum and invite guest trainer for the April leadership skills workshop.', 'todo', 'normal', '2026-04-15'),
  ('a1b2c3d4-0005-4000-8000-000000000005', 'Coordinate volunteer signups for charity run', 'Set up signup form and assign roles for the upcoming charity run event.', 'todo', 'normal', '2026-04-13'),
  ('a1b2c3d4-0005-4000-8000-000000000005', 'Submit March activity report', 'Document all activities held in March with attendance and photo evidence.', 'done', 'normal', '2026-03-27');

-- Victoria — Marketing Director tasks
INSERT INTO tasks (member_id, title, description, status, priority, due_date) VALUES
  ('a1b2c3d4-0006-4000-8000-000000000006', 'Design Club Week promotional poster', 'Create eye-catching poster for Club Week and adapt for Instagram, WhatsApp, and print.', 'in-progress', 'high', '2026-04-01'),
  ('a1b2c3d4-0006-4000-8000-000000000006', 'Schedule April social media content calendar', 'Plan 12 posts across Instagram and Facebook for April including event promos and member spotlights.', 'todo', 'normal', '2026-04-05'),
  ('a1b2c3d4-0006-4000-8000-000000000006', 'Shoot and edit member spotlight video', 'Film interview with 2 members for the "Why JCI" social media series.', 'blocked', 'normal', '2026-04-04'),
  ('a1b2c3d4-0006-4000-8000-000000000006', 'Update chapter website with Q1 highlights', 'Add event photos, new member bios, and updated calendar to the website.', 'todo', 'normal', '2026-04-10'),
  ('a1b2c3d4-0006-4000-8000-000000000006', 'Send Club Week press release to local media', 'Draft and distribute press release to 5 local media outlets.', 'todo', 'high', '2026-04-06'),
  ('a1b2c3d4-0006-4000-8000-000000000006', 'Create March social media analytics report', 'Pull metrics from Instagram and Facebook, summarize engagement and growth.', 'done', 'normal', '2026-03-26');
