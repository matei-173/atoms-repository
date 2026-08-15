import { useCallback, useEffect, useMemo, useState } from 'react';
import { Habit, HabitLog, HabitWithProgress } from '@/lib/types';
import {
  addLog,
  computeProgress,
  computeStreakInfo,
  createHabit,
  fetchHabits,
  fetchLogsForRange,
  habitActiveOnDay,
  removeLastLog,
  updateStreak,
} from '@/lib/habits';
import { addDays, startOfDay } from '@/lib/date';
import BottomNav, { Tab } from '@/components/BottomNav';
import HomeScreen from '@/screens/HomeScreen';
import ProgressScreen from '@/screens/ProgressScreen';
import FocusScreen from '@/screens/FocusScreen';
import SettingsScreen from '@/screens/SettingsScreen';
import HabitWizard from '@/components/HabitWizard';
import CelebrationModal from '@/components/CelebrationModal';
import { getProfile, useProfile } from '@/lib/profile';

export default function App() {
  const [tab, setTab] = useState<Tab>('home');
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [wizardOpen, setWizardOpen] = useState(false);
  const [celebration, setCelebration] = useState<HabitWithProgress | null>(null);

  const [profile] = useProfile();

  const today = useMemo(() => new Date(), []);

  useEffect(() => {
    const root = document.documentElement;
    if (profile.darkMode) root.classList.add('dark');
    else root.classList.remove('dark');
  }, [profile.darkMode]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const h = await fetchHabits();
      const rangeStart = startOfDay(addDays(today, -7));
      const rangeEnd = addDays(today, 8);
      const l = await fetchLogsForRange(rangeStart, rangeEnd);
      setHabits(h);
      setLogs(l);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong loading your data.');
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const habitsForSelectedDay = useMemo(
    () => habits.filter((h) => habitActiveOnDay(h, selectedDate)),
    [habits, selectedDate],
  );

  const todayHabits: HabitWithProgress[] = useMemo(
    () => habitsForSelectedDay.map((h) => computeProgress(h, logs, selectedDate)),
    [habitsForSelectedDay, logs, selectedDate],
  );

  const handleComplete = useCallback(
    async (habit: HabitWithProgress) => {
      try {
        const log = await addLog(habit.id, 1);
        setLogs((prev) => [...prev, log]);
        const newReps = habit.repsToday + 1;
        const justCompleted = newReps >= habit.target_reps && !habit.completedToday;
        if (justCompleted) {
          const updated = { ...habit, repsToday: newReps, completedToday: true };
          const streakInfo = computeStreakInfo(updated, [...logs, log], selectedDate);
          await updateStreak(habit.id, streakInfo.count);
          setHabits((prev) => prev.map((h) => (h.id === habit.id ? { ...h, current_streak: streakInfo.count } : h)));
          setCelebration({ ...updated, current_streak: streakInfo.count, streak: streakInfo });
          const prefs = getProfile();
          if (prefs.haptics && 'vibrate' in navigator) navigator.vibrate(50);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not log completion.');
      }
    },
    [logs, selectedDate],
  );

  const handleUndo = useCallback(
    async (habit: HabitWithProgress) => {
      try {
        await removeLastLog(habit.id, selectedDate);
        setLogs((prev) => {
          const reversed = [...prev].reverse();
          const idx = reversed.findIndex((l) => l.habit_id === habit.id);
          if (idx === -1) return prev;
          const target = reversed[idx];
          return prev.filter((l) => l.id !== target.id);
        });
        const streakInfo = computeStreakInfo(habit, logs.filter((l) => l.habit_id !== habit.id), selectedDate);
        await updateStreak(habit.id, streakInfo.count);
        setHabits((prev) => prev.map((h) => (h.id === habit.id ? { ...h, current_streak: streakInfo.count } : h)));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not undo completion.');
      }
    },
    [logs, selectedDate],
  );

  const handleCreate = useCallback(
    async (input: {
      title: string;
      time_location: string;
      identity_target: string;
      target_reps: number;
      frequency_days: Habit['frequency_days'];
    }) => {
      try {
        const h = await createHabit(input);
        setHabits((prev) => [...prev, h]);
        setTab('home');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not create habit.');
      }
    },
    [],
  );

  return (
    <div className="h-[100dvh] w-full max-w-md mx-auto overflow-hidden flex flex-col justify-between p-4 pb-24 bg-cream text-ink relative">
      {error && (
        <div className="absolute inset-x-0 top-0 z-50 bg-red-500 px-4 py-3 text-center text-[13px] font-medium text-white">
          {error}
          <button onClick={() => setError(null)} className="ml-3 underline">
            Dismiss
          </button>
        </div>
      )}

      {loading && (
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink/15 border-t-ink" />
        </div>
      )}

      {!loading && (
        <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar">
          {tab === 'home' && (
            <HomeScreen
              habits={todayHabits}
              selectedDate={selectedDate}
              today={today}
              onSelectDate={setSelectedDate}
              onAddHabit={() => setWizardOpen(true)}
              onComplete={handleComplete}
              onUndo={handleUndo}
            />
          )}
          {tab === 'progress' && (
            <ProgressScreen habits={habits} logs={logs} todayHabits={todayHabits} />
          )}
          {tab === 'focus' && <FocusScreen habits={todayHabits} onComplete={handleComplete} />}
          {tab === 'settings' && (
            <SettingsScreen habits={habits} todayHabits={todayHabits} onHabitsChanged={loadAll} />
          )}
        </div>
      )}

      <BottomNav active={tab} onChange={setTab} />

      <HabitWizard open={wizardOpen} onClose={() => setWizardOpen(false)} onCreate={handleCreate} />
      <CelebrationModal
        habit={celebration}
        onClose={() => setCelebration(null)}
        onViewDetails={() => {
          setCelebration(null);
          setTab('progress');
        }}
      />
    </div>
  );
}
