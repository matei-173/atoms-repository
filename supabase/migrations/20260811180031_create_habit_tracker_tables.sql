/*
# Create habit tracker tables

1. New Tables
- `habits` stores the habit sentence, identity goal, schedule, rep target, and current streak.
- `habit_logs` stores each completed rep so progress and celebration history can be calculated.
- `journal_entries` stores one reflection per day for the shared habit tracker workspace.

2. Columns
- `habits.id`, `title`, `time_location`, `identity_target`, `target_reps`, `frequency_days`, `current_streak`, `created_at`.
- `habit_logs.id`, `habit_id`, `completed_at`, `reps_added`.
- `journal_entries.id`, `entry_date`, `content`, `created_at`.

3. Security
- Row level security is enabled on every table.
- This app has no sign-in screen, so the intentionally single-workspace data is readable and writable by anon and authenticated clients through four explicit CRUD policies per table.

4. Notes
- Habit logs reference their parent habit and are deleted automatically if a habit is removed.
- Target reps are constrained to at least one completion per day.
*/

CREATE TABLE IF NOT EXISTS public.habits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  time_location text NOT NULL DEFAULT 'whenever I have a moment',
  identity_target text NOT NULL DEFAULT 'a better me',
  target_reps integer NOT NULL DEFAULT 1 CHECK (target_reps > 0),
  frequency_days text[] NOT NULL DEFAULT ARRAY['Mon','Tue','Wed','Thu','Fri','Sat','Sun']::text[],
  current_streak integer NOT NULL DEFAULT 0 CHECK (current_streak >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.habit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id uuid NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  completed_at timestamptz NOT NULL DEFAULT now(),
  reps_added integer NOT NULL DEFAULT 1 CHECK (reps_added > 0)
);

CREATE TABLE IF NOT EXISTS public.journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_date date NOT NULL UNIQUE,
  content text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS habit_logs_habit_id_completed_at_idx ON public.habit_logs(habit_id, completed_at);
CREATE INDEX IF NOT EXISTS journal_entries_entry_date_idx ON public.journal_entries(entry_date);

ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "workspace_select_habits" ON public.habits;
CREATE POLICY "workspace_select_habits" ON public.habits FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "workspace_insert_habits" ON public.habits;
CREATE POLICY "workspace_insert_habits" ON public.habits FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "workspace_update_habits" ON public.habits;
CREATE POLICY "workspace_update_habits" ON public.habits FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "workspace_delete_habits" ON public.habits;
CREATE POLICY "workspace_delete_habits" ON public.habits FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "workspace_select_habit_logs" ON public.habit_logs;
CREATE POLICY "workspace_select_habit_logs" ON public.habit_logs FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "workspace_insert_habit_logs" ON public.habit_logs;
CREATE POLICY "workspace_insert_habit_logs" ON public.habit_logs FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "workspace_update_habit_logs" ON public.habit_logs;
CREATE POLICY "workspace_update_habit_logs" ON public.habit_logs FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "workspace_delete_habit_logs" ON public.habit_logs;
CREATE POLICY "workspace_delete_habit_logs" ON public.habit_logs FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "workspace_select_journal_entries" ON public.journal_entries;
CREATE POLICY "workspace_select_journal_entries" ON public.journal_entries FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "workspace_insert_journal_entries" ON public.journal_entries;
CREATE POLICY "workspace_insert_journal_entries" ON public.journal_entries FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "workspace_update_journal_entries" ON public.journal_entries;
CREATE POLICY "workspace_update_journal_entries" ON public.journal_entries FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "workspace_delete_journal_entries" ON public.journal_entries;
CREATE POLICY "workspace_delete_journal_entries" ON public.journal_entries FOR DELETE TO anon, authenticated USING (true);