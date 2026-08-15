import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Plus, Minus } from 'lucide-react';
import { DayCode, ALL_DAYS } from '@/lib/types';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreate: (input: {
    title: string;
    time_location: string;
    identity_target: string;
    target_reps: number;
    frequency_days: DayCode[];
  }) => Promise<void>;
}

const PRESETS: { label: string; title: string; time: string; identity: string; reps: number; days: DayCode[] }[] = [
  { label: 'Read 20 minutes', title: 'read for 20 minutes', time: 'in the morning', identity: 'a lifelong reader', reps: 1, days: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'] },
  { label: 'Drink 3 L water', title: 'drink 3 L of water', time: 'throughout the day', identity: 'someone who takes care of my body', reps: 3, days: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'] },
  { label: 'Meditate', title: 'meditate for 10 minutes', time: 'after waking up', identity: 'a calm, present person', reps: 1, days: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'] },
  { label: 'Workout', title: 'do a 30-minute workout', time: 'in the evening', identity: 'someone who is strong and fit', reps: 1, days: ['Mon','Wed','Fri'] },
  { label: 'Journal', title: 'write in my journal', time: 'before bed', identity: 'a reflective person', reps: 1, days: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'] },
  { label: 'Walk 10k steps', title: 'walk 10,000 steps', time: 'during lunch', identity: 'an active person', reps: 1, days: ['Mon','Tue','Wed','Thu','Fri'] },
];

const STEPS = ['habit', 'time', 'identity', 'schedule'] as const;

export default function HabitWizard({ open, onClose, onCreate }: Props) {
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [identity, setIdentity] = useState('');
  const [targetReps, setTargetReps] = useState(1);
  const [days, setDays] = useState<DayCode[]>([...ALL_DAYS]);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setStep(0);
    setTitle('');
    setTime('');
    setIdentity('');
    setTargetReps(1);
    setDays([...ALL_DAYS]);
  };

  const close = () => {
    reset();
    onClose();
  };

  const toggleDay = (d: DayCode) => {
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  };

  const canNext = () => {
    if (step === 0) return title.trim().length > 0;
    if (step === 1) return time.trim().length > 0;
    if (step === 2) return identity.trim().length > 0;
    return true;
  };

  const finish = async () => {
    if (days.length === 0) return;
    setSaving(true);
    try {
      await onCreate({
        title: title.trim(),
        time_location: time.trim(),
        identity_target: identity.trim(),
        target_reps: targetReps,
        frequency_days: days,
      });
      reset();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const applyPreset = (p: (typeof PRESETS)[number]) => {
    setTitle(p.title);
    setTime(p.time);
    setIdentity(p.identity);
    setTargetReps(p.reps);
    setDays(p.days);
    setStep(3);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 backdrop-blur-sm sm:items-center"
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            className="flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-[36px] bg-cream text-ink sm:rounded-[36px]"
          >
            <div className="flex items-center justify-between px-6 pt-6">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-ink/40">
                  Step {step + 1} of {STEPS.length}
                </p>
                <h2 className="mt-1 font-serif text-2xl text-ink">New habit</h2>
              </div>
              <button
                onClick={close}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-ink/[0.05] text-ink/60 transition-transform active:scale-90"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {step === 0 && (
                    <div>
                      <p className="text-[15px] text-ink/60">I will</p>
                      <input
                        autoFocus
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="read for 20 minutes"
                        className="mt-2 w-full rounded-2xl border border-ink/10 bg-surface px-4 py-3.5 font-serif text-xl text-ink outline-none focus:border-ink/30"
                      />
                      <div className="mt-4 flex items-center justify-between rounded-2xl border border-ink/10 bg-surface px-4 py-3">
                        <span className="text-[13px] font-medium text-ink/70">Target reps</span>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setTargetReps((r) => Math.max(1, r - 1))}
                            className="flex h-7 w-7 items-center justify-center rounded-full bg-ink/[0.05] text-ink/70"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-6 text-center font-serif text-lg">{targetReps}</span>
                          <button
                            onClick={() => setTargetReps((r) => Math.min(20, r + 1))}
                            className="flex h-7 w-7 items-center justify-center rounded-full bg-ink/[0.05] text-ink/70"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  {step === 1 && (
                    <div>
                      <p className="text-[15px] text-ink/60">I will do it</p>
                      <input
                        autoFocus
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        placeholder="in the morning"
                        className="mt-2 w-full rounded-2xl border border-ink/10 bg-surface px-4 py-3.5 font-serif text-xl text-ink outline-none focus:border-ink/30"
                      />
                    </div>
                  )}
                  {step === 2 && (
                    <div>
                      <p className="text-[15px] text-ink/60">so that I can become</p>
                      <input
                        autoFocus
                        value={identity}
                        onChange={(e) => setIdentity(e.target.value)}
                        placeholder="a lifelong reader"
                        className="mt-2 w-full rounded-2xl border border-ink/10 bg-surface px-4 py-3.5 font-serif text-xl text-ink outline-none focus:border-ink/30"
                      />
                    </div>
                  )}
                  {step === 3 && (
                    <div>
                      <p className="text-[15px] text-ink/60">On these days</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {ALL_DAYS.map((d) => {
                          const active = days.includes(d);
                          return (
                            <button
                              key={d}
                              onClick={() => toggleDay(d)}
                              className={`flex h-12 w-12 items-center justify-center rounded-2xl text-[13px] font-semibold transition-colors ${
                                active
                                  ? 'bg-ink text-white'
                                  : 'bg-surface text-ink/50 border border-ink/10'
                              }`}
                            >
                              {d}
                            </button>
                          );
                        })}
                      </div>
                      <div className="mt-6 rounded-2xl bg-surface/60 p-4 text-center">
                        <p className="font-serif text-[17px] leading-relaxed text-ink">
                          I will <span className="italic">{title || '…'}</span>,{' '}
                          <span className="italic">{time || '…'}</span> so that I can become{' '}
                          <span className="italic">{identity || '…'}</span>
                        </p>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="border-t border-ink/[0.06] px-6 pb-[calc(20px+var(--safe-bottom))] pt-4">
              {step < STEPS.length - 1 ? (
                <button
                  disabled={!canNext()}
                  onClick={() => setStep((s) => s + 1)}
                  className="w-full rounded-full bg-ink py-3.5 text-[14px] font-semibold text-white transition-transform active:scale-95 disabled:opacity-30"
                >
                  Continue
                </button>
              ) : (
                <button
                  disabled={saving || days.length === 0}
                  onClick={finish}
                  className="w-full rounded-full bg-ink py-3.5 text-[14px] font-semibold text-white transition-transform active:scale-95 disabled:opacity-30"
                >
                  {saving ? 'Creating…' : 'Create habit'}
                </button>
              )}

              <div className="mt-4">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink/35">
                  Quick presets
                </p>
                <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
                  {PRESETS.map((p) => (
                    <button
                      key={p.label}
                      onClick={() => applyPreset(p)}
                      className="flex shrink-0 items-center gap-1.5 rounded-full border border-ink/10 bg-surface px-3 py-2 text-[12px] font-medium text-ink/70 transition-colors active:bg-ink/5"
                    >
                      <Check size={12} className="text-ink/30" />
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
