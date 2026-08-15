export type DayCode = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export const ALL_DAYS: DayCode[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export interface Habit {
  id: string;
  title: string;
  time_location: string;
  identity_target: string;
  target_reps: number;
  frequency_days: DayCode[];
  current_streak: number;
  created_at: string;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  completed_at: string;
  reps_added: number;
}

/** Streak state following the "never miss twice" rule. */
export type StreakStatus = 'active' | 'grace' | 'broken';

export interface StreakInfo {
  count: number;
  status: StreakStatus;
}

export interface HabitWithProgress extends Habit {
  repsToday: number;
  completedToday: boolean;
  weekCompletions: boolean[];
  streak: StreakInfo;
}
