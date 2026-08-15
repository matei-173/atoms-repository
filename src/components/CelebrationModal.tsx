import { motion, AnimatePresence } from 'framer-motion';
import { BoltIcon } from './icons';
import { HabitWithProgress } from '@/lib/types';
import { DAY_CODES } from '@/lib/date';

interface Props {
  habit: HabitWithProgress | null;
  onClose: () => void;
  onViewDetails: () => void;
}

export default function CelebrationModal({ habit, onClose, onViewDetails }: Props) {
  return (
    <AnimatePresence>
      {habit && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-ink px-6 dot-grid"
        >
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-[#FFE285] to-[#FFAE33] shadow-[0_0_60px_rgba(255,174,51,0.4)]"
          >
            <BoltIcon className="h-14 w-14 text-ink" />
          </motion.div>

          <motion.p
            initial={{ y: 14, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="mt-8 font-serif text-5xl text-white"
          >
            {habit.repsToday} <span className="text-3xl text-white/70">times</span>
          </motion.p>

          <motion.p
            initial={{ y: 14, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.22 }}
            className="mt-5 max-w-xs text-center text-[15px] leading-relaxed text-white/70"
          >
            Fantastic! That's one more vote toward becoming{' '}
            <span className="font-medium italic text-white">{habit.identity_target}</span>.
          </motion.p>

          {/* 7-day indicator */}
          <motion.div
            initial={{ y: 14, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8 flex items-center gap-2"
          >
            {DAY_CODES.map((d, i) => {
              const done = habit.weekCompletions[i];
              return (
                <div key={d} className="flex flex-col items-center gap-1.5">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-semibold ${
                      done
                        ? 'bg-gradient-to-br from-[#FFE285] to-[#FFAE33] text-ink'
                        : 'bg-white/[0.06] text-white/40'
                    }`}
                  >
                    {done ? '✓' : ''}
                  </div>
                  <span className="text-[10px] uppercase text-white/40">{d}</span>
                </div>
              );
            })}
          </motion.div>

          <motion.div
            initial={{ y: 14, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.38 }}
            className="mt-10 flex w-full max-w-xs flex-col gap-3"
          >
            <button
              onClick={onViewDetails}
              className="rounded-full bg-surface py-3.5 text-[14px] font-semibold text-ink transition-transform active:scale-95"
            >
              View habit details
            </button>
            <button
              onClick={onClose}
              className="rounded-full bg-white/[0.08] py-3.5 text-[14px] font-semibold text-white/80 transition-transform active:scale-95"
            >
              Back to Home
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
