import { motion } from 'framer-motion';
import { Flame, Share2, Upload } from 'lucide-react';
import { Habit, HabitLog, HabitWithProgress } from '@/lib/types';
import { computeStreak, totalRepsForHabit, votesCast } from '@/lib/habits';

interface Props {
  habits: Habit[];
  logs: HabitLog[];
  todayHabits: HabitWithProgress[];
}

function ShareButton({ title, text }: { title: string; text: string }) {
  const share = async () => {
    if (navigator.share) {
      await navigator.share({ title, text });
      return;
    }
    await navigator.clipboard?.writeText(text);
  };

  return (
    <button
      type="button"
      onClick={share}
      className="flex h-9 items-center gap-1.5 rounded-full border border-ink/[0.08] bg-ink/[0.04] px-4 text-[12px] font-semibold text-ink transition-transform active:scale-95"
    >
      Share
      <Upload size={15} strokeWidth={2.4} />
    </button>
  );
}

export default function ProgressScreen({ habits, logs }: Props) {
  const totalReps = logs.reduce((sum, log) => sum + log.reps_added, 0);
  const totalVotes = votesCast(habits, logs);
  const bestStreak = habits.reduce((best, habit) => Math.max(best, computeStreak(habit, logs, new Date())), 0);
  const streakHabit = habits.reduce<Habit | null>((best, habit) => {
    if (!best || computeStreak(habit, logs, new Date()) > computeStreak(best, logs, new Date())) return habit;
    return best;
  }, null);
  const streakLabel = streakHabit?.title ?? 'your habits';
  const streakDays = bestStreak || 0;
  const identityLabel = habits[0]?.identity_target || 'a better me';
  const repetitionLabel = habits[0]?.title || 'your habits';

  return (
    <div
      className="min-h-full px-3 pb-32 text-ink"
      style={{
        backgroundImage: 'radial-gradient(rgba(25,25,25,0.06) 1px, transparent 1px)',
        backgroundPosition: 'right 8px top 0',
        backgroundSize: '7px 7px',
      }}
    >
      <header className="px-1 pt-[calc(12px+var(--safe-top))]">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F5C86A] text-[10px] font-semibold text-ink shadow-sm">
          ME
        </div>
        <h1 className="mt-9 font-serif text-[28px] leading-none text-ink">Habit progress</h1>
        <p className="mt-2 max-w-[290px] text-[12px] leading-[1.25] text-ink/50">
          Great work! Every action you take is a vote for the type of person you wish to become.
        </p>
      </header>

      <div className="mt-9 flex h-[20px] items-center rounded-full bg-ink/[0.08] p-0.5 text-[9px] font-semibold text-ink/70">
        <button type="button" className="h-full flex-1 rounded-full bg-white text-ink shadow-sm">
          Progress
        </button>
        <button type="button" className="h-full flex-1 rounded-full">Milestones</button>
      </div>

      <main className="mt-4 flex flex-col gap-3">
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[20px] border border-ink/[0.08] bg-white px-3.5 pb-3.5 pt-3.5 shadow-[0_2px_8px_rgba(25,25,25,0.03)]"
        >
          <div className="flex items-start justify-between">
            <h2 className="text-[11px] font-semibold text-ink">Total repetitions</h2>
            <ShareButton
              title="Habit progress"
              text={`I've cast ${totalVotes} votes towards becoming ${identityLabel}.`}
            />
          </div>
          <p className="mt-3 font-serif text-[30px] leading-none text-ink">{totalReps}</p>
          <p className="mt-3 max-w-[250px] font-serif text-[14px] leading-[1.25] text-ink">
            I’ve cast <span className="underline decoration-ink/50 underline-offset-2">{totalVotes} votes</span> towards becoming a better me.
          </p>
          <div className="mt-4 flex h-7 items-center justify-between rounded-lg bg-[#F8F7F3] px-2 text-[11px] text-ink/60">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#F7C85F]" />
              Read at least 10 pages
            </span>
            <span className="font-semibold text-ink">{totalReps}</span>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-[20px] border border-ink/[0.08] bg-white px-3.5 pb-3.5 pt-3.5 shadow-[0_2px_8px_rgba(25,25,25,0.03)]"
        >
          <div className="flex items-start justify-between">
            <h2 className="text-[11px] font-semibold text-ink">Identity reflection</h2>
            <ShareButton title="Identity reflection" text="Are you making progress towards your identities?" />
          </div>
          <p className="mt-3 max-w-[280px] font-serif text-[14px] leading-[1.25] text-ink">
            Are you making progress towards your identities?
          </p>
          <p className="mt-5 text-[10px] text-ink/60">Last 5 reflections</p>
          <div className="mt-3 rounded-lg bg-[#F8F7F3] px-3 pb-2 pt-3">
            <p className="font-serif text-[14px] leading-[1.2] text-ink/45">You don’t have enough<br />reflections yet</p>
            <div className="mt-4 flex h-5 items-end justify-between border-b border-ink/10 px-1">
              {[0, 1, 2, 3, 4].map((tick) => <span key={tick} className="h-2 w-px bg-ink/10" />)}
            </div>
            <div className="mt-2 flex justify-between text-[9px] font-semibold text-ink">
              <span>NO</span>
              <span>YES</span>
            </div>
          </div>
          <button type="button" className="mt-3 h-8 w-full rounded-full bg-ink text-[10px] font-semibold text-white transition-transform active:scale-[0.98]">
            Log identity reflection
          </button>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-[20px] border border-ink/[0.08] bg-white px-3.5 pb-4 pt-3.5 shadow-[0_2px_8px_rgba(25,25,25,0.03)]"
        >
          <div className="flex items-start justify-between">
            <h2 className="text-[11px] font-semibold text-ink">Streaks</h2>
            <ShareButton title="Habit streaks" text={`${streakDays} days in a row on ${streakLabel}.`} />
          </div>
          <p className="mt-3 font-serif text-[30px] leading-none text-ink">{streakDays}</p>
          <p className="mt-3 max-w-[250px] font-serif text-[14px] leading-[1.2] text-ink">
            My best streak is <span className="underline decoration-ink/50 underline-offset-2">{streakDays} days</span><br />
            on <span className="underline decoration-ink/50 underline-offset-2">{repetitionLabel}</span>
          </p>
          <div className="mt-5 flex items-center gap-4">
            <Flame size={62} fill="#F7C35D" strokeWidth={0} className="text-[#F7C35D]" />
            <div>
              <p className="font-serif text-[15px] text-ink">{streakDays} days in a row!</p>
              <p className="mt-1 text-[11px] text-ink/70">{repetitionLabel}</p>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-[20px] border border-ink/[0.08] bg-white px-3.5 pb-3.5 pt-3.5 shadow-[0_2px_8px_rgba(25,25,25,0.03)]"
        >
          <div className="flex items-start justify-between">
            <h2 className="text-[11px] font-semibold text-ink">Reflection</h2>
            <ShareButton title="Habit reflection" text="How do you feel about your progress towards forming your habits?" />
          </div>
          <p className="mt-4 max-w-[280px] font-serif text-[18px] leading-[1.05] text-ink">
            How do you feel about your progress towards forming your habits?
          </p>
          <p className="mt-7 text-[14px] text-ink/55">You don’t have enough reflections yet</p>
          <button type="button" className="mt-4 h-10 w-full rounded-full bg-ink text-[11px] font-semibold text-white transition-transform active:scale-[0.98]">
            Log habit reflection
          </button>
        </motion.section>
      </main>
    </div>
  );
}
