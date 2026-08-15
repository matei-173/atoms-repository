import { Home, BarChart3, Timer, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

export type Tab = 'home' | 'progress' | 'focus' | 'settings';

interface Props {
  active: Tab;
  onChange: (tab: Tab) => void;
}

const ITEMS: { id: Tab; label: string; Icon: typeof Home }[] = [
  { id: 'home', label: 'Home', Icon: Home },
  { id: 'progress', label: 'Progress', Icon: BarChart3 },
  { id: 'focus', label: 'Focus', Icon: Timer },
  { id: 'settings', label: 'Settings', Icon: Settings },
];

export default function BottomNav({ active, onChange }: Props) {
  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 w-[94%] max-w-[380px]">
      <nav className="pointer-events-auto flex items-center justify-between gap-1 rounded-full border border-white/50 bg-white/80 p-1.5 shadow-lg backdrop-blur-2xl dark:border-white/10 dark:bg-black/70">
        {ITEMS.map(({ id, label, Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className={`flex items-center gap-1.5 shrink-0 px-3 py-2 text-xs font-medium rounded-full transition-colors ${
                isActive
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-black'
                  : 'text-neutral-600 dark:text-neutral-400 hover:opacity-100'
              }`}
              aria-label={label}
            >
              <Icon size={16} strokeWidth={2.2} />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
