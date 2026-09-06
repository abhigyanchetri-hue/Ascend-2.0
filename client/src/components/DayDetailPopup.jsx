// DayDetailPopup — the small hover card that follows the mouse on calendar
// days, listing what was (and wasn't) done on that day.
import { Check } from 'lucide-react';
import { prettyDate } from '../utils/dateHelpers';

export default function DayDetailPopup({ hover }) {
  if (!hover) return null;

  // Keep the popup inside the window.
  const left = Math.min(hover.x + 14, window.innerWidth - 250);
  const top = hover.y > window.innerHeight - 280 ? hover.y - 250 : hover.y + 14;

  const shown = (hover.tasks || []).slice(0, 6);
  const hidden = (hover.tasks || []).length - shown.length;

  return (
    <div
      className="pointer-events-none fixed z-50 w-60 rounded-lg border border-line bg-card p-3 shadow-card"
      style={{ left, top }}
    >
      <p className="text-xs font-semibold">{prettyDate(hover.date)}</p>
      <div className="my-2 border-t border-line" />

      {shown.length === 0 && <p className="text-xs text-muted">No tasks on this day.</p>}

      <ul className="space-y-1.5">
        {shown.map((task, index) => (
          <li key={index} className="flex items-center gap-1.5 text-xs">
            {task.completed ? (
              <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-forest">
                <Check size={9} strokeWidth={4} className="text-white" />
              </span>
            ) : (
              <span className="h-3.5 w-3.5 shrink-0 rounded-sm border border-field" />
            )}
            <span className={task.completed ? 'truncate text-ink' : 'truncate text-muted'}>
              {task.title}
            </span>
          </li>
        ))}
      </ul>

      {hidden > 0 && <p className="mt-1 text-[10px] text-muted">…and {hidden} more</p>}

      <div className="mt-2 border-t border-line pt-2 text-[11px] text-muted">
        {hover.completed}/{hover.total} tasks · +{hover.expEarned || 0} EXP
      </div>
    </div>
  );
}
