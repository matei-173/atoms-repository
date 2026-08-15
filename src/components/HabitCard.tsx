import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, MoreHorizontal, Zap } from 'lucide-react';
import { HabitWithProgress } from '@/lib/types';
import { getProfile } from '@/lib/profile';
import { playHoldSweep, playCompletionChime } from '@/lib/audio';

const HOLD_MS = 800;

interface Props {
  habit: HabitWithProgress;
  onComplete: () => void;
  onUndo: () => void;
  disabled?: boolean;
}

export default function HabitCard({ habit, onComplete, onUndo, disabled }: Props) {
  const [progress, setProgress] = useState(0);
  const [holding, setHolding] = useState(false);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completedRef = useRef(false);
  const stopSweepRef = useRef<(() => void) | null>(null);

  const isDone = habit.completedToday;

  useEffect(() => {
    if (!holding) setProgress(0);
  }, [holding]);

  const tick = () => {
    const elapsed = performance.now() - startRef.current;
    const p = Math.min(1, elapsed / HOLD_MS);
    setProgress(p);
    if (p < 1) {
      rafRef.current = requestAnimationFrame(tick);
    }
  };

  const beginHold = () => {
    if (disabled || isDone) return;
    completedRef.current = false;
    setHolding(true);
    startRef.current = performance.now();
    rafRef.current = requestAnimationFrame(tick);

    const prefs = getProfile();
    if (prefs.sound) {
      stopSweepRef.current = playHoldSweep(220, 440, HOLD_MS / 1000);
    }

    timerRef.current = setTimeout(() => {
      completedRef.current = true;
      finishHold();
    }, HOLD_MS);
  };

  const finishHold = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (timerRef.current) clearTimeout(timerRef.current);
    rafRef.current = null;
    timerRef.current = null;

    if (stopSweepRef.current) {
      stopSweepRef.current();
      stopSweepRef.current = null;
    }

    setHolding(false);
    if (completedRef.current) {
      if ('vibrate' in navigator) navigator.vibrate(50);
      const prefs = getProfile();
      if (prefs.sound) playCompletionChime();
      onComplete();
    } else {
      setProgress(0);
    }
  };

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (stopSweepRef.current) stopSweepRef.current();
    };
  }, []);

  const handleDown = (e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as Element).releasePointerCapture?.(e.pointerId);
    beginHold();
  };

  const handleUp = () => {
    if (holding) finishHold();
  };

  const fillPct = Math.round(progress * 100);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 320, damping: 30 }}
      className="relative w-full select-none"
    >
      <div
        onPointerDown={handleDown}
        onPointerUp={handleUp}
        onPointerLeave={handleUp}
        onPointerCancel={handleUp}
        className={`relative mx-auto flex aspect-square w-[88%] max-w-[360px] flex-col items-center justify-center overflow-hidden p-8 text-center shadow-[0_8px_24px_rgba(25,25,25,0.08)] transition-all duration-300 ${
          isDone
            ? 'bg-gradient-to-br from-[#FFE285] to-[#FFAE33]'
            : 'bg-surface'
        } ${holding ? 'shadow-[0_14px_36px_rgba(0,0,0,0.12)]' : ''}`}
        style={{
          touchAction: 'none',
          borderRadius: '32% 29% 31% 30% / 29% 27% 31% 30%',
        }}
      >
        {/* Radial hold fill */}
        {!isDone && holding && (
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: `radial-gradient(circle at center, rgba(255,174,51,${0.18 + progress * 0.5}) 0%, rgba(255,174,51,${progress * 0.28}) ${fillPct}%, transparent ${fillPct + 2}%)`,
            }}
          />
        )}
        {!isDone && holding && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <svg className="absolute" width="64" height="64" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="28" fill="none" stroke="var(--color-timer-track)" strokeWidth="4" />
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke="#FFAE33"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 28}
                strokeDashoffset={2 * Math.PI * 28 * (1 - progress)}
                transform="rotate(-90 32 32)"
              />
            </svg>
          </div>
        )}

        <span className="absolute left-1/2 top-5 z-10 flex h-8 w-11 -translate-x-1/2 items-center justify-center rounded-full bg-ink/[0.06] text-ink/70">
          <MoreHorizontal size={18} strokeWidth={2.5} />
        </span>

        {habit.streak.count > 0 && (
          <span className="absolute right-5 top-5 z-10 flex h-16 w-16 flex-col items-center justify-center rounded-[21px] bg-[#FFB52E] text-[#191919] shadow-[0_6px_14px_rgba(255,181,46,0.28)]">
            <Zap size={18} fill="currentColor" strokeWidth={2.5} />
            <span className="mt-0.5 text-[15px] font-semibold leading-none">{habit.streak.count}</span>
          </span>
        )}

        {/* Center: habit name + identity tagline (dead-center) */}
        <div className="relative z-10 flex w-full -translate-y-1.5 flex-col items-center justify-center">
          <h3
            className={`max-w-[240px] font-serif text-[29px] leading-[1.18] ${
              isDone ? 'text-ink/80 line-through' : 'text-ink'
            }`}
          >
            {habit.title}
          </h3>
          <p
            className={`mt-3 text-[14px] ${isDone ? 'text-ink/70' : 'text-ink/45'}`}
          >
            I want to become <span className="font-medium italic">{habit.identity_target}</span>
          </p>


        </div>

        {isDone && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUndo();
            }}
            className="absolute bottom-6 left-1/2 z-10 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full bg-surface/90 text-ink shadow-sm transition-transform active:scale-90"
            aria-label="Undo completion"
          >
            <RotateCcw size={16} strokeWidth={2.2} />
          </button>
        )}
      </div>
    </motion.div>
  );
}
