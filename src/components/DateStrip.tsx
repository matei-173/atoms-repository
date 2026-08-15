import { motion } from 'framer-motion';
import { addDays, dateStripLabel, dayCodeFor, isSameDay } from '@/lib/date';

interface Props {
  selected: Date;
  today: Date;
  onSelect: (date: Date) => void;
}

export default function DateStrip({ selected, today, onSelect }: Props) {
  const days: Date[] = [];
  for (let i = -1; i <= 13; i++) days.push(addDays(today, i));

  return (
    <div className="mt-4">
      <div className="no-scrollbar -mx-5 flex items-center gap-2 overflow-x-auto px-5 pb-1">
        {days.map((d) => {
          const isToday = isSameDay(d, today);
          const isSelected = isSameDay(d, selected);
          const label = dateStripLabel(d, today);
          const dayNum = d.getDate();
          return (
            <button
              key={d.toISOString()}
              onClick={() => onSelect(d)}
              className="relative flex shrink-0 flex-col items-center justify-center rounded-2xl px-3.5 py-2"
            >
              {isSelected && (
                <motion.span
                  layoutId="date-pill"
                  className="absolute inset-0 rounded-2xl bg-ink"
                  transition={{ type: 'spring', stiffness: 380, damping: 34 }}
                />
              )}
              <span
                className={`relative z-10 text-[11px] font-medium ${
                  isSelected ? 'text-white/70' : isToday ? 'text-ink' : 'text-ink/50'
                }`}
              >
                {label}
              </span>
              <span
                className={`relative z-10 text-[15px] font-semibold leading-tight ${
                  isSelected ? 'text-white' : 'text-ink/80'
                }`}
              >
                {String(dayNum).padStart(2, '0')}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between px-1">
        <span className="text-[12px] font-medium uppercase tracking-wider text-ink/40">
          {dayCodeFor(selected)} · {selected.toLocaleDateString('en-US', { month: 'short' })}
        </span>
      </div>
    </div>
  );
}
