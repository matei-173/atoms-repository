import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { HabitWithProgress } from '@/lib/types';
import { greetingFor, formatLongDate } from '@/lib/date';
import DateStrip from '@/components/DateStrip';
import HabitCard from '@/components/HabitCard';
import { useProfile } from '@/lib/profile';

interface Props {
  habits: HabitWithProgress[];
  selectedDate: Date;
  today: Date;
  onSelectDate: (d: Date) => void;
  onAddHabit: () => void;
  onComplete: (habit: HabitWithProgress) => void;
  onUndo: (habit: HabitWithProgress) => void;
}

export default function HomeScreen({
  habits,
  selectedDate,
  today,
  onSelectDate,
  onAddHabit,
  onComplete,
  onUndo,
}: Props) {
  const [profile] = useProfile();
  const greeting = greetingFor(new Date());

  const sorted = useMemo(() => {
    return [...habits].sort((a, b) => {
      if (a.completedToday !== b.completedToday) return a.completedToday ? 1 : -1;
      return 0;
    });
  }, [habits]);

  const completedCount = habits.filter((h) => h.completedToday).length;

  return (
    <div className="px-1 pb-32">
      <header className="pt-[calc(12px+var(--safe-top))]">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[13px] font-medium text-ink/45">{greeting}, {profile.name}</p>
            <h1 className="mt-1 font-serif text-[28px] leading-tight text-ink">
              {formatLongDate(new Date()).split(',')[0]}
            </h1>
            <p className="mt-0.5 text-[13px] text-ink/40">
              {completedCount} of {habits.length} done today
            </p>
          </div>
          <button
            onClick={onAddHabit}
            className="flex items-center gap-1.5 rounded-full bg-ink px-4 py-2.5 text-[13px] font-semibold text-white transition-transform active:scale-95"
          >
            <Plus size={16} strokeWidth={2.5} />
            Habits
          </button>
        </div>

        <DateStrip
          selected={selectedDate}
          today={today}
          onSelect={onSelectDate}
        />
      </header>

      <div className="mt-4 flex flex-col gap-4">
        <AnimatePresence mode="popLayout">
          {sorted.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-[32px] border border-dashed border-ink/15 bg-surface-alt px-6 py-16 text-center backdrop-blur-xl"
            >
              <p className="font-serif text-2xl text-ink/70">No habits yet</p>
              <p className="mt-2 text-[14px] text-ink/45">
                Tap "Habits" up top to build your first one.
              </p>
            </motion.div>
          )}
          {sorted.map((h) => (
            <HabitCard
              key={h.id}
              habit={h}
              onComplete={() => onComplete(h)}
              onUndo={() => onUndo(h)}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
