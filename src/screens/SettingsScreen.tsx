import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { User, ListChecks, SlidersHorizontal, Database, Vibrate, Volume2, Trash2, Pencil, Check, X, Bell, Clock, Moon } from 'lucide-react';
import { useProfile, updateProfile } from '@/lib/profile';
import { Habit, HabitWithProgress } from '@/lib/types';
import { deleteHabit } from '@/lib/habits';
import { supabase } from '@/lib/supabase';

interface Props {
  habits: Habit[];
  todayHabits: HabitWithProgress[];
  onHabitsChanged: () => void;
}

export default function SettingsScreen({ habits, todayHabits, onHabitsChanged }: Props) {
  const [profile] = useProfile();
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(profile.name);
  const [editingIdentity, setEditingIdentity] = useState(false);
  const [identityDraft, setIdentityDraft] = useState(profile.identity);
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const reminderIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (typeof Notification === 'undefined') {
      setNotifPermission('unsupported');
    } else {
      setNotifPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (profile.darkMode) root.classList.add('dark');
    else root.classList.remove('dark');
  }, [profile.darkMode]);

  // Schedule / clear the local reminder interval based on profile state
  useEffect(() => {
    if (reminderIntervalRef.current) {
      clearInterval(reminderIntervalRef.current);
      reminderIntervalRef.current = null;
    }

    if (!profile.notifications || notifPermission !== 'granted') return;

    const checkAndNotify = () => {
      const now = new Date();
      const [hh, mm] = profile.reminderTime.split(':').map(Number);
      const target = new Date(now);
      target.setHours(hh, mm, 0, 0);

      // Fire if current time is within the same minute as target
      if (now.getHours() === hh && now.getMinutes() === mm) {
        const pending = todayHabits.filter((h) => !h.completedToday);
        const title = pending.length > 0
          ? `${pending.length} habit${pending.length === 1 ? '' : 's'} waiting`
          : 'All habits done today';
        const body = pending.length > 0
          ? `Tap to complete: ${pending.slice(0, 3).map((h) => h.title).join(', ')}${pending.length > 3 ? '…' : ''}`
          : 'Great work — you showed up today.';

        try {
          new Notification(title, { body, icon: '/favicon.svg' });
        } catch {
          /* ignore */
        }
      }
    };

    // Check every 30 seconds
    reminderIntervalRef.current = setInterval(checkAndNotify, 30_000);
    checkAndNotify();

    return () => {
      if (reminderIntervalRef.current) clearInterval(reminderIntervalRef.current);
    };
  }, [profile.notifications, profile.reminderTime, notifPermission, habits]);

  const saveName = () => {
    updateProfile({ name: nameDraft.trim() || 'friend' });
    setEditingName(false);
  };

  const saveIdentity = () => {
    updateProfile({ identity: identityDraft.trim() || 'a disciplined founder' });
    setEditingIdentity(false);
  };

  const removeHabit = async (id: string) => {
    setBusy(true);
    try {
      await deleteHabit(id);
      onHabitsChanged();
    } finally {
      setBusy(false);
      setEditingHabitId(null);
    }
  };

  const clearLogs = async () => {
    setBusy(true);
    try {
      await supabase.from('habit_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      setConfirmClear(false);
      onHabitsChanged();
    } finally {
      setBusy(false);
    }
  };

  const resetLocal = () => {
    localStorage.clear();
    updateProfile({ name: 'friend', identity: 'a disciplined founder', haptics: true, sound: true, notifications: false, reminderTime: '08:00', darkMode: false });
    setConfirmClear(false);
  };

  const toggleNotifications = async () => {
    if (profile.notifications) {
      updateProfile({ notifications: false });
      return;
    }
    if (typeof Notification === 'undefined') return;
    if (Notification.permission === 'granted') {
      setNotifPermission('granted');
      updateProfile({ notifications: true });
    } else {
      const result = await Notification.requestPermission();
      setNotifPermission(result);
      if (result === 'granted') {
        updateProfile({ notifications: true });
      }
    }
  };

  return (
    <div className="px-5 pb-32">
      <header className="pt-[calc(20px+var(--safe-top))]">
        <h1 className="font-serif text-[32px] leading-tight text-ink">Settings</h1>
        <p className="mt-0.5 text-[13px] text-ink/45">Tune the app to fit you</p>
      </header>

      {/* Profile & Identity */}
      <Section icon={User} title="Profile & Identity">
        <Row label="Display name">
          {editingName ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                className="glass-input w-32 rounded-lg px-2 py-1 text-right text-[14px] outline-none"
              />
              <button onClick={saveName} className="text-ink/70"><Check size={16} /></button>
              <button onClick={() => setEditingName(false)} className="text-ink/40"><X size={16} /></button>
            </div>
          ) : (
            <button onClick={() => { setNameDraft(profile.name); setEditingName(true); }} className="flex items-center gap-1.5 text-ink/70">
              <span className="text-[14px]">{profile.name}</span>
              <Pencil size={13} className="text-ink/35" />
            </button>
          )}
        </Row>
        <Row label="I am becoming">
          {editingIdentity ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={identityDraft}
                onChange={(e) => setIdentityDraft(e.target.value)}
                className="glass-input w-40 rounded-lg px-2 py-1 text-right text-[14px] outline-none"
              />
              <button onClick={saveIdentity} className="text-ink/70"><Check size={16} /></button>
              <button onClick={() => setEditingIdentity(false)} className="text-ink/40"><X size={16} /></button>
            </div>
          ) : (
            <button onClick={() => { setIdentityDraft(profile.identity); setEditingIdentity(true); }} className="flex items-center gap-1.5 text-right">
              <span className="max-w-[160px] truncate text-[14px] italic text-ink/70">{profile.identity}</span>
              <Pencil size={13} className="shrink-0 text-ink/35" />
            </button>
          )}
        </Row>
      </Section>

      {/* Habit Management */}
      <Section icon={ListChecks} title="Habit Management">
        {habits.length === 0 && (
          <p className="px-4 py-6 text-center text-[13px] text-ink/40">No habits yet. Create one from the Home tab.</p>
        )}
        {habits.map((h) => (
          <div key={h.id}>
            <Row label={h.title}>
              {editingHabitId === h.id ? (
                <button
                  disabled={busy}
                  onClick={() => removeHabit(h.id)}
                  className="flex items-center gap-1 text-red-500"
                >
                  <Trash2 size={15} />
                  <span className="text-[13px] font-medium">Delete</span>
                </button>
              ) : (
                <button onClick={() => setEditingHabitId(h.id)} className="text-ink/40">
                  <Pencil size={13} />
                </button>
              )}
            </Row>
            {editingHabitId === h.id && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="px-4 pb-3 text-[12px] text-ink/45"
              >
                become <span className="italic">{h.identity_target}</span> · {h.target_reps} reps · {h.frequency_days.join(', ')}
              </motion.p>
            )}
          </div>
        ))}
      </Section>

      {/* App Preferences */}
      <Section icon={SlidersHorizontal} title="App Preferences">
        <Row label="Dark mode" icon={Moon}>
          <Toggle
            value={profile.darkMode}
            onChange={(v) => updateProfile({ darkMode: v })}
          />
        </Row>
        <Row label="Haptic feedback" icon={Vibrate}>
          <Toggle
            value={profile.haptics}
            onChange={(v) => updateProfile({ haptics: v })}
          />
        </Row>
        <Row label="Sound effects" icon={Volume2}>
          <Toggle
            value={profile.sound}
            onChange={(v) => updateProfile({ sound: v })}
          />
        </Row>
      </Section>

      {/* Notifications & Reminders */}
      <Section icon={Bell} title="Notifications & Reminders">
        <Row label="Daily reminders" icon={Bell}>
          <Toggle
            value={profile.notifications}
            onChange={toggleNotifications}
          />
        </Row>
        {profile.notifications && notifPermission === 'granted' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="overflow-hidden"
          >
            <Row label="Reminder time" icon={Clock}>
              <input
                type="time"
                value={profile.reminderTime}
                onChange={(e) => updateProfile({ reminderTime: e.target.value || '08:00' })}
                className="glass-input rounded-lg px-2 py-1 text-[14px] text-ink outline-none"
              />
            </Row>
            <p className="px-4 pb-3 text-[12px] text-ink/45">
              A notification will appear at {profile.reminderTime} with your pending habits.
            </p>
          </motion.div>
        )}
        {profile.notifications && notifPermission === 'denied' && (
          <p className="px-4 pb-3 text-[12px] text-amber-600">
            Notifications are blocked. Enable them in your browser settings to receive reminders.
          </p>
        )}
        {notifPermission === 'unsupported' && (
          <p className="px-4 pb-3 text-[12px] text-ink/45">
            Notifications are not supported in this browser.
          </p>
        )}
      </Section>

      {/* Data Management */}
      <Section icon={Database} title="Data Management">
        {confirmClear ? (
          <div className="px-4 py-4">
            <p className="text-[13px] text-ink/60">This permanently removes all completion logs. Continue?</p>
            <div className="mt-3 flex gap-2">
              <button
                disabled={busy}
                onClick={clearLogs}
                className="flex-1 rounded-full bg-red-500 py-2.5 text-[13px] font-semibold text-white transition-transform active:scale-95 disabled:opacity-40"
              >
                Clear logs
              </button>
              <button
                onClick={() => setConfirmClear(false)}
                className="flex-1 rounded-full glass-card py-2.5 text-[13px] font-semibold text-ink/70 transition-transform active:scale-95"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <Row label="Clear habit logs">
            <button
              onClick={() => setConfirmClear(true)}
              className="text-[13px] font-medium text-red-500"
            >
              Clear
            </button>
          </Row>
        )}
        <Row label="Reset local data">
          <button
            onClick={resetLocal}
            className="text-[13px] font-medium text-red-500"
          >
            Reset
          </button>
        </Row>
      </Section>

      <p className="mt-8 text-center text-[11px] text-ink/30">Atoms · Habit Tracker</p>
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: typeof User; title: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6"
    >
      <div className="mb-2 flex items-center gap-2 px-1">
        <Icon size={14} className="text-ink/40" />
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-ink/40">{title}</h2>
      </div>
      <div className="glass-card overflow-hidden rounded-[24px]">
        {children}
      </div>
    </motion.div>
  );
}

function Row({ label, icon: Icon, children }: { label: string; icon?: typeof User; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-ink/[0.05] px-4 py-3.5 last:border-0">
      <span className="flex items-center gap-2 text-[14px] font-medium text-ink/80">
        {Icon && <Icon size={15} className="text-ink/35" />}
        {label}
      </span>
      {children}
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`relative h-[24px] w-[42px] rounded-full transition-colors ${value ? 'bg-ink' : 'bg-ink/15'}`}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 34 }}
        className={`absolute top-[2px] h-[20px] w-[20px] rounded-full bg-knob shadow-sm ${value ? 'right-[2px]' : 'left-[2px]'}`}
      />
    </button>
  );
}
