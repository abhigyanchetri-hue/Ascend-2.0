// CalendarPage — monthly calendar + LeetCode-style heatmap, with hover
// popups and a click-to-open day detail panel.
import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../utils/api';
import {
  MONTH_NAMES,
  todayISO,
  shiftDate,
  monthRange,
  getMonthMatrix,
  prettyDateWithWeekday,
} from '../utils/dateHelpers';
import { HEAT_COLORS, heatLevel } from '../utils/constants';
import HeatmapCalendar, { HeatmapLegend } from '../components/HeatmapCalendar.jsx';
import DayDetailPopup from '../components/DayDetailPopup.jsx';

const WEEK_HEADER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function CalendarPage() {
  const now = new Date();
  const [view, setView] = useState('month'); // 'month' | 'heatmap'
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-based
  const [monthTasks, setMonthTasks] = useState({}); // date → tasks (month view)
  const [heatDays, setHeatDays] = useState({}); // date → summary (heatmap view)
  const [hover, setHover] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [dayDetail, setDayDetail] = useState(null); // full detail for the selected day
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Month view data: every task in the visible month.
  useEffect(() => {
    setLoading(true);
    const { first, last } = monthRange(year, month);
    api
      .get(`/tasks?from=${first}&to=${last}`)
      .then((data) => {
        const map = {};
        data.tasks.forEach((task) => {
          (map[task.date] = map[task.date] || []).push(task);
        });
        setMonthTasks(map);
        setError('');
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [year, month]);

  // Heatmap data: 365 days of summaries (loaded once, on first use).
  useEffect(() => {
    if (view !== 'heatmap') return undefined;
    api
      .get('/stats/heatmap')
      .then((data) => {
        const map = {};
        data.days.forEach((day) => {
          map[day.date] = day;
        });
        setHeatDays(map);
      })
      .catch((err) => setError(err.message));
    return undefined;
  }, [view]);

  // Hide the hover popup when the user scrolls.
  useEffect(() => {
    const clear = () => setHover(null);
    window.addEventListener('scroll', clear, true);
    return () => window.removeEventListener('scroll', clear, true);
  }, []);

  // Load full detail whenever a day is clicked.
  useEffect(() => {
    if (!selectedDate) return undefined;
    api
      .get(`/stats/day/${selectedDate}`)
      .then(setDayDetail)
      .catch(() => setDayDetail(null));
    return undefined;
  }, [selectedDate]);

  const previousMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  // Build hover info for a month-view cell from local data (instant).
  const monthHoverInfo = (dateIso, event) => {
    const tasks = monthTasks[dateIso] || [];
    const completed = tasks.filter((t) => t.completed);
    return {
      x: event.clientX,
      y: event.clientY,
      date: dateIso,
      total: tasks.length,
      completed: completed.length,
      expEarned: completed.reduce((sum, t) => sum + t.expReward, 0),
      tasks: tasks.map((t) => ({ title: t.title, completed: t.completed })),
    };
  };

  const weeks = getMonthMatrix(year, month);
  const today = todayISO();

  return (
    <div>
      {/* Header: title + view toggle */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold">Calendar</h1>
        <div className="flex rounded-md border border-line bg-card p-0.5 text-sm">
          {['month', 'heatmap'].map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setView(option)}
              className={`rounded px-3 py-1.5 font-medium capitalize transition-colors duration-150 ${
                view === option ? 'bg-forest text-white' : 'text-muted hover:text-ink'
              }`}
            >
              {option === 'month' ? 'Calendar View' : 'Heatmap View'}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="mb-4 text-sm text-danger">{error}</p>}

      <div className="rounded-lg border border-line bg-card p-5 shadow-card">
        {view === 'month' ? (
          <>
            {/* Month navigation */}
            <div className="mb-4 flex items-center justify-between">
              <button
                type="button"
                onClick={previousMonth}
                aria-label="Previous month"
                className="rounded p-1.5 text-muted transition-colors duration-150 hover:bg-hoverbg hover:text-ink"
              >
                <ChevronLeft size={18} />
              </button>
              <p className="text-sm font-semibold">
                {MONTH_NAMES[month]} {year}
              </p>
              <button
                type="button"
                onClick={nextMonth}
                aria-label="Next month"
                className="rounded p-1.5 text-muted transition-colors duration-150 hover:bg-hoverbg hover:text-ink"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Weekday header */}
            <div className="mb-1 grid grid-cols-7 gap-0.5 text-center text-[11px] font-semibold uppercase tracking-wide text-muted sm:gap-1">
              {WEEK_HEADER.map((day) => (
                <div key={day}>{day}</div>
              ))}
            </div>

            {loading ? (
              <p className="py-10 text-center text-sm text-muted">Loading…</p>
            ) : (
              <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
                {weeks.flat().map((dateIso, index) => {
                  if (!dateIso) return <div key={index} />;
                  const tasks = monthTasks[dateIso] || [];
                  const completed = tasks.filter((t) => t.completed).length;
                  const isToday = dateIso === today;
                  const isSelected = dateIso === selectedDate;

                  return (
                    <button
                      key={dateIso}
                      type="button"
                      onMouseEnter={(event) => setHover(monthHoverInfo(dateIso, event))}
                      onMouseLeave={() => setHover(null)}
                      onClick={() => {
                        setHover(null); // touch screens fire hover on tap — clear it
                        setSelectedDate(dateIso);
                      }}
                      className={`relative h-14 rounded-md p-1 text-left transition-colors duration-150 hover:bg-hoverbg sm:h-16 sm:p-1.5 ${
                        isSelected ? 'ring-2 ring-forest/40' : isToday ? 'ring-1 ring-forest' : ''
                      }`}
                    >
                      <span className={`text-xs ${isToday ? 'font-bold text-forest' : 'text-ink'}`}>
                        {Number(dateIso.slice(8, 10))}
                      </span>
                      {completed >= 5 && (
                        <span className="absolute right-1 top-1 text-[10px]">🔥</span>
                      )}
                      {tasks.length > 0 && (
                        <span
                          className="absolute bottom-1.5 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full"
                          style={{ backgroundColor: HEAT_COLORS[heatLevel(completed)] }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <>
            <p className="mb-4 text-sm text-muted">The last 365 days of showing up.</p>
            <HeatmapCalendar
              dayMap={heatDays}
              onHover={(info) => setHover(info)}
              onSelect={(dateIso) => {
                setHover(null); // touch screens fire hover on tap — clear it
                setSelectedDate(dateIso);
              }}
            />
          </>
        )}

        <div className="mt-4 border-t border-line pt-4">
          <HeatmapLegend />
        </div>
      </div>

      {/* Day detail panel (opens when a day is clicked) */}
      {selectedDate && dayDetail && (
        <div className="mt-4 rounded-lg border border-line bg-card p-5 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">{prettyDateWithWeekday(dayDetail.date)}</h2>
            <button
              type="button"
              onClick={() => {
                setSelectedDate(null);
                setDayDetail(null);
              }}
              className="text-xs text-muted hover:text-ink"
            >
              Close
            </button>
          </div>
          <div className="my-3 border-t border-line" />
          {dayDetail.tasks.length === 0 ? (
            <p className="text-sm text-muted">No tasks on this day.</p>
          ) : (
            <>
              <ul className="space-y-2">
                {[...dayDetail.tasks]
                  .sort((a, b) => Number(b.completed) - Number(a.completed))
                  .map((task) => (
                    <li key={task._id} className="flex items-center gap-2 text-sm">
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                          task.completed ? 'bg-forest' : 'border border-field'
                        }`}
                      >
                        {task.completed && (
                          <span className="text-[9px] font-bold text-white">✓</span>
                        )}
                      </span>
                      <span className={task.completed ? 'text-ink' : 'text-muted'}>
                        {task.title}
                      </span>
                      <span className="ml-auto text-xs text-muted">
                        {task.category} · +{task.expReward}
                      </span>
                    </li>
                  ))}
              </ul>
              <p className="mt-3 border-t border-line pt-3 text-xs text-muted">
                {dayDetail.completed}/{dayDetail.total} tasks · +{dayDetail.expEarned} EXP earned
              </p>
            </>
          )}
        </div>
      )}

      {/* Hover popup (shared by both views) */}
      <DayDetailPopup hover={hover} />
    </div>
  );
}
