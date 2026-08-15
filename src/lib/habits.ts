import { supabase } from './supabase';
import { DayCode, Habit, HabitLog, HabitWithProgress, StreakInfo, StreakStatus } from './types';
import { addDays, dateKey, dayCodeFor, isSameDay, startOfDay } from './date';

function habitFromRow(row: Record<string, unknown>): Habit {
  return {
    id: row.id as string,
    title: row.title as string,
    time_location: (row.time_location as string) ?? '',
    identity_target: (row.identity_target as string) ?? '',
    target_reps: (row.target_reps as number) ?? 1,
    frequency_days: (row.frequency_days as DayCode[]) ?? [],
    current_streak: (row.current_streak as number) ?? 0,
    created_at: (row.created_at as string) ?? '',
  };
}

export async function fetchHabits(): Promise<Habit[]> {
  const { data, error } = await supabase
    .from('habits')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(habitFromRow);
}

export async function createHabit(input: {
  title: string;
  time_location: string;
  identity_target: string;
  target_reps: number;
  frequency_days: DayCode[];
}): Promise<Habit> {
  const { data, error } = await supabase
    .from('habits')
    .insert({
      title: input.title,
      time_location: input.time_location,
      identity_target: input.identity_target,
      target_reps: input.target_reps,
      frequency_days: input.frequency_days,
    })
    .select('*')
    .single();
  if (error) throw error;
  return habitFromRow(data);
}

export async function deleteHabit(id: string): Promise<void> {
  const { error } = await supabase.from('habits').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchLogsForRange(start: Date, end: Date): Promise<HabitLog[]> {
  const { data, error } = await supabase
    .from('habit_logs')
    .select('*')
    .gte('completed_at', start.toISOString())
    .lt('completed_at', end.toISOString())
    .order('completed_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id as string,
    habit_id: r.habit_id as string,
    completed_at: r.completed_at as string,
    reps_added: r.reps_added as number,
  }));
}

export async function addLog(habitId: string, reps: number): Promise<HabitLog> {
  const { data, error } = await supabase
    .from('habit_logs')
    .insert({ habit_id: habitId, reps_added: reps })
    .select('*')
    .single();
  if (error) throw error;
  return {
    id: data.id as string,
    habit_id: data.habit_id as string,
    completed_at: data.completed_at as string,
    reps_added: data.reps_added as number,
  };
}

export async function removeLastLog(habitId: string, onDate: Date): Promise<void> {
  const start = startOfDay(onDate);
  const end = addDays(start, 1);
  const { data, error } = await supabase
    .from('habit_logs')
    .select('id, completed_at')
    .eq('habit_id', habitId)
    .gte('completed_at', start.toISOString())
    .lt('completed_at', end.toISOString())
    .order('completed_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return;
  const { error: delError } = await supabase.from('habit_logs').delete().eq('id', data.id);
  if (delError) throw delError;
}

export async function updateStreak(habitId: string, streak: number): Promise<void> {
  const { error } = await supabase.from('habits').update({ current_streak: streak }).eq('id', habitId);
  if (error) throw error;
}

export function computeProgress(habit: Habit, logs: HabitLog[], today: Date): HabitWithProgress {
  const todayStart = startOfDay(today);
  const tomorrowStart = addDays(todayStart, 1);
  const todayLogs = logs.filter(
    (l) => l.habit_id === habit.id && new Date(l.completed_at) >= todayStart && new Date(l.completed_at) < tomorrowStart,
  );
  const repsToday = todayLogs.reduce((sum, l) => sum + l.reps_added, 0);
  const completedToday = repsToday >= habit.target_reps;

  const weekCompletions: boolean[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = addDays(today, -i);
    const ds = startOfDay(d);
    const de = addDays(ds, 1);
    const dayLogs = logs.filter(
      (l) => l.habit_id === habit.id && new Date(l.completed_at) >= ds && new Date(l.completed_at) < de,
    );
    const reps = dayLogs.reduce((sum, l) => sum + l.reps_added, 0);
    weekCompletions.push(reps >= habit.target_reps);
  }
  const streak = computeStreakInfo(habit, logs, today);
  return { ...habit, repsToday, completedToday, weekCompletions, streak };
}

export function habitActiveOnDay(habit: Habit, date: Date): boolean {
  if (habit.frequency_days.length === 0) return true;
  return habit.frequency_days.includes(dayCodeFor(date));
}

export function computeStreak(habit: Habit, logs: HabitLog[], today: Date): number {
  return computeStreakInfo(habit, logs, today).count;
}

/**
 * "Never miss twice" streak logic (James Clear / Atomic Habits).
 *
 * - Missing one scheduled day does NOT reset the streak — it enters a grace
 *   period (status "grace", shown as amber).
 * - Completing the habit on a later scheduled day while still in grace
 *   restores the streak to "active" and the count continues.
 * - Missing two consecutive scheduled days resets the streak to 0 / "broken".
 */
export function computeStreakInfo(habit: Habit, logs: HabitLog[], today: Date): StreakInfo {
  const byDate = new Map<string, number>();
  for (const l of logs) {
    if (l.habit_id !== habit.id) continue;
    const d = dateKey(new Date(l.completed_at));
    byDate.set(d, (byDate.get(d) ?? 0) + l.reps_added);
  }

  const isCompleteOn = (date: Date): boolean => {
    const reps = byDate.get(dateKey(date)) ?? 0;
    return reps >= habit.target_reps;
  };

  // Walk backwards from today through scheduled days only.
  let cursor = new Date(today);
  let streak = 0;
  let graceUsed = false;

  while (streak <= 365) {
    if (!habitActiveOnDay(habit, cursor)) {
      cursor = addDays(cursor, -1);
      continue;
    }

    if (isCompleteOn(cursor)) {
      streak += 1;
      cursor = addDays(cursor, -1);
      continue;
    }

    // Missed a scheduled day.
    if (isSameDay(cursor, today)) {
      // Today isn't over yet — don't count as a miss, keep walking.
      cursor = addDays(cursor, -1);
      continue;
    }

    if (!graceUsed) {
      // First miss — enter grace period, keep counting the streak behind it.
      graceUsed = true;
      cursor = addDays(cursor, -1);
      continue;
    }

    // Second consecutive miss — streak is broken.
    break;
  }

  // Determine status: check whether the most recent scheduled day(s) were missed.
  let status: StreakStatus = 'active';

  let probe = new Date(today);
  while (!habitActiveOnDay(habit, probe)) {
    probe = addDays(probe, -1);
  }
  if (isSameDay(probe, today) && !isCompleteOn(probe)) {
    // Today not done — check the previous scheduled day.
    let prev = addDays(probe, -1);
    while (!habitActiveOnDay(habit, prev)) {
      prev = addDays(prev, -1);
    }
    if (!isCompleteOn(prev)) {
      status = 'broken';
    } else {
      status = 'grace';
    }
  } else if (!isCompleteOn(probe)) {
    status = graceUsed ? 'broken' : 'grace';
  }

  if (streak === 0) status = 'broken';

  return { count: streak, status };
}

export function totalRepsForHabit(habitId: string, logs: HabitLog[]): number {
  return logs.filter((l) => l.habit_id === habitId).reduce((s, l) => s + l.reps_added, 0);
}

export function totalRepsAll(habits: Habit[], logs: HabitLog[]): number {
  return logs.reduce((s, l) => s + l.reps_added, 0);
}

export function votesCast(habits: Habit[], logs: HabitLog[]): number {
  const habitIds = new Set(habits.map((h) => h.id));
  return logs.filter((l) => habitIds.has(l.habit_id)).reduce((s, l) => s + l.reps_added, 0);
}

export interface IdentityVote {
  identity: string;
  votes: number;
  fraction: number;
}

/** Aggregates completed reps grouped by each habit's identity_target. */
export function votesByIdentity(habits: Habit[], logs: HabitLog[]): IdentityVote[] {
  const habitMap = new Map(habits.map((h) => [h.id, h]));
  const tally = new Map<string, number>();
  for (const l of logs) {
    const habit = habitMap.get(l.habit_id);
    if (!habit) continue;
    tally.set(habit.identity_target, (tally.get(habit.identity_target) ?? 0) + l.reps_added);
  }
  const total = [...tally.values()].reduce((s, v) => s + v, 0);
  return [...tally.entries()]
    .map(([identity, votes]) => ({ identity, votes, fraction: total > 0 ? votes / total : 0 }))
    .sort((a, b) => b.votes - a.votes);
}
