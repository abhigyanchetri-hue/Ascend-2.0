// HeatmapCalendar — the LeetCode-style contribution grid (last 365 days).
// 53 week-columns × 7 day-rows, Monday-first, with month labels on top,
// weekday labels on the left, and 🔥 on days with 5+ completed tasks.
import { useMemo } from 'react';
import { todayISO, shiftDate, weekdayOf, monthIndexOf } from '../utils/dateHelpers';
import { MONTH_NAMES } from '../utils/dateHelpers';
import { HEAT_COLORS, heatLevel } from '../utils/constants';

const GUTTER_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', ''];

export default function HeatmapCalendar({ dayMap, onHover, onSelect }) {
  // Build the columns once — today never changes while the page is open.
  const columns = useMemo(() => {
    const todayIso = todayISO();
    // Start 364 days back, then walk to the Monday of that week.
    let cursor = shiftDate(todayIso, -364);
    cursor = shiftDate(cursor, -((weekdayOf(cursor) + 6) % 7));

    const cols = [];
    let previousMonth = -1;
    let guard = 0; // hard stop so a bad clock can never loop forever

    while (cursor <= todayIso && guard < 60) {
      const startMonth = monthIndexOf(cursor);
      const days = [];
      for (let row = 0; row < 7; row += 1) {
        days.push(cursor <= todayIso ? cursor : null);
        cursor = shiftDate(cursor, 1);
      }
      const monthLabel = startMonth !== previousMonth ? MONTH_NAMES[startMonth].slice(0, 3) : '';
      previousMonth = startMonth;
      cols.push({ days, monthLabel });
      guard += 1;
    }
    return cols;
  }, []);

  const summaryOf = (dateIso) =>
    dayMap[dateIso] || { total: 0, completed: 0, expEarned: 0, tasks: [] };

  return (
    <div className="overflow-x-auto pb-2">
      <div className="inline-block">
        {/* Month labels row (aligned with the columns below) */}
        <div className="flex gap-[3px]">
          <div className="w-8 shrink-0" />
          {columns.map((col, index) => (
            <div key={`label-${index}`} className="relative h-4 w-3">
              {col.monthLabel && (
                <span className="absolute left-0 whitespace-nowrap text-[10px] text-muted">
                  {col.monthLabel}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Grid: day-label gutter + week columns */}
        <div className="flex gap-[3px]">
          <div className="flex w-8 shrink-0 flex-col gap-[3px]">
            {GUTTER_LABELS.map((label, index) => (
              <div key={index} className="flex h-3 items-center text-[10px] text-muted">
                {label}
              </div>
            ))}
          </div>

          {columns.map((col, colIndex) => (
            <div key={colIndex} className="flex flex-col gap-[3px]">
              {col.days.map((dateIso, rowIndex) => {
                if (!dateIso) return <div key={rowIndex} className="h-3 w-3" />;
                const summary = summaryOf(dateIso);
                return (
                  <div
                    key={dateIso}
                    className="relative h-3 w-3 cursor-pointer rounded-[2px]"
                    style={{ backgroundColor: HEAT_COLORS[heatLevel(summary.completed)] }}
                    onMouseEnter={(event) =>
                      onHover({ x: event.clientX, y: event.clientY, date: dateIso, ...summary })
                    }
                    onMouseLeave={() => onHover(null)}
                    onClick={() => onSelect && onSelect(dateIso)}
                  >
                    {summary.completed >= 5 && (
                      <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[8px] leading-none">
                        🔥
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Shared legend under the heatmap and the monthly calendar.
export function HeatmapLegend() {
  const items = [
    { color: HEAT_COLORS.empty, label: 'No tasks' },
    { color: HEAT_COLORS.l1, label: '1–2 done' },
    { color: HEAT_COLORS.l2, label: '3–4 done' },
    { color: HEAT_COLORS.l3, label: '5+ done' },
  ];
  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-[2px]" style={{ backgroundColor: item.color }} />
          {item.label}
        </span>
      ))}
      <span>🔥 = 5+ completed</span>
    </div>
  );
}
