import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Check, X } from 'lucide-react';
import { useProfile } from '@/lib/profile';
import { startAmbientNoise, stopAmbientNoise, playTimerBell } from '@/lib/audio';
import { HabitWithProgress } from '@/lib/types';

const PRESETS = [
  { label: '5m', seconds: 5 * 60 },
  { label: '10m', seconds: 10 * 60 },
  { label: '15m', seconds: 15 * 60 },
  { label: '25m', seconds: 25 * 60 },
];

const RING_SIZE = 260;
const STROKE = 8;
const RADIUS = (RING_SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface Props {
  habits: HabitWithProgress[];
  onComplete: (habit: HabitWithProgress) => void;
}

export default function FocusScreen({ habits, onComplete }: Props) {
  const [profile] = useProfile();
  const [duration, setDuration] = useState(25 * 60);
  const [remaining, setRemaining] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [customMin, setCustomMin] = useState('');
  const [customOpen, setCustomOpen] = useState(false);
  const [ambient, setAmbient] = useState(false);
  const [ambientType, setAmbientType] = useState<'brown' | 'white'>('brown');
  const [sessionDone, setSessionDone] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Ambient noise toggle
  useEffect(() => {
    if (ambient) {
      startAmbientNoise(ambientType);
    } else {
      stopAmbientNoise();
    }
    return () => stopAmbientNoise();
  }, [ambient, ambientType]);

  // Timer tick
  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          setRunning(false);
          if (profile.haptics && 'vibrate' in navigator) navigator.vibrate([60, 40, 60]);
          if (profile.sound) playTimerBell();
          setSessionDone(true);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, profile.haptics, profile.sound]);

  const selectPreset = (sec: number) => {
    setRunning(false);
    setDuration(sec);
    setRemaining(sec);
    setSessionDone(false);
  };

  const toggle = () => {
    if (remaining === 0) {
      setRemaining(duration);
      setSessionDone(false);
      setRunning(true);
    } else {
      setRunning((r) => !r);
    }
  };

  const reset = () => {
    setRunning(false);
    setRemaining(duration);
    setSessionDone(false);
  };

  const applyCustom = () => {
    const m = parseInt(customMin, 10);
    if (!isNaN(m) && m > 0 && m <= 180) {
      const sec = m * 60;
      setDuration(sec);
      setRemaining(sec);
      setRunning(false);
      setSessionDone(false);
    }
    setCustomMin('');
    setCustomOpen(false);
  };

  const progress = duration > 0 ? 1 - remaining / duration : 0;
  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');

  const incompleteHabits = habits.filter((h) => !h.completedToday);

  return (
    <div className="px-5 pb-32">
      <header className="pt-[calc(20px+var(--safe-top))]">
        <h1 className="font-serif text-[32px] leading-tight text-ink">Focus</h1>
        <p className="mt-0.5 text-[13px] text-ink/45">A quiet space to do the work</p>
      </header>

      {/* Ambient noise control */}
      <div className="mt-6 flex items-center justify-between rounded-2xl glass-card px-4 py-3">
        <div className="flex items-center gap-2">
          {ambient ? <Volume2 size={16} className="text-ink/60" /> : <VolumeX size={16} className="text-ink/40" />}
          <span className="text-[13px] font-medium text-ink/70">Ambient noise</span>
        </div>
        <div className="flex items-center gap-2">
          {ambient && (
            <div className="flex gap-1">
              {(['brown', 'white'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setAmbientType(t)}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize transition-colors ${
                    ambientType === t ? 'bg-ink text-white' : 'bg-ink/5 text-ink/50'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
          <button
            onClick={() => setAmbient((a) => !a)}
            className={`relative h-[24px] w-[42px] rounded-full transition-colors ${ambient ? 'bg-ink' : 'bg-ink/15'}`}
          >
            <motion.span
              layout
              transition={{ type: 'spring', stiffness: 500, damping: 34 }}
              className={`absolute top-[2px] h-[20px] w-[20px] rounded-full bg-knob shadow-sm ${ambient ? 'right-[2px]' : 'left-[2px]'}`}
            />
          </button>
        </div>
      </div>

      <div className="mt-8 flex flex-col items-center">
        <div className="relative" style={{ width: RING_SIZE, height: RING_SIZE }}>
          <svg width={RING_SIZE} height={RING_SIZE} className="-rotate-90">
            <circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke="var(--color-timer-track)"
              strokeWidth={STROKE}
            />
            <motion.circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke="var(--color-timer-progress)"
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              animate={{ strokeDashoffset: CIRCUMFERENCE * (1 - progress) }}
              transition={{ ease: 'linear', duration: running ? 1 : 0.3 }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-serif text-[56px] leading-none text-ink tabular-nums">
              {mm}:{ss}
            </span>
            <span className="mt-2 text-[12px] font-medium uppercase tracking-wider text-ink/40">
              {running ? 'Focusing' : remaining === 0 ? 'Done' : 'Ready'}
            </span>
          </div>
        </div>

        <div className="mt-10 flex items-center gap-4">
          <button
            onClick={reset}
            className="flex h-12 w-12 items-center justify-center rounded-full glass-card transition-transform active:scale-90"
            aria-label="Reset"
          >
            <RotateCcw size={18} className="text-ink/70" />
          </button>
          <button
            onClick={toggle}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-ink text-white shadow-glass transition-transform active:scale-90"
            aria-label={running ? 'Pause' : 'Start'}
          >
            {running ? <Pause size={26} fill="currentColor" /> : <Play size={26} fill="currentColor" className="ml-1" />}
          </button>
          <div className="h-12 w-12" />
        </div>
      </div>

      <div className="mt-12">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-ink/40">Presets</p>
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {PRESETS.map((p) => {
            const active = duration === p.seconds;
            return (
              <button
                key={p.label}
                onClick={() => selectPreset(p.seconds)}
                className={`flex h-12 shrink-0 items-center justify-center rounded-2xl px-5 text-[14px] font-semibold transition-colors ${
                  active ? 'bg-ink text-white' : 'glass-card text-ink/70'
                }`}
              >
                {p.label}
              </button>
            );
          })}
          <button
            onClick={() => setCustomOpen((o) => !o)}
            className={`flex h-12 shrink-0 items-center justify-center rounded-2xl px-5 text-[14px] font-semibold transition-colors ${
              customOpen ? 'bg-ink text-white' : 'glass-card text-ink/70'
            }`}
          >
            Custom
          </button>
        </div>

        <AnimatePresence>
          {customOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={180}
                  value={customMin}
                  onChange={(e) => setCustomMin(e.target.value)}
                  placeholder="Minutes"
                  className="glass-input w-full rounded-2xl px-4 py-3 text-[15px] text-ink outline-none placeholder:text-ink/40"
                />
                <button
                  onClick={applyCustom}
                  className="shrink-0 rounded-2xl bg-ink px-5 py-3 text-[14px] font-semibold text-white transition-transform active:scale-95"
                >
                  Set
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Session completion prompt */}
      <AnimatePresence>
        {sessionDone && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
            onClick={() => setSessionDone(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="mx-6 w-full max-w-sm rounded-[28px] bg-surface/90 p-6 backdrop-blur-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.12)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
                  <Check size={28} className="text-amber-600" strokeWidth={2.5} />
                </div>
                <h2 className="mt-4 font-serif text-2xl text-ink">Session complete</h2>
                <p className="mt-1 text-[14px] text-ink/50">
                  Great focus. Want to mark a habit as done?
                </p>
              </div>

              {incompleteHabits.length > 0 ? (
                <div className="mt-5 max-h-48 space-y-2 overflow-y-auto">
                  {incompleteHabits.map((h) => (
                    <button
                      key={h.id}
                      onClick={() => {
                        onComplete(h);
                        setSessionDone(false);
                      }}
                      className="flex w-full items-center justify-between rounded-2xl bg-ink/[0.03] px-4 py-3 text-left transition-colors active:bg-ink/[0.06]"
                    >
                      <div>
                        <p className="text-[14px] font-semibold text-ink">{h.title}</p>
                        <p className="text-[12px] text-ink/45">become {h.identity_target}</p>
                      </div>
                      <Check size={18} className="text-ink/40" />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="mt-5 text-center text-[13px] text-ink/40">
                  All habits already completed. Nice work.
                </p>
              )}

              <button
                onClick={() => setSessionDone(false)}
                className="mt-5 w-full rounded-full glass-card py-3 text-[14px] font-semibold text-ink/70 transition-transform active:scale-95"
              >
                Dismiss
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
